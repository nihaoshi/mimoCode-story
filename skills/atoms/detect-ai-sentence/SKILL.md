---
name: detect-ai-sentence
version: 1.0.0
description: 检测章节中的AI腔句式
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
script: _shared/scripts/style-lint.js --ai-only
triggers:
  - /atom:detect-ai-sentence
  - 检测AI腔
---

# detect-ai-sentence

## 功能
检测章节中的 AI 写作痕迹，包括模板句式、过度修饰、不自然过渡。

## 执行步骤
1. 读取 {chapter_file}
2. 运行：`node skills/_shared/scripts/style-lint.js {chapter_file} --ai-only`
3. 输出 AI 腔句式列表

## 输出格式
### AI腔检测报告
- 文件：{chapter_file}
- 疑似 AI 腔：N 处

| 句式 | 类型 | 位置 | 建议替换 |
|------|------|------|----------|
