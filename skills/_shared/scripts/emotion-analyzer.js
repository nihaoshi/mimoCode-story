#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node emotion-analyzer.js <chapter-file> [--json]

Analyze emotion curve of a chapter using keyword-based detection.

Output:
- Emotion intensity per paragraph (1-10 scale)
- Peak paragraph identification
- Flat region warnings (3+ consecutive similar intensity)
- Satisfaction point detection

Options:
  --json    Output structured JSON
  --verbose Include all paragraph details

Exit code 0 = pass, 2 = flat warning detected`;

const EMOTION_KEYWORDS = {
  tension: { words: ['紧张', '担心', '担忧', '害怕', '恐惧', '不安', '焦虑', '着急', '急切', '慌', '惊恐', '惊慌', '心惊', '胆战', '毛骨悚然', '不寒而栗'], weight: 3 },
  anger: { words: ['愤怒', '怒', '气', '恼', '恨', '咬牙', '握拳', '瞪', '怒吼', '咆哮', '暴怒', '火冒三丈', '怒不可遏', '义愤填膺'], weight: 4 },
  sadness: { words: ['悲伤', '难过', '伤心', '痛苦', '心痛', '泪', '哭', '泣', '哽咽', '悲痛', '哀伤', '凄凉', '心酸', '苦涩', '黯然'], weight: 3 },
  joy: { words: ['高兴', '开心', '快乐', '喜悦', '兴奋', '激动', '欣喜', '爽', '痛快', '畅快', '大快人心', '心花怒放', '喜出望外', '欢呼', '雀跃'], weight: 3 },
  surprise: { words: ['震惊', '惊讶', '吃惊', '目瞪口呆', '瞠目结舌', '大吃一惊', '意想不到', '出乎意料', '没想到', '不敢相信', '难以置信', '惊呆', '傻眼'], weight: 4 },
  satisfaction: { words: ['打脸', '反杀', '逆袭', '翻身', '扬眉吐气', '一鸣惊人', '众人震惊', '全场沸腾', '掌声雷动', '刮目相看', '跪下', '求饶', '后悔', '后悔莫及', '肠子悔青'], weight: 5 },
  calm: { words: ['平静', '安静', '宁静', '沉默', '淡然', '从容', '淡定', '冷静', '镇定', '不动声色', '面不改色'], weight: -1 },
  tension_markers: ['！', '？', '……', '！！', '？？', '！！！'],
};

function analyzeParagraphs(text) {
  const paragraphs = text.split(/\r?\n/).filter(p => p.trim().length > 10);
  const results = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const emotions = {};
    let totalIntensity = 0;

    for (const [emotion, config] of Object.entries(EMOTION_KEYWORDS)) {
      if (emotion === 'tension_markers') continue;
      let count = 0;
      for (const word of config.words) {
        const matches = para.match(new RegExp(word, 'g'));
        if (matches) count += matches.length;
      }
      if (count > 0) {
        emotions[emotion] = count;
        totalIntensity += count * config.weight;
      }
    }

    for (const marker of EMOTION_KEYWORDS.tension_markers) {
      const matches = para.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
      if (matches) totalIntensity += matches.length * 0.5;
    }

    const intensity = Math.min(10, Math.max(1, Math.round(totalIntensity)));
    const dominantEmotion = Object.entries(emotions).sort((a, b) => b[1] - a[1])[0];

    results.push({
      paragraph: i + 1,
      text_preview: para.substring(0, 40),
      intensity,
      emotions,
      dominant: dominantEmotion ? dominantEmotion[0] : 'neutral',
    });
  }

  return results;
}

function detectFlatRegions(paragraphs) {
  const warnings = [];
  let flatStart = 0;
  let flatCount = 0;

  for (let i = 1; i < paragraphs.length; i++) {
    const diff = Math.abs(paragraphs[i].intensity - paragraphs[i - 1].intensity);
    if (diff <= 1) {
      if (flatCount === 0) flatStart = i - 1;
      flatCount++;
    } else {
      if (flatCount >= 3) {
        warnings.push({
          start_paragraph: flatStart + 1,
          end_paragraph: flatStart + flatCount + 1,
          length: flatCount + 1,
          avg_intensity: Math.round(paragraphs.slice(flatStart, flatStart + flatCount + 1).reduce((s, p) => s + p.intensity, 0) / (flatCount + 1)),
          message: `第 ${flatStart + 1}-${flatStart + flatCount + 1} 段连续 ${flatCount + 1} 段情绪平坦（平均强度 ${Math.round(paragraphs.slice(flatStart, flatStart + flatCount + 1).reduce((s, p) => s + p.intensity, 0) / (flatCount + 1))}）`,
        });
      }
      flatCount = 0;
    }
  }

  if (flatCount >= 3) {
    warnings.push({
      start_paragraph: flatStart + 1,
      end_paragraph: flatStart + flatCount + 1,
      length: flatCount + 1,
      avg_intensity: Math.round(paragraphs.slice(flatStart, flatStart + flatCount + 1).reduce((s, p) => s + p.intensity, 0) / (flatCount + 1)),
      message: `第 ${flatStart + 1}-${flatStart + flatCount + 1} 段连续 ${flatCount + 1} 段情绪平坦`,
    });
  }

  return warnings;
}

function detectSatisfactionPoints(paragraphs) {
  const points = [];
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].dominant === 'satisfaction' || paragraphs[i].intensity >= 7) {
      points.push({
        paragraph: i + 1,
        intensity: paragraphs[i].intensity,
        emotion: paragraphs[i].dominant,
        position_pct: Math.round((i / paragraphs.length) * 100),
      });
    }
  }
  return points;
}

function findPeak(paragraphs) {
  let maxIntensity = 0;
  let peakIndex = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].intensity > maxIntensity) {
      maxIntensity = paragraphs[i].intensity;
      peakIndex = i;
    }
  }
  return { paragraph: peakIndex + 1, intensity: maxIntensity, position_pct: Math.round((peakIndex / paragraphs.length) * 100) };
}

function generateAsciiCurve(paragraphs) {
  const maxH = 10;
  const width = Math.min(paragraphs.length, 60);
  const step = Math.max(1, Math.floor(paragraphs.length / width));
  const lines = [];

  for (let row = maxH; row >= 1; row--) {
    let line = row.toString().padStart(2) + '│';
    for (let col = 0; col < width; col++) {
      const idx = col * step;
      if (idx < paragraphs.length) {
        line += paragraphs[idx].intensity >= row ? '█' : ' ';
      }
    }
    lines.push(line);
  }
  lines.push('  └' + '─'.repeat(width));
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const verbose = args.includes('--verbose');
  const filteredArgs = args.filter(a => a !== '--json' && a !== '--verbose');

  if (filteredArgs.length === 0 || filteredArgs[0] === '--help') {
    console.log(USAGE);
    process.exit(0);
  }

  const chapterFile = path.resolve(filteredArgs[0]);
  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const text = fs.readFileSync(chapterFile, 'utf-8');
  const paragraphs = analyzeParagraphs(text);
  const flatWarnings = detectFlatRegions(paragraphs);
  const satisfactionPoints = detectSatisfactionPoints(paragraphs);
  const peak = findPeak(paragraphs);

  const avgIntensity = paragraphs.length > 0
    ? Math.round(paragraphs.reduce((s, p) => s + p.intensity, 0) / paragraphs.length)
    : 0;

  if (jsonMode) {
    const result = {
      status: flatWarnings.length > 0 ? 'fail' : 'pass',
      file: chapterFile,
      summary: {
        total_paragraphs: paragraphs.length,
        avg_intensity: avgIntensity,
        peak_paragraph: peak.paragraph,
        peak_intensity: peak.intensity,
        satisfaction_points: satisfactionPoints.length,
        flat_warnings: flatWarnings.length,
      },
      peak,
      satisfaction_points: satisfactionPoints,
      flat_warnings: flatWarnings,
      curve: verbose ? paragraphs : paragraphs.map(p => ({ paragraph: p.paragraph, intensity: p.intensity, dominant: p.dominant })),
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(flatWarnings.length > 0 ? 1 : 0);
  }

  console.log('📊 情绪曲线分析');
  console.log('='.repeat(50));
  console.log(`段落数：${paragraphs.length}  平均强度：${avgIntensity}  峰值：第${peak.paragraph}段（强度 ${peak.intensity}）`);
  console.log(`爽点：${satisfactionPoints.length} 个  平坦警告：${flatWarnings.length} 个`);

  console.log('\n情绪曲线：');
  console.log(generateAsciiCurve(paragraphs));

  if (satisfactionPoints.length > 0) {
    console.log('\n🎯 爽点位置：');
    satisfactionPoints.forEach(p => console.log(`  第${p.paragraph}段：强度 ${p.intensity}，位置 ${p.position_pct}%`));
  }

  if (flatWarnings.length > 0) {
    console.log('\n⚠️  平坦警告：');
    flatWarnings.forEach(w => console.log(`  ${w.message}`));
  }

  if (flatWarnings.length > 0) {
    process.exit(2);
  }
  console.log('\n✅ 情绪曲线正常');
  process.exit(0);
}

main();
