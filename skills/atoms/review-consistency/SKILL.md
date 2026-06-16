---
name: review-consistency
version: 1.0.0
description: 一致性评审，检查事实、时间线、伏笔
category: review
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: context_file
    type: file_path
    required: false
    description: 追踪文件（角色状态/时间线/伏笔等）
outputs:
  - name: review_report
    type: report
triggers:
  - /atom:review-consistency
  - 一致性评审
---

# review-consistency

## 功能
从事实一致性维度评审：时间线、伏笔管理、角色状态、物品/环境一致性。

## 执行步骤
1. 读取 {chapter_file}
2. 如有 context_file（追踪文件），一并读取
3. 按以下维度打分（1-10）：
   - 事实一致性：人名/地名/设定是否前后一致
   - 时间线：事件时序是否合理
   - 伏笔管理：已埋伏笔是否推进，是否有遗忘
   - 角色状态：身份/能力/关系是否连贯
4. 列出问题清单（P0/P1/P2）

## 输出格式
### 一致性评审报告
- 评分：X/10

| 严重度 | 位置 | 问题描述 | 建议 |
|--------|------|----------|------|
