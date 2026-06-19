import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import cloud from '../services/cloudbase'
import {
  PHONEMES_PHASE2, SET_PALETTE,
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, formatDate,
} from '../services/constants'

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export default function ReportScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [activeTab, setActiveTab] = useState('daily')
  const [streakDays, setStreakDays] = useState(0)
  const [calendarDays, setCalendarDays] = useState([])
  const [todayStats, setTodayStats] = useState({ phonemes: 0, rate: 0, duration: 0 })
  const [weakPhonemes, setWeakPhonemes] = useState([])
  const [weeklyData, setWeeklyData] = useState([])

  const fadeAnim = useRef(new Animated.Value(0)).current
  const weeklyAnim = useRef(new Animated.Value(0)).current

  const loadReport = useCallback(async () => {
    setLoading(true)
    fadeAnim.setValue(0)
    try {
      const uid = await cloud.getUserId()
      if (!uid) { setLoading(false); return }
      const today = formatDate()

      try {
        const result = await cloud.callFunction('reportGenerator', {
          action: 'dailyReport', userId: uid, date: today,
        })
        if (result?.data) { processData(result.data); return }
      } catch (e) {
        console.log('云函数不可用，从数据库读取')
      }

      await loadFromDB(uid, today)
    } catch (err) {
      console.error('加载报告失败:', err)
      setLoading(false)
    }
  }, [])

  const processData = (data) => {
    setHasData(true)
    setStreakDays(data.streakDays || 0)
    setTodayStats({
      phonemes: data.phonemesLearned || 0,
      rate: data.correctRate || 0,
      duration: data.duration || 0,
    })
    setWeakPhonemes((data.weakPhonemes || []).map(p => ({
      phoneme: typeof p === 'string' ? p : p.phoneme,
      rate: p.rate || 30,
      barColor: (p.rate || 30) < 40 ? COLORS.ERROR : COLORS.WARNING,
    })))
    buildCalendar(data.checkedDates || [])
    buildWeekly(data.weekTrend || [])
    animateIn()
  }

  const loadFromDB = async (uid, today) => {
    const user = await cloud.getOne('users', { _openid: uid })
    if (!user) { setLoading(false); return }
    setStreakDays(user.streakDays || 0)

    const tasks = await cloud.query('daily_tasks', { _openid: uid, date: today })
    if (tasks.length > 0) {
      setHasData(true)
      setTodayStats({
        phonemes: (tasks[0].phonemes || []).length,
        rate: tasks[0].correctRate || 0,
        duration: 0,
      })
    }

    const records = await cloud.query('learning_records', { _openid: uid }, {
      orderBy: { field: 'createdAt', order: 'desc' }, limit: 50,
    })

    const scoreMap = {}
    records.forEach(r => {
      if (!scoreMap[r.phoneme]) scoreMap[r.phoneme] = []
      scoreMap[r.phoneme].push(r.score || 0)
    })

    const weak = []
    Object.entries(scoreMap).forEach(([p, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < 2) {
        weak.push({
          phoneme: p,
          rate: Math.round((avg / 3) * 100),
          barColor: avg < 1.5 ? COLORS.ERROR : COLORS.WARNING,
        })
      }
    })
    setWeakPhonemes(weak)

    await loadCalendarFromDB(uid)
    buildWeekly([])
    setLoading(false)
    animateIn()
  }

  const loadCalendarFromDB = async (uid) => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const monthPattern = `${year}-${month}`
      const tasks = await cloud.query('daily_tasks', { _openid: uid })
      const checkedDates = tasks.filter(t => t.date?.startsWith(monthPattern)).map(t => t.date)
      buildCalendar(checkedDates)
    } catch (err) {
      console.error('加载打卡日历失败:', err)
      buildCalendar([])
    }
  }

  const animateIn = () => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    Animated.timing(weeklyAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start()
  }

  const buildCalendar = (checkedDates) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const today = now.getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const offset = firstDay === 0 ? 6 : firstDay - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days = []
    for (let i = 0; i < offset; i++) days.push({ day: '', checked: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      days.push({ day: d, checked: checkedDates.includes(dateStr), isToday: d === today })
    }
    setCalendarDays(days)
  }

  const buildWeekly = (trend) => {
    const data = WEEK_LABELS.map((label, i) => ({
      label,
      rate: trend[i] || 0,
      height: Math.max(4, (trend[i] || 0) * 0.8),
    }))
    setWeeklyData(data)
  }

  useEffect(() => {
    loadReport()
    const unsub = navigation.addListener('focus', loadReport)
    return unsub
  }, [navigation, loadReport])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>学习报告</Text>
        <View style={styles.tabRow}>
          {['daily', 'weekly'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'daily' ? '日报' : '周报'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {!hasData ? (
          <Animated.View style={[styles.emptyBox, { opacity: fadeAnim }]}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>还没有学习记录</Text>
            <Text style={styles.emptySub}>完成第一次练习后，这里会显示你的学习数据</Text>
          </Animated.View>
        ) : (
          <>
            {/* 连续打卡 */}
            <Animated.View style={[styles.streakBar, { opacity: fadeAnim }]}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakText}>
                已连续打卡 <Text style={{ fontWeight: '700', fontSize: 22 }}>{streakDays}</Text> 天
              </Text>
            </Animated.View>

            {/* 月历 */}
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <Text style={styles.cardTitle}>📅 本月打卡</Text>
              <View style={styles.calendarHeader}>
                {WEEK_LABELS.map(d => (
                  <Text key={d} style={styles.calDayLabel}>{d}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((d, i) => (
                  <View key={i} style={[
                    styles.calDay,
                    d.checked && styles.calDayChecked,
                    d.isToday && styles.calDayToday,
                  ]}>
                    <Text style={[
                      styles.calDayText,
                      d.checked && styles.calDayTextChecked,
                      d.isToday && { color: COLORS.PRIMARY, fontWeight: '700' },
                    ]}>{d.day}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* 今日数据 */}
            <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
              <Text style={styles.cardTitle}>📈 今日数据</Text>
              <View style={styles.statsGrid}>
                {[
                  { label: '学习音素', value: todayStats.phonemes, icon: '🔤' },
                  { label: '正确率', value: `${todayStats.rate}%`, icon: '🎯', color: todayStats.rate >= 60 ? COLORS.CORRECT : COLORS.ERROR },
                  { label: '分钟', value: todayStats.duration, icon: '⏱️' },
                ].map((s, i) => (
                  <View key={i} style={styles.statBox}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <Text style={[styles.statNum, s.color ? { color: s.color } : null]}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* 周报 */}
            {activeTab === 'weekly' && weeklyData.length > 0 && (
              <Animated.View style={[styles.card, { opacity: weeklyAnim }]}>
                <Text style={styles.cardTitle}>📊 本周趋势</Text>
                <View style={styles.chartBox}>
                  {weeklyData.map((d, i) => {
                    const barHeight = weeklyAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, d.height],
                    })
                    return (
                      <View key={i} style={styles.chartCol}>
                        <Animated.View style={[
                          styles.chartBar,
                          {
                            height: barHeight,
                            backgroundColor: d.rate >= 60 ? SET_PALETTE[0].primary : COLORS.ERROR,
                          },
                        ]} />
                        <Text style={styles.chartLabel}>{d.label}</Text>
                      </View>
                    )
                  })}
                </View>
              </Animated.View>
            )}

            {/* 薄弱音素 */}
            {weakPhonemes.length > 0 && (
              <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
                <Text style={styles.cardTitle}>💪 需要加强</Text>
                {weakPhonemes.map((p, i) => (
                  <View key={i} style={styles.weakItem}>
                    <Text style={styles.weakPhoneme}>{p.phoneme}</Text>
                    <View style={styles.weakBar}>
                      <View style={[styles.weakFill, { width: `${p.rate}%`, backgroundColor: p.barColor }]} />
                    </View>
                    <Text style={styles.weakRate}>{p.rate}%</Text>
                  </View>
                ))}
              </Animated.View>
            )}
            <View style={{ height: SPACING.XXXL }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_MAIN },
  header: { paddingHorizontal: SPACING.XL, paddingTop: SPACING.XL, paddingBottom: SPACING.SM },
  title: { ...TYPOGRAPHY.TITLE_1, color: COLORS.TEXT_PRIMARY, marginBottom: SPACING.LG },
  tabRow: { flexDirection: 'row' },
  tab: { paddingHorizontal: SPACING.XL, paddingVertical: SPACING.SM, borderRadius: RADIUS.ROUND, backgroundColor: COLORS.BG_GRAY, marginRight: SPACING.MD },
  tabActive: { backgroundColor: COLORS.PRIMARY },
  tabText: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY },
  tabTextActive: { color: '#fff', fontWeight: '600' },

  // 空态
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.LG },
  emptyText: { ...TYPOGRAPHY.TITLE_3, color: COLORS.TEXT_PRIMARY, marginBottom: SPACING.SM },
  emptySub: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY, textAlign: 'center' },

  // 打卡栏
  streakBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.ACCENT_LIGHT,
    borderRadius: RADIUS.LG, padding: SPACING.LG, marginHorizontal: SPACING.LG, marginBottom: SPACING.LG,
  },
  streakIcon: { fontSize: 28, marginRight: SPACING.SM },
  streakText: { ...TYPOGRAPHY.BODY, color: '#E65100' },

  // 通用卡片
  card: {
    backgroundColor: COLORS.BG_WHITE, borderRadius: RADIUS.XL, padding: SPACING.LG,
    marginHorizontal: SPACING.LG, marginBottom: SPACING.LG,
    ...SHADOWS.CARD,
  },
  cardTitle: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_PRIMARY, marginBottom: SPACING.LG },

  // 日历
  calendarHeader: { flexDirection: 'row', marginBottom: SPACING.SM },
  calDayLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: COLORS.TEXT_SECONDARY },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.SM, marginVertical: 2,
  },
  calDayChecked: { backgroundColor: COLORS.PRIMARY_LIGHT },
  calDayToday: { borderWidth: 2, borderColor: COLORS.PRIMARY },
  calDayText: { fontSize: 13, color: COLORS.TEXT_HINT },
  calDayTextChecked: { color: COLORS.PRIMARY, fontWeight: '600' },

  // 今日统计
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statIcon: { fontSize: 20, marginBottom: SPACING.XS },
  statNum: { fontSize: 28, fontWeight: '700', color: COLORS.TEXT_PRIMARY },
  statLabel: { ...TYPOGRAPHY.SMALL, color: COLORS.TEXT_SECONDARY, marginTop: SPACING.XS },

  // 周趋势
  chartBox: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100, paddingTop: SPACING.XL },
  chartCol: { alignItems: 'center' },
  chartBar: { width: 20, borderRadius: RADIUS.SM, minHeight: 4 },
  chartLabel: { ...TYPOGRAPHY.SMALL, color: COLORS.TEXT_SECONDARY, marginTop: SPACING.SM },

  // 薄弱
  weakItem: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.SM },
  weakPhoneme: { fontSize: 18, fontWeight: '700', color: COLORS.TEXT_PRIMARY, width: 40 },
  weakBar: { flex: 1, height: 10, backgroundColor: COLORS.DIVIDER, borderRadius: RADIUS.SM, marginHorizontal: SPACING.SM },
  weakFill: { height: 10, borderRadius: RADIUS.SM },
  weakRate: { fontSize: 13, color: COLORS.TEXT_SECONDARY, width: 40, textAlign: 'right' },
})
