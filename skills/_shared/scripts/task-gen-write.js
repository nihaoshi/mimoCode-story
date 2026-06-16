#!/usr/bin/env node
/**
 * task-gen-write.js — 长篇写作任务树生成器
 * 
 * 用法：node task-gen-write.js <章节号> <章名>
 * 
 * 输出：固定格式的任务创建指令列表，AI 必须逐条执行
 * 
 * 示例：node task-gen-write.js 5 重回考场
 */

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法：node task-gen-write.js <章节号> <章名>');
  process.exit(1);
}

const N = args[0].padStart(3, '0');  // 补零：5 → 005
const N_RAW = args[0];               // 原始：5
const chapterName = args[1];

console.log(`# ===== 写第${N_RAW}章「${chapterName}」任务树 =====`);
console.log(`# 共51条任务，必须逐条创建，不得增减合并`);
console.log(`# 条件创建的任务先创建为open，执行时判断是否abandoned`);
console.log('');

// 第1层：父任务
console.log('# ===== 第1层：父任务 =====');
console.log(`task create "T-WRITE-${N_RAW}: 写第${N_RAW}章「${chapterName}」" → T-WRITE-${N_RAW}`);
console.log('');

// 第2层：6个阶段任务
console.log('# ===== 第2层：阶段任务 =====');
console.log(`task create "T-CTX-${N_RAW}: 读取上下文"      parent=T-WRITE-${N_RAW} → T-CTX-${N_RAW}`);
console.log(`task create "T-PREP-${N_RAW}: 准备层"         parent=T-WRITE-${N_RAW} → T-PREP-${N_RAW}`);
console.log(`task create "T-WRITE-${N_RAW}-DRAFT: 正文写作" parent=T-WRITE-${N_RAW} → T-WRITE-${N_RAW}-DRAFT`);
console.log(`task create "T-COUNT-${N_RAW}: 字数验证"      parent=T-WRITE-${N_RAW} → T-COUNT-${N_RAW}`);
console.log(`task create "T-GATE-${N_RAW}: 质量门禁"       parent=T-WRITE-${N_RAW} → T-GATE-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}: 一致性检查"  parent=T-WRITE-${N_RAW} → T-CONSIST-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}: 追踪文件更新"  parent=T-WRITE-${N_RAW} → T-TRACK-${N_RAW}`);
console.log('');

// 第3层：上下文读取（15项）
console.log('# ===== 第3层-上下文：15项逐项读取 =====');
const ctxItems = [
  { id: '01', name: '读上一章正文',           note: '首章abandoned' },
  { id: '02', name: '读本章细纲',             note: 'BLOCK' },
  { id: '03', name: '读追踪/伏笔.md',         note: 'WARN' },
  { id: '04', name: '读设定/角色/{本章角色}.md', note: 'WARN' },
  { id: '05', name: '读对标拆文报告.md',      note: '无对标abandoned' },
  { id: '06', name: '读对标原文第N章',        note: '无对标abandoned' },
  { id: '07', name: '读参考资料/{topic}.md',  note: '无则abandoned' },
  { id: '08', name: '读追踪/角色状态.md',     note: 'WARN' },
  { id: '09', name: '读追踪/物品.md',         note: 'WARN' },
  { id: '10', name: '读追踪/环境.md',         note: 'WARN' },
  { id: '11', name: '读追踪/物资.md',         note: 'WARN' },
  { id: '12', name: '读对标剧情/故事线.md',   note: '无对标abandoned' },
  { id: '13', name: '读对标剧情/{相关线}.md', note: '无对标abandoned' },
  { id: '14', name: '读对标设定/世界观/*.md',  note: '无对标abandoned' },
  { id: '15', name: '读cross-chapter-fingerprint.md', note: '不存在abandoned' },
];

ctxItems.forEach(item => {
  console.log(`task create "T-CTX-${N_RAW}-${item.id}: ${item.name}" parent=T-CTX-${N_RAW} # ${item.note}`);
});
console.log('');

// 第3层：准备层（5个子任务）
console.log('# ===== 第3层-准备层：5个子任务 =====');
console.log(`task create "T-PREP-${N_RAW}-01: 状态筛选 — 从角色状态.md筛选本章角色+伏笔.md筛选待回收伏笔" parent=T-PREP-${N_RAW}`);
console.log(`task create "T-PREP-${N_RAW}-02: 文风召回 — 读{对标书路径}/文风.md" parent=T-PREP-${N_RAW}`);
console.log(`task create "T-PREP-${N_RAW}-03: 指令确认 — 一句话概括本章写作意图" parent=T-PREP-${N_RAW}`);
console.log(`task create "T-PREP-${N_RAW}-04: 性格锚点检查 — 读取角色性格锚点，确认不违背人设" parent=T-PREP-${N_RAW}`);
console.log(`task create "T-PREP-${N_RAW}-05: 质量约束注入 — 禁用词/AI腔/段落/对话/心理/比喻/节奏/留白/标点" parent=T-PREP-${N_RAW}`);
console.log('');

// 第3层：字数验证（2个子任务）
console.log('# ===== 第3层-字数验证：2个子任务 =====');
console.log(`task create "T-COUNT-${N_RAW}-01: Python字符统计 — 探测python3→python→py" parent=T-COUNT-${N_RAW}`);
console.log(`task create "T-COUNT-${N_RAW}-02: 判断是否≥细纲目标90%" parent=T-COUNT-${N_RAW}`);
console.log('');

// 第3层：质量门禁（6个任务）
console.log('# ===== 第3层-质量门禁：4检测+修正+复查 =====');
console.log(`task create "T-GATE-${N_RAW}-BAN: detect-banned-words — 禁用词扫描" parent=T-GATE-${N_RAW}`);
console.log(`task create "T-GATE-${N_RAW}-AI: detect-ai-sentence — AI腔扫描" parent=T-GATE-${N_RAW}`);
console.log(`task create "T-GATE-${N_RAW}-CON: detect-consistency — 一致性检查" parent=T-GATE-${N_RAW}`);
console.log(`task create "T-GATE-${N_RAW}-FORESH: detect-foreshadow — 伏笔检查" parent=T-GATE-${N_RAW}`);
console.log(`task create "T-GATE-${N_RAW}-FIX: 修正 — 任一BLOCK时start，全部通过abandoned" parent=T-GATE-${N_RAW}`);
console.log(`task create "T-GATE-${N_RAW}-RECHECK: 复查 — FIX完成后start，无FIX abandoned" parent=T-GATE-${N_RAW}`);
console.log('');

// 第3层：一致性检查（8个任务）
console.log('# ===== 第3层-一致性检查：6检测+修正+复查 =====');
console.log(`task create "T-CONSIST-${N_RAW}-ITEM: 物品位置一致性 — 物品.md与正文对照" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-CHAR: 角色状态一致性 — 角色状态.md与正文对照" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-ENV: 环境描述一致性 — 环境.md与正文对照" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-TIME: 时间线合理性 — 时间线.md事件时序检查" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-CROSS: 跨章节重复/矛盾 — 与前文交叉检查" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-VOICE: 角色声音一致性 — 角色对话风格检查" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-FIX: 一致性修正 — 任一不通过时start" parent=T-CONSIST-${N_RAW}`);
console.log(`task create "T-CONSIST-${N_RAW}-RECHECK: 一致性复查 — FIX完成后start" parent=T-CONSIST-${N_RAW}`);
console.log('');

// 第3层：追踪文件更新（7个子任务）
console.log('# ===== 第3层-追踪文件更新：7个子任务 =====');
console.log(`task create "T-TRACK-${N_RAW}-FORESH: 更新伏笔.md — 新增/回收伏笔+更新紧迫度" parent=T-TRACK-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}-TIME: 更新时间线.md — 记录事件时序+季节/时间" parent=T-TRACK-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}-CHAR: 更新角色状态.md — 身份/穿衣/身体/物品/关系+变更记录" parent=T-TRACK-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}-ITEM: 更新物品.md — 物品位置/状态变化+新物品" parent=T-TRACK-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}-ENV: 更新环境.md — 季节/天气/场景位置" parent=T-TRACK-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}-SUPPLY: 更新物资.md — 钱财/食物/工具" parent=T-TRACK-${N_RAW}`);
console.log(`task create "T-TRACK-${N_RAW}-CTX: 更新上下文.md — 进度摘要+质量记录" parent=T-TRACK-${N_RAW}`);
console.log('');

console.log(`# ===== 共51条任务创建完毕 =====`);
console.log(`# 下一步：运行 task-gate.js ${N_RAW} mark`);
