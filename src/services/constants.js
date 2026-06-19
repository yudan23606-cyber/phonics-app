// src/services/constants.js  -- 设计系统与常量

// ===== 音素数据 =====
export const PHONEMES_PHASE2 = [
  { id: 's', phoneme: 's', set: 1, exampleWords: ['sun', 'sat', 'sip'] },
  { id: 'a', phoneme: 'a', set: 1, exampleWords: ['ant', 'at', 'am'] },
  { id: 't', phoneme: 't', set: 1, exampleWords: ['tap', 'top', 'ten'] },
  { id: 'p', phoneme: 'p', set: 1, exampleWords: ['pat', 'pin', 'pan'] },
  { id: 'i', phoneme: 'i', set: 2, exampleWords: ['pin', 'in', 'it'] },
  { id: 'n', phoneme: 'n', set: 2, exampleWords: ['net', 'nap', 'tin'] },
  { id: 'm', phoneme: 'm', set: 2, exampleWords: ['mat', 'man', 'map'] },
  { id: 'd', phoneme: 'd', set: 2, exampleWords: ['dog', 'dad', 'din'] },
  { id: 'g', phoneme: 'g', set: 3, exampleWords: ['got', 'gap', 'gas'] },
  { id: 'o', phoneme: 'o', set: 3, exampleWords: ['on', 'off', 'pot'] },
  { id: 'c', phoneme: 'c', set: 3, exampleWords: ['cat', 'cap', 'cot'] },
  { id: 'k', phoneme: 'k', set: 3, exampleWords: ['kit', 'kid', 'ken'] },
  { id: 'ck', phoneme: 'ck', set: 4, exampleWords: ['duck', 'sock', 'rock'] },
  { id: 'e', phoneme: 'e', set: 4, exampleWords: ['pet', 'red', 'pen'] },
  { id: 'u', phoneme: 'u', set: 4, exampleWords: ['up', 'run', 'sun'] },
  { id: 'r', phoneme: 'r', set: 4, exampleWords: ['run', 'rat', 'red'] },
  { id: 'h', phoneme: 'h', set: 5, exampleWords: ['hat', 'hot', 'hen'] },
  { id: 'b', phoneme: 'b', set: 5, exampleWords: ['bat', 'big', 'bed'] },
  { id: 'f', phoneme: 'f', set: 5, exampleWords: ['fun', 'fin', 'fat'] },
  { id: 'l', phoneme: 'l', set: 5, exampleWords: ['leg', 'lip', 'let'] }
]

export const SET_NAMES = {
  1: 'Set 1: s, a, t, p',
  2: 'Set 2: i, n, m, d',
  3: 'Set 3: g, o, c, k',
  4: 'Set 4: ck, e, u, r',
  5: 'Set 5: h, b, f, l'
}

// ===== 练习相关 =====
export const EXERCISE_TYPES = {
  READ_ALOUD: 'readAloud',
  LISTEN_CHOOSE: 'listenChoose'
}

export const SCORE_FEEDBACK = {
  3: { text: '太棒了！发音很标准！', color: '#66BB6A' },
  2: { text: '不错哦！继续加油！', color: '#FFB300' },
  1: { text: '再试一次，你可以的！', color: '#FF6F61' },
  0: { text: '这次好像没录到声音，再试一次~', color: '#FF5252' }
}

export const ENCOURAGEMENTS = [
  'Great job!', 'Well done!', 'Awesome!',
  'Fantastic!', 'Super!', 'Excellent!'
]

export const PRACTICE_CONFIG = {
  QUESTIONS_PER_DAY: 8,
  NEW_QUESTIONS: 5,
  REVIEW_QUESTIONS: 3,
  TIME_PER_QUESTION: 15,
  MAX_RECORD_DURATION: 10,
  MIN_RECORD_DURATION: 1,
  PASS_RATE: 0.6,
  PASS_DAYS: 3
}

// ===== 设计系统 =====

// 主色：珊瑚暖橙（儿童友好，温暖活泼）
const CORAL = '#FF7B6B'
const CORAL_DARK = '#E86150'
const CORAL_LIGHT = '#FFE8E0'

export const COLORS = {
  PRIMARY: CORAL,
  PRIMARY_DARK: CORAL_DARK,
  PRIMARY_LIGHT: CORAL_LIGHT,

  // 背景层次
  BG_MAIN: '#FFF8F0',
  BG_WHITE: '#FFFFFF',
  BG_GRAY: '#F5F0EB',
  BG_CARD: '#FFFFFF',

  // 点缀色
  ACCENT: '#FFB300',
  ACCENT_LIGHT: '#FFF3CD',
  STAR: '#FFD600',

  // 语义色
  CORRECT: '#66BB6A',
  CORRECT_LIGHT: '#E8F5E9',
  ERROR: '#FF5252',
  ERROR_LIGHT: '#FFEBEE',
  WARNING: '#FFB300',

  // 文字色
  TEXT_PRIMARY: '#4A3728',
  TEXT_SECONDARY: '#8D7B6F',
  TEXT_HINT: '#C4B5A8',

  // 分割线
  DIVIDER: '#F0E8E0',

  // 音素状态
  LOCKED: '#D7CCC8',
  LEARNING: '#FFD54F',
  RECORDING: '#FF5252'
}

// 5 组音素的专有色彩（用于卡片、图标底色）
export const SET_PALETTE = [
  { primary: '#FF7B6B', light: '#FFE8E0', label: '珊瑚' },
  { primary: '#5C9CE6', light: '#E3F2FD', label: '天蓝' },
  { primary: '#F5A623', light: '#FFF3CD', label: '琥珀' },
  { primary: '#66BB6A', light: '#E8F5E9', label: '草绿' },
  { primary: '#AB47BC', light: '#F3E5F5', label: '淡紫' }
]

// 排版系统
export const TYPOGRAPHY = {
  DISPLAY: { fontSize: 34, fontWeight: '700', lineHeight: 44 },
  TITLE_1: { fontSize: 24, fontWeight: '700', lineHeight: 32 },
  TITLE_2: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  TITLE_3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  BODY: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  BODY_BOLD: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  CAPTION: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  SMALL: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  PHONEME: { fontSize: 48, fontWeight: '700', lineHeight: 56 },
  PHONEME_CARD: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
  SCORE: { fontSize: 36, fontWeight: '800', lineHeight: 44 },
  STAR: { fontSize: 32 }
}

// 间距系统
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  HUGE: 48
}

// 圆角系统
export const RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  ROUND: 999
}

// 阴影系统
export const SHADOWS = {
  CARD: {
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  ELEVATED: {
    shadowColor: '#4A3728',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6
  },
  BUTTON: {
    shadowColor: CORAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  }
}

// ===== 工具函数 =====
export function formatDate(date) {
  const d = date || new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ===== 设置默认值 =====
export const SETTINGS_DEFAULTS = {
  questionsPerDay: 8,
  timePerQuestion: 15,
  includeWeakReview: true,
  weakReviewCount: 3,
  enableSetLock: true,
  ttsEnabled: true,
  ttsSpeed: 1.0,
}

// 每组需要掌握的百分比才能解锁下一组
export const SET_UNLOCK_THRESHOLD = 0.75 // 75%
