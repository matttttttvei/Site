// logic.js — чистая логика, кэширование и фотореалистичный ГОСТ-рендеринг номеров РФ

const CONFIG = {
  basePrice: 1000,
  maxPrice: 5000000,
  pElite: 0.015,
  pNice: 0.075,
  pLettersTriple: 0.03,
  pLettersPair: 0.05,
  pLettersWord: 0.04,
  pSpecialPlate: 0.0035,
  rarityFrom: [0, 8000, 40000, 200000, 800000, 2500000]
};

const RARITY_NAMES = ['Обычный', 'Необычный', 'Редкий', 'Эпический', 'Легендарный', 'Мифический'];

const LETTERS = ['А', 'В', 'Е', 'К', 'М', 'Н', 'О', 'Р', 'С', 'Т', 'У', 'Х'];

const WORDS = ['МАМ', 'ТОР', 'КАМ', 'РОС', 'МОС', 'СОС', 'ТАК', 'КОТ', 'ТОК', 'КОМ', 'РОК', 'НЕТ', 'ТОМ', 'ССУ', 'ВКО', 'ХАМ'];
const WORDS_SET = new Set(WORDS);

const SPECIAL_PLATES = [
  { l1: 'А', d: '111', l2: 'Т', l3: 'В', reg: '777', note: 'Серия А111ТВ 777 (Оригинал с фото)', price: 4600000, rarity: 5 },
  { l1: 'О', d: '777', l2: 'Е', l3: 'Р', reg: '78', note: 'Питерский О777ЕР 78 (Оригинал с фото)', price: 4800000, rarity: 5 },
  { l1: 'С', d: '000', l2: 'С', l3: 'У', reg: '777', note: 'Спецсерия С000СУ 777', price: 5000000, rarity: 5 },
  { l1: 'В', d: '004', l2: 'К', l3: 'О', reg: '777', note: 'Спецсерия В004КО 777', price: 4500000, rarity: 5 },
  { l1: 'С', d: '777', l2: 'С', l3: 'У', reg: '777', note: 'Спецсерия С777СУ 777', price: 5000000, rarity: 5 },
  { l1: 'В', d: '777', l2: 'К', l3: 'О', reg: '777', note: 'Спецсерия В777КО 777', price: 5000000, rarity: 5 },
  { l1: 'А', d: '001', l2: 'М', l3: 'Р', reg: '97', note: 'Правительственная серия АМР', price: 5000000, rarity: 5 },
  { l1: 'Е', d: '777', l2: 'К', l3: 'Х', reg: '77', note: 'Серия ЕКХ (Еду Как Хочу)', price: 5000000, rarity: 5 },
  { l1: 'В', d: '001', l2: 'О', l3: 'Р', reg: '777', note: 'Блатной номер В001ОР', price: 3500000, rarity: 5 },
  { l1: 'Х', d: '666', l2: 'А', l3: 'М', reg: '777', note: 'Дьявольский ХАМ', price: 4000000, rarity: 5 },
  { l1: 'К', d: '777', l2: 'О', l3: 'Т', reg: '777', note: 'Золотой КОТ', price: 5000000, rarity: 5 },
  { l1: 'Т', d: '001', l2: 'О', l3: 'Р', reg: '777', note: 'Молот ТОРа', price: 3000000, rarity: 5 },
  { l1: 'С', d: '666', l2: 'О', l3: 'С', reg: '777', note: 'Экстренный СОС', price: 3200000, rarity: 5 },
  { l1: 'Н', d: '001', l2: 'Е', l3: 'Т', reg: '777', note: 'Номер НЕТ', price: 2800000, rarity: 5 },
  { l1: 'О', d: '001', l2: 'О', l3: 'О', reg: '77', note: 'Три Ольги (ООО)', price: 4200000, rarity: 5 },
  { l1: 'А', d: '777', l2: 'А', l3: 'А', reg: '77', note: 'Три Анны (ААА 77)', price: 5000000, rarity: 5 }
];

// Быстрый индекс спецномеров O(1) вместо линейного перебора .find()
const SPECIAL_LOOKUP = new Map();
for (let i = 0; i < SPECIAL_PLATES.length; i++) {
  const sp = SPECIAL_PLATES[i];
  SPECIAL_LOOKUP.set(sp.l1 + sp.d + sp.l2 + sp.l3 + '|' + sp.reg, sp.note);
}

const FOREIGN_RARE_PLATES = [
  { id: 'uae', country: 'UAE', countryName: 'ОАЭ (Дубай)', code: 'DUBAI 1', price: 150000000, rarity: 5, note: 'Дубай №1 (самый дорогой в мире)' },
  { id: 'uk', country: 'UK', countryName: 'Великобритания', code: 'F 1', price: 80000000, rarity: 5, note: 'Великобритания F 1' },
  { id: 'usa', country: 'USA', countryName: 'США (Калифорния)', code: 'CALIFORNIA 1', price: 40000000, rarity: 4, note: 'Калифорния №1 (США)' },
  { id: 'ch', country: 'CH', countryName: 'Швейцария (Цюрих)', code: 'ZH 1', price: 35000000, rarity: 4, note: 'Швейцария ZH 1 (Цюрих)' },
  { id: 'jp', country: 'JP', countryName: 'Япония (Токио)', code: '品川 500 77-77', price: 25000000, rarity: 4, note: 'Япония Синагава VIP' },
  { id: 'de', country: 'DE', countryName: 'Германия (Берлин)', code: 'B MW 777', price: 20000000, rarity: 3, note: 'Германия Берлин BMW' },
  { id: 'mc', country: 'MC', countryName: 'Монако', code: 'MC 001', price: 50000000, rarity: 5, note: 'Княжество Монако VIP 001' },
  { id: 'hk', country: 'HK', countryName: 'Гонконг', code: 'HK 8888', price: 60000000, rarity: 5, note: 'Гонконг счастливые восьмёрки' },
  { id: 'kz', country: 'KZ', countryName: 'Казахстан (Астана)', code: '001 AAA 01', price: 15000000, rarity: 3, note: 'Казахстан VIP 001' },
  { id: 'by', country: 'BY', countryName: 'Беларусь (Минск)', code: '0001 MI-7', price: 12000000, rarity: 3, note: 'Беларусь Минск VIP 0001' }
];

const ELITE_DIGITS = ['000', '777', '007', '111', '222', '333', '444', '555', '666', '888', '999', '123'];

const REGION_GROUPS = {
  moscow: ['77', '97', '99', '177', '197', '199', '777', '797', '799'],
  spb: ['78', '98', '178'],
  mo: ['50', '90', '150', '190', '750'],
  other: [
    '01', '02', '102', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '113', '14', '15', '16', '116', '716',
    '17', '18', '19', '20', '95', '21', '121', '22', '122', '23', '93', '123', '193', '223', '24', '84', '88', '124', '25', '125',
    '26', '126', '27', '28', '29', '30', '31', '32', '33', '34', '134', '35', '36', '136', '37', '38', '85', '138', '39', '91',
    '40', '41', '82', '42', '142', '43', '44', '45', '46', '47', '147', '48', '49', '51', '52', '152', '53', '54', '154', '55',
    '155', '56', '57', '58', '59', '81', '159', '60', '61', '161', '62', '63', '163', '763', '64', '164', '65', '66', '96', '196',
    '67', '68', '69', '70', '71', '72', '73', '173', '74', '174', '75', '80', '76', '79', '83', '86', '186', '87', '89', '92'
  ]
};

const MOSCOW_SET = new Set(REGION_GROUPS.moscow);
const SPB_SET = new Set(REGION_GROUPS.spb);
const MO_SET = new Set(REGION_GROUPS.mo);

const REGION_TABLE = [];
let REGION_TOTAL = 0;

function addRegionGroup(codes, w) {
  for (let i = 0; i < codes.length; i++) {
    REGION_TABLE.push({ code: codes[i], w });
    REGION_TOTAL += w;
  }
}
addRegionGroup(REGION_GROUPS.moscow, 6);
addRegionGroup(REGION_GROUPS.spb, 5);
addRegionGroup(REGION_GROUPS.mo, 4);
addRegionGroup(REGION_GROUPS.other, 1);

const SHELF_TIERS = [
  { name: 'Базовый', slots: 100, price: 0, color: '#6b7280' },
  { name: 'Ржавый', slots: 500, price: 20000, color: '#b7522a' },
  { name: 'Деревянный', slots: 1000, price: 100000, color: '#a0703c' },
  { name: 'Железный', slots: 2500, price: 500000, color: '#8d99a6' },
  { name: 'Бронзовый', slots: 5000, price: 3000000, color: '#cd7f32' },
  { name: 'Серебряный', slots: 10000, price: 20000000, color: '#c9d1d9' },
  { name: 'Золотой', slots: 20000, price: 150000000, color: '#ffc933' },
  { name: 'Алмазный', slots: 50000, price: 1000000000, color: '#6be6ff' }
];

const rnd = (n, rng) => (rng() * n) | 0;

function niceDigits(rng) {
  const k = rnd(5, rng);
  const x = 1 + rnd(9, rng);
  if (k === 0) return '00' + x;
  if (k === 1) return x + '00';
  if (k === 2) {
    const up = rng() < 0.5;
    if (up) { const s = rnd(8, rng); return '' + s + (s + 1) + (s + 2); }
    const s = 2 + rnd(8, rng);
    return '' + s + (s - 1) + (s - 2);
  }
  if (k === 3) {
    let b = rnd(10, rng); if (b === x) b = (b + 1) % 10;
    return '' + x + b + x;
  }
  let c = rnd(10, rng); if (c === x) c = (c + 1) % 10;
  return rng() < 0.5 ? '' + x + x + c : '' + c + x + x;
}

function pickDigits(rng) {
  const r = rng();
  if (r < CONFIG.pElite) return ELITE_DIGITS[rnd(ELITE_DIGITS.length, rng)];
  if (r < CONFIG.pElite + CONFIG.pNice) return niceDigits(rng);
  const n = rnd(1000, rng);
  return n < 10 ? '00' + n : (n < 100 ? '0' + n : '' + n);
}

function pickLetters(rng) {
  const pick = () => LETTERS[rnd(LETTERS.length, rng)];
  const r = rng();
  const a = CONFIG.pLettersTriple, b = a + CONFIG.pLettersPair, c = b + CONFIG.pLettersWord;
  if (r < a) { const x = pick(); return [x, x, x]; }
  if (r < b) { const x = pick(), y = pick(); return [x, y, y]; }
  if (r < c) { const w = WORDS[rnd(WORDS.length, rng)]; return [w[0], w[1], w[2]]; }
  return [pick(), pick(), pick()];
}

function pickRegion(rng) {
  let t = rng() * REGION_TOTAL;
  for (let i = 0; i < REGION_TABLE.length; i++) {
    t -= REGION_TABLE[i].w;
    if (t < 0) return REGION_TABLE[i].code;
  }
  return REGION_TABLE[REGION_TABLE.length - 1].code;
}

function generatePlate(rng = Math.random) {
  if (rng() < CONFIG.pSpecialPlate) {
    const sp = SPECIAL_PLATES[rnd(SPECIAL_PLATES.length, rng)];
    return { l1: sp.l1, d: sp.d, l2: sp.l2, l3: sp.l3, reg: sp.reg, note: sp.note };
  }
  const [l1, l2, l3] = pickLetters(rng);
  return { l1, d: pickDigits(rng), l2, l3, reg: pickRegion(rng) };
}

function digitRule(d) {
  const a = +d[0], b = +d[1], c = +d[2];
  const triple = (a === b && b === c);
  if (d === '000') return [500, 'Три нуля'];
  if (d === '777') return [250, 'Счастливые семёрки'];
  if (d === '007') return [150, 'Агент 007'];
  if (triple) return [120, d === '666' ? 'Дьявольское число' : 'Три одинаковые цифры'];
  if (a === 0 && b === 0 && c >= 1) return [60, 'Два нуля'];
  if (d === '123') return [40, 'Последовательность 1-2-3'];
  if (b === 0 && c === 0 && a >= 1) return [30, 'Круглое число'];
  if ((b === a + 1 && c === b + 1) || (b === a - 1 && c === b - 1)) return [25, 'Лесенка'];
  if (a === c && a !== b) return [8, 'Зеркальные цифры'];
  if (a === b || b === c) return [3, 'Пара одинаковых цифр'];
  return [1, null];
}

function lettersRule(l1, l2, l3) {
  const triple = (l1 === l2 && l2 === l3);
  if (triple) return [40, 'Три одинаковые буквы'];
  const s = l1 + l2 + l3;
  if (WORDS_SET.has(s)) return [15, 'Слово ' + s];
  if (l2 === l3) return [4, 'Парные буквы'];
  return [1, null];
}

function regionRule(reg) {
  if (MOSCOW_SET.has(reg)) return [5, 'Москва'];
  if (SPB_SET.has(reg)) return [3, 'Санкт-Петербург'];
  if (MO_SET.has(reg)) return [2, 'Московская область'];
  return [1, null];
}

function rarityOf(price) {
  let r = 0;
  for (let i = 0; i < CONFIG.rarityFrom.length; i++) {
    if (price >= CONFIG.rarityFrom[i]) r = i;
  }
  return r;
}

function formatMoney(n) {
  const s = String(Math.round(n));
  let out = '';
  const len = s.length;
  for (let i = 0; i < len; i++) {
    if (i > 0 && (len - i) % 3 === 0) out += ' ';
    out += s[i];
  }
  return out + ' ₽';
}

function calculatePrice(p) {
  if (p.isForeign) {
    return {
      price: p.price || 10000000,
      rarity: p.rarity != null ? p.rarity : rarityOf(p.price || 10000000),
      tags: [p.note || p.country || 'Иностранный раритет']
    };
  }

  if (p.isCustom) {
    const price = p.price || 1000000;
    return {
      price,
      rarity: p.rarity != null ? p.rarity : rarityOf(price),
      tags: [p.note || 'Кастомный номер разработчика']
    };
  }

  const [dMult, dTag] = digitRule(p.d);
  const [lMult, lTag] = lettersRule(p.l1, p.l2, p.l3);
  const [rMult, rTag] = regionRule(p.reg);

  let cMult = 1;
  const tags = [];
  if (dTag) tags.push(dTag);
  if (lTag) tags.push(lTag);
  if (rTag) tags.push(rTag);
  if (p.note) tags.push(p.note);

  const triple = (p.d[0] === p.d[1] && p.d[1] === p.d[2]);
  if (triple && (p.reg === p.d[0] + p.d[0] || p.reg === p.d[0] + p.d[0] + p.d[0])) {
    cMult *= 80;
    tags.push('Золотой номер: цифры и регион совпадают');
  } else if ((p.reg.length === 2 && p.d.indexOf(p.reg) !== -1) || p.reg === p.d) {
    cMult *= 10;
    tags.push('Цифры как в регионе');
  }

  if (triple && (p.l1 === p.l2 && p.l2 === p.l3)) {
    cMult *= 3;
    tags.push('Полный комплект: три буквы и три цифры');
  }

  const raw = CONFIG.basePrice * dMult * lMult * rMult * cMult;
  let price = Math.round(raw / 100) * 100;
  if (price > CONFIG.maxPrice) price = CONFIG.maxPrice;

  if (p.price && p.price > price) {
    price = p.price;
  }

  const rarity = (p.rarity != null) ? p.rarity : rarityOf(price);
  return { price, rarity, tags };
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plateToStr(p) {
  if (p.isForeign) {
    return 'F|' + p.country + '|' + (p.code || '') + '|' + p.price + '|' + p.rarity + '|' + encodeURIComponent(p.note || '');
  }
  if (p.isCustom) {
    return 'C|' + encodeURIComponent(p.l1 || '') + '|' + encodeURIComponent(p.d || '') + '|' + encodeURIComponent(p.l2 || '') + '|' + encodeURIComponent(p.l3 || '') + '|' + (p.reg || '') + '|' + p.price + '|' + p.rarity + '|' + encodeURIComponent(p.note || '');
  }
  const base = p.l1 + p.d + p.l2 + p.l3 + '|' + p.reg + '|' + p.price;
  if (p.note) {
    return base + '|' + encodeURIComponent(p.note);
  }
  return base;
}

function plateFromStr(s) {
  if (s.startsWith('F|')) {
    const parts = s.split('|');
    return {
      isForeign: true,
      country: parts[1],
      code: parts[2],
      price: +parts[3],
      rarity: +parts[4],
      note: decodeURIComponent(parts[5] || '')
    };
  }
  if (s.startsWith('C|')) {
    const parts = s.split('|');
    return {
      isCustom: true,
      l1: decodeURIComponent(parts[1] || ''),
      d: decodeURIComponent(parts[2] || ''),
      l2: decodeURIComponent(parts[3] || ''),
      l3: decodeURIComponent(parts[4] || ''),
      reg: parts[5] || '',
      price: +parts[6],
      rarity: +parts[7],
      note: decodeURIComponent(parts[8] || '')
    };
  }
  const parts = s.split('|');
  const main = parts[0];
  const reg = parts[1];
  const price = parts[2];
  const l1 = main[0];
  const d = main.slice(1, 4);
  const l2 = main[4];
  const l3 = main[5];

  if (parts.length >= 4 && parts[3]) {
    const note = decodeURIComponent(parts[3]);
    return { l1, d, l2, l3, reg, price: +price, note };
  }

  const spNote = SPECIAL_LOOKUP.get(main + '|' + reg);
  if (spNote) {
    return { l1, d, l2, l3, reg, price: +price, note: spNote };
  }

  return { l1, d, l2, l3, reg, price: +price };
}

function makeForeignPlateSvg(p) {
  const c = p.country || 'UAE';
  const rawCode = p.code != null ? String(p.code) : 'VIP';
  const code = escapeHtml(rawCode);

  if (c === 'UAE') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="3" y="3" width="1274" height="278" rx="26" fill="url(#pl-rim)" stroke="#475569" stroke-width="2"/>` +
      `<rect x="11" y="11" width="1258" height="262" rx="20" fill="url(#pl-metal)" stroke="#111827" stroke-width="8"/>` +
      `<circle cx="62" cy="142" r="11" fill="url(#pl-hole)"/><circle cx="1218" cy="142" r="11" fill="url(#pl-hole)"/>` +
      `<rect x="112" y="42" width="330" height="200" rx="14" fill="#0b1b3d"/>` +
      `<text x="277" y="116" font-size="52" font-family="Arial,sans-serif" font-weight="900" fill="#f59e0b" text-anchor="middle" letter-spacing="4">DUBAI</text>` +
      `<text x="277" y="196" font-size="70" font-family="serif" font-weight="700" fill="#ffffff" text-anchor="middle">دبي</text>` +
      `<text x="824" y="213" font-size="220" font-family="Arial,sans-serif" font-weight="900" fill="#94a3b8" text-anchor="middle">${escapeHtml(rawCode.replace('DUBAI ', ''))}</text>` +
      `<text x="820" y="210" font-size="220" font-family="Arial,sans-serif" font-weight="900" fill="#0b1b3d" text-anchor="middle">${escapeHtml(rawCode.replace('DUBAI ', ''))}</text>` +
      `<rect x="11" y="11" width="1258" height="262" rx="20" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'UK') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="22" fill="#f59e0b" stroke="#111" stroke-width="9"/>` +
      `<rect x="20" y="20" width="112" height="244" rx="8" fill="#1e3a8a"/>` +
      `<text x="76" y="178" font-size="52" font-family="Arial,sans-serif" font-weight="800" fill="#fff" text-anchor="middle">UK</text>` +
      `<text x="694" y="216" font-size="210" font-family="Arial,sans-serif" font-weight="900" fill="rgba(255,255,255,0.45)" text-anchor="middle">${code}</text>` +
      `<text x="690" y="212" font-size="210" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">${code}</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'USA') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="24" fill="url(#pl-metal)" stroke="#1e293b" stroke-width="9"/>` +
      `<text x="640" y="76" font-size="52" font-family="Georgia,serif" font-style="italic" font-weight="bold" fill="#dc2626" text-anchor="middle">California</text>` +
      `<text x="644" y="214" font-size="162" font-family="Arial,sans-serif" font-weight="900" fill="#cbd5e1" text-anchor="middle">${escapeHtml(rawCode.replace('CALIFORNIA ', ''))}</text>` +
      `<text x="640" y="210" font-size="162" font-family="Arial,sans-serif" font-weight="900" fill="#1e3a8a" text-anchor="middle">${escapeHtml(rawCode.replace('CALIFORNIA ', ''))}</text>` +
      `<rect x="1110" y="40" width="90" height="44" rx="6" fill="#2563eb"/><text x="1155" y="70" font-size="26" font-family="Arial,sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">OCT</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="24" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'CH') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="20" fill="url(#pl-metal)" stroke="#111" stroke-width="10"/>` +
      `<rect x="60" y="78" width="110" height="130" rx="10" fill="#dc2626"/>` +
      `<rect x="98" y="93" width="34" height="100" fill="#fff"/><rect x="75" y="126" width="80" height="34" fill="#fff"/>` +
      `<text x="680" y="210" font-size="210" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">${code}</text>` +
      `<rect x="1110" y="78" width="110" height="130" rx="10" fill="#2563eb"/>` +
      `<polygon points="1110,78 1220,208 1110,208" fill="#fff"/>` +
      `<rect x="8" y="8" width="1264" height="268" rx="20" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'JP') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="20" fill="url(#pl-metal)" stroke="#166534" stroke-width="10"/>` +
      `<text x="640" y="95" font-size="68" font-family="sans-serif" font-weight="900" fill="#166534" text-anchor="middle">品川 500</text>` +
      `<text x="360" y="232" font-size="98" font-family="sans-serif" font-weight="bold" fill="#166534">さ</text>` +
      `<text x="730" y="236" font-size="168" font-family="Arial,sans-serif" font-weight="900" fill="#166534" text-anchor="middle">77-77</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="20" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'DE') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="20" fill="url(#pl-metal)" stroke="#111" stroke-width="10"/>` +
      `<rect x="20" y="20" width="120" height="244" rx="8" fill="#003399"/>` +
      `<text x="80" y="208" font-size="74" font-family="Arial,sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">D</text>` +
      `<text x="700" y="210" font-size="185" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">${code}</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="20" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'MC') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-metal)" stroke="#0284c7" stroke-width="10"/>` +
      `<rect x="60" y="58" width="100" height="148" fill="#dc2626"/>` +
      `<text x="700" y="192" font-size="188" font-family="Arial,sans-serif" font-weight="900" fill="#0369a1" text-anchor="middle">${code}</text>` +
      `<text x="700" y="252" font-size="33" font-family="Arial,sans-serif" font-weight="bold" fill="#dc2626" text-anchor="middle">PRINCIPAUTE DE MONACO</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'HK') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="18" fill="#facc15" stroke="#111" stroke-width="10"/>` +
      `<text x="640" y="212" font-size="202" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">${code}</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="18" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  if (c === 'KZ') {
    return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-metal)" stroke="#111" stroke-width="10"/>` +
      `<rect x="20" y="20" width="120" height="244" rx="8" fill="#00afca"/>` +
      `<circle cx="80" cy="98" r="25" fill="#f59e0b"/>` +
      `<text x="80" y="212" font-size="50" font-family="Arial,sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">KZ</text>` +
      `<rect x="1040" y="20" width="7" height="244" fill="#111"/>` +
      `<text x="580" y="214" font-size="206" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">001 AAA</text>` +
      `<text x="1155" y="206" font-size="158" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">01</text>` +
      `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-sheen)"/>` +
      `</svg>`;
  }
  return `<svg class="plate plate-foreign" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-metal)" stroke="#111" stroke-width="10"/>` +
    `<rect x="20" y="20" width="128" height="122" rx="6" fill="#dc2626"/>` +
    `<rect x="20" y="142" width="128" height="122" rx="6" fill="#16a34a"/>` +
    `<text x="84" y="222" font-size="48" font-family="Arial,sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">BY</text>` +
    `<text x="700" y="214" font-size="198" font-family="Arial,sans-serif" font-weight="900" fill="#0a0a0a" text-anchor="middle">${code}</text>` +
    `<rect x="8" y="8" width="1264" height="268" rx="22" fill="url(#pl-sheen)"/>` +
    `</svg>`;
}

// Лазерные защитные голограммы ГОСТ с микро-текстом RUS (как на фото 6566.jpg и 6565.jpg)
const HOLO_STAMPS =
  `<g opacity="0.46" font-family="Arial,sans-serif" font-weight="700" font-size="8" fill="#68707d" text-anchor="middle">` +
    `<rect x="86" y="48" width="26" height="22" rx="2" fill="#9ca3af" opacity="0.55"/><text x="99" y="62">RUS</text>` +
    `<rect x="86" y="202" width="26" height="22" rx="2" fill="#9ca3af" opacity="0.55"/><text x="99" y="216">RUS</text>` +
    `<rect x="330" y="48" width="26" height="22" rx="2" fill="#9ca3af" opacity="0.55"/><text x="343" y="62">RUS</text>` +
    `<rect x="462" y="202" width="26" height="22" rx="2" fill="#9ca3af" opacity="0.55"/><text x="475" y="216">RUS</text>` +
    `<rect x="646" y="48" width="26" height="22" rx="2" fill="#9ca3af" opacity="0.55"/><text x="659" y="62">RUS</text>` +
    `<rect x="782" y="202" width="26" height="22" rx="2" fill="#9ca3af" opacity="0.55"/><text x="795" y="216">RUS</text>` +
    `<rect x="946" y="162" width="24" height="20" rx="2" fill="#9ca3af" opacity="0.55"/><text x="958" y="175">RUS</text>` +
  `</g>`;

// Фотореалистичный флаг РФ с выдавленной фаской и насыщенными эмалевыми цветами (как на фото)
const RUS_FLAG =
  `<g>` +
    `<rect x="1124" y="189" width="100" height="58" rx="4" fill="#ffffff" stroke="#8e96a4" stroke-width="2"/>` +
    `<rect x="1126" y="191" width="96" height="54" rx="3" fill="#ffffff" stroke="#141619" stroke-width="3.2"/>` +
    `<rect x="1127.6" y="192.6" width="92.8" height="17" fill="#f8fafc"/>` +
    `<rect x="1127.6" y="209.6" width="92.8" height="17" fill="#00369c"/>` +
    `<rect x="1127.6" y="226.6" width="92.8" height="17" fill="#c82318"/>` +
  `</g>`;

// Генерация фотореалистичного SVG российского номера по ГОСТ Р 50577-93
function makePlateSvg(p, opts) {
  const full = !(opts && opts.full === false);

  // Если это мини-номер для полки шкафа и он уже сгенерирован — отдаем из кэша за 0.0001 мс!
  if (!full && p._miniSvg) {
    return p._miniSvg;
  }

  if (p.isForeign) {
    const fSvg = makeForeignPlateSvg(p);
    if (!full) p._miniSvg = fSvg;
    return fSvg;
  }

  const l1 = escapeHtml(p.l1 || '');
  const d = escapeHtml(p.d || '');
  const l2 = escapeHtml(p.l2 || '');
  const l3 = escapeHtml(p.l3 || '');
  const reg = escapeHtml(p.reg || '777');
  const strokeColor = p.isCustom ? '#4338ca' : 'url(#pl-ink)';
  const miniStrokeColor = p.isCustom ? '#4338ca' : '#121417';

  // Точные пропорции ГОСТ с фотографий А111ТВ 777 и О777ЕР 78:
  // Цифры заметно выше букв, но при этом стоят на одной нижней базовой линии (y="224"),
  // а между символами хорошо виден серебристый откос штампованного металла!
  let mainChars;
  if (p.isCustom) {
    const text = l1 + d + l2 + l3;
    mainChars = `<text x="465" y="222" font-size="210" text-anchor="middle">${text}</text>`;
  } else {
    const d0 = escapeHtml(d[0] || '0');
    const d1 = escapeHtml(d[1] || '0');
    const d2 = escapeHtml(d[2] || '0');
    mainChars =
      `<text x="148" y="224" font-size="184" text-anchor="middle">${l1}</text>` +
      `<text x="278" y="224" font-size="244" text-anchor="middle">${d0}</text>` +
      `<text x="412" y="224" font-size="244" text-anchor="middle">${d1}</text>` +
      `<text x="546" y="224" font-size="244" text-anchor="middle">${d2}</text>` +
      `<text x="692" y="224" font-size="184" text-anchor="middle">${l2}</text>` +
      `<text x="826" y="224" font-size="184" text-anchor="middle">${l3}</text>`;
  }

  const isTwoDigitReg = String(p.reg || '').length === 2;
  const regText = isTwoDigitReg
    ? `<text x="1082" y="172" font-size="178" text-anchor="middle" letter-spacing="2">${reg}</text>`
    : `<text x="1076" y="168" font-size="154" text-anchor="middle" textLength="216" lengthAdjust="spacingAndGlyphs">${reg}</text>`;

  const rusWord = `<text x="1034" y="242" font-size="54" text-anchor="middle" letter-spacing="5">RUS</text>`;
  const allText = mainChars + regText + rusWord;

  let svg = `<svg class="plate" viewBox="0 0 1280 284" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Номер ${l1}${d}${l2}${l3} ${reg}">` +
    // Завальцованная металлическая кромка алюминиевой заготовки
    `<rect x="2" y="2" width="1276" height="280" rx="28" fill="url(#pl-rim)" stroke="#525b69" stroke-width="2"/>` +
    // Внутренняя штампованная канавка по периметру
    `<rect x="9" y="9" width="1262" height="266" rx="23" fill="url(#pl-metal)" stroke="#aeb6c2" stroke-width="1.5"/>`;

  if (full) {
    // Защитные лазерные голограммы RUS на светоотражающей пленке
    svg += HOLO_STAMPS;

    // 3D-фаска выштамповки двух секций канта (белый металлический отсвет сверху-слева и тень откоса снизу-справа, как на фото 6566.jpg)
    svg += `<rect x="16.5" y="14.5" width="896" height="250" rx="17" fill="none" stroke="#ffffff" stroke-width="6.5"/>` +
           `<rect x="918.5" y="14.5" width="341" height="250" rx="17" fill="none" stroke="#ffffff" stroke-width="6.5"/>` +
           `<rect x="21.5" y="19.5" width="896" height="250" rx="17" fill="none" stroke="#8d96a5" stroke-width="6"/>` +
           `<rect x="923.5" y="19.5" width="341" height="250" rx="17" fill="none" stroke="#8d96a5" stroke-width="6"/>`;
  }

  // Черный штампованный бортик двух секций (основное окно + окно региона со скругленными углами у центральной перегородки)
  svg += `<rect x="19" y="17" width="896" height="250" rx="16" fill="none" stroke="${full ? strokeColor : miniStrokeColor}" stroke-width="9.5"/>` +
         `<rect x="921" y="17" width="341" height="250" rx="16" fill="none" stroke="${full ? strokeColor : miniStrokeColor}" stroke-width="9.5"/>`;

  // Реалистичные отверстия под болты крепления с металлической развальцовкой (точно в позициях ГОСТ)
  svg += `<circle cx="54" cy="142" r="10.5" fill="url(#pl-hole)"/>` +
         `<circle cx="1228" cy="142" r="10.5" fill="url(#pl-hole)"/>`;

  if (full) {
    // 3D-ступенька выдавленного алюминия под черными символами (светлый металлический склон штампа + тень рельефа)
    svg += `<g fill="#ffffff" stroke="#ffffff" stroke-width="4" stroke-linejoin="round" font-family="'Roboto Condensed','Arial Narrow',Arial,sans-serif" font-weight="700" transform="translate(-2.4, -2.4)">${allText}</g>` +
           `<g fill="#848d9c" stroke="#848d9c" stroke-width="3.5" stroke-linejoin="round" font-family="'Roboto Condensed','Arial Narrow',Arial,sans-serif" font-weight="700" transform="translate(2.8, 3.4)">${allText}</g>`;
  }

  // Основной прокрашенный слой выпуклых символов
  svg += `<g fill="${full ? 'url(#pl-ink)' : '#0c0d10'}" font-family="'Roboto Condensed','Arial Narrow',Arial,sans-serif" font-weight="700">${allText}</g>`;

  // Триколор РФ
  svg += RUS_FLAG;

  if (full) {
    // Тонкий глянцевый блик на грани черной краски + общий световой отсвет пластины
    svg += `<g fill="none" stroke="#ffffff" stroke-width="1.3" opacity="0.26" font-family="'Roboto Condensed','Arial Narrow',Arial,sans-serif" font-weight="700" transform="translate(-0.9, -0.9)">${allText}</g>` +
           `<rect x="10" y="10" width="1260" height="264" rx="22" fill="url(#pl-sheen)"/>`;
  }

  svg += `</svg>`;

  if (!full) {
    p._miniSvg = svg; // Кэшируем строку мини-номера
  }
  return svg;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG, LETTERS, WORDS, SPECIAL_PLATES, FOREIGN_RARE_PLATES, REGION_GROUPS, RARITY_NAMES, SHELF_TIERS,
    generatePlate, calculatePrice, rarityOf, makePlateSvg,
    plateToStr, plateFromStr, formatMoney, escapeHtml
  };
}
