#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node style-lint.js <chapter-file> [--json]

Check chapter for AI-style writing issues:
- Banned words (一级/二级)
- Excessive parallel structures
- Overused dialogue tags
- AI-style sentence patterns

Options:
  --json    Output structured JSON instead of human-readable text

Exit code 0 = pass, 1 = warnings found`;

const BANNED_LEVEL1 = [
  '不禁', '竟然', '居然', '事实上', '实际上', '显而易见',
  '毫无疑问', '可想而知', '不言而喻', '与此同时',
  '值得注意的是', '需要指出的是', '不可否认',
  '嘴角勾起', '嘴角上扬', '嘴角微扬',
  '眼中闪过', '眼底闪过', '目光中闪过',
  '深吸一口气', '长舒一口气', '吐出一口浊气',
  '缓缓开口', '淡淡说道', '轻声说道',
  '仿佛', '宛如', '恰似', '犹如',
  '值得一提', '不得不说', '总而言之',
];

const BANNED_LEVEL2 = [
  '一抹', '一丝', '一缕', '一股',
  '不由得', '忍不住', '情不自禁',
  '微微', '轻轻', '缓缓', '淡淡',
  '顿时', '霎时', '刹那间',
  '果然',
  '或许', '也许', '大概',
];

const DIALOGUE_TAGS = ['说道', '问道', '答道', '喊道', '叫道', '笑道', '叹道'];

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function checkBannedWords(text) {
  const results = [];
  for (const word of BANNED_LEVEL1) {
    const re = new RegExp(word, 'g');
    const matches = text.match(re);
    if (matches) {
      results.push({ word, level: 1, count: matches.length });
    }
  }
  for (const word of BANNED_LEVEL2) {
    const re = new RegExp(word, 'g');
    const matches = text.match(re);
    if (matches && matches.length >= 3) {
      results.push({ word, level: 2, count: matches.length });
    }
  }
  return results;
}

function checkDialogueTags(text) {
  const issues = [];
  for (const tag of DIALOGUE_TAGS) {
    const re = new RegExp(tag, 'g');
    const matches = text.match(re);
    if (matches && matches.length > 5) {
      issues.push(`"${tag}" 出现 ${matches.length} 次，建议减少对话标签，用动作替代`);
    }
  }
  return issues;
}

function checkParallelStructures(text) {
  const issues = [];
  const lines = text.split('\n');
  let parallelCount = 0;
  let parallelStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('是') && line.includes('，') && line.includes('是')) {
      if (parallelCount === 0) parallelStart = i + 1;
      parallelCount++;
    } else {
      if (parallelCount >= 3) {
        issues.push(`第 ${parallelStart}-${parallelStart + parallelCount} 行：连续 ${parallelCount} 个排比结构，建议精简`);
      }
      parallelCount = 0;
    }
  }
  return issues;
}

function checkAIPatterns(text) {
  const issues = [];
  const patterns = [
    { re: /([。！？])\1{2,}/g, desc: '连续3个以上相同句末标点' },
    { re: /(?:事实上|实际上|说实话|老实说)[，,]/g, desc: '过度使用过渡词' },
    { re: /(?:不仅.*而且|不但.*还|既.*又.*还)/g, desc: '递进连词过多' },
  ];
  for (const { re, desc } of patterns) {
    const matches = text.match(re);
    if (matches && matches.length > 2) {
      issues.push(`${desc}（出现 ${matches.length} 次）`);
    }
  }
  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const filteredArgs = args.filter(a => a !== '--json');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const text = readFile(chapterFile);
  if (!text) {
    console.error(`Error: Cannot read file: ${chapterFile}`);
    process.exit(2);
  }

  const banned = checkBannedWords(text);
  const dialogueIssues = checkDialogueTags(text);
  const parallelIssues = checkParallelStructures(text);
  const aiIssues = checkAIPatterns(text);

  const issues = [];
  for (const b of banned) {
    issues.push({ type: 'banned_word', level: b.level, word: b.word, count: b.count, message: `"${b.word}" 出现 ${b.count} 次` });
  }
  for (const d of dialogueIssues) {
    issues.push({ type: 'dialogue_tag', level: 2, message: d });
  }
  for (const p of parallelIssues) {
    issues.push({ type: 'parallel_structure', level: 2, message: p });
  }
  for (const a of aiIssues) {
    issues.push({ type: 'ai_pattern', level: 2, message: a });
  }

  const level1Count = issues.filter(i => i.level === 1).length;
  const level2Count = issues.filter(i => i.level === 2).length;

  if (jsonMode) {
    const result = {
      status: issues.length === 0 ? 'pass' : (level1Count > 0 ? 'fail' : 'warn'),
      file: chapterFile,
      summary: { level1: level1Count, level2: level2Count, total: issues.length },
      issues,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(level1Count > 0 ? 1 : 0);
  }

  if (banned.length > 0) {
    console.log('\n🚫 禁用词检测：');
    for (const b of banned) {
      const label = b.level === 1 ? '一级(必改)' : '二级(建议改)';
      console.log(`  [${label}] "${b.word}" 出现 ${b.count} 次`);
    }
  }

  if (dialogueIssues.length > 0) {
    console.log('\n💬 对话标签：');
    dialogueIssues.forEach(d => console.log(`  ⚠️  ${d}`));
  }

  if (parallelIssues.length > 0) {
    console.log('\n📝 排比结构：');
    parallelIssues.forEach(p => console.log(`  ⚠️  ${p}`));
  }

  if (aiIssues.length > 0) {
    console.log('\n🤖 AI腔模式：');
    aiIssues.forEach(a => console.log(`  ⚠️  ${a}`));
  }

  if (issues.length === 0) {
    console.log('✅ 文风检查通过');
    process.exit(0);
  }

  if (level1Count > 0) {
    console.log(`\n❌ 发现 ${level1Count} 个一级禁用词，需要修改`);
    process.exit(1);
  }

  console.log(`\n⚠️  发现 ${issues.length} 个文风问题，建议修改`);
  process.exit(1);
}

main();
