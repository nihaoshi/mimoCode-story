---
name: fix-style
version: 2.0.0
description: 风格修正（结尾去升华+节奏打散）
category: fix
dual_mode:
  standalone: true
  orchestrator: true
inputs:
  - name: chapter_file
    type: file
    required: true
    description: 章节文件路径
    default_source: "正文/第{N}章.md"
  - name: fix_type
    type: text
    required: false
    description: "修正类型：ending|rhythm|all（默认all）"
    default_value: "all"
outputs:
  - name: fixed_text
    type: text
triggers:
  - /atom:fix-style
  - 修正风格
  - 结尾去升华
  - 节奏打散
---

# fix-style

## 功能
修正写作风格问题，包括结尾去升华和节奏打散。

## 双模执行
- **独立模式**：输入为空时，读取 `正文/` 目录下最新章节
- **编排器模式**：输入不为空时，以传入的 {chapter_file} 为准

## 执行步骤
1. 读取 {chapter_file}
2. 根据 {fix_type} 执行修正：
   - `ending`：结尾去升华
   - `rhythm`：节奏打散
   - `all`：依次执行两项修正
3. 输出修正后文本

## 结尾修正规则
- "总之/总而言之/不得不说" → 直接删除
- 总结性结尾段 → 改用具体动作或场景画面收尾
- "他不知道的是……"空泛预告 → 改为具体钩子物件/事件
- 升华式感慨（人生哲理类）→ 删除或融入角色行为

## 节奏修正规则
- 连续3句以上相同句式 → 打散，变换句式结构
- 超过40字的长句 → 拆为2-3个短句
- 段落内连续短句 → 合并或插入中等长度句
- 确保每段有长短交错的节奏感

## 输出格式
### 风格修正报告
- 文件：{chapter_file}
- 结尾修正：N 处
- 节奏修正：N 处

| 位置 | 原文 | 修正后 | 类型 | 原因 |
|------|------|--------|------|------|
