#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { BANNED_LEVEL1, BANNED_LEVEL2, DEGREE_ADVERBS, AI_PATTERNS } = require("./banned-words");

const USAGE = `Usage: node style-lint.js <chapter-file> [project-dir] [--json] [--full]

Check chapter for AI-style writing issues:
- Banned words (一级/二级)
- AI sentence patterns (不是A而是B, 带着X万能状语, 感到X涌上心头, etc.)
- Degree adverbs (非常/极其/十分 etc.)
- Paragraph/sentence length violations
- Dialogue tag overuse and ratio
- AI special punctuation (smart quotes, em dash, zero-width chars)
- Summary/sublimation endings
- Show-don't-tell (psychology verbs)
- Parallel structure overuse
- Heading format consistency
- Professional terminology consistency

Options:
  --json    Output structured JSON instead of human-readable text
  --full    Enable enhanced checks (heading format, professional terms, punctuation)

Exit code 0 = pass, 2 = issues found`;

const DIALOGUE_TAGS = ['说道', '问道', '答道', '喊道', '叫道', '笑道', '叹道', '回应道', '解释道', '回答道'];

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function countChineseChars(text) {
  const chinese = text.match(/[\u4e00-\u9fff]/g);
  return chinese ? chinese.length : 0;
}

/**
 * 检测禁用词（一级/二级）
 */
function checkBannedWords(text) {
  const results = [];
  const chineseCharCount = countChineseChars(text);
  for (const word of BANNED_LEVEL1) {
    const re = new RegExp(word, 'g');
    const matches = text.match(re);
    if (matches) {
      results.push({ word, level: 1, count: matches.length, density: (matches.length / Math.max(chineseCharCount, 1) * 1000).toFixed(1) });
    }
  }
  // 二级词汇：每千中文字 ≥3 次才报告（避免误报正常使用）
  for (const word of BANNED_LEVEL2) {
    const re = new RegExp(word, 'g');
    const matches = text.match(re);
    if (matches && matches.length >= 3) {
      const density = matches.length / Math.max(chineseCharCount, 1) * 1000;
      if (density >= 1.5) {
        results.push({ word, level: 2, count: matches.length, density: density.toFixed(1) });
      }
    }
  }
  return results;
}

/**
 * 检测 AI 句式（使用 banned-words.js 中的 AI_PATTERNS 正则列表）
 */
function checkAISentencePatterns(text) {
  const results = [];
  for (const { re, desc, level } of AI_PATTERNS) {
    const matches = text.match(re);
    if (matches) {
      results.push({ pattern: desc, level, count: matches.length, samples: matches.slice(0, 3) });
    }
  }
  return results;
}

/**
 * 检测程度副词（非常、极其、十分等）
 */
function checkDegreeAdverbs(text) {
  const results = [];
  const chineseCharCount = countChineseChars(text);
  for (const adv of DEGREE_ADVERBS) {
    const re = new RegExp(adv, 'g');
    const matches = text.match(re);
    if (matches) {
      results.push({ word: adv, count: matches.length });
    }
  }
  const total = results.reduce((s, r) => s + r.count, 0);
  const density = (total / Math.max(chineseCharCount, 1) * 1000).toFixed(1);
  return { items: results, total, density: parseFloat(density) };
}

/**
 * 检测段落长度违规
 */
function checkParagraphLength(text) {
  const issues = [];
  const paragraphs = text.split(/\n\s*\n/);
  let longParaCount = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (!para || para.startsWith('#') || para.startsWith('>')) continue;
    // 行数检查
    const lines = para.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 4) {
      longParaCount++;
      if (longParaCount <= 5) {
        issues.push({ index: i + 1, lines: lines.length, type: 'long_paragraph', detail: `第${i + 1}段共${lines.length}行（超过4行限制）` });
      }
    }
    // 字符数检查
    const charCount = para.replace(/\s/g, '').length;
    if (charCount > 60) {
      // 用句号/问号/感叹号/问号数判断是否超过 60 字
      const sentences = para.split(/[。！？\n]/).filter(s => s.trim().length > 0);
      for (let j = 0; j < sentences.length; j++) {
        const sentence = sentences[j].trim();
        if (sentence.length > 45) {
          issues.push({ index: i + 1, sentence: sentence.slice(0, 30) + '...', length: sentence.length, type: 'long_sentence', detail: `第${i + 1}段有${sentence.length}字句子（超过45字限制）："${sentence.slice(0, 20)}..."` });
        }
      }
    }
  }
  return { issues, longParaCount };
}

/**
 * 检测对话标签密度
 */
function checkDialogueUsage(text) {
  const issues = [];
  // 统计对话标签（说/道/问/答 等）
  let tagCount = 0;
  for (const tag of DIALOGUE_TAGS) {
    const re = new RegExp(tag, 'g');
    const matches = text.match(re);
    if (matches) tagCount += matches.length;
  }
  // 统计普通"说"（不含"说道"等组合）
  const plain说 = (text.match(/[^道喊叫答问叹笑]说[，。？！：;；]/g) || []).length;
  tagCount += plain说;

  // 统计对话句（含引号的行数）
  const dialogueLines = text.match(/[""「」].{2,30}[""」」]/g);
  const dialogueCount = dialogueLines ? dialogueLines.length : 0;

  if (dialogueCount > 0) {
    const ratio = tagCount / dialogueCount;
    if (ratio > 0.4) {
      issues.push({ type: 'dialogue_ratio', rate: (ratio * 100).toFixed(0) + '%', detail: `对话标签占比 ${(ratio * 100).toFixed(0)}%（超过40%），建议多用动作替代标签` });
    }
  }

  // 检查单个标签频率
  for (const tag of DIALOGUE_TAGS) {
    const re = new RegExp(tag, 'g');
    const matches = text.match(re);
    if (matches && matches.length > 5) {
      issues.push({ type: 'tag_overuse', tag, count: matches.length, detail: `"${tag}" 出现 ${matches.length} 次，建议减少使用` });
    }
  }

  return issues;
}

/**
 * 检测 AI 特殊标点
 */
function checkAIPunctuation(text) {
  const issues = [];
  // 印刷级可见标点（AI指纹）
  const aiPunct = /[\u2014\u2013\u201C\u201D\u2018\u2019\u2026\u00A0\u202F]/g;
  const punctMatches = text.match(aiPunct);
  if (punctMatches) {
    issues.push({ type: 'ai_punctuation', count: punctMatches.length, detail: `发现 ${punctMatches.length} 处AI特殊标点（智能引号/破折号/不换行空格等），建议替换为普通标点` });
  }
  // 不可见字符
  const invisible = /[\u200B\u200C\u200D\u2009\uFEFF\u00AD]/g;
  const invMatches = text.match(invisible);
  if (invMatches) {
    issues.push({ type: 'invisible_chars', count: invMatches.length, detail: `发现 ${invMatches.length} 处不可见Unicode字符（零宽空格/BOM等），必须清理` });
  }
  return issues;
}

/**
 * 检测结尾升华（最后一段是否有总结性/升华性语句）
 */
function checkEndingSublimation(text) {
  const issues = [];
  const paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length === 0) return issues;

  const lastPara = paragraphs[paragraphs.length - 1].trim();
  if (!lastPara) return issues;

  const sublimationPatterns = [
    /终于明白[^。！？]{2,}/, /这才意识到[^。！？]{2,}/,
    /这就是[^。！？]{2,}[。！]?$/, /这一刻[，,][^。！？]{5,}/,
    /他[她]知道[^，。！？]{5,}都[^。！？]{2,}/,
    /一切[^。！？]{5,}都[^。！？]{2,}[。！]?$/,
    /[^。！？]{5,}其实[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}不过[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}罢了[。！]?$/,
    /[^。！？]{5,}也许[^。！？]{5,}[。！]?$/,
    /或许[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}就是[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}所谓[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}而已[。！]?$/,
    /\d{1,2}岁的[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}长大了[。！]?$/,
    /[^。！？]{5,}成熟了[。！]?$/,
    /[^。！？]{5,}变了[。！]?$/,
    /[^。！？]{5,}不一样了[。！]?$/,
    /[^。！？]{5,}就是[^。！？]{5,}(吧|吗)[。！]?$/,
    /[^。！？]{5,}算了[。！]?$/,
    /[^。！？]{5,}就这样(吧|了)[。！]?$/,
    /[^。！？]{5,}也好[。！]?$/,
    /[^。！？]{5,}无所谓[。！]?$/,
    /[^。！？]{5,}大概[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}可能[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}也许[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}或许[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}说不定[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}说不清[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}不知道[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}哪一天[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}某一天[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}总有一天[^。！？]{5,}[。！]?$/,
    /[^。！？]{5,}也许有一天[^。！？]{5,}[。！]?$/,
  ];

  for (const pattern of sublimationPatterns) {
    if (pattern.test(lastPara)) {
      issues.push({ type: 'ending_sublimation', detail: '结尾段含升华/总结句式，建议用动作/对话/场景收尾' });
      break;
    }
  }
  return issues;
}

/**
 * 检测 Show Don't Tell 违规（心理直述动词）
 * 根据《去AI味完全指南》全面扩展检测模式
 */
function checkShowDontTell(text) {
  const issues = [];
  const chineseCharCount = countChineseChars(text);

  // 心理直述模式分类（按AI味浓度从高到低）
  const tellPatterns = [
    // === 一级：强心理直述（浓度最高） ===
    { re: /[他她]感到[^。！？]{3,}/g, desc: '"他/她感到X"心理直述' },
    { re: /[他她]感受到[^。！？]{3,}/g, desc: '"他/她感受到X"心理直述' },
    { re: /[他她]觉得[^。！？]{3,}/g, desc: '"他/她觉得X"心理直述' },
    { re: /[他她]心中[一涌泛冒][^。！？]{2,}/g, desc: '"心中涌起X"心理直述' },
    { re: /[他她]心头[一涌泛冒][^。！？]{2,}/g, desc: '"心头涌起X"心理直述' },
    { re: /[他她]内心[^。！？]{3,}/g, desc: '"内心X"心理直述' },
    { re: /[他她]脑海[^。！？]{2,}浮现/g, desc: '"脑海浮现X"心理直述' },

    // === 二级：认知直述 ===
    { re: /[他她]意识到[^。！？]{3,}/g, desc: '"意识到X"认知直述' },
    { re: /[他她]明白[^。！？]{3,}[。！]/g, desc: '"明白X"认知直述' },
    { re: /[他她]清楚[^。！？]{3,}[。！]/g, desc: '"清楚X"认知直述' },
    { re: /[他她]知道[^。！？]{3,}[。！]/g, desc: '"知道X"认知直述（非对话）' },

    // === 三级：心理状态直述 ===
    { re: /[他她]心里[^。！？]{3,}/g, desc: '"心里X"心理状态直述' },
    { re: /[他她]心中[^，。！？]{3,}[。！]/g, desc: '"心中X"心理状态直述' },
    { re: /[他她]在心底[^。！？]{3,}/g, desc: '"在心底X"心理深层直述' },
    { re: /[他她]打心底[^。！？]{3,}/g, desc: '"打心底X"心理直述' },
    { re: /[他她]从心底[^。！？]{3,}/g, desc: '"从心底X"心理直述' },

    // === 四级：AI心理过渡 ===
    { re: /[他她][^。！？]{2,}不禁[^。！？]{2,}/g, desc: '"不禁X" AI心理过渡' },
    { re: /[他她]不由得[^。！？]{3,}/g, desc: '"不由得X" AI心理过渡' },
    { re: /(暗自|暗暗)[^。！？]{3,}/g, desc: '"暗自/暗暗X"心理动作' },
    { re: /[他她]忍不住[^。！？]{3,}/g, desc: '"忍不住X"心理控制' },

    // === 五级：弱心理直述 ===
    { re: /[他她]心下[^。！？]{3,}/g, desc: '"心下X"心理直述' },
    { re: /[他她]心知[^。！？]{3,}/g, desc: '"心知X"心理直述' },
    { re: /[他她]心想[：,][^。！？]{3,}/g, desc: '"心想X"心理直述' },
    { re: /[他她]心说[：,][^。！？]{3,}/g, desc: '"心说X"心理直述' },
    { re: /[他她]心道[：,][^。！？]{3,}/g, desc: '"心道X"心理直述' },
    { re: /[他她]心念[^。！？]{3,}/g, desc: '"心念X"心理直述' },
    { re: /[他她]心底[^。！？]{3,}[。！]/g, desc: '"心底X"心理直述' },
  ];

  let totalHits = 0;

  for (const { re, desc } of tellPatterns) {
    const matches = text.match(re);
    if (matches) {
      totalHits += matches.length;
      issues.push({ type: 'show_dont_tell', count: matches.length, detail: `${desc}（${matches.length}处）` });
    }
  }

  // 计算心理密度（每千中文字的心理直述次数）
  const density = chineseCharCount > 0 ? (totalHits / chineseCharCount * 1000).toFixed(1) : '0';

  let severity = '轻度';
  let severityLevel = 2; // default warning
  if (totalHits >= 5) {
    const densityVal = parseFloat(density);
    if (densityVal >= 10 || totalHits >= 10) {
      severity = '重度';
      severityLevel = 1; // blocker
    } else if (densityVal >= 5 || totalHits >= 5) {
      severity = '中度';
      severityLevel = 1; // blocker
    }
  }

  // 添加密度汇总
  if (totalHits > 0) {
    issues.push({
      type: 'psychology_density',
      level: severityLevel,
      totalHits,
      density,
      severity,
      detail: `心理直述密度：${density}/千字（${totalHits}处，${severity}），建议用动作替代心理描写`
    });
  }

  return { issues, totalHits, density, severity };
}

/**
 * 检测排比句式（通用版，不限于"是"开头）
 */
function checkParallelStructures(text) {
  const issues = [];
  const lines = text.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('#') && !l.trim().startsWith('>'));

  // 检测连续3行以上相同句式结构（前3个字符相同且包含逗号）
  let parallelCount = 0;
  let parallelStart = 0;
  let parallelLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 跳过对话和空行
    if (line.startsWith('"') || line.startsWith('"') || line.startsWith('「') || line.startsWith('『')) {
      if (parallelCount >= 3) {
        issues.push({ type: 'parallel_structure', count: parallelCount, detail: `第${parallelStart}-${parallelStart + parallelCount}行：连续${parallelCount}个排比结构，建议精简` });
      }
      parallelCount = 0;
      parallelLines = [];
      continue;
    }
    // 检测 "是X" 排比
    if (line.startsWith('是') && line.includes('，') && line.includes('是')) {
      if (parallelCount === 0) parallelStart = i + 1;
      parallelCount++;
      parallelLines.push(line);
    } else {
      if (parallelCount >= 3) {
        issues.push({ type: 'parallel_structure', count: parallelCount, detail: `第${parallelStart}-${parallelStart + parallelCount}行：连续${parallelCount}个"是X"排比结构，建议精简` });
      }
      parallelCount = 0;
      parallelLines = [];
    }
  }
  // 末尾检查
  if (parallelCount >= 3) {
    issues.push({ type: 'parallel_structure', count: parallelCount, detail: `第${parallelStart}行起：连续${parallelCount}个排比结构，建议精简` });
  }

  // 检测"有的...有的...有的..."句式
  const somePattern = /有的[^，。！？]{2,}[，,]\s*有的/g;
  const someMatches = text.match(somePattern);
  if (someMatches && someMatches.length >= 2) {
    issues.push({ type: 'parallel_structure', count: someMatches.length, detail: `"有的...有的..."句式出现${someMatches.length}处，建议精简` });
  }

  // 检测"一边...一边...一边..."句式
  const sidePattern = /一边[^，。！？]{2,}[，,]\s*一边/g;
  const sideMatches = text.match(sidePattern);
  if (sideMatches && sideMatches.length >= 2) {
    issues.push({ type: 'parallel_structure', count: sideMatches.length, detail: `"一边...一边..."句式出现${sideMatches.length}处，建议精简` });
  }

  // 检测AI三连排比（三个一组的结构）
  const triplePattern = /[，,][^，。！？]{2,}[，,][^，。！？]{2,}[，,][^，。！？]{2,}[，,]/g;
  const tripleMatches = text.match(triplePattern);
  if (tripleMatches && tripleMatches.length > 1) {
    issues.push({ type: 'ai_triple_parallel', count: tripleMatches.length, detail: `AI三连排比句式出现${tripleMatches.length}处，建议打破` });
  }

  return issues;
}

/**
 * 检测对话标签（传统方式）
 */
function checkDialogueTags(text) {
  const issues = [];
  for (const tag of DIALOGUE_TAGS) {
    const re = new RegExp(tag, 'g');
    const matches = text.match(re);
    if (matches && matches.length > 5) {
      issues.push({ type: 'dialogue_tag', tag, count: matches.length, detail: `"${tag}" 出现 ${matches.length} 次，建议减少对话标签，用动作替代` });
    }
  }
  return issues;
}

/**
 * 检测 AI 基础模式（保留向后兼容）
 */
function checkAIBasePatterns(text) {
  const issues = [];
  const patterns = [
    { re: /([。！？])\1{2,}/g, desc: '连续3个以上相同句末标点', warnAt: 1 },
    { re: /(?:事实上|实际上|说实话|老实说)[，,]/g, desc: '过度使用过渡词', warnAt: 2 },
  ];
  for (const { re, desc, warnAt } of patterns) {
    const matches = text.match(re);
    if (matches && matches.length >= warnAt) {
      issues.push({ type: 'ai_base_pattern', count: matches.length, detail: `${desc}（出现 ${matches.length} 次）` });
    }
  }
  return issues;
}

function checkHeadingFormat(text, filename) {
  const issues = [];
  const h1Matches = text.match(/^# [^\n]+/gm);
  const h2Matches = text.match(/^## [^\n]+/gm);
  if (h1Matches && h1Matches.length > 0 && h2Matches && h2Matches.length > 0) {
    issues.push({ type: 'heading_format', detail: `标题格式不统一：同时使用 # 和 ##（# ${h1Matches.length}处，## ${h2Matches.length}处）` });
  }
  const filenameMatch = filename.match(/第(\d+)章[_-](.+)\.md/);
  if (filenameMatch) {
    const chapterNum = filenameMatch[1];
    const titleInFile = h1Matches ? h1Matches[0] : (h2Matches ? h2Matches[0] : '');
    if (titleInFile && !titleInFile.includes(chapterNum)) {
      issues.push({ type: 'heading_format', detail: `文件名中的章节号(${chapterNum})与内部标题不一致` });
    }
  }
  return issues;
}

function checkProfessionalTerms(text, charFile) {
  const issues = [];
  if (!charFile) return issues;
  const professionMatch = charFile.match(/身份[：:]\s*(.+?博士)/);
  if (!professionMatch) return issues;
  const profession = professionMatch[1];
  if (profession.includes('天文学')) {
    const invalidTerms = [
      { term: /军事动员能力/g, issue: '天文学博士不应使用"军事动员能力"术语' },
      { term: /后勤保障体系/g, issue: '天文学博士不应使用"后勤保障体系"术语' },
      { term: /排兵布阵/g, issue: '天文学博士不应使用"排兵布阵"术语' },
      { term: /战术分析/g, issue: '天文学博士不应使用"战术分析"术语' },
    ];
    for (const { term, issue } of invalidTerms) {
      const matches = text.match(term);
      if (matches && matches.length > 0) {
        issues.push({ type: 'professional_term', detail: issue });
      }
    }
  }
  return issues;
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const fullMode = args.includes('--full');
  const filteredArgs = args.filter(a => a !== '--json' && a !== '--full');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  const projectDir = filteredArgs[1] ? path.resolve(filteredArgs[1]) : path.resolve(path.dirname(chapterFile), '..');

  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const text = readFile(chapterFile);
  if (!text) {
    console.error(`Error: Cannot read file: ${chapterFile}`);
    process.exit(2);
  }

  const chineseCharCount = countChineseChars(text);

  // ====== 全部检测 ======
  const banned = checkBannedWords(text);
  const aiSentencePatterns = checkAISentencePatterns(text);
  const degreeAdverbs = checkDegreeAdverbs(text);
  const paraIssues = checkParagraphLength(text);
  const dialogueUsage = checkDialogueUsage(text);
  const aiPunct = checkAIPunctuation(text);
  const endingIssues = checkEndingSublimation(text);
  const showTell = checkShowDontTell(text);
  const parallelIssues = checkParallelStructures(text);
  const dialogueTagIssues = checkDialogueTags(text);
  const aiBaseIssues = checkAIBasePatterns(text);

  // ====== 汇总结果 ======
  const issues = [];

  // 禁用词
  for (const b of banned) {
    issues.push({ type: 'banned_word', level: b.level, word: b.word, count: b.count, message: `"${b.word}" 出现 ${b.count} 次（密度 ${b.density}/千字）` });
  }

  // AI句式
  for (const p of aiSentencePatterns) {
    issues.push({ type: 'ai_sentence_pattern', level: p.level, pattern: p.pattern, count: p.count, message: `"${p.pattern}" 出现 ${p.count} 次` });
  }

  // 程度副词
  if (degreeAdverbs.total > 0) {
    const minLevel = degreeAdverbs.density >= 3 ? 1 : 2;
    issues.push({ type: 'degree_adverb', level: minLevel, total: degreeAdverbs.total, density: degreeAdverbs.density, message: `程度副词共 ${degreeAdverbs.total} 处（密度 ${degreeAdverbs.density}/千字）` });
  }

  // 段落/句子长度
  for (const pi of paraIssues.issues) {
    const level = pi.type === 'long_paragraph' ? 2 : 1;
    issues.push({ type: pi.type, level, message: pi.detail });
  }

  // 对话标签
  for (const d of dialogueUsage) {
    issues.push({ type: d.type, level: d.type === 'dialogue_ratio' ? 1 : 2, message: d.detail });
  }
  for (const d of dialogueTagIssues) {
    issues.push({ type: d.type, level: 2, message: d.detail });
  }

  // AI标点
  for (const p of aiPunct) {
    issues.push({ type: p.type, level: p.type === 'invisible_chars' ? 1 : 2, message: p.detail });
  }

  // 结尾升华
  for (const e of endingIssues) {
    issues.push({ type: e.type, level: 1, message: e.detail });
  }

  // Show Don't Tell
  if (showTell.totalHits > 0) {
    for (const st of showTell.issues) {
      // 新 checkShowDontTell 已内置 level 计算（psychology_density 类型有 level）
      // show_dont_tell 类型的 level 由密度决定
      const level = st.type === 'psychology_density' ? st.level : (showTell.severity === '重度' || showTell.severity === '中度' ? 1 : 2);
      issues.push({ type: st.type, level, message: st.detail });
    }
  }

  // 排比
  for (const p of parallelIssues) {
    issues.push({ type: p.type, level: 1, message: p.detail });
  }

  // AI基础模式
  for (const a of aiBaseIssues) {
    issues.push({ type: a.type, level: 2, message: a.detail });
  }

  // 增强检查（--full 模式）
  if (fullMode) {
    const headingIssues = checkHeadingFormat(text, path.basename(chapterFile));
    for (const h of headingIssues) {
      issues.push({ type: h.type, level: 1, message: h.detail });
    }
    const charFile = readFile(path.join(projectDir, '追踪', '角色状态.md'));
    const termIssues = checkProfessionalTerms(text, charFile);
    for (const t of termIssues) {
      issues.push({ type: t.type, level: 1, message: t.detail });
    }
  }

  const level1Count = issues.filter(i => i.level === 1).length;
  const level2Count = issues.filter(i => i.level === 2).length;

  // ====== JSON 输出 ======
  if (jsonMode) {
    const result = {
      status: issues.length === 0 ? 'pass' : 'fail',
      file: chapterFile,
      chinese_char_count: chineseCharCount,
      summary: { level1: level1Count, level2: level2Count, total: issues.length },
      details: {
        banned_words: banned,
        ai_sentence_patterns: aiSentencePatterns,
        degree_adverbs: degreeAdverbs,
        paragraph_issues: paraIssues,
        dialogue_usage: dialogueUsage,
        ai_punctuation: aiPunct,
        ending_sublimation: endingIssues,
        show_dont_tell: showTell,
        parallel_structures: parallelIssues,
      },
      issues,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(level1Count > 0 ? 2 : (issues.length > 0 ? 1 : 0));
  }

  // ====== 人类可读输出 ======
  console.log(`📊 文风检测报告 — ${path.basename(chapterFile)}`);
  console.log(`   中文字数：${chineseCharCount}`);
  console.log('='.repeat(50));

  if (banned.length > 0) {
    console.log('\n🚫 禁用词：');
    for (const b of banned) {
      const label = b.level === 1 ? '一级(必改)' : '二级(建议改)';
      console.log(`  [${label}] "${b.word}" ×${b.count} (${b.density}/千字)`);
    }
  }

  if (aiSentencePatterns.length > 0) {
    console.log('\n🤖 AI句式：');
    for (const p of aiSentencePatterns) {
      const label = p.level === 1 ? '🔴 阻断' : '🟡 警告';
      console.log(`  ${label} "${p.pattern}" ×${p.count}`);
      for (const s of p.samples) {
        console.log(`    例: "${s.slice(0, 40)}..."`);
      }
    }
  }

  if (degreeAdverbs.total > 0) {
    console.log(`\n📏 程度副词：共 ${degreeAdverbs.total} 处（${degreeAdverbs.density}/千字）`);
    for (const adv of degreeAdverbs.items) {
      console.log(`  "${adv.word}" ×${adv.count}`);
    }
  }

  if (paraIssues.issues.length > 0) {
    console.log(`\n📐 段落/句子：共 ${paraIssues.issues.length} 个问题`);
    for (const pi of paraIssues.issues.slice(0, 8)) {
      console.log(`  ⚠️  ${pi.detail}`);
    }
    if (paraIssues.issues.length > 8) {
      console.log(`  ... 还有 ${paraIssues.issues.length - 8} 个`);
    }
  }

  if (dialogueUsage.length > 0) {
    console.log('\n💬 对话：');
    for (const d of dialogueUsage) {
      console.log(`  ⚠️  ${d.detail}`);
    }
  }

  if (aiPunct.length > 0) {
    console.log('\n🔣 标点：');
    for (const p of aiPunct) {
      const label = p.type === 'invisible_chars' ? '🔴' : '🟡';
      console.log(`  ${label} ${p.detail}`);
    }
  }

  if (endingIssues.length > 0) {
    console.log('\n🔚 结尾：');
    for (const e of endingIssues) {
      console.log(`  🔴 ${e.detail}`);
    }
  }

  if (showTell.totalHits > 0) {
    console.log(`\n📖 Show Don't Tell：共 ${showTell.totalHits} 处心理直述`);
    for (const st of showTell.issues) {
      console.log(`  ⚠️  ${st.detail}`);
    }
  }

  if (parallelIssues.length > 0) {
    console.log('\n📝 排比结构：');
    for (const p of parallelIssues) {
      console.log(`  ⚠️  ${p.detail}`);
    }
  }

  if (fullMode) {
    const headingIssuesGlobal = issues.filter(i => i.type === 'heading_format');
    if (headingIssuesGlobal.length > 0) {
      console.log('\n📐 标题格式：');
      headingIssuesGlobal.forEach(h => console.log(`  ⚠️  ${h.message}`));
    }
    const termIssuesGlobal = issues.filter(i => i.type === 'professional_term');
    if (termIssuesGlobal.length > 0) {
      console.log('\n🎓 专业术语：');
      termIssuesGlobal.forEach(t => console.log(`  ⚠️  ${t.message}`));
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`总计：${level1Count} 个阻断问题，${level2Count} 个警告问题`);

  if (issues.length === 0) {
    console.log('✅ 文风检查通过');
    process.exit(0);
  }

  if (level1Count > 0) {
    console.log(`❌ 发现 ${level1Count} 个一级问题，必须修改`);
    process.exit(2);
  }

  if (level2Count > 0) {
    console.log(`⚠️  发现 ${level2Count} 个二级问题，建议修改`);
    process.exit(1);
  }

  process.exit(0);
}

main();