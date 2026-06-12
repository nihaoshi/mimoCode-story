#!/usr/bin/env node
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node quality-gate.js <chapter-file> [project-dir] [--json]

Unified quality gate that runs all checks and blocks output if standards aren't met.

Checks:
  1. style-lint       — Level 1 banned words → BLOCK
  2. consistency      — Item/environment/character/timeline errors → BLOCK
  3. foreshadow       — Overdue foreshadowing (>50 chapters) → WARN
  4. wordcount        — Chapter word count < target 90% → BLOCK
  5. voice-check      — Character voice consistency → WARN
  6. emotion-analyzer — Emotion curve flatness → WARN
  7. satisfaction      — Satisfaction point density → WARN

Options:
  --json              Output structured JSON
  --target-words N    Override target word count (default: from 细纲 or 3000)
  --skip-lint         Skip style-lint check
  --skip-consistency  Skip consistency check
  --skip-foreshadow   Skip foreshadow check
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
  const skipLint = args.includes('--skip-lint');
  const skipConsistency = args.includes('--skip-consistency');
  const skipForeshadow = args.includes('--skip-foreshadow');
  const skipVoice = args.includes('--skip-voice');
  const skipEmotion = args.includes('--skip-emotion');
  const skipSatisfaction = args.includes('--skip-satisfaction');
  const fastMode = args.includes('--fast');

  const filteredArgs = args.filter(a =>
    a !== '--json' && a !== '--skip-lint' && a !== '--skip-consistency' && a !== '--skip-foreshadow' &&
    a !== '--skip-voice' && a !== '--skip-emotion' && a !== '--skip-satisfaction' && a !== '--fast'
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
    voice: null,
    emotion: null,
    satisfaction: null,
  };

  const blockers = [];
  const warnings = [];

  if (!skipLint) {
    const script = path.join(scriptsDir, 'style-lint.js');
    const r = runScript(script, ['--json', chapterFile]);
    const data = parseJsonOutput(r.output);
    results.style_lint = data || { status: 'error', raw: r.output };

    if (data && data.status === 'fail') {
      blockers.push(`文风检查失败：${data.summary.level1} 个一级禁用词`);
    }
  }

  if (!skipConsistency) {
    const script = path.join(scriptsDir, 'consistency-check.js');
    const r = runScript(script, ['--json', chapterFile, projectDir]);
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
    const r = runScript(script, ['--json', chapterFile, projectDir]);
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
