---
name: extract-chapter-summary
version: 1.0.0
description: 每章提取情节点和角色
category: analyze
inputs:
  - name: chapters
    type: file_path
    required: true
    description: 分块章节文件路径
outputs:
  - name: chapter_summaries
    type: file
    format: markdown
triggers:
  - /atom:extract-chapter-summary
  - 逐章摘要提取
---

# extract-chapter-summary

## 功能
对每个章节提取核心情节点、出场角色和状态变化，生成结构化摘要。

## 执行步骤
1. 读取 {chapters} 分块章节
2. 逐章提取：核心事件、出场角色、角色状态变化、伏笔/钩子
3. 标注事件类型（冲突/转折/揭示/铺垫）
4. 记录新增设定或世界观信息

## 输出格式
### 章节摘要.md
| 章节 | 核心事件 | 出场角色 | 状态变化 | 伏笔/钩子 | 事件类型 |
|------|----------|----------|----------|-----------|----------|
