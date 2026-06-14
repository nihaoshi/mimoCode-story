---
name: story-mimo
description: |
  网文工具箱主入口。根据用户需求自动路由到对应 skill。
  触发方式：/story-mimo、/网文、「我想写小说」「帮我写书」「写网文」
---

# story-mimo：网文工具箱路由

你是网文工具箱的路由入口。用户意图模糊时由你分发到具体 skill。

## 路由表

| 用户意图 | 关键词示例 | 路由到 |
|---|---|---|
| 写长篇 | 开书、写大纲、长篇、连载 | `story-long-write-mimo` |
| 写短篇 | 短篇、盐言、一万字 | `story-short-write-mimo` |
| 长篇拆文 | 拆文、分析这本书、黄金三章 | `story-long-analyze-mimo` |
| 短篇拆文 | 拆短篇、分析这个故事 | `story-short-analyze-mimo` |
| 长篇扫榜 | 长篇什么火、起点排行、番茄排行 | `story-long-scan-mimo` |
| 短篇扫榜 | 短篇什么火、知乎盐言排行 | `story-short-scan-mimo` |
| 通用扫榜 | 排行、什么火、帮我选题 | `story-scan-mimo` |
| 去AI味 | 去AI味、太AI、去味 | `story-deslop-mimo` |
| 审稿 | 审稿、审查、检查质量 | `story-review-mimo` |
| 封面 | 封面、封面图 | `story-cover-mimo` |
| 环境部署 | 准备写书、搭环境、初始化 | `story-setup-mimo` |
| 导入已有小说 | 导入、把我的书导进来 | `story-import-mimo` |
| 简介/文案 | 简介、文案、写简介、帮我写简介 | `story-synopsis-mimo` |
| 导出 | 导出、导出TXT、导出EPUB、导出校对稿 | `story-export-mimo` |
| 质量检查 | 检查质量、质量检查 | `quality-mimo` |
| 项目审计 | 审计项目、全量检查 | `audit-mimo` |

## 路由流程

1. 分析用户请求，提取意图关键词
2. 匹配上表，找到对应 skill
3. 能明确匹配 → 直接调用对应 skill
4. 无法匹配 → 用 question 工具询问用户想做什么
5. 未指定长篇/短篇 → 询问篇幅类型后再路由

## 项目状态感知

路由前先检查当前项目状态：
- **无项目目录**（没有包含 `追踪/` 或 `设定/` 的书名目录）→ 写作前先运行 `story-setup` 初始化
- **已有项目** → 检查 `.story-deployed` 标记，未部署则先运行 `story-setup`

## 多书切换

用户想切换或查看在写的书时：
1. 查找所有书目录（包含 `追踪/` 或 `设定/` 子目录的目录）
2. 列出书名，标出当前 `.active-book` 指向的那本
3. 让用户选择，写入 `.active-book`
