#!/usr/bin/env node

/**
 * 审稿守卫脚本 v3.0
 * 在每个 Agent 执行前后运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir>  # 执行前验证输入
 *   node step-guard.js post <step> <workflow-dir>  # 执行后验证输出
 * 
 * 步骤号：
 *   01 = 读取稿件（主 agent）
 *   02 = 结构审查（子 agent）
 *   03 = 人物审查（子 agent）
 *   04 = 文笔审查（子 agent）
 *   05 = 商业审查（子 agent）
 *   06 = 一致性审查（子 agent）
 *   07 = 综合报告（主 agent）
 * 
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号 (01-07)
const workflowDir = process.argv[4] || '.workflow';

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir>');
  console.error('示例: node step-guard.js post 01 .workflow');
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
  // Step 01: 读取稿件
  '01': (wf) => {
    log('Step 01: 准备读取稿件');
    return true;
  },

  // Step 02: 结构审查 — 需要 step01 完成
  '02': (wf) => {
    if (!fileExists(path.join(wf, 'review-input.md'))) {
      error('review-input.md 不存在，Step 01 未完成');
      return false;
    }
    log('稿件已就绪，准备结构审查');
    return true;
  },

  // Step 03: 人物审查 — 需要 step01 完成
  '03': (wf) => {
    if (!fileExists(path.join(wf, 'review-input.md'))) {
      error('review-input.md 不存在，Step 01 未完成');
      return false;
    }
    log('稿件已就绪，准备人物审查');
    return true;
  },

  // Step 04: 文笔审查 — 需要 step01 完成
  '04': (wf) => {
    if (!fileExists(path.join(wf, 'review-input.md'))) {
      error('review-input.md 不存在，Step 01 未完成');
      return false;
    }
    log('稿件已就绪，准备文笔审查');
    return true;
  },

  // Step 05: 商业审查 — 需要 step01 完成
  '05': (wf) => {
    if (!fileExists(path.join(wf, 'review-input.md'))) {
      error('review-input.md 不存在，Step 01 未完成');
      return false;
    }
    log('稿件已就绪，准备商业审查');
    return true;
  },

  // Step 06: 一致性审查 — 需要 step01 完成
  '06': (wf) => {
    if (!fileExists(path.join(wf, 'review-input.md'))) {
      error('review-input.md 不存在，Step 01 未完成');
      return false;
    }
    log('稿件已就绪，准备一致性审查');
    return true;
  },

  // Step 07: 综合报告 — 需要所有审查完成
  '07': (wf) => {
    const dimensions = ['structure', 'character', 'writing', 'commercial', 'consistency'];
    const missing = dimensions.filter(d => !readJson(`review-${d}.json`));
    if (missing.length > 0) {
      error(`以下维度审查未完成: ${missing.join(', ')}`);
      return false;
    }
    log('所有维度审查已完成，准备综合报告');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step 01: 验证 review-input.md 存在
  '01': (wf) => {
    const inputFile = path.join(wf, 'review-input.md');
    if (!fileExists(inputFile)) {
      error('review-input.md 不存在');
      return false;
    }
    const content = fs.readFileSync(inputFile, 'utf-8');
    if (content.length < 50) {
      error('review-input.md 内容过短（< 50 字符）');
      return false;
    }
    log(`Step 01 输出验证通过: 稿件 ${content.length} 字符`);
    return true;
  },

  // Step 02: 验证 review-structure.json
  '02': (wf) => {
    const data = readJson('review-structure.json');
    if (!data) { error('review-structure.json 不存在'); return false; }
    if (typeof data.score !== 'number' || data.score < 1 || data.score > 10) {
      error('score 无效（应为 1-10）');
      return false;
    }
    if (!Array.isArray(data.items)) { error('items 无效'); return false; }
    if (!Array.isArray(data.issues)) { error('issues 无效'); return false; }
    log(`Step 02 输出验证通过: 结构评分 ${data.score}/10, ${data.issues.length} 个问题`);
    return true;
  },

  // Step 03: 验证 review-character.json
  '03': (wf) => {
    const data = readJson('review-character.json');
    if (!data) { error('review-character.json 不存在'); return false; }
    if (typeof data.score !== 'number' || data.score < 1 || data.score > 10) {
      error('score 无效（应为 1-10）');
      return false;
    }
    if (!Array.isArray(data.items)) { error('items 无效'); return false; }
    if (!Array.isArray(data.issues)) { error('issues 无效'); return false; }
    log(`Step 03 输出验证通过: 人物评分 ${data.score}/10, ${data.issues.length} 个问题`);
    return true;
  },

  // Step 04: 验证 review-writing.json
  '04': (wf) => {
    const data = readJson('review-writing.json');
    if (!data) { error('review-writing.json 不存在'); return false; }
    if (typeof data.score !== 'number' || data.score < 1 || data.score > 10) {
      error('score 无效（应为 1-10）');
      return false;
    }
    if (!Array.isArray(data.items)) { error('items 无效'); return false; }
    if (!Array.isArray(data.issues)) { error('issues 无效'); return false; }
    log(`Step 04 输出验证通过: 文笔评分 ${data.score}/10, ${data.issues.length} 个问题`);
    return true;
  },

  // Step 05: 验证 review-commercial.json
  '05': (wf) => {
    const data = readJson('review-commercial.json');
    if (!data) { error('review-commercial.json 不存在'); return false; }
    if (typeof data.score !== 'number' || data.score < 1 || data.score > 10) {
      error('score 无效（应为 1-10）');
      return false;
    }
    if (!Array.isArray(data.items)) { error('items 无效'); return false; }
    if (!Array.isArray(data.issues)) { error('issues 无效'); return false; }
    log(`Step 05 输出验证通过: 商业评分 ${data.score}/10, ${data.issues.length} 个问题`);
    return true;
  },

  // Step 06: 验证 review-consistency.json
  '06': (wf) => {
    const data = readJson('review-consistency.json');
    if (!data) { error('review-consistency.json 不存在'); return false; }
    if (typeof data.score !== 'number' || data.score < 1 || data.score > 10) {
      error('score 无效（应为 1-10）');
      return false;
    }
    if (!Array.isArray(data.items)) { error('items 无效'); return false; }
    if (!Array.isArray(data.issues)) { error('issues 无效'); return false; }
    log(`Step 06 输出验证通过: 一致性评分 ${data.score}/10, ${data.issues.length} 个问题`);
    return true;
  },

  // Step 07: 验证综合报告已输出
  '07': (wf) => {
    // 综合报告由主 agent 直接输出给用户，无需验证文件
    log('Step 07 输出验证通过: 综合报告已输出');
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
