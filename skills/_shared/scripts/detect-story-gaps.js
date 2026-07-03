#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node detect-story-gaps.js <project-dir> [--json]

Detect story project gaps before writing:
- Setting file completeness (worldbuilding, characters, factions, relationships, genre positioning)
- Outline completeness (chapter outlines cover all written chapters)
- Foreshadowing断线 (overdue foreshadowings > 50 chapters)
- Tracking file completeness (required tracking files exist)

Options:
  --json    Output structured JSON instead of human-readable text

Exit code 0 = no gaps, 2 = issues found`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir).filter(f => !f.startsWith('.'));
  } catch {
    return [];
  }
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function extractChapterNumber(filename) {
  const m = filename.match(/第(\d+)章/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseForeshadowTable(text) {
  const rows = [];
  const re = /\|\s*(?:🟢|🟡|🔴|F\d+|[A-Za-z0-9]+)\s*\|(.+?)\|(.+?)\|(.+?)\|(.+?)\|/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    rows.push({
      content: m[1].trim(),
      chapter: m[2].trim(),
      recoverChapter: m[3].trim(),
      status: m[4].trim(),
    });
  }
  return rows;
}

function checkSettings(projectDir) {
  const warnings = [];
  const blocking = [];
  const settingsDir = path.join(projectDir, '设定');

  if (!isDir(settingsDir)) {
    blocking.push('设定/ 目录不存在');
    return { warnings, blocking };
  }

  // 世界观
  const worldDir = path.join(settingsDir, '世界观');
  if (!isDir(worldDir)) {
    warnings.push('设定/世界观/ 目录不存在');
  } else {
    const worldFiles = listDir(worldDir);
    if (worldFiles.length === 0) {
      warnings.push('设定/世界观/ 目录为空');
    }
  }

  // 角色
  const charDir = path.join(settingsDir, '角色');
  if (!isDir(charDir)) {
    warnings.push('设定/角色/ 目录不存在');
  } else {
    const charFiles = listDir(charDir).filter(f => f.endsWith('.md'));
    if (charFiles.length === 0) {
      warnings.push('设定/角色/ 目录为空（无角色卡文件）');
    }
  }

  // 势力
  const factionDir = path.join(settingsDir, '势力');
  if (!isDir(factionDir)) {
    warnings.push('设定/势力/ 目录不存在（可选）');
  }

  // 关系
  if (!exists(path.join(settingsDir, '关系.md'))) {
    warnings.push('设定/关系.md 不存在');
  }

  // 题材定位
  if (!exists(path.join(settingsDir, '题材定位.md'))) {
    warnings.push('设定/题材定位.md 不存在');
  }

  return { warnings, blocking };
}

function checkOutline(projectDir) {
  const warnings = [];
  const blocking = [];
  const outlineDir = path.join(projectDir, '大纲');

  if (!isDir(outlineDir)) {
    blocking.push('大纲/ 目录不存在');
    return { warnings, blocking };
  }

  // 大纲.md
  if (!exists(path.join(outlineDir, '大纲.md'))) {
    warnings.push('大纲/大纲.md 不存在');
  }

  // 获取已写章节号
  const textDir = path.join(projectDir, '正文');
  const writtenChapters = [];
  if (isDir(textDir)) {
    for (const f of listDir(textDir)) {
      const num = extractChapterNumber(f);
      if (num > 0) writtenChapters.push(num);
    }
    writtenChapters.sort((a, b) => a - b);
  }

  if (writtenChapters.length === 0) {
    return { warnings, blocking };
  }

  // 获取已有细纲章节号
  const outlineFiles = listDir(outlineDir);
  const outlinedChapters = [];
  for (const f of outlineFiles) {
    const num = extractChapterNumber(f);
    if (num > 0) outlinedChapters.push(num);
  }

  // 检查缺失的细纲
  const minWritten = Math.min(...writtenChapters);
  const maxWritten = Math.max(...writtenChapters);
  
  for (let i = minWritten; i <= maxWritten; i++) {
    if (writtenChapters.includes(i) && !outlinedChapters.includes(i)) {
      warnings.push(`第${i}章已写正文但缺少细纲（大纲/细纲_第${String(i).padStart(3, '0')}章.md）`);
    }
  }

  return { warnings, blocking };
}

function checkForeshadows(projectDir) {
  const warnings = [];
  const blocking = [];
  const foreshadowFile = path.join(projectDir, '追踪', '伏笔.md');

  const content = readFile(foreshadowFile);
  if (!content) {
    warnings.push('追踪/伏笔.md 不存在');
    return { warnings, blocking };
  }

  // 获取已写章节号
  const textDir = path.join(projectDir, '正文');
  let maxChapter = 0;
  if (isDir(textDir)) {
    for (const f of listDir(textDir)) {
      const num = extractChapterNumber(f);
      if (num > maxChapter) maxChapter = num;
    }
  }

  if (maxChapter === 0) return { warnings, blocking };

  // 解析伏笔表
  const foreshadows = parseForeshadowTable(content);
  for (const fs of foreshadows) {
    // 检查逾期（超 50 章未回收）
    const buryMatch = fs.chapter.match(/(\d+)/);
    const recoverMatch = fs.recoverChapter.match(/(\d+)/);
    
    if (buryMatch && !recoverMatch) {
      const buryChapter = parseInt(buryMatch[1], 10);
      if (maxChapter - buryChapter > 50) {
        warnings.push(`伏笔"${fs.content.substring(0, 20)}..." 埋于第${buryChapter}章，已超 ${maxChapter - buryChapter} 章未回收`);
      }
    }

    // 检查格式
    if (!fs.status || fs.status === '') {
      warnings.push(`伏笔"${fs.content.substring(0, 20)}..." 缺少状态标记`);
    }
  }

  return { warnings, blocking };
}

function checkTracking(projectDir) {
  const warnings = [];
  const blocking = [];
  const trackingDir = path.join(projectDir, '追踪');

  if (!isDir(trackingDir)) {
    blocking.push('追踪/ 目录不存在');
    return { warnings, blocking };
  }

  const requiredFiles = ['伏笔.md', '时间线.md', '角色状态.md', '上下文.md'];
  const optionalFiles = ['物品.md', '环境.md', '物资.md'];

  for (const f of requiredFiles) {
    if (!exists(path.join(trackingDir, f))) {
      blocking.push(`追踪/${f} 不存在（必需）`);
    }
  }

  for (const f of optionalFiles) {
    if (!exists(path.join(trackingDir, f))) {
      warnings.push(`追踪/${f} 不存在（可选）`);
    }
  }

  return { warnings, blocking };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  const jsonMode = args.includes('--json');
  const projectDir = args.find(a => !a.startsWith('--'));

  if (!projectDir) {
    console.error('Error: project directory is required');
    process.exit(2);
  }

  if (!isDir(projectDir)) {
    console.error(`Error: "${projectDir}" is not a directory`);
    process.exit(2);
  }

  const allWarnings = [];
  const allBlocking = [];

  // 运行所有检查
  const checks = [
    { name: '设定文件', fn: checkSettings },
    { name: '大纲完整性', fn: checkOutline },
    { name: '伏笔断线', fn: checkForeshadows },
    { name: '追踪文件', fn: checkTracking },
  ];

  const results = [];
  for (const check of checks) {
    const { warnings, blocking } = check.fn(projectDir);
    allWarnings.push(...warnings);
    allBlocking.push(...blocking);
    results.push({
      name: check.name,
      warnings,
      blocking,
    });
  }

  // 输出
  if (jsonMode) {
    console.log(JSON.stringify({
      project: projectDir,
      results,
      summary: {
        totalWarnings: allWarnings.length,
        totalBlocking: allBlocking.length,
      },
    }, null, 2));
  } else {
    console.log(`\n项目缺口检测：${projectDir}\n`);
    
    for (const r of results) {
      if (r.warnings.length === 0 && r.blocking.length === 0) {
        console.log(`  ✅ ${r.name}：无问题`);
      } else {
        if (r.blocking.length > 0) {
          console.log(`  ❌ ${r.name}：${r.blocking.length} 个阻断问题`);
          for (const b of r.blocking) {
            console.log(`     [阻断] ${b}`);
          }
        }
        if (r.warnings.length > 0) {
          console.log(`  ⚠️  ${r.name}：${r.warnings.length} 个警告`);
          for (const w of r.warnings) {
            console.log(`     [警告] ${w}`);
          }
        }
      }
    }

    console.log(`\n总结：${allBlocking.length} 个阻断，${allWarnings.length} 个警告`);
  }

  // 退出码
  if (allBlocking.length > 0 || allWarnings.length > 0) {
    process.exit(2);
  } else {
    process.exit(0);
  }
}

main();
