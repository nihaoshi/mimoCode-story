#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node quality-gate.js <chapter-file> [project-dir] [--json] [--full]

Unified quality gate that runs all checks and blocks output if standards aren't met.

Checks:
  1. style-lint       — Level 1 banned words → BLOCK
  2. consistency      — Item/environment/character/timeline errors → BLOCK
  3. foreshadow       — Overdue foreshadowing (>50 chapters) → WARN
  4. wordcount        — Chapter word count < target 90% → BLOCK
  5. cross-chapter    — Cross-chapter duplicate detection → WARN
  6. voice-check      — Character voice consistency → WARN
  7. emotion-analyzer — Emotion curve flatness → WARN
  8. satisfaction      — Satisfaction point density → WARN
  9. detect-story-gaps — Setting/outline/tracking gaps → WARN (full mode only)

Options:
  --json              Output structured JSON
  --full              Enable enhanced checks (identity, timeline, format)
  --target-words N    Override target word count (default: from 细纲 or 3000)
  --window N          Cross-chapter window size (default: 5)
  --skip-lint         Skip style-lint check
  --skip-consistency  Skip consistency check
  --skip-foreshadow   Skip foreshadow check
  --skip-cross-chapter Skip cross-chapter duplicate check
  --skip-voice        Skip voice-check
  --skip-emotion      Skip emotion-analyzer
  --skip-satisfaction Skip satisfaction-meter
  --fast              Only run blocking checks (skip warnings)

Exit codes:
  0 = all passed
  1 = warnings only (non-blocking)
  2 = blocked (must fix before continuing)`;

function runScript(scriptPath, args) {
  try {
    const output = execFileSync('node', [scriptPath, ...args], {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output: output.trim() };
  } catch (err) {
    return {
      exitCode: err.status || 1,
      output: (err.stdout || '').trim(),
      stderr: (err.stderr || '').trim(),
    };
  }
}

function parseJsonOutput(output) {
  try {
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function countWords(text) {
  const cleaned = text
    .replace(/[#*_`\[\](){}|\\~^>!-]/g, '')
    .replace(/\s+/g, '');
  return cleaned.length;
}

function getTargetWords(projectDir, chapterFile) {
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
  const fullMode = args.includes('--full');
  const skipLint = args.includes('--skip-lint');
  const skipConsistency = args.includes('--skip-consistency');
  const skipForeshadow = args.includes('--skip-foreshadow');
  const skipCrossChapter = args.includes('--skip-cross-chapter');
  const skipVoice = args.includes('--skip-voice');
  const skipEmotion = args.includes('--skip-emotion');
  const skipSatisfaction = args.includes('--skip-satisfaction');
  const fastMode = args.includes('--fast');

  const filteredArgs = args.filter(a =>
    a !== '--json' && a !== '--full' && a !== '--skip-lint' && a !== '--skip-consistency' && a !== '--skip-foreshadow' &&
    a !== '--skip-cross-chapter' && a !== '--skip-voice' && a !== '--skip-emotion' && a !== '--skip-satisfaction' && a !== '--fast'
  );

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  const projectDir = filteredArgs[1] ? path.resolve(filteredArgs[1]) : path.resolve(path.dirname(chapterFile), '..');

  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: Chapter file not found: ${chapterFile}`);
    process.exit(2);
  }

  const scriptsDir = path.join(__dirname);
  const results = {
    style_lint: null,
    consistency: null,
    foreshadow: null,
    wordcount: null,
    cross_chapter: null,
    voice: null,
    emotion: null,
    satisfaction: null,
    detect_story_gaps: null,
  };

  const blockers = [];
  const warnings = [];

  if (!skipLint) {
    const script = path.join(scriptsDir, 'style-lint.js');
    const lintArgs = ['--json', chapterFile];
    if (fullMode) lintArgs.push('--full');
    const r = runScript(script, lintArgs);
    const data = parseJsonOutput(r.output);
    results.style_lint = data || { status: 'error', raw: r.output };

    if (data && data.status === 'fail') {
      blockers.push(`文风检查失败：${data.summary.level1} 个一级禁用词`);
    }
  }

  if (!skipConsistency) {
    const script = path.join(scriptsDir, 'consistency-check.js');
    const consArgs = ['--json', chapterFile, projectDir];
    if (fullMode) consArgs.push('--full');
    const r = runScript(script, consArgs);
    const data = parseJsonOutput(r.output);
    results.consistency = data || { status: 'error', raw: r.output };

    if (data && data.status === 'error') {
      blockers.push(`一致性检查错误：${data.summary.errors} 个错误`);
    } else if (data && data.status === 'warn') {
      warnings.push(`一致性检查警告：${data.summary.warnings} 个警告`);
    }
  }

  if (!skipForeshadow) {
    const script = path.join(scriptsDir, 'foreshadow-check.js');
    const foresArgs = ['--json', chapterFile, projectDir];
    if (fullMode) foresArgs.push('--full');
    const r = runScript(script, foresArgs);
    const data = parseJsonOutput(r.output);
    results.foreshadow = data || { status: 'error', raw: r.output };

    if (data && data.status === 'warn' && data.summary.overdue > 0) {
      warnings.push(`伏笔逾期：${data.summary.overdue} 条伏笔超过 50 章未回收`);
    }
  }

  const targetWords = args.includes('--target-words')
    ? parseInt(args[args.indexOf('--target-words') + 1], 10)
    : getTargetWords(projectDir, chapterFile);

  const chapterText = fs.readFileSync(chapterFile, 'utf-8');
  const actualWords = countWords(chapterText);
  const wordRatio = actualWords / targetWords;

  results.wordcount = {
    status: wordRatio >= 0.9 ? 'pass' : 'fail',
    target: targetWords,
    actual: actualWords,
    ratio: Math.round(wordRatio * 100),
  };

  if (wordRatio < 0.9) {
    blockers.push(`字数不足：${actualWords}/${targetWords}（${Math.round(wordRatio * 100)}%），需达到 90%`);
  }

  if (!fastMode && !skipCrossChapter) {
    const script = path.join(scriptsDir, 'cross-chapter-check.js');
    const windowSize = args.includes('--window') ? parseInt(args[args.indexOf('--window') + 1], 10) : 5;
    const r = runScript(script, ['--json', chapterFile, projectDir, '--window', String(windowSize)]);
    const data = parseJsonOutput(r.output);
    results.cross_chapter = data || { status: 'error', raw: r.output };

    if (data && data.status === 'warn') {
      const total = (data.summary.sentence_dupes || 0) + (data.summary.paragraph_dupes || 0) + (data.summary.action_dupes || 0);
      warnings.push(`跨章重复：${total} 处重复（句子${data.summary.sentence_dupes || 0}、段落${data.summary.paragraph_dupes || 0}、动作${data.summary.action_dupes || 0}）`);
    }
  }

  if (!fastMode && !skipVoice) {
    const script = path.join(scriptsDir, 'voice-check.js');
    const r = runScript(script, ['--json', chapterFile, projectDir]);
    const data = parseJsonOutput(r.output);
    results.voice = data || { status: 'error', raw: r.output };

    if (data && data.status === 'warn') {
      warnings.push(`角色声音：${data.summary.warnings} 个警告`);
    }
  }

  if (!fastMode && !skipEmotion) {
    const script = path.join(scriptsDir, 'emotion-analyzer.js');
    const r = runScript(script, ['--json', chapterFile]);
    const data = parseJsonOutput(r.output);
    results.emotion = data || { status: 'error', raw: r.output };

    if (data && data.status === 'warn') {
      warnings.push(`情绪曲线：${data.summary.flat_warnings} 个平坦警告`);
    }
  }

  if (!fastMode && !skipSatisfaction) {
    const script = path.join(scriptsDir, 'satisfaction-meter.js');
    const r = runScript(script, ['--json', chapterFile]);
    const data = parseJsonOutput(r.output);
    results.satisfaction = data || { status: 'error', raw: r.output };

    if (data && data.status === 'warn') {
      warnings.push(`爽点密度：间距 ${data.summary.max_gap} 字超过目标`);
    }
  }

  if (fullMode) {
    const script = path.join(scriptsDir, 'detect-story-gaps.js');
    const r = runScript(script, ['--json', projectDir]);
    const data = parseJsonOutput(r.output);
    results.detect_story_gaps = data || { status: 'error', raw: r.output };

    if (data && data.summary) {
      if (data.summary.totalBlocking > 0) {
        warnings.push(`设定缺口：${data.summary.totalBlocking} 个阻断缺口`);
      }
      if (data.summary.totalWarnings > 0) {
        warnings.push(`设定缺口：${data.summary.totalWarnings} 个警告`);
      }
    }
  }

  const overallStatus = blockers.length > 0 ? 'blocked' : (warnings.length > 0 ? 'warn' : 'pass');

  if (jsonMode) {
    const result = {
      status: overallStatus,
      file: chapterFile,
      summary: {
        blockers: blockers.length,
        warnings: warnings.length,
        checks_run: Object.values(results).filter(v => v !== null).length,
      },
      blockers,
      warnings,
      details: results,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(blockers.length > 0 ? 2 : (warnings.length > 0 ? 1 : 0));
  }

  console.log('🔍 质量门禁检查报告');
  console.log('='.repeat(50));

  if (results.style_lint) {
    const s = results.style_lint;
    const icon = s.status === 'pass' ? '✅' : (s.status === 'fail' ? '❌' : '⚠️');
    console.log(`${icon} 文风检查：${s.status === 'pass' ? '通过' : `${s.summary?.level1 || 0} 个一级禁用词`}`);
  }

  if (results.consistency) {
    const s = results.consistency;
    const icon = s.status === 'pass' ? '✅' : (s.status === 'error' ? '❌' : '⚠️');
    console.log(`${icon} 一致性检查：${s.status === 'pass' ? '通过' : `${s.summary?.warnings || 0} 警告, ${s.summary?.errors || 0} 错误`}`);
  }

  if (results.foreshadow) {
    const s = results.foreshadow;
    const icon = s.status === 'pass' ? '✅' : '⚠️';
    console.log(`${icon} 伏笔检查：${s.status === 'pass' ? '通过' : `${s.summary?.overdue || 0} 条逾期`}`);
  }

  if (results.wordcount) {
    const s = results.wordcount;
    const icon = s.status === 'pass' ? '✅' : '❌';
    console.log(`${icon} 字数检查：${s.actual}/${s.target}（${s.ratio}%）`);
  }

  if (results.cross_chapter) {
    const s = results.cross_chapter;
    const icon = s.status === 'pass' ? '✅' : '⚠️';
    const total = (s.summary?.sentence_dupes || 0) + (s.summary?.paragraph_dupes || 0) + (s.summary?.action_dupes || 0);
    console.log(`${icon} 跨章重复：${s.status === 'pass' ? '通过' : `${total} 处重复`}`);
  }

  if (results.voice) {
    const s = results.voice;
    const icon = s.status === 'pass' ? '✅' : '⚠️';
    console.log(`${icon} 角色声音：${s.status === 'pass' ? '通过' : `${s.summary?.characters_found || 0} 角色, ${s.summary?.warnings || 0} 警告`}`);
  }

  if (results.emotion) {
    const s = results.emotion;
    const icon = s.status === 'pass' ? '✅' : '⚠️';
    console.log(`${icon} 情绪曲线：${s.status === 'pass' ? '通过' : `${s.summary?.flat_warnings || 0} 个平坦警告`}`);
  }

  if (results.satisfaction) {
    const s = results.satisfaction;
    const icon = s.status === 'pass' ? '✅' : '⚠️';
    console.log(`${icon} 爽点密度：${s.status === 'pass' ? '通过' : `间距 ${s.summary?.max_gap || 0} 字`}`);
  }

  if (results.detect_story_gaps) {
    const s = results.detect_story_gaps;
    if (s.summary) {
      const icon = (s.summary.totalBlocking || 0) > 0 ? '❌' : ((s.summary.totalWarnings || 0) > 0 ? '⚠️' : '✅');
      console.log(`${icon} 项目缺口：${s.summary.totalWarnings || 0} 警告, ${s.summary.totalBlocking || 0} 阻断`);
    }
  }

  console.log('='.repeat(50));

  if (blockers.length > 0) {
    console.log('\n🚫 阻断项（必须修复）：');
    blockers.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  警告项（建议修复）：');
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  if (blockers.length === 0 && warnings.length === 0) {
    console.log('\n✅ 全部通过！可以继续。');
  }

  process.exit(blockers.length > 0 ? 2 : (warnings.length > 0 ? 1 : 0));
}

main();
