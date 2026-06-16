---
name: banned-words-preload
version: 1.0.0
description: 加载Level1+Level2禁用词完整列表
category: pre-write
inputs: []
outputs:
  - name: banned_words_text
    type: text
triggers:
  - /atom:banned-words-preload
  - 禁用词预加载
---

# banned-words-preload

## 功能
从 banned-words.js 导出的列表加载 Level1（31词）和 Level2（18词）禁用词。

## 执行步骤
1. 读取 `skills/_shared/scripts/banned-words.js`
2. 解析 BANNED_LEVEL1 和 BANNED_LEVEL2 数组
3. 拼接为结构化文本输出

## 输出格式
```
【Level1 禁用词 - 命中即替换】
{词1}、{词2}、...

【Level2 禁用词 - 命中需审查】
{词1}、{词2}、...
```
