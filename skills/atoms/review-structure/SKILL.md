---
name: review-structure
version: 1.0.0
description: 章节结构评审，评估钩子、节奏、反转
category: review
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: context_file
    type: file_path
    required: false
    description: 上下文文件（大纲/前章等）
outputs:
  - name: review_report
    type: report
triggers:
  - /atom:review-structure
  - 结构评审
---

# review-structure

## 功能
从结构维度评审章节：钩子效果、情绪曲线、节奏控制、反转设计、章尾钩子。

## 执行步骤
1. 读取 {chapter_file}
2. 如有 context_file，一并读取
3. 按以下维度打分（1-10）：
   - 钩子效果：开篇是否抓人
   - 情绪曲线：是否有起伏
   - 节奏控制：张弛是否得当
   - 反转设计：是否有意外感
   - 章尾钩子：是否让人想翻页
4. 列出问题清单（P0/P1/P2）

## 输出格式
### 结构评审报告
- 评分：X/10

| 严重度 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
