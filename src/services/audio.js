// src/services/audio.js — 音频录制与播放（expo-av）
// 对应小程序 utils/audio.js 的安卓版实现

import { Audio } from 'expo-av'
import { PRACTICE_CONFIG } from './constants'

let recording = null
let sound = null
let recordingTimer = null

/**
 * 初始化音频权限
 * @returns {Promise<boolean>} 是否获得权限
 */
export async function requestPermissions() {
  try {
    const { granted } = await Audio.requestPermissionsAsync()
    if (!granted) {
      console.warn('麦克风权限被拒绝')
    }
    return granted
  } catch (err) {
    console.error('请求麦克风权限失败:', err)
    return false
  }
}

/**
 * 开始录音
 * @param {function} onTick - 每秒回调，参数 { duration }
 * @returns {Promise<void>}
 */
export async function startRecord(onTick) {
  try {
    // 确保上一段录音已清理
    await stopRecord()

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,  // Android 不受影响
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    })

    recording = new Audio.Recording()
    await recording.prepareToRecordAsync({
      android: {
        extension: '.mp3',
        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
        audioEncoder: Audio.AndroidAudioEncoder.AAC,
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 96000
      },
      isMeteringEnabled: true,
      web: { mimeType: 'audio/mp3', bitsPerSecond: 96000 }
    })

    await recording.startAsync()

    // 每秒回调更新 UI
    let duration = 0
    recordingTimer = setInterval(() => {
      duration += 1
      if (onTick) onTick(duration)
      if (duration >= PRACTICE_CONFIG.MAX_RECORD_DURATION) {
        stopRecord()
      }
    }, 1000)

    console.log('录音开始')
  } catch (err) {
    console.error('开始录音失败:', err)
    throw err
  }
}

/**
 * 停止录音
 * @returns {Promise<{uri: string, duration: number}|null>}
 */
export async function stopRecord() {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }

  if (!recording) return null

  try {
    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    const status = await recording.getStatusAsync()

    recording = null

    // 恢复播放模式
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    })

    if (!uri) return null

    const durationMs = status.durationMillis || 0

    // 最短录音检查
    if (durationMs < PRACTICE_CONFIG.MIN_RECORD_DURATION * 1000) {
      return { uri, duration: durationMs, tooShort: true }
    }

    return { uri, duration: durationMs, tooShort: false }
  } catch (err) {
    recording = null
    console.error('停止录音失败:', err)
    return null
  }
}

/**
 * 播放示范音频
 * @param {string} url - 音频 URL
 */
export async function playDemo(url) {
  if (!url) return

  try {
    // 先停止当前播放
    if (sound) {
      await sound.unloadAsync()
      sound = null
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: true }
    )
    sound = newSound

    sound.setOnPlaybackStatusUpdate(status => {
      if (status.didJustFinish) {
        sound = null
      }
    })
  } catch (err) {
    console.error('播放音频失败:', err)
  }
}

/**
 * 停止所有音频播放
 */
export function stopAll() {
  if (sound) {
    sound.unloadAsync().catch(() => {})
    sound = null
  }
}

/**
 * 销毁所有音频资源（页面卸载时调用）
 */
export function destroyAll() {
  if (recordingTimer) {
    clearInterval(recordingTimer)
    recordingTimer = null
  }
  if (recording) {
    recording.stopAndUnloadAsync().catch(() => {})
    recording = null
  }
  if (sound) {
    sound.unloadAsync().catch(() => {})
    sound = null
  }
}
