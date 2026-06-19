import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import cloud from '../services/cloudbase'
import {
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SET_PALETTE, formatDate,
} from '../services/constants'

export default function ResultScreen({ route, navigation }) {
  const { total, correct, totalScore, results: resultsJson, set } = route.params || {}
  const results = resultsJson ? JSON.parse(resultsJson) : []
  const correctRate = total > 0 ? Math.round((correct / total) * 100) : 0
  const earnedStars = Math.min(5, Math.round(correctRate / 20))

  const cardAnim = useRef(new Animated.Value(0)).current
  const starAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current
  const [scoreCardVisible, setScoreCardVisible] = useState(false)
  const [saving, setSaving] = useState(true)

  const palette = SET_PALETTE[set ? set - 1 : 0] || SET_PALETTE[0]

  useEffect(() => {
    setTimeout(() => {
      setScoreCardVisible(true)
      Animated.spring(cardAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start()
      // 星星逐个弹出
      starAnims.forEach((anim, i) => {
        Animated.spring(anim, {
          toValue: 1, friction: 4, tension: 80, delay: 300 + i * 120, useNativeDriver: true,
        }).start()
      })
    }, 200)
    saveRecords()
  }, [])

  const saveRecords = async () => {
    try {
      const uid = await cloud.getUserId()
      if (!uid) { setSaving(false); return }
      const today = formatDate()

      const promises = results.map(r =>
        cloud.add('learning_records', {
          _openid: uid, date: today, phoneme: r.phoneme,
          exerciseType: r.correct ? 'read' : 'incorrect',
          score: r.score || 0, duration: 0, createdAt: new Date(),
        })
      )

      promises.push(
        cloud.query('daily_tasks', { _openid: uid, date: today }).then(async tasks => {
          if (tasks.length > 0) {
            const task = tasks[0]
            return cloud.update('daily_tasks', task._id, {
              completed: (task.completed || 0) + results.length,
              correctRate,
            })
          } else {
            return cloud.add('daily_tasks', {
              _openid: uid, date: today, phonemes: results.map(r => r.phoneme),
              completed: results.length, correctRate,
              startTime: new Date(), endTime: new Date(),
            })
          }
        })
      )

      const newStars = results.reduce((sum, r) => sum + (r.score || 0), 0)
      promises.push(
        cloud.getOne('users', { _openid: uid }).then(async user => {
          if (user) {
            const isConsecutive = user.lastPracticeDate
              ? (new Date() - new Date(user.lastPracticeDate)) / 86400000 <= 1 : true
            const newStreak = isConsecutive ? (user.streakDays || 0) + 1 : 1
            return cloud.update('users', user._id, {
              totalStars: (user.totalStars || 0) + newStars,
              streakDays: newStreak,
              lastPracticeDate: today,
            })
          }
        })
      )

      await Promise.all(promises)
    } catch (err) {
      console.error('保存记录失败:', err)
    } finally {
      setSaving(false)
    }
  }

  const getRateColor = () => {
    if (correctRate >= 80) return COLORS.CORRECT
    if (correctRate >= 60) return COLORS.WARNING
    return COLORS.ERROR
  }

  const weakPhonemes = results.filter(r => (r.score || 0) < 2).map(r => r.phoneme)

  const starScale = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] })

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[
        styles.scoreCard,
        {
          opacity: cardAnim,
          transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        },
      ]}>
        <Text style={styles.titleLarge}>练习完成！</Text>

        {/* 星星 */}
        <View style={styles.starRow}>
          {[0, 1, 2, 3, 4].map(i => (
            <Animated.Text key={i} style={[
              styles.starIcon,
              { transform: [{ scale: starAnims[i] }], opacity: starAnims[i] },
              i < earnedStars ? styles.starFilled : styles.starEmpty,
            ]}>
              {i < earnedStars ? '⭐' : '☆'}
            </Animated.Text>
          ))}
        </View>

        {/* 正确率圆环 */}
        <View style={[styles.scoreRing, { borderColor: getRateColor() }]}>
          <Text style={[styles.scoreNumber, { color: getRateColor() }]}>{correctRate}%</Text>
          <Text style={styles.scoreSub}>正确率</Text>
        </View>

        {/* 统计 */}
        <View style={styles.statsGrid}>
          {[
            { label: '总题数', value: total },
            { label: '正确', value: correct, color: COLORS.CORRECT },
            { label: '得分', value: totalScore, color: COLORS.ACCENT },
          ].map((s, i) => (
            <View key={i} style={styles.statBox}>
              <Text style={[styles.statNum, s.color ? { color: s.color } : null]}>{s.value}</Text>
              <Text style={styles.statTxt}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* 薄弱提示 */}
      {weakPhonemes.length > 0 && (
        <Animated.View style={[styles.weakBox, { opacity: cardAnim }]}>
          <Text style={styles.weakTitle}>💪 需要加强的音素</Text>
          <Text style={styles.weakList}>{[...new Set(weakPhonemes)].join(' · ')}</Text>
        </Animated.View>
      )}

      {/* 底部按钮 */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.replace('Practice', { set: set || 1 })}
        >
          <Text style={styles.btnOutlineText}>🔄 再练一次</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnSolid}
          onPress={() => navigation.navigate('Main', { screen: 'Home' })}
        >
          <Text style={styles.btnSolidText}>返回首页</Text>
        </TouchableOpacity>
      </View>

      {saving && <Text style={styles.savingText}>正在保存学习记录...</Text>}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_MAIN,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
  },
  scoreCard: {
    backgroundColor: COLORS.BG_WHITE,
    borderRadius: RADIUS.XXL,
    padding: SPACING.XXL,
    alignItems: 'center',
    ...SHADOWS.ELEVATED,
  },
  titleLarge: {
    ...TYPOGRAPHY.TITLE_1,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XL,
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  },
  starIcon: {
    fontSize: 36,
    marginHorizontal: 4,
  },
  starFilled: {},
  starEmpty: {
    color: COLORS.TEXT_HINT,
  },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.XL,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
  },
  scoreSub: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT_SECONDARY,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.LG,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  statNum: {
    ...TYPOGRAPHY.TITLE_2,
    color: COLORS.TEXT_PRIMARY,
  },
  statTxt: {
    ...TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },

  // 薄弱
  weakBox: {
    backgroundColor: COLORS.ACCENT_LIGHT,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    marginTop: SPACING.LG,
  },
  weakTitle: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: '#E65100',
    marginBottom: SPACING.SM,
  },
  weakList: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },

  // 底部按钮
  bottomBtns: {
    flexDirection: 'row',
    marginTop: 'auto',
    marginBottom: SPACING.XXXL,
    gap: SPACING.MD,
  },
  btnOutline: {
    flex: 1,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    alignItems: 'center',
  },
  btnOutlineText: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: COLORS.PRIMARY,
  },
  btnSolid: {
    flex: 1,
    paddingVertical: SPACING.LG,
    borderRadius: RADIUS.LG,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    ...SHADOWS.BUTTON,
  },
  btnSolidText: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: '#fff',
  },
  savingText: {
    textAlign: 'center',
    ...TYPOGRAPHY.SMALL,
    color: COLORS.TEXT_HINT,
    marginTop: SPACING.MD,
  },
})
