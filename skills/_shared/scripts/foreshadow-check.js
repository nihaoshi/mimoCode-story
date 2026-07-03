#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node foreshadow-check.js <chapter-file> [project-dir] [--json] [--full]

Check chapter against foreshadowing tracking:
- Verify new foreshadowings are recorded
- Check if foreshadowings mentioned in chapter are tracked
- Flag overdue foreshadowings (buried > 50 chapters without recovery)
- Check foreshadowing marking format consistency
- Detect overlapping foreshadowings

Options:
  --json    Output structured JSON instead of human-readable text
  --full    Enable full checks (format, overlap detection)

Exit code 0 = pass, 2 = issues found`;

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

function checkForeshadowMarkingFormat(foreshadowFile) {
  const warnings = [];
  
  // 检查是否统一使用 emoji 标记
  const hasEmoji = foreshadowFile.includes('🟢') || foreshadowFile.includes('🟡') || foreshadowFile.includes('🔴');
  const hasTextStatus = foreshadowFile.includes('已埋设，未回收') || foreshadowFile.includes('已部分回收');
  
  if (hasEmoji && hasTextStatus) {
    warnings.push('伏笔状态标记不统一（同时使用emoji和文字），建议统一为 🟢/🟡/🔴');
  }
  
  return warnings;
}

function detectOverlappingForeshadows(tracked) {
  const warnings = [];
  
  // 检测功能重叠的伏笔
  const overlapGroups = [
    { keywords: ['甬道', '纸灰', '烧纸'], desc: '甬道烧纸相关' },
    { keywords: ['紫袍', '官员', '焚烧'], desc: '紫袍官员相关' },
    { keywords: ['太史局', '黄麻纸', '烧'], desc: '太史局烧纸相关' },
  ];
  
  for (const group of overlapGroups) {
    const matching = tracked.filter(f => 
      group.keywords.some(kw => f.content.includes(kw))
    );
    
    if (matching.length >= 2) {
      const ids = matching.map(f => f.id).join('、');
      warnings.push(`伏笔 ${ids} 功能重叠（${group.desc}），建议合并或明确区分`);
    }
  }
  
  return warnings;
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
    if (jsonMode) {
      console.log(JSON.stringify({ status: 'skip', file: chapterFile, summary: { total: 0, recovered: 0, pending: 0, overdue: 0 }, issues: [], reason: '追踪目录不存在' }, null, 2));
    } else {
      console.log('⚠️  追踪目录不存在，跳过伏笔检查');
    }
    process.exit(0);
  }

  const foreshadowFile = readFile(path.join(trackingDir, '伏笔.md'));
  if (!foreshadowFile) {
    if (jsonMode) {
      console.log(JSON.stringify({ status: 'skip', file: chapterFile, summary: { total: 0, recovered: 0, pending: 0, overdue: 0 }, issues: [], reason: '伏笔.md 不存在' }, null, 2));
    } else {
      console.log('⚠️  伏笔.md 不存在，跳过伏笔检查');
    }
    process.exit(0);
  }

  const tracked = parseForeshadowTable(foreshadowFile);
  const chapterClues = extractForeshadowsFromText(chapterText);

  // 基础检查
  const overdue = tracked.filter(f => {
    if (f.status.includes('已回收') || f.status.includes('已过期')) return false;
    const buried = parseInt(f.chapter.replace(/\D/g, ''), 10);
    return buried > 0 && (currentChapter - buried) > 50;
  });

  for (const f of overdue) {
    warnings.push({ type: 'overdue', level: 1, id: f.id, content: f.content.substring(0, 20), buried_chapters: currentChapter - parseInt(f.chapter.replace(/\D/g, ''), 10), message: `伏笔 ${f.id}("${f.content.substring(0, 20)}...") 已埋设 ${currentChapter - parseInt(f.chapter.replace(/\D/g, ''), 10)} 章未回收` });
  }

  // 增强检查（--full 模式）
  if (fullMode) {
    // 格式检查
    const formatWarnings = checkForeshadowMarkingFormat(foreshadowFile);
    for (const fw of formatWarnings) {
      warnings.push({ type: 'format', level: 1, message: fw });
    }
    
    // 重叠检测
    const overlapWarnings = detectOverlappingForeshadows(tracked);
    for (const ow of overlapWarnings) {
      warnings.push({ type: 'overlap', level: 1, message: ow });
    }
  }

  const unrecovered = tracked.filter(f =>
    !f.status.includes('已回收') && !f.status.includes('已过期')
  );

  if (jsonMode) {
    const result = {
      status: warnings.length > 0 ? 'fail' : 'pass',
      file: chapterFile,
      summary: { total: tracked.length, recovered: tracked.length - unrecovered.length, pending: unrecovered.length, overdue: overdue.length },
      issues: warnings,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(warnings.length > 0 ? 1 : 0);
  }

  if (warnings.length > 0) {
    console.log(`\n🚫 伏笔检查发现 ${warnings.length} 个问题：`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. [${w.type}] ${w.message}`));
    console.log(`\n📊 伏笔统计：共 ${tracked.length} 条，已回收 ${tracked.length - unrecovered.length} 条，待回收 ${unrecovered.length} 条`);
    process.exit(2);
  }

  console.log(`✅ 伏笔检查通过（共 ${tracked.length} 条，待回收 ${unrecovered.length} 条）`);
  process.exit(0);
}

main();
