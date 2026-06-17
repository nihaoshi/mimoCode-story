---
name: detect-emotion
version: 2.0.0
description: 情绪与爽点分析（情绪曲线+爽点密度）
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
  - name: analysis_type
    type: text
    required: false
    description: "分析类型：emotion|satisfaction|all（默认all）"
    default_value: "all"
outputs:
  - name: report
    type: report
    format: markdown
severity: WARN
script: _shared/scripts/emotion-analyzer.js
triggers:
  - /atom:detect-emotion
  - 检测情绪
  - 检测爽点
  - 情绪分析
---

# detect-emotion

## 功能
分析章节情绪曲线起伏和爽点密度分布。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下最新章节
- **编排器模式**：输入不为空时，以传入的 `chapter_file` 为准

## 执行步骤
1. 读取 {chapter_file}
2. 根据 {analysis_type} 执行分析：
   - `emotion`：运行 `node _shared/scripts/emotion-analyzer.js {chapter_file}`
   - `satisfaction`：运行 `node _shared/scripts/satisfaction-meter.js {chapter_file}`
   - `all`：依次运行两个脚本
3. 汇总分析结果

## 输出格式
### 情绪爽点分析报告
- 文件：{chapter_file}

**情绪曲线：**
- 情绪峰值：N 处
- 情绪低谷：N 处
- 节奏评价：紧凑 / 平淡 / 断层

**爽点分布：**
- 爽点总数：N
- 平均间隔：N 段
- 评价：密度过高 / 适中 / 过低

| 段落 | 情绪值 | 情绪类型 | 爽点 | 强度 |
|------|--------|----------|------|------|
