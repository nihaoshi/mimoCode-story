#!/usr/bin/env node
/**
 * task-gen-review.js — 审稿任务树生成器
 * 
 * 用法：node task-gen-review.js <文件名>
 */

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('用法：node task-gen-review.js <文件名>');
  process.exit(1);
}

const fileName = args[0];
const fileId = fileName.replace(/[^a-zA-Z0-9]/g, '-');

console.log(`# ===== 审稿「${fileName}」任务树 =====`);
console.log(`# 共19条任务，必须逐条创建`);
console.log('');

console.log('# ===== 第1层：父任务 =====');
console.log(`task create "T-REVIEW-${fileId}: 审稿「${fileName}」" → T-REVIEW-${fileId}`);
console.log('');

console.log('# ===== 第2层：5个审查维度 =====');
console.log(`task create "T-REVIEW-STRUCT-${fileId}: 结构审查 — review-structure"     parent=T-REVIEW-${fileId} → T-REVIEW-STRUCT`);
console.log(`task create "T-REVIEW-CHAR-${fileId}: 人物审查 — review-character"       parent=T-REVIEW-${fileId} → T-REVIEW-CHAR`);
console.log(`task create "T-REVIEW-WRITE-${fileId}: 文笔审查 — review-writing"       parent=T-REVIEW-${fileId} → T-REVIEW-WRITE`);
console.log(`task create "T-REVIEW-BIZ-${fileId}: 商业审查 — review-commercial"      parent=T-REVIEW-${fileId} → T-REVIEW-BIZ`);
console.log(`task create "T-REVIEW-CON-${fileId}: 一致性审查 — review-consistency"   parent=T-REVIEW-${fileId} → T-REVIEW-CON`);
console.log(`task create "T-REVIEW-REPORT-${fileId}: 综合报告"                       parent=T-REVIEW-${fileId} → T-REVIEW-REPORT`);
console.log('');

console.log('# ===== 第3层-结构审查：5项 =====');
console.log(`task create "T-REVIEW-STRUCT-01: 检查开篇钩子（前3句吸引力）"      parent=T-REVIEW-STRUCT`);
console.log(`task create "T-REVIEW-STRUCT-02: 检查情绪曲线（是否有起伏）"       parent=T-REVIEW-STRUCT`);
console.log(`task create "T-REVIEW-STRUCT-03: 检查节奏把控（高潮/铺垫比例）"    parent=T-REVIEW-STRUCT`);
console.log(`task create "T-REVIEW-STRUCT-04: 检查反转铺垫（是否有足够铺垫）"   parent=T-REVIEW-STRUCT`);
console.log(`task create "T-REVIEW-STRUCT-05: 检查章尾钩子（是否有悬念）"       parent=T-REVIEW-STRUCT`);
console.log('');

console.log('# ===== 第3层-人物审查：4项 =====');
console.log(`task create "T-REVIEW-CHAR-01: 检查角色一致性（人设前后一致）"      parent=T-REVIEW-CHAR`);
console.log(`task create "T-REVIEW-CHAR-02: 检查动机合理性（行为有动机支撑）"    parent=T-REVIEW-CHAR`);
console.log(`task create "T-REVIEW-CHAR-03: 检查角色弧线（主角有成长/变化）"     parent=T-REVIEW-CHAR`);
console.log(`task create "T-REVIEW-CHAR-04: 检查配角功能（配角有存在价值）"      parent=T-REVIEW-CHAR`);
console.log('');

console.log('# ===== 第3层-文笔审查：4项 =====');
console.log(`task create "T-REVIEW-WRITE-01: 检查AI味（明显AI写作痕迹）"        parent=T-REVIEW-WRITE`);
console.log(`task create "T-REVIEW-WRITE-02: 检查对话质量（自然、有信息量）"     parent=T-REVIEW-WRITE`);
console.log(`task create "T-REVIEW-WRITE-03: 检查描写密度（过多/过少）"          parent=T-REVIEW-WRITE`);
console.log(`task create "T-REVIEW-WRITE-04: 检查禁用词（高频AI词汇）"          parent=T-REVIEW-WRITE`);
console.log('');

console.log('# ===== 第3层-商业审查：4项 =====');
console.log(`task create "T-REVIEW-BIZ-01: 检查爽点密度（每3000-5000字有爽点）"  parent=T-REVIEW-BIZ`);
console.log(`task create "T-REVIEW-BIZ-02: 检查钩子效果（足够吸引翻页）"        parent=T-REVIEW-BIZ`);
console.log(`task create "T-REVIEW-BIZ-03: 检查题材适配（写法符合题材特点）"     parent=T-REVIEW-BIZ`);
console.log(`task create "T-REVIEW-BIZ-04: 检查平台适配（适合目标平台）"        parent=T-REVIEW-BIZ`);
console.log('');

console.log('# ===== 第3层-一致性审查：4项 =====');
console.log(`task create "T-REVIEW-CON-01: 检查事实一致（设定/属性前后一致）"    parent=T-REVIEW-CON`);
console.log(`task create "T-REVIEW-CON-02: 检查时间线（时间线是否混乱）"         parent=T-REVIEW-CON`);
console.log(`task create "T-REVIEW-CON-03: 检查伏笔回收（已埋伏笔有回收）"       parent=T-REVIEW-CON`);
console.log(`task create "T-REVIEW-CON-04: 检查角色状态（角色状态跟踪正确）"     parent=T-REVIEW-CON`);
console.log('');

console.log('# ===== 第3层-综合报告：3项 =====');
console.log(`task create "T-REVIEW-REPORT-01: 计算加权平均分"                    parent=T-REVIEW-REPORT`);
console.log(`task create "T-REVIEW-REPORT-02: 汇总优点+问题（按P0/P1/P2排序）"  parent=T-REVIEW-REPORT`);
console.log(`task create "T-REVIEW-REPORT-03: 输出修改建议"                      parent=T-REVIEW-REPORT`);
console.log('');

console.log(`# ===== 共24条任务创建完毕 =====`);
