#!/usr/bin/env node

/**
 * 审计守卫脚本
 * 在每个审计维度的子 agent 执行前后运行，验证输入输出
 * 
 * 用法：
 *   node audit-guard.js pre  <dimension> <workflow-dir> <project-dir>
 *   node audit-guard.js post <dimension> <workflow-dir>
 * 
 * 维度：role, item, env, timeline, foreshadow
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2];
const dimension = process.argv[3];
const workflowDir = process.argv[4] || '.workflow';

const VALID_DIMENSIONS = ['role', 'item', 'env', 'timeline', 'foreshadow'];

if (!action || !dimension) {
  console.error('用法: node audit-guard.js <pre|post> <dimension> <workflow-dir> <project-dir>');
  console.error(`维度: ${VALID_DIMENSIONS.join(', ')}`);
  process.exit(1);
}

if (!VALID_DIMENSIONS.includes(dimension)) {
  console.error(`无效维度: ${dimension} (应为 ${VALID_DIMENSIONS.join(', ')})`);
  process.exit(1);
}

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}[AUDIT-GUARD]${RESET} ${msg}`); }
function warn(msg) { console.log(`${YELLOW}[WARN]${RESET} ${msg}`); }
function error(msg) { console.error(`${RED}[BLOCK]${RESET} ${msg}`); }

function ensureWorkflowDir() {
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
    log(`创建 workflow 目录: ${workflowDir}`);
  }
}

function readJson(filename) {
  const filePath = path.join(workflowDir, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

const OUTPUT_FILES = {
  role: 'audit-role.json',
  item: 'audit-item.json',
  env: 'audit-env.json',
  timeline: 'audit-timeline.json',
  foreshadow: 'audit-foreshadow.json',
};

const DIMENSION_NAMES = {
  role: '角色审计',
  item: '物品审计',
  env: '环境审计',
  timeline: '时间线审计',
  foreshadow: '伏笔审计',
};

// ============ 前置验证 (pre) ============

function preCheck(dim, wf) {
  const ctx = readJson('audit-ctx.json');
  if (!ctx) {
    error('audit-ctx.json 不存在，审计上下文未准备');
    return false;
  }

  if (!ctx.project_dir || !fileExists(ctx.project_dir)) {
    error('项目目录不存在: ' + (ctx.project_dir || '未指定'));
    return false;
  }

  if (!ctx.tracking_files) {
    error('tracking_files 缺失');
    return false;
  }

  log(`${DIMENSION_NAMES[dim]} 前置验证通过`);
  log(`  项目: ${ctx.project_dir}`);
  log(`  章节数: ${ctx.chapter_count || '未知'}`);
  return true;
}

// ============ 后置验证 (post) ============

function postCheck(dim, wf) {
  const outputFile = OUTPUT_FILES[dim];
  const data = readJson(outputFile);
  if (!data) {
    error(`${outputFile} 不存在`);
    return false;
  }

  if (!data.status) {
    error('status 字段缺失');
    return false;
  }

  const issues = (data.blockers ? data.blockers.length : 0) + (data.warnings ? data.warnings.length : 0);
  log(`${DIMENSION_NAMES[dim]} 后置验证通过: ${data.status}, ${issues} 个问题`);
  return true;
}

// ============ 主逻辑 ============

ensureWorkflowDir();

if (action === 'pre') {
  log(`=== 前置验证: ${DIMENSION_NAMES[dimension]} ===`);
  const passed = preCheck(dimension, workflowDir);
  process.exit(passed ? 0 : 1);
} else if (action === 'post') {
  log(`=== 后置验证: ${DIMENSION_NAMES[dimension]} ===`);
  const passed = postCheck(dimension, workflowDir);
  process.exit(passed ? 0 : 1);
} else {
  error('未知操作: ' + action + ' (应为 pre 或 post)');
  process.exit(1);
}
