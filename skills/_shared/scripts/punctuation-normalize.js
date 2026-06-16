#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node punctuation-normalize.js <file> [options]

规范化AI生成内容的标点符号，清理AI特殊标点和不可见字符。
支持上下文感知的破折号替换和引号风格切换。

Options:
  --check             仅检查，不修改
  --fix               修复标点问题（默认）
  --json              输出 JSON 格式
  --quote-mode MODE   引号模式：keep（默认）| ascii（半角）| yan（盐言「」）

示例：
  node punctuation-normalize.js 正文/第001章.md --check
  node punctuation-normalize.js 正文/第001章.md --fix
  node punctuation-normalize.js 正文/第001章.md --fix --quote-mode yan`;

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

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
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

function checkPunctuationIssues(text) {
  const issues = [];

  // 检测 markdown 分隔线 ---
  const lines = text.split('\n');
  let dividerCount = 0;
  let inFrontMatter = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (i === 0 && trimmed === '---') {
      inFrontMatter = true;
      continue;
    }
    if (inFrontMatter) {
      if (trimmed === '---') inFrontMatter = false;
      continue;
    }
    if (trimmed === '---') dividerCount++;
  }
  if (dividerCount > 0) {
    issues.push({
      type: 'markdown_divider',
      count: dividerCount,
      suggestion: `检测到${dividerCount}处 markdown 分隔线(---)，正文中禁止使用，建议移除`,
    });
  }

  // 检测AI特殊标点
  const aiPunctMatches = text.match(AI_PUNCTUATION);
  if (aiPunctMatches && aiPunctMatches.length > 0) {
    const counts = {};
    for (const ch of aiPunctMatches) {
      const name = getCharName(ch);
      counts[name] = (counts[name] || 0) + 1;
    }
    issues.push({
      type: 'ai_punctuation',
      count: aiPunctMatches.length,
      details: counts,
      suggestion: `检测到AI特殊标点${aiPunctMatches.length}处：${Object.entries(counts).map(([k, v]) => `${k}(${v}次)`).join('、')}`,
    });
  }

  // 检测不可见字符
  const invisibleMatches = text.match(INVISIBLE_CHARS);
  if (invisibleMatches && invisibleMatches.length > 0) {
    issues.push({
      type: 'invisible_chars',
      count: invisibleMatches.length,
      suggestion: `检测到不可见Unicode字符${invisibleMatches.length}处，建议清除`,
    });
  }

  // 检查连续破折号
  const dashMatches = text.match(/——/g);
  if (dashMatches && dashMatches.length > 3) {
    const density = dashMatches.length / (text.length / 100);
    if (density > 2) {
      issues.push({
        type: 'excessive_dash',
        count: dashMatches.length,
        density: density.toFixed(1),
        suggestion: `破折号使用过多(${dashMatches.length}次，密度${density.toFixed(1)}/百字)，建议替换部分`,
      });
    }
  }

  // 检查省略号
  const ellipsisMatches = text.match(/……/g);
  if (ellipsisMatches && ellipsisMatches.length > 5) {
    const density = ellipsisMatches.length / (text.length / 100);
    if (density > 3) {
      issues.push({
        type: 'excessive_ellipsis',
        count: ellipsisMatches.length,
        density: density.toFixed(1),
        suggestion: `省略号使用过多(${ellipsisMatches.length}次，密度${density.toFixed(1)}/百字)`,
      });
    }
  }

  // 检查逗号密度
  const commaMatches = text.match(/，/g);
  if (commaMatches) {
    const density = commaMatches.length / (text.length / 100);
    if (density > 15) {
      issues.push({
        type: 'high_comma_density',
        count: commaMatches.length,
        density: density.toFixed(1),
        suggestion: `逗号密度过高(${density.toFixed(1)}/百字)，建议适当使用句号`,
      });
    }
  }

  // 检查句式重复
  const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 10);
  const starts = {};
  for (const sent of sentences) {
    const start = sent.trim().substring(0, 4);
    if (start) starts[start] = (starts[start] || 0) + 1;
  }

  for (const [start, count] of Object.entries(starts)) {
    if (count >= 5) {
      issues.push({
        type: 'repeated_sentence_pattern',
        pattern: start + '...',
        count,
        suggestion: `句式"${start}"重复${count}次，建议变换`,
      });
    }
  }

  // 检查中英文标点混用
  if (text.match(/[\u4e00-\u9fa5][,.][\u4e00-\u9fa5]/)) {
    issues.push({
      type: 'mixed_punctuation',
      suggestion: '检测到中英文标点混用',
    });
  }

  // 检查连续标点
  if (text.match(/[，。！？]{3,}/)) {
    issues.push({
      type: 'consecutive_punctuation',
      suggestion: '检测到连续标点符号',
    });
  }

  return issues;
}

// --- Enhanced normalization (from normalize-punctuation.js) ---

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
  return /[，,。.!！?？;；:、…"""'''「」『』）)]/.test(ch || '');
}

function isClosingQuote(ch) {
  return /[""」』]/.test(ch || '');
}

function chooseDashReplacement(text, start, length) {
  const before = previousNonSpace(text, start - 1);
  const after = nextNonSpace(text, start + length);
  const rest = text.slice(start + length).trimStart();

  if (before === '') return '';
  if (/\d/.test(before) && /\d/.test(after)) return text.slice(start, start + length);
  if (isClosingQuote(after)) return text.slice(start, start + length);

  if (!after) return isSentencePunctuation(before) ? '' : '。';
  if (isSentencePunctuation(before) || isPunctuation(after)) return '';
  if (/^(因为|原来|这是|那是|也就是|换句话|说白了|所谓|答案|原因|结果|真相|问题在于)/.test(rest)) return '：';
  if (/(原因|答案|真相|结果|结论|问题|选择|意思)$/.test(text.slice(0, start).trim())) return '：';
  return '，';
}

function normalizeDashes(line, lineNo) {
  const findings = [];
  const pattern = /——|—|--+/g;
  let output = '';
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(line)) !== null) {
    output += line.slice(lastIndex, match.index);
    const replacement = chooseDashReplacement(line, match.index, match[0].length);
    output += replacement;
    findings.push({
      line: lineNo,
      column: match.index + 1,
      type: match[0].startsWith('-') ? 'double-hyphen' : 'em-dash',
      message: replacement ? `替换为「${replacement}」` : '移除重复标点',
    });
    lastIndex = match.index + match[0].length;
  }

  output += line.slice(lastIndex);
  return { line: output, findings };
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
      findings.push({ line: lineNo, column: i + 1, type: 'quote-style', message: '按显式 quote-mode 转为半角双引号' });
      continue;
    }
    if (quoteMode === 'yan' && (ch === '"' || ch === '"' || ch === '"')) {
      const replacement = quoteOpen || ch === '"' ? '」' : '「';
      output += replacement;
      quoteOpen = replacement === '「';
      findings.push({ line: lineNo, column: i + 1, type: 'quote-style', message: '按显式 quote-mode 转为盐言引号' });
      continue;
    }
    output += ch;
  }

  return { line: output, findings, quoteOpen };
}

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
        message: '正文中不要使用 markdown 分隔线；已移除',
      });
      continue;
    }

    // 清理不可见字符
    const invisibleMatches = line.match(INVISIBLE_CHARS);
    if (invisibleMatches && invisibleMatches.length > 0) {
      findings.push({
        line: lineNo, column: 1, type: 'invisible-char',
        message: `清理不可见字符${invisibleMatches.length}处`,
      });
      line = line.replace(INVISIBLE_CHARS, '');
    }

    // 清理AI特殊标点
    const aiMatches = line.match(AI_PUNCTUATION);
    if (aiMatches && aiMatches.length > 0) {
      const counts = {};
      for (const ch of aiMatches) {
        const name = getCharName(ch);
        counts[name] = (counts[name] || 0) + 1;
      }
      findings.push({
        line: lineNo, column: 1, type: 'ai-punctuation',
        message: `替换AI特殊标点：${Object.entries(counts).map(([k, v]) => `${k}(${v})`).join('、')}`,
      });
      for (const [aiChar, replacement] of Object.entries(AI_PUNCT_MAP)) {
        line = line.split(aiChar).join(replacement);
      }
    }

    // 上下文感知的破折号替换
    const dashResult = normalizeDashes(line, lineNo);
    findings.push(...dashResult.findings);
    line = dashResult.line;

    // 引号风格切换
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

function main() {
  const startTime = Date.now();
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const checkOnly = args.includes('--check');

  let quoteMode = 'keep';
  const quoteModeIdx = args.indexOf('--quote-mode');
  if (quoteModeIdx !== -1) {
    const value = args[quoteModeIdx + 1];
    if (!value || !['keep', 'ascii', 'yan'].includes(value)) {
      console.error('Error: --quote-mode 需要 keep, ascii 或 yan');
      process.exit(2);
    }
    quoteMode = value;
  }
  const quoteModeEqIdx = args.findIndex(a => a.startsWith('--quote-mode='));
  if (quoteModeEqIdx !== -1) {
    quoteMode = args[quoteModeEqIdx].slice('--quote-mode='.length);
    if (!['keep', 'ascii', 'yan'].includes(quoteMode)) {
      console.error('Error: --quote-mode 需要 keep, ascii 或 yan');
      process.exit(2);
    }
  }

  const filteredArgs = args.filter(a =>
    a !== '--json' && a !== '--check' && a !== '--fix' &&
    a !== '--quote-mode' && a !== `--quote-mode=${quoteMode}` &&
    (args.indexOf(a) !== quoteModeIdx + 1 || quoteModeIdx === -1)
  );

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const filePath = path.resolve(filteredArgs[0]);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: 文件不存在: ${filePath}`);
    process.exit(2);
  }

  const content = readFile(filePath);
  if (!content) {
    console.error(`Error: 无法读取文件: ${filePath}`);
    process.exit(2);
  }

  if (checkOnly) {
    const issues = checkPunctuationIssues(content);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (jsonMode) {
      console.log(JSON.stringify({ file: filePath, issues_count: issues.length, issues, fixed: false }, null, 2));
    } else {
      if (issues.length === 0) {
        console.log('✅ 标点符号检查通过');
      } else {
        console.log(`\n⚠️  发现 ${issues.length} 个标点问题：\n`);
        for (const issue of issues) {
          console.log(`  - ${issue.suggestion}`);
        }
        console.log(`\n💡 运行 --fix 参数自动修复 (${elapsed}s)`);
      }
    }
    process.exit(issues.length > 0 ? 1 : 0);
  }

  // Fix mode: use enhanced normalization
  const result = normalizeDocument(content, quoteMode);
  const changed = result.output !== content;

  if (changed) {
    fs.writeFileSync(filePath, result.output, 'utf-8');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  if (jsonMode) {
    console.log(JSON.stringify({
      file: filePath,
      issues_count: result.findings.length,
      findings: result.findings,
      fixed: changed,
    }, null, 2));
  } else {
    if (result.findings.length === 0) {
      console.log('✅ 标点符号检查通过');
    } else {
      console.log(`\n⚠️  发现 ${result.findings.length} 个标点问题：\n`);
      for (const f of result.findings) {
        console.log(`  - [行${f.line}] ${f.message}`);
      }
      if (changed) {
        console.log(`\n✅ 已自动修复 (${elapsed}s)`);
      } else {
        console.log(`\n✅ 无需修改 (${elapsed}s)`);
      }
    }
  }

  process.exit(result.findings.length > 0 ? 1 : 0);
}

main();
