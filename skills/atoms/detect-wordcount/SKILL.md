---
name: detect-wordcount
version: 1.0.0
description: 检测章节字数是否达标
category: detect
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
  - name: target_count
    type: number
    required: true
    description: 目标字数
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
script: manual
triggers:
  - /atom:detect-wordcount
  - 检测字数
---

# detect-wordcount

## 功能
统计章节字数，判断是否达到目标字数的 90% 门槛。

## 执行步骤
1. 读取 {chapter_file}
2. 统计中文字符数（排除标点和空格）
3. 与 {target_count} 对比，判断是否达标

## 输出格式
### 字数检测报告
- 文件：{chapter_file}
- 当前字数：N
- 目标字数：N
- 达标率：N%
- 状态：达标 / 未达标
