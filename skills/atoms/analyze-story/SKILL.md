---
name: analyze-story
version: 2.0.0
description: 故事深度分析（黄金三章+聚合分析）
category: analyze
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: source_data
    type: file
    required: true
    description: 原文或摘要文件路径
    default_source: "正文/"
  - name: analyze_type
    type: text
    required: false
    description: "分析类型：golden|aggregate|all（默认all）"
    default_value: "all"
outputs:
  - name: analysis_files
    type: directory
    format: markdown
  - name: story_line
    type: file
    format: markdown
triggers:
  - /atom:analyze-story
  - 黄金三章拆解
  - 聚合分析
  - 故事分析
---

# analyze-story

## 功能
深度分析故事结构，包括黄金三章拆解和全书聚合分析。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下前3章和所有摘要
- **编排器模式**：输入不为空时，以传入的 {source_data} 为准

## 执行步骤
1. 根据 {analyze_type} 执行分析：
   - `golden`：黄金三章深度拆解
     - 逐章分析：开篇钩子、场景切换、信息投放节奏、情绪曲线
     - 提取写作技法：视角运用、对话比例、描写密度、悬念设置
     - 总结核心卖点和留存策略
   - `aggregate`：全书聚合分析
     - 梳理主线剧情节点，生成故事线时间轴
     - 提取各角色出场轨迹和成长弧线
     - 识别剧情线索（主线/支线/暗线）
   - `all`：依次执行两项分析
2. 输出结构化文件

## 输出格式
### 深度拆解.md（黄金三章）
- 章节结构图（场景 → 事件 → 情绪）
- 技法标注（技法名 | 原文示例 | 效果）
- 读者钩子清单
- 改进建议

### 剧情/*.md（聚合分析）
- 主线剧情.md：核心事件时间轴
- 支线剧情.md：各支线发展脉络
- 暗线伏笔.md：伏笔设置与回收

### 故事线.md
- 故事骨架（起承转合）
- 情绪曲线概览
- 关键转折点
