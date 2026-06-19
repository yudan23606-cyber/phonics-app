import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import cloud from '../services/cloudbase'
import {
  PHONEMES_PHASE2, SET_NAMES, PRACTICE_CONFIG,
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS
} from '../services/constants'
import { BookIcon, ChartIcon } from '../components/Icons'
import { checkAchievements } from '../services/achievements'

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [streakDays, setStreakDays] = useState(0)
  const [totalStars, setTotalStars] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [currentSetName, setCurrentSetName] = useState('')
  const [todayPhonemes, setTodayPhonemes] = useState('')
    const [progressPercent, setProgressPercent] = useState(0)
  const [achievements, setAchievements] = useState([])

  // 入场动画
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start()
  }, [])

  const loadUserData = useCallback(async () => {
    setLoading(true)
    try {
      const uid = await cloud.getUserId()
      if (!uid) { setLoading(false); return }

      const userData = await cloud.getOne('users', { _openid: uid })

      if (userData) {
        const set = userData.currentSet || 1
        const setName = SET_NAMES[set] || SET_NAMES[1]
        const phonemes = PHONEMES_PHASE2.filter(p => p.set === set).map(p => p.phoneme).join(', ')

        setStreakDays(userData.streakDays || 0)
        setTotalStars(userData.totalStars || 0)
        setCurrentSet(set)
        setCurrentSetName(setName)
        setTodayPhonemes(phonemes)
        setLoading(false)

        // 加载今日进度
        try {
          const today = new Date()
          const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          const tasks = await cloud.query('daily_tasks', { _openid: uid, date: dateStr })
          if (tasks.length > 0) {
            const pct = Math.round(((tasks[0].completed || 0) / PRACTICE_CONFIG.QUESTIONS_PER_DAY) * 100)
                    setProgressPercent(Math.min(pct, 100))
        // 检查成就
        try {
          const { allUnlocked } = checkAchievements({
            totalStars: userData.totalStars || 0,
            streakDays: userData.streakDays || 0,
            totalPractices: userData.totalPractices || 0,
            setMastered: userData.setMastered || {},
          })
          setAchievements(allUnlocked.slice(0, 4))
        } catch (_) {}
          }
        } catch (err) {
          console.error('加载进度失败:', err)
        }
      } else {
        await createUser(uid)
      }
    } catch (err) {
      console.error('加载用户数据失败:', err)
      setLoading(false)
    }
  }, [])

  const createUser = async (uid) => {
    try {
      await cloud.add('users', {
        _openid: uid,
        currentPhase: 2,
        currentSet: 1,
        streakDays: 0,
        totalStars: 0,
        createdAt: new Date(),
      })
      setCurrentSet(1)
      setCurrentSetName(SET_NAMES[1])
      setTodayPhonemes(PHONEMES_PHASE2.filter(p => p.set === 1).map(p => p.phoneme).join(', '))
    } catch (err) {
      console.error('创建用户失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserData()
    const unsub = navigation.addListener('focus', () => {
      // 刷新时无需重新创建入场动画
      loadUserData()
    })
    return unsub
  }, [navigation, loadUserData])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingBox}>
          <Text style={styles.loadingDot}>...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        {/* 装饰圆 */}
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />
        <Text style={styles.appTitle}>小树拼读</Text>
        <Text style={styles.appSubtitle}>AI 发音老师 · 自然拼读练习</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ position: 'absolute', right: 24, top: 20 }}>
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </TouchableOpacity>

        {/* 统计卡片 */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>连续打卡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{totalStars}</Text>
            <Text style={styles.statLabel}>总星星</Text>
          </View>
        </View>
      </Animated.View>

      {/* 今日学习卡片 */}
      <Animated.View style={[
        styles.learnCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
      ]}>
        <View style={styles.learnHeader}>
          <Text style={styles.setLabel}>{currentSetName}</Text>
          {(progressPercent > 0 && progressPercent < 100) && (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>{progressPercent}%</Text>
            </View>
          )}
          {progressPercent >= 100 && (
            <View style={[styles.progressBadge, styles.progressBadgeDone]}>
              <Text style={[styles.progressBadgeText, { color: '#fff' }]}>已完成 ✓</Text>
            </View>
          )}
        </View>

        <Text style={styles.phonemesPreview}>
          今日音素: <Text style={styles.phonemesHighlight}>{todayPhonemes}</Text>
        </Text>

        {/* 进度条 */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* 开始按钮 */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('Preview', { set: currentSet })}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>
            {progressPercent > 0 ? '📖 继续今日学习' : '🚀 开始今日练习'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* 快捷入口 */}
      <Animated.View style={[styles.quickRow, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => navigation.navigate('Phonics')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickIconBox, { backgroundColor: COLORS.PRIMARY_LIGHT }]}>
            <BookIcon focused size={28} />
          </View>
          <Text style={styles.quickLabel}>音素总览</Text>
          <Text style={styles.quickSub}>浏览全部音素</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => navigation.navigate('Report')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickIconBox, { backgroundColor: COLORS.ACCENT_LIGHT }]}>
            <ChartIcon focused size={28} />
          </View>
          <Text style={styles.quickLabel}>学习报告</Text>
          <Text style={styles.quickSub}>查看学习数据</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_MAIN,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    fontSize: 40,
    color: COLORS.PRIMARY,
    letterSpacing: 4,
  },

  // ===== 头部 =====
  header: {
    backgroundColor: COLORS.PRIMARY,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.HUGE,
    paddingHorizontal: SPACING.XL,
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.XXL,
    borderBottomRightRadius: RADIUS.XXL,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerDecor2: {
    position: 'absolute',
    top: 10,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  appTitle: {
    ...TYPOGRAPHY.TITLE_1,
    color: '#fff',
    marginBottom: SPACING.XS,
  },
  appSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.XL,
  },

  // ===== 统计 =====
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.LG,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.XL,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: SPACING.XS,
  },
  statValue: {
    ...TYPOGRAPHY.TITLE_2,
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // ===== 学习卡片 =====
  learnCard: {
    backgroundColor: COLORS.BG_WHITE,
    marginHorizontal: SPACING.XL,
    marginTop: -SPACING.XXXL,
    borderRadius: RADIUS.XL,
    padding: SPACING.XL,
    ...SHADOWS.CARD,
  },
  learnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  setLabel: {
    ...TYPOGRAPHY.TITLE_3,
    color: COLORS.TEXT_PRIMARY,
  },
  progressBadge: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
  },
  progressBadgeDone: {
    backgroundColor: COLORS.CORRECT,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  phonemesPreview: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.LG,
  },
  phonemesHighlight: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // ===== 进度条 =====
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.PRIMARY_LIGHT,
    borderRadius: RADIUS.SM,
    marginBottom: SPACING.XL,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.SM,
  },

  // ===== 开始按钮 =====
  startBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
    alignItems: 'center',
    ...SHADOWS.BUTTON,
  },
  startBtnText: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: '#fff',
  },

  // ===== 快捷入口 =====
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.XL,
    marginTop: SPACING.XL,
    gap: SPACING.MD,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.BG_WHITE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    ...SHADOWS.CARD,
  },
  quickIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.SM,
  },
  quickLabel: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  quickSub: {
    fontSize: 12,
    color: COLORS.TEXT_HINT,
  },
})