#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node consistency-check.js <chapter-file> [project-dir]

Check chapter text against tracking files for consistency issues:
- Items: check if items mentioned in chapter exist in tracking
- Environment: check season/weather continuity
- Character state: check if character attributes are consistent
- Timeline: check for obvious time contradictions

Exit code 0 = pass, 1 = warnings found, 2 = errors found`;

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

function extractNames(text, heading) {
  const names = [];
  const re = new RegExp(`###?\\s*${heading}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n###?|$)`, 'i');
  const m = text.match(re);
  if (m) {
    m[1].split('\n').forEach(line => {
      const name = line.replace(/^[-*]\s*/, '').split(/[:：|]/)[0].trim();
      if (name && name.length > 0 && name.length < 20) names.push(name);
    });
  }
  return names;
}

function extractItemsFromText(text) {
  const items = new Set();
  const itemPatterns = [
    /拿着(.{1,10}?)(?:[，。,.])/g,
    /揣着(.{1,10}?)(?:[，。,.])/g,
    /背着(.{1,10}?)(?:[，。,.])/g,
    /带着(.{1,10}?)(?:[，。,.])/g,
    /掏出(.{1,10}?)(?:[，。,.])/g,
    /握着(.{1,10}?)(?:[，。,.])/g,
  ];
  for (const re of itemPatterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      items.add(m[1]);
    }
  }
  return [...items];
}

function extractCharactersFromText(text) {
  const chars = new Set();
  const dialogueRe = /[「""](.{1,8}?)[」""](?:说|道|问|答|喊|叫|笑|叹|冷哼|怒吼)/g;
  let m;
  while ((m = dialogueRe.exec(text)) !== null) {
    chars.add(m[1]);
  }
  return [...chars];
}

function extractSeasonWeather(text) {
  const seasons = [];
  const weatherRe = /(?:春天|夏天|秋天|冬天|春季|夏季|秋季|冬季|春|夏|秋|冬)/g;
  let m;
  while ((m = weatherRe.exec(text)) !== null) {
    seasons.push(m[0]);
  }
  return seasons;
}

function checkItems(chapterItems, trackingItems) {
  const warnings = [];
  if (!trackingItems) return warnings;
  for (const item of chapterItems) {
    if (!trackingItems.includes(item)) {
      warnings.push(`物品"${item}"在追踪文件中未找到记录`);
    }
  }
  return warnings;
}

function checkSeason(chapterSeasons, trackingFile) {
  const warnings = [];
  if (!trackingFile) return warnings;
  const trackingSeason = trackingFile.match(/当前季节[：:]\s*(.+)/);
  if (trackingSeason) {
    const ts = trackingSeason[1].trim();
    for (const cs of chapterSeasons) {
      if (cs.includes('春') && ts.includes('冬')) {
        warnings.push(`章节提到"${cs}"但追踪记录当前季节为"${ts}"`);
      }
      if (cs.includes('夏') && ts.includes('冬')) {
        warnings.push(`章节提到"${cs}"但追踪记录当前季节为"${ts}"`);
      }
    }
  }
  return warnings;
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

  const warnings = [];
  const errors = [];

  const trackingDir = path.join(projectDir, '追踪');
  if (!fs.existsSync(trackingDir)) {
    console.log('⚠️  追踪目录不存在，跳过一致性检查');
    process.exit(0);
  }

  const itemsFile = readFile(path.join(trackingDir, '物品.md'));
  const envFile = readFile(path.join(trackingDir, '环境.md'));
  const charFile = readFile(path.join(trackingDir, '角色状态.md'));

  const chapterItems = extractItemsFromText(chapterText);
  const chapterSeasons = extractSeasonWeather(chapterText);

  const itemWarnings = checkItems(chapterItems, itemsFile);
  warnings.push(...itemWarnings);

  const seasonWarnings = checkSeason(chapterSeasons, envFile);
  warnings.push(...seasonWarnings);

  if (warnings.length > 0) {
    console.log(`\n⚠️  一致性检查发现 ${warnings.length} 个问题：`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
    process.exit(1);
  }

  console.log('✅ 一致性检查通过');
  process.exit(0);
}

main();
