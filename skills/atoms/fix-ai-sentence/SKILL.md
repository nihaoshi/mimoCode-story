---
name: fix-ai-sentence
version: 1.0.0
description: 句式去套路化，消除AI腔模板句
category: fix
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
outputs:
  - name: fixed_text
    type: text
triggers:
  - /atom:fix-ai-sentence
  - 句式去套路化
---

# fix-ai-sentence

## 功能
消除AI腔模板句式，包括"不是A而是B"、万能状语、比喻三连。

## 执行步骤
1. 读取 {chapter_file}
2. 按以下规则修正：
   - "不是A，而是B" → 直接描写B或用更自然的转折
   - "带着X"万能状语 → 拆短句或换具体动作
   - "仿佛/宛如/恰似"比喻 → 删除或改为白描
   - 排比句式 → 打散，变化句长
3. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
