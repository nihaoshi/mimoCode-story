---
name: detect-cross-chapter
version: 2.0.0
description: 检测跨章节的重复内容和矛盾
category: detect
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 当前章节文件路径
    default_source: "正文/第{N}章.md"
  - name: previous_chapters_dir
    type: directory
    required: false
    description: 前序章节目录路径
    default_source: "正文"
outputs:
  - name: report
    type: report
    format: markdown
severity: WARN
script: _shared/scripts/cross-chapter-check.js
triggers:
  - /atom:detect-cross-chapter
  - 检测跨章重复
---

# detect-cross-chapter

## 功能
检测当前章节与前序章节之间的重复描写、矛盾信息和叙事断裂。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录所有章节
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 读取 {chapter_file} 和 {previous_chapters_dir} 下所有章节
2. 运行：`node _shared/scripts/cross-chapter-check.js {chapter_file} {previous_chapters_dir}`
3. 输出跨章问题

## 输出格式
### 跨章检测报告
- 文件：{chapter_file}
- 重复段落：N 处
- 矛盾信息：N 处

| 类型 | 当前章节内容 | 前序章节 | 位置 | 建议 |
|------|-------------|----------|------|------|
