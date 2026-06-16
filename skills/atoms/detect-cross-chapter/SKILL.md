---
name: detect-cross-chapter
version: 1.0.0
description: 检测跨章节的重复内容和矛盾
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 当前章节文件路径
  - name: previous_chapters_dir
    type: dir_path
    required: true
    description: 前序章节目录路径
outputs:
  - name: report
    type: report
    format: markdown
severity: WARN
script: _shared/scripts/cross-chapter-check.js
triggers:
  - /atom:detect-cross-chapter
  - 检测跨章重复
---

# detect-cross-chapter

## 功能
检测当前章节与前序章节之间的重复描写、矛盾信息和叙事断裂。

## 执行步骤
1. 读取 {chapter_file} 和 {previous_chapters_dir} 下所有章节
2. 运行：`node skills/_shared/scripts/cross-chapter-check.js {chapter_file} {previous_chapters_dir}`
3. 输出跨章问题

## 输出格式
### 跨章检测报告
- 文件：{chapter_file}
- 重复段落：N 处
- 矛盾信息：N 处

| 类型 | 当前章节内容 | 前序章节 | 位置 | 建议 |
|------|-------------|----------|------|------|
