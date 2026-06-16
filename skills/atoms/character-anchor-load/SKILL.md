---
name: character-anchor-load
version: 1.0.0
description: 从角色状态文件提取各角色性格锚点
category: pre-write
inputs:
  - name: character_file
    type: file_path
    required: true
    description: 追踪/角色状态.md路径
outputs:
  - name: anchors_text
    type: text
triggers:
  - /atom:character-anchor-load
  - 角色锚点加载
---

# character-anchor-load

## 功能
从角色状态.md中提取每个角色的性格锚点，输出结构化文本。

## 执行步骤
1. 读取 {character_file}
2. 解析每个角色的「性格锚点」字段
3. 拼接为结构化文本，每人一段

## 输出格式
```
【角色锚点】
{角色名1}：{性格锚点1}
{角色名2}：{性格锚点2}
...
```
