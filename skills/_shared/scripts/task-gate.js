#!/usr/bin/env node
/**
 * task-gate.js — 任务预检门禁
 * 
 * 用法：node task-gate.js <项目目录> <章节号> [action]
 * 
 * action:
 *   check  — 检查任务是否已创建（默认）
 *   mark   — 标记任务已创建
 * 
 * 逻辑：
 *   1. skill 触发时，AI 必须先创建任务树
 *   2. 创建完后调用 task-gate.js <项目目录> <章节号> mark
 *   3. 写正文前调用 task-gate.js <项目目录> <章节号> check
 *   4. check 发现没 mark 过 → 阻断，必须先创建任务
 * 
 * 退出码：
 *   0 = 任务已就绪
 *   1 = 警告
 *   2 = 阻断：未标记任务创建，必须先创建任务树
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法：node task-gate.js <项目目录> <章节号> [check|mark]');
  process.exit(1);
}

const projectDir = args[0];
const chapterNum = args[1];
const action = args[2] || 'check';

// 任务标记文件
const markerDir = path.join(projectDir, '.task-markers');
const markerFile = path.join(markerDir, `chapter-${chapterNum}.created`);

if (action === 'mark') {
  // 标记任务已创建
  if (!fs.existsSync(markerDir)) {
    fs.mkdirSync(markerDir, { recursive: true });
  }
  const content = JSON.stringify({
    chapter: chapterNum,
    createdAt: new Date().toISOString(),
    status: 'created'
  }, null, 2);
  fs.writeFileSync(markerFile, content, 'utf-8');
  console.log(`[TASK-GATE] ✅ 已标记第${chapterNum}章任务已创建`);
  process.exit(0);
}

if (action === 'check') {
  // 检查任务是否已创建
  if (!fs.existsSync(markerFile)) {
    console.log(`[TASK-GATE] ❌ 第${chapterNum}章未标记任务创建`);
    console.log(`[TASK-GATE] 必须先创建任务树：`);
    console.log(`  1. 创建 T-WRITE-${chapterNum}: 写第${chapterNum}章`);
    console.log(`  2. 创建子任务（上下文/准备层/写作/字数/质量门禁/追踪）`);
    console.log(`  3. 运行 node task-gate.js <项目目录> ${chapterNum} mark`);
    console.log(`  4. 然后才能开始写正文`);
    process.exit(2);
  }

  // 已标记，检查状态
  const marker = JSON.parse(fs.readFileSync(markerFile, 'utf-8'));
  
  if (marker.status === 'created') {
    console.log(`[TASK-GATE] ✅ 第${chapterNum}章任务已就绪`);
    process.exit(0);
  }

  if (marker.status === 'in_progress') {
    console.log(`[TASK-GATE] ⚠️ 第${chapterNum}章任务进行中`);
    process.exit(1);
  }

  if (marker.status === 'done') {
    console.log(`[TASK-GATE] ✅ 第${chapterNum}章已完成`);
    process.exit(0);
  }
}

console.error(`[TASK-GATE] 未知操作: ${action}`);
process.exit(1);
