#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { BANNED_LEVEL1, AI_PATTERNS } = require("../../_shared/scripts/banned-words");

const USAGE = `Usage: node quality-gate.js <file> [options]

短篇小说质量门禁检查。

Options:
  --json              输出 JSON 格式
  --min-words N       最低字数（默认：8000）
  --check-punctuation 检查标点符号

检查项目：
  1. 字数检查
  2. 开头钩子检查
  3. 情绪曲线检查
  4. 反转铺垫检查
  5. AI腔检查
  6. 标点符号检查（可选）`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function countWords(text) {
  return text.replace(/[^\u4e00-\u9fa5]/g, '').length;
}

function checkOpening(text) {
  const first500 = text.substring(0, 500);
  const issues = [];
  
  // 检查是否从天气/风景开始
  if (first500.match(/^(今天|那天|那是一个|天空|阳光|雨|雪)/)) {
    issues.push('开头从天气/风景开始，建议直接进入冲突');
  }
  
  // 检查是否有钩子
  if (!first500.match(/[「""]|？|！|冲突|离婚|死亡|离开|背叛/)) {
    issues.push('前500字缺少明显钩子，建议添加悬念或冲突');
  }
  
  return issues;
}

function checkEmotionCurve(text) {
  const issues = [];
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length < 10) {
    issues.push('段落数过少，建议增加段落以控制节奏');
  }
  
  // 检查情绪单调性
  const emotionWords = {
    sad: ['难过', '悲伤', '痛苦', '哭', '泪', '伤心'],
    happy: ['开心', '快乐', '高兴', '笑', '幸福'],
    angry: ['愤怒', '生气', '恨', '怒'],
  };
  
  let lastEmotion = '';
  let emotionRepeatCount = 0;
  
  for (const para of paragraphs) {
    let currentEmotion = 'neutral';
    
    for (const [emotion, words] of Object.entries(emotionWords)) {
      if (words.some(w => para.includes(w))) {
        currentEmotion = emotion;
        break;
      }
    }
    
    if (currentEmotion === lastEmotion && currentEmotion !== 'neutral') {
      emotionRepeatCount++;
      if (emotionRepeatCount >= 3) {
        issues.push('情绪连续重复，建议穿插不同情绪');
        break;
      }
    } else {
      emotionRepeatCount = 0;
    }
    
    lastEmotion = currentEmotion;
  }
  
  return issues;
}

function checkReversal(text) {
  const issues = [];
  
  // 检查是否有反转标记
  const hasReversal = text.match(/其实|原来|没想到|谁知道|真相|秘密|发现/);
  if (!hasReversal) {
    issues.push('未检测到明显反转，短篇需要至少一个核心反转');
  }
  
  // 检查反转位置
  if (hasReversal) {
    const reversalIndex = text.indexOf(hasReversal[0]);
    const textLength = text.length;
    const reversalPosition = reversalIndex / textLength;
    
    if (reversalPosition < 0.6) {
      issues.push('反转出现过早（前60%），建议放在70-85%位置');
    } else if (reversalPosition > 0.9) {
      issues.push('反转出现过晚（后90%），建议提前到70-85%位置');
    }
  }
  
  return issues;
}

function checkAIPatterns(text) {
  const issues = [];
  
  // 检查禁用词
  for (const word of BANNED_LEVEL1) {
    const regex = new RegExp(word, 'g');
    const matches = text.match(regex);
    if (matches) {
      issues.push(`禁用词"${word}"(出现${matches.length}次)`);
    }
  }
  
  // 检查其他AI腔模式（从共享 AI_PATTERNS 加载）
  for (const { re, desc } of AI_PATTERNS) {
    const matches = text.match(re);
    if (matches) {
      issues.push(`${desc}(出现${matches.length}次)`);
    }
  }
  
  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const checkPunctuation = args.includes('--check-punctuation');
  let minWords = 8000;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--min-words' && args[i + 1]) {
      minWords = parseInt(args[i + 1], 10);
      i++;
    }
  }
  
  const filteredArgs = args.filter(a => 
    a !== '--json' && a !== '--check-punctuation'
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
  
  const wordCount = countWords(content);
  const allIssues = [];
  const blockers = [];
  const warnings = [];
  
  // 字数检查
  if (wordCount < minWords) {
    blockers.push(`字数不足: ${wordCount}/${minWords}`);
  }
  
  // 开头检查
  const openingIssues = checkOpening(content);
  for (const issue of openingIssues) {
    warnings.push(issue);
  }
  
  // 情绪曲线检查
  const emotionIssues = checkEmotionCurve(content);
  for (const issue of emotionIssues) {
    warnings.push(issue);
  }
  
  // 反转检查
  const reversalIssues = checkReversal(content);
  for (const issue of reversalIssues) {
    blockers.push(issue);
  }
  
  // AI腔检查
  const aiIssues = checkAIPatterns(content);
  for (const issue of aiIssues) {
    warnings.push(`AI腔: ${issue}`);
  }
  
  allIssues.push(...blockers.map(i => ({ type: 'blocker', message: i })));
  allIssues.push(...warnings.map(i => ({ type: 'warning', message: i })));
  
  if (jsonMode) {
    const result = {
      status: blockers.length > 0 ? 'blocked' : (warnings.length > 0 ? 'warn' : 'pass'),
      file: filePath,
      word_count: wordCount,
      summary: { blockers: blockers.length, warnings: warnings.length },
      issues: allIssues,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(blockers.length > 0 ? 2 : (warnings.length > 0 ? 1 : 0));
  }
  
  console.log('\\n🔍 短篇质量门禁检查报告');
  console.log('='.repeat(50));
  console.log(`📝 字数: ${wordCount}/${minWords}`);
  
  if (blockers.length > 0) {
    console.log('\\n🚫 阻断项（必须修复）：');
    blockers.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  }
  
  if (warnings.length > 0) {
    console.log('\\n⚠️  警告项（建议修复）：');
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }
  
  if (blockers.length === 0 && warnings.length === 0) {
    console.log('\\n✅ 全部通过！');
  }
  
  console.log('='.repeat(50));
  
  process.exit(blockers.length > 0 ? 2 : (warnings.length > 0 ? 1 : 0));
}

main();
