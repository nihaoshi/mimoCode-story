---
name: review-character
version: 1.0.0
description: 角色评审，评估一致性、动机、弧线
category: review
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: context_file
    type: file_path
    required: false
    description: 角色设定文件
outputs:
  - name: review_report
    type: report
triggers:
  - /atom:review-character
  - 角色评审
---

# review-character

## 功能
从角色维度评审：一致性、动机合理性、弧线完整性、配角立体度。

## 执行步骤
1. 读取 {chapter_file}
2. 如有 context_file（角色设定），一并读取
3. 按以下维度打分（1-10）：
   - 角色一致性：言行是否符合人设
   - 动机合理性：行为是否有动机支撑
   - 弧线完整性：角色是否有变化/成长
   - 配角立体度：配角是否有独立特征
4. 列出问题清单（P0/P1/P2）

## 输出格式
### 角色评审报告
- 评分：X/10

| 严重度 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
