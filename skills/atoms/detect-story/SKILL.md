---
name: detect-story
version: 2.0.0
description: 故事完整性检测（伏笔+设定缺口）
category: detect
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: false
    description: 章节文件路径（伏笔检测需要）
    default_source: "正文/第{N}章.md"
  - name: project_dir
    type: directory
    required: false
    description: 项目根目录（设定缺口检测需要）
    default_source: "."
  - name: check_type
    type: text
    required: false
    description: "检测类型：foreshadow|gaps|all（默认all）"
    default_value: "all"
outputs:
  - name: report
    type: report
    format: markdown
severity: WARN
script: _shared/scripts/foreshadow-check.js
triggers:
  - /atom:detect-story
  - 检测伏笔
  - 检测设定缺口
  - 故事完整性
---

# detect-story

## 功能
检测故事完整性，包括伏笔埋设回收状态和世界观设定缺口。

## 双模执行
- **独立模式**：输入为空时，读取项目默认追踪文件和设定目录
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 根据 {check_type} 执行检测：
   - `foreshadow`：读取 {chapter_file} 和 `追踪/伏笔.md`，运行 `node _shared/scripts/foreshadow-check.js`
   - `gaps`：读取 {project_dir} 设定文件，运行 `node _shared/scripts/detect-story-gaps.js {project_dir}`
   - `all`：依次执行两项检测
2. 汇总检测结果

## 输出格式
### 故事完整性报告

**伏笔状态：**
- 新增伏笔：N 个
- 回收伏笔：N 个
- 逾期伏笔：N 个

| 伏笔 | 状态 | 埋设章 | 当前章 | 逾期天数 |
|------|------|--------|--------|----------|

**设定缺口：**
- 未定义引用：N 处
- 逻辑矛盾：N 处
- 模糊设定：N 处

| 类型 | 引用内容 | 出现位置 | 建议 |
|------|----------|----------|------|
