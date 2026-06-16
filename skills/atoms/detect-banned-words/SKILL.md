---
name: detect-banned-words
version: 1.0.0
description: 扫描章节中的Level1/Level2禁用词
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
script: _shared/scripts/style-lint.js
triggers:
  - /atom:detect-banned-words
  - 检测禁用词
---

# detect-banned-words

## 功能
扫描指定章节中的 Level1（31词）和 Level2（18词）禁用词。

## 执行步骤
1. 读取 {chapter_file}
2. 运行：`node skills/_shared/scripts/style-lint.js {chapter_file} --banned-only`
3. 输出禁用词列表

## 输出格式
### 禁用词检测报告
- 文件：{chapter_file}
- Level1 禁用词：N 个
- Level2 禁用词：N 个

| 禁用词 | 级别 | 位置 | 上下文 |
|--------|------|------|--------|
