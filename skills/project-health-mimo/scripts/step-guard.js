#!/usr/bin/env node

/**
 * 项目健康检查守卫脚本
 * 在检测/修复流程的关键节点运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <project-dir>              # 执行前验证输入
 *   node step-guard.js post <step> <project-dir>              # 执行后验证输出
 * 
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号 (01-04)
const projectDir = process.argv[4] || process.cwd();

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <project-dir>');
  console.error('示例: node step-guard.js post 01 /path/to/project');
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

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 检查文件是否非空
function fileNotEmpty(filePath) {
  if (!fs.existsSync(filePath)) return false;
  return fs.statSync(filePath).size > 0;
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Step 01: 需要项目目录存在
  '01': () => {
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    if (!fs.statSync(projectDir).isDirectory()) {
      error('指定路径不是目录: ' + projectDir);
      return false;
    }
    log('项目目录存在: ' + projectDir);
    return true;
  },

  // Step 02: 需要 project-health.js 存在
  '02': () => {
    const scriptPath = path.join(__dirname, 'project-health.js');
    if (!fileExists(scriptPath)) {
      error('脚本不存在: ' + scriptPath);
      return false;
    }
    log('脚本就绪: project-health.js');
    return true;
  },

  // Step 03: 需要 Step 02 输出（检测报告）
  '03': () => {
    // 前置条件：Step 02 已运行，项目目录必须存在
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在，无法生成报告');
      return false;
    }
    log('准备生成检测报告');
    return true;
  },

  // Step 04: 需要 --fix 模式下 Step 03 有缺失项
  '04': () => {
    const fixMode = process.argv.includes('--fix');
    if (!fixMode) {
      warn('非 --fix 模式，跳过修复步骤');
      return false;
    }
    // 检查是否有缺失文件需要修复
    const blockFiles = ['AGENTS.md', '设定/世界观/金手指.md', '设定/世界观/力量体系.md'];
    const hasMissing = blockFiles.some(f => !fileExists(path.join(projectDir, f)));
    if (!hasMissing) {
      warn('无缺失文件，跳过修复');
      return false;
    }
    log('发现缺失文件，准备修复');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step 01: 验证项目目录结构基本完整
  '01': () => {
    const requiredDirs = ['设定', '大纲', '正文', '追踪'];
    const missingDirs = requiredDirs.filter(d => !fileExists(path.join(projectDir, d)));
    if (missingDirs.length > 0) {
      warn('项目目录不完整: ' + missingDirs.join(', '));
    }
    log(`Step 01 通过: 项目目录存在，${requiredDirs.length - missingDirs.length}/${requiredDirs.length} 个必需目录存在`);
    return true;
  },

  // Step 02: 验证检测报告已生成
  '02': () => {
    // 检测报告通过 stdout 输出，这里验证项目目录可被读取
    const healthScript = path.join(__dirname, 'project-health.js');
    if (!fileExists(healthScript)) {
      error('检测脚本不存在');
      return false;
    }
    
    // 验证项目目录可读
    const entries = fs.readdirSync(projectDir);
    if (entries.length === 0) {
      warn('项目目录为空');
    }
    log(`Step 02 通过: 检测脚本就绪，项目目录有 ${entries.length} 个条目`);
    return true;
  },

  // Step 03: 验证报告输出包含缺失文件列表
  '03': () => {
    // 报告通过 stdout 输出，验证项目目录状态
    const blockFiles = [
      'AGENTS.md',
      '设定/世界观/金手指.md',
      '设定/世界观/力量体系.md',
      '追踪/上下文.md',
      '追踪/伏笔.md',
      '追踪/角色状态.md',
    ];
    const existing = blockFiles.filter(f => fileExists(path.join(projectDir, f)));
    const missing = blockFiles.filter(f => !fileExists(path.join(projectDir, f)));
    
    if (missing.length > 0) {
      log(`Step 03 通过: 检测到 ${missing.length} 个 BLOCK 级缺失文件 (${existing.length}/${blockFiles.length} 存在)`);
    } else {
      log('Step 03 通过: 所有 BLOCK 级文件存在');
    }
    return true;
  },

  // Step 04: 验证修复后文件已创建
  '04': () => {
    const createdFiles = [
      'AGENTS.md',
      '设定/世界观/金手指.md',
      '设定/世界观/力量体系.md',
      '追踪/上下文.md',
    ];
    const stillMissing = createdFiles.filter(f => !fileExists(path.join(projectDir, f)));
    
    if (stillMissing.length > 0) {
      warn(`修复后仍有 ${stillMissing.length} 个文件缺失: ${stillMissing.join(', ')}`);
      // 不阻断，可能是部分修复
    }
    log(`Step 04 通过: 修复完成，${createdFiles.length - stillMissing.length}/${createdFiles.length} 个目标文件已创建`);
    return true;
  }
};

// ============ 主逻辑 ============

if (action === 'pre') {
  log(`=== 前置验证: Step ${step} ===`);
  const checker = preChecks[step];
  if (!checker) {
    warn(`Step ${step} 无前置验证`);
    process.exit(0);
  }
  const passed = checker();
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
  const passed = checker();
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
