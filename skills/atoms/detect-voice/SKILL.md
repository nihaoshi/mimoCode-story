---
name: detect-voice
version: 2.0.0
description: 检测角色对话是否符合声音设定
category: detect
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 章节文件路径
    default_source: "正文/第{N}章.md"
  - name: character_file
    type: file
    required: false
    description: 角色设定文件路径
    default_source: "追踪/角色状态.md"
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

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 最新章节和 `追踪/角色状态.md`
- **编排器模式**：输入不为空时，以传入数据为准

## 执行步骤
1. 读取 {chapter_file} 和 {character_file}
2. 运行：`node _shared/scripts/voice-check.js {chapter_file} {character_file}`
3. 输出偏离设定的对话

## 输出格式
### 角色声音检测报告
- 文件：{chapter_file}
- 偏离项：N 处

| 角色 | 对话内容 | 设定锚点 | 偏离描述 | 位置 |
|------|----------|----------|----------|------|
