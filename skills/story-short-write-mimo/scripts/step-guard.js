#!/usr/bin/env node

/**
 * 短篇写作步骤守卫脚本 v3.0
 * 在每个 Agent 执行前后运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir> [project-dir]  # 执行前验证输入
 *   node step-guard.js post <step> <workflow-dir>                # 执行后验证输出
 * 
 * 步骤号：ctx, prep, write, check, track
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号 (ctx, prep, write, check, track)
const workflowDir = process.argv[4] || '.workflow';

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir> [project-dir]');
  console.error('示例: node step-guard.js post prep .workflow');
  console.error('步骤号: ctx, prep, write, check, track');
  process.exit(1);
}

// 颜色输出
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}[GUARD]${RESET} ${msg}`); }
function warn(msg) { console.log(`${YELLOW}[WARN]${RESET} ${msg}`); }
function error(msg) { console.error(`${RED}[BLOCK]${RESET} ${msg}`); }

// 确保 workflow 目录存在
function ensureWorkflowDir() {
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
    log(`创建 workflow 目录: ${workflowDir}`);
  }
}

// 读取 JSON 文件
function readJson(filename) {
  const filePath = path.join(workflowDir, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Step ctx: 需要项目目录
  'ctx': (wf) => {
    const projectDir = process.argv[5];
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    log('项目目录存在: ' + projectDir);
    return true;
  },

  // Step prep: 需要设定.md和小节大纲.md存在
  'prep': (wf) => {
    const projectDir = process.argv[5] || '.';
    const settingFile = path.join(projectDir, '设定.md');
    const outlineFile = path.join(projectDir, '小节大纲.md');
    
    if (!fileExists(settingFile)) {
      error('设定.md不存在，请先完成Step 1');
      return false;
    }
    if (!fileExists(outlineFile)) {
      error('小节大纲.md不存在，请先完成Step 1');
      return false;
    }
    log('设定和大纲就绪');
    return true;
  },

  // Step write: 需要step-prep.json存在
  'write': (wf) => {
    const prep = readJson('step-prep.json');
    if (!prep) {
      error('step-prep.json不存在，请先完成Step 2');
      return false;
    }
    if (!prep.word_count_target) {
      error('step-prep.json缺少word_count_target');
      return false;
    }
    log(`准备写作，目标字数: ${prep.word_count_target}`);
    return true;
  },

  // Step check: 需要正文.md存在
  'check': (wf) => {
    const projectDir = process.argv[5] || '.';
    const textFile = path.join(projectDir, '正文.md');
    
    if (!fileExists(textFile)) {
      error('正文.md不存在，请先完成Step 3');
      return false;
    }
    
    // 检查字数
    const content = fs.readFileSync(textFile, 'utf-8');
    const charCount = content.replace(/\s/g, '').length;
    log(`正文已就绪，当前字数: ${charCount}`);
    return true;
  },

  // Step track: 需要检测报告存在且通过
  'track': (wf) => {
    const report = readJson('step-check-report.json');
    if (!report) {
      error('step-check-report.json不存在，请先完成Step 4');
      return false;
    }
    
    const totalIssues = (report.block_count || 0) + (report.warn_count || 0);
    if (totalIssues > 0) {
      error(`仍有 ${totalIssues} 个问题未修复，不能进入追踪更新`);
      return false;
    }
    
    log('质量检测通过，可以更新追踪');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step ctx: 验证设定.md和小节大纲.md已创建
  'ctx': (wf) => {
    const projectDir = process.argv[5] || '.';
    const settingFile = path.join(projectDir, '设定.md');
    const outlineFile = path.join(projectDir, '小节大纲.md');
    
    if (!fileExists(settingFile)) { error('设定.md未创建'); return false; }
    if (!fileExists(outlineFile)) { error('小节大纲.md未创建'); return false; }
    
    log('Step ctx 输出验证通过: 设定和大纲已创建');
    return true;
  },

  // Step prep: 验证step-prep.json已创建
  'prep': (wf) => {
    const data = readJson('step-prep.json');
    if (!data) { error('step-prep.json未创建'); return false; }
    if (!data.word_count_target) { error('step-prep.json缺少word_count_target'); return false; }
    if (!Array.isArray(data.banned_words)) { error('step-prep.json缺少banned_words'); return false; }
    
    log(`Step prep 输出验证通过: 目标${data.word_count_target}字, ${data.banned_words.length}个禁用词`);
    return true;
  },

  // Step write: 验证正文.md已创建且字数达标
  'write': (wf) => {
    const projectDir = process.argv[5] || '.';
    const textFile = path.join(projectDir, '正文.md');
    
    if (!fileExists(textFile)) { error('正文.md未创建'); return false; }
    
    const content = fs.readFileSync(textFile, 'utf-8');
    const charCount = content.replace(/\s/g, '').length;
    
    const prep = readJson('step-prep.json');
    const target = prep ? prep.word_count_target : 8000;
    
    if (charCount < target * 0.9) {
      error(`字数不足: ${charCount}/${target} (低于90%)`);
      return false;
    }
    
    log(`Step write 输出验证通过: ${charCount}字`);
    return true;
  },

  // Step check: 验证step-check-report.json已创建
  'check': (wf) => {
    const data = readJson('step-check-report.json');
    if (!data) { error('step-check-report.json未创建'); return false; }
    if (!Array.isArray(data.checks)) { error('checks无效'); return false; }
    if (!['BLOCK', 'WARN', 'PASS'].includes(data.overall)) { error('overall无效'); return false; }
    
    const totalIssues = (data.block_count || 0) + (data.warn_count || 0);
    log(`Step check 输出验证通过: ${data.overall}, ${data.block_count}个BLOCK, ${data.warn_count}个WARN`);
    
    if (totalIssues > 0) {
      warn(`检测到 ${totalIssues} 个问题，必须修复`);
    }
    return true;
  },

  // Step track: 验证追踪文件已更新
  'track': (wf) => {
    const trackingFiles = [
      '追踪/伏笔.md',
      '追踪/时间线.md',
      '追踪/角色状态.md',
      '追踪/物品.md',
      '追踪/环境.md',
      '追踪/上下文.md'
    ];
    
    for (const file of trackingFiles) {
      if (!fileExists(file)) { error('追踪文件不存在: ' + file); return false; }
    }
    
    log('Step track 输出验证通过: 所有追踪文件已更新');
    return true;
  }
};

// ============ 主逻辑 ============

ensureWorkflowDir();

if (action === 'pre') {
  log(`=== 前置验证: Step ${step} ===`);
  const checker = preChecks[step];
  if (!checker) {
    warn(`Step ${step} 无前置验证`);
    process.exit(0);
  }
  const passed = checker(workflowDir);
  if (passed) {
    log(`Step ${step} 前置验证通过，可以执行`);
    process.exit(0);
  } else {
    error(`Step ${step} 前置验证失败或应跳过`);
    process.exit(1);
  }
} else if (action === 'post') {
  log(`=== 后置验证: Step ${step} ===`);
  const checker = postChecks[step];
  if (!checker) {
    warn(`Step ${step} 无后置验证`);
    process.exit(0);
  }
  const passed = checker(workflowDir);
  if (passed) {
    log(`Step ${step} 后置验证通过`);
    process.exit(0);
  } else {
    error(`Step ${step} 后置验证失败`);
    process.exit(1);
  }
} else {
  error('未知操作: ' + action + ' (应为 pre 或 post)');
  process.exit(1);
}
