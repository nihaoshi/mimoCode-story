#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node punctuation-normalize.js <file> [options]

规范化AI生成内容的标点符号，清理AI特殊标点和不可见字符。

Options:
  --check             仅检查，不修改
  --fix               修复标点问题（默认）
  --json              输出 JSON 格式

示例：
  node punctuation-normalize.js 正文/第001章.md --check
  node punctuation-normalize.js 正文/第001章.md --fix`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
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

function checkPunctuationIssues(text) {
  const issues = [];
  
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

function fixPunctuationIssues(text) {
  let fixed = text;
  
  // 清理不可见字符
  fixed = fixed.replace(INVISIBLE_CHARS, '');
  
  // 替换AI特殊标点
  for (const [aiChar, replacement] of Object.entries(AI_PUNCT_MAP)) {
    fixed = fixed.split(aiChar).join(replacement);
  }
  
  // 修复连续破折号（保留对话中的）
  fixed = fixed.replace(/([^」""]){3,}——/g, '$1——');
  
  // 修复逗号堆积
  fixed = fixed.replace(/，，/g, '，');
  
  // 修复句号堆积
  fixed = fixed.replace(/。。/g, '。');
  
  // 修复连续标点
  fixed = fixed.replace(/，。/g, '。');
  fixed = fixed.replace(/。，/g, '。');
  
  // 清理多余空格
  fixed = fixed.replace(/  +/g, ' ');
  
  return fixed;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const checkOnly = args.includes('--check');
  const fixMode = !checkOnly;
  
  const filteredArgs = args.filter(a => 
    a !== '--json' && a !== '--check' && a !== '--fix'
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
  
  const issues = checkPunctuationIssues(content);
  
  if (fixMode && issues.length > 0) {
    const fixed = fixPunctuationIssues(content);
    fs.writeFileSync(filePath, fixed, 'utf-8');
  }
  
  if (jsonMode) {
    const result = {
      file: filePath,
      issues_count: issues.length,
      issues,
      fixed: fixMode && issues.length > 0,
    };
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (issues.length === 0) {
      console.log('✅ 标点符号检查通过');
    } else {
      console.log(`\n⚠️  发现 ${issues.length} 个标点问题：\n`);
      for (const issue of issues) {
        console.log(`  - ${issue.suggestion}`);
      }
      
      if (fixMode) {
        console.log('\n✅ 已自动修复');
      } else {
        console.log('\n💡 运行 --fix 参数自动修复');
      }
    }
  }
  
  process.exit(issues.length > 0 ? 1 : 0);
}

main();
