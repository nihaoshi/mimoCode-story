---
name: analyze-golden-chapters
version: 1.0.0
description: 深度拆解前3章的结构、技法和卖点
category: analyze
inputs:
  - name: first_3_chapters
    type: file_path
    required: true
    description: 前3章原文文件路径
outputs:
  - name: deep_analysis
    type: file
    format: markdown
  - name: quick_preview
    type: file
    format: markdown
triggers:
  - /atom:analyze-golden-chapters
  - 黄金三章拆解
---

# analyze-golden-chapters

## 功能
对前3章进行深度拆解，分析结构设计、写作技法、读者钩子和商业卖点。

## 执行步骤
1. 读取 {first_3_chapters} 原文
2. 逐章分析：开篇钩子、场景切换、信息投放节奏、情绪曲线
3. 提取写作技法：视角运用、对话比例、描写密度、悬念设置
4. 总结黄金三章的核心卖点和留存策略

## 输出格式
### 深度拆解.md（每章一份）
- 章节结构图（场景 → 事件 → 情绪）
- 技法标注（技法名 | 原文示例 | 效果）
- 读者钩子清单
- 改进建议

### quick_preview
- 三章整体评价（100字内）
- 核心卖点（3-5条）
