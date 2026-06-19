// TTS 服务：使用 Google Translate 免费 TTS 接口播发音素/单词示范
// 无需 API Key，返回 MP3 流，通过 expo-av 播放
import { Audio } from 'expo-av'

let currentSound = null

const TTS_BASE = 'https://translate.google.com/translate_tts'
const TTS_PARAMS = 'ie=UTF-8&tl=en&client=tw-ob'

/**
 * 播发指定文本的发音
 * @param {string} text - 要朗读的文本（音素或单词）
 * @param {object} options
 * @param {string} [options.lang='en'] - 语言代码
 * @param {number} [options.speed=1.0] - 语速
 * @returns {Promise<void>}
 */
export async function speak(text, options = {}) {
  const lang = options.lang || 'en'
  const q = encodeURIComponent(text)
  const url = `${TTS_BASE}?${TTS_PARAMS}&q=${q}&tl=${lang}`

  try {
    // 停止当前播放
    await stop()

    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true },
      onPlaybackStatusUpdate,
    )
    currentSound = sound
  } catch (err) {
    console.warn('TTS playback failed:', err.message)
    throw err
  }
}

/**
 * 播发音素（音素发音 = 字母本身的 sound）
 */
export async function speakPhoneme(phoneme) {
  return speak(phoneme, { lang: 'en' })
}

/**
 * 播发单词
 */
export async function speakWord(word) {
  return speak(word, { lang: 'en' })
}

function onPlaybackStatusUpdate(status) {
  if (status.didJustFinish) {
    currentSound = null
  }
}

/**
 * 停止当前播放
 */
export async function stop() {
  if (currentSound) {
    try {
      await currentSound.stopAsync()
      await currentSound.unloadAsync()
    } catch (_) {
      // ignore
    }
    currentSound = null
  }
}

/**
 * 销毁所有音频资源
 */
export function destroy() {
  stop()
}

export default { speak, speakPhoneme, speakWord, stop, destroy }
