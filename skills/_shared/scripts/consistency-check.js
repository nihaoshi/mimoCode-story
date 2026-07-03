#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node consistency-check.js <chapter-file> [project-dir] [--json] [--full]

Check chapter text against tracking files for consistency issues:
- Items: check if items mentioned in chapter exist in tracking
- Environment: check season/weather continuity
- Character state: check if character attributes are consistent
- Timeline: check for obvious time contradictions
- Identity: check if character identity matches behavior
- Tracking completeness: check if tracking files have required fields

Options:
  --json    Output structured JSON instead of human-readable text
  --full    Enable full consistency checks (slower but more thorough)

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

function extractNames(text, heading) {
  const names = [];
  const re = new RegExp(`###?\\s*${heading}[\\s\\S]*?\\r?\\n([\\s\\S]*?)(?=\\r?\\n###?|$)`, 'i');
  const m = text.match(re);
  if (m) {
    m[1].split(/\r?\n/).forEach(line => {
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

function extractCharacterNamesFromText(text) {
  const names = new Set();
  const patterns = [
    /(?:^|[\n\s])([^\s，。！？""""「」『』\u201C\u201D]{2,4})\s*(?:说|道|问|答|喊|叫|笑|叹|冷哼|怒吼)/gm,
    /(?:^|[\n\s])([^\s，。！？""""「」『』\u201C\u201D]{2,4})\s*(?:点点头|摇摇头|叹了口气|笑了笑|皱眉|沉思|转身|回头)/gm,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const name = m[1].trim();
      if (name.length >= 2 && name.length <= 4 &&
          !/^[了的着过在是就也还才被把让给对跟和与或但而且因为所以如果虽然]/.test(name) &&
          !/^[这那什么怎哪谁其]/.test(name) &&
          !/[说道问答喊叫笑叹]/.test(name) &&
          !/[""''""「」『』\u201C\u201D]/.test(name) &&
          !/^\d+$/.test(name)) {
        names.add(name);
      }
    }
  }
  return [...names];
}

function extractDeadCharacters(trackingText) {
  const dead = [];
  const lines = trackingText.split(/\r?\n/);
  for (const line of lines) {
    if (line.includes('已故') || line.includes('已死亡') || line.includes('已去世') || line.includes('已离世')) {
      const nameMatch = line.match(/##\s*(.+)/) || line.match(/[-*]\s*\*\*(.+?)\*\*/);
      if (nameMatch) dead.push(nameMatch[1].trim());
    }
  }
  return dead;
}

function extractCharacterNamesFromTracking(trackingText) {
  const names = [];
  const re = /##\s*(.+?)(?:\r?\n|$)/g;
  let m;
  while ((m = re.exec(trackingText)) !== null) {
    const name = m[1].trim();
    if (name && !name.startsWith('#') && name.length < 20) names.push(name);
  }
  return names;
}

function checkDeadCharacters(chapterNames, deadCharacters) {
  const warnings = [];
  for (const name of chapterNames) {
    if (deadCharacters.includes(name)) {
      warnings.push(`角色"${name}"已标记死亡/故去，但在本章再次出场`);
    }
  }
  return warnings;
}

function checkCharacterNameDrift(chapterNames, trackingNames) {
  const warnings = [];
  for (const cn of chapterNames) {
    if (trackingNames.includes(cn)) continue;
    for (const tn of trackingNames) {
      if (cn.length >= 2 && tn.length >= 2) {
        const shorter = cn.length < tn.length ? cn : tn;
        const longer = cn.length < tn.length ? tn : cn;
        if (longer.includes(shorter) && shorter.length >= 2) {
          warnings.push(`角色名"${cn}"可能是"${tn}"的拼写变体，请确认`);
          break;
        }
      }
    }
  }
  return warnings;
}

function checkCharacterState(chapterNames, trackingText) {
  const warnings = [];
  const trackingNames = extractCharacterNamesFromTracking(trackingText);
  for (const name of chapterNames) {
    if (!trackingNames.includes(name) && name.length >= 2) {
      const similar = trackingNames.find(tn => {
        if (name.length < 2 || tn.length < 2) return false;
        return tn.includes(name) || name.includes(tn);
      });
      if (!similar) {
        warnings.push(`角色"${name}"在本章出场，但未在角色状态追踪中找到记录`);
      }
    }
  }
  return warnings;
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

function checkIdentityConsistency(chapterText, charFile) {
  const warnings = [];
  if (!charFile) return warnings;
  
  // 提取主角专业信息
  const professionMatch = charFile.match(/身份[：:]\s*(.+?博士)/);
  if (!professionMatch) return warnings;
  
  const profession = professionMatch[1];
  
  // 检测不合理的论文/文献引用
  const invalidPaperPatterns = [
    { pattern: /在论文里(?:分析|论证|研究)(?:军事|战争|战术|排兵布阵)/g, issue: '天文学博士不应在论文中分析军事战术' },
    { pattern: /在论文里(?:引用|提到)(?:房玄龄|李靖|李世民|魏徵)/g, issue: '天文学博士不应在论文中引用历史人物' },
    { pattern: /在论文里(?:研究|讨论)(?:长安城|宫殿|城市布局)/g, issue: '天文学博士不应在论文中研究城市布局' },
    { pattern: /考古复原图/g, issue: '天文学博士不应熟悉考古复原图' },
    { pattern: /在论文里读过.*传说/g, issue: '天文学博士不应在论文中研究传说' },
  ];
  
  for (const { pattern, issue } of invalidPaperPatterns) {
    const matches = chapterText.match(pattern);
    if (matches && matches.length > 0) {
      warnings.push(`身份矛盾：${issue}`);
    }
  }
  
  return warnings;
}

function checkTrackingCompleteness(trackingDir) {
  const warnings = [];
  
  // 检查角色状态.md是否包含性格锚点
  const charFile = readFile(path.join(trackingDir, '角色状态.md'));
  if (charFile && !charFile.includes('性格锚点')) {
    warnings.push('角色状态.md缺少"性格锚点"字段，建议为每个主要角色添加');
  }
  
  // 检查物品.md和物资.md是否重复
  const itemsFile = readFile(path.join(trackingDir, '物品.md'));
  const suppliesFile = readFile(path.join(trackingDir, '物资.md'));
  if (itemsFile && suppliesFile) {
    const itemsContent = itemsFile.replace(/\s/g, '');
    const suppliesContent = suppliesFile.replace(/\s/g, '');
    const overlap = ['白瓷片', '过所', '文房四宝', '李靖'].filter(item => 
      itemsContent.includes(item) && suppliesContent.includes(item)
    );
    if (overlap.length >= 3) {
      warnings.push(`物品.md和物资.md内容重复（共同包含：${overlap.slice(0, 3).join('、')}），建议合并`);
    }
  }
  
  // 检查伏笔.md状态标记是否统一
  const foreshadowFile = readFile(path.join(trackingDir, '伏笔.md'));
  if (foreshadowFile) {
    const hasEmoji = foreshadowFile.includes('🟢') || foreshadowFile.includes('🟡') || foreshadowFile.includes('🔴');
    const hasText = foreshadowFile.includes('已埋设') || foreshadowFile.includes('未回收');
    if (hasEmoji && hasText) {
      warnings.push('伏笔.md状态标记不统一（同时使用emoji和文字），建议统一');
    }
  }
  
  return warnings;
}

function checkTimelineLogic(chapterText, chapterFile) {
  const warnings = [];
  
  // 提取章节号
  const chapterMatch = chapterFile.match(/第(\d+)章/);
  if (!chapterMatch) return warnings;
  
  const chapterNum = parseInt(chapterMatch[1], 10);
  
  // 检测怀孕时间线矛盾
  const pregnancyPatterns = [
    { pattern: /怀孕(?:约|大概|差不多)(\d+)[-~](\d+)个月/g, desc: '怀孕时长' },
    { pattern: /肚子.*?(?:五|六|七|八|九)个月/g, desc: '肚子大小描述' },
  ];
  
  for (const { pattern, desc } of pregnancyPatterns) {
    const matches = chapterText.match(pattern);
    if (matches) {
      // 简单检查：如果在同一章中提到不同的怀孕时长，可能有问题
      const months = matches.map(m => {
        const numMatch = m.match(/(\d+)/);
        return numMatch ? parseInt(numMatch[1], 10) : 0;
      }).filter(n => n > 0);
      
      if (months.length > 1 && Math.max(...months) - Math.min(...months) > 2) {
        warnings.push(`时间线疑点：本章中${desc}描述不一致（${months.join('、')}个月）`);
      }
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

  const warnings = [];
  const errors = [];

  const trackingDir = path.join(projectDir, '追踪');
  if (!fs.existsSync(trackingDir)) {
    if (jsonMode) {
      console.log(JSON.stringify({ status: 'skip', file: chapterFile, summary: { errors: 0, warnings: 0 }, issues: [], reason: '追踪目录不存在' }, null, 2));
    } else {
      console.log('⚠️  追踪目录不存在，跳过一致性检查');
    }
    process.exit(0);
  }

  const itemsFile = readFile(path.join(trackingDir, '物品.md'));
  const envFile = readFile(path.join(trackingDir, '环境.md'));
  const charFile = readFile(path.join(trackingDir, '角色状态.md'));

  const chapterItems = extractItemsFromText(chapterText);
  const chapterSeasons = extractSeasonWeather(chapterText);
  const chapterNames = extractCharacterNamesFromText(chapterText);

  // 基础检查（始终执行）
  const itemWarnings = checkItems(chapterItems, itemsFile);
  warnings.push(...itemWarnings.map(msg => ({ type: 'item', level: 1, message: msg })));

  const seasonWarnings = checkSeason(chapterSeasons, envFile);
  warnings.push(...seasonWarnings.map(msg => ({ type: 'environment', level: 1, message: msg })));

  if (charFile) {
    const deadCharacters = extractDeadCharacters(charFile);
    const deadWarnings = checkDeadCharacters(chapterNames, deadCharacters);
    errors.push(...deadWarnings.map(msg => ({ type: 'character_dead', level: 2, message: msg })));

    const trackingNames = extractCharacterNamesFromTracking(charFile);
    const driftWarnings = checkCharacterNameDrift(chapterNames, trackingNames);
    warnings.push(...driftWarnings.map(msg => ({ type: 'name_drift', level: 1, message: msg })));

    const stateWarnings = checkCharacterState(chapterNames, charFile);
    warnings.push(...stateWarnings.map(msg => ({ type: 'character_state', level: 1, message: msg })));
  }

  // 增强检查（--full 模式）
  if (fullMode) {
    // 身份一致性检查
    const identityWarnings = checkIdentityConsistency(chapterText, charFile);
    warnings.push(...identityWarnings.map(msg => ({ type: 'identity', level: 1, message: msg })));

    // 时间线逻辑检查
    const timelineWarnings = checkTimelineLogic(chapterText, chapterFile);
    warnings.push(...timelineWarnings.map(msg => ({ type: 'timeline', level: 1, message: msg })));
  }

  // 完整性检查（仅 --full 模式）
  if (fullMode) {
    const completenessWarnings = checkTrackingCompleteness(trackingDir);
    warnings.push(...completenessWarnings.map(msg => ({ type: 'completeness', level: 1, message: msg })));
  }

  if (jsonMode) {
    const result = {
      status: errors.length > 0 || warnings.length > 0 ? 'fail' : 'pass',
      file: chapterFile,
      summary: { errors: errors.length, warnings: warnings.length },
      issues: [...errors, ...warnings],
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(errors.length > 0 ? 2 : (warnings.length > 0 ? 1 : 0));
  }

  if (warnings.length > 0) {
    console.log(`\n🚫 一致性检查发现 ${warnings.length} 个问题：`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. [${w.type}] ${w.message}`));
    process.exit(2);
  }

  console.log('✅ 一致性检查通过');
  process.exit(0);
}

main();
