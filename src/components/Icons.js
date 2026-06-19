import React from 'react'
import { View, StyleSheet } from 'react-native'
import { COLORS } from '../services/constants'

// 纯 View 绘制的简约图标，无需依赖任何图标库

function HomeIcon({ focused, size = 24 }) {
  const color = focused ? COLORS.PRIMARY : COLORS.TEXT_HINT
  const s = size
  return (
    <View style={[styles.container, { width: s, height: s }]}>
      {/* 屋顶 */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        borderLeftWidth: s * 0.5, borderRightWidth: s * 0.5,
        borderBottomWidth: s * 0.45,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
      }} />
      {/* 墙体 */}
      <View style={{
        position: 'absolute', bottom: 0, left: s * 0.15, right: s * 0.15,
        height: s * 0.45, backgroundColor: color, borderRadius: 2,
      }} />
      {/* 门 */}
      <View style={{
        position: 'absolute', bottom: 0, alignSelf: 'center',
        width: s * 0.2, height: s * 0.28,
        backgroundColor: COLORS.BG_WHITE, borderRadius: 1,
      }} />
    </View>
  )
}

function BookIcon({ focused, size = 24 }) {
  const color = focused ? COLORS.PRIMARY : COLORS.TEXT_HINT
  const s = size
  return (
    <View style={[styles.container, { width: s, height: s }]}>
      {/* 书脊 */}
      <View style={{
        position: 'absolute', left: s * 0.25, width: s * 0.5, height: s,
        backgroundColor: color, borderRadius: 2,
      }} />
      {/* 左页 */}
      <View style={{
        position: 'absolute', left: 0, top: s * 0.1,
        width: s * 0.3, height: s * 0.8,
        backgroundColor: color, opacity: 0.5, borderRadius: 1,
      }} />
      {/* 右页 */}
      <View style={{
        position: 'absolute', right: 0, top: s * 0.1,
        width: s * 0.3, height: s * 0.8,
        backgroundColor: color, opacity: 0.5, borderRadius: 1,
      }} />
    </View>
  )
}

function ChartIcon({ focused, size = 24 }) {
  const color = focused ? COLORS.PRIMARY : COLORS.TEXT_HINT
  const s = size
  const barW = s * 0.18
  return (
    <View style={[styles.container, { width: s, height: s, justifyContent: 'flex-end' }]}>
      {/* Y 轴 */}
      <View style={{ position: 'absolute', left: 0, width: 2, height: s, backgroundColor: color, borderRadius: 1 }} />
      {/* X 轴 */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: color, borderRadius: 1 }} />
      {/* 柱 1 */}
      <View style={{ width: barW, height: s * 0.5, backgroundColor: color, borderRadius: 2, marginHorizontal: barW * 0.5, opacity: 0.7 }} />
      {/* 柱 2 */}
      <View style={{ width: barW, height: s * 0.75, backgroundColor: color, borderRadius: 2, marginHorizontal: barW * 0.5 }} />
      {/* 柱 3 */}
      <View style={{ width: barW, height: s * 0.4, backgroundColor: color, borderRadius: 2, marginHorizontal: barW * 0.5, opacity: 0.7 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  }
})

export { HomeIcon, BookIcon, ChartIcon }
