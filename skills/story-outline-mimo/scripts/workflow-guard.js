#!/usr/bin/env node

/**
 * 全书大纲生成 - 工作流守卫脚本
 * 在每个子 agent 执行前后运行，自动验证输入输出
 *
 * 用法：
 *   node workflow-guard.js pre  <step> <workflow-dir> <project-dir>
 *   node workflow-guard.js post <step> <workflow-dir>
 *
 * 步骤号：01, 02, 03, 04
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号
const workflowDir = process.argv[4] || '.workflow';
const projectDir = process.argv[5] || '.';

if (!action || !step) {
  console.error('用法: node workflow-guard.js <pre|post> <step> <workflow-dir> <project-dir>');
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

// 列出目录下的 md 文件
function listMdFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dirPath, f));
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Step 01: 读取设定 — 需要项目目录存在
  '01': (wf) => {
    if (!fileExists(projectDir)) {
      error('项目目录不存在: ' + projectDir);
      return false;
    }
    const settingsDir = path.join(projectDir, '设定');
    if (!fileExists(settingsDir)) {
      error('设定目录不存在: ' + settingsDir);
      return false;
    }
    log('项目目录和设定目录存在');
    return true;
  },

  // Step 02: 生成全书大纲 — 需要 step01 完成
  '02': (wf) => {
    const s01 = readJson('step01-settings.json');
    if (!s01) {
      error('step01-settings.json 不存在，设定读取未完成');
      return false;
    }
    if (!s01.genre && !s01.worldview) {
      error('设定数据为空，至少需要题材定位或世界观');
      return false;
    }
    log('设定已就绪');
    return true;
  },

  // Step 03: 生成卷纲 — 需要 step02 完成
  '03': (wf) => {
    const s02 = readJson('step02-outline.json');
    if (!s02) {
      error('step02-outline.json 不存在，全书大纲未完成');
      return false;
    }
    if (!s02.volume_count || s02.volume_count < 1) {
      error('卷数无效: ' + (s02.volume_count || '未设置'));
      return false;
    }
    const outlineFile = path.join(projectDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) {
      error('大纲文件不存在: ' + outlineFile);
      return false;
    }
    log(`全书大纲已就绪: ${s02.volume_count}卷`);
    return true;
  },

  // Step 04: 输出报告 — 需要 step03 完成
  '04': (wf) => {
    const s03 = readJson('step03-volume-meta.json');
    if (!s03) {
      error('step03-volume-meta.json 不存在，卷纲生成未完成');
      return false;
    }
    log('卷纲已就绪');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step 01: 验证设定读取结果
  '01': (wf) => {
    const data = readJson('step01-settings.json');
    if (!data) { error('step01-settings.json 不存在'); return false; }
    if (!data.characters || !Array.isArray(data.characters)) { error('characters 缺失或无效'); return false; }
    if (!data.worldview) { warn('worldview 缺失'); }
    log(`Step 01 输出验证通过: ${data.characters.length}个角色, 题材=${data.genre || '未设置'}`);
    return true;
  },

  // Step 02: 验证大纲文件
  '02': (wf) => {
    const data = readJson('step02-outline.json');
    if (!data) { error('step02-outline.json 不存在'); return false; }
    if (!data.title) { error('title 缺失'); return false; }
    if (!data.volume_count || data.volume_count < 1) { error('volume_count 无效'); return false; }
    if (!data.total_chapters || data.total_chapters < 1) { error('total_chapters 无效'); return false; }

    const outlineFile = path.join(projectDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) { error('大纲/大纲.md 不存在'); return false; }

    log(`Step 02 输出验证通过: ${data.title}, ${data.volume_count}卷, ${data.total_chapters}章, 约${data.total_words || '?'}万字`);
    return true;
  },

  // Step 03: 验证卷纲文件
  '03': (wf) => {
    const data = readJson('step03-volume-meta.json');
    if (!data) { error('step03-volume-meta.json 不存在'); return false; }
    if (!Array.isArray(data.volumes)) { error('volumes 无效'); return false; }

    for (const vol of data.volumes) {
      const volFile = path.join(projectDir, '大纲', `卷纲_第${vol.number}卷.md`);
      if (!fileExists(volFile)) {
        error(`卷纲文件不存在: ${volFile}`);
        return false;
      }
    }

    log(`Step 03 输出验证通过: ${data.volumes.length}个卷纲文件`);
    return true;
  },

  // Step 04: 验证报告输出
  '04': (wf) => {
    const s02 = readJson('step02-outline.json');
    const s03 = readJson('step03-volume-meta.json');
    if (!s02 || !s03) { error('前置步骤数据缺失'); return false; }

    // 最终检查所有大纲文件
    const outlineFile = path.join(projectDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) { error('大纲/大纲.md 不存在'); return false; }

    for (const vol of s03.volumes) {
      const volFile = path.join(projectDir, '大纲', `卷纲_第${vol.number}卷.md`);
      if (!fileExists(volFile)) { error(`卷纲文件不存在: ${volFile}`); return false; }
    }

    log(`Step 04 输出验证通过: 全部大纲文件就绪`);
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
