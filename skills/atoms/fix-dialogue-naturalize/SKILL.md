---
name: fix-dialogue-naturalize
version: 1.0.0
description: 对话去腔调，增加口语化和自然感
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
  - /atom:fix-dialogue-naturalize
  - 对话去腔调
---

# fix-dialogue-naturalize

## 功能
消除对话中的书面腔，增加口语化、打断感和自然度。

## 执行步骤
1. 读取 {chapter_file}
2. 按以下规则修正：
   - 书面化对话 → 加口语词（嗯、啊、那个）
   - 过长的连贯对话 → 加动作打断或省略号
   - 解释性对话（角色说给自己听）→ 删除或压缩
   - 过多"他说道""她回应道" → 减少对话标签，用动作替代
3. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
