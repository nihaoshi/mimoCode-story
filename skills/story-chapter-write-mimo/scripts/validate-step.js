#!/usr/bin/env node

/**
 * 步骤验证脚本
 * 验证每个步骤的输出文件是否符合契约
 * 
 * 用法：node validate-step.js <step-number> <workflow-dir>
 * 退出码：0=通过，1=失败
 */

const fs = require('fs');
const path = require('path');

const workflowDir = process.argv[3] || '.workflow';
const stepNumber = process.argv[2];

if (!stepNumber) {
  console.error('用法: node validate-step.js <step-number> <workflow-dir>');
  process.exit(1);
}

// 验证函数
const validators = {
  // Step 01: 目录健全检查
  '01': (data) => {
    const errors = [];
    if (!['pass', 'fail'].includes(data.status)) {
      errors.push('status 必须是 "pass" 或 "fail"');
    }
    if (!Array.isArray(data.checked)) {
      errors.push('checked 必须是数组');
    } else if (data.checked.length !== 9) {
      errors.push(`checked 必须包含 9 个元素，当前 ${data.checked.length} 个`);
    } else {
      data.checked.forEach((item, i) => {
        if (!item.path) errors.push(`checked[${i}].path 缺失`);
        if (typeof item.exists !== 'boolean') errors.push(`checked[${i}].exists 必须是布尔值`);
        if (typeof item.created !== 'boolean') errors.push(`checked[${i}].created 必须是布尔值`);
      });
    }
    if (!Array.isArray(data.created)) {
      errors.push('created 必须是数组');
    }
    if (!Array.isArray(data.errors)) {
      errors.push('errors 必须是数组');
    }
    return errors;
  },

  // Step 02: 章节信息获取
  '02': (data) => {
    const errors = [];
    if (typeof data.last_chapter !== 'number' || data.last_chapter < 1) {
      errors.push('last_chapter 必须是正整数');
    }
    if (!data.last_chapter_file) {
      errors.push('last_chapter_file 缺失');
    }
    if (!data.last_chapter_name) {
      errors.push('last_chapter_name 缺失');
    }
    if (typeof data.next_chapter !== 'number') {
      errors.push('next_chapter 必须是数字');
    }
    if (!data.next_chapter_padded) {
      errors.push('next_chapter_padded 缺失');
    } else if (!/^\d{3}$/.test(data.next_chapter_padded)) {
      errors.push('next_chapter_padded 必须是 3 位数字');
    }
    if (!data.next_chapter_file) {
      errors.push('next_chapter_file 缺失');
    }
    if (typeof data.total_chapters !== 'number') {
      errors.push('total_chapters 必须是数字');
    }
    if (typeof data.total_words !== 'number') {
      errors.push('total_words 必须是数字');
    }
    // 验证 next_chapter = last_chapter + 1
    if (data.next_chapter !== data.last_chapter + 1) {
      errors.push('next_chapter 必须等于 last_chapter + 1');
    }
    return errors;
  },

  // Step 03: 细纲检查
  '03': (data) => {
    const errors = [];
    if (typeof data.chapter !== 'number') {
      errors.push('chapter 必须是数字');
    }
    if (!data.outline_file) {
      errors.push('outline_file 缺失');
    }
    if (typeof data.exists !== 'boolean') {
      errors.push('exists 必须是布尔值');
    }
    if (typeof data.valid_format !== 'boolean') {
      errors.push('valid_format 必须是布尔值');
    }
    if (typeof data.need_create !== 'boolean') {
      errors.push('need_create 必须是布尔值');
    }
    // 验证 need_create 逻辑
    if (data.need_create !== (!data.exists || !data.valid_format)) {
      errors.push('need_create 应该等于 (!exists || !valid_format)');
    }
    return errors;
  },

  // Step 05: 文件需求分析
  '05': (data) => {
    const errors = [];
    if (typeof data.chapter !== 'number') {
      errors.push('chapter 必须是数字');
    }
    if (!Array.isArray(data.characters)) {
      errors.push('characters 必须是数组');
    }
    if (!Array.isArray(data.character_files)) {
      errors.push('character_files 必须是数组');
    }
    if (!Array.isArray(data.scenes)) {
      errors.push('scenes 必须是数组');
    }
    if (!Array.isArray(data.foreshadows)) {
      errors.push('foreshadows 必须是数组');
    }
    if (!Array.isArray(data.tracking_files)) {
      errors.push('tracking_files 必须是数组');
    }
    if (!Array.isArray(data.setting_files)) {
      errors.push('setting_files 必须是数组');
    }
    return errors;
  },

  // Step 06: 新设定决策
  '06': (data) => {
    const errors = [];
    if (typeof data.need_new_settings !== 'boolean') {
      errors.push('need_new_settings 必须是布尔值');
    }
    if (!Array.isArray(data.new_characters)) {
      errors.push('new_characters 必须是数组');
    }
    if (!Array.isArray(data.new_scenes)) {
      errors.push('new_scenes 必须是数组');
    }
    if (!Array.isArray(data.new_items)) {
      errors.push('new_items 必须是数组');
    }
    if (!Array.isArray(data.new_organizations)) {
      errors.push('new_organizations 必须是数组');
    }
    // 验证 need_new_settings 逻辑
    const hasNew = data.new_characters.length > 0 || 
                   data.new_scenes.length > 0 || 
                   data.new_items.length > 0 || 
                   data.new_organizations.length > 0;
    if (data.need_new_settings !== hasNew) {
      errors.push('need_new_settings 应该与是否有新元素一致');
    }
    return errors;
  },

  // Step 08: 上下文信息
  '08': (data) => {
    const errors = [];
    if (typeof data.chapter !== 'number') {
      errors.push('chapter 必须是数字');
    }
    if (!data.previous_chapter_ending) {
      errors.push('previous_chapter_ending 缺失');
    } else if (data.previous_chapter_ending.length < 100) {
      errors.push('previous_chapter_ending 长度不足（应 >= 100 字符）');
    }
    if (!Array.isArray(data.active_foreshadows)) {
      errors.push('active_foreshadows 必须是数组');
    }
    if (typeof data.character_states !== 'object') {
      errors.push('character_states 必须是对象');
    }
    if (typeof data.environment !== 'object') {
      errors.push('environment 必须是对象');
    }
    return errors;
  },

  // Step 09: 约束参数
  '09': (data) => {
    const errors = [];
    if (typeof data.chapter !== 'number') {
      errors.push('chapter 必须是数字');
    }
    if (typeof data.word_count_target !== 'number' || data.word_count_target < 1000) {
      errors.push('word_count_target 必须是 >= 1000 的数字');
    }
    if (typeof data.word_count_min !== 'number') {
      errors.push('word_count_min 必须是数字');
    }
    if (!Array.isArray(data.banned_words_l1)) {
      errors.push('banned_words_l1 必须是数组');
    } else if (data.banned_words_l1.length < 30) {
      errors.push(`banned_words_l1 应包含 31 个一级禁用词，当前 ${data.banned_words_l1.length} 个`);
    }
    if (!Array.isArray(data.banned_words_l2)) {
      errors.push('banned_words_l2 必须是数组');
    } else if (data.banned_words_l2.length < 15) {
      errors.push(`banned_words_l2 应包含 18 个二级禁用词，当前 ${data.banned_words_l2.length} 个`);
    }
    if (!Array.isArray(data.ai_patterns_banned)) {
      errors.push('ai_patterns_banned 必须是数组');
    }
    if (typeof data.style_rules !== 'object') {
      errors.push('style_rules 必须是对象');
    }
    return errors;
  },

  // Step 11: 质量检测报告
  '11': (data) => {
    const errors = [];
    if (typeof data.chapter !== 'number') {
      errors.push('chapter 必须是数字');
    }
    if (typeof data.word_count !== 'number') {
      errors.push('word_count 必须是数字');
    }
    if (typeof data.word_count_target !== 'number') {
      errors.push('word_count_target 必须是数字');
    }
    if (typeof data.word_count_pass !== 'boolean') {
      errors.push('word_count_pass 必须是布尔值');
    }
    if (!Array.isArray(data.checks)) {
      errors.push('checks 必须是数组');
    } else {
      data.checks.forEach((check, i) => {
        if (!check.name) errors.push(`checks[${i}].name 缺失`);
        if (!['pass', 'fail'].includes(check.status)) {
          errors.push(`checks[${i}].status 必须是 "pass" 或 "fail"`);
        }
        if (!['BLOCK', 'WARN'].includes(check.severity)) {
          errors.push(`checks[${i}].severity 必须是 "BLOCK" 或 "WARN"`);
        }
      });
    }
    if (typeof data.block_count !== 'number') {
      errors.push('block_count 必须是数字');
    }
    if (typeof data.warn_count !== 'number') {
      errors.push('warn_count 必须是数字');
    }
    if (!['BLOCK', 'WARN', 'PASS'].includes(data.overall)) {
      errors.push('overall 必须是 "BLOCK"、"WARN" 或 "PASS"');
    }
    // 验证 overall 逻辑
    const expectedOverall = data.block_count > 0 ? 'BLOCK' : 
                           data.warn_count > 0 ? 'WARN' : 'PASS';
    if (data.overall !== expectedOverall) {
      errors.push(`overall 应该是 "${expectedOverall}"，当前是 "${data.overall}"`);
    }
    return errors;
  },

  // Step 12: 修复日志
  '12': (data) => {
    const errors = [];
    if (typeof data.chapter !== 'number') {
      errors.push('chapter 必须是数字');
    }
    if (!Array.isArray(data.fixes_applied)) {
      errors.push('fixes_applied 必须是数组');
    } else {
      data.fixes_applied.forEach((fix, i) => {
        if (!fix.type) errors.push(`fixes_applied[${i}].type 缺失`);
        if (!fix.original) errors.push(`fixes_applied[${i}].original 缺失`);
        if (!fix.fixed) errors.push(`fixes_applied[${i}].fixed 缺失`);
        if (typeof fix.position !== 'number') errors.push(`fixes_applied[${i}].position 必须是数字`);
      });
    }
    if (typeof data.fix_count !== 'number') {
      errors.push('fix_count 必须是数字');
    }
    if (typeof data.new_word_count !== 'number') {
      errors.push('new_word_count 必须是数字');
    }
    if (typeof data.remaining_blocks !== 'number') {
      errors.push('remaining_blocks 必须是数字');
    }
    return errors;
  },

  // Step 13: 复查报告（格式同 Step 11）
  '13': (data) => {
    return validators['11'](data);
  }
};

// 主逻辑
const stepKey = stepNumber.replace(/^0+/, ''); // 移除前导零
const filePath = path.join(workflowDir, `step${stepNumber}-*.json`);

// 查找匹配的文件
let files;
try {
  files = fs.readdirSync(workflowDir)
    .filter(f => f.startsWith(`step${stepNumber}-`) && f.endsWith('.json'));
} catch (err) {
  console.error(`❌ 无法读取目录 ${workflowDir}: ${err.message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.error(`❌ 未找到 step${stepNumber} 的输出文件`);
  process.exit(1);
}

const targetFile = path.join(workflowDir, files[0]);
console.log(`📋 验证文件: ${targetFile}`);

// 读取并解析 JSON
let data;
try {
  const content = fs.readFileSync(targetFile, 'utf-8');
  data = JSON.parse(content);
} catch (err) {
  console.error(`❌ JSON 解析失败: ${err.message}`);
  process.exit(1);
}

// 运行验证
const validator = validators[stepKey];
if (!validator) {
  console.warn(`⚠️ 没有找到 step${stepNumber} 的验证器，跳过验证`);
  process.exit(0);
}

const errors = validator(data);

if (errors.length === 0) {
  console.log(`✅ Step ${stepNumber} 验证通过`);
  process.exit(0);
} else {
  console.error(`❌ Step ${stepNumber} 验证失败:`);
  errors.forEach(err => console.error(`  - ${err}`));
  process.exit(1);
}
