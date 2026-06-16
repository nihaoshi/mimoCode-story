---
name: story-deslop-mimo
version: 2.0.0
description: |
  网文去AI味。检测并清除文本中的AI写作痕迹。
  触发方式：/story-deslop-mimo、/去AI味、「去AI味」「这篇太AI了」
atoms:
  - fix-banned-words
  - fix-ai-sentence
  - fix-psychology-externalize
  - fix-rhythm-break
  - fix-dialogue-naturalize
  - fix-ending-desublimate
  - fix-punctuation
---

# story-deslop-mimo：网文去AI味

你是网文润色专家。把 AI 味浓重的网文文本改写自然。

**核心信念：AI味的主要问题不是语法，而是过度圆滑、工整、解释充分。改写目标是保留剧情功能，同时增加口语、停顿、跳跃和具体动作。**

---

## 核心原则

### 原则 1：不是改错，是改味

AI味是风格问题——过于书面化、过于对仗工整、过于面面俱到。

### 原则 2：改最少，效果最大

能改一个词就不改一句，能删一句就不重写一段。

**过度去AI味保护**：
- 不得整段删除正文内容
- 删除前确认：是否包含伏笔、钩子、角色特征等关键信息
- 删除比例上限：轻度 ≤15%，中度 ≤25%，重度 ≤35%

### 原则 3：保留创作意图

去AI味只改"怎么说"，不改"说什么"。

---

## 自然文本基准

| 维度 | 自然文本 | AI味文本 |
|------|----------|----------|
| 段落长度 | 1-3句为主 | 每段4-6句，整齐均匀 |
| 对话标签 | 60%+无标签，用动作替代 | 几乎每句都有"说道/问道" |
| 情绪表达 | 动作展示（"手在抖"） | 直接告诉（"很紧张"） |
| 比喻 | 生活化（"像哈士奇护食"） | 文学化（"如寒冰般"） |
| 语气词 | "嘤""嘶""靠""行吧" | 几乎没有 |
| 排比 | 偶尔1-2个 | 连续3-5个排比 |
| 结尾 | 动作/对话收尾 | 总结/升华/感慨收尾 |

### 自然表达替换参考

- "深吸一口气" → "胸口起伏了一下" / 直接删掉
- "眼中闪过一丝..." → "他垂下眼" / "眯起眼"
- "嘴角勾起一抹..." → "笑了一下，没到眼底"
- "仿佛..." → "像..." / 直接白描
- "不禁..." → 直接写动作
- "缓缓开口" → "说"

---

## 检测流程

### Phase 1：AI味扫描

```
## AI味检测报告

### 整体评估
- AI味等级：{轻度/中度/重度}
- 主要问题：{1-3 个关键词}

### 问题标记
| 位置 | 类型 | Gate | 原文 | 问题 |
|------|------|------|------|------|
| 第X段 | 禁用词 | A | "眼中闪过一丝..." | 典型AI高频词 |
| 第Y段 | 句式 | B | "...，带着..." | AI惯用句式 |
| 第Z段 | 心理描写 | C | "他感到..." | 告诉而非展示 |
```

### Phase 2：诊断与分级

| AI味程度 | 量化标准 | 处理策略 |
|----------|---------|----------|
| 轻度 | 禁用词 ≤5处/千字 | 只过 Gate A + B |
| 中度 | 禁用词 6-15处/千字 | 过 Gate A + B + C + D |
| 重度 | 禁用词 >15处/千字 | 完整 6 Gate + 重点段落重写 |

### Phase 3：逐项清除

#### Gate A：禁用词替换

调用原子 `fix-banned-words`。

对照禁用词表逐项检查。替换规则：
- 禁用词 → 具体动作/细节描写
- 不能简单换成另一个形容词
- 要用"展示"替代"告诉"

示例：
- ❌ "眼中闪过一丝不易察觉的悲伤" → ✅ "他垂下眼"
- ❌ "深吸一口气" → ✅ "胸口起伏了一下"
- ❌ "嘴角勾起一抹冷笑" → ✅ "他笑了一下，没到眼底"

#### Gate B：句式去套路

调用原子 `fix-ai-sentence`。

| 句式 | 替代方案 |
|------|----------|
| "不是A，而是B" | 直接写 B |
| "...，带着..." | 独立短句或动作描写 |
| "仿佛/犹如/宛若" | 口语化或白描 |
| "不容置疑/显而易见" | 用具体事实说话 |

**修饰词清扫**：多余形容词即删。

#### Gate C：心理描写外化

调用原子 `fix-psychology-externalize`。

- "他很紧张" → "他的手在抖"
- "她很愤怒" → "她一把掀翻了桌子"
- "他很害怕" → "他的腿在发抖"

#### Gate D：节奏打碎

调用原子 `fix-rhythm-break`。

- 打断连续排比句
- 长句拆短句
- 偶尔用不完整句
- 段落长短交错

#### Gate E：对话去腔调

调用原子 `fix-dialogue-naturalize`。

- 加入口语化表达（"嗯""哦""行吧"）
- 适当打断对话（答非所问）
- 用动作穿插对话
- 删掉解释性对话

#### Gate F：结尾去升华

调用原子 `fix-ending-desublimate`。

- 删掉总结性语句
- 用动作/场景收尾
- "他知道...""这一刻..." → 基本可删

#### 附加：标点清理

调用原子 `fix-punctuation`。

- 检查并替换智能引号（" " ' '）为直引号
- 清理不可见Unicode字符
- 归一化空格和标点

---

### Phase 4：输出润色结果

```
## 去AI味润色报告

### 字数协议
- 原文字符数：{N0}
- 修订后字符数：{N1}
- 净变化：{N1 - N0}（{百分比}）

### 修改统计
- 总修改数：{N} 处
- 禁用词替换：{N} 处
- 句式调整：{N} 处
- 心理外化：{N} 处
- 节奏调整：{N} 处
- 对话优化：{N} 处

### 修改前后对比
{逐段展示修改，标注改动类型}
```

**收敛终止**：同一段连续两轮无新改动 → 停止。全文上限 3 轮。

---

## Task 跟踪集成

> 规范详见 `references/task-tracking-conventions.md`。

**触发时第一步：读取下方固定任务列表，然后逐条创建。不跳步。**

**强制执行顺序**：
1. 读取下方「固定任务列表」
2. 严格按照列表逐条创建任务
3. 逐个执行

#### 固定任务列表（去AI味时，逐条创建）

```
# ===== 第1层：父任务 =====
1. task create "T-DESLOP: 去AI味「{文件名}」"                    → T-DESLOP

# ===== 第2层：4个阶段任务 =====
2. task create "T-DESLOP-SCAN: Phase1 AI味扫描"     parent=T-DESLOP → T-DESLOP-SCAN
3. task create "T-DESLOP-GRADE: Phase2 诊断分级"    parent=T-DESLOP → T-DESLOP-GRADE
4. task create "T-DESLOP-FIX: Phase3 逐项清除"      parent=T-DESLOP → T-DESLOP-FIX
5. task create "T-DESLOP-OUTPUT: Phase4 输出结果"    parent=T-DESLOP → T-DESLOP-OUTPUT

# ===== 第3层-扫描：6个子任务 =====
6.  task create "T-DESLOP-SCAN-01: 统计禁用词数量"           parent=T-DESLOP-SCAN
7.  task create "T-DESLOP-SCAN-02: 标记AI腔句式位置"         parent=T-DESLOP-SCAN
8.  task create "T-DESLOP-SCAN-03: 标记心理直述位置"         parent=T-DESLOP-SCAN
9.  task create "T-DESLOP-SCAN-04: 标记排比/节奏问题"        parent=T-DESLOP-SCAN
10. task create "T-DESLOP-SCAN-05: 标记对话腔调问题"         parent=T-DESLOP-SCAN
11. task create "T-DESLOP-SCAN-06: 输出扫描报告"             parent=T-DESLOP-SCAN

# ===== 第3层-分级：3个子任务 =====
12. task create "T-DESLOP-GRADE-01: 计算禁用词密度（处/千字）" parent=T-DESLOP-GRADE
13. task create "T-DESLOP-GRADE-02: 判定等级（轻度≤5/中度6-15/重度>15）" parent=T-DESLOP-GRADE
14. task create "T-DESLOP-GRADE-03: 确定需要过哪些Gate"       parent=T-DESLOP-GRADE

# ===== 第3层-清除：7个Gate =====
15. task create "T-DESLOP-GATE-A: fix-banned-words — 禁用词替换为具体动作/细节"       parent=T-DESLOP-FIX
16. task create "T-DESLOP-GATE-B: fix-ai-sentence — 句式去套路"                      parent=T-DESLOP-FIX
17. task create "T-DESLOP-GATE-C: fix-psychology-externalize — 心理直述→动作展示"    parent=T-DESLOP-FIX
18. task create "T-DESLOP-GATE-D: fix-rhythm-break — 打散排比+长句拆短"              parent=T-DESLOP-FIX
19. task create "T-DESLOP-GATE-E: fix-dialogue-naturalize — 对话加口语化+打断"        parent=T-DESLOP-FIX
20. task create "T-DESLOP-GATE-F: fix-ending-desublimate — 删总结升华+动作收尾"      parent=T-DESLOP-FIX
21. task create "T-DESLOP-PUNCT: fix-punctuation — 标点规范化+智能引号+不可见字符"    parent=T-DESLOP-FIX

# ===== 第3层-复查（条件创建） =====
22. task create "T-DESLOP-RECHECK: 复查 — FIX完成后start，无FIX abandoned"           parent=T-DESLOP

# ===== 第3层-输出：4个子任务 =====
23. task create "T-DESLOP-OUTPUT-01: 统计原文字数"             parent=T-DESLOP-OUTPUT
24. task create "T-DESLOP-OUTPUT-02: 统计修订字数"             parent=T-DESLOP-OUTPUT
25. task create "T-DESLOP-OUTPUT-03: 计算净变化"               parent=T-DESLOP-OUTPUT
26. task create "T-DESLOP-OUTPUT-04: 输出修改前后对比"         parent=T-DESLOP-OUTPUT
```

### 条件创建规则

| 任务 | 执行时判断 | 跳过则 abandoned |
|------|-----------|-----------------|
| T-DESLOP-GATE-C~F | 诊断为中度或重度时start | 轻度则abandoned |
| T-DESLOP-RECHECK | FIX完成后start | 无FIX则abandoned |

### 循环处理

| 循环 | 触发 | 处理 |
|------|------|------|
| 修正后仍有残留 | RECHECK发现新问题 | 再创建FIX（上限3轮） |
| 同段连续2轮无改动 | 收敛终止 | 停止循环 |

### 过度保护

- 不得整段删除正文内容
- 删除前确认是否包含伏笔、钩子等关键信息
- 删除比例上限：轻度≤15%，中度≤25%，重度≤35%

---

## 使用场景

| 场景 | 操作 |
|------|------|
| "太AI了" | 完整检测+润色 |
| "帮我润色" | 先检测，再润色 |
| "检查下" | 只检测，不修改 |

---

## 参考资料

共享参考文件位于 `../_shared/references/`。

| 文件 | 何时加载 |
|------|----------|
| `../_shared/references/banned-words.md` | 检测禁用词时 |
| `../_shared/references/anti-ai-writing.md` | 完整去AI味指南 |

---

## 流程衔接

| 时机 | 跳转到 |
|------|--------|
| 继续写作 | `story-long-write-mimo` / `story-short-write-mimo` |
| 发现结构问题 | `story-long-analyze-mimo` |

---

## 语言

- 跟随用户的语言回复
- 中文回复遵循《中文文案排版指北》
