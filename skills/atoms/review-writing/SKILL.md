---
name: review-writing
version: 1.0.0
description: 文笔评审，评估AI腔、对话、描写质量
category: review
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: context_file
    type: file_path
    required: false
    description: 上下文文件
outputs:
  - name: review_report
    type: report
triggers:
  - /atom:review-writing
  - 文笔评审
---

# review-writing

## 功能
从文笔维度评审：AI腔程度、对话质量、描写密度、禁用词使用。

## 执行步骤
1. 读取 {chapter_file}
2. 如有 context_file，一并读取
3. 按以下维度打分（1-10）：
   - AI腔程度：越低越好，10=完全无AI味
   - 对话质量：自然度、信息量、节奏
   - 描写密度：感官细节是否充分
   - 禁用词使用：越少越好，10=零禁用词
4. 列出问题清单（P0/P1/P2）

## 输出格式
### 文笔评审报告
- 评分：X/10

| 严重度 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
