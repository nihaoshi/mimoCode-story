#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node cross-chapter-check.js <chapter-file> <project-dir> [options]

跨章节重复检测：检查当前章节与前 N 章之间的句子/段落/动作重复。

Options:
  --json              输出 JSON 格式
  --window N          滑动窗口大小（默认：5，即检查前 5 章）
  --min-length N      最小重复片段长度（默认：6 字）
  --min-count N       最小重复次数（默认：2 次）
  --write-fingerprint 生成跨章指纹文件（默认：不生成）

示例：
  node cross-chapter-check.js 正文/第005章.md ./我的小说
  node cross-chapter-check.js 正文/第005章.md ./我的小说 --window 3 --json`;

const DEFAULT_WINDOW = 5;
const DEFAULT_MIN_LENGTH = 6;
const DEFAULT_MIN_COUNT = 2;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function getChapterFiles(projectDir, currentFile, window) {
  const chaptersDir = path.join(projectDir, '正文');
  if (!fs.existsSync(chaptersDir)) return [];
  
  const currentBasename = path.basename(currentFile);
  const currentMatch = currentBasename.match(/第(\d+)章/);
  if (!currentMatch) return [];
  
  const currentNum = parseInt(currentMatch[1], 10);
  
  return fs.readdirSync(chaptersDir)
    .filter(f => {
      if (!f.endsWith('.md') || f === currentBasename) return false;
      const m = f.match(/第(\d+)章/);
      if (!m) return false;
      const num = parseInt(m[1], 10);
      return num < currentNum && num >= currentNum - window;
    })
    .sort()
    .map(f => path.join(chaptersDir, f));
}

function extractNGrams(text, n) {
  const ngrams = new Set();
  const cleanText = text.replace(/\s+/g, '');
  
  for (let i = 0; i <= cleanText.length - n; i++) {
    const ngram = cleanText.substring(i, i + n);
    if (/[\u4e00-\u9fa5]/.test(ngram)) {
      ngrams.add(ngram);
    }
  }
  
  return ngrams;
}

function extractSentences(text) {
  return text.split(/[。！？]/)
    .map(s => s.trim())
    .filter(s => s.length >= DEFAULT_MIN_LENGTH);
}

function extractActionPatterns(text) {
  const patterns = [];
  
  const actionRegex = /[\u4e00-\u9fa5]{2,6}(?:了|着|过)[\u4e00-\u9fa5]{0,6}/g;
  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    if (match[0].length >= 4) {
      patterns.push(match[0]);
    }
  }
  
  return patterns;
}

function checkSentenceDuplicates(currentContent, previousContents, minLength, minCount) {
  const issues = [];
  const currentSentences = extractSentences(currentContent);
  
  const allSentences = [];
  for (const { file, content, basename } of previousContents) {
    const sentences = extractSentences(content);
    for (const sent of sentences) {
      allSentences.push({ sentence: sent, file: basename });
    }
  }
  
  for (const currentSent of currentSentences) {
    if (currentSent.length < minLength) continue;
    
    const matches = allSentences.filter(({ sentence }) => 
      sentence.includes(currentSent) || currentSent.includes(sentence)
    );
    
    const uniqueChapters = [...new Set(matches.map(m => m.file))];
    if (uniqueChapters.length >= minCount - 1) {
      issues.push({
        type: 'sentence',
        level: 1,
        text: currentSent.substring(0, 50) + (currentSent.length > 50 ? '...' : ''),
        count: matches.length + 1,
        chapters: uniqueChapters,
      });
    }
  }
  
  return issues;
}

function checkParagraphDuplicates(currentContent, previousContents) {
  const issues = [];
  
  const currentParagraphs = currentContent.split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 50);
  
  const allParagraphs = [];
  for (const { file, content, basename } of previousContents) {
    const paragraphs = content.split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
    for (const para of paragraphs) {
      allParagraphs.push({ paragraph: para, file: basename });
    }
  }
  
  for (const currentPara of currentParagraphs) {
    const currentNgrams = extractNGrams(currentPara, 6);
    
    for (const { paragraph, file } of allParagraphs) {
      const otherNgrams = extractNGrams(paragraph, 6);
      
      const intersection = new Set([...currentNgrams].filter(x => otherNgrams.has(x)));
      const union = new Set([...currentNgrams, ...otherNgrams]);
      const similarity = intersection.size / union.size;
      
      if (similarity > 0.7) {
        issues.push({
          type: 'paragraph',
          level: 1,
          text: currentPara.substring(0, 50) + '...',
          similarity: Math.round(similarity * 100) + '%',
          chapter: file,
        });
        break;
      }
    }
  }
  
  return issues;
}

function checkActionDuplicates(currentContent, previousContents) {
  const issues = [];
  const currentActions = extractActionPatterns(currentContent);
  
  const actionCounts = {};
  for (const { file, content } of previousContents) {
    const actions = extractActionPatterns(content);
    for (const action of actions) {
      if (!actionCounts[action]) {
        actionCounts[action] = { count: 0, chapters: [] };
      }
      actionCounts[action].count++;
      if (!actionCounts[action].chapters.includes(file)) {
        actionCounts[action].chapters.push(file);
      }
    }
  }
  
  for (const action of currentActions) {
    if (actionCounts[action] && actionCounts[action].count >= 2) {
      const fullCount = actionCounts[action].count + 1;
      if (fullCount >= 3) {
        issues.push({
          type: 'action',
          level: 1,
          text: action,
          count: fullCount,
          chapters: actionCounts[action].chapters,
        });
      }
    }
  }
  
  const uniqueIssues = [];
  const seen = new Set();
  for (const issue of issues) {
    if (!seen.has(issue.text)) {
      seen.add(issue.text);
      uniqueIssues.push(issue);
    }
  }
  
  return uniqueIssues;
}

function generateFingerprint(projectDir, currentFile, previousContents) {
  const fingerprintPath = path.join(projectDir, '追踪', 'cross-chapter-fingerprint.md');
  const trackingDir = path.join(projectDir, '追踪');
  
  if (!fs.existsSync(trackingDir)) {
    fs.mkdirSync(trackingDir, { recursive: true });
  }
  
  const allFiles = [...previousContents.map(c => ({ file: c.basename, content: c.content }))];
  
  const currentBasename = path.basename(currentFile);
  const currentContent = readFile(currentFile);
  if (currentContent) {
    allFiles.push({ file: currentBasename, content: currentContent });
  }
  
  const chapterFingerprints = [];
  for (const { file, content } of allFiles) {
    const ngrams = extractNGrams(content, 6);
    chapterFingerprints.push({ file, count: ngrams.size });
  }
  
  const actionCounts = {};
  for (const { content } of allFiles) {
    const actions = extractActionPatterns(content);
    for (const action of actions) {
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    }
  }
  
  const frequentActions = Object.entries(actionCounts)
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  const sentenceCounts = {};
  for (const { content } of allFiles) {
    const sentences = extractSentences(content);
    for (const sent of sentences) {
      if (sent.length >= 10) {
        sentenceCounts[sent] = (sentenceCounts[sent] || 0) + 1;
      }
    }
  }
  
  const frequentSentences = Object.entries(sentenceCounts)
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  let md = '# 跨章指纹（自动生成，勿手动编辑）\n\n';
  md += `生成时间：${new Date().toISOString()}\n\n`;
  
  md += '## 最近章节指纹\n';
  for (const { file, count } of chapterFingerprints) {
    md += `- ${file}: ${count} 个 n-gram\n`;
  }
  
  if (frequentSentences.length > 0) {
    md += '\n## 高频重复片段（≥2次）\n';
    for (const [sent, count] of frequentSentences) {
      md += `- "${sent.substring(0, 30)}${sent.length > 30 ? '...' : ''}" (${count}次)\n`;
    }
  }
  
  if (frequentActions.length > 0) {
    md += '\n## 高频重复动作（≥3次）\n';
    for (const [action, count] of frequentActions) {
      md += `- ${action}: ${count}次\n`;
    }
  }
  
  fs.writeFileSync(fingerprintPath, md, 'utf-8');
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const writeFingerprint = args.includes('--write-fingerprint');
  let window = DEFAULT_WINDOW;
  let minLength = DEFAULT_MIN_LENGTH;
  let minCount = DEFAULT_MIN_COUNT;
  
  const filteredArgs = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json' || args[i] === '--write-fingerprint') {
      continue;
    } else if (args[i] === '--window' && args[i + 1]) {
      window = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--min-length' && args[i + 1]) {
      minLength = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--min-count' && args[i + 1]) {
      minCount = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(USAGE);
      process.exit(0);
    } else {
      filteredArgs.push(args[i]);
    }
  }
  
  if (filteredArgs.length < 2) {
    console.error('Error: 需要提供章节文件和项目目录');
    console.error(USAGE);
    process.exit(2);
  }
  
  const chapterFile = path.resolve(filteredArgs[0]);
  const projectDir = path.resolve(filteredArgs[1]);
  
  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: 章节文件不存在: ${chapterFile}`);
    process.exit(2);
  }
  
  if (!fs.existsSync(projectDir)) {
    console.error(`Error: 项目目录不存在: ${projectDir}`);
    process.exit(2);
  }
  
  const currentContent = readFile(chapterFile);
  if (!currentContent) {
    console.error(`Error: 无法读取章节文件: ${chapterFile}`);
    process.exit(2);
  }
  
  const previousFiles = getChapterFiles(projectDir, chapterFile, window);
  
  if (previousFiles.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({
        status: 'pass',
        file: chapterFile,
        summary: { sentence_dupes: 0, paragraph_dupes: 0, action_dupes: 0, chapters_checked: 0 },
        issues: [],
      }, null, 2));
    } else {
      console.log('✅ 无前序章节，跳过跨章重复检测');
    }
    process.exit(0);
  }
  
  const previousContents = previousFiles.map(f => ({
    file: f,
    basename: path.basename(f),
    content: readFile(f) || '',
  })).filter(c => c.content.length > 0);
  
  const allIssues = [];
  
  const sentenceIssues = checkSentenceDuplicates(currentContent, previousContents, minLength, minCount);
  allIssues.push(...sentenceIssues);
  
  const paragraphIssues = checkParagraphDuplicates(currentContent, previousContents);
  allIssues.push(...paragraphIssues);
  
  const actionIssues = checkActionDuplicates(currentContent, previousContents);
  allIssues.push(...actionIssues);
  
  if (writeFingerprint) {
    generateFingerprint(projectDir, chapterFile, previousContents);
  }
  
  const summary = {
    sentence_dupes: sentenceIssues.length,
    paragraph_dupes: paragraphIssues.length,
    action_dupes: actionIssues.length,
    chapters_checked: previousContents.length,
  };
  
  const status = allIssues.length > 0 ? 'fail' : 'pass';
  
  if (jsonMode) {
    console.log(JSON.stringify({
      status,
      file: chapterFile,
      summary,
      issues: allIssues,
    }, null, 2));
  } else {
    if (allIssues.length === 0) {
      console.log('✅ 跨章重复检测通过');
      console.log(`   检查了 ${previousContents.length} 个前序章节`);
    } else {
      console.log(`\n⚠️  发现 ${allIssues.length} 处跨章重复：\n`);
      
      if (sentenceIssues.length > 0) {
        console.log('📝 句子级重复：');
        for (const issue of sentenceIssues) {
          console.log(`  - "${issue.text}" (出现 ${issue.count} 次: ${issue.chapters.join(', ')})`);
        }
      }
      
      if (paragraphIssues.length > 0) {
        console.log('\n📄 段落级重复：');
        for (const issue of paragraphIssues) {
          console.log(`  - ${issue.text} (相似度 ${issue.similarity}, 与 ${issue.chapter})`);
        }
      }
      
      if (actionIssues.length > 0) {
        console.log('\n🎬 动作重复：');
        for (const issue of actionIssues) {
          console.log(`  - "${issue.text}" (出现 ${issue.count} 次: ${issue.chapters.join(', ')})`);
        }
      }
      
      console.log(`\n📊 检查了 ${previousContents.length} 个前序章节`);
    }
  }
  
  process.exit(allIssues.length > 0 ? 2 : 0);
}

main();
