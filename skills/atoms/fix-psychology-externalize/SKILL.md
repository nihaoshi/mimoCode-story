---
name: fix-psychology-externalize
version: 1.0.0
description: 将心理直述改为动作/感官展示
category: fix
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
outputs:
  - name: fixed_text
    type: text
triggers:
  - /atom:fix-psychology-externalize
  - 心理外化
---

# fix-psychology-externalize

## 功能
将"他感到X"式的心理直述改为动作、感官、生理反应的外部展示。

## 执行步骤
1. 读取 {chapter_file}
2. 按以下规则修正：
   - "他感到愤怒" → 攥紧拳头/咬紧后槽牙等动作
   - "心中涌起一股暖流" → 身体温度变化、表情自然反应
   - "他感到紧张" → 手心出汗/喉结滚动/吞咽等
   - "他知道……" → 用行为展示认知
3. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
