---
name: extract-settings
version: 1.0.0
description: 提取世界观、势力和金手指设定
category: analyze
inputs:
  - name: stage_data
    type: file_path
    required: true
    description: Stage 2-3 数据文件路径
outputs:
  - name: settings_files
    type: directory
    format: markdown
triggers:
  - /atom:extract-settings
  - 设定提取
---

# extract-settings

## 功能
从拆文数据中提取世界观设定、势力体系和金手指系统。

## 执行步骤
1. 读取 {stage_data} 拆文数据
2. 提取世界观框架：地图、历史、规则体系
3. 提取势力分布：主要势力、关系、冲突
4. 提取金手指/系统：类型、升级路径、限制条件
5. 提取其他设定：货币、等级、职业等

## 输出格式
### 设定/*.md
- 世界观.md：世界基础设定
- 势力.md：势力关系图谱
- 金手指.md：金手指/系统设定
- 等级体系.md：修炼/等级系统
