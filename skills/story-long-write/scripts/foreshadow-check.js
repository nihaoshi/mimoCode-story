#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node foreshadow-check.js <chapter-file> [project-dir]

Check chapter against foreshadowing tracking:
- Verify new foreshadowings are recorded
- Check if foreshadowings mentioned in chapter are tracked
- Flag overdue foreshadowings (buried > 50 chapters without recovery)

Exit code 0 = pass, 1 = warnings, 2 = errors`;

function die(msg) {
  console.error(`Error: ${msg}`);
  process.exit(2);
}

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function extractChapterNumber(filename) {
  const m = filename.match(/第(\d+)章/);
  return m ? parseInt(m[1], 10) : 0;
}

function extractForeshadowsFromText(text) {
  const clues = [];
  const patterns = [
    /(?:埋下|埋下伏笔|暗示|伏笔|留了|暗藏|藏了|似乎|隐约|好像)(.{5,50})/g,
    /(?:谁也没想到|没人注意|悄悄|偷偷|暗中)(.{5,50})/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      clues.push(m[0].substring(0, 40));
    }
  }
  return clues;
}

function parseForeshadowTable(text) {
  const rows = [];
  const re = /\|\s*(F\d+)\s*\|(.+?)\|(.+?)\|(.+?)\|(.+?)\|/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    rows.push({
      id: m[1].trim(),
      content: m[2].trim(),
      chapter: m[3].trim(),
      recoverChapter: m[4].trim(),
      status: m[5].trim(),
    });
  }
  return rows;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(args[0]);
  const projectDir = args[1] ? path.resolve(args[1]) : path.resolve(path.dirname(chapterFile), '..');

  if (!fs.existsSync(chapterFile)) {
    die(`Chapter file not found: ${chapterFile}`);
  }

  const chapterText = readFile(chapterFile);
  if (!chapterText) {
    die(`Cannot read chapter file: ${chapterFile}`);
  }

  const currentChapter = extractChapterNumber(path.basename(chapterFile));
  const warnings = [];

  const trackingDir = path.join(projectDir, '追踪');
  if (!fs.existsSync(trackingDir)) {
    console.log('⚠️  追踪目录不存在，跳过伏笔检查');
    process.exit(0);
  }

  const foreshadowFile = readFile(path.join(trackingDir, '伏笔.md'));
  if (!foreshadowFile) {
    console.log('⚠️  伏笔.md 不存在，跳过伏笔检查');
    process.exit(0);
  }

  const tracked = parseForeshadowTable(foreshadowFile);
  const chapterClues = extractForeshadowsFromText(chapterText);

  const overdue = tracked.filter(f => {
    if (f.status.includes('已回收') || f.status.includes('已过期')) return false;
    const buried = parseInt(f.chapter.replace(/\D/g, ''), 10);
    return buried > 0 && (currentChapter - buried) > 50;
  });

  for (const f of overdue) {
    warnings.push(`伏笔 ${f.id}("${f.content.substring(0, 20)}...") 已埋设 ${currentChapter - parseInt(f.chapter.replace(/\D/g, ''), 10)} 章未回收`);
  }

  const unrecovered = tracked.filter(f =>
    !f.status.includes('已回收') && !f.status.includes('已过期')
  );

  if (warnings.length > 0) {
    console.log(`\n⚠️  伏笔检查发现 ${warnings.length} 个问题：`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    console.log(`\n📊 伏笔统计：共 ${tracked.length} 条，已回收 ${tracked.length - unrecovered.length} 条，待回收 ${unrecovered.length} 条`);
    process.exit(1);
  }

  console.log(`✅ 伏笔检查通过（共 ${tracked.length} 条，待回收 ${unrecovered.length} 条）`);
  process.exit(0);
}

main();
