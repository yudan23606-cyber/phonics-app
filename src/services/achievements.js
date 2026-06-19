// 成就系统：定义、检查、计算

export const ACHIEVEMENTS = [
  { id: 'first_star',     title: '第一颗星',     desc: '获得第一颗星星',         icon: '⭐', check: (s) => s.totalStars >= 1 },
  { id: 'star_10',        title: '星星收集者',    desc: '累计获得 10 颗星星',      icon: '🌟', check: (s) => s.totalStars >= 10 },
  { id: 'star_50',        title: '星光璀璨',      desc: '累计获得 50 颗星星',      icon: '✨', check: (s) => s.totalStars >= 50 },
  { id: 'streak_3',       title: '小小坚持',      desc: '连续打卡 3 天',           icon: '🔥', check: (s) => s.streakDays >= 3 },
  { id: 'streak_7',       title: '一周达人',      desc: '连续打卡 7 天',           icon: '🔥', check: (s) => s.streakDays >= 7 },
  { id: 'streak_30',      title: '月度之星',      desc: '连续打卡 30 天',          icon: '🏆', check: (s) => s.streakDays >= 30 },
  { id: 'practice_10',    title: '练习新手',      desc: '完成 10 次练习',          icon: '📖', check: (s) => (s.totalPractices || 0) >= 10 },
  { id: 'practice_50',    title: '练习达人',      desc: '完成 50 次练习',          icon: '📚', check: (s) => (s.totalPractices || 0) >= 50 },
  { id: 'set1_master',    title: '第一阶段',      desc: '掌握 Set 1 全部音素',     icon: '🎯', check: (s) => (s.setMastered?.[1] || 0) >= 4 },
  { id: 'set2_master',    title: '第二阶段',      desc: '掌握 Set 2 全部音素',     icon: '🎯', check: (s) => (s.setMastered?.[2] || 0) >= 4 },
  { id: 'set3_master',    title: '第三阶段',      desc: '掌握 Set 3 全部音素',     icon: '🎯', check: (s) => (s.setMastered?.[3] || 0) >= 4 },
  { id: 'set4_master',    title: '第四阶段',      desc: '掌握 Set 4 全部音素',     icon: '🎯', check: (s) => (s.setMastered?.[4] || 0) >= 4 },
  { id: 'set5_master',    title: '第五阶段',      desc: '掌握 Set 5 全部音素',     icon: '🎯', check: (s) => (s.setMastered?.[5] || 0) >= 4 },
  { id: 'phase2_done',    title: '拼读毕业！',    desc: '掌握 Phase 2 全部音素',   icon: '🎓', check: (s) => {
    for (let i = 1; i <= 5; i++) {
      if ((s.setMastered?.[i] || 0) < 4) return false
    }
    return true
  }},
]

/**
 * 检查用户数据，返回已解锁的成就列表
 * @param {object} userStats - { totalStars, streakDays, totalPractices, setMastered }
 * @param {string[]} unlockedIds - 已解锁的成就 ID 列表
 * @returns {{ newlyUnlocked: object[], allUnlocked: object[] }}
 */
export function checkAchievements(userStats, unlockedIds = []) {
  const unlockedSet = new Set(unlockedIds)
  const newlyUnlocked = []
  const allUnlocked = []

  for (const ach of ACHIEVEMENTS) {
    const earned = ach.check(userStats)
    if (earned) {
      allUnlocked.push(ach)
      if (!unlockedSet.has(ach.id)) {
        newlyUnlocked.push(ach)
      }
    }
  }

  return { newlyUnlocked, allUnlocked }
}

export default { ACHIEVEMENTS, checkAchievements }
