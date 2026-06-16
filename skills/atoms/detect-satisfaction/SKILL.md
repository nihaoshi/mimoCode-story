---
name: detect-satisfaction
version: 1.0.0
description: 检测章节爽点密度与分布
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
severity: WARN
script: _shared/scripts/satisfaction-meter.js
triggers:
  - /atom:detect-satisfaction
  - 检测爽点密度
---

# detect-satisfaction

## 功能
分析章节中爽点（打脸、逆袭、升级、获宝等）的密度和分布是否合理。

## 执行步骤
1. 读取 {chapter_file}
2. 运行：`node skills/_shared/scripts/satisfaction-meter.js {chapter_file}`
3. 输出爽点分布分析

## 输出格式
### 爽点密度报告
- 文件：{chapter_file}
- 爽点总数：N
- 平均间隔：N 段
- 评价：密度过高 / 适中 / 过低

| 爽点 | 类型 | 位置 | 强度 |
|------|------|------|------|
