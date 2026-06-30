#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node writing-scorer.js <chapter-file> [project-dir] [--genre NAME] [--json] [--strict] [--relaxed]

百分制写作评分脚本。读取章节和题材模板，输出 LLM 评审任务。

Options:
  --genre NAME    题材模板名称（默认: default）
  --json          输出结构化 JSON
  --strict        严格模式，通过阈值 90（默认）
  --relaxed       宽松模式，通过阈值 80

Exit codes:
  0 = 评分 >= 阈值
  1 = 评分 < 阈值
  2 = 错误（模板不存在/文件读取失败等）`;

const templatesDir = path.join(__dirname, '..', 'references', 'score-templates');

function loadTemplate(genre) {
  const filePath = path.join(templatesDir, `${genre}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getGenreFromProject(projectDir) {
  const trackingDir = path.join(projectDir, '追踪');
  if (!fs.existsSync(trackingDir)) return 'default';
  const contextFile = path.join(trackingDir, '上下文.md');
  if (!fs.existsSync(contextFile)) return 'default';

  const content = fs.readFileSync(contextFile, 'utf-8');
  const genreMatch = content.match(/题材[：:]\s*(\S+)/);
  if (genreMatch) {
    const genreMap = {
      '玄幻': 'xuanhuan', '仙侠': 'xianxia', '都市': 'dushi',
      '悬疑': 'xuanyi', '言情': 'yanqing', '历史': 'lishi',
      '科幻': 'kehuan', '末世': 'moshi', '重生': 'chongsheng',
      '穿越': 'chuanyue', '系统': 'xitong', '无限流': 'wuxianliu',
      '宫斗': 'gongdou', '宅斗': 'gongdou', '短篇': 'duanpian',
    };
    const chinese = genreMatch[1];
    for (const [key, val] of Object.entries(genreMap)) {
      if (chinese.includes(key)) return val;
    }
  }
  return 'default';
}

function buildEvaluationPrompt(chapterText, template, chapterName) {
  const dimensions = template.dimensions;
  const dimList = Object.entries(dimensions)
    .map(([name, cfg]) => `- ${name}（${cfg.weight}分）：重点考察 ${cfg.focus.join('、')}`)
    .join('\n');

  return `你是一位专业的网络小说评审。请对以下章节进行百分制评分。

## 评审对象
章节：${chapterName}
题材：${template.name}

## 评分维度（共15个，总分100）
${dimList}

## 评分规则
1. 每个维度按满分值打分（如"开场吸引力"满分8分，则打0-8分）
2. 评分必须严格按评判标准，不得虚高
3. 总分 = 各维度得分之和
4. 通过阈值：${template.threshold}分

## 每个维度的评判要点

### 开场吸引力
- 开篇3段内是否建立钩子（悬念/冲突/反常/问题）
- 是否通过生活小事/经验引入增加亲和力
- 开头是否简洁明了，避免冗长铺垫
- 是否引入戏剧化转折增加阅读趣味

### 情感深度
- 是否有细腻的情感描写展现角色内心变化
- 情感描写是否引发读者共鸣与代入感
- 情感变化是否自然（有铺垫有转折有高潮）
- 情感是否层次分明

### 叙述结构
- 文章是否逐步推进引导读者深入思考
- 结构是否紧凑连贯无跑题或赘余
- 观点/情节是否有层次感地展开
- 段落间逻辑关系是否清晰

### 语言生动性
- 是否运用生动的视觉语言将抽象概念具象化
- 语言是否通俗易懂贴近读者
- 表达是否人性化
- 叙述手法是否多样化

### 细节描写
- 是否通过细节让读者代入情境
- 细节是否生动具体
- 场景描写是否有画面感
- 细节是否服务于情节推进

### 过渡连贯
- 段落间过渡是否自然避免生硬
- 是否有适当停顿给予读者思考空间
- 叙述流畅性是否自然顺畅
- 叙述节奏是否紧凑不拖沓

### 逻辑清晰
- 文章逻辑是否清晰观点是否有说服力
- 是否深入剖析问题本质
- 核心观点是否逐步揭示
- 立场是否鲜明

### 对比反差
- 是否通过对比突出主题和情感冲突
- 反差是否增强吸引力
- 对比是否让内容更具冲击力

### 情感张力
- 是否有适当的情感张力
- 是否逐步引导至情感高潮
- 情感高潮是否有冲击力
- 情感积累是否自然

### 人性化亲和
- 表达方式是否人性化拉近距离
- 是否引发读者共鸣
- 是否贴近生活表达
- 是否通过故事性引发兴趣

### 视觉感官
- 是否运用视觉语言将抽象具象化
- 是否运用感官细节增加真实感
- 是否多感官描写丰富场景
- 情景描写是否让读者仿佛置身其中

### 节奏流畅
- 叙述节奏是否紧凑不拖沓
- 句子长短变化是否有节奏感
- 流畅性是否自然
- 是否根据情节需要调整叙述速度

### 逻辑连贯
- 情节推进是否自然连贯
- 时间线是否清晰明确
- 事件因果关系是否合理
- 整体逻辑是否自洽

### 细节具体化
- 是否通过具体例子或比喻让抽象概念易懂
- 细节是否推动情节发展
- 细节揭示是否保持悬念

### 情感爆发力
- 情感积累是否自然
- 高潮时情感爆发是否有力
- 爆发后是否有余韵
- 是否有记忆点

## 待评审章节正文

${chapterText}

## 输出格式（严格JSON）

请严格按以下JSON格式输出，不要包含任何其他文字：

\`\`\`json
{
  "score": 总分,
  "dimensions": {
    "开场吸引力": { "score": 得分, "comment": "一句话评价" },
    "情感深度": { "score": 得分, "comment": "一句话评价" },
    "叙述结构": { "score": 得分, "comment": "一句话评价" },
    "语言生动性": { "score": 得分, "comment": "一句话评价" },
    "细节描写": { "score": 得分, "comment": "一句话评价" },
    "过渡连贯": { "score": 得分, "comment": "一句话评价" },
    "逻辑清晰": { "score": 得分, "comment": "一句话评价" },
    "对比反差": { "score": 得分, "comment": "一句话评价" },
    "情感张力": { "score": 得分, "comment": "一句话评价" },
    "人性化亲和": { "score": 得分, "comment": "一句话评价" },
    "视觉感官": { "score": 得分, "comment": "一句话评价" },
    "节奏流畅": { "score": 得分, "comment": "一句话评价" },
    "逻辑连贯": { "score": 得分, "comment": "一句话评价" },
    "细节具体化": { "score": 得分, "comment": "一句话评价" },
    "情感爆发力": { "score": 得分, "comment": "一句话评价" }
  },
  "weak_dims": ["低分维度名称列表（score < 满分60%的维度）"],
  "suggestions": ["针对低分维度的具体改进建议，每条建议对应一个低分维度"]
}
\`\`\``;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  let genre = 'default';
  let jsonMode = false;
  let threshold = 90;
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--genre' && args[i + 1]) {
      genre = args[i + 1]; i++;
    } else if (args[i] === '--json') {
      jsonMode = true;
    } else if (args[i] === '--strict') {
      threshold = 90;
    } else if (args[i] === '--relaxed') {
      threshold = 80;
    } else if (!args[i].startsWith('--')) {
      positional.push(args[i]);
    }
  }

  const chapterFile = positional[0];
  const projectDir = positional[1] || path.dirname(chapterFile);

  if (!chapterFile) {
    console.error('Error: chapter file required');
    process.exit(2);
  }

  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: file not found: ${chapterFile}`);
    process.exit(2);
  }

  // Auto-detect genre from project if not specified
  if (genre === 'default' && projectDir) {
    genre = getGenreFromProject(projectDir);
  }

  const template = loadTemplate(genre);
  if (!template) {
    console.error(`Error: genre template not found: ${genre}`);
    process.exit(2);
  }

  const chapterText = fs.readFileSync(chapterFile, 'utf-8');
  const chapterName = path.basename(chapterFile, '.md');
  const prompt = buildEvaluationPrompt(chapterText, template, chapterName);

  if (jsonMode) {
    console.log(JSON.stringify({
      status: 'ready',
      genre: genre,
      threshold: threshold,
      template_name: template.name,
      prompt: prompt,
      dimensions: Object.entries(template.dimensions).map(([name, cfg]) => ({
        name,
        weight: cfg.weight,
        focus: cfg.focus,
      })),
    }, null, 2));
  } else {
    console.log(prompt);
  }

  process.exit(0);
}

main();
