---
name: analyze-aggregate
version: 1.0.0
description: 从摘要聚合剧情线、角色和故事框架
category: analyze
inputs:
  - name: all_summaries
    type: file_path
    required: true
    description: 全部章节摘要文件路径
outputs:
  - name: plot_files
    type: directory
    format: markdown
  - name: story_line
    type: file
    format: markdown
triggers:
  - /atom:analyze-aggregate
  - 聚合分析
---

# analyze-aggregate

## 功能
从全部章节摘要中聚合提取完整剧情线、角色轨迹和故事框架。

## 执行步骤
1. 读取 {all_summaries} 全部摘要
2. 梳理主线剧情节点，生成故事线时间轴
3. 提取各角色出场轨迹和成长弧线
4. 识别剧情线索（主线/支线/暗线）
5. 生成剧情文件和故事线文档

## 输出格式
### 剧情/*.md
- 主线剧情.md：核心事件时间轴
- 支线剧情.md：各支线发展脉络
- 暗线伏笔.md：伏笔设置与回收
### 故事线.md
- 故事骨架（起承转合）、情绪曲线概览、关键转折点
