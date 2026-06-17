---
name: pre-write-context
version: 2.0.0
description: 上下文加载（角色锚点+模板注入）
category: pre-write
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: character_file
    type: file
    required: false
    description: 角色状态.md路径
    default_source: "追踪/角色状态.md"
  - name: ruleset
    type: text
    required: false
    description: 规则集文本（来自pre-write-constraints）
  - name: load_type
    type: text
    required: false
    description: "加载类型：anchor|template|all（默认all）"
    default_value: "all"
outputs:
  - name: context_text
    type: text
triggers:
  - /atom:pre-write-context
  - 加载上下文
  - 角色锚点
  - 模板注入
---

# pre-write-context

## 功能
加载写作上下文，包括角色性格锚点提取和约束模板注入。

## 双模执行
- **独立模式**：输入为空时，从项目默认位置读取
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 根据 {load_type} 执行加载：
   - `anchor`：读取 {character_file}，提取每个角色的「性格锚点」字段
   - `template`：解析 {ruleset} 和角色锚点，按模板拼接约束文本
   - `all`：依次执行两项加载
2. 输出结构化上下文文本

## 输出格式
```
【角色锚点】
{角色名1}：{性格锚点1}
{角色名2}：{性格锚点2}
...

【写作约束】
题材：{genre} | 平台：{platform}
节奏：{pacing} | 字数：{wordcount}/章
语气：{tone}

【禁用模式】
- {pattern_1}
- {pattern_2}
```
