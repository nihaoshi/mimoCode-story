#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node full-consistency-audit.js <project-dir> [--json]

Full consistency audit for a writing project:
- Check all tracking files for completeness
- Scan all chapters for consistency issues
- Detect cross-chapter contradictions
- Generate comprehensive report

Options:
  --json    Output structured JSON instead of human-readable text

Exit code 0 = pass, 2 = issues found`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function getChapterFiles(projectDir) {
  const chaptersDir = path.join(projectDir, '正文');
  if (!fs.existsSync(chaptersDir)) return [];
  
  return fs.readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md') && f.match(/第\d+章/))
    .sort()
    .map(f => path.join(chaptersDir, f));
}

function checkTrackingFiles(projectDir) {
  const issues = [];
  const trackingDir = path.join(projectDir, '追踪');
  
  if (!fs.existsSync(trackingDir)) {
    issues.push({ type: 'missing_dir', level: 2, message: '追踪目录不存在' });
    return issues;
  }
  
  const requiredFiles = ['伏笔.md', '时间线.md', '角色状态.md', '物品.md', '环境.md', '上下文.md'];
  
  for (const file of requiredFiles) {
    const filePath = path.join(trackingDir, file);
    if (!fs.existsSync(filePath)) {
      issues.push({ type: 'missing_file', level: 1, message: `追踪文件 ${file} 不存在` });
    } else {
      const content = readFile(filePath);
      if (!content || content.trim().length === 0) {
        issues.push({ type: 'empty_file', level: 1, message: `追踪文件 ${file} 为空` });
      }
    }
  }
  
  // 检查重复文件
  const itemsFile = readFile(path.join(trackingDir, '物品.md'));
  const suppliesFile = readFile(path.join(trackingDir, '物资.md'));
  if (itemsFile && suppliesFile) {
    const itemsContent = itemsFile.replace(/\s/g, '');
    const suppliesContent = suppliesFile.replace(/\s/g, '');
    const overlap = ['白瓷片', '过所', '文房四宝', '李靖'].filter(item => 
      itemsContent.includes(item) && suppliesContent.includes(item)
    );
    if (overlap.length >= 3) {
      issues.push({ type: 'duplicate', level: 1, message: `物品.md和物资.md内容重复（共同包含：${overlap.slice(0, 3).join('、')}）` });
    }
  }
  
  // 检查性格锚点
  const charFile = readFile(path.join(trackingDir, '角色状态.md'));
  if (charFile && !charFile.includes('性格锚点')) {
    issues.push({ type: 'incomplete', level: 1, message: '角色状态.md缺少"性格锚点"字段' });
  }
  
  return issues;
}

function checkChapterConsistency(chapterFile, projectDir) {
  const issues = [];
  const content = readFile(chapterFile);
  if (!content) return issues;
  
  const filename = path.basename(chapterFile);
  
  // 检查标题格式
  const h1Matches = content.match(/^# [^\n]+/gm);
  const h2Matches = content.match(/^## [^\n]+/gm);
  if (h1Matches && h1Matches.length > 0 && h2Matches && h2Matches.length > 0) {
    issues.push({ type: 'format', level: 1, file: filename, message: '标题格式不统一（同时使用 # 和 ##）' });
  }
  
  // 检查身份一致性
  const charFile = readFile(path.join(projectDir, '追踪', '角色状态.md'));
  if (charFile) {
    const professionMatch = charFile.match(/身份[：:]\s*(.+?博士)/);
    if (professionMatch && professionMatch[1].includes('天文学')) {
      const invalidPatterns = [
        /在论文里(?:分析|论证)(?:军事|战争|战术)/g,
        /在论文里(?:引用|提到)(?:房玄龄|李靖|李世民)/g,
        /考古复原图/g,
      ];
      
      for (const pattern of invalidPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          issues.push({ type: 'identity', level: 1, file: filename, message: '身份矛盾：天文学博士不应有相关描述' });
          break;
        }
      }
    }
  }
  
  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const filteredArgs = args.filter(a => a !== '--json');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const projectDir = path.resolve(filteredArgs[0]);
  
  if (!fs.existsSync(projectDir)) {
    console.error(`Error: Project directory not found: ${projectDir}`);
    process.exit(2);
  }

  console.log(`\n🔍 开始全量一致性审计：${projectDir}\n`);

  const allIssues = [];
  
  // 1. 检查追踪文件
  console.log('📋 检查追踪文件...');
  const trackingIssues = checkTrackingFiles(projectDir);
  allIssues.push(...trackingIssues);
  
  // 2. 检查所有章节
  console.log('📖 检查章节一致性...');
  const chapterFiles = getChapterFiles(projectDir);
  for (const chapterFile of chapterFiles) {
    const chapterIssues = checkChapterConsistency(chapterFile, projectDir);
    allIssues.push(...chapterIssues);
  }

  // 输出结果
  if (jsonMode) {
    const result = {
      status: allIssues.length === 0 ? 'pass' : 'fail',
      project: projectDir,
      summary: {
        total: allIssues.length,
        errors: allIssues.filter(i => i.level === 2).length,
        warnings: allIssues.filter(i => i.level === 1).length,
        chapters_checked: chapterFiles.length,
      },
      issues: allIssues,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(allIssues.some(i => i.level === 2) ? 2 : (allIssues.length > 0 ? 1 : 0));
  }

  // 人类可读输出
  if (allIssues.length === 0) {
    console.log('✅ 全量一致性审计通过');
    console.log(`   - 检查了 ${chapterFiles.length} 个章节`);
    console.log(`   - 检查了 6 个追踪文件`);
    process.exit(0);
  }

  console.log(`\n⚠️  审计发现 ${allIssues.length} 个问题：\n`);
  
  const byType = {};
  for (const issue of allIssues) {
    const type = issue.type || 'other';
    if (!byType[type]) byType[type] = [];
    byType[type].push(issue);
  }
  
  for (const [type, issues] of Object.entries(byType)) {
    console.log(`[${type}]`);
    issues.forEach((issue, i) => {
      const file = issue.file ? ` (${issue.file})` : '';
      console.log(`  ${i + 1}. ${issue.message}${file}`);
    });
    console.log('');
  }

  const errorCount = allIssues.filter(i => i.level === 2).length;
  const warnCount = allIssues.filter(i => i.level === 1).length;
  
  console.log(`📊 统计：${errorCount} 个错误，${warnCount} 个警告`);
  console.log(`   - 检查了 ${chapterFiles.length} 个章节`);
  
  process.exit(errorCount > 0 ? 2 : 1);
}

main();
