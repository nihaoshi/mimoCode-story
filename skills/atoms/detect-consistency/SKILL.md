---
name: detect-consistency
version: 2.0.0
description: 检测章节与追踪文件的一致性
category: detect
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 章节文件路径
    default_source: "正文/第{N}章.md"
  - name: tracking_dir
    type: directory
    required: false
    description: 追踪目录路径
    default_source: "追踪"
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

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 最新章节和 `追踪/` 目录
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 读取 {chapter_file} 和 {tracking_dir} 下的追踪文件
2. 运行：`node _shared/scripts/consistency-check.js {chapter_file} {tracking_dir}`
3. 输出不一致项

## 输出格式
### 一致性检测报告
- 文件：{chapter_file}
- 不一致项：N 处

| 类型 | 追踪值 | 章节值 | 位置 | 严重度 |
|------|--------|--------|------|--------|
