import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import cloud from '../services/cloudbase'
import {
  PHONEMES_PHASE2, SET_NAMES, SET_PALETTE,
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS
} from '../services/constants'

export default function PhonicsScreen({ navigation }) {
  const [loading, setLoading] = useState(true)
  const [sets, setSets] = useState([])

  const loadStatus = useCallback(async () => {
    setLoading(true)
    try {
      const uid = await cloud.getUserId()
      const statusMap = {}

      if (uid) {
        const records = await cloud.query('learning_records', { _openid: uid }, {
          orderBy: { field: 'createdAt', order: 'desc' },
          limit: 100,
        })

        if (records?.length > 0) {
          const phonemeScores = {}
          records.forEach(r => {
            if (!phonemeScores[r.phoneme]) phonemeScores[r.phoneme] = []
            phonemeScores[r.phoneme].push(r.score || 0)
          })
          Object.entries(phonemeScores).forEach(([p, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length
            statusMap[p] = avg >= 2.5 ? 'mastered' : 'learning'
          })
        }
      }
      buildSets(statusMap)
    } catch (err) {
      console.error('加载音素状态失败:', err)
      buildSets({})
    }
  }, [])

    const [lockedSets, setLockedSets] = useState([])

  // 检查渐进解锁状态
  useEffect(() => {
    checkLockStatus()
  }, [])

  const checkLockStatus = async () => {
    const locked = []
    try {
      const raw = await AsyncStorage.getItem('@phonics_settings')
      const settings = raw ? JSON.parse(raw) : {}
      if (settings.enableSetLock === false) { setLockedSets([]); return }
      const uid = await cloud.getUserId()
      if (!uid) { setLockedSets([]); return }
      const records = await cloud.query('learning_records', { _openid: uid }, { limit: 200 })
      const scoreMap = {}
      records.forEach(r => {
        if (!scoreMap[r.phoneme]) scoreMap[r.phoneme] = []
        scoreMap[r.phoneme].push(r.score || 0)
      })
      for (let s = 2; s <= 5; s++) {
        const prevPhonemes = PHONEMES_PHASE2.filter(p => p.set === s - 1)
        const prevMastered = prevPhonemes.filter(p => {
          const scores = scoreMap[p.phoneme]
          if (!scores || scores.length === 0) return false
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length
          return avg >= 2.5
        }).length
        const threshold = Math.ceil(prevPhonemes.length * 0.75)
        if (prevMastered < threshold) locked.push(s)
      }
    } catch (_) {}
    setLockedSets(locked)
  }

const buildSets = (statusMap) => { {
    const setList = []
    for (let i = 1; i <= 5; i++) {
      const palette = SET_PALETTE[i - 1]
      const phonemes = PHONEMES_PHASE2.filter(p => p.set === i)
      const enriched = phonemes.map(p => {
        const isMastered = statusMap[p.phoneme] === 'mastered'
        return { ...p, isMastered }
      })
      const masteredCount = enriched.filter(p => p.isMastered).length
      setList.push({ id: i, name: SET_NAMES[i], phonemes: enriched, masteredCount, palette })
    }
    setSets(setList)
    setLoading(false)
  }

  useEffect(() => {
    loadStatus()
    const unsub = navigation.addListener('focus', loadStatus)
    return unsub
  }, [navigation, loadStatus])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 100 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>音素总览</Text>
        <Text style={styles.subtitle}>Phase 2 · 5 组 · 20 个音素</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {sets.map(set => (
          <View key={set.id} style={[styles.setCard, { borderLeftColor: set.palette.primary }]}>
            {/* 组标题 */}
            <View style={styles.setHeader}>
              <View style={styles.setHeaderLeft}>
                <View style={[styles.setDot, { backgroundColor: set.palette.primary }]} />
                <Text style={styles.setName}>{set.name}</Text>
              </View>
              <View style={[styles.masteryBadge, { backgroundColor: set.palette.light }]}>
                <Text style={[styles.masteryText, { color: set.palette.primary }]}>
                  {set.masteredCount}/{set.phonemes.length}
                </Text>
              </View>
            </View>

            {/* 进度条 */}
            <View style={styles.setProgressTrack}>
              <View style={[styles.setProgressFill, {
                width: `${(set.masteredCount / set.phonemes.length) * 100}%`,
                backgroundColor: set.palette.primary,
              }]} />
            </View>

            {/* 音素网格 */}
            <View style={styles.phonemeGrid}>
              {set.phonemes.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.phonemeItem,
                    {
                      backgroundColor: p.isMastered ? set.palette.primary : set.palette.light,
                      borderColor: p.isMastered ? set.palette.primary : 'transparent',
                    },
                  ]}
                  onPress={() => {
                if (lockedSets.includes(set.id)) {
                  Alert.alert('未解锁', "需要掌握前一组 " + (set.id * 75) + "% 的音素才能解锁")
                  return
                }
                navigation.navigate('Practice', { set: set.id, phoneme: p.phoneme })
              }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.phonemeLetter,
                    { color: p.isMastered ? '#fff' : set.palette.primary },
                  ]}>
                    {p.phoneme}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: SPACING.XXXL }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_MAIN,
  },
  header: {
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XL,
    paddingBottom: SPACING.LG,
  },
  title: {
    ...TYPOGRAPHY.TITLE_1,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  subtitle: {
    ...TYPOGRAPHY.CAPTION,
    color: COLORS.TEXT_SECONDARY,
  },

  // ===== 组卡片 =====
  setCard: {
    backgroundColor: COLORS.BG_WHITE,
    borderRadius: RADIUS.XL,
    padding: SPACING.LG,
    marginHorizontal: SPACING.LG,
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
    ...SHADOWS.CARD,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  setHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.SM,
  },
  setName: {
    ...TYPOGRAPHY.BODY_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },

  // ===== 掌握度 =====
  masteryBadge: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.SM,
  },
  masteryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  setProgressTrack: {
    height: 4,
    backgroundColor: COLORS.DIVIDER,
    borderRadius: 2,
    marginBottom: SPACING.LG,
    overflow: 'hidden',
  },
  setProgressFill: {
    height: 4,
    borderRadius: 2,
  },

  // ===== 音素网格 =====
  phonemeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  phonemeItem: {
    width: 58,
    height: 58,
    borderRadius: RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  phonemeLetter: {
    fontSize: 20,
    fontWeight: '700',
  },
})
}