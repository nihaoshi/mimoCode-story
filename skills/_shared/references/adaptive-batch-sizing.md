# 自适应批量大小

> 版本：1.0.0
> 更新时间：2026-06-12
> 目标：长会话稳定性提升

---

## 概述

根据写作状态动态调整每次日更章数，避免长会话疲劳和上下文窗口溢出。

---

## 决策因素

| 因素 | 权重 | 计算方式 | 影响 |
|------|------|---------|------|
| 用户历史平均字数 | 30% | 最近10章平均字数 | 字数多→减少批量 |
| 当前卷剩余章数 | 20% | 细纲已建完的章数 | 剩余少→减少批量 |
| 角色状态复杂度 | 25% | 活跃角色数（本章涉及） | 角色多→减少批量 |
| 伏笔密度 | 25% | 待回收伏笔数 | 伏笔多→减少批量 |

---

## 计算公式

```
基础批量 = 3章

调整系数 = 
  (1 - 用户历史平均字数/5000) * 0.3 +
  (1 - 活跃角色数/10) * 0.25 +
  (1 - 待回收伏笔数/20) * 0.25 +
  (当前卷剩余章数/50) * 0.2

最终批量 = max(1, min(5, round(基础批量 * 调整系数)))
```

---

## 决策矩阵

| 用户历史字数 | 活跃角色 | 待回收伏笔 | 卷剩余章数 | 建议批量 |
|-------------|---------|-----------|-----------|---------|
| 2000字/章 | 2个 | 3条 | 40章 | 4-5章 |
| 3000字/章 | 3个 | 5条 | 30章 | 3-4章 |
| 4000字/章 | 5个 | 10条 | 20章 | 2-3章 |
| 5000字/章 | 8个 | 15条 | 10章 | 1-2章 |
| 6000字/章 | 10个 | 20条 | 5章 | 1章 |

---

## 实现流程

### 1. 数据采集

每次日更开始时，采集以下数据：

```python
# 伪代码
def collect_metrics(project_dir):
    # 用户历史平均字数
    recent_chapters = get_recent_chapters(project_dir, n=10)
    avg_words = mean([chapter.word_count for chapter in recent_chapters])
    
    # 当前卷剩余章数
    current_volume = get_current_volume(project_dir)
    remaining_chapters = current_volume.total_chapters - current_volume.completed_chapters
    
    # 活跃角色数（从角色状态索引读取）
    active_characters = get_active_characters(project_dir)
    
    # 待回收伏笔数（从伏笔索引读取）
    pending_foreshadowing = get_pending_foreshadowing(project_dir)
    
    return {
        "avg_words": avg_words,
        "remaining_chapters": remaining_chapters,
        "active_characters": len(active_characters),
        "pending_foreshadowing": len(pending_foreshadowing)
    }
```

### 2. 批量计算

```python
def calculate_batch_size(metrics):
    base_batch = 3
    
    adjustment = (
        (1 - metrics["avg_words"] / 5000) * 0.3 +
        (1 - metrics["active_characters"] / 10) * 0.25 +
        (1 - metrics["pending_foreshadowing"] / 20) * 0.25 +
        (metrics["remaining_chapters"] / 50) * 0.2
    )
    
    final_batch = max(1, min(5, round(base_batch * adjustment)))
    
    return final_batch
```

### 3. 用户确认

计算出批量后，向用户确认：

```
=== 日更计划 ===
当前状态：
- 最后完成：第32章
- 当前卷：第一卷（剩余8章）
- 活跃角色：5个
- 待回收伏笔：6条

建议批量：2-3章/次
理由：角色较多，伏笔较密，建议稳扎稳打

是否按此批量开始日更？
```

---

## 特殊情况处理

### 卷末收尾

当当前卷剩余≤5章时：

1. 自动减少批量到1-2章
2. 提示用户："当前卷即将结束，建议先处理卷间过渡规划"
3. 询问是否继续日更还是先做卷末收尾

### 细纲缺口

当细纲缺失>3章时：

1. 暂停日更
2. 提示用户："细纲缺失较多，建议先批量补建细纲"
3. 提供细纲补建选项

### 长会话保护

当单次会话已写>5章时：

1. 自动暂停
2. 提示用户："本次会话已写5章，建议休息一下"
3. 保存当前进度，下次从断点继续

---

## 与现有系统的集成

### workflow-daily.md

在Step 1快速上下文加载后，增加批量计算步骤：

```
Step 1.5：批量计算
1. 采集当前状态数据
2. 计算建议批量
3. 向用户确认
4. 确认后进入Step 2
```

### 上下文.md

在索引块中增加批量信息：

```
## 批量信息
- 建议批量：3章
- 计算依据：字数3000+角色5+伏笔6+剩余8
- 最后批量：2章（上一次）
```

---

## 性能提升预估

| 场景 | 改造前 | 改造后 | 提升 |
|------|--------|--------|------|
| 长会话稳定性 | 固定3章，可能疲劳 | 自适应1-5章 | 显著提升 |
| 卷末处理 | 无预警，可能写过头 | 自动提示+减批 | 避免返工 |
| 细纲缺口 | 每章逐个补建 | 批量检测+补建 | 效率提升 |
| 用户体验 | 需要手动调整 | 自动建议+确认 | 易用性提升 |
