---
name: fix-ending-desublimate
version: 1.0.0
description: 结尾去升华，删除总结性语句
category: fix
inputs:
  - name: chapter_file
    type: file_path
    required: true
    description: 章节文件路径
outputs:
  - name: fixed_text
    type: text
triggers:
  - /atom:fix-ending-desublimate
  - 结尾去升华
---

# fix-ending-desublimate

## 功能
删除章末总结性、升华性语句，用动作或场景自然收尾。

## 执行步骤
1. 读取 {chapter_file}
2. 按以下规则修正：
   - "总之/总而言之/不得不说" → 直接删除
   - 总结性结尾段 → 改用具体动作或场景画面收尾
   - "他不知道的是……"空泛预告 → 改为具体钩子物件/事件
   - 升华式感慨（人生哲理类）→ 删除或融入角色行为
3. 输出修正后文本

## 输出格式
### 修正报告
- 文件：{chapter_file}
- 修正项数：N

| 位置 | 原文 | 修正后 | 原因 |
|------|------|--------|------|
