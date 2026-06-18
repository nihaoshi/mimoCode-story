#!/usr/bin/env node

/**
 * 质量检查守卫脚本
 * 在每个子 agent 执行前后运行，验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir> [project-dir]
 *   node step-guard.js post <step> <workflow-dir>
 * 
 * 步骤号：read, detect, fix, recheck
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2];
const step = process.argv[3];
const workflowDir = process.argv[4] || '.workflow';

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir> [project-dir]');
  process.exit(1);
}

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}[GUARD]${RESET} ${msg}`); }
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

// ============ 前置验证 (pre) ============

const preChecks = {
  'read': (wf) => {
    const projectDir = process.argv[5];
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    log('项目目录存在: ' + projectDir);
    return true;
  },

  'detect': (wf) => {
    const data = readJson('step-read.json');
    if (!data || !data.chapter_file) {
      error('step-read.json 不存在或缺少 chapter_file');
      return false;
    }
    if (!fileExists(data.chapter_file)) {
      error('章节文件不存在: ' + data.chapter_file);
      return false;
    }
    log(`章节文件就绪: ${data.chapter_file}`);
    return true;
  },

  'fix': (wf) => {
    const report = readJson('step-detect-report.json');
    if (!report) {
      error('step-detect-report.json 不存在');
      return false;
    }
    const totalIssues = (report.blockers ? report.blockers.length : 0) + (report.warnings ? report.warnings.length : 0);
    if (totalIssues === 0) {
      warn('无问题需要修复，应跳过 fix 步骤');
      return false;
    }
    log(`检测到 ${totalIssues} 个问题，准备修复`);
    return true;
  },

  'recheck': (wf) => {
    const fixLog = readJson('step-fix-log.json');
    if (!fixLog) {
      error('step-fix-log.json 不存在');
      return false;
    }
    log('修复完成，准备复查');
    return true;
  },
};

// ============ 后置验证 (post) ============

const postChecks = {
  'read': (wf) => {
    const data = readJson('step-read.json');
    if (!data) { error('step-read.json 不存在'); return false; }
    if (!data.chapter_file) { error('chapter_file 缺失'); return false; }
    log(`读取完成: ${data.chapter_file}`);
    return true;
  },

  'detect': (wf) => {
    const report = readJson('step-detect-report.json');
    if (!report) { error('step-detect-report.json 不存在'); return false; }
    if (!report.status) { error('status 缺失'); return false; }
    const blockers = report.blockers ? report.blockers.length : 0;
    const warnings = report.warnings ? report.warnings.length : 0;
    log(`检测完成: ${blockers} 阻断, ${warnings} 警告`);
    return true;
  },

  'fix': (wf) => {
    const fixLog = readJson('step-fix-log.json');
    if (!fixLog) { error('step-fix-log.json 不存在'); return false; }
    log(`修复完成: ${fixLog.fixed_count || 0} 项`);
    return true;
  },

  'recheck': (wf) => {
    const report = readJson('step-recheck-report.json');
    if (!report) { error('step-recheck-report.json 不存在'); return false; }
    const blockers = report.blockers ? report.blockers.length : 0;
    if (blockers > 0) { error(`复查仍有 ${blockers} 个阻断项`); return false; }
    log('复查通过');
    return true;
  },
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
  process.exit(passed ? 0 : 1);
} else if (action === 'post') {
  log(`=== 后置验证: Step ${step} ===`);
  const checker = postChecks[step];
  if (!checker) {
    warn(`Step ${step} 无后置验证`);
    process.exit(0);
  }
  const passed = checker(workflowDir);
  process.exit(passed ? 0 : 1);
} else {
  error('未知操作: ' + action + ' (应为 pre 或 post)');
  process.exit(1);
}
