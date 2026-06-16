#!/usr/bin/env node
/**
 * task-gen-deslop.js — 去AI味任务树生成器
 * 
 * 用法：node task-gen-deslop.js <文件名>
 * 
 * 输出：固定格式的任务创建指令列表
 */

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('用法：node task-gen-deslop.js <文件名>');
  process.exit(1);
}

const fileName = args[0];
const fileId = fileName.replace(/[^a-zA-Z0-9]/g, '-');

console.log(`# ===== 去AI味「${fileName}」任务树 =====`);
console.log(`# 共18条任务，必须逐条创建`);
console.log('');

// 第1层：父任务
console.log('# ===== 第1层：父任务 =====');
console.log(`task create "T-DESLOP-${fileId}: 去AI味「${fileName}」" → T-DESLOP-${fileId}`);
console.log('');

// 第2层：4个阶段
console.log('# ===== 第2层：阶段任务 =====');
console.log(`task create "T-DESLOP-${fileId}-SCAN: Phase1 AI味扫描"      parent=T-DESLOP-${fileId} → T-DESLOP-SCAN`);
console.log(`task create "T-DESLOP-${fileId}-GRADE: Phase2 诊断分级"     parent=T-DESLOP-${fileId} → T-DESLOP-GRADE`);
console.log(`task create "T-DESLOP-${fileId}-FIX: Phase3 逐项清除"       parent=T-DESLOP-${fileId} → T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-${fileId}-OUTPUT: Phase4 输出结果"    parent=T-DESLOP-${fileId} → T-DESLOP-OUTPUT`);
console.log('');

// 第3层：扫描阶段
console.log('# ===== 第3层-扫描：6个子任务 =====');
console.log(`task create "T-DESLOP-SCAN-01: 统计禁用词数量"      parent=T-DESLOP-SCAN`);
console.log(`task create "T-DESLOP-SCAN-02: 标记AI腔句式位置"    parent=T-DESLOP-SCAN`);
console.log(`task create "T-DESLOP-SCAN-03: 标记心理直述位置"    parent=T-DESLOP-SCAN`);
console.log(`task create "T-DESLOP-SCAN-04: 标记排比/节奏问题"   parent=T-DESLOP-SCAN`);
console.log(`task create "T-DESLOP-SCAN-05: 标记对话腔调问题"    parent=T-DESLOP-SCAN`);
console.log(`task create "T-DESLOP-SCAN-06: 输出扫描报告"        parent=T-DESLOP-SCAN`);
console.log('');

// 第3层：分级阶段
console.log('# ===== 第3层-分级：3个子任务 =====');
console.log(`task create "T-DESLOP-GRADE-01: 计算禁用词密度（处/千字）" parent=T-DESLOP-GRADE`);
console.log(`task create "T-DESLOP-GRADE-02: 判定等级（轻度≤5/中度6-15/重度>15）" parent=T-DESLOP-GRADE`);
console.log(`task create "T-DESLOP-GRADE-03: 确定需要过哪些Gate"  parent=T-DESLOP-GRADE`);
console.log('');

// 第3层：清除阶段（Gate A~F + 标点）
console.log('# ===== 第3层-清除：7个Gate（A~F + 标点） =====');
console.log(`task create "T-DESLOP-GATE-A: fix-banned-words — 禁用词替换为具体动作/细节"       parent=T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-GATE-B: fix-ai-sentence — 句式去套路（不是A而是B→直接写B）" parent=T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-GATE-C: fix-psychology-externalize — 心理直述→动作展示"     parent=T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-GATE-D: fix-rhythm-break — 打散排比+长句拆短+段落交错"      parent=T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-GATE-E: fix-dialogue-naturalize — 对话加口语化+打断+废话"    parent=T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-GATE-F: fix-ending-desublimate — 删总结升华+动作收尾"       parent=T-DESLOP-FIX`);
console.log(`task create "T-DESLOP-PUNCT: fix-punctuation — 标点规范化+智能引号+不可见字符"     parent=T-DESLOP-FIX`);
console.log('');

// 第3层：输出阶段
console.log('# ===== 第3层-输出：4个子任务 =====');
console.log(`task create "T-DESLOP-OUTPUT-01: 统计原文字数"      parent=T-DESLOP-OUTPUT`);
console.log(`task create "T-DESLOP-OUTPUT-02: 统计修订字数"      parent=T-DESLOP-OUTPUT`);
console.log(`task create "T-DESLOP-OUTPUT-03: 计算净变化"        parent=T-DESLOP-OUTPUT`);
console.log(`task create "T-DESLOP-OUTPUT-04: 输出修改前后对比"  parent=T-DESLOP-OUTPUT`);
console.log('');

console.log(`# ===== 共18条任务创建完毕 =====`);
