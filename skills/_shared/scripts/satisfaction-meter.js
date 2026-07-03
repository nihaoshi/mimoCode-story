#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node satisfaction-meter.js <chapter-file> [--json]

Measure satisfaction point density in a chapter.

Metrics:
- Satisfaction point count and positions
- Gap between satisfaction points (words)
- Pressure-release ratio
- Peak satisfaction position (%)

Options:
  --json    Output structured JSON
  --target-gap N  Target gap between satisfaction points (default: 3000)

Exit code 0 = pass, 2 = low density warning`;

const SATISFACTION_SIGNALS = {
  strong: { words: ['打脸', '反杀', '逆袭', '翻身', '扬眉吐气', '一鸣惊人', '全场沸腾', '掌声雷动', '刮目相看', '跪下', '求饶', '后悔莫及', '肠子悔青', '众人震惊', '目瞪口呆', '瞠目结舌', '大快人心', '痛快', '爽', '太帅了', '牛逼', '厉害了'], weight: 5 },
  medium: { words: ['惊讶', '吃惊', '没想到', '出乎意料', '意想不到', '不敢相信', '难以置信', '惊呆', '傻眼', '愣住', '震惊', '意外', '突破', '成功', '赢了', '胜利', '冠军', '第一', '最强', '天才'], weight: 3 },
  mild: { words: ['认可', '赞同', '点头', '微笑', '满意', '放心', '安心', '欣慰', '骄傲', '自豪', '佩服', '赞叹', '夸赞', '表扬', '奖励', '提拔', '升级', '进步'], weight: 2 },
};

const PRESSURE_SIGNALS = {
  strong: { words: ['侮辱', '欺负', '羞辱', '嘲笑', '讽刺', '挖苦', '鄙视', '蔑视', '看不起', '不配', '废物', '垃圾', '滚', '配吗', '你也配', '做梦', '痴心妄想'], weight: 5 },
  medium: { words: ['困难', '挫折', '失败', '打击', '危机', '危险', '绝境', '困境', '艰难', '痛苦', '委屈', '冤枉', '误解', '陷害', '阴谋', '暗算'], weight: 3 },
  mild: { words: ['担心', '焦虑', '紧张', '不安', '犹豫', '纠结', '迷茫', '困惑', '压力', '挑战', '考验', '竞争'], weight: 2 },
};

function countWords(text) {
  return text.replace(/\s+/g, '').length;
}

function analyzeChapter(text) {
  const paragraphs = text.split(/\r?\n/).filter(p => p.trim().length > 10);
  const totalWords = countWords(text);
  const satisfactionPoints = [];
  const pressureSegments = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    let satScore = 0;
    let pressScore = 0;

    for (const [level, config] of Object.entries(SATISFACTION_SIGNALS)) {
      for (const word of config.words) {
        if (para.includes(word)) satScore += config.weight;
      }
    }

    for (const [level, config] of Object.entries(PRESSURE_SIGNALS)) {
      for (const word of config.words) {
        if (para.includes(word)) pressScore += config.weight;
      }
    }

    if (satScore >= 3) {
      satisfactionPoints.push({
        paragraph: i + 1,
        score: satScore,
        preview: para.substring(0, 40),
        position_pct: Math.round((countWords(paragraphs.slice(0, i + 1).join('')) / totalWords) * 100),
      });
    }

    if (pressScore >= 3) {
      pressureSegments.push({
        paragraph: i + 1,
        score: pressScore,
      });
    }
  }

  return { paragraphs, totalWords, satisfactionPoints, pressureSegments };
}

function calculateMetrics(analysis) {
  const { totalWords, satisfactionPoints, pressureSegments } = analysis;

  const gaps = [];
  for (let i = 1; i < satisfactionPoints.length; i++) {
    const prevWords = countWords(analysis.paragraphs.slice(0, satisfactionPoints[i - 1].paragraph).join(''));
    const currWords = countWords(analysis.paragraphs.slice(0, satisfactionPoints[i].paragraph).join(''));
    gaps.push(currWords - prevWords);
  }

  const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : totalWords;
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : totalWords;

  const pressureWords = pressureSegments.reduce((s, p) => s + countWords(analysis.paragraphs[p.paragraph - 1]), 0);
  const releaseWords = satisfactionPoints.reduce((s, p) => s + countWords(analysis.paragraphs[p.paragraph - 1]), 0);
  const pressureReleaseRatio = releaseWords > 0 ? Math.round(pressureWords / releaseWords * 10) / 10 : 0;

  const peakPoint = satisfactionPoints.length > 0
    ? satisfactionPoints.reduce((max, p) => p.score > max.score ? p : max, satisfactionPoints[0])
    : null;

  return {
    total_satisfaction_points: satisfactionPoints.length,
    density: totalWords > 0 ? Math.round(totalWords / Math.max(1, satisfactionPoints.length)) : 0,
    avg_gap: avgGap,
    max_gap: maxGap,
    pressure_release_ratio: pressureReleaseRatio,
    peak_position_pct: peakPoint ? peakPoint.position_pct : null,
  };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const filteredArgs = args.filter(a => a !== '--json');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  const targetGap = filteredArgs.includes('--target-gap')
    ? parseInt(filteredArgs[filteredArgs.indexOf('--target-gap') + 1], 10)
    : 3000;

  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const text = fs.readFileSync(chapterFile, 'utf-8');
  const analysis = analyzeChapter(text);
  const metrics = calculateMetrics(analysis);

  const densityOk = metrics.density <= targetGap;
  const status = densityOk ? 'pass' : 'fail';

  if (jsonMode) {
    const result = {
      status,
      file: chapterFile,
      summary: {
        total_words: analysis.totalWords,
        satisfaction_points: metrics.total_satisfaction_points,
        density_words_per_point: metrics.density,
        max_gap: metrics.max_gap,
        pressure_release_ratio: metrics.pressure_release_ratio,
      },
      metrics,
      points: analysis.satisfactionPoints,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(densityOk ? 0 : 1);
  }

  console.log('🎯 爽点密度分析');
  console.log('='.repeat(50));
  console.log(`总字数：${analysis.totalWords}  爽点数：${metrics.total_satisfaction_points}`);
  console.log(`密度：每 ${metrics.density} 字一个爽点  目标：每 ${targetGap} 字`);
  console.log(`最大间距：${metrics.max_gap} 字  压制-释放比：${metrics.pressure_release_ratio}`);

  if (analysis.satisfactionPoints.length > 0) {
    console.log('\n📍 爽点位置：');
    analysis.satisfactionPoints.forEach(p => console.log(`  第${p.paragraph}段：得分 ${p.score}，位置 ${p.position_pct}%`));
  }

  if (!densityOk) {
    console.log(`\n🚫 爽点间距超过目标（${metrics.max_gap} > ${targetGap}），必须增加爽点`);
    process.exit(2);
  }

  console.log('\n✅ 爽点密度达标');
  process.exit(0);
}

main();
