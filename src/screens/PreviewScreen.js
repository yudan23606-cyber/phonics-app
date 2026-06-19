import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  PHONEMES_PHASE2, SET_NAMES, SET_PALETTE,
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS,
} from '../services/constants'
import { speakPhoneme, speakWord } from '../services/tts'

export default function PreviewScreen({ route, navigation }) {
  const set = route.params?.set || 1
  const phoneme = route.params?.phoneme || null
  const palette = SET_PALETTE[set - 1] || SET_PALETTE[0]

  const phonemes = phoneme
    ? PHONEMES_PHASE2.filter(p => p.phoneme === phoneme)
    : PHONEMES_PHASE2.filter(p => p.set === set)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const fadeAnim = useRef(new Animated.Value(1)).current

  const current = phonemes[currentIndex] || phonemes[0]

  const handlePrev = () => {
    if (currentIndex <= 0) return
    animateTransition(() => setCurrentIndex(prev => prev - 1))
  }

  const handleNext = () => {
    if (currentIndex >= phonemes.length - 1) return
    animateTransition(() => setCurrentIndex(prev => prev + 1))
  }

  const animateTransition = (update) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      update()
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start()
    })
  }

  const handleSpeakPhoneme = async () => {
    if (isSpeaking) return
    setIsSpeaking(true)
    try { await speakPhoneme(current.phoneme) }
    catch (_) {}
    setIsSpeaking(false)
  }

  const handleSpeakWord = async (word) => {
    if (isSpeaking) return
    setIsSpeaking(true)
    try { await speakWord(word) }
    catch (_) {}
    setIsSpeaking(false)
  }

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < phonemes.length - 1

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 顶部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{phoneme ? current.phoneme : SET_NAMES[set]}</Text>
        <Text style={styles.headerCount}>{currentIndex + 1} / {phonemes.length}</Text>
      </View>

      {/* 闪卡 */}
      <View style={styles.cardArea}>
        <Animated.View style={[styles.flashCard, { opacity: fadeAnim }, { backgroundColor: palette.light, borderColor: palette.primary }]}>
          {/* 音素 */}
          <Text style={[styles.phonemeText, { color: palette.primary }]}>{current.phoneme}</Text>

          {/* 发音按钮 */}
          <TouchableOpacity
            style={[styles.speakBtn, { backgroundColor: palette.primary }]}
            onPress={handleSpeakPhoneme}
          >
            <Text style={styles.speakBtnText}>{isSpeaking ? '...' : '🔊 听发音'}</Text>
          </TouchableOpacity>

          {/* 示例单词 */}
          <View style={styles.exampleSection}>
            <Text style={styles.exampleLabel}>示例单词</Text>
            <View style={styles.exampleRow}>
              {current.exampleWords.map((word, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.wordChip, { backgroundColor: palette.primary + '20' }]}
                  onPress={() => handleSpeakWord(word)}
                >
                  <Text style={[styles.wordChipText, { color: palette.primary }]}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 导航箭头 */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
              onPress={handlePrev}
              disabled={!canGoPrev}
            >
              <Text style={[styles.navBtnText, !canGoPrev && styles.navBtnTextDisabled]}>← 上一个</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
              onPress={handleNext}
              disabled={!canGoNext}
            >
              <Text style={[styles.navBtnText, !canGoNext && styles.navBtnTextDisabled]}>下一个 →</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* 底部按钮 */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: palette.primary }]}
          onPress={() => navigation.replace('Practice', { set, phoneme })}
        >
          <Text style={styles.startBtnText}>🚀 开始练习</Text>
        </TouchableOpacity>
      </View>
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
  headerTitle: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_PRIMARY, flex: 1, textAlign: 'center' },
  headerCount: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_HINT },

  cardArea: { flex: 1, justifyContent: 'center', paddingHorizontal: SPACING.XL },
  flashCard: {
    borderRadius: RADIUS.XXL, padding: SPACING.XXL, borderWidth: 2,
    alignItems: 'center', ...SHADOWS.CARD,
  },
  phonemeText: { fontSize: 72, fontWeight: '700', marginBottom: SPACING.XL },

  speakBtn: { paddingHorizontal: SPACING.XXL, paddingVertical: SPACING.MD, borderRadius: RADIUS.ROUND, marginBottom: SPACING.XL },
  speakBtnText: { ...TYPOGRAPHY.BODY_BOLD, color: '#fff' },

  exampleSection: { alignItems: 'center', marginBottom: SPACING.LG },
  exampleLabel: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY, marginBottom: SPACING.SM },
  exampleRow: { flexDirection: 'row', gap: SPACING.SM },
  wordChip: { paddingHorizontal: SPACING.LG, paddingVertical: SPACING.SM, borderRadius: RADIUS.ROUND },
  wordChipText: { ...TYPOGRAPHY.BODY_BOLD },

  navRow: { flexDirection: 'row', gap: SPACING.LG },
  navBtn: { paddingHorizontal: SPACING.XL, paddingVertical: SPACING.SM, borderRadius: RADIUS.SM },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { ...TYPOGRAPHY.BODY, color: COLORS.TEXT_PRIMARY },
  navBtnTextDisabled: { color: COLORS.TEXT_HINT },

  bottomRow: { paddingHorizontal: SPACING.XL, paddingBottom: SPACING.XXXL },
  startBtn: { paddingVertical: SPACING.LG, borderRadius: RADIUS.LG, alignItems: 'center', ...SHADOWS.BUTTON },
  startBtnText: { ...TYPOGRAPHY.BODY_BOLD, color: '#fff' },
})
