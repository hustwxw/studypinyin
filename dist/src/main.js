import { ALL_FINALS, ALL_INITIALS, ALL_MEDIALS, FINAL_GROUPS, INITIAL_GROUPS, SYLLABLES, TONES, WHOLE_READING, withTone } from './pinyin-data.js';
import { VOICE_EXAMPLES } from './voice-examples.js';

const app = document.querySelector('#app');
const SETTINGS_KEY = 'studypinyin-settings-v1';
const DECK_KEY = 'studypinyin-deck-v1';
const categories = [
  { id: 'all', title: '全部音节', detail: '从完整音节库里随机抽取', icon: '✦' },
  { id: 'double', title: '两拼音节', detail: '声母 + 韵母', icon: '2' },
  { id: 'triple', title: '三拼音节', detail: '声母 + 介母 + 韵母', icon: '3' },
  { id: 'whole', title: '整体认读', detail: '直接读出整个音节', icon: '◎' },
  { id: 'zero', title: '零声母', detail: '没有辅音声母的音节', icon: '∅' },
];
const counts = [8, 12, 20, 30, 50];
const saved = readStorage(SETTINGS_KEY, localStorage) || {};
const state = {
  category: categories.some((item) => item.id === saved.category) ? saved.category : 'all',
  initials: new Set(Array.isArray(saved.initials) ? saved.initials.filter((item) => ALL_INITIALS.includes(item)) : ALL_INITIALS),
  finals: new Set(Array.isArray(saved.finals) ? saved.finals.filter((item) => ALL_FINALS.includes(item)) : ALL_FINALS),
  medials: new Set(Array.isArray(saved.medials) ? saved.medials.filter((item) => ALL_MEDIALS.includes(item)) : ALL_MEDIALS),
  tones: new Set(Array.isArray(saved.tones) ? saved.tones.filter((item) => TONES.some((tone) => tone.value === item)) : [1, 2, 3, 4]),
  count: counts.includes(saved.count) ? saved.count : 12,
  includeRare: Boolean(saved.includeRare),
  includeUnattested: Boolean(saved.includeUnattested),
  deck: readStorage(DECK_KEY, sessionStorage) || [],
  playing: -1,
  notice: '',
};

const speaker = window.speechSynthesis;
const hasSpeech = Boolean(speaker && window.SpeechSynthesisUtterance);
let speechStatusTimer;
let speechWatchdog;
let speechRequest = 0;

if (speaker) {
  try { speaker.getVoices(); } catch { /* 部分浏览器在语音服务就绪前会暂不返回音色。 */ }
  speaker.addEventListener?.('voiceschanged', () => speaker.getVoices());
}

function readStorage(key, store) {
  try { return JSON.parse(store.getItem(key)); } catch { return null; }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    category: state.category,
    initials: [...state.initials], finals: [...state.finals], medials: [...state.medials], tones: [...state.tones],
    count: state.count, includeRare: state.includeRare, includeUnattested: state.includeUnattested,
  }));
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function icon(name, size = 20) {
  const paths = {
    sound: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    shuffle: '<path d="M4 6h3c5 0 5 12 10 12h3m-4-4 4 4-4 4M4 18h3c1.7 0 2.9-1.4 4-3m2-6c1.1-1.6 2.3-3 4-3h3m-4-4 4 4-4 4"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}

function eligibleSyllables() {
  return SYLLABLES.filter((item) =>
    (state.includeRare || !item.rare) && state.initials.has(item.initial) && state.finals.has(item.final)
    && (!item.medial || state.medials.has(item.medial)) && (
      state.category === 'all' ||
      (state.category === 'double' && item.kind === '两拼音节') ||
      (state.category === 'triple' && item.kind === '三拼音节') ||
      (state.category === 'whole' && WHOLE_READING.has(item.spelling)) ||
      (state.category === 'zero' && item.initial === '')
    )
  );
}

function eligibleVariants() {
  return eligibleSyllables().flatMap((item) => [...state.tones].flatMap((tone) =>
    state.includeUnattested || VOICE_EXAMPLES[`${item.spelling}${tone}`]
      ? [{ spelling: item.spelling, tone }]
      : []
  ));
}

function chipGroups(groups, type, chosen) {
  return groups.map((group, index) => `<div class="chip-group" role="group" aria-label="${group.label}">
    <div class="chip-group-header"><span class="chip-group-title">${group.label}</span><div class="chip-group-actions"><button type="button" data-group-action="all" data-group-type="${type}" data-group-index="${index}" aria-label="全选${group.label}">全选</button><button type="button" data-group-action="invert" data-group-type="${type}" data-group-index="${index}" aria-label="反选${group.label}">反选</button></div></div>
    <div class="chips">${group.values.map((value) => `<button class="chip ${chosen.has(value) ? 'selected' : ''}" type="button" data-${type}="${esc(value)}" aria-pressed="${chosen.has(value)}">${value || '∅'}${chosen.has(value) ? `<span class="chip-check">${icon('check', 12)}</span>` : ''}</button>`).join('')}</div>
  </div>`).join('');
}

function nav(active) {
  return `<header class="site-header"><a href="#/" class="brand" aria-label="拼音星球，返回练习设置">
    <span class="brand-mark">pī</span><span class="brand-name">拼音星球<small>PINYIN PLANET</small></span>
  </a><nav class="header-nav" aria-label="主导航"><a class="${active === 'home' ? 'active' : ''}" href="#/">练习设置</a><a class="${active === 'practice' ? 'active' : ''}" href="#/practice">点读练习</a></nav><span class="header-badge"><i></i> 随时随地学拼音</span></header>`;
}

function homeView() {
  const variants = eligibleVariants();
  const available = new Set(variants.map((item) => item.spelling));
  const total = variants.length;
  const canGenerate = total > 0;
  return `${nav('home')}
    <main class="home-layout">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy"><span class="eyebrow"><span class="eyebrow-star">✳</span> 让每一次拼读都充满发现</span>
          <h1 id="hero-title">小小拼音，<br/><em>大大声音。</em></h1>
          <p>挑选声母、韵母与声调，生成一组属于你的拼音卡片。点一点，听一听，把每个音节都读出来。</p>
          <div class="hero-points"><span>✓ 分类学习</span><span>✓ 随机组合</span><span>✓ 点击朗读</span></div>
        </div>
        <div class="hero-art" aria-hidden="true"><span class="orbit orbit-one"></span><span class="orbit orbit-two"></span><span class="spark spark-one">✦</span><span class="spark spark-two">✳</span><span class="art-card art-b">b</span><span class="art-plus art-plus-one">+</span><span class="art-card art-i">i</span><span class="art-plus art-plus-two">+</span><span class="art-card art-ao">ao</span><span class="art-result">biāo <span>↗</span></span><span class="art-note">一起读出来！</span></div>
      </section>

      <div class="content-grid">
        <div class="builder">
          <div class="section-heading"><div><span class="step">01</span><h2>选择练习内容</h2><p>先选一类音节，再决定想练习哪些拼音。</p></div></div>
          <section class="panel category-panel" aria-labelledby="category-title"><div class="panel-heading"><h3 id="category-title">音节分类</h3><span class="panel-note">选择一种</span></div>
            <div class="category-grid">${categories.map((item) => `<button class="category-card ${state.category === item.id ? 'selected' : ''}" type="button" data-category="${item.id}" aria-pressed="${state.category === item.id}"><span class="category-icon">${item.icon}</span><strong>${item.title}</strong><small>${item.detail}</small>${state.category === item.id ? `<span class="category-tick">${icon('check', 15)}</span>` : ''}</button>`).join('')}</div>
          </section>
          <section class="panel tone-panel" aria-labelledby="tone-title"><div class="panel-heading"><div><h3 id="tone-title">选择声调</h3><p>可以同时选多个声调</p></div><span class="selection-count">已选 ${state.tones.size} 种</span></div>
            <div class="tone-grid">${TONES.map((tone) => `<button class="tone-card tone-${tone.value} ${state.tones.has(tone.value) ? 'selected' : ''}" type="button" data-tone="${tone.value}" aria-pressed="${state.tones.has(tone.value)}"><span class="tone-symbol">${tone.mark}</span><span class="tone-info"><strong>${tone.name}</strong><small>${tone.description}</small></span><span class="tone-tick">${icon('check', 13)}</span></button>`).join('')}</div>
          </section>
          <section class="panel sound-panel" aria-labelledby="sound-title"><div class="panel-heading"><div><h3 id="sound-title">精细选择</h3><p>默认包含全部。点选声母与韵母，或按分组全选、反选。</p></div></div>
            <details class="filter-box" id="initial-filter"><summary><span><strong>声母</strong><small>已选 ${state.initials.size} / ${ALL_INITIALS.length} 个</small></span>${icon('chevron', 18)}</summary><div class="filter-body"><div class="filter-actions"><button type="button" data-select-all="initial">全选</button><button type="button" data-clear="initial">清空</button></div>${chipGroups(INITIAL_GROUPS, 'initial', state.initials)}</div></details>
            <details class="filter-box" id="final-filter"><summary><span><strong>韵母</strong><small>已选 ${state.finals.size} / ${ALL_FINALS.length} 个</small></span>${icon('chevron', 18)}</summary><div class="filter-body"><div class="filter-actions"><button type="button" data-select-all="final">全选</button><button type="button" data-clear="final">清空</button></div>${chipGroups(FINAL_GROUPS, 'final', state.finals)}</div></details>
            <div class="medial-filter"><span><strong>介母</strong><small>用于筛选三拼音节</small></span><div class="chips">${ALL_MEDIALS.map((value) => `<button class="chip ${state.medials.has(value) ? 'selected' : ''}" type="button" data-medial="${value}" aria-pressed="${state.medials.has(value)}">${value}</button>`).join('')}</div></div>
            <label class="rare-toggle"><input type="checkbox" id="rare-toggle" ${state.includeRare ? 'checked' : ''}/><span class="toggle-track"></span><span><strong>加入生僻与口语音节</strong><small>例如 ê、den、yo 等少见读音</small></span></label>
            <label class="rare-toggle"><input type="checkbox" id="unattested-toggle" ${state.includeUnattested ? 'checked' : ''}/><span class="toggle-track"></span><span><strong>探索所有声调组合</strong><small>包含没有例字的拼读练习，发音因设备而异</small></span></label>
          </section>
          <section class="panel quantity-panel" aria-labelledby="quantity-title"><div class="panel-heading"><div><h3 id="quantity-title">每组卡片数量</h3><p>选一个适合自己的练习节奏</p></div></div><div class="quantity-options">${counts.map((count) => `<button class="quantity-button ${state.count === count ? 'selected' : ''}" type="button" data-count="${count}" aria-pressed="${state.count === count}">${count}<span>张</span></button>`).join('')}</div></section>
          <div class="generate-bar"><div><strong>${available.size} 个可选音节</strong><small>搭配已选声调，共 ${total} 种练习卡片</small></div><button class="primary-button" type="button" data-generate ${canGenerate ? '' : 'disabled'}>生成拼音卡片 ${icon('arrow', 20)}</button></div>
          ${canGenerate ? '' : '<p class="empty-hint" role="status">当前筛选没有可用音节，请增加声母、韵母或声调。</p>'}
        </div>
        <aside class="sidebar"><div class="aside-sticky"><div class="info-card"><div class="info-header"><span class="info-icon">✳</span><span>拼音小知识</span></div><h3>一个音节，<br/>可以这样拆。</h3><div class="split-example"><span><small>声母</small><b>b</b></span><i>+</i><span><small>介母</small><b>i</b></span><i>+</i><span><small>韵母</small><b>ao</b></span></div><div class="split-result">b + i + ao <span>→</span> biāo</div><p>像 “biāo” 这样，由声母、介母和韵母组成的音节，叫做<strong>三拼音节</strong>。</p></div><div class="tip-card"><span class="tip-icon">♫</span><div><strong>戴上耳机，更容易听清声调</strong><p>卡片上的喇叭可随时重复点读。发音由设备的中文语音能力提供。</p></div></div></div></aside>
      </div>
    </main>${footer()}`;
}

function breakdown(item) {
  if (!item.initial) return `零声母 · ${item.final}`;
  if (!item.medial) return `${item.initial} + ${item.final}`;
  return `${item.initial} + ${item.medial} + ${item.final.slice(1)}`;
}

function practiceView() {
  if (!Array.isArray(state.deck) || !state.deck.length) return `${nav('practice')}<main class="missing-deck"><span>✳</span><h1>还没有拼音卡片</h1><p>先选择想练习的内容，再生成一组卡片吧。</p><a class="primary-button" href="#/">去选择 ${icon('arrow', 20)}</a></main>${footer()}`;
  return `${nav('practice')}<main class="practice-page"><div class="practice-top"><a href="#/" class="back-link">${icon('back', 18)} 返回设置</a><div class="practice-actions"><button type="button" class="quiet-button" data-regenerate>${icon('shuffle', 18)} 换一组</button></div></div>
    <section class="practice-intro"><div><span class="eyebrow"><span class="eyebrow-star">✳</span> 你的专属练习</span><h1>今天的拼音卡片<span>。</span></h1><p>点击带调拼音即可听发音，也可点喇叭重复朗读。</p></div><div class="practice-count"><b>${state.deck.length}</b><span>张拼音卡片</span></div></section>
    <div class="practice-toolbar"><div class="practice-legend"><span class="legend-dot"></span> 带调拼音 <span class="divider"></span> <span class="legend-rare"></span> 生僻音节</div><div class="speech-hint ${hasSpeech ? '' : 'visible'}" id="speech-hint" role="status" aria-live="polite">${hasSpeech ? '点击拼音即可点读' : '当前浏览器不支持语音朗读'}</div></div>
    <section class="card-grid" aria-label="拼音练习卡片">${state.deck.map((entry, index) => {
      const item = SYLLABLES.find((candidate) => candidate.spelling === entry.spelling);
      if (!item) return '';
      const example = VOICE_EXAMPLES[`${entry.spelling}${entry.tone}`];
      return `<article class="syllable-card ${item.rare ? 'rare' : ''} ${state.playing === index ? 'playing' : ''}" data-card-play="${index}"><div class="card-top"><span class="card-number">${String(index + 1).padStart(2, '0')}</span><span class="card-kind">${item.kind}</span></div><button class="syllable-display" type="button" data-play="${index}" aria-label="朗读 ${withTone(item.spelling, entry.tone)}" ${hasSpeech ? '' : 'disabled'}>${withTone(item.spelling, entry.tone)}</button><div class="syllable-plain">${item.spelling} · ${TONES.find((tone) => tone.value === entry.tone)?.name || ''}${example ? ` · 例${example.length > 1 ? '词' : '字'} ${example}` : ''}</div><div class="card-bottom"><span class="card-breakdown">${breakdown(item)}</span><button class="play-button" type="button" data-play="${index}" aria-label="朗读 ${withTone(item.spelling, entry.tone)}" ${hasSpeech ? '' : 'disabled'}>${icon('sound', 21)}</button></div></article>`;
    }).join('')}</section><div class="practice-bottom"><span>读完这一组，给自己一个小小的掌声！</span><button class="secondary-button" type="button" data-regenerate>再来一组 ${icon('arrow', 19)}</button></div>
  </main>${footer()}`;
}

function footer() {
  return `<footer class="site-footer"><span class="footer-brand">拼音星球 <span>✳</span></span><span>用好奇心，读懂每一个声音。</span><span>普通话拼音练习 · 支持手机、平板与电脑</span></footer>`;
}

function render() {
  const isPractice = location.hash === '#/practice';
  app.innerHTML = isPractice ? practiceView() : homeView();
  document.title = `${isPractice ? '点读练习' : '练习设置'} · 拼音星球`;
}

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generate() {
  const variants = eligibleVariants();
  if (!variants.length) return;
  const bySyllable = new Map();
  for (const entry of variants) {
    if (!bySyllable.has(entry.spelling)) bySyllable.set(entry.spelling, []);
    bySyllable.get(entry.spelling).push(entry);
  }
  const firstPass = shuffle([...bySyllable.values()]).map((entries) => shuffle(entries)[0]);
  const used = new Set(firstPass.map((entry) => `${entry.spelling}:${entry.tone}`));
  const rest = shuffle(variants).filter((entry) => !used.has(`${entry.spelling}:${entry.tone}`));
  state.deck = [...firstPass, ...rest].slice(0, state.count);
  state.playing = -1;
  sessionStorage.setItem(DECK_KEY, JSON.stringify(state.deck));
  if (location.hash === '#/practice') render();
  else location.hash = '#/practice';
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateSelection(set, value) {
  if (set.has(value)) set.delete(value); else set.add(value);
  saveSettings();
  rerenderPreservingDetails();
}

function updateGroupSelection(type, index, action) {
  const groups = type === 'initial' ? INITIAL_GROUPS : type === 'final' ? FINAL_GROUPS : null;
  const set = type === 'initial' ? state.initials : state.finals;
  const group = groups?.[index];
  if (!group || !['all', 'invert'].includes(action)) return;
  for (const value of group.values) {
    if (action === 'all') set.add(value);
    else if (set.has(value)) set.delete(value);
    else set.add(value);
  }
  saveSettings();
  rerenderPreservingDetails();
}

function rerenderPreservingDetails() {
  const open = [...document.querySelectorAll('details[open]')].map((element) => element.id);
  render();
  for (const id of open) document.getElementById(id)?.setAttribute('open', '');
}

function setSpeechStatus(message, kind = 'info', autoHide = false) {
  const hint = document.getElementById('speech-hint');
  if (!hint) return;
  window.clearTimeout(speechStatusTimer);
  hint.textContent = message;
  hint.dataset.state = kind;
  hint.classList.add('visible');
  if (autoHide) speechStatusTimer = window.setTimeout(() => hint.classList.remove('visible'), 3500);
}

function finishSpeech(requestId, message, kind = 'info') {
  if (requestId !== speechRequest) return;
  window.clearTimeout(speechWatchdog);
  state.playing = -1;
  document.querySelectorAll('.syllable-card').forEach((card) => card.classList.remove('playing'));
  setSpeechStatus(message, kind, kind !== 'error');
}

function speak(index) {
  if (!hasSpeech) return;
  const entry = state.deck[index];
  if (!entry) return;
  const requestId = ++speechRequest;
  if (speaker.speaking || speaker.pending || speaker.paused) speaker.cancel();
  const example = VOICE_EXAMPLES[`${entry.spelling}${entry.tone}`];
  const utterance = new SpeechSynthesisUtterance(example || withTone(entry.spelling, entry.tone));
  utterance.lang = 'zh-CN';
  utterance.rate = 0.78;
  let voices = [];
  try { voices = speaker.getVoices(); } catch { /* 继续尝试浏览器默认语音。 */ }
  const chineseVoice = voices.find((voice) => /^zh[-_]CN/i.test(voice.lang))
    || voices.find((voice) => /^zh/i.test(voice.lang));
  if (chineseVoice) utterance.voice = chineseVoice;
  state.playing = index;
  document.querySelectorAll('.syllable-card').forEach((card, cardIndex) => card.classList.toggle('playing', cardIndex === index));
  setSpeechStatus(chineseVoice
    ? `正在朗读 ${withTone(entry.spelling, entry.tone)}${example ? `（例${example.length > 1 ? '词' : '字'} ${example}）` : '（设备语音合成）'}`
    : '未检测到中文音色，正在尝试系统默认语音；若无声音，请检查系统文字转语音设置。');
  utterance.onend = () => {
    finishSpeech(requestId, '朗读结束。若未听到声音，请检查媒体音量和系统文字转语音设置。');
  };
  utterance.onerror = (event) => {
    const messages = {
      'audio-busy': '设备音频正忙，请稍后再试。',
      'audio-hardware': '未找到可用的音频输出，请检查媒体音量、静音或蓝牙输出。',
      network: '语音引擎连接失败，请检查网络后重试。',
      'synthesis-unavailable': '浏览器没有可用的语音合成引擎，请在系统设置中启用文字转语音。',
      'synthesis-failed': '语音合成失败，请检查系统文字转语音引擎后重试。',
      'language-unavailable': '设备没有可用的中文语音，请在系统文字转语音设置中选择或下载中文语音。',
      'voice-unavailable': '所选语音不可用，请重启浏览器或更换中文语音引擎。',
      'text-too-long': '朗读内容过长，请重新点读。',
      interrupted: '朗读被系统中断，请稍后重试。',
      canceled: '朗读已取消。',
    };
    finishSpeech(requestId, messages[event.error] || `语音播放失败（${event.error || '未知错误'}），请检查系统文字转语音设置。`, 'error');
  };
  window.clearTimeout(speechWatchdog);
  speechWatchdog = window.setTimeout(() => {
    finishSpeech(requestId, '浏览器没有返回播放结果。请检查系统文字转语音引擎，或换用其他浏览器。', 'error');
  }, 12000);
  try { speaker.speak(utterance); } catch (error) {
    finishSpeech(requestId, `浏览器启动语音失败（${error.name || '未知错误'}），请检查系统文字转语音设置。`, 'error');
  }
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) {
    const card = event.target.closest('[data-card-play]');
    if (card) speak(Number(card.dataset.cardPlay));
    return;
  }
  if (button.dataset.category) { state.category = button.dataset.category; saveSettings(); rerenderPreservingDetails(); }
  else if (button.dataset.tone !== undefined) updateSelection(state.tones, Number(button.dataset.tone));
  else if (button.dataset.initial !== undefined) updateSelection(state.initials, button.dataset.initial);
  else if (button.dataset.final !== undefined) updateSelection(state.finals, button.dataset.final);
  else if (button.dataset.medial !== undefined) updateSelection(state.medials, button.dataset.medial);
  else if (button.dataset.groupAction) updateGroupSelection(button.dataset.groupType, Number(button.dataset.groupIndex), button.dataset.groupAction);
  else if (button.dataset.count) { state.count = Number(button.dataset.count); saveSettings(); rerenderPreservingDetails(); }
  else if (button.dataset.selectAll) {
    state[button.dataset.selectAll === 'initial' ? 'initials' : 'finals'] = new Set(button.dataset.selectAll === 'initial' ? ALL_INITIALS : ALL_FINALS);
    saveSettings(); rerenderPreservingDetails();
  } else if (button.dataset.clear) {
    state[button.dataset.clear === 'initial' ? 'initials' : 'finals'].clear();
    saveSettings(); rerenderPreservingDetails();
  } else if (button.hasAttribute('data-generate') || button.hasAttribute('data-regenerate')) {
    try { generate(); } catch (error) { window.alert(`生成失败：${error.message}`); }
  }
  else if (button.dataset.play !== undefined) speak(Number(button.dataset.play));
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'rare-toggle') {
    state.includeRare = event.target.checked;
    saveSettings(); rerenderPreservingDetails();
  } else if (event.target.id === 'unattested-toggle') {
    state.includeUnattested = event.target.checked;
    saveSettings(); rerenderPreservingDetails();
  }
});

window.addEventListener('hashchange', () => { speaker?.cancel(); state.playing = -1; render(); window.scrollTo(0, 0); });
render();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
