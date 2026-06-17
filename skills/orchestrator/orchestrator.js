#!/usr/bin/env node
/**
 * orchestrator.js — 写作流程编排器
 * 
 * 用法：node orchestrator.js <项目目录> <命令> [参数]
 * 
 * 命令：
 *   init                    — 初始化项目（创建追踪文件）
 *   status                  — 查看当前进度
 *   write <章节号>          — 写指定章节（完整流程）
 *   check <章节号>          — 检查指定章节
 *   fix <章节号>            — 修复指定章节问题
 * 
 * 流程控制：
 *   代码编排整个流程，AI 只负责生成内容
 *   不需要 AI 读规则、创建任务、判断跳过
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== 配置 =====
const QUALITY_GATE_SCRIPT = path.join(__dirname, '..', '_shared', 'scripts', 'quality-gate.js');
const BANNED_WORDS = [
  '不禁', '竟然', '居然', '事实上', '实际上', '显而易见', '毫无疑问', '可想而知',
  '不言而喻', '与此同时', '值得注意的是', '需要指出的是', '不可否认',
  '嘴角勾起', '嘴角上扬', '嘴角微扬', '眼中闪过', '眼底闪过', '目光中闪过',
  '深吸一口气', '长舒一口气', '吐出一口浊气', '缓缓开口', '淡淡说道',
  '轻声说道', '仿佛', '宛如', '恰似', '犹如', '值得一提', '不得不说', '总而言之'
];

// ===== 工具函数 =====
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ===== 项目状态管理 =====
class ProjectState {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.contextFile = path.join(projectDir, '追踪', '上下文.md');
    this.repeatFile = path.join(projectDir, '追踪', '重复语句.md');
  }

  // 获取当前进度
  getStatus() {
    const context = readFile(this.contextFile);
    if (!context) {
      return { chapter: 0, status: '未初始化' };
    }

    const match = context.match(/最后完成章节：第\s*(\d+)\s*章/);
    const lastChapter = match ? parseInt(match[1]) : 0;

    return {
      chapter: lastChapter,
      nextChapter: lastChapter + 1,
      status: lastChapter > 0 ? '已就绪' : '未开始'
    };
  }

  // 获取重复语句黑名单
  getRepeatBlacklist() {
    const content = this.readFile(this.repeatFile);
    if (!content) return [];

    const lines = content.split('\n');
    const blacklist = [];
    for (const line of lines) {
      const match = line.match(/\|\s*\d+\s*\|(.+?)\|/);
      if (match) {
        blacklist.push(match[1].trim());
      }
    }
    return blacklist;
  }

  readFile(filePath) {
    return readFile(filePath);
  }
}

// ===== 质量检查器 =====
class QualityChecker {
  static checkBannedWords(content) {
    const found = [];
    for (const word of BANNED_WORDS) {
      if (content.includes(word)) {
        found.push(word);
      }
    }
    return {
      passed: found.length === 0,
      issues: found.map(w => ({ type: 'banned-word', word: w }))
    };
  }

  static checkWordCount(content, target) {
    const count = content.length;
    const passed = count >= target * 0.9;
    return {
      passed,
      count,
      target,
      percentage: Math.round((count / target) * 100)
    };
  }

  static checkRepeatSentences(content, blacklist) {
    const found = [];
    for (const phrase of blacklist) {
      if (content.includes(phrase)) {
        found.push(phrase);
      }
    }
    return {
      passed: found.length === 0,
      found
    };
  }

  static runAll(content, targetWords, blacklist) {
    const results = {
      bannedWords: this.checkBannedWords(content),
      wordCount: this.checkWordCount(content, targetWords),
      repeatSentences: this.checkRepeatSentences(content, blacklist)
    };

    results.allPassed = results.bannedWords.passed && 
                        results.wordCount.passed && 
                        results.repeatSentences.passed;
    return results;
  }
}

// ===== 追踪文件更新器 =====
class TrackingUpdater {
  static updateForeshadow(projectDir, chapterNum, newForeshadows = [], recoveredForeshadows = []) {
    const filePath = path.join(projectDir, '追踪', '伏笔.md');
    let content = readFile(filePath) || '# 伏笔\n\n## 待回收\n\n## 已回收\n';

    // 添加新伏笔
    for (const f of newForeshadows) {
      const line = `- F${String(Date.now()).slice(-4)}: ${f}（第${chapterNum}章埋设）\n`;
      content = content.replace('## 待回收\n', `## 待回收\n${line}`);
    }

    // 回收伏笔
    for (const f of recoveredForeshadows) {
      content = content.replace(`- ${f}`, `- ~~${f}~~`);
    }

    writeFile(filePath, content);
  }

  static updateTimeline(projectDir, chapterNum, events) {
    const filePath = path.join(projectDir, '追踪', '时间线.md');
    let content = readFile(filePath) || '# 时间线\n\n## 关键事件时序\n\n| 章节 | 故事时间 | 事件 | 涉及角色 |\n|------|---------|------|----------|\n';

    for (const event of events) {
      content += `| 第${chapterNum}章 | ${event.time} | ${event.description} | ${event.characters} |\n`;
    }

    writeFile(filePath, content);
  }

  static updateCharacterState(projectDir, characterName, updates) {
    const filePath = path.join(projectDir, '追踪', '角色状态.md');
    let content = readFile(filePath) || `# 角色状态\n\n## ${characterName}\n`;

    // 更新角色状态
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`(${key}：).*`, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, `$1${value}`);
      } else {
        content += `- ${key}：${value}\n`;
      }
    }

    writeFile(filePath, content);
  }

  static updateItems(projectDir, items) {
    const filePath = path.join(projectDir, '追踪', '物品.md');
    let content = readFile(filePath) || '# 物品追踪\n\n## 关键物品\n| 物品 | 当前位置 | 状态 | 最后出现章节 |\n|------|---------|------|-------------|\n';

    for (const item of items) {
      content += `| ${item.name} | ${item.location} | ${item.status} | 第${item.chapter}章 |\n`;
    }

    writeFile(filePath, content);
  }

  static updateEnvironment(projectDir, env) {
    const filePath = path.join(projectDir, '追踪', '环境.md');
    let content = '# 环境追踪\n\n## 当前环境\n';

    for (const [key, value] of Object.entries(env)) {
      content += `- ${key}：${value}\n`;
    }

    writeFile(filePath, content);
  }

  static updateRepeatSentences(projectDir, newRepeats) {
    const filePath = path.join(projectDir, '追踪', '重复语句.md');
    let content = readFile(filePath) || '# 重复语句黑名单\n\n## 黑名单列表\n\n| 序号 | 重复内容 | 出现位置 | 重复次数 | 建议替代 |\n|------|---------|---------|---------|----------|\n';

    let index = content.split('\n').filter(l => l.match(/\|\s*\d+\s*\|/)).length;

    for (const repeat of newRepeats) {
      index++;
      content += `| ${index} | ${repeat.content} | ${repeat.location} | ${repeat.count} | ${repeat.alternative} |\n`;
    }

    writeFile(filePath, content);
  }

  static updateContext(projectDir, chapterNum, summary) {
    const filePath = path.join(projectDir, '追踪', '上下文.md');
    const content = `# 写作进度

- 最后完成章节：第${chapterNum}章
- 更新时间：${new Date().toISOString().split('T')[0]}

## 当前状态

${summary}
`;
    writeFile(filePath, content);
  }
}

// ===== 主编排器 =====
class Orchestrator {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.state = new ProjectState(projectDir);
  }

  // 初始化项目
  init() {
    console.log('🔧 初始化项目...');

    // 创建必要目录
    const dirs = ['设定/角色', '设定/世界观', '大纲', '正文', '追踪'];
    for (const dir of dirs) {
      const fullPath = path.join(this.projectDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✅ 创建目录：${dir}`);
      }
    }

    // 创建追踪文件
    const trackingFiles = {
      '伏笔.md': '# 伏笔\n\n## 待回收\n\n## 已回收\n',
      '时间线.md': '# 时间线\n\n## 关键事件时序\n\n| 章节 | 故事时间 | 事件 | 涉及角色 |\n|------|---------|------|----------|\n',
      '角色状态.md': '# 角色状态\n',
      '物品.md': '# 物品追踪\n\n## 关键物品\n| 物品 | 当前位置 | 状态 | 最后出现章节 |\n|------|---------|------|-------------|\n',
      '环境.md': '# 环境追踪\n\n## 当前环境\n',
      '重复语句.md': '# 重复语句黑名单\n\n## 黑名单列表\n\n| 序号 | 重复内容 | 出现位置 | 重复次数 | 建议替代 |\n|------|---------|---------|---------|----------|\n',
      '上下文.md': '# 写作进度\n\n- 最后完成章节：第0章\n- 状态：已初始化\n'
    };

    for (const [file, content] of Object.entries(trackingFiles)) {
      const filePath = path.join(this.projectDir, '追踪', file);
      if (!fs.existsSync(filePath)) {
        writeFile(filePath, content);
        console.log(`  ✅ 创建文件：追踪/${file}`);
      }
    }

    console.log('✅ 项目初始化完成');
  }

  // 查看状态
  status() {
    const status = this.state.getStatus();
    console.log('📊 项目状态：');
    console.log(`  当前进度：第${status.chapter}章`);
    console.log(`  下一章：第${status.nextChapter}章`);
    console.log(`  状态：${status.status}`);
    return status;
  }

  // 写指定章节（完整流程）
  async writeChapter(chapterNum) {
    console.log(`\n📝 开始写第${chapterNum}章...`);
    console.log('='.repeat(50));

    // Step 1: 读取细纲
    console.log('\n📖 Step 1: 读取细纲...');
    const outlineFile = path.join(this.projectDir, '大纲', `细纲_第${String(chapterNum).padStart(3, '0')}章.md`);
    const outline = readFile(outlineFile);
    if (!outline) {
      console.log('❌ 细纲不存在，请先创建细纲');
      return false;
    }
    console.log('  ✅ 细纲已读取');

    // Step 2: 读取上一章
    console.log('\n📖 Step 2: 读取上一章...');
    const prevChapterFile = this.findChapterFile(chapterNum - 1);
    const prevContent = prevChapterFile ? readFile(prevChapterFile) : null;
    if (prevContent) {
      console.log('  ✅ 上一章已读取');
    } else {
      console.log('  ⚠️ 无上一章（可能是第一章）');
    }

    // Step 3: 读取追踪文件
    console.log('\n📖 Step 3: 读取追踪文件...');
    const trackingFiles = ['伏笔.md', '角色状态.md', '物品.md', '环境.md', '重复语句.md'];
    for (const file of trackingFiles) {
      const content = readFile(path.join(this.projectDir, '追踪', file));
      if (content) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ⚠️ ${file} 不存在`);
      }
    }

    // Step 4: 生成 prompt（输出给 AI）
    console.log('\n🤖 Step 4: 生成写作 prompt...');
    const prompt = this.generatePrompt(chapterNum, outline, prevContent);
    const promptFile = path.join(this.projectDir, `.prompt-chapter-${chapterNum}.md`);
    writeFile(promptFile, prompt);
    console.log(`  ✅ Prompt 已保存到 ${promptFile}`);
    console.log('  ⏸️ 等待 AI 生成内容...');

    // Step 5: 质量检查（AI 生成后执行）
    console.log('\n🔍 Step 5: 质量检查...');
    const chapterFile = path.join(this.projectDir, '正文', `第${String(chapterNum).padStart(3, '0')}章.md`);
    const content = readFile(chapterFile);

    if (!content) {
      console.log('  ⚠️ 正文文件不存在，跳过质量检查');
      console.log('  📝 请让 AI 根据 prompt 生成内容后保存到：');
      console.log(`     ${chapterFile}`);
      return { promptFile, chapterFile, needsAI: true };
    }

    const targetWords = this.extractTargetWords(outline);
    const blacklist = this.state.getRepeatBlacklist();
    const qualityResults = QualityChecker.runAll(content, targetWords, blacklist);

    if (!qualityResults.allPassed) {
      console.log('  ❌ 质量检查未通过：');
      if (!qualityResults.bannedWords.passed) {
        console.log(`    - 禁用词：${qualityResults.bannedWords.issues.map(i => i.word).join('、')}`);
      }
      if (!qualityResults.wordCount.passed) {
        console.log(`    - 字数：${qualityResults.wordCount.count}/${qualityResults.wordCount.target}`);
      }
      if (!qualityResults.repeatSentences.passed) {
        console.log(`    - 重复语句：${qualityResults.repeatSentences.found.join('、')}`);
      }

      // 自动修复禁用词
      console.log('\n🔧 自动修复禁用词...');
      const fixedContent = this.fixBannedWords(content);
      writeFile(chapterFile, fixedContent);
      console.log('  ✅ 禁用词已修复');
    } else {
      console.log('  ✅ 质量检查通过');
    }

    // Step 6: 更新追踪文件
    console.log('\n📝 Step 6: 更新追踪文件...');
    TrackingUpdater.updateContext(this.projectDir, chapterNum, `第${chapterNum}章完成`);
    console.log('  ✅ 上下文已更新');

    console.log('\n' + '='.repeat(50));
    console.log(`✅ 第${chapterNum}章完成！`);
    return true;
  }

  // 查找章节文件
  findChapterFile(chapterNum) {
    const dir = path.join(this.projectDir, '正文');
    if (!fs.existsSync(dir)) return null;

    const files = fs.readdirSync(dir);
    const pattern = new RegExp(`第${String(chapterNum).padStart(3, '0')}章`);
    const match = files.find(f => pattern.test(f));
    return match ? path.join(dir, match) : null;
  }

  // 提取目标字数
  extractTargetWords(outline) {
    const match = outline.match(/字数目标：(\d+)/);
    return match ? parseInt(match[1]) : 3000;
  }

  // 生成内容 prompt（输出给 AI）
  generatePrompt(chapterNum, outline, prevContent) {
    const blacklist = this.state.getRepeatBlacklist();
    const blacklistText = blacklist.length > 0 ? blacklist.join('、') : '无';

    const prevSummary = prevContent ? prevContent.slice(0, 500) + '...' : '无（第一章）';

    const prompt = `你是一个网文写手。请根据以下信息写第${chapterNum}章正文。

## 细纲
${outline}

## 上一章摘要
${prevSummary}

## 重复语句黑名单（禁止使用）
${blacklistText}

## 禁用词（禁止使用）
不禁、竟然、居然、仿佛、宛如、恰似、犹如、嘴角勾起、嘴角上扬、眼中闪过、深吸一口气、缓缓开口、淡淡说道、轻声说道、值得一提、不得不说、总而言之

## 要求
1. 严格按照细纲的情节点序列写作
2. 字数目标：${this.extractTargetWords(outline)}字
3. 不要使用黑名单中的语句
4. 不要使用禁用词
5. 直接输出正文，不要有其他内容

请写第${chapterNum}章正文：`;

    return prompt;
  }

  // 修复禁用词
  fixBannedWords(content) {
    let fixed = content;
    const replacements = {
      '深吸一口气': '胸口起伏了一下',
      '缓缓开口': '开口说',
      '淡淡说道': '说',
      '轻声说道': '低声说',
      '仿佛': '像',
      '宛如': '像',
      '恰似': '像',
      '犹如': '像',
      '嘴角勾起': '笑了一下',
      '嘴角上扬': '笑了',
      '嘴角微扬': '笑了',
      '眼中闪过': '目光一动',
      '眼底闪过': '目光一动',
      '目光中闪过': '目光一动',
      '不禁': '忍不住',
      '竟然': '居然',
      '值得一提的是': '',
      '不得不说': '',
      '总而言之': '',
      '事实上': '',
      '实际上': '',
      '显而易见': '',
      '毫无疑问': '',
      '可想而知': '',
      '不言而喻': '',
      '与此同时': '',
      '值得注意的是': '',
      '需要指出的是': '',
      '不可否认': '',
      '长舒一口气': '吐了口气',
      '吐出一口浊气': '吐了口气'
    };

    for (const [wrong, right] of Object.entries(replacements)) {
      fixed = fixed.split(wrong).join(right);
    }

    return fixed;
  }
}

// ===== 命令行入口 =====
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('用法：node orchestrator.js <项目目录> <命令> [参数]');
  console.log('');
  console.log('命令：');
  console.log('  init                    — 初始化项目');
  console.log('  status                  — 查看当前进度');
  console.log('  write <章节号>          — 写指定章节');
  console.log('  check <章节号>          — 检查指定章节');
  process.exit(1);
}

const projectDir = args[0];
const command = args[1];
const param = args[2];

const orchestrator = new Orchestrator(projectDir);

switch (command) {
  case 'init':
    orchestrator.init();
    break;
  case 'status':
    orchestrator.status();
    break;
  case 'write':
    if (!param) {
      console.log('❌ 请指定章节号');
      process.exit(1);
    }
    orchestrator.writeChapter(parseInt(param));
    break;
  case 'check':
    console.log('检查功能待实现');
    break;
  default:
    console.log(`❌ 未知命令：${command}`);
    process.exit(1);
}
