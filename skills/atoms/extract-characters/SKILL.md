---
name: extract-characters
version: 1.0.0
description: 提取角色信息、关系和分级
category: analyze
inputs:
  - name: stage_data
    type: file_path
    required: true
    description: Stage 2-3 数据文件路径
outputs:
  - name: character_files
    type: directory
    format: markdown
triggers:
  - /atom:extract-characters
  - 角色提取
---

# extract-characters

## 功能
从拆文数据中提取角色详细信息、人物关系和角色分级。

## 执行步骤
1. 读取 {stage_data} 拆文数据
2. 提取角色基本信息：姓名、身份、外貌、性格
3. 分析人物关系：亲疏、敌友、情感线
4. 角色分级：主角/核心配角/普通配角/龙套
5. 提取角色弧线：成长轨迹、关键转折

## 输出格式
### 角色/*.md
- 主角.md：主角详细设定
- 配角表.md：配角清单与简介
- 关系图.md：人物关系描述
- 角色弧线.md：各角色成长轨迹
