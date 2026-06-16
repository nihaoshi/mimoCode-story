---
name: design-volume-outline
version: 1.0.0
description: 设计卷级大纲
category: write
inputs:
  - name: genre_file
    type: file_path
    required: true
    description: 题材定位文件路径
  - name: analysis_lib
    type: directory
    required: true
    description: 拆文库目录路径
outputs:
  - name: volume_outline
    type: file
    format: markdown
triggers:
  - /atom:design-volume-outline
  - 卷纲设计
references:
  - _shared/references/outline-methods.md
---

# design-volume-outline

## 功能
基于题材定位和拆文库参考，设计卷级大纲，明确每卷的功能、核心事件和状态变化。

## 执行步骤
1. 读取 {genre_file} 题材定位和 {analysis_lib} 拆文库
2. 参考 outline-methods.md 方法论
3. 设计卷数规划和每卷功能定位
4. 每卷定义：核心冲突、关键事件、主角状态起点/终点
5. 设计卷间衔接和整体节奏曲线

## 输出格式
### 卷纲.md
| 卷号 | 卷名 | 功能 | 核心冲突 | 关键事件 | 状态变化 | 字数目标 |
|------|------|------|----------|----------|----------|----------|
- 整体节奏曲线描述
- 卷间衔接要点
