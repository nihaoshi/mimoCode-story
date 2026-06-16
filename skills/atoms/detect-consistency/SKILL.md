---
name: detect-consistency
version: 1.0.0
description: 检测章节与追踪文件的一致性
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: tracking_dir
    type: dir_path
    required: true
    description: 追踪目录路径
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
script: _shared/scripts/consistency-check.js
triggers:
  - /atom:detect-consistency
  - 检测一致性
---

# detect-consistency

## 功能
校验章节内容与追踪文件（角色状态、物品、环境、时间线）的一致性。

## 执行步骤
1. 读取 {chapter_file} 和 {tracking_dir} 下的追踪文件
2. 运行：`node skills/_shared/scripts/consistency-check.js {chapter_file} {tracking_dir}`
3. 输出不一致项

## 输出格式
### 一致性检测报告
- 文件：{chapter_file}
- 不一致项：N 处

| 类型 | 追踪值 | 章节值 | 位置 | 严重度 |
|------|--------|--------|------|--------|
