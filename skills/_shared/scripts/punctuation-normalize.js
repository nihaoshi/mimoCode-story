#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node punctuation-normalize.js <file> [options]

规范化AI生成内容的标点符号。

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

function checkPunctuationIssues(text) {
  const issues = [];
  
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

function fixPunctuationIssues(text) {
  let fixed = text;
  
  // 修复连续破折号（保留对话中的）
  fixed = fixed.replace(/([^」""]){3,}——/g, '$1——');
  
  // 修复逗号堆积
  fixed = fixed.replace(/，，/g, '，');
  
  // 修复句号堆积
  fixed = fixed.replace(/。。/g, '。');
  
  // 修复连续标点
  fixed = fixed.replace(/，。/g, '。');
  fixed = fixed.replace(/。，/g, '。');
  
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
