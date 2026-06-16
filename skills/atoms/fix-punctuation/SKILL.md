---
name: fix-punctuation
version: 1.0.0
description: 标点规范化，清理AI标点习惯
category: fix
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
outputs:
  - name: fixed_text
    type: text
script: _shared/scripts/punctuation-normalize.js
triggers:
  - /atom:fix-punctuation
  - 标点规范化
---

# fix-punctuation

## 功能
标点规范化。检测并清理AI写作中的标点问题。

## 检测规则（写前加载到上下文，写时直接避开）

| 问题 | 检测方式 | 正确写法 |
|------|---------|---------|
| `---` 独立行分隔线 | 正文中出现 `---` | 直接删除，正文中禁止使用 |
| 智能弯引号 `""''` | U+201C/201D/2018/2019 | 用直角引号「」或直引号 "" |
| em dash `—` | U+2014（单个） | 叙述中删除或改为逗号；对话被打断用 `——`（两个） |
| en dash `–` | U+2013 | 改为 `-` 或删除 |
| 水平省略号 `…` | U+2026 | 用三个句号 `...` |
| 零宽空格 | U+200B | 直接删除 |
| NBSP | U+00A0 | 替换为普通空格 |
| 窄 NBSP | U+202F | 替换为普通空格 |
| BOM | U+FEFF | 直接删除 |
| 零宽连接符 | U+200D | 直接删除 |
| 破折号密度过高 | `——` 超过 2次/百字 | 替换部分为逗号或句号断句 |
| `--` 双连字符 | 连续两个半角连字符 | 改为 `——` 或删除 |

## 执行步骤
1. 读取 {chapter_file}
2. 运行：`node skills/_shared/scripts/punctuation-normalize.js {chapter_file}`
3. 输出修正后文本

## 输出格式
### 标点修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
