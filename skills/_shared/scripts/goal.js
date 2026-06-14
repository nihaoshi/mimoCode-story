#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node goal.js <project-dir> --target <目标描述> [options]

设置写作目标，实现自主写作控制。

Options:
  --target <描述>     写作目标描述（必填）
  --min-words N       每章最低字数（默认：3000）
  --max-banned N      一级禁用词上限（默认：0）
  --max-chapters N    最大章节数
  --json              输出 JSON 格式

示例：
  node goal.js ./我的小说 --target "写到第30章" --min-words 3000
  node goal.js ./我的小说 --target "完成第一卷" --max-chapters 10`;

function die(msg) {
  console.error(`Error: ${msg}`);
  process.exit(2);
}

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function parseGoalFromText(text) {
  const goal = {};
  
  // 解析章节数目标
  const chapterMatch = text.match(/写到第(\d+)章/);
  if (chapterMatch) {
    goal.target_chapter = parseInt(chapterMatch[1], 10);
  }
  
  // 解析卷目标
  const volumeMatch = text.match(/完成第([一二三四五六七八九十]+)卷/);
  if (volumeMatch) {
    goal.target_volume = volumeMatch[1];
  }
  
  // 解析字数目标
  const wordsMatch = text.match(/(\d+)万?字/);
  if (wordsMatch) {
    goal.target_words = parseInt(wordsMatch[1], 10);
  }
  
  return goal;
}

function getProgress(projectDir) {
  const chaptersDir = path.join(projectDir, '正文');
  if (!fs.existsSync(chaptersDir)) return { current: 0, files: [] };
  
  const files = fs.readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md') && f.match(/第\d+章/))
    .sort();
  
  const lastFile = files[files.length - 1];
  let current = 0;
  if (lastFile) {
    const m = lastFile.match(/第(\d+)章/);
    if (m) current = parseInt(m[1], 10);
  }
  
  return { current, files };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  
  // 解析参数
  let target = null;
  let minWords = 3000;
  let maxBanned = 0;
  let maxChapters = null;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      target = args[i + 1];
      i++;
    } else if (args[i] === '--min-words' && args[i + 1]) {
      minWords = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--max-banned' && args[i + 1]) {
      maxBanned = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--max-chapters' && args[i + 1]) {
      maxChapters = parseInt(args[i + 1], 10);
      i++;
    }
  }
  
  // 过滤位置参数
  const filteredArgs = args.filter(a => 
    !a.startsWith('--') && 
    a !== target
  );
  
  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }
  
  const projectDir = path.resolve(filteredArgs[0]);
  
  if (!fs.existsSync(projectDir)) {
    die(`项目目录不存在: ${projectDir}`);
  }
  
  if (!target) {
    die('必须指定 --target 参数');
  }
  
  // 解析目标
  const goal = parseGoalFromText(target);
  goal.target_description = target;
  goal.min_words = minWords;
  goal.max_banned = maxBanned;
  if (maxChapters) goal.max_chapters = maxChapters;
  
  // 获取当前进度
  const progress = getProgress(projectDir);
  goal.current_chapter = progress.current;
  goal.chapters_written = progress.files.length;
  
  // 检查是否已完成
  let completed = false;
  let reason = '';
  
  if (goal.target_chapter && progress.current >= goal.target_chapter) {
    completed = true;
    reason = `已达到目标章节 ${goal.target_chapter}`;
  }
  
  if (goal.max_chapters && progress.files.length >= goal.max_chapters) {
    completed = true;
    reason = `已达到最大章节数 ${goal.max_chapters}`;
  }
  
  goal.completed = completed;
  goal.completion_reason = reason;
  
  // 保存 goal 配置
  const goalFile = path.join(projectDir, '.story-goal.json');
  fs.writeFileSync(goalFile, JSON.stringify(goal, null, 2), 'utf-8');
  
  if (jsonMode) {
    console.log(JSON.stringify(goal, null, 2));
  } else {
    console.log('\n🎯 写作目标已设置\n');
    console.log(`项目: ${projectDir}`);
    console.log(`目标: ${target}`);
    console.log(`当前进度: 第${progress.current}章 (${progress.files.length}个文件)`);
    console.log(`每章最低字数: ${minWords}`);
    console.log(`一级禁用词上限: ${maxBanned}`);
    
    if (goal.target_chapter) {
      console.log(`目标章节: 第${goal.target_chapter}章`);
      console.log(`剩余: ${goal.target_chapter - progress.current} 章`);
    }
    
    if (completed) {
      console.log(`\n✅ ${reason}`);
    } else {
      console.log(`\n📝 继续写作...`);
    }
    
    console.log(`\n配置已保存: ${goalFile}`);
  }
  
  process.exit(0);
}

main();
