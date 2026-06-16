---
name: detect-voice
version: 1.0.0
description: 检测角色对话是否符合声音设定
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: character_file
    type: file_path
    required: true
    description: 角色设定文件路径
outputs:
  - name: report
    type: report
    format: markdown
severity: WARN
script: _shared/scripts/voice-check.js
triggers:
  - /atom:detect-voice
  - 检测角色声音
---

# detect-voice

## 功能
检查角色对话是否符合性格锚点和语言习惯设定。

## 执行步骤
1. 读取 {chapter_file} 和 {character_file}
2. 运行：`node skills/_shared/scripts/voice-check.js {chapter_file} {character_file}`
3. 输出偏离设定的对话

## 输出格式
### 角色声音检测报告
- 文件：{chapter_file}
- 偏离项：N 处

| 角色 | 对话内容 | 设定锚点 | 偏离描述 | 位置 |
|------|----------|----------|----------|------|
