---
name: design-character
version: 1.0.0
description: 设计角色卡片
category: write
inputs:
  - name: genre
    type: string
    required: true
    description: 题材类型
  - name: role
    type: string
    required: true
    description: 功能位（主角/反派/导师等）
outputs:
  - name: character_card
    type: file
    format: markdown
triggers:
  - /atom:design-character
  - 角色设计
references:
  - _shared/references/character-basics.md
---

# design-character

## 功能
根据题材和功能位设计角色卡片，包含基本信息、动机、弱点和成长弧线。

## 执行步骤
1. 确认 {genre} 题材和 {role} 功能位
2. 参考 character-basics.md 角色设计方法
3. 设计角色基本信息：姓名、身份、外貌、年龄
4. 设计内在维度：动机、恐惧、弱点、秘密
5. 设计角色弧线：起点状态 → 关键转折 → 终点状态

## 输出格式
### 角色卡.md
- 基本信息（姓名/身份/外貌/年龄）
- 性格特征（3个核心特质）
- 动机与恐惧
- 弱点与秘密
- 人物关系预设
- 角色弧线（起点 → 转折 → 终点）
- 标志性台词/行为
