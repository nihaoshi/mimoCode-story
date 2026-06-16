---
name: detect-emotion-curve
version: 1.0.0
description: 分析章节情绪曲线的起伏节奏
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
script: _shared/scripts/emotion-analyzer.js
triggers:
  - /atom:detect-emotion-curve
  - 检测情绪曲线
---

# detect-emotion-curve

## 功能
分析章节内情绪的起伏变化，检测是否过于平淡或情绪断层。

## 执行步骤
1. 读取 {chapter_file}
2. 运行：`node skills/_shared/scripts/emotion-analyzer.js {chapter_file}`
3. 输出情绪曲线分析

## 输出格式
### 情绪曲线报告
- 文件：{chapter_file}
- 情绪峰值：N 处
- 情绪低谷：N 处
- 节奏评价：紧凑 / 平淡 / 断层

| 段落 | 情绪值 | 情绪类型 | 备注 |
|------|--------|----------|------|
