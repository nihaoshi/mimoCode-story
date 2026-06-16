---
name: review-commercial
version: 1.0.0
description: 商业评审，评估爽点、钩子、题材适配
category: review
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: context_file
    type: file_path
    required: false
    description: 题材定位文件
outputs:
  - name: review_report
    type: report
triggers:
  - /atom:review-commercial
  - 商业评审
---

# review-commercial

## 功能
从商业维度评审：爽点密度、钩子效果、题材适配、平台适配。

## 执行步骤
1. 读取 {chapter_file}
2. 如有 context_file（题材定位），一并读取
3. 按以下维度打分（1-10）：
   - 爽点密度：每千字是否有爽点/情绪释放
   - 钩子效果：章末是否有留存力
   - 题材适配：是否符合目标题材套路
   - 平台适配：节奏/篇幅是否适合目标平台
4. 列出问题清单（P0/P1/P2）

## 输出格式
### 商业评审报告
- 评分：X/10

| 严重度 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
