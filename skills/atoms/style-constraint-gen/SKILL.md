---
name: style-constraint-gen
version: 1.0.0
description: 根据题材和平台生成风格要求文本
category: pre-write
inputs:
  - name: genre_file
    type: file_path
    required: true
    description: 题材定位.md路径
  - name: platform
    type: string
    required: true
    description: 平台名（起点/番茄/晋江等）
outputs:
  - name: style_text
    type: text
triggers:
  - /atom:style-constraint-gen
  - 风格约束生成
---

# style-constraint-gen

## 功能
根据题材类型和目标平台，生成写作风格约束文本。

## 执行步骤
1. 读取 {genre_file}，提取题材和文风标签
2. 加载 `references/genre-writing-formulas.md`，匹配题材风格公式
3. 加载 `references/publishing-guide.md`，匹配平台文风偏好
4. 合并生成风格约束文本

## 输出格式
```
【风格约束】
题材风格：{genre_style}
句式偏好：{sentence_style}
段落节奏：{paragraph_rhythm}
平台调性：{platform_tone}
禁忌风格：{avoid_style}
```
