---
name: fix-banned-words
version: 1.0.0
description: 替换禁用词为推荐表达
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
  - /atom:fix-banned-words
  - 替换禁用词
---

# fix-banned-words

## 功能
扫描章节中的禁用词，替换为推荐表达。

## 执行步骤
1. 读取 {chapter_file}
2. 参考 `_shared/references/banned-words.md` 中的禁用词表和推荐替换
3. 逐个替换：禁用词 → 推荐表达，保持上下文语义通顺
4. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
