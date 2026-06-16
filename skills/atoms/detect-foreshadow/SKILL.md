---
name: detect-foreshadow
version: 1.0.0
description: 检测伏笔的埋设与回收状态
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: foreshadow_file
    type: file_path
    required: true
    description: 伏笔追踪文件路径
outputs:
  - name: report
    type: report
    format: markdown
severity: WARN
script: _shared/scripts/foreshadow-check.js
triggers:
  - /atom:detect-foreshadow
  - 检测伏笔
---

# detect-foreshadow

## 功能
检查伏笔的埋设与回收状态，标记逾期未回收的伏笔。

## 执行步骤
1. 读取 {chapter_file} 和 {foreshadow_file}
2. 运行：`node skills/_shared/scripts/foreshadow-check.js {chapter_file} {foreshadow_file}`
3. 输出伏笔状态报告

## 输出格式
### 伏笔检测报告
- 文件：{chapter_file}
- 新增伏笔：N 个
- 回收伏笔：N 个
- 逾期伏笔：N 个

| 伏笔 | 状态 | 埋设章 | 当前章 | 逾期天数 |
|------|------|--------|--------|----------|
