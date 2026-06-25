#!/usr/bin/env node
/**
 * 扫描项目目录结构，自动更新 project-structure.md
 * 
 * 用法：node scan-project-structure.js <项目目录>
 * 
 * 功能：
 * 1. 扫描项目目录下的所有文件和子目录
 * 2. 生成项目结构树
 * 3. 更新 _shared/references/project-structure.md 中的动态扫描部分
 */

const fs = require('fs');
const path = require('path');

const projectDir = process.argv[2];
if (!projectDir) {
  console.error('用法：node scan-project-structure.js <项目目录>');
  process.exit(1);
}

// 扫描目录结构
function scanDir(dir, prefix = '', maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return [];
  
  const results = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') continue;
      
      const itemPath = path.join(dir, item.name);
      const relativePath = path.relative(projectDir, itemPath).replace(/\\/g, '/');
      
      if (item.isDirectory()) {
        results.push({ type: 'dir', path: relativePath });
        const children = scanDir(itemPath, prefix + '  ', maxDepth, currentDepth + 1);
        results.push(...children);
      } else if (item.name.endsWith('.md')) {
        results.push({ type: 'file', path: relativePath });
      }
    }
  } catch (e) {
    // 忽略权限错误
  }
  
  return results;
}

// 统计文件
function countFiles(dir, pattern) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    let count = 0;
    for (const item of items) {
      if (item.isFile() && item.name.endsWith('.md') && !item.name.startsWith('.')) {
        if (!pattern || item.name.includes(pattern)) count++;
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

// 主逻辑
const structure = scanDir(projectDir);

// 按目录分组
const dirs = {};
for (const item of structure) {
  const dir = item.path.split('/')[0];
  if (!dirs[dir]) dirs[dir] = [];
  dirs[dir].push(item);
}

// 生成扫描命令
const scanCommands = [];
const trackingFiles = [];
const settingFiles = [];
const outlineFiles = [];

for (const item of structure) {
  if (item.path.startsWith('追踪/')) {
    trackingFiles.push(item.path);
  } else if (item.path.startsWith('设定/')) {
    settingFiles.push(item.path);
  } else if (item.path.startsWith('大纲/')) {
    outlineFiles.push(item.path);
  }
}

// 输出 JSON 结果
const result = {
  project_dir: projectDir,
  scan_time: new Date().toISOString(),
  directories: Object.keys(dirs),
  file_counts: {
    tracking: countFiles(path.join(projectDir, '追踪')),
    setting: countFiles(path.join(projectDir, '设定')),
    outline: countFiles(path.join(projectDir, '大纲')),
    chapters: countFiles(path.join(projectDir, '正文')),
    cross_volume: countFiles(path.join(projectDir, '跨卷追踪')),
    storyline: countFiles(path.join(projectDir, '故事线'))
  },
  tracking_files: trackingFiles,
  setting_files: settingFiles,
  outline_files: outlineFiles,
  scan_commands: [
    'ls {project_dir}/设定/**/*.md 2>/dev/null',
    'ls {project_dir}/追踪/*.md 2>/dev/null',
    'ls {project_dir}/大纲/*.md 2>/dev/null',
    'ls {project_dir}/跨卷追踪/*.md 2>/dev/null',
    'ls {project_dir}/故事线/*.md 2>/dev/null'
  ]
};

console.log(JSON.stringify(result, null, 2));
