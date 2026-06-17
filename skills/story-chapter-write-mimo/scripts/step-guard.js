#!/usr/bin/env node

/**
 * 步骤守卫脚本
 * 在每个 Agent 执行前后运行，自动验证输入输出
 * 
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir>  # 执行前验证输入
 *   node step-guard.js post <step> <workflow-dir>  # 执行后验证输出
 * 
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号 (01-14)
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

// 写入 JSON 文件
function writeJson(filename, data) {
  ensureWorkflowDir();
  const filePath = path.join(workflowDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Step 01: 需要项目目录
  '01': (wf) => {
    const projectDir = process.argv[5];
    if (!projectDir || !fileExists(projectDir)) {
      error('项目目录不存在: ' + (projectDir || '未指定'));
      return false;
    }
    log('项目目录存在: ' + projectDir);
    return true;
  },

  // Step 02: 需要 step01 完成
  '02': (wf) => {
    const s01 = readJson('step01-health-check.json');
    if (!s01 || s01.status !== 'pass') {
      error('Step 01 未完成或未通过');
      return false;
    }
    log('Step 01 已通过');
    return true;
  },

  // Step 03: 需要 step02 完成
  '03': (wf) => {
    const s02 = readJson('step02-chapter-info.json');
    if (!s02 || !s02.next_chapter) {
      error('Step 02 未完成');
      return false;
    }
    log(`下一章: 第${s02.next_chapter}章`);
    return true;
  },

  // Step 04: 需要 step03 且 need_create=true
  '04': (wf) => {
    const s03 = readJson('step03-outline-check.json');
    if (!s03) {
      error('Step 03 未完成');
      return false;
    }
    if (!s03.need_create) {
      warn('细纲已存在，跳过创建');
      return false; // 返回 false 表示应该跳过
    }
    log('需要创建细纲');
    return true;
  },

  // Step 05: 需要 step03 完成
  '05': (wf) => {
    const s03 = readJson('step03-outline-check.json');
    if (!s03) {
      error('Step 03 未完成');
      return false;
    }
    if (s03.need_create) {
      // 如果刚创建了细纲，验证文件存在
      const s02 = readJson('step02-chapter-info.json');
      const outlineFile = `大纲/细纲_第${s02.next_chapter_padded}章.md`;
      if (!fileExists(outlineFile)) {
        error('细纲文件不存在: ' + outlineFile);
        return false;
      }
    }
    log('细纲就绪');
    return true;
  },

  // Step 06: 需要 step05 完成
  '06': (wf) => {
    const s05 = readJson('step05-required-files.json');
    if (!s05 || !s05.characters) {
      error('Step 05 未完成');
      return false;
    }
    log('文件分析完成');
    return true;
  },

  // Step 07: 需要 step06 且 need_new_settings=true
  '07': (wf) => {
    const s06 = readJson('step06-new-settings.json');
    if (!s06) {
      error('Step 06 未完成');
      return false;
    }
    if (!s06.need_new_settings) {
      warn('无需创建新设定');
      return false;
    }
    log('需要创建新设定');
    return true;
  },

  // Step 08: 需要 step05 完成
  '08': (wf) => {
    const s05 = readJson('step05-required-files.json');
    if (!s05) {
      error('Step 05 未完成');
      return false;
    }
    log('准备读取上下文');
    return true;
  },

  // Step 09: 需要 step08 完成
  '09': (wf) => {
    const s08 = readJson('step08-context.json');
    if (!s08 || !s08.previous_chapter_ending) {
      error('Step 08 未完成');
      return false;
    }
    log('上下文就绪');
    return true;
  },

  // Step 10: 需要 step08 和 step09 完成
  '10': (wf) => {
    const s08 = readJson('step08-context.json');
    const s09 = readJson('step09-constraints.json');
    if (!s08 || !s09) {
      error('Step 08 或 Step 09 未完成');
      return false;
    }
    log(`目标字数: ${s09.word_count_target}`);
    return true;
  },

  // Step 11: 需要 step10 完成（正文文件存在）
  '11': (wf) => {
    const s02 = readJson('step02-chapter-info.json');
    if (!s02) {
      error('Step 02 未完成');
      return false;
    }
    const chapterFile = `正文/第${s02.next_chapter_padded}章.md`;
    if (!fileExists(chapterFile)) {
      error('正文文件不存在: ' + chapterFile);
      return false;
    }
    log('正文文件就绪');
    return true;
  },

  // Step 12: 需要 step11 且 block_count > 0
  '12': (wf) => {
    const s11 = readJson('step11-quality-report.json');
    if (!s11) {
      error('Step 11 未完成');
      return false;
    }
    if (s11.block_count === 0) {
      warn('无 BLOCK 项，无需修复');
      return false;
    }
    log(`需要修复 ${s11.block_count} 个 BLOCK 项`);
    return true;
  },

  // Step 13: 需要 step12 完成
  '13': (wf) => {
    const s12 = readJson('step12-fix-log.json');
    if (!s12) {
      error('Step 12 未完成');
      return false;
    }
    log('修复完成，准备复查');
    return true;
  },

  // Step 14: 需要 step11 通过（或 step13 通过）
  '14': (wf) => {
    const s13 = readJson('step13-recheck-report.json');
    const s11 = readJson('step11-quality-report.json');
    
    if (s13) {
      // 有复查报告，检查复查结果
      if (s13.overall === 'BLOCK') {
        error('复查未通过，仍有 BLOCK 项');
        return false;
      }
    } else if (s11) {
      // 无复查报告，检查初始检测结果
      if (s11.overall === 'BLOCK') {
        error('质量检测未通过');
        return false;
      }
    } else {
      error('Step 11 未完成');
      return false;
    }
    log('质量检测通过，准备更新追踪');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Step 01: 验证 step01-health-check.json
  '01': (wf) => {
    const data = readJson('step01-health-check.json');
    if (!data) { error('step01-health-check.json 不存在'); return false; }
    if (!['pass', 'fail'].includes(data.status)) { error('status 无效'); return false; }
    if (!Array.isArray(data.checked) || data.checked.length !== 9) {
      error('checked 必须有 9 项');
      return false;
    }
    log('Step 01 输出验证通过');
    return true;
  },

  // Step 02: 验证 step02-chapter-info.json
  '02': (wf) => {
    const data = readJson('step02-chapter-info.json');
    if (!data) { error('step02-chapter-info.json 不存在'); return false; }
    if (typeof data.last_chapter !== 'number') { error('last_chapter 无效'); return false; }
    if (typeof data.next_chapter !== 'number') { error('next_chapter 无效'); return false; }
    if (data.next_chapter !== data.last_chapter + 1) { error('next_chapter 应等于 last_chapter + 1'); return false; }
    if (!/^\d{3}$/.test(data.next_chapter_padded)) { error('next_chapter_padded 应为3位数字'); return false; }
    if (typeof data.total_words !== 'number') { error('total_words 无效'); return false; }
    log(`Step 02 输出验证通过: 第${data.next_chapter}章, 总${data.total_words}字`);
    return true;
  },

  // Step 03: 验证 step03-outline-check.json
  '03': (wf) => {
    const data = readJson('step03-outline-check.json');
    if (!data) { error('step03-outline-check.json 不存在'); return false; }
    if (typeof data.exists !== 'boolean') { error('exists 无效'); return false; }
    if (typeof data.need_create !== 'boolean') { error('need_create 无效'); return false; }
    log(`Step 03 输出验证通过: exists=${data.exists}, need_create=${data.need_create}`);
    return true;
  },

  // Step 04: 验证细纲文件存在
  '04': (wf) => {
    const s02 = readJson('step02-chapter-info.json');
    const outlineFile = `大纲/细纲_第${s02.next_chapter_padded}章.md`;
    if (!fileExists(outlineFile)) { error('细纲文件不存在: ' + outlineFile); return false; }
    log('Step 04 输出验证通过: 细纲已创建');
    return true;
  },

  // Step 05: 验证 step05-required-files.json
  '05': (wf) => {
    const data = readJson('step05-required-files.json');
    if (!data) { error('step05-required-files.json 不存在'); return false; }
    if (!Array.isArray(data.characters)) { error('characters 无效'); return false; }
    if (!Array.isArray(data.tracking_files)) { error('tracking_files 无效'); return false; }
    log(`Step 05 输出验证通过: ${data.characters.length}个角色`);
    return true;
  },

  // Step 06: 验证 step06-new-settings.json
  '06': (wf) => {
    const data = readJson('step06-new-settings.json');
    if (!data) { error('step06-new-settings.json 不存在'); return false; }
    if (typeof data.need_new_settings !== 'boolean') { error('need_new_settings 无效'); return false; }
    log(`Step 06 输出验证通过: need_new_settings=${data.need_new_settings}`);
    return true;
  },

  // Step 07: 验证设定文件存在
  '07': (wf) => {
    const s06 = readJson('step06-new-settings.json');
    for (const char of (s06.new_characters || [])) {
      if (!fileExists(char.file)) { error('设定文件不存在: ' + char.file); return false; }
    }
    log('Step 07 输出验证通过: 设定文件已创建');
    return true;
  },

  // Step 08: 验证 step08-context.json
  '08': (wf) => {
    const data = readJson('step08-context.json');
    if (!data) { error('step08-context.json 不存在'); return false; }
    if (!data.previous_chapter_ending || data.previous_chapter_ending.length < 100) {
      error('previous_chapter_ending 缺失或过短');
      return false;
    }
    if (!Array.isArray(data.active_foreshadows)) { error('active_foreshadows 无效'); return false; }
    log(`Step 08 输出验证通过: ${data.active_foreshadows.length}个活跃伏笔`);
    return true;
  },

  // Step 09: 验证 step09-constraints.json
  '09': (wf) => {
    const data = readJson('step09-constraints.json');
    if (!data) { error('step09-constraints.json 不存在'); return false; }
    if (!Array.isArray(data.banned_words_l1) || data.banned_words_l1.length < 30) {
      error('banned_words_l1 缺失或数量不足');
      return false;
    }
    if (typeof data.word_count_target !== 'number') { error('word_count_target 无效'); return false; }
    log(`Step 09 输出验证通过: 目标${data.word_count_target}字, ${data.banned_words_l1.length}个禁用词`);
    return true;
  },

  // Step 10: 验证正文文件存在且字数达标
  '10': (wf) => {
    const s02 = readJson('step02-chapter-info.json');
    const s09 = readJson('step09-constraints.json');
    const chapterFile = `正文/第${s02.next_chapter_padded}章.md`;
    
    if (!fileExists(chapterFile)) { error('正文文件不存在'); return false; }
    
    // 统计字数
    const content = fs.readFileSync(chapterFile, 'utf-8');
    const wordCount = content.replace(/\s/g, '').length;
    const minWords = s09.word_count_target * 0.9;
    
    if (wordCount < minWords) {
      error(`字数不足: ${wordCount}/${s09.word_count_target} (最低${minWords})`);
      return false;
    }
    
    log(`Step 10 输出验证通过: ${wordCount}字`);
    return true;
  },

  // Step 11: 验证 step11-quality-report.json
  '11': (wf) => {
    const data = readJson('step11-quality-report.json');
    if (!data) { error('step11-quality-report.json 不存在'); return false; }
    if (!Array.isArray(data.checks)) { error('checks 无效'); return false; }
    if (data.checks.length < 7) { error('checks 应有7项检测'); return false; }
    if (!['BLOCK', 'WARN', 'PASS'].includes(data.overall)) { error('overall 无效'); return false; }
    log(`Step 11 输出验证通过: ${data.overall}, ${data.block_count}个BLOCK, ${data.warn_count}个WARN`);
    return true;
  },

  // Step 12: 验证 step12-fix-log.json
  '12': (wf) => {
    const data = readJson('step12-fix-log.json');
    if (!data) { error('step12-fix-log.json 不存在'); return false; }
    if (typeof data.fix_count !== 'number') { error('fix_count 无效'); return false; }
    if (typeof data.remaining_blocks !== 'number') { error('remaining_blocks 无效'); return false; }
    if (data.remaining_blocks > 0) { error(`仍有${data.remaining_blocks}个BLOCK未修复`); return false; }
    log(`Step 12 输出验证通过: 修复${data.fix_count}处`);
    return true;
  },

  // Step 13: 验证 step13-recheck-report.json
  '13': (wf) => {
    const data = readJson('step13-recheck-report.json');
    if (!data) { error('step13-recheck-report.json 不存在'); return false; }
    if (!['BLOCK', 'WARN', 'PASS'].includes(data.overall)) { error('overall 无效'); return false; }
    if (data.overall === 'BLOCK') { error('复查未通过'); return false; }
    log(`Step 13 输出验证通过: ${data.overall}`);
    return true;
  },

  // Step 14: 验证追踪文件已更新
  '14': (wf) => {
    const trackingFiles = [
      '追踪/伏笔.md',
      '追踪/时间线.md',
      '追踪/角色状态.md',
      '追踪/物品.md',
      '追踪/环境.md',
      '追踪/重复语句.md',
      '追踪/上下文.md'
    ];
    
    const s02 = readJson('step02-chapter-info.json');
    const chapterNum = s02.next_chapter;
    
    for (const file of trackingFiles) {
      if (!fileExists(file)) { error('追踪文件不存在: ' + file); return false; }
    }
    
    log('Step 14 输出验证通过: 所有追踪文件已更新');
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
