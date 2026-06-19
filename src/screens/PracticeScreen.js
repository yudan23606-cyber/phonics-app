import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import cloud from '../services/cloudbase'
import * as FileSystem from 'expo-file-system'
import * as audioService from '../services/audio'
import {
  PHONEMES_PHASE2, EXERCISE_TYPES, SCORE_FEEDBACK, ENCOURAGEMENTS,
  PRACTICE_CONFIG, SET_PALETTE,
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS,
} from '../services/constants'
import { speakPhoneme } from '../services/tts'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function PracticeScreen({ route, navigation }) {
  const set = route.params?.set || 1
  const phoneme = route.params?.phoneme || null

  // 当前组的色彩
  const palette = SET_PALETTE[set - 1] || SET_PALETTE[0]

  // 题目状态
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [exerciseType, setExerciseType] = useState(EXERCISE_TYPES.READ_ALOUD)
  const [results, setResults] = useState([])

  // 题型 A：跟读打分
  const [currentPhoneme, setCurrentPhoneme] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [scoreVisible, setScoreVisible] = useState(false)
  const [score, setScore] = useState(0)
  const [scoreFeedback, setScoreFeedback] = useState('')
  const [scoreColor, setScoreColor] = useState(COLORS.CORRECT)
  const [recognizedText, setRecognizedText] = useState('')
  const starAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  // 题型 B：听音选字母
  const [letterOptions, setLetterOptions] = useState([])
  const [correctLetters, setCorrectLetters] = useState('')
  const [targetWord, setTargetWord] = useState('')
  const [timeLeft, setTimeLeft] = useState(PRACTICE_CONFIG.TIME_PER_QUESTION)
  const [chooseResultVisible, setChooseResultVisible] = useState(false)
  const [chooseResultCorrect, setChooseResultCorrect] = useState(false)
  const [encouragement, setEncouragement] = useState('')
  const timerRef = useRef(null)

  // 入场动画
  const slideIn = useRef(new Animated.Value(30)).current
  const fadeIn = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadAndGenerate(set, phoneme)
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideIn, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start()
    return () => cleanup()
  }, [])

  const loadAndGenerate = async (setNum, targetPhoneme) => {
    let weakReview = []
    try {
      const AsyncStorage = require(\"@react-native-async-storage/async-storage\").default
      const raw = await AsyncStorage.getItem(\"@phonics_settings\")
      const settings = raw ? JSON.parse(raw) : {}
      if (settings.includeWeakReview !== false) {
        const uid = await cloud.getUserId()
        if (uid) {
          const records = await cloud.query(\"learning_records\", { _openid: uid }, {
            orderBy: { field: \"createdAt\", order: \"desc\" }, limit: 100,
          })
          const scoreMap = {}
          records.forEach(r => {
            if (!scoreMap[r.phoneme]) scoreMap[r.phoneme] = []
            scoreMap[r.phoneme].push(r.score || 0)
          })
          weakReview = Object.entries(scoreMap)
            .filter(([_, scores]) => (scores.reduce((a, b) => a + b, 0) / scores.length) < 2)
            .map(([phoneme]) => phoneme)
            .slice(0, 3)
        }
      }
    } catch (_) {}
    generateQuestions(setNum, targetPhoneme, weakReview)
  }

{0}

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    audioService.destroyAll()
  }, [])

  const generateQuestions = (setNum, targetPhoneme, weakReview = []) => {
    const setPhonemes = PHONEMES_PHASE2.filter(p => p.set === setNum)
    const qs = []
    // 加入薄弱音素复习题
    if (weakReview.length > 0 && !targetPhoneme) {
      const weakPhonemeData = PHONEMES_PHASE2.filter(p => weakReview.includes(p.phoneme))
      weakPhonemeData.forEach((p, idx) => {
        qs.push({ type: EXERCISE_TYPES.READ_ALOUD, phoneme: p, index: idx })
        qs.push({ type: EXERCISE_TYPES.LISTEN_CHOOSE, phoneme: p, targetWord: p.exampleWords[0], index: idx + 1 })
      })
    }
    if (targetPhoneme) {
      const p = setPhonemes.find(item => item.phoneme === targetPhoneme)
      if (p) {
        qs.push({ type: EXERCISE_TYPES.READ_ALOUD, phoneme: p, index: 0 })
        qs.push({ type: EXERCISE_TYPES.LISTEN_CHOOSE, phoneme: p, targetWord: p.exampleWords[0], index: 1 })
      }
    } else {
      for (let i = 0; i < 5 && i < setPhonemes.length; i++) {
        qs.push({ type: EXERCISE_TYPES.READ_ALOUD, phoneme: setPhonemes[i], index: i })
      }
      for (let i = 0; i < 3 && i < setPhonemes.length; i++) {
        const p = setPhonemes[i]
        qs.push({ type: EXERCISE_TYPES.LISTEN_CHOOSE, phoneme: p, targetWord: p.exampleWords[0], index: 5 + i })
      }
    }
    setQuestions(qs)
    if (qs.length > 0) loadQuestion(qs, 0)
  }

  const loadQuestion = (qs, idx) => {
    if (idx >= qs.length) { finishPractice(); return }
    cleanup()
    setCurrentIndex(idx)
    setExerciseType(qs[idx].type)
    setScoreVisible(false)
    setScoring(false)
    setIsRecording(false)
    setChooseResultVisible(false)
    setRecognizedText('')
    setScore(0)
    starAnim.setValue(0)
    pulseAnim.setValue(1)

    if (qs[idx].type === EXERCISE_TYPES.READ_ALOUD) {
      setCurrentPhoneme(qs[idx].phoneme)
    } else {
      setupListenChoose(qs[idx])
    }

    // 重置入场动画
    slideIn.setValue(20)
    fadeIn.setValue(0)
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideIn, { toValue: 0, duration: 300, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start()
  }

  // ===== 听音选字母 =====
  const setupListenChoose = (question) => {
    const word = question.targetWord
    const letters = word.split('')
    const allPhonemes = PHONEMES_PHASE2.map(p => p.phoneme)

    const distractors = []
    while (distractors.length < 3) {
      const rand = allPhonemes[Math.floor(Math.random() * allPhonemes.length)]
      if (!letters.includes(rand) && !distractors.includes(rand)) {
        distractors.push(rand)
      }
    }

    const all = [...letters, ...distractors].map(l => ({
      letter: l, selected: false, correct: letters.includes(l), disabled: false,
    }))

    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[all[i], all[j]] = [all[j], all[i]]
    }

    setTargetWord(word)
    setCorrectLetters(letters.join(''))
    setLetterOptions(all)
    setTimeLeft(PRACTICE_CONFIG.TIME_PER_QUESTION)
    startTimer()
  }

  const startTimer = () => {
    let sec = PRACTICE_CONFIG.TIME_PER_QUESTION
    timerRef.current = setInterval(() => {
      sec -= 1
      if (sec <= 0) {
        clearInterval(timerRef.current)
        handleTimeout()
      } else {
        setTimeLeft(sec)
      }
    }, 1000)
  }

  const handleTimeout = () => {
    const enc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
    setChooseResultVisible(true)
    setChooseResultCorrect(false)
    setEncouragement(enc)
    setLetterOptions(prev => prev.map(item => ({ ...item, disabled: true })))
    setResults(prev => [...prev, { phoneme: currentPhoneme?.phoneme || '?', correct: false, score: 0 }])
  }

  // ===== 录音交互 =====
  const handleRecordStart = async () => {
    const granted = await audioService.requestPermissions()
    if (!granted) {
      Alert.alert('权限提示', '需要麦克风权限才能录音打分')
      return
    }
    setIsRecording(true)
    // 启动脉冲动画
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
      { iterations: -1 },
    ).start()

    try {
      await audioService.startRecord()
    } catch (err) {
      setIsRecording(false)
      pulseAnim.setValue(1)
      Alert.alert('录音失败', '请检查麦克风是否被其他应用占用')
    }
  }

  const handleRecordEnd = async () => {
    if (!isRecording) return
    setIsRecording(false)
    pulseAnim.setValue(1)
    const result = await audioService.stopRecord()
    if (!result) return
    if (result.tooShort) {
      Alert.alert('提示', '录音时间太短，请按住录音按钮至少 1 秒')
      return
    }
    processAudio(result.uri)
  }

  const processAudio = async (localUri) => {
    setScoring(true)
    try {
      const target = currentPhoneme?.phoneme || ''
      try {
        const uid = await cloud.getUserId()
        const cloudPath = `recordings/${uid}_${Date.now()}.mp3`
        const uploadRes = await cloud.uploadFile(cloudPath, localUri)
        const result = await cloud.callFunction('scoreEngine', {
          audioFileId: uploadRes.fileID,
          targetPhoneme: target,
        })
        const scoreData = result.data || result || {}
        showScoreResult(scoreData)
        return
      } catch (uploadErr) {
        console.warn('云存储上传失败，尝试 base64 直传:', uploadErr.message)
      }

      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      })
      const result = await cloud.callFunction('scoreEngine', {
        audioBase64: base64,
        targetPhoneme: target,
      })
      const scoreData = result.data || result || {}
      showScoreResult(scoreData)
    } catch (err) {
      console.error('评分失败:', err)
      showScoreResult({ score: 2, star: 2, recognized: '...', target: currentPhoneme?.phoneme, feedback: '网络波动，默认评分' })
    }
  }

  const showScoreResult = (result) => {
    const star = result.score ?? result.star ?? 2
    const fb = SCORE_FEEDBACK[star] || SCORE_FEEDBACK[2]
    setScore(star)
    setScoreFeedback(fb.text)
    setScoreColor(fb.color)
    setRecognizedText(result.recognized || '')
    setScoring(false)
    setScoreVisible(true)

    starAnim.setValue(0)
    Animated.spring(starAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start()

    setResults(prev => [...prev, {
      phoneme: result.target || currentPhoneme?.phoneme || '?',
      correct: star >= 2,
      score: star,
    }])
  }

  // ===== 字母选择 =====
  const onLetterTap = (idx) => {
    const item = letterOptions[idx]
    if (item.disabled || item.selected) return
    clearInterval(timerRef.current)

    const isCorrect = correctLetters.includes(item.letter)
    const enc = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]

    setLetterOptions(prev => prev.map((opt, i) =>
      i === idx ? { ...opt, selected: true, correct: isCorrect } : { ...opt, disabled: true }
    ))
    setChooseResultVisible(true)
    setChooseResultCorrect(isCorrect)
    setEncouragement(enc)
    setResults(prev => [...prev, { phoneme: currentPhoneme?.phoneme || '?', correct: isCorrect, score: isCorrect ? 3 : 0 }])
  }

  const nextQuestion = () => loadQuestion(questions, currentIndex + 1)

  const finishPractice = () => {
    const total = results.length
    const correct = results.filter(r => r.correct).length
    const totalScore = results.reduce((sum, r) => sum + r.score, 0)
    navigation.replace('Result', { total, correct, totalScore, results: JSON.stringify(results), set })
  }

  const goBack = () => {
    Alert.alert('确认退出', '退出后本次练习进度将不会保存', [
      { text: '继续', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  const progressPct = ((currentIndex + 1) / questions.length) * 100

  // ===== 渲染 =====
  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕ 退出</Text>
        </TouchableOpacity>
        <Text style={styles.progressCount}>{currentIndex + 1}/{questions.length}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 进度条 */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {(exerciseType === EXERCISE_TYPES.READ_ALOUD && currentPhoneme) ? (
        <Animated.View style={[styles.practiceArea, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
          <Text style={styles.exerciseLabel}>跟读打分</Text>

          {/* 音素卡片 */}
          <View style={[styles.phonemeCard, { backgroundColor: palette.light, borderColor: palette.primary }]}>
            <Text style={[styles.phonemeText, { color: palette.primary }]}>{currentPhoneme.phoneme}</Text>
            <Text style={styles.phonemeSub}>{currentPhoneme.exampleWords.join(' · ')}</Text>
          </View>

          {/* 示范按钮 */}
          <TouchableOpacity style={[styles.demoBtn, { backgroundColor: palette.light }]} onPress={() => {
          speakPhoneme(currentPhoneme.phoneme)
          }}>
            <Text style={[styles.demoBtnText, { color: palette.primary }]}>🔊 听示范</Text>
          </TouchableOpacity>

          {/* 录音区域 */}
          <View style={styles.recordArea}>
            {scoring ? (
              <View style={styles.scoringBox}>
                <Text style={styles.scoringText}>评分中...</Text>
              </View>
            ) : !scoreVisible ? (
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                  onPressIn={handleRecordStart}
                  onPressOut={handleRecordEnd}
                  activeOpacity={0.7}
                >
                  <Text style={styles.recordBtnIcon}>{isRecording ? '🎤' : '🎙️'}</Text>
                  <Text style={styles.recordBtnText}>
                    {isRecording ? '松手结束' : '按住录音'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <View style={styles.scoreResult}>
                <Animated.View style={{ transform: [{ scale: starAnim }] }}>
                  <Text style={styles.starText}>
                    {score >= 3 ? '⭐⭐⭐' : score >= 2 ? '⭐⭐' : score >= 1 ? '⭐' : ''}
                  </Text>
                </Animated.View>
                <Text style={[styles.feedbackText, { color: scoreColor }]}>{scoreFeedback}</Text>
                {recognizedText ? (
                  <Text style={styles.recognizedLabel}>识别结果: {recognizedText}</Text>
                  {score < 2 && recognizedText ? (
                    <View style={{ marginTop: 8, padding: 12, backgroundColor: '${COLORS.ERROR_LIGHT}', borderRadius: 12 }}>
                      <Text style={{ fontSize: 13, color: COLORS.ERROR, textAlign: 'center' }}>
                        目标: {currentPhoneme?.phoneme}  
      你: {recognizedText}
                      </Text>
                    </View>
                  ) : null}
                ) : null}
                <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                  <Text style={styles.nextBtnText}>继续下一题 →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      ) : null}

      {/* 题型 B */}
      {exerciseType === EXERCISE_TYPES.LISTEN_CHOOSE ? (
        <Animated.View style={[styles.practiceArea, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
          <Text style={styles.exerciseLabel}>听音选字母</Text>

          {/* 计时器 */}
          <View style={styles.timerRow}>
            <View style={styles.timerTrack}>
              <View style={[styles.timerFill, {
                width: `${(timeLeft / PRACTICE_CONFIG.TIME_PER_QUESTION) * 100}%`,
                backgroundColor: timeLeft < 5 ? COLORS.ERROR : COLORS.PRIMARY,
              }]} />
            </View>
            <Text style={[styles.timerText, timeLeft < 5 && { color: COLORS.ERROR }]}>{timeLeft}s</Text>
          </View>

          {/* 提示 */}
          <View style={[styles.targetCard, { backgroundColor: palette.light }]}>
            <Text style={styles.targetSub}>听发音，选择单词中包含的字母</Text>
            <TouchableOpacity style={[styles.demoBtnSmall, { backgroundColor: palette.primary }]} onPress={() => {
              Alert.alert('提示', '单词发音将在接入 TTS 后可用')
            }}>
              <Text style={[styles.demoBtnText, { color: '#fff' }]}>🔊 听单词</Text>
            </TouchableOpacity>
          </View>

          {!chooseResultVisible ? (
            <View style={styles.letterGrid}>
              {letterOptions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.letterBtn,
                    { backgroundColor: palette.light, borderColor: palette.primary },
                    item.disabled && styles.letterBtnDisabled,
                  ]}
                  onPress={() => onLetterTap(idx)}
                  disabled={item.disabled}
                >
                  <Text style={[
                    styles.letterText,
                    { color: palette.primary },
                    item.disabled && styles.letterTextDisabled,
                  ]}>{item.letter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.scoreResult}>
              <Text style={styles.chooseResultIcon}>{chooseResultCorrect ? '✅' : '❌'}</Text>
              <Text style={[styles.chooseResultText, {
                color: chooseResultCorrect ? COLORS.CORRECT : COLORS.ERROR,
              }]}>
                {chooseResultCorrect ? encouragement : `正确答案: ${correctLetters}`}
              </Text>
              <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                <Text style={styles.nextBtnText}>继续下一题 →</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_MAIN },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.XL, paddingVertical: SPACING.MD,
  },
  backBtn: { padding: SPACING.XS },
  backBtnText: { fontSize: 16, color: COLORS.TEXT_SECONDARY },
  progressCount: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_PRIMARY },
  progressTrack: { height: 4, backgroundColor: COLORS.DIVIDER, marginHorizontal: SPACING.XL, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.PRIMARY, borderRadius: 2 },

  practiceArea: { flex: 1, alignItems: 'center', paddingTop: SPACING.XL, paddingHorizontal: SPACING.XL },
  exerciseLabel: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY, marginBottom: SPACING.LG },

  // 音素卡片
  phonemeCard: {
    borderRadius: RADIUS.XL, paddingHorizontal: 50, paddingVertical: SPACING.XXL,
    marginBottom: SPACING.XL, borderWidth: 2, alignItems: 'center', width: '100%',
  },
  phonemeText: { ...TYPOGRAPHY.PHONEME },
  phonemeSub: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY, marginTop: SPACING.SM },

  // 示范按钮
  demoBtn: { paddingHorizontal: SPACING.XXL, paddingVertical: SPACING.MD, borderRadius: RADIUS.ROUND, marginBottom: SPACING.XL },
  demoBtnSmall: { paddingHorizontal: SPACING.XL, paddingVertical: SPACING.SM, borderRadius: RADIUS.ROUND, marginTop: SPACING.SM },
  demoBtnText: { ...TYPOGRAPHY.BODY_BOLD },

  // 录音
  recordArea: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  recordBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: COLORS.PRIMARY, alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.ELEVATED,
  },
  recordBtnActive: { backgroundColor: COLORS.RECORDING },
  recordBtnIcon: { fontSize: 48, marginBottom: SPACING.SM },
  recordBtnText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  scoringBox: { padding: SPACING.XXXL, alignItems: 'center' },
  scoringText: { ...TYPOGRAPHY.TITLE_2, color: COLORS.TEXT_SECONDARY },

  // 评分结果
  scoreResult: { alignItems: 'center', paddingTop: SPACING.XL, width: '100%' },
  starText: { fontSize: 48, marginBottom: SPACING.LG },
  feedbackText: { ...TYPOGRAPHY.TITLE_2, marginBottom: SPACING.MD, textAlign: 'center' },
  recognizedLabel: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY, marginBottom: SPACING.XL },
  nextBtn: {
    backgroundColor: COLORS.PRIMARY, paddingHorizontal: SPACING.XXXL, paddingVertical: SPACING.LG,
    borderRadius: RADIUS.ROUND, marginTop: SPACING.LG, ...SHADOWS.BUTTON,
  },
  nextBtnText: { ...TYPOGRAPHY.BODY_BOLD, color: '#fff' },

  // 题型 B
  timerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: SPACING.LG },
  timerTrack: { flex: 1, height: 6, backgroundColor: COLORS.DIVIDER, borderRadius: 3, marginRight: SPACING.SM },
  timerFill: { height: 6, borderRadius: 3 },
  timerText: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_PRIMARY, width: 36, textAlign: 'right' },
  targetCard: {
    borderRadius: RADIUS.XL, padding: SPACING.LG, alignItems: 'center', marginBottom: SPACING.XXL, width: '100%',
  },
  targetSub: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY, marginBottom: SPACING.MD },

  // 字母选择面板
  letterGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.SM,
  },
  letterBtn: {
    width: 64, height: 64, borderRadius: RADIUS.MD,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  letterBtnDisabled: { backgroundColor: COLORS.BG_GRAY, borderColor: COLORS.DIVIDER },
  letterText: { fontSize: 28, fontWeight: '700' },
  letterTextDisabled: { color: COLORS.TEXT_HINT },
  chooseResultIcon: { fontSize: 48, marginBottom: SPACING.MD },
  chooseResultText: { ...TYPOGRAPHY.TITLE_3, textAlign: 'center', marginBottom: SPACING.XL },
})