---
name: fix-rhythm-break
version: 1.0.0
description: 打散排比节奏，调整句长交错
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
  - /atom:fix-rhythm-break
  - 节奏打散
---

# fix-rhythm-break

## 功能
打断机械排比，长句拆短，实现段落内句长长短交错。

## 执行步骤
1. 读取 {chapter_file}
2. 按以下规则修正：
   - 连续3句以上相同句式 → 打散，变换句式结构
   - 超过40字的长句 → 拆为2-3个短句
   - 段落内连续短句 → 合并或插入中等长度句
   - 确保每段有长短交错的节奏感
3. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
