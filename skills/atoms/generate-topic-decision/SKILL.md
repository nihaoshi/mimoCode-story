---
name: generate-topic-decision
version: 1.0.0
description: 从趋势数据生成可执行选题建议
category: scan
inputs:
  - name: trend_report
    type: report
    required: true
    description: 题材趋势报告（来自analyze-trend）
  - name: user_preferences
    type: text
    required: false
    description: 用户偏好（擅长/兴趣方向）
outputs:
  - name: topic_decision
    type: file
    format: markdown
triggers:
  - /atom:generate-topic-decision
  - 选题决策生成
---

# generate-topic-decision

## 功能
结合趋势报告和用户偏好，生成选题决策建议。

## 执行步骤
1. 解析 {trend_report}，提取高热度题材
2. 结合 {user_preferences}（如有），筛选匹配题材
3. 为每个推荐题材生成：题材公式、差异化切入点、风险评估
4. 输出选题决策.md

## 输出格式
### 选题决策
| 排名 | 题材 | 切入点 | 匹配度 | 风险 |
|------|------|--------|--------|------|
| 1 | 都市重生 | 商战+金手指 | ★★★★★ | 低 |
| 2 | 末日生存 | 种田流 | ★★★★ | 中 |

**首选建议**：{recommendation}
