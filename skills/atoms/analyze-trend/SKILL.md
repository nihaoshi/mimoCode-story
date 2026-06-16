---
name: analyze-trend
version: 1.0.0
description: 从排行数据提取题材热度和趋势
category: scan
inputs:
  - name: ranking_data
    type: json
    required: true
    description: 排行榜数据（来自scrape-platform）
outputs:
  - name: trend_report
    type: report
    format: markdown
triggers:
  - /atom:analyze-trend
  - 题材趋势分析
---

# analyze-trend

## 功能
从排行榜数据中提取题材分布、热度排名、趋势变化。

## 执行步骤
1. 解析 {ranking_data}，按题材/标签分类统计
2. 计算各题材上榜数量、平均评分、字数分布
3. 识别上升题材和衰退题材
4. 输出趋势报告

## 输出格式
### 题材趋势报告
| 题材 | 上榜数 | 平均评分 | 趋势 |
|------|--------|----------|------|
| 都市 | 15 | 8.2 | ↑ |
| 玄幻 | 12 | 7.8 | → |

**热点题材**：{top_genres}
**新兴趋势**：{rising_trends}
