---
name: extract-summary
version: 2.0.0
description: 从原文提取章节结构和概要
category: analyze
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: raw_text
    type: file
    required: true
    description: 原始文本文件路径
    default_source: "正文/第{N}章.md"
outputs:
  - name: summary
    type: file
    format: markdown
  - name: chapter_index
    type: file
    format: markdown
triggers:
  - /atom:extract-summary
  - 概要提取
---

# extract-summary

## 功能
从原始文本中识别章节结构，提取每章概要和整体故事摘要。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下所有章节
- **编排器模式**：输入不为空时，以传入的 {raw_text} 为准

## 执行步骤
1. 读取 {raw_text} 全文
2. 识别章节分隔符（第X章、Chapter X 等），建立章节索引
3. 为每章提取：章节号、标题、核心事件、涉及角色、字数
4. 生成整体故事概要（题材、主线、核心冲突）

## 输出格式
### 概要.md
- 标题 / 作者 / 题材 / 总字数
- 一句话梗概
- 三句话概要
- 章节索引表（章节号 | 标题 | 字数 | 核心事件）
