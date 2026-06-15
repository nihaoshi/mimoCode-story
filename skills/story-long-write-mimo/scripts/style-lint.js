#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { BANNED_LEVEL1, BANNED_LEVEL2 } = require("../../_shared/scripts/banned-words");

const USAGE = `Usage: node style-lint.js <chapter-file> [--json] [--full]

Check chapter for AI-style writing issues:
- Banned words (一级/二级)
- Excessive parallel structures
- Overused dialogue tags
- AI-style sentence patterns
- Heading format consistency
- Professional terminology consistency

Options:
  --json    Output structured JSON instead of human-readable text
  --full    Enable full checks (heading format, professional terms)

Exit code 0 = pass, 1 = warnings found`;

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

function checkHeadingFormat(text, filename) {
  const issues = [];
  
  // 检查标题格式是否统一
  const h1Matches = text.match(/^# [^\n]+/gm);
  const h2Matches = text.match(/^## [^\n]+/gm);
  
  if (h1Matches && h1Matches.length > 0 && h2Matches && h2Matches.length > 0) {
    issues.push(`标题格式不统一：同时使用 # 和 ##（# ${h1Matches.length}处，## ${h2Matches.length}处）`);
  }
  
  // 检查文件名与内部标题是否一致
  const filenameMatch = filename.match(/第(\d+)章[_-](.+)\.md/);
  if (filenameMatch) {
    const chapterNum = filenameMatch[1];
    const titleInFile = h1Matches ? h1Matches[0] : (h2Matches ? h2Matches[0] : '');
    if (titleInFile && !titleInFile.includes(chapterNum)) {
      issues.push(`文件名中的章节号(${chapterNum})与内部标题不一致`);
    }
  }
  
  return issues;
}

function checkProfessionalTerms(text, charFile) {
  const issues = [];
  
  if (!charFile) return issues;
  
  // 提取主角专业
  const professionMatch = charFile.match(/身份[：:]\s*(.+?博士)/);
  if (!professionMatch) return issues;
  
  const profession = professionMatch[1];
  
  // 根据专业检查不合理的术语使用
  if (profession.includes('天文学')) {
    const invalidTerms = [
      { term: /军事动员能力/g, issue: '天文学博士不应使用"军事动员能力"术语' },
      { term: /后勤保障体系/g, issue: '天文学博士不应使用"后勤保障体系"术语' },
      { term: /排兵布阵/g, issue: '天文学博士不应使用"排兵布阵"术语' },
      { term: /战术分析/g, issue: '天文学博士不应使用"战术分析"术语' },
    ];
    
    for (const { term, issue } of invalidTerms) {
      const matches = text.match(term);
      if (matches && matches.length > 0) {
        issues.push(issue);
      }
    }
  }
  
  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const fullMode = args.includes('--full');
  const filteredArgs = args.filter(a => a !== '--json' && a !== '--full');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  const projectDir = filteredArgs[1] ? path.resolve(filteredArgs[1]) : path.resolve(path.dirname(chapterFile), '..');
  
  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const text = readFile(chapterFile);
  if (!text) {
    console.error(`Error: Cannot read file: ${chapterFile}`);
    process.exit(2);
  }

  // 基础检查
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

  // 增强检查（--full 模式）
  if (fullMode) {
    // 标题格式检查
    const headingIssues = checkHeadingFormat(text, path.basename(chapterFile));
    for (const h of headingIssues) {
      issues.push({ type: 'heading_format', level: 1, message: h });
    }

    // 专业术语检查
    const charFile = readFile(path.join(projectDir, '追踪', '角色状态.md'));
    const termIssues = checkProfessionalTerms(text, charFile);
    for (const t of termIssues) {
      issues.push({ type: 'professional_term', level: 1, message: t });
    }
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

  if (fullMode) {
    const headingIssues = issues.filter(i => i.type === 'heading_format');
    if (headingIssues.length > 0) {
      console.log('\n📐 标题格式：');
      headingIssues.forEach(h => console.log(`  ⚠️  ${h.message}`));
    }

    const termIssues = issues.filter(i => i.type === 'professional_term');
    if (termIssues.length > 0) {
      console.log('\n🎓 专业术语：');
      termIssues.forEach(t => console.log(`  ⚠️  ${t.message}`));
    }
  }

  if (issues.length === 0) {
    console.log('✅ 文风检查通过');
    process.exit(0);
  }

  if (level1Count > 0) {
    console.log(`\n❌ 发现 ${level1Count} 个一级问题，需要修改`);
    process.exit(1);
  }

  console.log(`\n⚠️  发现 ${issues.length} 个文风问题，建议修改`);
  process.exit(1);
}

main();
