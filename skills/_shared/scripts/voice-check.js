#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const USAGE = `Usage: node voice-check.js <chapter-file> [project-dir] [--json]

Check character dialogue voice consistency against personality anchors.

Checks:
- Dialogue tag distribution per character
- Sentence length patterns
- Tone word matching (formal vs casual)
- Personality anchor compliance

Options:
  --json    Output structured JSON

Exit code 0 = pass, 2 = issues found`;

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

function extractDialogues(text) {
  const dialogues = [];
  const seen = new Set();

  const nameChars = '[^\\s，。！？\\u201C\\u201D说问道答喊叫笑叹怒吼冷哼嘟囔嘀咕低语呢喃]{2,4}';
  const verbs = '(?:说道|道|问道|答道|喊道|叫道|笑道|叹道|冷哼|怒吼|说|问|答|喊|叫|笑|叹)';
  const dialogueContent = '[^\\u201C\\u201D]{4,}';

  const pattern = `(${nameChars})\\s*${verbs}[，,：:]*\\s*[\\r\\n\\s　]*[\\u201C\\u201D](${dialogueContent})[\\u201C\\u201D]`;
  const dialogueRe = new RegExp(pattern, 'gm');

  let m;
  while ((m = dialogueRe.exec(text)) !== null) {
    const name = m[1].trim();
    const dialogue = m[2].trim();
    if (isValidName(name)) {
      const key = `${name}:${m.index}`;
      if (!seen.has(key)) {
        seen.add(key);
        dialogues.push({ character: name, text: dialogue });
      }
    }
  }

  return dialogues;
}

function isValidName(name) {
  return name.length >= 2 && name.length <= 4 &&
    !/^[了的着过在是就也还才被把让给对跟和与或但而且因为所以如果虽然]/.test(name) &&
    !/^[这那什么怎哪谁其不]/.test(name) &&
    !/^(继续|连忙|赶紧|急忙|突然|忽然|随后|于是|然后|接着|最后)$/.test(name);
}

function extractPersonalityAnchors(trackingText) {
  const anchors = {};
  const sections = trackingText.split(/##\s+/).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split(/\r?\n/);
    const name = lines[0].trim();
    if (!name || name.length > 20) continue;

    const anchorSection = section.match(/性格锚点[：:]\s*(.+?)(?:\r?\n|$)/);
    const styleSection = section.match(/(?:说话风格|语言风格)[：:]\s*(.+?)(?:\r?\n|$)/);

    anchors[name] = {
      personality: anchorSection ? anchorSection[1].trim() : null,
      style: styleSection ? styleSection[1].trim() : null,
    };
  }

  return anchors;
}

function analyzeDialogueVoice(dialogues) {
  const voices = {};

  for (const d of dialogues) {
    if (!voices[d.character]) {
      voices[d.character] = {
        count: 0,
        totalLength: 0,
        toneWords: { formal: 0, casual: 0, emotional: 0 },
        sentencePatterns: [],
      };
    }

    const v = voices[d.character];
    v.count++;
    v.totalLength += d.text.length;

    const formalWords = ['您', '请', '阁下', '大人', '先生', '女士', '贵', '鄙人'];
    const casualWords = ['嘛', '呗', '啦', '咯', '嘿', '哟', '喂', '切', '哼'];
    const emotionalWords = ['!', '！', '？', '?', '……', '啊', '呀', '哇', '哦'];

    for (const w of formalWords) {
      if (d.text.includes(w)) v.toneWords.formal++;
    }
    for (const w of casualWords) {
      if (d.text.includes(w)) v.toneWords.casual++;
    }
    for (const w of emotionalWords) {
      if (d.text.includes(w)) v.toneWords.emotional++;
    }

    v.sentencePatterns.push(d.text.length);
  }

  return voices;
}

function checkVoiceConsistency(voices, anchors) {
  const warnings = [];

  for (const [name, voice] of Object.entries(voices)) {
    if (voice.count < 2) continue;

    const avgLength = Math.round(voice.totalLength / voice.count);
    const anchor = anchors[name];

    if (anchor && anchor.style) {
      const style = anchor.style;
      if (style.includes('简洁') && avgLength > 30) {
        warnings.push({ character: name, type: 'sentence_length', message: `角色"${name}"设定说话简洁，但平均句长 ${avgLength} 字偏长` });
      }
      if (style.includes('啰嗦') && avgLength < 15) {
        warnings.push({ character: name, type: 'sentence_length', message: `角色"${name}"设定说话啰嗦，但平均句长 ${avgLength} 字偏短` });
      }
      if (style.includes('文雅') && voice.toneWords.casual > voice.toneWords.formal) {
        warnings.push({ character: name, type: 'tone_mismatch', message: `角色"${name}"设定文雅，但口语词多于敬语` });
      }
      if (style.includes('粗犷') && voice.toneWords.formal > voice.toneWords.casual) {
        warnings.push({ character: name, type: 'tone_mismatch', message: `角色"${name}"设定粗犷，但敬语多于口语词` });
      }
    }

    if (voice.count >= 3) {
      const lengths = voice.sentencePatterns;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
      if (variance > 400) {
        warnings.push({ character: name, type: 'voice_drift', message: `角色"${name}"对话长度波动过大（方差 ${Math.round(variance)}），声音不一致` });
      }
    }
  }

  return warnings;
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
  const projectDir = filteredArgs[1] ? path.resolve(filteredArgs[1]) : path.resolve(path.dirname(chapterFile), '..');

  if (!fs.existsSync(chapterFile)) {
    console.error(`Error: File not found: ${chapterFile}`);
    process.exit(2);
  }

  const chapterText = readFile(chapterFile);
  if (!chapterText) {
    console.error(`Error: Cannot read file: ${chapterFile}`);
    process.exit(2);
  }

  const trackingFile = readFile(path.join(projectDir, '追踪', '角色状态.md'));
  const anchors = trackingFile ? extractPersonalityAnchors(trackingFile) : {};

  const dialogues = extractDialogues(chapterText);
  const voices = analyzeDialogueVoice(dialogues);
  const warnings = checkVoiceConsistency(voices, anchors);

  if (jsonMode) {
    const result = {
      status: warnings.length > 0 ? 'fail' : 'pass',
      file: chapterFile,
      summary: {
        characters_found: Object.keys(voices).length,
        total_dialogues: dialogues.length,
        warnings: warnings.length,
      },
      voices: Object.fromEntries(
        Object.entries(voices).map(([name, v]) => [name, {
          dialogue_count: v.count,
          avg_length: Math.round(v.totalLength / v.count),
          tone: v.toneWords,
        }])
      ),
      issues: warnings,
    };
    console.log(JSON.stringify(result, null, 2));
    process.exit(warnings.length > 0 ? 1 : 0);
  }

  console.log('🎤 角色声音一致性检查');
  console.log('='.repeat(50));

  console.log(`\n📊 角色对话统计：`);
  for (const [name, v] of Object.entries(voices)) {
    const avg = Math.round(v.totalLength / v.count);
    console.log(`  ${name}：${v.count} 句，平均 ${avg} 字，正式${v.toneWords.formal} / 口语${v.toneWords.casual} / 情绪${v.toneWords.emotional}`);
  }

  if (warnings.length > 0) {
    console.log(`\n🚫 发现 ${warnings.length} 个问题：`);
    warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w.message}`));
    process.exit(2);
  }

  console.log('\n✅ 角色声音一致性检查通过');
  process.exit(0);
}

main();
