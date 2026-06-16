#!/usr/bin/env node
/**
 * task-gen-audit.js — 全量审计任务树生成器
 * 
 * 用法：node task-gen-audit.js <项目名>
 */

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('用法：node task-gen-audit.js <项目名>');
  process.exit(1);
}

const projectName = args[0];
const projectId = projectName.replace(/[^a-zA-Z0-9]/g, '-');

console.log(`# ===== 全量审计「${projectName}」任务树 =====`);
console.log('');

console.log('# ===== 第1层：父任务 =====');
console.log(`task create "T-AUDIT-${projectId}: 全量审计「${projectName}」" → T-AUDIT-${projectId}`);
console.log('');

console.log('# ===== 第2层：3个审计维度 =====');
console.log(`task create "T-AUDIT-TRACK-${projectId}: 追踪文件完整性检查"  parent=T-AUDIT-${projectId} → T-AUDIT-TRACK`);
console.log(`task create "T-AUDIT-CONSIST-${projectId}: 跨章节一致性检查"  parent=T-AUDIT-${projectId} → T-AUDIT-CONSIST`);
console.log(`task create "T-AUDIT-CONTRA-${projectId}: 跨章节矛盾检测"    parent=T-AUDIT-${projectId} → T-AUDIT-CONTRA`);
console.log(`task create "T-AUDIT-REPORT-${projectId}: 输出审计报告"       parent=T-AUDIT-${projectId} → T-AUDIT-REPORT`);
console.log('');

console.log('# ===== 第3层-追踪完整性：6项 =====');
const trackItems = ['伏笔.md', '时间线.md', '角色状态.md', '物品.md', '环境.md', '上下文.md'];
trackItems.forEach((item, i) => {
  console.log(`task create "T-AUDIT-TRACK-0${i + 1}: 检查${item}存在且有内容" parent=T-AUDIT-TRACK`);
});
console.log('');

console.log('# ===== 第3层-一致性检查：4项 =====');
console.log(`task create "T-AUDIT-CONSIST-01: 物品位置是否前后一致"    parent=T-AUDIT-CONSIST`);
console.log(`task create "T-AUDIT-CONSIST-02: 角色状态是否前后一致"    parent=T-AUDIT-CONSIST`);
console.log(`task create "T-AUDIT-CONSIST-03: 环境描述是否前后一致"    parent=T-AUDIT-CONSIST`);
console.log(`task create "T-AUDIT-CONSIST-04: 身份设定是否前后一致"    parent=T-AUDIT-CONSIST`);
console.log('');

console.log('# ===== 第3层-矛盾检测：3项 =====');
console.log(`task create "T-AUDIT-CONTRA-01: 时间线是否合理"           parent=T-AUDIT-CONTRA`);
console.log(`task create "T-AUDIT-CONTRA-02: 伏笔是否遗漏"            parent=T-AUDIT-CONTRA`);
console.log(`task create "T-AUDIT-CONTRA-03: 角色行为是否符合人设"     parent=T-AUDIT-CONTRA`);
console.log('');

console.log('# ===== 第3层-修正（条件创建） =====');
console.log(`task create "T-AUDIT-FIX-${projectId}: 修正 — 发现问题时start" parent=T-AUDIT-${projectId}`);
console.log('');

console.log(`# ===== 共14条任务创建完毕 =====`);
