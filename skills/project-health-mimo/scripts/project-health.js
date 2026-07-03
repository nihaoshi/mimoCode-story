#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node project-health.js <project-dir> [options]

Check and repair writing project file structure.

Options:
  --check     Only check, don't repair (default)
  --fix       Check and repair missing files
  --json      Output JSON format

Exit codes:
  0 = all files present
  1 = missing files found
  2 = error`;

// 严重度分级
const SEVERITY = {
  BLOCK: 'BLOCK',    // 阻断：缺少会导致写作出错
  WARN: 'WARN',      // 警告：缺少会影响体验
  OPTIONAL: 'OPTIONAL', // 可选：锦上添花
};

// 必需文件定义（带严重度）
const REQUIRED_FILES = {
  // 一级文件
  root: [
    { path: 'AGENTS.md', severity: SEVERITY.BLOCK },
    { path: '.story-deployed', severity: SEVERITY.WARN },
    { path: '.active-book', severity: SEVERITY.WARN },
  ],
  // 设定目录
  settings: [
    { path: '设定/世界观/世界观.md', severity: SEVERITY.BLOCK },
    { path: '设定/世界观/背景设定.md', severity: SEVERITY.BLOCK },
    { path: '设定/世界观/金手指.md', severity: SEVERITY.BLOCK },
    { path: '设定/世界观/力量体系.md', severity: SEVERITY.BLOCK },
    { path: '设定/关系.md', severity: SEVERITY.WARN },
    { path: '设定/题材定位.md', severity: SEVERITY.WARN },
    { path: '设定/文风.md', severity: SEVERITY.WARN },
  ],
  // 大纲目录
  outline: [
    { path: '大纲/大纲.md', severity: SEVERITY.BLOCK },
  ],
  // 追踪目录
  tracking: [
    { path: '追踪/上下文.md', severity: SEVERITY.BLOCK },
    { path: '追踪/伏笔.md', severity: SEVERITY.BLOCK },
    { path: '追踪/角色状态.md', severity: SEVERITY.BLOCK },
    { path: '追踪/时间线.md', severity: SEVERITY.WARN },
    { path: '追踪/物品.md', severity: SEVERITY.WARN },
    { path: '追踪/环境.md', severity: SEVERITY.WARN },
    { path: '追踪/物资.md', severity: SEVERITY.WARN },
    { path: '追踪/重复语句.md', severity: SEVERITY.WARN },
  ],
  // 故事线目录
  storylines: [
    { path: '故事线/故事线_索引.md', severity: SEVERITY.WARN },
    { path: '故事线/故事线_交叉点.md', severity: SEVERITY.WARN },
  ],
  // 跨卷追踪目录
  cross_volume: [
    { path: '跨卷追踪/跨卷伏笔.md', severity: SEVERITY.WARN },
    { path: '跨卷追踪/跨卷角色弧线.md', severity: SEVERITY.WARN },
    { path: '跨卷追踪/卷间过渡.md', severity: SEVERITY.WARN },
  ],
};

// 通配检查定义
const WILDCARD_CHECKS = {
  // 设定：势力目录通配
  '设定/势力': {
    pattern: '设定/势力/*.md',
    severity: SEVERITY.WARN,
    label: '势力设定文件',
    desc: '设定/势力/ 目录存在但无文件',
  },
  // 大纲：卷纲通配
  '大纲/卷纲': {
    pattern: '大纲/卷纲_*.md',
    severity: SEVERITY.WARN,
    label: '卷纲文件',
    desc: '大纲/ 目录缺少卷纲',
  },
  // 大纲：细纲通配
  '大纲/细纲': {
    pattern: '大纲/细纲_*.md',
    severity: SEVERITY.WARN,
    label: '细纲文件',
    desc: '大纲/ 目录缺少细纲',
  },
  // 大纲/存档目录
  '大纲/存档': {
    pattern: '大纲/存档/',
    severity: SEVERITY.OPTIONAL,
    label: '大纲存档目录',
    desc: '大纲/存档/ 目录不存在',
  },
  // 故事线：主线通配
  '故事线/主线': {
    pattern: '故事线/故事线_主线_*.md',
    severity: SEVERITY.WARN,
    label: '主线故事线文件',
    desc: '故事线/ 目录缺少主线文件',
  },
  // 正文：章节通配
  '正文': {
    pattern: '正文/第*.md',
    severity: SEVERITY.WARN,
    label: '章节文件',
    desc: '正文/ 目录无章节文件',
  },
  // 对标目录
  '对标': {
    pattern: '对标/',
    severity: SEVERITY.OPTIONAL,
    label: '对标目录',
    desc: '对标/ 目录不存在',
  },
  // 参考资料目录
  '参考资料': {
    pattern: '参考资料/',
    severity: SEVERITY.WARN,
    label: '参考资料目录',
    desc: '参考资料/ 目录不存在',
  },
};

// 特殊规则：世界观.md 和 背景设定.md 二选一即可
const ALTERNATE_FILES = [
  { paths: ['设定/世界观/世界观.md', '设定/世界观/背景设定.md'], severity: SEVERITY.BLOCK, label: '核心世界观', desc: '设定/世界观/ 缺少世界观.md 或 背景设定.md' },
];

// 必需目录
const REQUIRED_DIRS = [
  '设定',
  '设定/世界观',
  '设定/角色',
  '设定/势力',
  '大纲',
  '正文',
  '追踪',
  '故事线',
  '跨卷追踪',
];

// 文件模板
const FILE_TEMPLATES = {
  '设定/关系.md': `# 角色关系

> 基于第001-XXX章

---

## 主要关系

| 角色A | 角色B | 关系类型 | 当前状态 |
|-------|-------|---------|---------|
| 陈玄 | 薛十三 | 恩人→家人 | 信任 |
`,
  '设定/题材定位.md': `# 题材定位

---

## 基本信息

- 题材：{待填写}
- 目标平台：{待填写}
- 目标读者：{待填写}
- 核心卖点：{待填写}
`,
  '追踪/时间线.md': `# 故事时间线

> 基于第001-XXX章

---

## 关键事件时序

| 章节 | 故事时间 | 事件 | 涉及角色 |
|------|---------|------|---------|
`,
  '追踪/物品.md': `# 物品追踪

> 基于第001-XXX章

---

## 核心道具

| 物品 | 当前状态 | 位置 | 备注 |
|------|---------|------|------|
`,
  '追踪/环境.md': `# 环境追踪

> 基于第001-XXX章

---

## 当前环境

| 维度 | 当前状态 |
|------|---------|
| 季节 | |
| 位置 | |
| 天气 | |
`,
  '追踪/伏笔.md': `# 伏笔追踪

> 基于第001-XXX章
> 状态：🟢 潜伏中 / 🟡 接近触发 / 🔴 已回收

---

## 伏笔状态表

| ID | 伏笔内容 | 埋设章节 | 状态 | 备注 |
|----|---------|---------|------|------|
`,
  '追踪/角色状态.md': `# 角色状态

> 基于第001-XXX章

---

## 主要角色

### 陈玄

#### 基本信息
- 年龄：
- 身份：

#### 当前状态
- 位置：
- 状态：

#### 性格锚点
- 核心性格：
- 行为模式：
- 禁忌：
`,
  '追踪/上下文.md': `# 写作进度

- 最后完成章节：第0章
- 更新时间：${new Date().toISOString().split('T')[0]}

## 当前状态

- 场景：
- 时间：
- 天气：
`,
  '追踪/物资.md': `# 物资追踪

> 基于第001-XXX章

---

## 资源状态

| 类型 | 数量 | 位置 | 备注 |
|------|------|------|------|
`,
  '追踪/重复语句.md': `# 重复语句黑名单

> 检测到的重复表达，写正文时禁止再次使用

---

## 黑名单

| 重复内容 | 出现位置 | 重复次数 | 建议替代 |
|---------|---------|---------|---------|
`,
  '故事线/故事线_索引.md': `# 故事线索引

> 管理所有故事线的状态

---

## 故事线列表

| ID | 名称 | 类型 | 状态 | 当前进展 |
|----|------|------|------|---------|
`,
  '故事线/故事线_交叉点.md': `# 故事线交叉点

> 记录故事线之间的交汇点

---

## 交叉点列表

| 交叉点 | 涉及故事线 | 章节 | 影响 |
|--------|-----------|------|------|
`,
  '跨卷追踪/跨卷伏笔.md': `# 跨卷伏笔

> 需要跨卷回收的长线伏笔

---

## 跨卷伏笔列表

| ID | 伏笔内容 | 埋设卷/章 | 预计回收 | 状态 |
|----|---------|----------|---------|------|
`,
  '跨卷追踪/跨卷角色弧线.md': `# 跨卷角色弧线

> 角色全书成长路线

---

## 角色弧线

### {角色名}

- 起始状态：
- 当前阶段：
- 目标状态：
- 关键转折：
`,
  '跨卷追踪/卷间过渡.md': `# 卷间过渡

> 卷与卷的衔接要点

---

## 过渡清单

| 从 | 到 | 衔接要点 | 需回收伏笔 | 需推进线索 |
|----|-----|---------|-----------|-----------|
`,
  '设定/世界观/金手指.md': `# 金手指规则

> 本书的核心外挂/优势

---

## 金手指来源

- 来源：

## 能力列表

| 能力 | 解锁条件 | 限制 | 冷却 |
|------|---------|------|------|
| | | | |

## 使用规则

- 
`,
  '设定/世界观/力量体系.md': `# 力量体系

> 本书的力量等级/修炼体系

---

## 等级划分

| 等级 | 名称 | 核心能力 | 突破条件 |
|------|------|---------|---------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

## 境界说明

- 

`,
};

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function checkFileExists(projectDir, filePath) {
  const fullPath = path.join(projectDir, filePath);
  return fs.existsSync(fullPath);
}

function checkFileNotEmpty(projectDir, filePath) {
  const fullPath = path.join(projectDir, filePath);
  if (!fs.existsSync(fullPath)) return false;
  const stat = fs.statSync(fullPath);
  return stat.size > 0;
}

function globFiles(projectDir, pattern) {
  const baseDir = path.join(projectDir, pattern.replace(/\*\.md$/, '').replace(/\/$/, ''));
  if (!fs.existsSync(baseDir)) return [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  const regex = new RegExp('^' + pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*\\\./g, '.'));
  const dirPattern = pattern.replace(/\*\.md$/, '').replace(/\/$/, '');
  
  // Handle directory patterns (ending with /)
  if (pattern.endsWith('/')) {
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  }
  
  // Handle *.md patterns
  const dir = path.dirname(pattern);
  const prefix = dir === '.' ? '' : dir + '/';
  const ext = pattern.endsWith('/*.md') ? '.md' : '';
  const globRegex = new RegExp('^' + pattern.replace(/\*/g, '[^/\\\\]+').replace(/\.md$/, '') + (ext ? '\\.md$' : '$'));
  
  return entries
    .filter(e => e.isFile())
    .map(e => e.name)
    .filter(name => globRegex.test(prefix + name));
}

function checkProjectHealth(projectDir) {
  const results = {
    exists: [],
    missing: [],
    empty: [],
    missing_severity: {},    // file -> severity
    dirs_missing: [],
    // 通配检查结果
    wildcard: {},            // category -> { count, files, severity, desc }
    // 交替文件检查
    alternate_failures: [],  // { label, desc }
    // 空目录检查
    empty_dirs: [],          // { dir, severity, desc }
  };

  // 检查必需目录
  for (const dir of REQUIRED_DIRS) {
    const dirPath = path.join(projectDir, dir);
    if (!fs.existsSync(dirPath)) {
      results.dirs_missing.push(dir);
    }
  }

  // 检查必需文件
  for (const [category, files] of Object.entries(REQUIRED_FILES)) {
    for (const fileDef of files) {
      const file = typeof fileDef === 'string' ? fileDef : fileDef.path;
      const severity = typeof fileDef === 'object' ? fileDef.severity : SEVERITY.WARN;
      
      if (checkFileExists(projectDir, file)) {
        if (checkFileNotEmpty(projectDir, file)) {
          results.exists.push(file);
        } else {
          results.empty.push(file);
        }
      } else {
        results.missing.push(file);
        results.missing_severity[file] = severity;
      }
    }
  }

  // 交替文件检查：世界观.md 和 背景设定.md 二选一
  const worldPath = '设定/世界观/世界观.md';
  const bgPath = '设定/世界观/背景设定.md';
  const worldExists = checkFileExists(projectDir, worldPath);
  const bgExists = checkFileExists(projectDir, bgPath);
  
  if (!worldExists && !bgExists) {
    results.alternate_failures.push({
      label: '核心世界观',
      desc: '设定/世界观/ 缺少世界观.md 或 背景设定.md',
    });
  } else {
    // 只存在一个的话，把不存在的加到 exists（因为二选一即可）
    if (worldExists && !bgExists) {
      results.exists.push(bgPath);
    }
    if (!worldExists && bgExists) {
      results.exists.push(worldPath);
    }
  }

  // 通配检查
  for (const [key, check] of Object.entries(WILDCARD_CHECKS)) {
    let foundFiles = [];
    
    if (check.pattern.endsWith('/')) {
      // 目录检查
      const dirPath = path.join(projectDir, check.pattern);
      if (fs.existsSync(dirPath)) {
        foundFiles = fs.readdirSync(dirPath, { withFileTypes: true })
          .filter(e => e.isDirectory())
          .map(e => e.name);
      }
    } else {
      // 文件模式检查
      const dirPath = check.pattern.replace(/\/\*\.md$/, '/').replace(/\/\*$/, '/');
      const fullPath = path.join(projectDir, dirPath);
      if (fs.existsSync(fullPath)) {
        foundFiles = fs.readdirSync(fullPath, { withFileTypes: true })
          .filter(e => e.isFile() && e.name.endsWith('.md'))
          .map(e => e.name);
      }
    }

    results.wildcard[key] = {
      count: foundFiles.length,
      files: foundFiles,
      severity: check.severity,
      label: check.label,
      desc: check.desc,
      found: foundFiles.length > 0,
    };
  }

  // 空目录检查
  for (const dir of ['设定/角色', '设定/势力']) {
    const dirPath = path.join(projectDir, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(e => e.isFile());
      if (files.length === 0) {
        results.empty_dirs.push({
          dir,
          severity: SEVERITY.WARN,
          desc: `${dir}/ 目录为空`,
        });
      }
    }
  }

  return results;
}

function repairProject(projectDir, results) {
  const created = [];
  const errors = [];

  // 创建缺失目录
  for (const dir of results.dirs_missing) {
    const dirPath = path.join(projectDir, dir);
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      created.push(`目录: ${dir}`);
    } catch (err) {
      errors.push(`创建目录失败 ${dir}: ${err.message}`);
    }
  }

  // 创建缺失文件
  for (const file of results.missing) {
    const filePath = path.join(projectDir, file);
    const template = FILE_TEMPLATES[file];
    
    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入模板
      if (template) {
        fs.writeFileSync(filePath, template, 'utf-8');
      } else {
        fs.writeFileSync(filePath, '', 'utf-8');
      }
      created.push(`文件: ${file}`);
    } catch (err) {
      errors.push(`创建文件失败 ${file}: ${err.message}`);
    }
  }

  // 填充空文件
  for (const file of results.empty) {
    const filePath = path.join(projectDir, file);
    const template = FILE_TEMPLATES[file];
    
    if (template) {
      try {
        fs.writeFileSync(filePath, template, 'utf-8');
        created.push(`填充: ${file}`);
      } catch (err) {
        errors.push(`填充文件失败 ${file}: ${err.message}`);
      }
    }
  }

  // 创建大纲存档目录（如果缺失）
  if (results.wildcard['大纲/存档'] && !results.wildcard['大纲/存档'].found) {
    const archiveDir = path.join(projectDir, '大纲/存档');
    try {
      fs.mkdirSync(archiveDir, { recursive: true });
      created.push(`目录: 大纲/存档/`);
    } catch (err) {
      errors.push(`创建目录失败 大纲/存档/: ${err.message}`);
    }
  }

  // 创建对标目录（如果缺失）
  if (results.wildcard['对标'] && !results.wildcard['对标'].found) {
    const duichenDir = path.join(projectDir, '对标');
    try {
      fs.mkdirSync(duichenDir, { recursive: true });
      created.push(`目录: 对标/`);
    } catch (err) {
      errors.push(`创建目录失败 对标/: ${err.message}`);
    }
  }

  // 创建参考资料目录（如果缺失）
  if (results.wildcard['参考资料'] && !results.wildcard['参考资料'].found) {
    const refDir = path.join(projectDir, '参考资料');
    try {
      fs.mkdirSync(refDir, { recursive: true });
      created.push(`目录: 参考资料/`);
    } catch (err) {
      errors.push(`创建目录失败 参考资料/: ${err.message}`);
    }
  }

  return { created, errors };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const fixMode = args.includes('--fix');
  const checkOnly = !fixMode;

  const filteredArgs = args.filter(a => 
    a !== '--json' && a !== '--fix' && a !== '--check'
  );

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const projectDir = path.resolve(filteredArgs[0]);

  if (!fs.existsSync(projectDir)) {
    console.error(`Error: 项目目录不存在: ${projectDir}`);
    process.exit(2);
  }

  // 检查项目健康状态
  const health = checkProjectHealth(projectDir);
  
  // 统计严重度
  const blockCount = Object.values(health.missing_severity).filter(s => s === SEVERITY.BLOCK).length;
  const warnCount = Object.values(health.missing_severity).filter(s => s === SEVERITY.WARN).length;
  const optionalMissing = Object.values(health.missing_severity).filter(s => s === SEVERITY.OPTIONAL).length;
  
  // 通配检查失败数
  const wildcardFailures = Object.values(health.wildcard).filter(w => !w.found);
  const wildcardBlockFailures = wildcardFailures.filter(w => w.severity === SEVERITY.BLOCK);
  const wildcardWarnFailures = wildcardFailures.filter(w => w.severity === SEVERITY.WARN);
  
  // 交替文件失败
  const altFailures = health.alternate_failures;
  
  // 空目录
  const emptyDirs = health.empty_dirs;

  const totalMissing = health.missing.length + health.dirs_missing.length;
  const totalEmpty = health.empty.length;
  const hasBlockingIssues = blockCount + altFailures.length + wildcardBlockFailures.length > 0;
  const hasWarnings = (warnCount + optionalMissing + wildcardWarnFailures.length + emptyDirs.length) > 0;

  if (jsonMode) {
    const result = {
      status: !hasBlockingIssues && !hasWarnings ? 'healthy' : (hasBlockingIssues ? 'needs_repair' : 'needs_attention'),
      project: projectDir,
      summary: {
        existing: health.exists.length,
        missing: health.missing.length,
        empty: health.empty.length,
        dirs_missing: health.dirs_missing.length,
        blocking_issues: blockCount + altFailures.length + wildcardBlockFailures.length,
        warnings: warnCount + optionalMissing + wildcardWarnFailures.length + emptyDirs.length,
      },
      details: {
        existing: health.exists,
        missing: health.missing,
        missing_severity: health.missing_severity,
        empty: health.empty,
        dirs_missing: health.dirs_missing,
        alternate_failures: altFailures,
        wildcard: health.wildcard,
        empty_dirs: emptyDirs,
      },
    };

    if (fixMode && (totalMissing > 0 || totalEmpty > 0 || health.dirs_missing.length > 0 || wildcardFailures.length > 0 || altFailures.length > 0)) {
      const repairResult = repairProject(projectDir, health);
      result.repaired = repairResult.created;
      result.errors = repairResult.errors;
      result.status = repairResult.errors.length === 0 ? 'repaired' : 'partial';
    }

    console.log(JSON.stringify(result, null, 2));
    process.exit(hasBlockingIssues ? 1 : (hasWarnings ? 1 : 0));
  }

  // 人类可读输出
  console.log('\n🔍 项目健康检查报告\n');
  console.log(`📁 项目: ${projectDir}`);

  // 严重度摘要
  if (blockCount > 0 || altFailures.length > 0) {
    console.log(`\n🔴 阻断级问题 (${blockCount + altFailures.length}):`);
    for (const file of health.missing) {
      if (health.missing_severity[file] === SEVERITY.BLOCK) {
        console.log(`   [BLOCK] - ${file}`);
      }
    }
    for (const alt of altFailures) {
      console.log(`   [BLOCK] - ${alt.desc}`);
    }
  }

  if (warnCount > 0 || wildcardWarnFailures.length > 0 || emptyDirs.length > 0) {
    console.log(`\n🟡 警告级问题 (${warnCount + wildcardWarnFailures.length + emptyDirs.length}):`);
    for (const file of health.missing) {
      if (health.missing_severity[file] === SEVERITY.WARN) {
        console.log(`   [WARN] - ${file}`);
      }
    }
    for (const wf of wildcardWarnFailures) {
      if (!wf.found) {
        console.log(`   [WARN] - ${wf.desc}`);
      }
    }
    for (const ed of emptyDirs) {
      console.log(`   [WARN] - ${ed.desc}`);
    }
  }

  if (optionalMissing > 0) {
    console.log(`\n🔵 可选级问题 (${optionalMissing}):`);
    for (const file of health.missing) {
      if (health.missing_severity[file] === SEVERITY.OPTIONAL) {
        console.log(`   [OPTIONAL] - ${file}`);
      }
    }
  }

  if (health.exists.length > 0) {
    console.log(`\n✅ 已存在 (${health.exists.length}):`);
    for (const file of health.exists) {
      console.log(`   - ${file}`);
    }
  }

  if (health.dirs_missing.length > 0) {
    console.log(`\n❌ 缺失目录 (${health.dirs_missing.length}):`);
    for (const dir of health.dirs_missing) {
      console.log(`   - ${dir}/`);
    }
  }

  // 通配检查详情
  const allWildcardFailures = Object.values(health.wildcard).filter(w => !w.found);
  if (allWildcardFailures.length > 0) {
    console.log(`\n📋 通配检查 (${allWildcardFailures.length} 项未通过):`);
    for (const wf of allWildcardFailures) {
      const sevTag = wf.severity === SEVERITY.BLOCK ? '[BLOCK]' : (wf.severity === SEVERITY.WARN ? '[WARN]' : '[OPTIONAL]');
      console.log(`   ${sevTag} - ${wf.desc}`);
    }
  }

  // 通配检查通过详情
  const allWildcardSuccess = Object.values(health.wildcard).filter(w => w.found);
  if (allWildcardSuccess.length > 0) {
    console.log(`\n📋 通配检查通过 (${allWildcardSuccess.length} 项):`);
    for (const wf of allWildcardSuccess) {
      console.log(`   ✓ ${wf.label}: ${wf.count} 个文件`);
    }
  }

  if (health.missing.length > 0) {
    console.log(`\n❌ 缺失文件 (${health.missing.length}):`);
    for (const file of health.missing) {
      const sev = health.missing_severity[file] || 'WARN';
      console.log(`   - [${sev}] ${file}`);
    }
  }

  if (health.empty.length > 0) {
    console.log(`\n⚠️  空文件 (${health.empty.length}):`);
    for (const file of health.empty) {
      console.log(`   - ${file}`);
    }
  }

  // 修复
  if (fixMode && (totalMissing > 0 || totalEmpty > 0 || health.dirs_missing.length > 0 || wildcardFailures.length > 0 || altFailures.length > 0)) {
    console.log('\n🔧 开始修复...\n');
    const repairResult = repairProject(projectDir, health);

    if (repairResult.created.length > 0) {
      console.log('✅ 已创建:');
      for (const item of repairResult.created) {
        console.log(`   - ${item}`);
      }
    }

    if (repairResult.errors.length > 0) {
      console.log('\n❌ 修复错误:');
      for (const err of repairResult.errors) {
        console.log(`   - ${err}`);
      }
    }

    console.log('\n📝 下一步:');
    console.log('   - 填充设定文件内容');
    console.log('   - 开始写作');
  } else if (!hasBlockingIssues && !hasWarnings) {
    console.log('\n✅ 项目健康！所有必需文件齐全。');
  } else {
    console.log('\n💡 运行 --fix 参数自动修复缺失文件');
  }

  process.exit(hasBlockingIssues ? 1 : (hasWarnings ? 1 : 0));
}

main();
