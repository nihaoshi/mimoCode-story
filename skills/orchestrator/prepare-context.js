#!/usr/bin/env node
/**
 * prepare-context.js — 写前上下文准备工具
 * 
 * 用法：node prepare-context.js <项目目录> [选项]
 * 
 * 选项：
 *   --full     完整准备（所有文件）
 *   --minimal  最小准备（仅必需文件）
 *   --check    检查缺失文件
 * 
 * 功能：
 *   1. 创建缺失的目录和文件
 *   2. 用模板填充空白文件
 *   3. 输出缺失文件报告
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('用法：node prepare-context.js <项目目录> [--full|--minimal|--check]');
  process.exit(1);
}

const projectDir = args[0];
const mode = args.includes('--full') ? 'full' : 
             args.includes('--minimal') ? 'minimal' : 
             args.includes('--check') ? 'check' : 'minimal';

// ===== 文件模板 =====
const TEMPLATES = {
  // 设定文件
  '设定/世界观/背景设定.md': `# 背景设定

## 时代背景
- 时代：
- 地理：
- 历史：

## 社会结构
- 政治体制：
- 经济体系：
- 文化特点：
`,
  '设定/关系.md': `# 角色关系

## 主要关系

| 角色A | 角色B | 关系类型 | 当前状态 |
|-------|-------|---------|---------|
`,
  '设定/题材定位.md': `# 题材定位

## 基本信息
- 题材类型：
- 目标平台：
- 目标读者：

## 核心梗
- 一句话梗概：
- 核心冲突：

## 对标分析
| 对标书 | 亮点 | 可借鉴 |
|--------|------|--------|
`,
  '设定/文风.md': `# 文风指南

## 整体风格
- 叙事视角：
- 语言特点：
- 节奏把控：

## 对话风格
- 主角说话方式：
- 配角说话方式：

## 描写偏好
- 环境描写：
- 心理描写：
- 动作描写：
`,

  // 追踪文件
  '追踪/伏笔.md': `# 伏笔追踪

## 待回收

| ID | 伏笔内容 | 埋设章节 | 预计回收 | 重要度 |
|----|---------|---------|---------|--------|

## 已回收

| ID | 伏笔内容 | 回收章节 |
|----|---------|---------|
`,
  '追踪/时间线.md': `# 故事时间线

## 关键事件时序

| 章节 | 故事时间 | 事件 | 涉及角色 |
|------|---------|------|---------|
`,
  '追踪/角色状态.md': `# 角色状态

## {主角名}
- 当前身份：
- 当前能力：
- 关键关系：
- 性格锚点：

## 状态变更记录

| 章节 | 变更内容 |
|------|---------|
`,
  '追踪/物品.md': `# 物品追踪

## 关键物品

| 物品 | 当前位置 | 状态 | 最后出现章节 |
|------|---------|------|-------------|
`,
  '追踪/环境.md': `# 环境追踪

## 当前环境
- 季节：
- 天气：
- 场景位置：
- 时间：

## 环境变更记录

| 章节 | 变更内容 |
|------|---------|
`,
  '追踪/物资.md': `# 物资追踪

## 财物
| 物品 | 数量 | 位置 | 备注 |
|------|------|------|------|

## 食物
| 物品 | 数量 | 位置 | 备注 |
|------|------|------|------|

## 工具
| 物品 | 数量 | 位置 | 备注 |
|------|------|------|------|
`,
  '追踪/重复语句.md': `# 重复语句黑名单

> 一致性检测发现的重复语句，写正文前必须加载，禁止再次使用。

## 黑名单列表

| 序号 | 重复内容 | 出现位置 | 重复次数 | 建议替代 |
|------|---------|---------|---------|---------|
`,
  '追踪/上下文.md': `# 写作进度

- 最后完成章节：第0章
- 更新时间：${new Date().toISOString().split('T')[0]}

## 当前状态
- 状态：已初始化
`,

  // 大纲文件
  '大纲/大纲.md': `# 全书大纲

## 卷级大纲

### 第一卷：{卷名}（约 {X} 万字，{Y} 章）
- 功能：
- 核心事件：
- 起始状态 → 结束状态：

### 第二卷：{卷名}
- 功能：
- 核心事件：
- 起始状态 → 结束状态：

### 最终卷：{卷名}
- 功能：
- 核心事件：
- 起始状态 → 结束状态：
`,
  '大纲/卷纲_第1卷.md': `# 第一卷 卷纲

## 基本信息
- 卷名：
- 字数目标：
- 章节数：

## 爽点节奏
| 章节 | 爽点类型 | 铺垫 | 释放 |
|------|---------|------|------|

## 情绪弧线
| 章节 | 情绪 | 强度 |
|------|------|------|

## 伏笔规划
| 伏笔 | 埋设章节 | 回收章节 |
|------|---------|---------|

## 反转设计
| 反转 | 位置 | 铺垫 |
|------|------|------|
`,

  // 故事线文件
  '故事线/故事线_索引.md': `# 故事线索引

## 故事线列表

| ID | 名称 | 类型 | 状态 | 当前章节 |
|----|------|------|------|---------|

## 交叉点

| 章节 | 故事线A | 故事线B | 交汇内容 |
|------|--------|--------|---------|
`,
  '故事线/故事线_主线_XXX.md': `# 主线故事线

## 基本信息
- 名称：
- 类型：主线
- 状态：进行中

## 剧情节点

| 章节 | 事件 | 角色 | 影响 |
|------|------|------|------|
`,

  // 跨卷追踪文件
  '跨卷追踪/跨卷伏笔.md': `# 跨卷伏笔

## 待回收

| ID | 伏笔内容 | 埋设卷 | 预计回收卷 | 重要度 |
|----|---------|--------|-----------|--------|

## 已回收

| ID | 伏笔内容 | 回收卷 | 回收章节 |
|----|---------|--------|---------|
`,
  '跨卷追踪/跨卷角色弧线.md': `# 跨卷角色弧线

## 角色成长路线

### {主角名}
| 卷 | 状态 | 能力变化 | 心理变化 |
|----|------|---------|---------|
`,
  '跨卷追踪/卷间过渡.md': `# 卷间过渡

## 过渡要点

### 第1卷 → 第2卷
- 衔接事件：
- 状态变化：
- 新角色/势力：

### 第2卷 → 第3卷
- 衔接事件：
- 状态变化：
- 新角色/势力：
`,

  // 参考资料
  '参考资料/写作技巧.md': `# 写作技巧参考

## 对话技巧
- 口语化
- 潜台词
- 打断与沉默

## 节奏控制
- 紧张处：短句连续
- 舒缓处：长句铺垫
- 转折处：一句独立成段

## 情绪营造
- 环境烘托
- 动作暗示
- 留白处理
`,
};

// ===== 工具函数 =====
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

function ensureFile(filePath, template) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, template, 'utf-8');
    return true;
  }
  return false;
}

function checkFile(filePath) {
  return fs.existsSync(filePath);
}

// ===== 主函数 =====
function prepareContext() {
  console.log(`\n🔧 写前上下文准备工具`);
  console.log(`📁 项目：${projectDir}`);
  console.log(`📋 模式：${mode}`);
  console.log('='.repeat(50));

  const created = [];
  const exists = [];
  const missing = [];

  // 创建所有目录
  const dirs = [
    '设定/世界观', '设定/角色', '设定/势力',
    '大纲', '正文', '追踪', '对标',
    '故事线', '跨卷追踪', '参考资料'
  ];

  for (const dir of dirs) {
    const fullPath = path.join(projectDir, dir);
    if (ensureDir(fullPath)) {
      created.push(`目录：${dir}`);
    }
  }

  // 创建所有文件
  for (const [file, template] of Object.entries(TEMPLATES)) {
    const fullPath = path.join(projectDir, file);
    if (mode === 'check') {
      if (!checkFile(fullPath)) {
        missing.push(file);
      } else {
        exists.push(file);
      }
    } else {
      if (ensureFile(fullPath, template)) {
        created.push(`文件：${file}`);
      } else {
        exists.push(file);
      }
    }
  }

  // 输出报告
  console.log('\n📊 报告：');

  if (mode === 'check') {
    console.log(`\n✅ 已存在：${exists.length} 个文件`);
    for (const f of exists) {
      console.log(`  - ${f}`);
    }
    console.log(`\n❌ 缺失：${missing.length} 个文件`);
    for (const f of missing) {
      console.log(`  - ${f}`);
    }
  } else {
    console.log(`\n✅ 已创建：${created.length} 个`);
    for (const c of created) {
      console.log(`  - ${c}`);
    }
    console.log(`\n📋 已存在：${exists.length} 个文件`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ 上下文准备完成');
}

// 执行
prepareContext();
