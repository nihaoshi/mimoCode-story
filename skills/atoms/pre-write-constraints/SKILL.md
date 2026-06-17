---
name: pre-write-constraints
version: 2.0.0
description: 约束加载（禁用词+风格+规则）
category: pre-write
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: genre_file
    type: file
    required: false
    description: 题材定位.md路径
    default_source: "设定/题材定位.md"
  - name: platform
    type: text
    required: false
    description: 平台名（起点/番茄/晋江等）
    default_value: "起点"
  - name: load_type
    type: text
    required: false
    description: "加载类型：banned|style|rules|all（默认all）"
    default_value: "all"
outputs:
  - name: constraints_text
    type: text
references:
  - _shared/references/banned-words.md
  - _shared/references/genre-writing-formulas.md
  - _shared/references/publishing-guide.md
triggers:
  - /atom:pre-write-constraints
  - 加载约束
  - 加载禁用词
  - 风格约束
  - 规则引擎
---

# pre-write-constraints

## 功能
加载写作约束，包括禁用词列表、风格约束和题材规则。

## 双模执行
- **独立模式**：输入为空时，从项目默认位置读取
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 根据 {load_type} 执行加载：
   - `banned`：从 `_shared/scripts/banned-words.js` 提取 Level1/Level2 禁用词
   - `style`：读取 {genre_file} 和 {platform}，匹配 genre-writing-formulas.md 和 publishing-guide.md
   - `rules`：读取 {genre_file}，生成 YAML 规则集（pacing/wordcount/hook_density/tone）
   - `all`：依次执行三项加载
2. 合并为结构化约束文本

## 输出格式
```
【禁用词】
Level1（命中即替换）：{词1}、{词2}、...
Level2（命中需审查）：{词1}、{词2}、...

【风格约束】
题材风格：{genre_style}
句式偏好：{sentence_style}
段落节奏：{paragraph_rhythm}
平台调性：{platform_tone}

【规则集】
题材：{genre} | 平台：{platform}
节奏：{pacing} | 字数：{wordcount}/章
语气：{tone}
禁用模式：{banned_patterns}
```
