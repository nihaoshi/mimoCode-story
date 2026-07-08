#!/usr/bin/env node

/**
 * 编辑审稿守卫脚本 v1.0
 * 在每个 Agent 执行前后运行，自动验证输入输出
 *
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir>
 *   node step-guard.js post <step> <workflow-dir>
 *
 * 步骤号：
 *   01 = 读取稿件（主 agent）
 *   02-09 = 8个审查维度（子 agent）
 *   10 = 平台对标（子 agent）
 *   11 = 综合报告（主 agent）
 *
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号
const workflowDir = process.argv[4] || '.workflow';

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir>');
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

// 审查维度映射
const dimensionFiles = {
  '02': 'critic-structure.json',
  '03': 'critic-character.json',
  '04': 'critic-pleasure.json',
  '05': 'critic-hook.json',
  '06': 'critic-emotion.json',
  '07': 'critic-writing.json',
  '08': 'critic-commercial.json',
  '09': 'critic-consistency.json',
  '10': 'critic-platform.json'
};

const dimensionNames = {
  '02': '结构逻辑',
  '03': '人设一致性',
  '04': '爽点密度',
  '05': '钩子效果',
  '06': '情绪节奏',
  '07': '文笔质量',
  '08': '商业化判断',
  '09': '一致性检查',
  '10': '平台对标'
};

// ============ 前置验证 ============

const preChecks = {
  '01': (wf) => {
    log('Step 01: 准备读取稿件');
    return true;
  },

  '02': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在，Step 01 未完成');
      return false;
    }
    return true;
  },

  '03': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  '04': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  '05': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  '06': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  '07': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  '08': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  '09': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }
    return true;
  },

  // 平台对标 — 需要稿件存在
  '10': (wf) => {
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      warn('critic-input.md 不存在，跳过平台对标');
      return true;
    }
    return true;
  },

  // 综合报告 — 需要所有审查完成
  '11': (wf) => {
    const config = readJson('critic-config.json');
    if (!config) {
      error('critic-config.json 不存在');
      return false;
    }

    // 验证输入文件存在
    if (!fileExists(path.join(wf, 'critic-input.md'))) {
      error('critic-input.md 不存在');
      return false;
    }

    // 验证8个审查维度输出文件
    const requiredDims = [
      'critic-structure.json', 'critic-character.json', 'critic-pleasure.json',
      'critic-hook.json', 'critic-emotion.json', 'critic-writing.json',
      'critic-commercial.json', 'critic-consistency.json'
    ];
    const missingDims = requiredDims.filter(d => !fileExists(path.join(wf, d)));
    if (missingDims.length > 0) {
      error(`以下维度审查输出缺失: ${missingDims.join(', ')}`);
      // 如果维度缺失超过4个则阻断
      if (missingDims.length > 4) {
        error('缺失维度过多（>4个），阻断综合报告');
        return false;
      }
      warn(`仅 ${missingDims.length} 个维度缺失，允许继续但报告不完整`);
    }

    // 验证平台对标输出（如有配置）
    if (config.platform && config.platform !== '不指定' && config.platform !== '') {
      if (!fileExists(path.join(wf, 'critic-platform.json'))) {
        warn('指定了目标平台但 critic-platform.json 不存在，平台对标可能未执行');
      }
    }

    log(`综合报告前置检查通过: ${missingDims.length > 0 ? `${8 - missingDims.length}/8维度就绪` : '全部8维度就绪'}`);
    return true;
  }
};

// ============ 后置验证 ============

const postChecks = {
  '01': (wf) => {
    const inputFile = path.join(wf, 'critic-input.md');
    if (!fileExists(inputFile)) {
      error('critic-input.md 不存在');
      return false;
    }
    const content = fs.readFileSync(inputFile, 'utf-8');
    if (content.length < 20) {
      error('critic-input.md 内容过短');
      return false;
    }

    const config = readJson('critic-config.json');
    if (!config) {
      error('critic-config.json 不存在');
      return false;
    }
    if (!config.critic_type) {
      error('critic_type 缺失');
      return false;
    }

    log(`Step 01 验证通过: 稿件 ${content.length} 字符, 类型=${config.critic_type}, 平台=${config.platform || '不指定'}`);
    return true;
  },

  '02': (wf) => {
    return validateDimension(wf, '02');
  },

  '03': (wf) => {
    return validateDimension(wf, '03');
  },

  '04': (wf) => {
    return validateDimension(wf, '04');
  },

  '05': (wf) => {
    return validateDimension(wf, '05');
  },

  '06': (wf) => {
    return validateDimension(wf, '06');
  },

  '07': (wf) => {
    return validateDimension(wf, '07');
  },

  '08': (wf) => {
    return validateDimension(wf, '08');
  },

  '09': (wf) => {
    return validateDimension(wf, '09');
  },

  '10': (wf) => {
    const data = readJson('critic-platform.json');
    if (!data) {
      warn('critic-platform.json 不存在，跳过平台对标验证');
      return true;
    }
    if (!data.platform_scores && !data.recommended_platform) {
      warn('平台对标数据不完整');
      return true;
    }
    log(`Step 10 验证通过: 推荐平台=${data.recommended_platform || '未推荐'}`);
    return true;
  },

  '11': (wf) => {
    // 验证至少有一些维度有实际输出
    const dimFiles = [
      'critic-structure.json', 'critic-character.json', 'critic-pleasure.json',
      'critic-hook.json', 'critic-emotion.json', 'critic-writing.json',
      'critic-commercial.json', 'critic-consistency.json'
    ];

    const existing = dimFiles.filter(d => fileExists(path.join(wf, d)));
    if (existing.length === 0) {
      error('所有维度审查输出均不存在，综合报告为空');
      return false;
    }

    // 验证至少有一些非空问题列表
    let totalIssues = 0;
    let hasP0 = false;
    for (const f of existing) {
      const data = readJson(f);
      if (data && Array.isArray(data.issues)) {
        totalIssues += data.issues.length;
        if (data.issues.some(i => i.priority === 'P0')) hasP0 = true;
      }
    }

    if (totalIssues === 0 && existing.length >= 6) {
      warn(`所有 ${existing.length} 个维度均无问题列表，审查可能不够严格`);
    }

    log(`Step 11 验证通过: ${existing.length}/8维度已审查, 共${totalIssues}个问题${hasP0 ? '（含P0）' : ''}`);
    return true;
  }
};

// 审查维度通用验证
function validateDimension(wf, stepNum) {
  const filename = dimensionFiles[stepNum];
  const dimName = dimensionNames[stepNum];

  if (!filename) {
    return true;
  }

  const data = readJson(filename);
  if (!data) {
    error(`${filename} 不存在`);
    return false;
  }

  // 验证必要字段
  if (typeof data.score !== 'number' || data.score < 1 || data.score > 10) {
    warn(`${dimName}: score 无效（应为 1-10），当前=${data.score}`);
  }

  if (!Array.isArray(data.issues)) {
    warn(`${dimName}: issues 无效`);
  } else {
    // 检查是否所有问题都有 location
    const missingLocation = data.issues.filter(i => !i.location);
    if (missingLocation.length > 0) {
      warn(`${dimName}: ${missingLocation.length} 个问题缺少 location`);
    }
  }

  log(`Step ${stepNum} 验证通过: ${dimName} 评分 ${data.score}/10, ${data.issues ? data.issues.length : 0} 个问题`);
  return true;
}

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
    log(`Step ${step} 前置验证通过`);
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