#!/usr/bin/env node

/**
 * 拆文管道步骤守卫脚本
 * 在每个阶段执行前后运行，自动验证输入输出
 *
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir> [project-dir]
 *   node step-guard.js post <step> <workflow-dir>
 *
 * 步骤号：read, decompose, aggregate, settings, report, style
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
  // 原文读取
  'read': (wf) => {
    const projectDir = process.argv[5];
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    log('项目目录存在: ' + projectDir);
    return true;
  },

  // 章节拆解（子 agent）
  'decompose': (wf) => {
    const data = readJson('step-read.json');
    if (!data) {
      error('step-read.json 不存在，原文读取未完成');
      return false;
    }
    if (!data.chapter_boundaries || data.chapter_boundaries.length === 0) {
      error('chapter_boundaries 为空，章节边界未识别');
      return false;
    }
    log(`原文已就绪，${data.chapter_boundaries.length} 章待拆解`);
    return true;
  },

  // 聚合分析
  'aggregate': (wf) => {
    const data = readJson('step-decompose.json');
    if (!data) {
      error('step-decompose.json 不存在，章节拆解未完成');
      return false;
    }
    if (!data.completed_chapters || data.completed_chapters.length === 0) {
      error('completed_chapters 为空，无已完成的拆解');
      return false;
    }
    log(`拆解已完成 ${data.completed_chapters.length} 章`);
    return true;
  },

  // 设定+关系
  'settings': (wf) => {
    const data = readJson('step-aggregate.json');
    if (!data) {
      error('step-aggregate.json 不存在，聚合分析未完成');
      return false;
    }
    log('聚合分析已就绪');
    return true;
  },

  // 汇总报告
  'report': (wf) => {
    const data = readJson('step-aggregate.json');
    if (!data) {
      error('step-aggregate.json 不存在');
      return false;
    }
    log('准备生成汇总报告');
    return true;
  },

  // 文风提取
  'style': (wf) => {
    const data = readJson('step-report.json');
    if (!data) {
      error('step-report.json 不存在，汇总报告未完成');
      return false;
    }
    log('汇总报告已就绪，准备提取文风');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // 原文读取
  'read': (wf) => {
    const data = readJson('step-read.json');
    if (!data) { error('step-read.json 不存在'); return false; }
    if (!data.total_chapters || data.total_chapters === 0) { error('total_chapters 缺失或为0'); return false; }
    if (!data.chapter_boundaries || data.chapter_boundaries.length === 0) { error('chapter_boundaries 缺失'); return false; }
    log(`Step READ 输出验证通过: ${data.total_chapters} 章`);
    return true;
  },

  // 章节拆解
  'decompose': (wf) => {
    const data = readJson('step-decompose.json');
    if (!data) { error('step-decompose.json 不存在'); return false; }
    if (!data.completed_chapters) { error('completed_chapters 缺失'); return false; }
    const total = data.total_chapters || 0;
    const done = data.completed_chapters.length;
    log(`Step DECOMPOSE 输出验证通过: ${done}/${total} 章`);
    if (data.failed_chapters && data.failed_chapters.length > 0) {
      warn(`${data.failed_chapters.length} 章拆解失败，将降级处理`);
    }
    return true;
  },

  // 聚合分析
  'aggregate': (wf) => {
    const data = readJson('step-aggregate.json');
    if (!data) { error('step-aggregate.json 不存在'); return false; }
    if (!data.story_lines && !data.plot_summary) { error('story_lines 和 plot_summary 均缺失'); return false; }
    log('Step AGGREGATE 输出验证通过');
    return true;
  },

  // 设定+关系
  'settings': (wf) => {
    const data = readJson('step-settings.json');
    if (!data) { error('step-settings.json 不存在'); return false; }
    log('Step SETTINGS 输出验证通过');
    return true;
  },

  // 汇总报告
  'report': (wf) => {
    const data = readJson('step-report.json');
    if (!data) { error('step-report.json 不存在'); return false; }
    log('Step REPORT 输出验证通过');
    return true;
  },

  // 文风提取
  'style': (wf) => {
    const data = readJson('step-style.json');
    if (!data) { error('step-style.json 不存在'); return false; }
    log('Step STYLE 输出验证通过');
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
