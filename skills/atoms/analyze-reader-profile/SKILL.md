---
name: analyze-reader-profile
version: 1.0.0
description: 分析目标平台读者特征
category: scan
inputs:
  - name: platform_data
    type: json
    required: true
    description: 平台数据（排行+评论+弹幕）
outputs:
  - name: profile_report
    type: report
    format: markdown
triggers:
  - /atom:analyze-reader-profile
  - 读者画像分析
---

# analyze-reader-profile

## 功能
分析目标平台的读者年龄、偏好、付费习惯、阅读节奏特征。

## 执行步骤
1. 解析 {platform_data}，提取评论关键词、评分分布
2. 加载 `references/reader-profiling.md` 作为分析框架
3. 按维度分析：年龄层、题材偏好、节奏偏好、付费意愿
4. 输出读者画像报告

## 输出格式
### 读者画像报告
- **平台**：{platform}
- **核心年龄层**：{age_range}
- **题材偏好**：{top_genres}
- **节奏偏好**：{pacing_pref}
- **付费意愿**：{pay_willingness}
- **内容禁忌**：{taboos}
