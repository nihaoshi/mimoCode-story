---
name: extract-world
version: 2.0.0
description: 世界观与风格提取（设定+文风）
category: analyze
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: source_data
    type: file
    required: true
    description: 拆文数据或原文文件路径
    default_source: "正文/"
  - name: extract_type
    type: text
    required: false
    description: "提取类型：settings|style|all（默认all）"
    default_value: "all"
outputs:
  - name: settings_files
    type: directory
    format: markdown
  - name: style_file
    type: file
    format: markdown
triggers:
  - /atom:extract-world
  - 设定提取
  - 文风提取
---

# extract-world

## 功能
提取世界观设定、势力体系、金手指系统，以及写作风格特征。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下所有章节
- **编排器模式**：输入不为空时，以传入的 {source_data} 为准

## 执行步骤
1. 根据 {extract_type} 执行提取：
   - `settings`：提取世界观设定
     - 世界观框架：地图、历史、规则体系
     - 势力分布：主要势力、关系、冲突
     - 金手指/系统：类型、升级路径、限制条件
     - 其他设定：货币、等级、职业等
   - `style`：提取写作风格
     - 句式特征：句长分布、句式偏好、节奏感
     - 叙事手法：视角、时态、叙述距离
     - 语言特色：用词偏好、修辞手法、对话风格
   - `all`：依次执行两项提取
2. 输出结构化文件

## 输出格式
### 设定/*.md
- 世界观.md：世界基础设定
- 势力.md：势力关系图谱
- 金手指.md：金手指/系统设定
- 等级体系.md：修炼/等级系统

### 文风.md
- 整体风格定性（一句话）
- 句式特征（短句/长句比例、节奏）
- 叙事手法（视角、时态、距离感）
- 语言特色（用词、修辞、对话）
- 可复用的风格指令（供写作参考）
