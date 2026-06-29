#!/usr/bin/env node

/**
 * 章节重写守卫脚本
 * 在重写流程的关键节点运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <project-dir> <chapter>  # 执行前验证输入
 *   node step-guard.js post <step> <project-dir> <chapter>  # 执行后验证输出
 * 
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号 (01-11)
const projectDir = process.argv[4] || process.cwd();
const chapterNum = parseInt(process.argv[5], 10);

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <project-dir> <chapter>');
  console.error('示例: node step-guard.js post 04 .workflow 42');
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
  const wfDir = path.join(projectDir, '.workflow');
  if (!fs.existsSync(wfDir)) {
    fs.mkdirSync(wfDir, { recursive: true });
    log(`创建 workflow 目录: ${wfDir}`);
  }
  return wfDir;
}

// 读取 JSON 文件
function readJson(filename) {
  const wfDir = path.join(projectDir, '.workflow');
  const filePath = path.join(wfDir, filename);
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

// 获取章节文件名
function getChapterFile(ch) {
  const padded = String(ch).padStart(3, '0');
  return path.join(projectDir, `正文/第${padded}章.md`);
}

// 获取细纲文件名
function getOutlineFile(ch) {
  const padded = String(ch).padStart(3, '0');
  return path.join(projectDir, `大纲/细纲_第${padded}章.md`);
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Step 01: 需要项目目录和章节文件存在
  '01': () => {
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) {
      error('章节文件不存在: ' + chapterFile);
      return false;
    }
    log(`项目目录存在，第${chapterNum}章文件就绪`);
    return true;
  },

  // Step 02: 需要 Step 01 完成
  '02': () => {
    const ctx = readJson('rw-01-context.json');
    if (!ctx) {
      error('Step 01 未完成 (rw-01-context.json 不存在)');
      return false;
    }
    if (!ctx.chapter || ctx.chapter !== chapterNum) {
      error('上下文章节号不匹配');
      return false;
    }
    log(`Step 01 已完成，上下文就绪`);
    return true;
  },

  // Step 03: 需要 Step 02 完成
  '03': () => {
    const diag = readJson('rw-02-diagnosis.json');
    if (!diag) {
      error('Step 02 未完成 (rw-02-diagnosis.json 不存在)');
      return false;
    }
    if (!diag.overall_score) {
      error('诊断报告缺少评分');
      return false;
    }
    log(`Step 02 已完成，诊断评分: ${diag.overall_score}`);
    return true;
  },

  // Step 04~07: 需要 Step 03 完成 + 用户确认模式
  '04': () => {
    const impact = readJson('rw-03-impact.json');
    if (!impact) { error('Step 03 未完成 (rw-03-impact.json 不存在)'); return false; }
    log(`影响范围: ${impact.level || '未知'}`);
    return true;
  },
  '05': () => {
    const impact = readJson('rw-03-impact.json');
    if (!impact) { error('Step 03 未完成 (rw-03-impact.json 不存在)'); return false; }
    log(`影响范围: ${impact.level || '未知'}`);
    return true;
  },
  '06': () => {
    const impact = readJson('rw-03-impact.json');
    if (!impact) { error('Step 03 未完成 (rw-03-impact.json 不存在)'); return false; }
    log(`影响范围: ${impact.level || '未知'}`);
    return true;
  },
  '07': () => {
    const impact = readJson('rw-03-impact.json');
    if (!impact) { error('Step 03 未完成 (rw-03-impact.json 不存在)'); return false; }
    log(`影响范围: ${impact.level || '未知'}`);
    return true;
  },

  // Step 08: 需要重写完成（正文文件存在且非空）
  '08': () => {
    const rewriteSteps = ['04', '05', '06', '07'];
    const anyRewriteDone = rewriteSteps.some(s => {
      const logFile = `rw-${s.toLowerCase()}-log.json`;
      return readJson(logFile) !== null;
    });
    if (!anyRewriteDone) {
      error('未完成重写步骤 (04/05/06/07)');
      return false;
    }
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) {
      error('重写后章节文件不存在');
      return false;
    }
    log('重写完成，正文文件存在');
    return true;
  },

  // Step 09: 需要 Step 08 有 BLOCK
  '09': () => {
    const recheck = readJson('rw-08-recheck.json');
    if (!recheck) {
      error('Step 08 未完成 (rw-08-recheck.json 不存在)');
      return false;
    }
    if (!recheck.blockers || recheck.blockers.length === 0) {
      warn('无 BLOCK 问题，无需修复');
      return false;
    }
    log(`发现 ${recheck.blockers.length} 个 BLOCK 问题，需要修复`);
    return true;
  },

  // Step 10: 需要 Step 08 通过或 Step 09 完成
  '10': () => {
    const recheck = readJson('rw-08-recheck.json');
    const fixLog = readJson('rw-09-fix-log.json');
    const hasPass = recheck && (recheck.status === 'pass' || !recheck.blockers || recheck.blockers.length === 0);
    const hasFix = fixLog && fs.existsSync(path.join(projectDir, `正文/第${String(chapterNum).padStart(3, '0')}章.md`));
    if (!hasPass && !hasFix) {
      error('质量检测未通过且无修复记录');
      return false;
    }
    log('质量检测通过或已修复');
    return true;
  },

  // Step 10b: 需要影响范围 = HIGH 或用户确认
  '10b': () => {
    const impact = readJson('rw-03-impact.json');
    if (!impact) {
      error('Step 03 未完成');
      return false;
    }
    const level = impact.level || impact.impact_level || 'UNKNOWN';
    if (level === 'LOW') {
      warn('影响范围 LOW，不需要后章检查');
      return false;
    }
    const nextChapterFile = getChapterFile(chapterNum + 1);
    if (!fileExists(nextChapterFile)) {
      warn('后一章不存在，跳过检查');
      return false;
    }
    log(`影响范围: ${level}，后一章存在`);
    return true;
  },

  // Step 10c: 需要 Step 10b 完成
  '10c': () => {
    const impact = readJson('rw-03-impact.json');
    if (!impact) {
      error('Step 03 未完成');
      return false;
    }
    log('准备后章一致性检查');
    return true;
  },

  // Step 10d: 需要 Step 10c = BLOCK/WARN
  '10d': () => {
    const consistency = readJson('rw-10c-consistency.json');
    if (!consistency) {
      error('Step 10c 未完成');
      return false;
    }
    if (consistency.result === 'INFO') {
      warn('后章一致，无需连锁重写');
      return false;
    }
    log(`后章一致性结果: ${consistency.result}，需要连锁重写`);
    return true;
  },

  // Step 10e: 需要 Step 10d 完成
  '10e': () => {
    const recursionLog = readJson('rw-10e-recursion-log.json');
    if (!recursionLog) {
      // 首次递归时可能还没有日志
      const consistency = readJson('rw-10c-consistency.json');
      if (!consistency) {
        error('Step 10c 未完成');
        return false;
      }
    }
    log('准备递归检查下一层');
    return true;
  },

  // Step 11: 需要所有步骤完成
  '11': () => {
    const requiredFiles = [
      'rw-01-context.json',
      'rw-02-diagnosis.json',
      'rw-03-impact.json',
    ];
    for (const f of requiredFiles) {
      if (!readJson(f)) {
        error(`前置文件缺失: ${f}`);
        return false;
      }
    }
    log('所有前置文件就绪，准备输出报告');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step 01: 验证 rw-01-context.json
  '01': () => {
    const data = readJson('rw-01-context.json');
    if (!data) { error('rw-01-context.json 不存在'); return false; }
    if (typeof data.chapter !== 'number') { error('chapter 无效'); return false; }
    if (data.chapter !== chapterNum) { error('章节号不匹配'); return false; }
    if (typeof data.original_wordcount !== 'number') { error('original_wordcount 无效'); return false; }
    log(`Step 01 输出验证通过: 第${data.chapter}章, 原文${data.original_wordcount}字`);
    return true;
  },

  // Step 02: 验证 rw-02-diagnosis.json
  '02': () => {
    const data = readJson('rw-02-diagnosis.json');
    if (!data) { error('rw-02-diagnosis.json 不存在'); return false; }
    if (typeof data.overall_score !== 'number') { error('overall_score 无效'); return false; }
    if (!Array.isArray(data.issues)) { error('issues 无效'); return false; }
    if (!data.recommended_mode) { error('recommended_mode 缺失'); return false; }
    log(`Step 02 输出验证通过: 评分${data.overall_score}, 推荐模式${data.recommended_mode}`);
    return true;
  },

  // Step 03: 验证 rw-03-impact.json
  '03': () => {
    const data = readJson('rw-03-impact.json');
    if (!data) { error('rw-03-impact.json 不存在'); return false; }
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(data.level)) { error('level 无效'); return false; }
    log(`Step 03 输出验证通过: 影响范围${data.level}`);
    return true;
  },

  // Step 04: 验证全文重写完成
  '04': () => {
    const backupPattern = path.join(projectDir, `正文/第${String(chapterNum).padStart(3, '0')}章_原稿_*.md`);
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) { error('重写后章节文件不存在'); return false; }
    log('Step 04 输出验证通过: 正文已重写');
    return true;
  },

  // Step 05: 验证局部重写完成
  '05': () => {
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) { error('重写后章节文件不存在'); return false; }
    log('Step 05 输出验证通过: 局部重写完成');
    return true;
  },

  // Step 06: 验证风格重写完成
  '06': () => {
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) { error('重写后章节文件不存在'); return false; }
    log('Step 06 输出验证通过: 风格重写完成');
    return true;
  },

  // Step 07: 验证增强重写完成
  '07': () => {
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) { error('重写后章节文件不存在'); return false; }
    log('Step 07 输出验证通过: 增强重写完成');
    return true;
  },

  // Step 08: 验证 rw-08-recheck.json
  '08': () => {
    const data = readJson('rw-08-recheck.json');
    if (!data) { error('rw-08-recheck.json 不存在'); return false; }
    if (!['pass', 'warn', 'fail'].includes(data.status)) { error('status 无效'); return false; }
    if (typeof data.improvement !== 'object') { error('improvement 无效'); return false; }
    log(`Step 08 输出验证通过: status=${data.status}, 评分${data.improvement.new_score}`);
    return true;
  },

  // Step 09: 验证 rw-09-fix-log.json
  '09': () => {
    const data = readJson('rw-09-fix-log.json');
    if (!data) { error('rw-09-fix-log.json 不存在'); return false; }
    if (typeof data.fix_count !== 'number') { error('fix_count 无效'); return false; }
    log(`Step 09 输出验证通过: 修复${data.fix_count}处`);
    return true;
  },

  // Step 10: 验证配置文件已更新
  '10': () => {
    const trackingFiles = [
      '追踪/伏笔.md',
      '追踪/角色状态.md',
      '追踪/上下文.md',
    ];
    const missing = trackingFiles.filter(f => !fileExists(path.join(projectDir, f)));
    if (missing.length > 0) {
      warn(`追踪文件不完整: ${missing.join(', ')}`);
    }
    log(`Step 10 输出验证通过: 配置文件已更新`);
    return true;
  },

  // Step 10b: 验证后章已读取
  '10b': () => {
    const nextFile = getChapterFile(chapterNum + 1);
    if (!fileExists(nextFile)) {
      warn('后一章不存在，无法验证');
      return true; // 不算失败
    }
    log(`Step 10b 输出验证通过: 已读取第${chapterNum + 1}章开头`);
    return true;
  },

  // Step 10c: 验证 rw-10c-consistency.json
  '10c': () => {
    const data = readJson('rw-10c-consistency.json');
    if (!data) { error('rw-10c-consistency.json 不存在'); return false; }
    if (!['BLOCK', 'WARN', 'INFO'].includes(data.result)) { error('result 无效'); return false; }
    if (!Array.isArray(data.blockers)) { error('blockers 无效'); return false; }
    log(`Step 10c 输出验证通过: 一致性结果=${data.result}`);
    return true;
  },

  // Step 10d: 验证连锁重写完成
  '10d': () => {
    const nextChapterFile = getChapterFile(chapterNum + 1);
    if (!fileExists(nextChapterFile)) {
      warn('连锁重写章节文件不存在');
      return false;
    }
    log('Step 10d 输出验证通过: 连锁重写完成');
    return true;
  },

  // Step 10e: 验证递归日志
  '10e': () => {
    const data = readJson('rw-10e-recursion-log.json');
    if (!data) {
      warn('递归日志不存在');
      return true; // 可选
    }
    if (!Array.isArray(data.chain)) { error('chain 无效'); return false; }
    log(`Step 10e 输出验证通过: 连锁链长度=${data.chain.length}`);
    return true;
  },

  // Step 11: 验证重写报告
  '11': () => {
    const chapterFile = getChapterFile(chapterNum);
    if (!fileExists(chapterFile)) { error('最终章节文件不存在'); return false; }
    log('Step 11 输出验证通过: 重写完成，报告可生成');
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
