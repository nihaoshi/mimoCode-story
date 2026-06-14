#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node repair-scripts.js <project-dir> [--source <tool-source-dir>] [--json] [--dry-run]

Repair missing or outdated script files in a writing project:
- Detect missing scripts
- Copy scripts from tool source directory
- Verify repaired scripts

Options:
  --source <dir>    Source directory containing the tool scripts (default: auto-detect)
  --json            Output structured JSON instead of human-readable text
  --dry-run         Show what would be done without making changes

Exit code 0 = success, 1 = repairs needed, 2 = errors`;

const REQUIRED_SCRIPTS = [
  'consistency-check.js',
  'style-lint.js',
  'foreshadow-check.js',
  'quality-gate.js',
  'normalize-punctuation.js',
  'voice-check.js',
  'emotion-analyzer.js',
  'satisfaction-meter.js',
  'wordcount-pacer.js',
];

function detectToolSourceDir() {
  // 尝试多个可能的源目录
  const possiblePaths = [
    path.join(__dirname, '..'),  // 当前脚本的上级目录
    path.join(__dirname, '..', '..'),  // 上两级
    'D:\\mimoCode-story\\skills\\story-long-write-mimo',  // 固定路径（备用）
  ];
  
  for (const p of possiblePaths) {
    const scriptsDir = path.join(p, 'scripts');
    if (fs.existsSync(scriptsDir) && fs.existsSync(path.join(scriptsDir, 'consistency-check.js'))) {
      return scriptsDir;
    }
  }
  
  return null;
}

function getProjectScriptsDir(projectDir) {
  return path.join(projectDir, 'skills', 'story-long-write-mimo', 'scripts');
}

function checkMissingScripts(projectScriptsDir) {
  const missing = [];
  
  for (const script of REQUIRED_SCRIPTS) {
    const scriptPath = path.join(projectScriptsDir, script);
    if (!fs.existsSync(scriptPath)) {
      missing.push(script);
    }
  }
  
  return missing;
}

function repairScripts(projectScriptsDir, sourceScriptsDir, missingScripts, dryRun = false) {
  const repaired = [];
  const errors = [];
  
  // 确保目标目录存在
  if (!dryRun && !fs.existsSync(projectScriptsDir)) {
    try {
      fs.mkdirSync(projectScriptsDir, { recursive: true });
    } catch (err) {
      errors.push(`无法创建目录 ${projectScriptsDir}: ${err.message}`);
      return { repaired, errors };
    }
  }
  
  for (const script of missingScripts) {
    const sourcePath = path.join(sourceScriptsDir, script);
    const targetPath = path.join(projectScriptsDir, script);
    
    if (!fs.existsSync(sourcePath)) {
      errors.push(`源文件不存在: ${sourcePath}`);
      continue;
    }
    
    if (dryRun) {
      repaired.push({ script, action: 'would_copy', source: sourcePath, target: targetPath });
    } else {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        repaired.push({ script, action: 'copied', source: sourcePath, target: targetPath });
      } catch (err) {
        errors.push(`复制失败 ${script}: ${err.message}`);
      }
    }
  }
  
  return { repaired, errors };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const dryRun = args.includes('--dry-run');
  
  // 解析 --source 参数
  let sourceDir = null;
  const sourceIndex = args.indexOf('--source');
  if (sourceIndex !== -1 && args[sourceIndex + 1]) {
    sourceDir = path.resolve(args[sourceIndex + 1]);
  }
  
  // 过滤选项参数，保留位置参数
  const filteredArgs = [];
  let skipNext = false;
  for (let i = 0; i < args.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const a = args[i];
    if (a === '--json' || a === '--dry-run') continue;
    if (a === '--source') {
      skipNext = true;
      continue;
    }
    filteredArgs.push(a);
  }

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const projectDir = path.resolve(filteredArgs[0]);
  
  if (!fs.existsSync(projectDir)) {
    console.error(`Error: Project directory not found: ${projectDir}`);
    process.exit(2);
  }

  // 检测源目录
  if (!sourceDir) {
    sourceDir = detectToolSourceDir();
  }
  
  if (!sourceDir || !fs.existsSync(sourceDir)) {
    console.error('Error: 无法找到工具脚本源目录');
    console.error('请使用 --source 参数指定源目录');
    process.exit(2);
  }

  const projectScriptsDir = getProjectScriptsDir(projectDir);
  
  console.log(`\n🔧 脚本修复工具\n`);
  console.log(`项目目录: ${projectDir}`);
  console.log(`脚本目录: ${projectScriptsDir}`);
  console.log(`源目录: ${sourceDir}`);
  if (dryRun) console.log(`模式: 预演（不实际修改）`);
  console.log('');

  // 检测缺失脚本
  const missing = checkMissingScripts(projectScriptsDir);
  
  if (missing.length === 0) {
    console.log('✅ 所有脚本文件完整，无需修复');
    process.exit(0);
  }

  console.log(`⚠️  检测到 ${missing.length} 个缺失脚本：`);
  missing.forEach(s => console.log(`   - ${s}`));
  console.log('');

  // 执行修复
  const { repaired, errors } = repairScripts(projectScriptsDir, sourceDir, missing, dryRun);

  if (jsonMode) {
    const result = {
      status: errors.length > 0 ? 'error' : (repaired.length > 0 ? 'repaired' : 'complete'),
      project: projectDir,
      source: sourceDir,
      summary: {
        missing: missing.length,
        repaired: repaired.length,
        errors: errors.length,
      },
      repaired,
      errors,
      dry_run: dryRun,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(errors.length > 0 ? 2 : 0);
  }

  // 输出结果
  if (repaired.length > 0) {
    console.log(`${dryRun ? '📋 预演结果' : '✅ 修复完成'}：`);
    repaired.forEach(r => {
      console.log(`   ${dryRun ? '→' : '✓'} ${r.script}`);
    });
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ 修复错误：');
    errors.forEach(e => console.log(`   - ${e}`));
    console.log('');
    process.exit(2);
  }

  if (!dryRun && repaired.length > 0) {
    console.log(`🎉 成功修复 ${repaired.length} 个脚本文件`);
  }
  
  process.exit(0);
}

main();
