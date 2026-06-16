---
name: extract-style
version: 1.0.0
description: 从原文和拆文报告提取写作风格
category: analyze
inputs:
  - name: analysis_report
    type: file_path
    required: true
    description: 拆文报告文件路径
  - name: raw_text
    type: file_path
    required: true
    description: 原文文件路径
outputs:
  - name: style_file
    type: file
    format: markdown
triggers:
  - /atom:extract-style
  - 文风提取
---

# extract-style

## 功能
从原文和拆文报告中提取作者的写作风格特征，生成可复用的风格描述。

## 执行步骤
1. 读取 {raw_text} 原文和 {analysis_report} 拆文报告
2. 分析句式特征：句长分布、句式偏好、节奏感
3. 分析叙事手法：视角、时态、叙述距离
4. 分析语言特色：用词偏好、修辞手法、对话风格
5. 汇总风格画像

## 输出格式
### 文风.md
- 整体风格定性（一句话）
- 句式特征（短句/长句比例、节奏）
- 叙事手法（视角、时态、距离感）
- 语言特色（用词、修辞、对话）
- 可复用的风格指令（供写作参考）
