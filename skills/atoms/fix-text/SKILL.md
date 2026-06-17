---
name: fix-text
version: 2.0.0
description: 文本修正（AI腔+禁用词+标点）
category: fix
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 章节文件路径
    default_source: "正文/第{N}章.md"
  - name: fix_type
    type: text
    required: false
    description: "修正类型：ai|banned|punctuation|all（默认all）"
    default_value: "all"
outputs:
  - name: fixed_text
    type: text
script: _shared/scripts/punctuation-normalize.js
references:
  - _shared/references/banned-words.md
  - _shared/references/anti-ai-writing.md
triggers:
  - /atom:fix-text
  - 修正文本
  - 去AI腔
  - 替换禁用词
  - 标点修正
---

# fix-text

## 功能
修正文本质量问题，包括AI腔句式、禁用词替换和标点规范化。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下最新章节
- **编排器模式**：输入不为空时，以传入的 {chapter_file} 为准

## 执行步骤
1. 读取 {chapter_file}
2. 根据 {fix_type} 执行修正：
   - `ai`：消除AI腔模板句式（"不是A而是B"、万能状语、比喻三连、排比句式）
   - `banned`：替换禁用词为推荐表达（参考 banned-words.md）
   - `punctuation`：运行 `node _shared/scripts/punctuation-normalize.js {chapter_file}`
   - `all`：依次执行三项修正
3. 输出修正后文本

## AI腔修正规则
- "不是A，而是B" → 直接描写B或用更自然的转折
- "带着X"万能状语 → 拆短句或换具体动作
- "仿佛/宛如/恰似"比喻 → 删除或改为白描
- 排比句式 → 打散，变化句长

## 禁用词修正规则
- Level1 禁用词（31词）→ 命中即替换
- Level2 禁用词（18词）→ 命中需审查后替换

## 输出格式
### 文本修正报告
- 文件：{chapter_file}
- AI腔修正：N 处
- 禁用词替换：N 处
- 标点修正：N 处

| 位置 | 原文 | 修正后 | 类型 | 原因 |
|------|------|--------|------|------|
