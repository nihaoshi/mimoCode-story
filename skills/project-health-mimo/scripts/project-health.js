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

// 必需文件定义
const REQUIRED_FILES = {
  // 一级文件
  root: [
    'AGENTS.md',
    '.story-deployed',
    '.active-book',
  ],
  // 设定目录
  settings: [
    '设定/世界观/世界观.md',
    '设定/世界观/背景设定.md',
    '设定/世界观/金手指.md',
    '设定/关系.md',
    '设定/题材定位.md',
    '设定/文风.md',
  ],
  // 大纲目录
  outline: [
    '大纲/大纲.md',
  ],
  // 追踪目录
  tracking: [
    '追踪/上下文.md',
    '追踪/伏笔.md',
    '追踪/角色状态.md',
    '追踪/时间线.md',
    '追踪/物品.md',
    '追踪/环境.md',
    '追踪/物资.md',
    '追踪/重复语句.md',
  ],
  // 故事线目录
  storylines: [
    '故事线/故事线_索引.md',
    '故事线/故事线_交叉点.md',
  ],
  // 跨卷追踪目录
  cross_volume: [
    '跨卷追踪/跨卷伏笔.md',
    '跨卷追踪/跨卷角色弧线.md',
    '跨卷追踪/卷间过渡.md',
  ],
};

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

function checkProjectHealth(projectDir) {
  const results = {
    exists: [],
    missing: [],
    empty: [],
    dirs_missing: [],
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
    for (const file of files) {
      if (checkFileExists(projectDir, file)) {
        if (checkFileNotEmpty(projectDir, file)) {
          results.exists.push(file);
        } else {
          results.empty.push(file);
        }
      } else {
        results.missing.push(file);
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
  const totalMissing = health.missing.length + health.dirs_missing.length;
  const totalEmpty = health.empty.length;

  if (jsonMode) {
    const result = {
      status: totalMissing === 0 && totalEmpty === 0 ? 'healthy' : 'needs_repair',
      project: projectDir,
      summary: {
        existing: health.exists.length,
        missing: health.missing.length,
        empty: health.empty.length,
        dirs_missing: health.dirs_missing.length,
      },
      details: {
        existing: health.exists,
        missing: health.missing,
        empty: health.empty,
        dirs_missing: health.dirs_missing,
      },
    };

    if (fixMode && (totalMissing > 0 || totalEmpty > 0 || health.dirs_missing.length > 0)) {
      const repairResult = repairProject(projectDir, health);
      result.repaired = repairResult.created;
      result.errors = repairResult.errors;
      result.status = repairResult.errors.length === 0 ? 'repaired' : 'partial';
    }

    console.log(JSON.stringify(result, null, 2));
    process.exit(totalMissing > 0 ? 1 : 0);
  }

  // 人类可读输出
  console.log('\n🔍 项目健康检查报告\n');
  console.log(`📁 项目: ${projectDir}`);

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

  if (health.missing.length > 0) {
    console.log(`\n❌ 缺失文件 (${health.missing.length}):`);
    for (const file of health.missing) {
      console.log(`   - ${file}`);
    }
  }

  if (health.empty.length > 0) {
    console.log(`\n⚠️  空文件 (${health.empty.length}):`);
    for (const file of health.empty) {
      console.log(`   - ${file}`);
    }
  }

  // 修复
  if (fixMode && (totalMissing > 0 || totalEmpty > 0 || health.dirs_missing.length > 0)) {
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
  } else if (totalMissing === 0 && totalEmpty === 0 && health.dirs_missing.length === 0) {
    console.log('\n✅ 项目健康！所有必需文件齐全。');
  } else {
    console.log('\n💡 运行 --fix 参数自动修复缺失文件');
  }

  process.exit(totalMissing > 0 ? 1 : 0);
}

main();
