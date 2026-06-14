#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node distill.js <project-dir> [options]

分析写作工作流，发现重复模式并建议优化。

Options:
  --days N            分析最近N天的数据（默认：30）
  --json              输出 JSON 格式

示例：
  node distill.js ./我的小说 --days 30`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function analyzeWritingPattern(chaptersDir) {
  if (!fs.existsSync(chaptersDir)) return null;
  
  const files = fs.readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md') && f.match(/第\d+章/))
    .sort();
  
  if (files.length === 0) return null;
  
  const stats = {
    total_files: files.length,
    total_chars: 0,
    avg_chars: 0,
    min_chars: Infinity,
    max_chars: 0,
    word_count_trend: [],
  };
  
  for (const file of files) {
    const content = readFile(path.join(chaptersDir, file));
    if (content) {
      const chars = content.length;
      stats.total_chars += chars;
      stats.min_chars = Math.min(stats.min_chars, chars);
      stats.max_chars = Math.max(stats.max_chars, chars);
      
      const chapterMatch = file.match(/第(\d+)章/);
      if (chapterMatch) {
        stats.word_count_trend.push({
          chapter: parseInt(chapterMatch[1], 10),
          chars,
        });
      }
    }
  }
  
  stats.avg_chars = Math.round(stats.total_chars / stats.total_files);
  
  return stats;
}

function analyzeRepeatedPatterns(chaptersDir) {
  if (!fs.existsSync(chaptersDir)) return [];
  
  const patterns = [];
  const files = fs.readdirSync(chaptersDir)
    .filter(f => f.endsWith('.md') && f.match(/第\d+章/))
    .sort();
  
  // 合并所有章节内容
  let allContent = '';
  for (const file of files) {
    const content = readFile(path.join(chaptersDir, file));
    if (content) allContent += content + '\n';
  }
  
  // 检测重复句式
  const sentences = allContent.split(/[。！？]/).filter(s => s.trim().length > 10);
  const sentenceStarts = {};
  
  for (const sent of sentences) {
    const start = sent.trim().substring(0, 6);
    if (start) {
      sentenceStarts[start] = (sentenceStarts[start] || 0) + 1;
    }
  }
  
  for (const [start, count] of Object.entries(sentenceStarts)) {
    if (count >= 5) {
      patterns.push({
        type: 'repeated_sentence_start',
        pattern: start + '...',
        count,
        suggestion: `句式"${start}"重复${count}次，建议变换开头`,
      });
    }
  }
  
  // 检测重复用词
  const words = allContent.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const wordCounts = {};
  for (const word of words) {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  }
  
  const totalWords = words.length;
  for (const [word, count] of Object.entries(wordCounts)) {
    const ratio = count / totalWords;
    if (ratio > 0.01 && count >= 20) {
      patterns.push({
        type: 'repeated_word',
        pattern: word,
        count,
        ratio: Math.round(ratio * 10000) / 100,
        suggestion: `"${word}"出现频率过高(${(ratio * 100).toFixed(1)}%)，建议替换`,
      });
    }
  }
  
  return patterns;
}

function analyzeWorkflowEfficiency(projectDir) {
  const suggestions = [];
  
  // 检查追踪文件
  const trackingDir = path.join(projectDir, '追踪');
  if (fs.existsSync(trackingDir)) {
    const files = fs.readdirSync(trackingDir);
    if (files.length < 5) {
      suggestions.push({
        type: 'missing_tracking',
        description: '追踪文件不完整',
        suggestion: '建议补充伏笔、时间线、角色状态等追踪文件',
      });
    }
  }
  
  // 检查大纲
  const outlineDir = path.join(projectDir, '大纲');
  if (fs.existsSync(outlineDir)) {
    const files = fs.readdirSync(outlineDir).filter(f => f.endsWith('.md'));
    const chaptersDir = path.join(projectDir, '正文');
    const chapterFiles = fs.existsSync(chaptersDir) 
      ? fs.readdirSync(chaptersDir).filter(f => f.endsWith('.md')).length 
      : 0;
    
    if (chapterFiles > 0 && files.length < chapterFiles / 2) {
      suggestions.push({
        type: 'insufficient_outline',
        description: '细纲数量不足',
        suggestion: '建议为每章创建细纲，提高写作效率',
      });
    }
  }
  
  return suggestions;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  let days = 30;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--days' && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
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
  
  const chaptersDir = path.join(projectDir, '正文');
  
  // 分析写作模式
  const writingStats = analyzeWritingPattern(chaptersDir);
  const repeatedPatterns = analyzeRepeatedPatterns(chaptersDir);
  const workflowSuggestions = analyzeWorkflowEfficiency(projectDir);
  
  const report = {
    analysis_time: new Date().toISOString(),
    project: projectDir,
    writing_stats: writingStats,
    repeated_patterns: repeatedPatterns,
    workflow_suggestions: workflowSuggestions,
  };
  
  if (jsonMode) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('\n🔍 工作流分析完成\n');
    
    if (writingStats) {
      console.log('📊 写作统计：');
      console.log(`  - 总章节数: ${writingStats.total_files}`);
      console.log(`  - 平均字数: ${writingStats.avg_chars}`);
      console.log(`  - 最短章节: ${writingStats.min_chars} 字`);
      console.log(`  - 最长章节: ${writingStats.max_chars} 字`);
    }
    
    if (repeatedPatterns.length > 0) {
      console.log('\n⚠️  重复模式：');
      for (const pattern of repeatedPatterns.slice(0, 10)) {
        console.log(`  - ${pattern.suggestion}`);
      }
    }
    
    if (workflowSuggestions.length > 0) {
      console.log('\n💡 优化建议：');
      for (const suggestion of workflowSuggestions) {
        console.log(`  - ${suggestion.suggestion}`);
      }
    }
    
    if (repeatedPatterns.length === 0 && workflowSuggestions.length === 0) {
      console.log('\n✅ 工作流状态良好，无需优化');
    }
  }
  
  process.exit(0);
}

main();
