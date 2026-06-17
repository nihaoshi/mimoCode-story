---
name: detect-wordcount
version: 2.0.0
description: 检测章节字数是否达标
category: detect
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 章节文件路径
    default_source: "正文/第{N}章.md"
  - name: target_count
    type: number
    required: false
    description: 目标字数
    default_value: 2000
outputs:
  - name: report
    type: report
    format: markdown
severity: BLOCK
triggers:
  - /atom:detect-wordcount
  - 检测字数
---

# detect-wordcount

## 功能
统计章节字数，判断是否达到目标字数的 90% 门槛。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 最新章节，默认目标 2000 字
- **编排器模式**：输入不为空时，以传入数据为准

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
