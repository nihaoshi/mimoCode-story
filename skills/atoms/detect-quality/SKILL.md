---
name: detect-quality
version: 2.0.0
description: 文本质量检测（禁用词+AI腔）
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
  - name: check_type
    type: text
    required: false
    description: "检测类型：banned|ai|all（默认all）"
    default_value: "all"
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
script: _shared/scripts/style-lint.js
references:
  - _shared/references/banned-words.md
  - _shared/references/anti-ai-writing.md
triggers:
  - /atom:detect-quality
  - 检测质量
  - 检测禁用词
  - 检测AI腔
---

# detect-quality

## 功能
检测章节文本质量，包括禁用词（Level1/Level2）和AI腔句式。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下最新章节
- **编排器模式**：输入不为空时，以传入的 `chapter_file` 为准

## 执行步骤
1. 读取 {chapter_file}
2. 根据 {check_type} 执行检测：
   - `banned`：运行 `node _shared/scripts/style-lint.js {chapter_file} --banned-only`
   - `ai`：运行 `node _shared/scripts/style-lint.js {chapter_file} --ai-only`
   - `all`：运行 `node _shared/scripts/style-lint.js {chapter_file}`
3. 汇总检测结果

## 输出格式
### 文本质量检测报告
- 文件：{chapter_file}
- Level1 禁用词：N 个
- Level2 禁用词：N 个
- AI腔句式：N 处

| 类型 | 内容 | 级别 | 位置 | 建议 |
|------|------|------|------|------|
