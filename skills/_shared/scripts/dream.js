#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { BANNED_LEVEL1 } = require("./banned-words");

const USAGE = `Usage: node dream.js <project-dir> [options]

扫描近期写作会话，提取经验并保存到 MEMORY.md。

Options:
  --days N            扫描最近N天的会话（默认：7）
  --session-id <ID>   指定会话ID
  --json              输出 JSON 格式

示例：
  node dream.js ./我的小说 --days 7
  node dream.js ./我的小说 --session-id ses_xxx`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function extractLessonsFromChapter(chapterText, filename) {
  const lessons = [];
  
  // 检测禁用词
  for (const word of BANNED_LEVEL1) {
    if (chapterText.includes(word)) {
      lessons.push({ type: 'banned_word', word, file: filename });
    }
  }
  
  // 检测AI腔模式
  const aiPatterns = [
    { pattern: /他不知道的是/g, desc: '章末预告体' },
    { pattern: /这一夜.*无人入睡/g, desc: '升华式结尾' },
    { pattern: /仿佛.*般/g, desc: '万能比喻' },
  ];
  
  for (const { pattern, desc } of aiPatterns) {
    if (pattern.test(chapterText)) {
      lessons.push({ type: 'ai_pattern', desc, file: filename });
    }
  }
  
  return lessons;
}

function extractEffectiveTechniques(chapterText) {
  const techniques = [];
  
  // 检测有效技法
  if (chapterText.match(/[「""](.{1,20})[」""]/)) {
    techniques.push('对话驱动');
  }
  
  if (chapterText.match(/(?:动作|转身|走|跑|坐|站|蹲)/)) {
    techniques.push('动作叙事');
  }
  
  if (chapterText.length > 3000 && chapterText.split('\n').length > 50) {
    techniques.push('段落节奏好');
  }
  
  return techniques;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  let days = 7;
  let sessionId = null;
  
  // 解析参数
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--session-id' && args[i + 1]) {
      sessionId = args[i + 1];
      i++;
    }
  }
  
  const filteredArgs = args.filter(a => !a.startsWith('--'));
  
  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }
  
  const projectDir = path.resolve(filteredArgs[0]);
  
  if (!fs.existsSync(projectDir)) {
    console.error(`Error: 项目目录不存在: ${projectDir}`);
    process.exit(2);
  }
  
  // 扫描章节文件
  const chaptersDir = path.join(projectDir, '正文');
  const lessons = [];
  const techniques = [];
  
  if (fs.existsSync(chaptersDir)) {
    const files = fs.readdirSync(chaptersDir)
      .filter(f => f.endsWith('.md') && f.match(/第\d+章/));
    
    // 只扫描最近的文件
    const recentFiles = files.slice(-Math.min(files.length, 10));
    
    for (const file of recentFiles) {
      const content = readFile(path.join(chaptersDir, file));
      if (content) {
        lessons.push(...extractLessonsFromChapter(content, file));
        techniques.push(...extractEffectiveTechniques(content));
      }
    }
  }
  
  // 统计经验
  const lessonCounts = {};
  for (const lesson of lessons) {
    const key = lesson.type + ':' + (lesson.word || lesson.desc);
    lessonCounts[key] = (lessonCounts[key] || 0) + 1;
  }
  
  const techniqueCounts = {};
  for (const tech of techniques) {
    techniqueCounts[tech] = (techniqueCounts[tech] || 0) + 1;
  }
  
  // 生成经验报告
  const report = {
    scan_time: new Date().toISOString(),
    project: projectDir,
    files_scanned: fs.existsSync(chaptersDir) ? fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md')).length : 0,
    lessons: Object.entries(lessonCounts).map(([key, count]) => {
      const [type, value] = key.split(':');
      return { type, value, count };
    }),
    techniques: Object.entries(techniqueCounts).map(([name, count]) => ({ name, count })),
  };
  
  // 保存到 MEMORY.md
  const memoryFile = path.join(projectDir, 'MEMORY.md');
  let memoryContent = readFile(memoryFile) || '';
  
  // 添加经验记录
  const timestamp = new Date().toISOString().split('T')[0];
  const experienceSection = `\n## 写作经验 (${timestamp})\n\n`;
  
  if (report.lessons.length > 0) {
    memoryContent += experienceSection + '### 需要注意的问题\n';
    for (const lesson of report.lessons) {
      memoryContent += `- ${lesson.type}: "${lesson.value}" 出现 ${lesson.count} 次\n`;
    }
  }
  
  if (report.techniques.length > 0) {
    memoryContent += '\n### 有效的技法\n';
    for (const tech of report.techniques) {
      memoryContent += `- ${tech.name}: 使用 ${tech.count} 次\n`;
    }
  }
  
  fs.writeFileSync(memoryFile, memoryContent, 'utf-8');
  
  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('\n💤 写作经验提取完成\n');
    console.log(`扫描了 ${report.files_scanned} 个章节文件`);
    
    if (report.lessons.length > 0) {
      console.log('\n⚠️  需要注意的问题：');
      for (const lesson of report.lessons) {
        console.log(`  - ${lesson.type}: "${lesson.value}" (${lesson.count}次)`);
      }
    }
    
    if (report.techniques.length > 0) {
      console.log('\n✅ 有效的技法：');
      for (const tech of report.techniques) {
        console.log(`  - ${tech.name} (${tech.count}次)`);
      }
    }
    
    console.log(`\n经验已保存到: ${memoryFile}`);
  }
  
  process.exit(0);
}

main();
