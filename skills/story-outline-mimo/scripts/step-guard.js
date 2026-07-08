#!/usr/bin/env node

/**
 * 全书大纲生成（迭代式 v2.0）- 步骤守卫脚本
 * 在每个子 agent 执行前后运行，自动验证输入输出
 *
 * 用法：
 *   node step-guard.js pre  <step> <workflow-dir> <project-dir>
 *   node step-guard.js post <step> <workflow-dir>
 *
 * 步骤号：00, 01, 02, 03, 04, 05, 06, CC
 * 退出码：0=通过，1=失败（阻断）
 */

const fs = require('fs');
const path = require('path');

const action = process.argv[2]; // pre 或 post
const step = process.argv[3];   // 步骤号
const workflowDir = process.argv[4] || '.workflow';
const projectDir = process.argv[5] || '.';

if (!action || !step) {
  console.error('用法: node step-guard.js <pre|post> <step> <workflow-dir> <project-dir>');
  process.exit(1);
}

// 颜色输出
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(msg) { console.log(`${GREEN}[GUARD]${RESET} ${msg}`); }
function warn(msg) { console.log(`${YELLOW}[WARN]${RESET} ${msg}`); }
function error(msg) { console.error(`${RED}[BLOCK]${RESET} ${msg}`); }

// 确保 workflow 目录存在
function ensureWorkflowDir() {
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
    log(`创建 workflow 目录: ${workflowDir}`);
  }
}

// 读取 JSON 文件
function readJson(filename) {
  const filePath = path.join(workflowDir, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 检查文件是否包含草稿标记
function isDraft(filePath) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('【草稿】');
}

// ============ 前置验证 (pre) ============

const preChecks = {
  // Phase 00: 读取设定
  '00': (wf) => {
    if (!fileExists(projectDir)) {
      error('项目目录不存在: ' + projectDir);
      return false;
    }
    const settingsDir = path.join(projectDir, '设定');
    if (!fileExists(settingsDir)) {
      error('设定目录不存在: ' + settingsDir);
      warn('设定目录缺失，将启动交互式创作模式');
      // 不阻断，允许交互式创作模式
    }
    log('项目目录检查通过');
    return true;
  },

  // Phase 01: 题材诊断 — 需要 step00 完成
  '01': (wf) => {
    const s00 = readJson('step00-settings.json');
    if (!s00) {
      error('step00-settings.json 不存在，设定读取未完成');
      return false;
    }
    log('设定已就绪，可以进行题材诊断');
    return true;
  },

  // Phase 02: 全书骨架 — 需要 step01 完成（题材确认）
  '02': (wf) => {
    const s01 = readJson('step01-genre-confirm.json');
    if (!s01) {
      const s01_diag = readJson('step01-genre-diagnosis.json');
      if (!s01_diag) {
        error('题材诊断未完成，需要先完成 Phase 1');
        return false;
      }
      warn('题材诊断已完成但用户尚未确认模板，建议先完成用户确认');
      return true; // 允许继续，但会警告
    }
    if (!s01.genre || !s01.template_type) {
      error('题材配置不完整，缺少 genre 或 template_type');
      return false;
    }
    log(`题材模板已确认: ${s01.genre} (${s01.template_type})`);
    return true;
  },

  // Phase 03: 卷纲 — 需要 step02 完成
  '03': (wf) => {
    const s02 = readJson('step02-outline.json');
    if (!s02) {
      error('step02-outline.json 不存在，全书大纲未完成');
      return false;
    }
    if (s02.draft === true) {
      warn('全书大纲为草稿状态，建议先完成用户确认');
      return true;
    }
    if (!s02.volume_count || s02.volume_count < 1) {
      error('卷数无效: ' + (s02.volume_count || '未设置'));
      return false;
    }
    const outlineFile = path.join(projectDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) {
      error('大纲文件不存在: ' + outlineFile);
      return false;
    }
    log(`全书大纲已就绪: ${s02.volume_count}卷`);
    return true;
  },

  // Phase 04: 细纲 — 需要 step03 完成
  '04': (wf) => {
    const s03 = readJson('step03-volume-meta.json');
    if (!s03) {
      error('step03-volume-meta.json 不存在，卷纲生成未完成');
      return false;
    }
    // 检查批次进度
    const batchProgress = readJson('step04-batch-progress.json');
    if (batchProgress) {
      log(`已有细纲批次进度: 已完成 ${batchProgress.completed_chapters}/${batchProgress.total_chapters} 章`);
    }
    log('卷纲已就绪，可以开始细纲生成');
    return true;
  },

  // Phase 05: 质量自检 — 至少有一些细纲生成完成
  '05': (wf) => {
    const s04 = readJson('step04-outline-meta.json');
    if (!s04) {
      warn('step04-outline-meta.json 不存在，细纲生成可能未完成');
      // 不阻断，允许只检查大纲和卷纲
    }
    log('可以进行质量自检');
    return true;
  },

  // Phase 06: 完成报告 — 需要质量自检完成
  '06': (wf) => {
    const s05 = readJson('step05-quality-report.json');
    if (!s05) {
      warn('质量自检报告不存在，建议先完成 Phase 5');
      return true;
    }
    log('质量自检已完成，可以输出报告');
    return true;
  }
};

// ============ 后置验证 (post) ============

const postChecks = {
  // Phase 00: 验证设定读取结果
  '00': (wf) => {
    const data = readJson('step00-settings.json');
    if (!data) { error('step00-settings.json 不存在'); return false; }
    if (data.interactive_mode) {
      log(`交互式创作模式: 已记录书名=${data.title || '未知'}, 题材=${data.genre || '未知'}`);
    } else {
      if (!data.characters || !Array.isArray(data.characters)) { warn('characters 缺失或无效'); }
      if (!data.worldview) { warn('worldview 缺失'); }
      log(`Phase 00 输出验证通过: ${data.characters ? data.characters.length + '个角色' : '无角色'}, 题材=${data.genre || '未设置'}`);
    }
    return true;
  },

  // Phase 01: 验证题材诊断结果
  '01': (wf) => {
    const diagnosis = readJson('step01-genre-diagnosis.json');
    if (!diagnosis) { error('step01-genre-diagnosis.json 不存在'); return false; }
    if (!diagnosis.genre) { error('genre 缺失'); return false; }
    if (!diagnosis.template_type) { error('template_type 缺失'); return false; }
    log(`Phase 01 输出验证通过: 题材=${diagnosis.genre}, 模板=${diagnosis.template_type}, 置信度=${diagnosis.confidence}`);

    // 检查是否有用户确认文件
    const confirm = readJson('step01-genre-confirm.json');
    if (confirm) {
      log(`用户已确认模板: ${confirm.genre}, 每章${confirm.chapter_word_count || 3000}字`);
    } else {
      warn('题材诊断已完成，但用户尚未确认模板。建议完成用户确认后再进入 Phase 2');
    }
    return true;
  },

  // Phase 02: 验证大纲文件
  '02': (wf) => {
    const data = readJson('step02-outline.json');
    if (!data) { error('step02-outline.json 不存在'); return false; }
    if (!data.title) { error('title 缺失'); return false; }
    if (!data.volume_count || data.volume_count < 1) { error('volume_count 无效'); return false; }
    if (!data.total_chapters || data.total_chapters < 1) { error('total_chapters 无效'); return false; }

    const outlineFile = path.join(projectDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) { error('大纲/大纲.md 不存在'); return false; }

    // 检查草稿状态
    if (data.draft) {
      warn('大纲处于草稿状态，记得在用户确认后更新 draft=false');
    }

    log(`Phase 02 输出验证通过: ${data.title}, ${data.volume_count}卷, ${data.total_chapters}章, 约${data.total_words || '?'}万字`);
    return true;
  },

  // Phase 03: 验证卷纲文件
  '03': (wf) => {
    const data = readJson('step03-volume-meta.json');
    if (!data) { error('step03-volume-meta.json 不存在'); return false; }

    const currentVolume = data.current_volume;
    if (!currentVolume) { error('current_volume 缺失'); return false; }

    const volFile = path.join(projectDir, '大纲', `卷纲_第${currentVolume.number}卷.md`);
    if (!fileExists(volFile)) {
      error(`卷纲文件不存在: ${volFile}`);
      return false;
    }

    // 检查是否为草稿
    if (currentVolume.draft) {
      warn(`卷纲第${currentVolume.number}卷为草稿状态，记得在用户确认后更新 draft=false`);
    }

    log(`Phase 03 输出验证通过: 第${currentVolume.number}卷「${currentVolume.name}」卷纲文件就绪`);
    return true;
  },

  // Phase 04: 验证细纲文件
  '04': (wf) => {
    const data = readJson('step04-outline-meta.json');
    if (!data) { error('step04-outline-meta.json 不存在'); return false; }

    if (!data.chapters || !Array.isArray(data.chapters)) {
      error('chapters 无效');
      return false;
    }

    // 检查批次数量限制（≤3章）
    if (data.chapters.length > 3) {
      error(`每批最多3章，当前批次包含 ${data.chapters.length} 章`);
      return false;
    }

    // 检查每个细纲文件是否存在
    for (const ch of data.chapters) {
      const chFile = path.join(projectDir, ch.file);
      if (!fileExists(chFile)) {
        error(`细纲文件不存在: ${chFile}`);
        return false;
      }
    }

    // 检查草稿状态
    const hasDraft = data.chapters.some(ch => ch.draft === true);
    if (hasDraft) {
      warn('部分细纲为草稿状态，记得在用户确认后更新 draft=false');
    }

    // 检查批次进度
    const batchProgress = readJson('step04-batch-progress.json');
    if (batchProgress) {
      log(`细纲进度: ${batchProgress.completed_chapters}/${batchProgress.total_chapters} 章已完成`);
    }

    log(`Phase 04 输出验证通过: 第${data.batch_number}批, ${data.chapters.length}章`);
    return true;
  },

  // Phase 05: 验证质量自检报告
  '05': (wf) => {
    const data = readJson('step05-quality-report.json');
    if (!data) { error('step05-quality-report.json 不存在'); return false; }

    const reportFile = path.join(projectDir, '大纲', '质量自检报告.md');
    if (!fileExists(reportFile)) { error('大纲/质量自检报告.md 不存在'); return false; }

    // 检查是否有阻断项
    if (data.blocking_issues && data.blocking_issues.length > 0) {
      warn(`有 ${data.blocking_issues.length} 个阻断性问题需要修复`);
    }

    log(`Phase 05 输出验证通过: ${data.conclusion || '结论未知'}`);
    return true;
  },

  // Phase 06: 验证报告输出
  '06': (wf) => {
    log('Phase 06 完成报告已输出');
    return true;
  }
};

// ============ 修改一致性检查 (CC) ============

/**
 * 修改模式一致性检查 — 修改大纲/卷纲/细纲后调用
 * 验证方式：node step-guard.js pre CC <workflow-dir> <project-dir> <modified-type>
 * modified-type: outline | volume | chapter
 */
const consistencyChecks = {
  // 检查大纲修改后的一致性
  'outline': (projDir) => {
    log('=== 一致性检查：大纲修改后 ===');

    const outlineFile = path.join(projDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) { error('大纲文件缺失'); return false; }

    const outlineContent = fs.readFileSync(outlineFile, 'utf-8');
    const volMatches = outlineContent.match(/第[一二三四五六七八九十\d]+卷：/g);
    const volCount = volMatches ? volMatches.length : 0;

    const volDir = path.join(projDir, '大纲');
    const volFiles = fs.readdirSync(volDir).filter(f => f.startsWith('卷纲_') && f.endsWith('.md'));

    if (volFiles.length !== volCount) {
      error(`卷数不一致：大纲中有 ${volCount} 卷，但有 ${volFiles.length} 个卷纲文件`);
      return false;
    }

    log(`一致性检查通过：大纲 ${volCount} 卷 = ${volFiles.length} 卷纲文件`);
    return true;
  },

  // 检查卷纲修改后的一致性（增强版：交叉对比大纲+细纲）
  'volume': (projDir) => {
    log('=== 一致性检查：卷纲修改后 ===');

    const volDir = path.join(projDir, '大纲');
    const volFiles = fs.readdirSync(volDir).filter(f => f.startsWith('卷纲_') && f.endsWith('.md'));
    const detailFiles = fs.readdirSync(volDir).filter(f => f.startsWith('细纲_') && f.endsWith('.md'));

    // 检查大纲中的卷数是否匹配
    const outlineFile = path.join(projDir, '大纲', '大纲.md');
    if (fileExists(outlineFile)) {
      const outlineContent = fs.readFileSync(outlineFile, 'utf-8');
      const volMatches = outlineContent.match(/第[一二三四五六七八九十\d]+卷：/g);
      const outlineVolCount = volMatches ? volMatches.length : 0;
      if (outlineVolCount !== volFiles.length) {
        error(`卷数不一致：大纲 ${outlineVolCount} 卷 vs 卷纲 ${volFiles.length} 个`);
        return false;
      }
      log(`大纲卷数匹配: ${outlineVolCount}卷 = ${volFiles.length}个卷纲`);
    }

    // 逐卷检查章数 + 与已有细纲对比
    let totalIssues = 0;
    for (const vf of volFiles) {
      const volContent = fs.readFileSync(path.join(volDir, vf), 'utf-8');
      const chapterMatches = volContent.match(/- 第(\d+|[一二三四五六七八九十百千]+)章：/g);
      const plannedChapters = chapterMatches ? chapterMatches.length : 0;

      // 获取该卷号
      const volNumMatch = vf.match(/卷纲_第(\d+)卷\.md/);
      const volNum = volNumMatch ? parseInt(volNumMatch[1]) : 0;

      // 获取每卷实际章数（从元数据读取，否则使用默认值）
      function getVolumeChapters(vNum) {
        const meta = readJson('step03-volume-meta.json');
        if (meta && Array.isArray(meta.volumes)) {
          const v = meta.volumes.find(x => x.number === vNum);
          if (v && v.chapters) return v.chapters;
        }
        const outline = readJson('step02-outline.json');
        if (outline && Array.isArray(outline.volumes)) {
          const v = outline.volumes.find(x => x.number === vNum);
          if (v && v.chapters) return v.chapters;
        }
        // 从大纲.md解析：匹配"约 X 万字，Y 章"模式
        const outlineFile = path.join(projDir, '大纲', '大纲.md');
        if (fileExists(outlineFile)) {
          const content = fs.readFileSync(outlineFile, 'utf-8');
          const vMatch = content.match(new RegExp(`第[${'一二三四五六七八九十'}${vNum}]卷.*?(\\d+)\\s*章`));
          if (vMatch) return parseInt(vMatch[1]);
        }
        return 40; // 默认值
      }

      // 统计该卷对应的细纲文件数
      const volDetailFiles = detailFiles.filter(df => {
        const chNumMatch = df.match(/细纲_第(\d+)章\.md/);
        if (!chNumMatch) return false;
        const chNum = parseInt(chNumMatch[1]);
        // 从元数据或大纲中读取每卷实际章数
        const volChapters = getVolumeChapters(volNum);
        const startCh = (volNum - 1) * volChapters + 1;
        const endCh = volNum * volChapters;
        return chNum >= startCh && chNum <= endCh;
      });

      if (volDetailFiles.length > 0 && volDetailFiles.length !== plannedChapters) {
        warn(`卷纲 ${vf}: 规划 ${plannedChapters} 章，但有 ${volDetailFiles.length} 个细纲文件，不匹配`);
        totalIssues++;
      }

      log(`卷纲 ${vf}: ${plannedChapters} 章规划, ${volDetailFiles.length} 细纲`);
    }

    if (totalIssues > 0) {
      warn(`卷纲一致性检查完成，${totalIssues} 个不匹配问题`);
    } else {
      log('卷纲一致性检查完成：全部匹配');
    }
    return true;
  },

  // 检查细纲修改后的一致性（增强版：对比卷纲+前5章去重）
  'chapter': (projDir) => {
    log('=== 一致性检查：细纲修改后 ===');

    const volDir = path.join(projDir, '大纲');

    // 1. 找出最近修改的细纲文件（按修改时间排序）
    const detailFiles = fs.readdirSync(volDir)
      .filter(f => f.startsWith('细纲_') && f.endsWith('.md'))
      .map(f => ({
        name: f,
        path: path.join(volDir, f),
        mtime: fs.statSync(path.join(volDir, f)).mtimeMs
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (detailFiles.length === 0) {
      log('无细纲文件，跳过');
      return true;
    }

    // 2. 检查最近修改的细纲是否在卷纲章节规划中
    const volFiles = fs.readdirSync(volDir).filter(f => f.startsWith('卷纲_') && f.endsWith('.md'));
    const latestDetail = detailFiles[0];
    const chNumMatch = latestDetail.name.match(/细纲_第(\d+)章\.md/);
    if (chNumMatch) {
      const chNum = parseInt(chNumMatch[1]);
      // 在所有卷纲中搜索该章节号
      let foundInVol = false;
      for (const vf of volFiles) {
        const volContent = fs.readFileSync(path.join(volDir, vf), 'utf-8');
        if (volContent.includes(`第${chNum}章：`)) {
          foundInVol = true;
          log(`细纲 ${latestDetail.name} 属于 ${vf}`);
          break;
        }
      }
      if (!foundInVol) {
        warn(`细纲 ${latestDetail.name} 的章节号未在任何卷纲中找到`);
      }
    }

    // 去重检查：按新细纲格式解析核心事件（剧情推进中的核心事件列表）
    const recentFiles = detailFiles.slice(0, Math.min(3, detailFiles.length));
    const recentKernels = [];
    for (const rf of recentFiles) {
      const content = fs.readFileSync(rf.path, 'utf-8');
      // 新格式: 从 "## 2. 剧情推进" 中提取核心事件
      const plotMatch = content.match(/## 2\. 剧情推进[\s\S]*?(?=## 3\.|## 4\.|## 5\.|$)/);
      if (plotMatch) {
        const plotSection = plotMatch[0];
        // 提取"核心事件："后面的内容
        const events = plotSection.match(/\d+\.\s*[^。\n]+[。\n]/g);
        if (events) recentKernels.push(events.join(' '));
        else {
          // 降级: 提取"核心事件："后面直接的行
          const directMatch = plotSection.match(/核心事件[：:]\s*([^\n]+)/);
          if (directMatch) recentKernels.push(directMatch[1].trim());
        }
      } else {
        // 兼容旧格式: 从 "## 核心事件" 匹配
        const kernelMatch = content.match(/## 核心事件\s*\n(.*)/);
        if (kernelMatch) recentKernels.push(kernelMatch[1].trim());
      }
    }

    // 简单的重复检测：如果最近3章核心事件有2个以上包含相同的关键词
    if (recentKernels.length >= 3) {
      const wordSets = recentKernels.map(k => new Set(k.match(/[\u4e00-\u9fff]{2,}/g) || []));
      const overlaps = wordSets[0].size > 0 && wordSets[1].size > 0 && wordSets[2].size > 0
        ? [wordSets[0], wordSets[1], wordSets[2]].reduce((a, b) => new Set([...a].filter(x => b.has(x))))
        : new Set();
      if (overlaps.size >= 3) {
        warn(`最近3章核心事件有 ${overlaps.size} 个相同关键词，可能存在事件重复`);
      }
    }

    log(`细纲一致性检查完成: ${detailFiles.length} 个细纲文件`);
    return true;
  },

  // 全量一致性审计
  'full': (projDir) => {
    log('=== 全量一致性审计 ===');

    const outlineFile = path.join(projDir, '大纲', '大纲.md');
    if (!fileExists(outlineFile)) { error('大纲文件缺失'); return false; }

    const outlineContent = fs.readFileSync(outlineFile, 'utf-8');
    const volMatches = outlineContent.match(/第[一二三四五六七八九十\d]+卷：/g);
    const volCount = volMatches ? volMatches.length : 0;

    const volDir = path.join(projDir, '大纲');
    const volFiles = fs.readdirSync(volDir).filter(f => f.startsWith('卷纲_') && f.endsWith('.md'));

    if (volFiles.length !== volCount) {
      error(`卷数不一致：大纲 ${volCount} 卷 vs 卷纲 ${volFiles.length} 个`);
      return false;
    }

    const detailFiles = fs.readdirSync(volDir).filter(f => f.startsWith('细纲_') && f.endsWith('.md'));
    const allDrafts = detailFiles.filter(f => isDraft(path.join(volDir, f)));
    if (allDrafts.length > 0) {
      warn(`有 ${allDrafts.length} 个细纲文件仍为草稿状态`);
    }

    log(`全量审计通过：${volCount}卷, ${volFiles.length}卷纲, ${detailFiles.length}细纲`);
    return true;
  }
};

// ============ 主逻辑 ============

ensureWorkflowDir();

if (action === 'pre') {
  // 特殊处理 CC（一致性检查）
  if (step === 'CC') {
    log(`=== 一致性检查 (CC) ===`);
    const modifiedType = process.argv[5] || 'full'; // outline/volume/chapter/full
    const projDir = process.argv[6] || projectDir;
    const checker = consistencyChecks[modifiedType];
    if (!checker) {
      warn(`未知的修改类型: ${modifiedType}，执行全量审计`);
      consistencyChecks['full'](projDir || projectDir);
      process.exit(0);
    }
    const passed = checker(projDir || projectDir);
    if (passed) {
      log('一致性检查通过');
      process.exit(0);
    } else {
      error('一致性检查失败：存在阻断性问题');
      process.exit(1);
    }
  }

  log(`=== 前置验证: Phase ${step} ===`);
  const checker = preChecks[step];
  if (!checker) {
    warn(`Phase ${step} 无前置验证`);
    process.exit(0);
  }
  const passed = checker(workflowDir);
  if (passed) {
    log(`Phase ${step} 前置验证通过，可以执行`);
    process.exit(0);
  } else {
    error(`Phase ${step} 前置验证失败`);
    process.exit(1);
  }
} else if (action === 'post') {
  log(`=== 后置验证: Phase ${step} ===`);
  const checker = postChecks[step];
  if (!checker) {
    warn(`Phase ${step} 无后置验证`);
    process.exit(0);
  }
  const passed = checker(workflowDir);
  if (passed) {
    log(`Phase ${step} 后置验证通过`);
    process.exit(0);
  } else {
    error(`Phase ${step} 后置验证失败`);
    process.exit(1);
  }
} else {
  error('未知操作: ' + action + ' (应为 pre 或 post)');
  process.exit(1);
}