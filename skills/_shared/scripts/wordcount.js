#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node wordcount.js <chapter-file> [--target N] [--json]

Count chapter word count using unified algorithm.

Options:
  --target N    Target word count (default: from outline or 3000)
  --json        Output structured JSON
  --ratio       Output ratio only (for scripting)

Algorithm:
  1. Strip markdown formatting (headings, links, code blocks, etc.)
  2. Strip all whitespace and ASCII punctuation
  3. Count remaining characters (Chinese chars + Chinese punctuation)
  
  This matches the quality-gate.js countWords() algorithm for consistency.

Exit codes:
  0 = word count >= 90% of target
  1 = word count < 90% of target
  2 = error (file not found, etc.)`;

function countWords(text) {
  const cleaned = text
    .replace(/[#*_`\[\](){}|\\~^>!-]/g, '')
    .replace(/\s+/g, '');
  return cleaned.length;
}

function getTargetFromOutline(projectDir, chapterFile) {
  const chapterName = path.basename(chapterFile, '.md');
  const chapterNumMatch = chapterName.match(/第(\d+)章/);
  if (!chapterNumMatch) return 3000;

  const chapterNum = chapterNumMatch[1].padStart(3, '0');
  const outlineFile = path.join(projectDir, '大纲', `细纲_第${chapterNum}章.md`);

  if (fs.existsSync(outlineFile)) {
    const outlineText = fs.readFileSync(outlineFile, 'utf-8');
    const targetMatch = outlineText.match(/字数目标[：:]\s*(\d+)/);
    if (targetMatch) return parseInt(targetMatch[1], 10);
  }

  return 3000;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const ratioMode = args.includes('--ratio');
  const filteredArgs = args.filter(a => a !== '--json' && a !== '--ratio');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const targetWords = filteredArgs.includes('--target')
    ? parseInt(filteredArgs[filteredArgs.indexOf('--target') + 1], 10)
    : (() => {
        const projectDir = path.resolve(path.dirname(chapterFile), '..');
        return getTargetFromOutline(projectDir, chapterFile);
      })();

  const chapterText = fs.readFileSync(chapterFile, 'utf-8');
  const actualWords = countWords(chapterText);
  const ratio = actualWords / targetWords;
  const ratioPercent = Math.round(ratio * 100);

  if (ratioMode) {
    console.log(`${ratioPercent}`);
    process.exit(ratio >= 0.9 ? 0 : 1);
  }

  if (jsonMode) {
    console.log(JSON.stringify({
      file: chapterFile,
      actual: actualWords,
      target: targetWords,
      ratio: ratioPercent,
      passed: ratio >= 0.9,
    }, null, 2));
    process.exit(ratio >= 0.9 ? 0 : 1);
  }

  const icon = ratio >= 0.9 ? '✅' : '❌';
  console.log(`${icon} 字数：${actualWords}/${targetWords}（${ratioPercent}%）`);
  process.exit(ratio >= 0.9 ? 0 : 1);
}

main();
