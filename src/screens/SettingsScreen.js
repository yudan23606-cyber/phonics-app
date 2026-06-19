import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import cloud from '../services/cloudbase'
import {
  COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS, SETTINGS_DEFAULTS,
} from '../services/constants'

const SETTINGS_KEY = '@phonics_settings'

export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY)
      if (raw) {
        setSettings({ ...SETTINGS_DEFAULTS, ...JSON.parse(raw) })
      }
    } catch (_) {}
    setLoading(false)
  }

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
    } catch (_) {}
  }

  const handleReset = () => {
    Alert.alert(
      '确认重置',
      '这将清除所有本地学习进度。云端数据不受影响。确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置', style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys()
              const cacheKeys = keys.filter(k => k.startsWith('@phonics_'))
              await AsyncStorage.multiRemove(cacheKeys)
              setSettings(SETTINGS_DEFAULTS)
              Alert.alert('已重置', '本地缓存已清除，设置已恢复默认')
            } catch (_) {}
          },
        },
      ],
    )
  }

  const questionsOptions = [5, 8, 10, 12, 15]
  const timeOptions = [10, 15, 20, 30]

  if (loading) return null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙️ 设置</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 练习设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>练习设置</Text>

          {/* 每日题数 */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>每日题数</Text>
            <View style={styles.optionRow}>
              {questionsOptions.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.optionBtn, settings.questionsPerDay === n && styles.optionBtnActive]}
                  onPress={() => updateSetting('questionsPerDay', n)}
                >
                  <Text style={[styles.optionText, settings.questionsPerDay === n && styles.optionTextActive]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 每题时限 */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>每题时限</Text>
            <View style={styles.optionRow}>
              {timeOptions.map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.optionBtn, settings.timePerQuestion === n && styles.optionBtnActive]}
                  onPress={() => updateSetting('timePerQuestion', n)}
                >
                  <Text style={[styles.optionText, settings.timePerQuestion === n && styles.optionTextActive]}>{n}s</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 功能开关 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能开关</Text>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>发音示范 (TTS)</Text>
              <Text style={styles.switchDesc}>练习时播放音素和单词发音</Text>
            </View>
            <Switch
              value={settings.ttsEnabled}
              onValueChange={v => updateSetting('ttsEnabled', v)}
              trackColor={{ false: COLORS.DIVIDER, true: COLORS.PRIMARY_LIGHT }}
              thumbColor={settings.ttsEnabled ? COLORS.PRIMARY : COLORS.TEXT_HINT}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>薄弱音素复习</Text>
              <Text style={styles.switchDesc}>练习时自动加入之前未掌握的音素</Text>
            </View>
            <Switch
              value={settings.includeWeakReview}
              onValueChange={v => updateSetting('includeWeakReview', v)}
              trackColor={{ false: COLORS.DIVIDER, true: COLORS.PRIMARY_LIGHT }}
              thumbColor={settings.includeWeakReview ? COLORS.PRIMARY : COLORS.TEXT_HINT}
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchLabel}>渐进解锁</Text>
              <Text style={styles.switchDesc}>掌握 75% 音素后解锁下一组</Text>
            </View>
            <Switch
              value={settings.enableSetLock}
              onValueChange={v => updateSetting('enableSetLock', v)}
              trackColor={{ false: COLORS.DIVIDER, true: COLORS.PRIMARY_LIGHT }}
              thumbColor={settings.enableSetLock ? COLORS.PRIMARY : COLORS.TEXT_HINT}
            />
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
            <Text style={styles.dangerBtnText}>🗑️ 清除本地缓存</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.XXXL }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_MAIN },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.XL, paddingTop: SPACING.XL, paddingBottom: SPACING.LG,
  },
  backBtn: { fontSize: 16, color: COLORS.TEXT_SECONDARY },
  title: { ...TYPOGRAPHY.TITLE_2, color: COLORS.TEXT_PRIMARY },

  section: {
    backgroundColor: COLORS.BG_WHITE, borderRadius: RADIUS.XL, padding: SPACING.LG,
    marginHorizontal: SPACING.LG, marginBottom: SPACING.MD, ...SHADOWS.CARD,
  },
  sectionTitle: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_PRIMARY, marginBottom: SPACING.LG },

  row: { marginBottom: SPACING.LG },
  rowLabel: { ...TYPOGRAPHY.BODY, color: COLORS.TEXT_SECONDARY, marginBottom: SPACING.SM },
  optionRow: { flexDirection: 'row', gap: SPACING.SM },
  optionBtn: {
    paddingHorizontal: SPACING.XL, paddingVertical: SPACING.SM, borderRadius: RADIUS.SM,
    backgroundColor: COLORS.BG_GRAY,
  },
  optionBtnActive: { backgroundColor: COLORS.PRIMARY },
  optionText: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.TEXT_SECONDARY },
  optionTextActive: { color: '#fff' },

  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.MD, borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER,
  },
  switchLabel: { ...TYPOGRAPHY.BODY, color: COLORS.TEXT_PRIMARY },
  switchDesc: { ...TYPOGRAPHY.SMALL, color: COLORS.TEXT_HINT, marginTop: 2 },

  dangerBtn: {
    paddingVertical: SPACING.LG, borderRadius: RADIUS.LG,
    borderWidth: 1, borderColor: COLORS.ERROR, alignItems: 'center',
  },
  dangerBtnText: { ...TYPOGRAPHY.BODY_BOLD, color: COLORS.ERROR },
})
