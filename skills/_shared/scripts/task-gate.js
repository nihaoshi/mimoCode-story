#!/usr/bin/env node
/**
 * task-gate.js — 任务预检门禁
 * 
 * 用法：node task-gate.js <项目目录> <章节号>
 * 
 * 检查：
 * 1. 是否有 in_progress 的任务（从 memory 恢复）
 * 2. 任务树是否包含必要的子任务
 * 
 * 退出码：
 *   0 = 任务树就绪，可以开始写作
 *   1 = 有警告（任务不完整但可继续）
 *   2 = 无任务树，必须先创建（阻断）
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法：node task-gate.js <项目目录> <章节号>');
  process.exit(1);
}

const projectDir = args[0];
const chapterNum = args[1];

// 检查追踪上下文文件
const contextFile = path.join(projectDir, '追踪', '上下文.md');
if (!fs.existsSync(contextFile)) {
  console.log(`[TASK-GATE] 追踪/上下文.md 不存在，跳过任务检查`);
  process.exit(0);
}

const context = fs.readFileSync(contextFile, 'utf-8');

// 检查是否有当前章节的任务记录
const chapterPattern = new RegExp(`第${chapterNum}章.*任务|task.*${chapterNum}`, 'i');
const hasTaskRecord = chapterPattern.test(context);

// 检查是否有 in_progress 标记
const hasInProgress = /in_progress|进行中|正在执行/.test(context);

if (hasTaskRecord && hasInProgress) {
  console.log(`[TASK-GATE] ✅ 第${chapterNum}章任务树就绪`);
  process.exit(0);
}

if (hasTaskRecord) {
  console.log(`[TASK-GATE] ⚠️ 第${chapterNum}章有任务记录但非 in_progress`);
  process.exit(1);
}

// 无任务记录
console.log(`[TASK-GATE] ❌ 第${chapterNum}章无任务树，必须先创建`);
console.log(`[TASK-GATE] 请先创建任务树：`);
console.log(`  T-WRITE-${chapterNum}: 写第${chapterNum}章`);
console.log(`  ├── T-CTX-${chapterNum}: 读取上下文（15项）`);
console.log(`  ├── T-PREP-${chapterNum}: 准备层`);
console.log(`  ├── T-WRITE-${chapterNum}-DRAFT: 正文写作`);
console.log(`  ├── T-COUNT-${chapterNum}: 字数验证`);
console.log(`  ├── T-GATE-${chapterNum}: 质量门禁`);
console.log(`  └── T-TRACK-${chapterNum}: 追踪文件更新`);
process.exit(2);
