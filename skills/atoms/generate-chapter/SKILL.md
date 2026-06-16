---
name: generate-chapter
version: 1.0.0
description: 基于细纲和上下文生成正文草稿
category: write
inputs:
  - name: chapter_outline
    type: file_path
    required: true
    description: 细纲文件路径
  - name: prev_chapter
    type: file_path
    required: false
    description: 上一章正文文件路径
  - name: settings
    type: directory
    required: true
    description: 设定文件目录路径
outputs:
  - name: chapter_draft
    type: file
    format: markdown
triggers:
  - /atom:generate-chapter
  - 正文生成
references:
  - _shared/references/writing-craft.md
  - _shared/references/dialogue-mastery.md
---

# generate-chapter

## 功能
根据细纲、上一章上下文和设定文件，生成符合风格的正文草稿。

## 执行步骤
1. 读取 {chapter_outline} 细纲、{prev_chapter}（如有）、{settings} 设定
2. 参考 writing-craft.md / dialogue-mastery.md 写作方法
3. 按细纲场景逐段生成正文，确保章首钩子、对话自然、节奏达标
4. 输出完整章节草稿（纯正文，无元数据，字数达标，场景间空行分隔）