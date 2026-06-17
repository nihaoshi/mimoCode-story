---
name: extract-characters
version: 2.0.0
description: 角色与情节提取（角色信息+章节摘要）
category: analyze
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: source_data
    type: file
    required: true
    description: 拆文数据或章节文件路径
    default_source: "正文/"
  - name: extract_type
    type: text
    required: false
    description: "提取类型：characters|summary|all（默认all）"
    default_value: "all"
outputs:
  - name: character_files
    type: directory
    format: markdown
  - name: chapter_summaries
    type: file
    format: markdown
triggers:
  - /atom:extract-characters
  - 角色提取
  - 章节摘要
---

# extract-characters

## 功能
提取角色详细信息、人物关系、角色分级，以及逐章情节摘要。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下所有章节
- **编排器模式**：输入不为空时，以传入的 {source_data} 为准

## 执行步骤
1. 根据 {extract_type} 执行提取：
   - `characters`：提取角色信息
     - 基本信息：姓名、身份、外貌、性格
     - 人物关系：亲疏、敌友、情感线
     - 角色分级：主角/核心配角/普通配角/龙套
     - 角色弧线：成长轨迹、关键转折
   - `summary`：逐章提取情节
     - 核心事件、出场角色、状态变化、伏笔/钩子
     - 标注事件类型（冲突/转折/揭示/铺垫）
   - `all`：依次执行两项提取
2. 输出结构化文件

## 输出格式
### 角色/*.md
- 主角.md：主角详细设定
- 配角表.md：配角清单与简介
- 关系图.md：人物关系描述
- 角色弧线.md：各角色成长轨迹

### 章节摘要.md
| 章节 | 核心事件 | 出场角色 | 状态变化 | 伏笔/钩子 | 事件类型 |
|------|----------|----------|----------|-----------|----------|
