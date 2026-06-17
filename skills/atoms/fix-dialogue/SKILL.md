---
name: fix-dialogue
version: 2.0.0
description: 对话与心理修正（去腔调+外化）
category: fix
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 章节文件路径
    default_source: "正文/第{N}章.md"
  - name: fix_type
    type: text
    required: false
    description: "修正类型：dialogue|psychology|all（默认all）"
    default_value: "all"
outputs:
  - name: fixed_text
    type: text
triggers:
  - /atom:fix-dialogue
  - 修正对话
  - 对话去腔调
  - 心理外化
---

# fix-dialogue

## 功能
修正对话和心理描写质量，包括对话去腔调化和心理直述外化。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下最新章节
- **编排器模式**：输入不为空时，以传入的 {chapter_file} 为准

## 执行步骤
1. 读取 {chapter_file}
2. 根据 {fix_type} 执行修正：
   - `dialogue`：对话去腔调化
   - `psychology`：心理直述外化
   - `all`：依次执行两项修正
3. 输出修正后文本

## 对话修正规则
- 书面化对话 → 加口语词（嗯、啊、那个）
- 过长的连贯对话 → 加动作打断或省略号
- 解释性对话（角色说给自己听）→ 删除或压缩
- 过多"他说道""她回应道" → 减少对话标签，用动作替代

## 心理修正规则
- "他感到愤怒" → 攥紧拳头/咬紧后槽牙等动作
- "心中涌起一股暖流" → 身体温度变化、表情自然反应
- "他感到紧张" → 手心出汗/喉结滚动/吞咽等
- "他知道……" → 用行为展示认知

## 输出格式
### 对话心理修正报告
- 文件：{chapter_file}
- 对话修正：N 处
- 心理修正：N 处

| 位置 | 原文 | 修正后 | 类型 | 原因 |
|------|------|--------|------|------|
