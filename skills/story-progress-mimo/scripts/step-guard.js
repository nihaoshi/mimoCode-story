#!/usr/bin/env node

/**
 * 步骤守卫脚本
 * 在每个步骤执行前后运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir> <project-dir>
 *   node step-guard.js post <step> <workflow-dir>
 * 
 * 步骤号：01, 02, 03, 04, 05
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号
const workflowDir = process.argv[4] || '.workflow';
const projectDir = process.argv[5];

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir> [project-dir]');
  process.exit(1);
}

// 颜色输出
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}[PROGRESS-GUARD]${RESET} ${msg}`); }
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

// 检查目录是否有文件
function dirHasFiles(dirPath, pattern) {
  if (!fs.existsSync(dirPath)) return false;
  try {
    const files = fs.readdirSync(dirPath);
    if (pattern) {
      return files.some(f => pattern.test(f));
    }
    return files.length > 0;
  } catch (e) {
    return false;
  }
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Step 01: 读取当前进度
  '01': (wf) => {
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    log('项目目录存在: ' + projectDir);

    // 检查追踪目录
    const trackingDir = path.join(projectDir, '追踪');
    if (!fileExists(trackingDir)) {
      warn('追踪目录不存在，将创建');
      fs.mkdirSync(trackingDir, { recursive: true });
    }

    // 检查正文目录
    const chapterDir = path.join(projectDir, '正文');
    if (!dirHasFiles(chapterDir, /第\d+章/)) {
      warn('正文目录为空或不存在');
    }

    log('Step 01 前置验证通过');
    return true;
  },

  // Step 02: 生成细纲
  '02': (wf) => {
    const current = readJson('progress-current.json');
    if (!current) {
      error('progress-current.json 不存在，Step 01 未完成');
      return false;
    }
    if (!current.latest_chapter && current.latest_chapter !== 0) {
      error('latest_chapter 缺失');
      return false;
    }
    log(`当前最新章节: 第${current.latest_chapter}章，准备生成后续细纲`);

    // 检查大纲目录
    const outlineDir = path.join(projectDir || '.', '大纲');
    if (!fileExists(outlineDir)) {
      warn('大纲目录不存在，将创建');
      fs.mkdirSync(outlineDir, { recursive: true });
    }

    return true;
  },

  // Step 03: 跨卷追踪整理
  '03': (wf) => {
    const current = readJson('progress-current.json');
    if (!current) {
      error('progress-current.json 不存在，Step 01 未完成');
      return false;
    }
    log('Step 03 前置验证通过');
    return true;
  },

  // Step 04: 更新所有配置文件
  '04': (wf) => {
    const current = readJson('progress-current.json');
    if (!current) {
      error('progress-current.json 不存在，Step 01 未完成');
      return false;
    }
    const crossVolume = readJson('progress-cross-volume.json');
    if (!crossVolume) {
      error('progress-cross-volume.json 不存在，Step 03 未完成');
      return false;
    }
    log('Step 04 前置验证通过');
    return true;
  },

  // Step 05: 输出报告
  '05': (wf) => {
    const current = readJson('progress-current.json');
    if (!current) {
      error('progress-current.json 不存在，Step 01 未完成');
      return false;
    }
    log('Step 05 前置验证通过');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step 01: 读取当前进度
  '01': (wf) => {
    const data = readJson('progress-current.json');
    if (!data) {
      error('progress-current.json 不存在');
      return false;
    }
    if (!data.latest_chapter && data.latest_chapter !== 0) {
      error('latest_chapter 缺失');
      return false;
    }
    if (!data.total_words && data.total_words !== 0) {
      error('total_words 缺失');
      return false;
    }
    log(`Step 01 输出验证通过: 第${data.latest_chapter}章，${data.total_words}字`);
    return true;
  },

  // Step 02: 生成细纲
  '02': (wf) => {
    const current = readJson('progress-current.json');
    if (!current) {
      error('progress-current.json 不存在');
      return false;
    }
    const latest = current.latest_chapter;
    const outlineDir = path.join(projectDir || '.', '大纲');

    // 检查5个细纲文件是否生成
    let generated = 0;
    for (let i = 1; i <= 5; i++) {
      const chapterNum = latest + i;
      const filename = `细纲_第${chapterNum}章.md`;
      const filepath = path.join(outlineDir, filename);
      if (fileExists(filepath)) {
        generated++;
      } else {
        warn(`细纲文件缺失: ${filename}`);
      }
    }

    if (generated === 0) {
      error('未生成任何细纲文件');
      return false;
    }
    log(`Step 02 输出验证通过: 生成 ${generated}/5 个细纲`);
    return true;
  },

  // Step 03: 跨卷追踪整理
  '03': (wf) => {
    const data = readJson('progress-cross-volume.json');
    if (!data) {
      error('progress-cross-volume.json 不存在');
      return false;
    }
    if (!data.foreshadow_health) {
      error('foreshadow_health 缺失');
      return false;
    }
    if (!data.character_health) {
      error('character_health 缺失');
      return false;
    }
    const issueCount = (data.issues || []).length;
    log(`Step 03 输出验证通过: ${issueCount} 个问题`);
    return true;
  },

  // Step 04: 更新所有配置文件
  '04': (wf) => {
    // 检查追踪/上下文.md 是否存在
    const ctxFile = path.join(projectDir || '.', '追踪', '上下文.md');
    if (!fileExists(ctxFile)) {
      error('追踪/上下文.md 不存在');
      return false;
    }
    log('Step 04 输出验证通过: 追踪文件已更新');
    return true;
  },

  // Step 05: 输出报告
  '05': (wf) => {
    const data = readJson('progress-report.json');
    // 报告可能只在终端展示，不强制要求 JSON 文件
    log('Step 05 输出验证通过');
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
