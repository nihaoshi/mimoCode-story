---
name: prompt-template-inject
version: 1.0.0
description: 将规则和角色锚点组合为写作约束文本
category: pre-write
inputs:
  - name: ruleset
    type: yaml
    required: true
    description: 规则引擎输出的YAML规则集
  - name: anchors
    type: text
    required: true
    description: 角色锚点文本（来自character-anchor-load）
outputs:
  - name: constraint_text
    type: text
triggers:
  - /atom:prompt-template-inject
  - Prompt模板注入
---

# prompt-template-inject

## 功能
将规则集和角色锚点合并为一段结构化约束文本，注入AI写作上下文。

## 执行步骤
1. 解析 {ruleset}，提取 pacing / wordcount / hook_density / tone 等规则
2. 解析 {anchors}，提取各角色性格锚点
3. 按模板拼接为约束文本：
   - 开头：全局规则（题材、平台、节奏）
   - 中间：角色约束（每人一段锚点）
   - 结尾：禁用模式列表
4. 输出 constraint_text

## 输出格式
```
【写作约束】
题材：{genre} | 平台：{platform}
节奏：{pacing} | 字数：{wordcount}/章
语气：{tone}

【角色锚点】
{character_name}：{anchor_text}
...

【禁用模式】
- {pattern_1}
- {pattern_2}
```
