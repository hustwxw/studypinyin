// 普通话音节按声母整理；拼合表参考 README 中列出的教育机构资料。
// 声母为空的 y/w 是零声母音节的拼写形式，不把 y/w 当成辅音声母。
const CORE_ROWS = {
  '': 'a o e ai ei ao ou an en ang eng er yi ya ye yao you yan yin yang ying wu wa wo wai wei wan wen wang weng yu yue yuan yun yong',
  b: 'ba bo bai bei bao ban ben bang beng bi bie biao bian bin bing bu',
  p: 'pa po pai pei pao pou pan pen pang peng pi pie piao pian pin ping pu',
  m: 'ma mo me mai mei mao mou man men mang meng mi mie miao miu mian min ming mu',
  f: 'fa fo fei fou fan fen fang feng fu',
  d: 'da de dai dei dao dou dan dang deng di die diao diu dian ding du duo dui duan dun dong',
  t: 'ta te tai tao tou tan tang teng ti tie tiao tian ting tu tuo tui tuan tun tong',
  n: 'na ne nai nei nao nan nen nang neng ni nie niao niu nian nin niang ning nu nuo nuan nun nong nü nüe',
  l: 'la le lai lei lao lou lan lang leng li lia lie liao liu lian lin liang ling lu luo luan lun long lü lüe',
  g: 'ga ge gai gei gao gou gan gen gang geng gu gua guo guai gui guan gun guang gong',
  k: 'ka ke kai kao kou kan ken kang keng ku kua kuo kuai kui kuan kun kuang kong',
  h: 'ha he hai hei hao hou han hen hang heng hu hua huo huai hui huan hun huang hong',
  j: 'ji jia jie jiao jiu jian jin jiang jing ju jue juan jun jiong',
  q: 'qi qia qie qiao qiu qian qin qiang qing qu que quan qun qiong',
  x: 'xi xia xie xiao xiu xian xin xiang xing xu xue xuan xun xiong',
  zh: 'zha zhe zhi zhai zhao zhou zhan zhen zhang zheng zhu zhua zhuo zhuai zhui zhuan zhun zhuang zhong',
  ch: 'cha che chi chai chao chou chan chen chang cheng chu chuo chuai chui chuan chun chuang chong',
  sh: 'sha she shi shai shao shou shan shen shang sheng shu shua shuo shuai shui shuan shun shuang',
  r: 're ri rao rou ran ren rang reng ru ruo rui ruan run rong',
  z: 'za ze zi zai zei zao zou zan zen zang zeng zu zuo zui zuan zun zong',
  c: 'ca ce ci cai cao cou can cen cang ceng cu cuo cui cuan cun cong',
  s: 'sa se si sai sao sou san sen sang seng su suo sui suan sun song',
};

// 词典中可能出现但不在常用课堂音节表内的口语、方言或生僻读音。
const EXTENDED_ROWS = {
  '': 'ê yo m n ng hm hng eng',
  c: 'cei',
  ch: 'chua',
  d: 'den dia',
  k: 'kei',
  l: 'lo',
  n: 'nou nun',
  r: 'rua',
  sh: 'shei',
  t: 'tei',
  zh: 'zhei',
};

export const INITIAL_GROUPS = [
  { label: '零声母', values: [''] },
  { label: '双唇 / 唇齿', values: ['b', 'p', 'm', 'f'] },
  { label: '舌尖中', values: ['d', 't', 'n', 'l'] },
  { label: '舌根音', values: ['g', 'k', 'h'] },
  { label: '舌面音', values: ['j', 'q', 'x'] },
  { label: '平舌音', values: ['z', 'c', 's'] },
  { label: '翘舌音', values: ['zh', 'ch', 'sh', 'r'] },
];

export const FINAL_GROUPS = [
  { label: '单韵母', values: ['a', 'o', 'e', 'i', 'u', 'ü'] },
  { label: '复韵母', values: ['ai', 'ei', 'ao', 'ou', 'ia', 'ie', 'iao', 'iou', 'ua', 'uo', 'uai', 'uei', 'üe'] },
  { label: '前鼻韵母', values: ['an', 'en', 'ian', 'in', 'uan', 'uen', 'üan', 'ün'] },
  { label: '后鼻韵母', values: ['ang', 'eng', 'ong', 'iang', 'ing', 'uang', 'ueng', 'iong'] },
  { label: '特殊韵母 / 音节', values: ['er', '-i', 'ê', 'yo', 'm', 'n', 'ng', 'hm', 'hng'] },
];

export const WHOLE_READING = new Set('zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying'.split(' '));
export const ALL_INITIALS = INITIAL_GROUPS.flatMap((group) => group.values);
export const ALL_FINALS = FINAL_GROUPS.flatMap((group) => group.values);
export const ALL_MEDIALS = ['i', 'u', 'ü'];

const zeroFinals = {
  yi: 'i', ya: 'ia', ye: 'ie', yao: 'iao', you: 'iou', yan: 'ian', yin: 'in', yang: 'iang', ying: 'ing',
  wu: 'u', wa: 'ua', wo: 'uo', wai: 'uai', wei: 'uei', wan: 'uan', wen: 'uen', wang: 'uang', weng: 'ueng',
  yu: 'ü', yue: 'üe', yuan: 'üan', yun: 'ün', yong: 'iong',
};

function getFinal(spelling, initial) {
  if (!initial) return zeroFinals[spelling] || spelling;
  if ('zhi chi shi ri zi ci si'.split(' ').includes(spelling)) return '-i';
  let rest = spelling.slice(initial.length);
  if (['j', 'q', 'x'].includes(initial) && rest.startsWith('u')) rest = `ü${rest.slice(1)}`;
  if (rest === 'iu') return 'iou';
  if (rest === 'ui') return 'uei';
  if (rest === 'un') return 'uen';
  if (rest === 'ün') return 'ün';
  if (['j', 'q', 'x'].includes(initial) && rest === 'ün') return 'ün';
  return rest;
}

function getMedial(final) {
  if (!/^[iuü]/.test(final) || final.length < 2) return '';
  const rest = final.slice(1);
  return /[aeo]/.test(rest) ? final[0] : '';
}

function makeRecord(spelling, initial, rare) {
  const final = getFinal(spelling, initial);
  const medial = getMedial(final);
  const kind = WHOLE_READING.has(spelling) ? '整体认读' : !initial ? '零声母' : medial ? '三拼音节' : '两拼音节';
  const finalKind = FINAL_GROUPS.find((group) => group.values.includes(final))?.label || '特殊韵母';
  return { spelling, initial, final, medial, kind, finalKind, rare };
}

const entries = [];
for (const [initial, row] of Object.entries(CORE_ROWS)) {
  for (const spelling of row.split(' ')) entries.push(makeRecord(spelling, initial, false));
}
for (const [initial, row] of Object.entries(EXTENDED_ROWS)) {
  for (const spelling of row.split(' ')) {
    if (!entries.some((entry) => entry.spelling === spelling)) entries.push(makeRecord(spelling, initial, true));
  }
}

export const SYLLABLES = entries;

const TONE_VOWELS = {
  a: ['a', 'ā', 'á', 'ǎ', 'à'], e: ['e', 'ē', 'é', 'ě', 'è'], i: ['i', 'ī', 'í', 'ǐ', 'ì'],
  o: ['o', 'ō', 'ó', 'ǒ', 'ò'], u: ['u', 'ū', 'ú', 'ǔ', 'ù'], ü: ['ü', 'ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

export function withTone(spelling, tone) {
  if (tone === 0) return spelling;
  const vowel = spelling.includes('a') ? 'a'
    : spelling.includes('e') ? 'e'
      : spelling.includes('o') ? 'o'
        : [...spelling].reverse().find((letter) => 'iuü'.includes(letter));
  if (vowel) {
    const index = spelling.lastIndexOf(vowel);
    return `${spelling.slice(0, index)}${TONE_VOWELS[vowel][tone]}${spelling.slice(index + 1)}`;
  }
  // ê 与鼻音音节没有普通元音；hm/hng 的调号落在实际发声的 m/n 上。
  const index = spelling.startsWith('h') ? 1 : 0;
  const marked = `${spelling.slice(0, index + 1)}${['', '\u0304', '\u0301', '\u030c', '\u0300'][tone]}${spelling.slice(index + 1)}`;
  return marked.normalize('NFC');
}

export const TONES = [
  { value: 1, name: '一声', mark: 'ā', description: '阴平' },
  { value: 2, name: '二声', mark: 'á', description: '阳平' },
  { value: 3, name: '三声', mark: 'ǎ', description: '上声' },
  { value: 4, name: '四声', mark: 'à', description: '去声' },
  { value: 0, name: '轻声', mark: 'a', description: '不标调' },
];
