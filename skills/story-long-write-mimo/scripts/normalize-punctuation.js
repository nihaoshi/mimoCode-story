#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node normalize-punctuation.js [--check] [--quote-mode keep|ascii|yan] <file...>

Normalize正文 punctuation deterministically:
  - replace em dashes / double hyphens with Chinese punctuation
  - remove markdown divider lines (---) from正文
  - keep quote style by default; convert quotes only when explicitly requested
  - 清理AI特殊标点和不可见Unicode字符
`;

const options = {
  check: false,
  quoteMode: 'keep',
  files: [],
};

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === '--check') {
    options.check = true;
  } else if (arg === '--quote-mode') {
    const value = process.argv[i + 1];
    if (!value) die('--quote-mode requires keep, ascii, or yan');
    options.quoteMode = value;
    i += 1;
  } else if (arg.startsWith('--quote-mode=')) {
    options.quoteMode = arg.slice('--quote-mode='.length);
  } else if (arg === '-h' || arg === '--help') {
    process.stdout.write(USAGE);
    process.exit(0);
  } else if (arg.startsWith('-')) {
    die(`Unknown option: ${arg}`);
  } else {
    options.files.push(arg);
  }
}

if (!['keep', 'ascii', 'yan'].includes(options.quoteMode)) {
  die(`Invalid --quote-mode: ${options.quoteMode}`);
}
if (options.files.length === 0) {
  die('No files provided');
}

let totalFindings = 0;
let changedFiles = 0;
let failed = false;

for (const file of options.files) {
  const fullPath = path.resolve(file);
  let input;
  try {
    input = fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    failed = true;
    console.error(`${file}: unable to read (${error.message})`);
    continue;
  }

  const result = normalizeDocument(input, options.quoteMode);
  totalFindings += result.findings.length;

  if (options.check) {
    for (const finding of result.findings) {
      console.log(`${file}:${finding.line}:${finding.column}: ${finding.type}: ${finding.message}`);
    }
    continue;
  }

  if (result.output !== input) {
    fs.writeFileSync(fullPath, result.output, 'utf8');
    changedFiles += 1;
    console.log(`${file}: normalized (${result.findings.length} issue${result.findings.length === 1 ? '' : 's'})`);
  }
}

if (failed) {
  process.exit(2);
}
if (options.check && totalFindings > 0) {
  process.exit(1);
}
if (!options.check) {
  console.log(`Done. Changed files: ${changedFiles}`);
}

function die(message) {
  console.error(message);
  console.error(USAGE.trimEnd());
  process.exit(2);
}

// AI特殊标点检测正则
const AI_PUNCTUATION = /[\u2014\u2013\u201C\u201D\u2018\u2019\u2026\u00A0\u202F]/g;
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\u2009\uFEFF\u00AD]/g;

// AI偏爱的印刷级标点映射
const AI_PUNCT_MAP = {
  '\u2014': '——',  // em dash → 全角破折号
  '\u2013': '--',   // en dash → 双连字符
  '\u201C': '"',    // 左弯双引号 → 直引号
  '\u201D': '"',    // 右弯双引号 → 直引号
  '\u2018': "'",    // 左弯单引号 → 直引号
  '\u2019': "'",    // 右弯单引号 → 直引号
  '\u2026': '……',   // 水平省略号 → 全角省略号
  '\u00A0': ' ',    // 不换行空格 → 普通空格
  '\u202F': ' ',    // 窄不换行空格 → 普通空格
};

function normalizeDocument(input, quoteMode) {
  const newline = input.includes('\r\n') ? '\r\n' : '\n';
  const trailingNewline = input.endsWith('\n');
  const lines = input.split(/\r?\n/);
  if (trailingNewline) lines.pop();

  const findings = [];
  const outputLines = [];
  let inFence = false;
  let inFrontMatter = hasYamlFrontMatter(lines);
  let quoteOpen = false;

  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    let line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      outputLines.push(line);
      continue;
    }

    if (inFrontMatter) {
      outputLines.push(line);
      if (index > 0 && trimmed === '---') inFrontMatter = false;
      continue;
    }

    if (inFence) {
      outputLines.push(line);
      continue;
    }

    if (trimmed === '---') {
      findings.push({
        line: lineNo,
        column: line.indexOf('-') + 1,
        type: 'markdown-divider',
        message: '正文中不要使用 markdown 分隔线；建议移除该行。',
      });
      continue;
    }

    // 清理不可见字符
    const invisibleResult = cleanInvisibleChars(line, lineNo);
    findings.push(...invisibleResult.findings);
    line = invisibleResult.line;

    // 清理AI特殊标点
    const aiPunctResult = cleanAIPunctuation(line, lineNo);
    findings.push(...aiPunctResult.findings);
    line = aiPunctResult.line;

    const dashResult = normalizeDashes(line, lineNo);
    findings.push(...dashResult.findings);
    line = dashResult.line;

    const quoteResult = normalizeQuotes(line, quoteMode, quoteOpen, lineNo);
    findings.push(...quoteResult.findings);
    line = quoteResult.line;
    quoteOpen = quoteResult.quoteOpen;

    outputLines.push(line);
  }

  return {
    output: outputLines.join(newline) + (trailingNewline ? newline : ''),
    findings,
  };
}

function cleanInvisibleChars(line, lineNo) {
  const findings = [];
  let output = line;
  
  const matches = line.match(INVISIBLE_CHARS);
  if (matches && matches.length > 0) {
    findings.push({
      line: lineNo,
      column: 1,
      type: 'invisible-char',
      message: `清理不可见字符${matches.length}处`,
    });
    output = output.replace(INVISIBLE_CHARS, '');
  }
  
  return { line: output, findings };
}

function cleanAIPunctuation(line, lineNo) {
  const findings = [];
  let output = line;
  
  const matches = line.match(AI_PUNCTUATION);
  if (matches && matches.length > 0) {
    const counts = {};
    for (const ch of matches) {
      const name = getCharName(ch);
      counts[name] = (counts[name] || 0) + 1;
    }
    findings.push({
      line: lineNo,
      column: 1,
      type: 'ai-punctuation',
      message: `替换AI特殊标点：${Object.entries(counts).map(([k, v]) => `${k}(${v})`).join('、')}`,
    });
    for (const [aiChar, replacement] of Object.entries(AI_PUNCT_MAP)) {
      output = output.split(aiChar).join(replacement);
    }
  }
  
  return { line: output, findings };
}

function getCharName(ch) {
  const names = {
    '\u2014': 'em dash',
    '\u2013': 'en dash',
    '\u201C': '左弯双引号',
    '\u201D': '右弯双引号',
    '\u2018': '左弯单引号',
    '\u2019': '右弯单引号',
    '\u2026': '水平省略号',
    '\u00A0': '不换行空格',
    '\u202F': '窄不换行空格',
  };
  return names[ch] || '未知字符';
}

function hasYamlFrontMatter(lines) {
  if (!lines[0] || lines[0].trim() !== '---') return false;
  let sawYamlField = false;
  for (let i = 1; i < Math.min(lines.length, 40); i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed === '---') return sawYamlField;
    if (/^[A-Za-z0-9_-]+:\s*/.test(trimmed)) sawYamlField = true;
  }
  return false;
}

function normalizeDashes(line, lineNo) {
  const findings = [];
  const original = line;
  const pattern = /——|—|--+/g;
  let output = '';
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(original)) !== null) {
    output += original.slice(lastIndex, match.index);
    const replacement = chooseDashReplacement(original, match.index, match[0].length);
    output += replacement;
    findings.push({
      line: lineNo,
      column: match.index + 1,
      type: match[0].startsWith('-') ? 'double-hyphen' : 'em-dash',
      message: replacement ? `替换为「${replacement}」。` : '移除重复标点。',
    });
    lastIndex = match.index + match[0].length;
  }

  output += original.slice(lastIndex);
  return { line: output, findings };
}

function chooseDashReplacement(text, start, length) {
  const before = previousNonSpace(text, start - 1);
  const after = nextNonSpace(text, start + length);
  const rest = text.slice(start + length).trimStart();
  const original = text.slice(start, start + length);

  // 保留合法破折号：行首破折号直接删除；数字区间（如 100——200）原样保留；
  // 对话被打断（破折号紧接收尾引号，如「你说什么——」）原样保留，避免误改成句号。
  if (before === '') return '';
  if (/\d/.test(before) && /\d/.test(after)) return original;
  if (isClosingQuote(after)) return original;

  if (!after) return isSentencePunctuation(before) ? '' : '。';
  if (isSentencePunctuation(before) || isPunctuation(after)) return '';
  if (/^(因为|原来|这是|那是|也就是|换句话|说白了|所谓|答案|原因|结果|真相|问题在于)/.test(rest)) return '：';
  if (/(原因|答案|真相|结果|结论|问题|选择|意思)$/.test(text.slice(0, start).trim())) return '：';
  return '，';
}

function previousNonSpace(text, index) {
  for (let i = index; i >= 0; i -= 1) {
    if (!/\s/.test(text[i])) return text[i];
  }
  return '';
}

function nextNonSpace(text, index) {
  for (let i = index; i < text.length; i += 1) {
    if (!/\s/.test(text[i])) return text[i];
  }
  return '';
}

function isSentencePunctuation(ch) {
  return /[，,。.!！?？;；:：…]$/.test(ch || '');
}

function isPunctuation(ch) {
  return /[，,。.!！?？;；:：、…"“”'‘'」』）)]/.test(ch || '');
}

function isClosingQuote(ch) {
  return /[""」』]/.test(ch || '');
}

function normalizeQuotes(line, quoteMode, quoteOpen, lineNo) {
  if (quoteMode === 'keep') {
    return { line, findings: [], quoteOpen };
  }

  const findings = [];
  let output = '';

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoteMode === 'ascii' && /[「」『』"""]/.test(ch)) {
      output += '"';
      findings.push({ line: lineNo, column: i + 1, type: 'quote-style', message: '按显式 quote-mode 转为半角双引号。' });
      continue;
    }
    if (quoteMode === 'yan' && (ch === '"' || ch === '"' || ch === '"')) {
      const replacement = quoteOpen || ch === '"' ? '」' : '「';
      output += replacement;
      quoteOpen = replacement === '「';
      findings.push({ line: lineNo, column: i + 1, type: 'quote-style', message: '按显式 quote-mode 转为盐言引号。' });
      continue;
    }
    output += ch;
  }

  return { line: output, findings, quoteOpen };
}
