---
name: scrape-platform
version: 1.0.0
description: 通过脚本或CDP抓取平台排行榜数据
category: scan
inputs:
  - name: platform
    type: string
    required: true
    description: 平台名（qidian/fanqie/jjwxc/ciweimao/qimao/dz/heiyan）
  - name: rank_type
    type: string
    required: false
    description: 榜单类型（畅销/新书/推荐等）
outputs:
  - name: ranking_data
    type: json
triggers:
  - /atom:scrape-platform
  - 平台数据采集
---

# scrape-platform

## 功能
根据平台选择对应scraper脚本，抓取排行榜数据。

## 执行步骤
1. 根据 {platform} 选择脚本：
   - qidian/fanqie → `skills/_shared/scripts/cdp-utils.js` + CDP模式
   - jjwxc/ciweimao/qimao → 对应爬虫脚本
2. 执行抓取，获取书名、作者、分类、字数、评分、简介
3. 输出结构化 JSON

## 输出格式
```json
{
  "platform": "平台名",
  "rank_type": "榜单类型",
  "books": [
    {"title": "", "author": "", "category": "", "words": 0, "score": 0, "intro": ""}
  ]
}
```
