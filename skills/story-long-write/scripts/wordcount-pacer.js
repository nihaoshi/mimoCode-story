#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node wordcount-pacer.js <outline-file> [--json] [--target-words N]

Generate word count pacing guide from chapter outline.

Reads the fine outline and outputs section-by-section word count targets.

Options:
  --json            Output structured JSON
  --target-words N  Override target word count (default: from outline or 3000)

Exit code 0 = success`;

const PACING_TEMPLATES = {
  standard: [
    { name: '开篇钩子', pct: 10, desc: '章首悬念/冲突/情绪冲击' },
    { name: '事件展开', pct: 35, desc: '推进主要事件' },
    { name: '冲突升级', pct: 25, desc: '矛盾加深/压力增大' },
    { name: '爽点释放', pct: 20, desc: '打脸/反转/情绪释放' },
    { name: '章尾钩子', pct: 10, desc: '留悬念/制造期待' },
  ],
  opening: [
    { name: '世界观引入', pct: 15, desc: '背景/设定/氛围' },
    { name: '主角登场', pct: 25, desc: '身份/困境/金手指' },
    { name: '第一个冲突', pct: 30, desc: '核心矛盾初现' },
    { name: '小爽点', pct: 20, desc: '初次展示能力/获得机会' },
    { name: '章尾悬念', pct: 10, desc: '更大挑战预告' },
  ],
  climax: [
    { name: '最终铺垫', pct: 15, desc: '集结/准备/最后确认' },
    { name: '高潮爆发', pct: 40, desc: '核心冲突正面碰撞' },
    { name: '爽点释放', pct: 30, desc: '大爽点/大反转/大揭秘' },
    { name: '收尾余韵', pct: 15, desc: '情绪沉淀/新篇章预告' },
  ],
  transition: [
    { name: '上章回顾', pct: 10, desc: '简短衔接' },
    { name: '日常铺垫', pct: 40, desc: '角色互动/世界观补充' },
    { name: '新线索', pct: 30, desc: '引入新矛盾/新角色' },
    { name: '章尾钩子', pct: 20, desc: '下一个冲突预告' },
  ],
};

function detectChapterType(outlineText) {
  const text = outlineText.toLowerCase();
  if (text.includes('第1章') || text.includes('第一卷') || text.includes('开篇')) return 'opening';
  if (text.includes('高潮') || text.includes('决战') || text.includes('最终')) return 'climax';
  if (text.includes('过渡') || text.includes('日常') || text.includes('铺垫')) return 'transition';
  return 'standard';
}

function extractTargetWords(outlineText) {
  const match = outlineText.match(/字数目标[：:]\s*(\d+)/);
  return match ? parseInt(match[1], 10) : 3000;
}

function extractSections(outlineText) {
  const sections = [];
  const re = /(?:###?\s*(.+?)(?:\r?\n|$))([\s\S]*?)(?=###?\s|$)/g;
  let m;
  while ((m = re.exec(outlineText)) !== null) {
    const name = m[1].trim();
    const content = m[2].trim();
    if (name && content) {
      sections.push({ name, content: content.substring(0, 100) });
    }
  }
  return sections;
}

function generatePacing(outlineText, targetWords) {
  const chapterType = detectChapterType(outlineText);
  const template = PACING_TEMPLATES[chapterType];
  const sections = extractSections(outlineText);

  const pacing = template.map(t => ({
    section: t.name,
    target_words: Math.round(targetWords * t.pct / 100),
    percentage: t.pct,
    description: t.desc,
  }));

  return {
    chapter_type: chapterType,
    target_words: targetWords,
    template_name: chapterType,
    sections: pacing,
    outline_sections: sections,
  };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const filteredArgs = args.filter(a => a !== '--json');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const outlineFile = path.resolve(filteredArgs[0]);
  if (!fs.existsSync(outlineFile)) {
    console.error(`Error: File not found: ${outlineFile}`);
    process.exit(2);
  }

  const outlineText = fs.readFileSync(outlineFile, 'utf-8');
  const targetWords = filteredArgs.includes('--target-words')
    ? parseInt(filteredArgs[filteredArgs.indexOf('--target-words') + 1], 10)
    : extractTargetWords(outlineText);

  const pacing = generatePacing(outlineText, targetWords);

  if (jsonMode) {
    console.log(JSON.stringify(pacing, null, 2));
    process.exit(0);
  }

  console.log('📝 字数节奏指导');
  console.log('='.repeat(50));
  console.log(`目标字数：${targetWords}  章节类型：${pacing.chapter_type}`);
  console.log(`模板：${pacing.template_name}`);

  console.log('\n段落分配：');
  console.log('-'.repeat(50));
  console.log('段落'.padEnd(12) + '字数'.padEnd(8) + '占比'.padEnd(8) + '说明');
  console.log('-'.repeat(50));

  for (const s of pacing.sections) {
    console.log(
      s.section.padEnd(12) +
      `${s.target_words}`.padEnd(8) +
      `${s.percentage}%`.padEnd(8) +
      s.description
    );
  }

  console.log('-'.repeat(50));
  console.log('合计'.padEnd(12) + `${targetWords}`.padEnd(8) + '100%');

  if (pacing.outline_sections.length > 0) {
    console.log('\n📋 细纲章节：');
    for (const s of pacing.outline_sections) {
      console.log(`  ${s.name}: ${s.content.substring(0, 50)}...`);
    }
  }

  process.exit(0);
}

main();
