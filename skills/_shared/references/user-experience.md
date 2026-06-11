# 用户交互体验

> 版本：1.0.0
> 更新时间：2026-06-12
> 目标：一目了然，快捷恢复

---

## 概述

优化用户交互体验，包括项目状态仪表盘、快捷恢复、写作反馈循环。

---

## 交互功能

| 功能 | 触发方式 | 输出内容 |
|------|---------|---------|
| 项目状态仪表盘 | `/story` 或"状态" | 进度/字数/伏笔/最后写作时间 |
| 快捷恢复 | "继续写" | 断点确认+开始日更 |
| 写作反馈 | 每批完成后 | 完成章数/爽点/伏笔/警告 |

---

## 项目状态仪表盘

### 触发方式

用户说：`/story`、"状态"、"进度"、"查看项目"

### 输出格式

```
=== 浮生大唐 ===
📊 进度：第32章 / 约300章（10.7%）
📝 总字数：96,000字
📚 当前卷：第一卷·长安立足（Ch001-032，已完成）
🔍 活跃伏笔：8条
⏰ 最后写作：2026-06-10
🎯 下一步：开新卷 or 继续日更？

---
📈 质量指标
- 平均字数：3,000字/章
- 爽点密度：967字/爽点（优秀）
- 伏笔回收率：32%
- 角色出场率：陈玄100%，薛十三47%

---
⚠️ 待处理
- F02说漏嘴"贞观元年"：已埋30章，需在本卷内回收
- 第二卷细纲：待补建
```

---

### 实现逻辑

```python
def show_project_status(project_dir):
    # 读取上下文
    context = read_context(project_dir)
    
    # 读取数据
    data = read_writing_data(project_dir)
    
    # 读取伏笔
    foreshadowing = read_foreshadowing(project_dir)
    
    # 读取质量指标
    quality = read_quality_metrics(project_dir)
    
    # 输出状态
    print(f"=== {context['book_name']} ===")
    print(f"📊 进度：第{context['last_chapter']}章 / 约{context['target_chapters']}章（{context['progress']}%）")
    print(f"📝 总字数：{context['total_words']}字")
    print(f"📚 当前卷：{context['current_volume']}")
    print(f"🔍 活跃伏笔：{foreshadowing['active_count']}条")
    print(f"⏰ 最后写作：{context['last_write_date']}")
    print(f"🎯 下一步：{context['next_step']}")
    
    print("\n---\n📈 质量指标")
    print(f"- 平均字数：{quality['avg_words']}字/章")
    print(f"- 爽点密度：{quality['hook_density']}字/爽点（{quality['hook_rating']}）")
    print(f"- 伏笔回收率：{quality['foreshadow_recovery_rate']}%")
    print(f"- 角色出场率：{quality['character_appearance']}")
    
    if quality['warnings']:
        print("\n---\n⚠️ 待处理")
        for warning in quality['warnings']:
            print(f"- {warning}")
```

---

## 快捷恢复

### 触发方式

用户说："继续写"、"续写"、"日更"

### 输出格式

```
=== 恢复上次写作 ===
📍 上次写到：第32章·归途
📝 上次字数：3,100字
🔍 待回收伏笔：3条
  - F02：说漏嘴"贞观元年"（紧迫度：本卷）
  - F03："角调"暴露（紧迫度：本卷）
  - F07：房玄龄察觉手茧（紧迫度：本卷）

📋 下一章细纲：第33章·{章名}（已就绪）

是否开始日更？
[是] 开始日更
[否] 取消
```

---

### 实现逻辑

```python
def quick_resume(project_dir):
    # 读取上下文
    context = read_context(project_dir)
    
    # 读取待回收伏笔
    pending_foreshadowing = get_pending_foreshadowing(project_dir)
    
    # 检查下一章细纲
    next_chapter = context['last_chapter'] + 1
    outline_file = f"大纲/细纲_第{next_chapter:03d}章.md"
    outline_ready = os.path.exists(os.path.join(project_dir, outline_file))
    
    # 输出恢复信息
    print(f"=== 恢复上次写作 ===")
    print(f"📍 上次写到：第{context['last_chapter']}章·{context['last_chapter_name']}")
    print(f"📝 上次字数：{context['last_chapter_words']}字")
    print(f"🔍 待回收伏笔：{len(pending_foreshadowing)}条")
    for fp in pending_foreshadowing[:3]:  # 最多显示3条
        print(f"  - {fp['id']}：{fp['content']}（紧迫度：{fp['urgency']}）")
    
    print(f"\n📋 下一章细纲：第{next_chapter}章（{'已就绪' if outline_ready else '待补建'}）")
    
    if outline_ready:
        print("\n是否开始日更？")
        return True
    else:
        print("\n细纲未就绪，建议先补建细纲。")
        return False
```

---

## 写作反馈循环

### 触发方式

每批日更完成后自动输出

### 输出格式

```
=== 本次日更完成 ===
✅ 完成：3章（Ch030-Ch032）
📝 字数：9,200字

🎯 爽点：2个
  - Ch030：信息差揭示（第3段）
  - Ch032：情感共鸣（第2段）

🔍 伏笔：回收1条，新增1条
  - 回收：F11李靖警告信
  - 新增：F13薛平出生

⚠️ 警告：
  - Ch031连续2段描写超500字无对话

📊 累计进度：第32章/300章（10.7%）

继续日更？还是休息一下？
```

---

### 实现逻辑

```python
def write_feedback(chapters_written, session_stats):
    print(f"=== 本次日更完成 ===")
    print(f"✅ 完成：{len(chapters_written)}章（Ch{chapters_written[0]}-Ch{chapters_written[-1]}）")
    print(f"📝 字数：{session_stats['total_words']}字")
    
    print(f"\n🎯 爽点：{len(session_stats['hooks'])}个")
    for hook in session_stats['hooks']:
        print(f"  - Ch{hook['chapter']}：{hook['type']}（{hook['position']}）")
    
    print(f"\n🔍 伏笔：回收{session_stats['foreshadow_recovered']}条，新增{session_stats['foreshadow_added']}条")
    for fp in session_stats['foreshadow_changes']:
        print(f"  - {fp['action']}：{fp['id']}{fp['content']}")
    
    if session_stats['warnings']:
        print(f"\n⚠️ 警告：")
        for warning in session_stats['warnings']:
            print(f"  - {warning}")
    
    # 显示累计进度
    context = read_context(project_dir)
    print(f"\n📊 累计进度：第{context['last_chapter']}章/{context['target_chapters']}章（{context['progress']}%）")
    
    print("\n继续日更？还是休息一下？")
```

---

## 与现有系统的集成

### story路由入口

在`story/SKILL.md`中增加：

```
| 查看状态 | 状态、进度、查看项目 | 显示项目状态仪表盘 |
```

### workflow-daily.md

在Step 1增加快捷恢复：

```
Step 1.5：快捷恢复（可选）
1. 如果用户说"继续写"，执行快捷恢复
2. 显示上次写作状态
3. 确认是否开始日更
```

在Step 4增加写作反馈：

```
Step 4：写作反馈
1. 汇总本次写作数据
2. 输出写作反馈
3. 询问是否继续
```

---

## 性能提升预估

| 场景 | 改造前 | 改造后 | 提升 |
|------|--------|--------|------|
| 查看状态 | 手动检查多个文件 | 一键查看仪表盘 | 显著提升 |
| 恢复写作 | 手动找断点 | 自动识别+确认 | 显著提升 |
| 了解进度 | 手动计算 | 自动反馈 | 显著提升 |
| 用户体验 | 分散 | 集中 | 显著提升 |
