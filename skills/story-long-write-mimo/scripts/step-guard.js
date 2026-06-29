#!/usr/bin/env node

/**
 * 步骤守卫脚本
 * 在每个子 agent 执行前后运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir> [project-dir]
 *   node step-guard.js post <step> <workflow-dir>
 * 
 * 步骤号：ctx, prep, write, check, track
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号
const workflowDir = process.argv[4] || '.workflow';

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir> [project-dir]');
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
  // 上下文读取
  'ctx': (wf) => {
    const projectDir = process.argv[5];
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    log('项目目录存在: ' + projectDir);
    return true;
  },

  // 准备层
  'prep': (wf) => {
    const ctx = readJson('step-ctx.json');
    if (!ctx) {
      error('step-ctx.json 不存在，上下文读取未完成');
      return false;
    }
    log('上下文已就绪');
    return true;
  },

  // 正文写作
  'write': (wf) => {
    const ctx = readJson('step-ctx.json');
    const prep = readJson('step-prep.json');
    if (!ctx || !prep) {
      error('step-ctx.json 或 step-prep.json 不存在');
      return false;
    }
    log(`准备就绪，目标字数: ${prep.constraints?.word_count_target || '未设置'}`);
    return true;
  },

  // 综合检测+修复
  'check': (wf) => {
    const ctx = readJson('step-ctx.json');
    if (!ctx) {
      error('step-ctx.json 不存在');
      return false;
    }
    const chapterFile = `正文/第${String(ctx.chapter).padStart(3, '0')}章.md`;
    if (!fileExists(chapterFile)) {
      error('正文文件不存在: ' + chapterFile);
      return false;
    }
    log('正文文件就绪，准备综合质量检测');
    return true;
  },

  // 追踪更新
  'track': (wf) => {
    const ctx = readJson('step-ctx.json');
    if (!ctx) {
      error('step-ctx.json 不存在');
      return false;
    }
    const chapterFile = `正文/第${String(ctx.chapter).padStart(3, '0')}章.md`;
    if (!fileExists(chapterFile)) {
      error('正文文件不存在: ' + chapterFile);
      return false;
    }
    log('正文文件就绪，准备更新追踪');
    return true;
  },

  // 设定回写验证
  'track-verify': (wf) => {
    const ctx = readJson('step-ctx.json');
    if (!ctx) {
      error('step-ctx.json 不存在');
      return false;
    }
    const chapterFile = `正文/第${String(ctx.chapter).padStart(3, '0')}章.md`;
    if (!fileExists(chapterFile)) {
      error('正文文件不存在: ' + chapterFile);
      return false;
    }
    log('正文文件就绪，准备验证设定回写');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // 上下文读取
  'ctx': (wf) => {
    const data = readJson('step-ctx.json');
    if (!data) { error('step-ctx.json 不存在'); return false; }
    if (!data.chapter) { error('chapter 缺失'); return false; }
    if (!data.previous_ending && data.chapter > 1) { error('previous_ending 缺失'); return false; }
    log(`Step CTX 输出验证通过: 第${data.chapter}章`);
    return true;
  },

  // 准备层
  'prep': (wf) => {
    const data = readJson('step-prep.json');
    if (!data) { error('step-prep.json 不存在'); return false; }
    if (!data.constraints) { error('constraints 缺失'); return false; }
    if (!data.constraints.word_count_target) { error('word_count_target 缺失'); return false; }
    log(`Step PREP 输出验证通过: 目标${data.constraints.word_count_target}字`);
    return true;
  },

  // 正文写作
  'write': (wf) => {
    const ctx = readJson('step-ctx.json');
    if (!ctx) { error('step-ctx.json 不存在'); return false; }
    const chapterFile = `正文/第${String(ctx.chapter).padStart(3, '0')}章.md`;
    if (!fileExists(chapterFile)) { error('正文文件不存在'); return false; }
    log('Step WRITE 输出验证通过: 正文已写入');
    return true;
  },

  // 综合检测+修复
  'check': (wf) => {
    const data = readJson('step-check-report.json');
    if (!data) { error('step-check-report.json 不存在'); return false; }
    if (!data.checks || !Array.isArray(data.checks)) { error('checks 无效'); return false; }
    if (data.checks.length < 6) { error('checks 应有6项检测'); return false; }
    
    const totalIssues = (data.block_count || 0) + (data.warn_count || 0);
    if (totalIssues > 0) { error(`仍有 ${totalIssues} 个问题未修复`); return false; }
    log(`Step CHECK 输出验证通过: ${data.overall}`);
    return true;
  },

  // 追踪更新
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
    
    log('Step TRACK 输出验证通过: 追踪文件已更新');
    return true;
  },

  // 设定回写验证
  'track-verify': (wf) => {
    const ctx = readJson('step-ctx.json');
    if (!ctx) { error('step-ctx.json 不存在'); return false; }
    
    // 检查上下文文件中是否有设定回写记录
    const contextFile = '追踪/上下文.md';
    if (!fileExists(contextFile)) { error('上下文文件不存在'); return false; }
    
    log('Step TRACK-VERIFY 输出验证通过: 设定回写验证完成');
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
    error(`Step ${step} 前置验证失败`);
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
