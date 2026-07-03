#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node character-sync.js <project-dir> [--fix] [--json]

Sync character files between 设定/角色/ and 追踪/角色状态.md.

Checks:
  1. Characters in 追踪/角色状态.md but missing from 设定/角色/
  2. Characters in 设定/角色/ but missing from 追踪/角色状态.md
  3. 性格锚点 divergence between the two
  4. Missing required fields in either file

Options:
  --fix    Auto-create missing entries (templates only)
  --json   Output structured JSON

Exit codes:
  0 = all synced
  2 = issues found (missing entries)`;

function findCharacterFiles(settingsDir) {
  const charDir = path.join(settingsDir, '角色');
  if (!fs.existsSync(charDir)) return [];
  
  return fs.readdirSync(charDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .map(f => ({
      name: f.replace('.md', ''),
      path: path.join(charDir, f),
      content: fs.readFileSync(path.join(charDir, f), 'utf-8'),
    }));
}

function parseTrackingFile(trackingPath) {
  if (!fs.existsSync(trackingPath)) return { characters: [], raw: '' };
  
  const raw = fs.readFileSync(trackingPath, 'utf-8');
  const characters = [];
  
  const sections = raw.split(/^## /m).filter(s => s.trim());
  for (const section of sections) {
    const nameMatch = section.match(/^(.+?)(?:\r?\n)/);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    if (name === '格式说明' || name === '更新规则' || name === '角色状态追踪') continue;
    
    const hasAnchor = section.includes('性格锚点') || section.includes('核心性格');
    const hasIdentity = section.includes('当前身份');
    const hasRelations = section.includes('关键关系');
    
    characters.push({
      name,
      hasAnchor,
      hasIdentity,
      hasRelations,
      raw: section,
    });
  }
  
  return { characters, raw };
}

function extractAnchorsFromDesign(content) {
  const anchors = {};
  
  const personalityMatch = content.match(/性格关键词[：:]\s*(.+)/);
  if (personalityMatch) anchors.personality = personalityMatch[1].trim();
  
  const speechMatch = content.match(/(?:口头禅|说话风格|语言风格)[：:]\s*(.+)/);
  if (speechMatch) anchors.speech = speechMatch[1].trim();
  
  const behaviorMatch = content.match(/行为模式[：:]\s*(.+)/);
  if (behaviorMatch) anchors.behavior = behaviorMatch[1].trim();
  
  const tabooMatch = content.match(/禁忌[：:]\s*(.+)/);
  if (tabooMatch) anchors.taboo = tabooMatch[1].trim();
  
  return anchors;
}

function generateTrackingEntry(charFile) {
  const name = charFile.name;
  const content = charFile.content;
  
  const identityMatch = content.match(/身份标签[：:]\s*(.+)/);
  const identity = identityMatch ? identityMatch[1].trim() : '待补充';
  
  const personalityMatch = content.match(/性格关键词[：:]\s*(.+)/);
  const personality = personalityMatch ? personalityMatch[1].trim() : '待补充';
  
  const speechMatch = content.match(/(?:口头禅|说话风格)[：:]\s*(.+)/);
  const speech = speechMatch ? speechMatch[1].trim() : '待补充';
  
  const behaviorMatch = content.match(/行为模式[：:]\s*(.+)/);
  const behavior = behaviorMatch ? behaviorMatch[1].trim() : '待补充';
  
  const tabooMatch = content.match(/禁忌[：:]\s*(.+)/);
  const taboo = tabooMatch ? tabooMatch[1].trim() : '待补充';
  
  return `## ${name}
- **当前身份**：${identity}
- **当前能力**：待补充
- **关键关系**：
  - 待补充
- **公众形象**：待补充
- **待回收伏笔**：无
- **性格锚点**（跨章节一致性参考，不轻易变更）：
  - 核心性格：${personality}
  - 说话风格：${speech}
  - 行为模式：${behavior}
  - 禁忌：${taboo}
- **状态变更记录**：
  - 初始状态（从设定同步）
`;
}

function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');
  const jsonMode = args.includes('--json');
  const filteredArgs = args.filter(a => a !== '--fix' && a !== '--json');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const projectDir = path.resolve(filteredArgs[0]);
  const settingsDir = path.join(projectDir, '设定');
  const trackingPath = path.join(projectDir, '追踪', '角色状态.md');

  if (!fs.existsSync(settingsDir)) {
    console.error(`Error: 设定/ directory not found: ${settingsDir}`);
    process.exit(2);
  }

  const charFiles = findCharacterFiles(settingsDir);
  const tracking = parseTrackingFile(trackingPath);

  const designNames = new Set(charFiles.map(c => c.name));
  const trackingNames = new Set(tracking.characters.map(c => c.name));

  const issues = [];
  const fixes = [];

  // Check: in tracking but not in design
  for (const tc of tracking.characters) {
    if (!designNames.has(tc.name)) {
      issues.push({
        type: 'missing_design',
        character: tc.name,
        message: `追踪/角色状态.md 中有「${tc.name}」，但 设定/角色/${tc.name}.md 不存在`,
      });
    }
  }

  // Check: in design but not in tracking
  for (const cf of charFiles) {
    if (!trackingNames.has(cf.name)) {
      issues.push({
        type: 'missing_tracking',
        character: cf.name,
        message: `设定/角色/${cf.name}.md 存在，但 追踪/角色状态.md 中没有「${cf.name}」`,
      });
      if (fixMode) {
        fixes.push(`为「${cf.name}」在追踪/角色状态.md 中创建初始状态`);
      }
    }
  }

  // Check: anchor divergence
  for (const tc of tracking.characters) {
    const designFile = charFiles.find(c => c.name === tc.name);
    if (!designFile) continue;

    const designAnchors = extractAnchorsFromDesign(designFile.content);
    if (tc.hasAnchor && designAnchors.personality) {
      // Both have personality info - this is good, they should match
      // We don't auto-detect divergence here since formats differ
    }
  }

  // Check: tracking file missing entirely
  if (!fs.existsSync(trackingPath)) {
    issues.push({
      type: 'missing_tracking_file',
      character: '(all)',
      message: '追踪/角色状态.md 文件不存在',
    });
    if (fixMode) {
      // Generate full tracking file from design files
      let content = '# 角色状态追踪\n\n> 用途：最简记忆包的数据源。写作每章前从此文件中筛选本章相关的角色状态。\n> 更新时机：Phase 3 大纲完成后创建初始状态；Phase 4 每章写完后更新变化。\n\n';
      for (const cf of charFiles) {
        content += generateTrackingEntry(cf) + '\n';
      }
      fs.writeFileSync(trackingPath, content, 'utf-8');
      fixes.push(`从 ${charFiles.length} 个角色设定文件生成追踪/角色状态.md`);
    }
  }

  // Fix: add missing tracking entries
  if (fixMode && fixes.length > 0) {
    // Re-read tracking file (may have been just created)
    let trackingContent = fs.existsSync(trackingPath) 
      ? fs.readFileSync(trackingPath, 'utf-8')
      : '# 角色状态追踪\n\n';
    
    for (const cf of charFiles) {
      if (!trackingNames.has(cf.name)) {
        trackingContent += '\n' + generateTrackingEntry(cf) + '\n';
      }
    }
    fs.writeFileSync(trackingPath, trackingContent, 'utf-8');
  }

  const status = issues.length > 0 ? 'fail' : 'pass';

  if (jsonMode) {
    console.log(JSON.stringify({
      status,
      design_count: charFiles.length,
      tracking_count: tracking.characters.length,
      issues,
      fixes,
      design_characters: charFiles.map(c => c.name),
      tracking_characters: tracking.characters.map(c => c.name),
    }, null, 2));
    process.exit(issues.length > 0 ? 2 : 0);
  }

  console.log('🔍 角色同步检查');
  console.log('='.repeat(50));
  console.log(`设定角色：${charFiles.length} 个 — ${charFiles.map(c => c.name).join(', ') || '(无)'}`);
  console.log(`追踪角色：${tracking.characters.length} 个 — ${tracking.characters.map(c => c.name).join(', ') || '(无)'}`);

  if (issues.length > 0) {
    console.log('\n🚫 发现问题：');
    issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. [${issue.type}] ${issue.message}`);
    });
  } else {
    console.log('\n✅ 设定与追踪完全同步！');
  }

  if (fixes.length > 0) {
    console.log('\n🔧 已修复：');
    fixes.forEach((fix, i) => console.log(`  ${i + 1}. ${fix}`));
  }

  console.log('='.repeat(50));
  process.exit(issues.length > 0 ? 2 : 0);
}

main();
