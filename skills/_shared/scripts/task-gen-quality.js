#!/usr/bin/env node
/**
 * task-gen-quality.js — 质量检查任务树生成器
 * 
 * 用法：node task-gen-quality.js <文件名> [--full]
 * 
 * --full 增加跨章节+满意度+故事漏洞检测
 */

const args = process.argv.slice(2);
const isFull = args.includes('--full');
const fileName = args.find(a => !a.startsWith('--'));
const fileId = fileName.replace(/[^a-zA-Z0-9]/g, '-');
const mode = isFull ? 'FULL' : 'STD';

console.log(`# ===== 质量检查「${fileName}」任务树 [${mode}模式] =====`);
console.log('');

console.log('# ===== 第1层：父任务 =====');
console.log(`task create "T-QUALITY-${fileId}: 质量检查「${fileName}」" → T-QUALITY-${fileId}`);
console.log('');

console.log('# ===== 第2层：标准7项检测 =====');
const stdTasks = [
  { id: 'BAN', name: 'detect-banned-words — 禁用词扫描' },
  { id: 'AI', name: 'detect-ai-sentence — AI腔扫描' },
  { id: 'CON', name: 'detect-consistency — 一致性检查' },
  { id: 'FORESH', name: 'detect-foreshadow — 伏笔检查' },
  { id: 'WC', name: 'detect-wordcount — 字数检查' },
  { id: 'VOICE', name: 'detect-voice — 角色声音检查' },
  { id: 'EMO', name: 'detect-emotion-curve — 情绪曲线检查' },
];

stdTasks.forEach(t => {
  console.log(`task create "T-QUALITY-${fileId}-${t.id}: ${t.name}" parent=T-QUALITY-${fileId}`);
});
console.log('');

if (isFull) {
  console.log('# ===== 第2层：增强3项检测（--full模式） =====');
  const fullTasks = [
    { id: 'XCHAPTER', name: 'detect-cross-chapter — 跨章节一致性' },
    { id: 'SAT', name: 'detect-satisfaction — 读者满意度预检' },
    { id: 'GAPS', name: 'detect-story-gaps — 故事漏洞检测' },
  ];
  fullTasks.forEach(t => {
    console.log(`task create "T-QUALITY-${fileId}-${t.id}: ${t.name}" parent=T-QUALITY-${fileId}`);
  });
  console.log('');
}

console.log('# ===== 第2层：修正+复查 =====');
console.log(`task create "T-QUALITY-${fileId}-FIX: 修正 — 任一BLOCK时start" parent=T-QUALITY-${fileId}`);
console.log(`task create "T-QUALITY-${fileId}-RECHECK: 复查 — FIX完成后start" parent=T-QUALITY-${fileId}`);
console.log('');

console.log('# ===== 第2层：输出报告 =====');
console.log(`task create "T-QUALITY-${fileId}-REPORT: 输出检查报告" parent=T-QUALITY-${fileId}`);
console.log('');

const total = stdTasks.length + (isFull ? 3 : 0) + 3; // std + full? + fix + recheck + report
console.log(`# ===== 共${total}条任务创建完毕 =====`);
