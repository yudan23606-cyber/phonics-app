// 离线缓存服务：AsyncStorage 缓存云端数据
// 写穿透模式：始终写入云端 + 缓存；读取时缓存优先，后台刷新

import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_PREFIX = '@phonics_cache_'
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 分钟

/**
 * 写入缓存
 * @param {string} key - 缓存键
 * @param {*} data - 要缓存的数据
 * @param {number} [ttl] - 过期时间（毫秒），默认 5 分钟
 */
export async function setCache(key, data, ttl = CACHE_EXPIRY_MS) {
  try {
    const entry = {
      data,
      expiresAt: Date.now() + ttl,
    }
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch (err) {
    console.warn('Cache write failed:', err.message)
  }
}

/**
 * 读取缓存
 * @param {string} key - 缓存键
 * @returns {*|null} 缓存的数据，过期或不存在返回 null
 */
export async function getCache(key) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null

    const entry = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return entry.data
  } catch (err) {
    console.warn('Cache read failed:', err.message)
    return null
  }
}

/**
 * 清除指定缓存
 */
export async function clearCache(key) {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key)
  } catch (_) {}
}

/**
 * 读取缓存，若不存在则调用 fetcher 获取并缓存
 * @param {string} key
 * @param {function} fetcher - 异步数据获取函数
 * @param {number} [ttl]
 * @returns {*}
 */
export async function getOrFetch(key, fetcher, ttl) {
  const cached = await getCache(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  if (fresh !== null && fresh !== undefined) {
    await setCache(key, fresh, ttl)
  }
  return fresh
}

export default { setCache, getCache, clearCache, getOrFetch }
