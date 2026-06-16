---
name: rules-engine
version: 1.0.0
description: 读取题材定位和项目配置，生成适用规则集
category: pre-write
inputs:
  - name: genre_file
    type: file_path
    required: true
    description: 题材定位.md路径
  - name: config_file
    type: file_path
    required: false
    description: .story-config.json路径
outputs:
  - name: ruleset
    type: yaml
triggers:
  - /atom:rules-engine
  - 规则引擎
---

# rules-engine

## 功能
读取题材定位和项目配置，匹配 genre-writing-formulas.md 和 publishing-guide.md，输出 YAML 格式规则集。

## 执行步骤
1. 读取 {genre_file}，提取题材类型和标签
2. 读取 {config_file}（如有），提取平台、字数、风格等配置
3. 加载 `references/genre-writing-formulas.md`，匹配对应题材公式
4. 加载 `references/publishing-guide.md`，匹配平台发布规范
5. 合并为 YAML 规则集输出

## 输出格式
```yaml
genre: 题材名
platform: 平台名
rules:
  pacing: 节奏要求
  wordcount_per_chapter: 字数范围
  hook_density: 钩子密度
  pov: 视角要求
  tone: 语气基调
banned_patterns:
  - 禁用模式列表
```
