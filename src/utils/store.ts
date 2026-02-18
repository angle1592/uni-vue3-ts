/**
 * 全局响应式状态管理
 * 所有页面共享的设备数据、连接状态、统计信息
 * 通过轮询OneNET API获取最新数据
 */

import { reactive, computed } from 'vue'
import { queryDeviceProperty, queryDeviceStatus, restoreToken } from './oneNetApi'
import type { PropertyItem } from './oneNetApi'

// ===== 状态定义 =====
interface AppState {
  // 设备连接状态
  isOnline: boolean
  lastCheckTime: number

  // 姿势数据
  isPosture: boolean       // true=正常坐姿, false=异常坐姿
  lastPostureTime: number  // 最后姿势数据时间戳(毫秒)

  // 今日统计数据 (本地累计)
  todayAbnormalCount: number
  todayGoodMinutes: number
  todayTotalMinutes: number

  // 控制状态 (从设备同步或本地设置)
  monitoringEnabled: boolean
  currentMode: string       // 'posture' | 'clock' | 'timer'
  sensitivity: number       // 灵敏度 0-100

  // 轮询控制
  pollingTimer: ReturnType<typeof setInterval> | null
  isPolling: boolean

  // 加载/错误状态
  isLoading: boolean
  lastError: string | null
}

// ===== 响应式状态 =====
const state = reactive<AppState>({
  isOnline: false,
  lastCheckTime: 0,

  isPosture: true,
  lastPostureTime: 0,

  todayAbnormalCount: 0,
  todayGoodMinutes: 0,
  todayTotalMinutes: 0,

  monitoringEnabled: true,
  currentMode: 'posture',
  sensitivity: 75,

  pollingTimer: null,
  isPolling: false,

  isLoading: false,
  lastError: null,
})

// ===== 计算属性 =====

/** 当前姿势文本 */
const postureText = computed(() => state.isPosture ? '良好' : '异常')

/** 当前姿势类型CSS类名 */
const postureType = computed(() => state.isPosture ? 'normal' : 'abnormal')

/** 今日健康评分 (0-100) */
const healthScore = computed(() => {
  if (state.todayTotalMinutes === 0) return 100
  return Math.round((state.todayGoodMinutes / state.todayTotalMinutes) * 100)
})

/** 最后更新时间文本 */
const lastUpdateTimeText = computed(() => {
  if (state.lastPostureTime === 0) return '暂无数据'
  const d = new Date(state.lastPostureTime)
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

/** 今日使用时长文本 */
const usageTimeText = computed(() => {
  const m = state.todayTotalMinutes
  if (m === 0) return '0分钟'
  const hours = Math.floor(m / 60)
  const mins = m % 60
  if (hours > 0) return `${hours}小时${mins}分`
  return `${mins}分钟`
})

/** 当前模式文本 */
const modeText = computed(() => {
  const map: Record<string, string> = {
    posture: '坐姿检测模式',
    clock: '时钟模式',
    timer: '定时器模式',
  }
  return map[state.currentMode] || state.currentMode
})

// ===== 操作方法 =====

/** 初始化: 恢复token和本地统计 */
function init() {
  restoreToken()
  loadLocalStats()
  loadLocalSettings()
  console.log('[Store] 初始化完成')
}

/** 从OneNET获取最新设备数据 */
async function fetchLatest() {
  state.isLoading = true
  state.lastError = null
  try {
    // 查询设备属性 (返回PropertyItem[]列表)
    const props = await queryDeviceProperty()
    if (props && props.length > 0) {
      // 从属性列表中查找 isPosture
      const postureProp = props.find((p: PropertyItem) => p.identifier === 'isPosture')
      if (postureProp) {
        const oldPosture = state.isPosture
        state.isPosture = postureProp.value === true || postureProp.value === 'true'
        state.lastPostureTime = typeof postureProp.time === 'number'
          ? postureProp.time
          : new Date(postureProp.time).getTime() || Date.now()

        // 如果从正常变为异常，增加异常计数
        if (oldPosture && !state.isPosture) {
          state.todayAbnormalCount++
          saveLocalStats()
        }
      }

      // 解析 monitoringEnabled 属性（如果存在）
      const monProp = props.find((p: PropertyItem) => p.identifier === 'monitoringEnabled')
      if (monProp) {
        state.monitoringEnabled = monProp.value === true || monProp.value === 'true'
      }

      // 设备能返回数据 = 在线
      state.isOnline = true
    } else {
      // 属性查询无数据，尝试单独查询设备状态
      const status = await queryDeviceStatus()
      state.isOnline = status
    }

    state.lastCheckTime = Date.now()
  } catch (e: any) {
    state.lastError = e.message || '获取数据失败'
    state.isOnline = false
    console.error('[Store] 获取数据失败:', e)
  } finally {
    state.isLoading = false
  }
}

/** 开始定时轮询 */
function startPolling(intervalMs: number = 5000) {
  if (state.isPolling) return

  state.isPolling = true
  fetchLatest() // 立即执行一次

  state.pollingTimer = setInterval(() => {
    fetchLatest()
  }, intervalMs)

  console.log('[Store] 开始轮询, 间隔:', intervalMs, 'ms')
}

/** 停止轮询 */
function stopPolling() {
  if (state.pollingTimer) {
    clearInterval(state.pollingTimer)
    state.pollingTimer = null
  }
  state.isPolling = false
  console.log('[Store] 停止轮询')
}

/** 保存今日统计到本地存储 */
function saveLocalStats() {
  const today = new Date().toISOString().split('T')[0]
  uni.setStorageSync('postureStats', {
    date: today,
    abnormalCount: state.todayAbnormalCount,
    goodMinutes: state.todayGoodMinutes,
    totalMinutes: state.todayTotalMinutes,
  })
}

/** 从本地存储恢复今日统计 */
function loadLocalStats() {
  try {
    const saved = uni.getStorageSync('postureStats') as any
    if (saved) {
      const today = new Date().toISOString().split('T')[0]
      if (saved.date === today) {
        state.todayAbnormalCount = saved.abnormalCount || 0
        state.todayGoodMinutes = saved.goodMinutes || 0
        state.todayTotalMinutes = saved.totalMinutes || 0
      }
      // 如果日期不匹配，保持默认值0
    }
  } catch (e) {
    console.error('[Store] 加载本地统计失败:', e)
  }
}

/** 保存控制设置到本地 */
function saveLocalSettings() {
  uni.setStorageSync('controlSettings', {
    currentMode: state.currentMode,
    sensitivity: state.sensitivity,
    monitoringEnabled: state.monitoringEnabled,
  })
}

/** 从本地恢复控制设置 */
function loadLocalSettings() {
  try {
    const saved = uni.getStorageSync('controlSettings') as any
    if (saved) {
      state.currentMode = saved.currentMode || 'posture'
      state.sensitivity = saved.sensitivity ?? 75
      state.monitoringEnabled = saved.monitoringEnabled ?? true
    }
  } catch (e) {
    console.error('[Store] 加载本地设置失败:', e)
  }
}

/** 重置今日统计 */
function resetTodayStats() {
  state.todayAbnormalCount = 0
  state.todayGoodMinutes = 0
  state.todayTotalMinutes = 0
  saveLocalStats()
}

// ===== 导出 =====
export const store = reactive({
  // 状态
  state,

  // 计算属性
  postureText,
  postureType,
  healthScore,
  lastUpdateTimeText,
  usageTimeText,
  modeText,

  // 方法
  init,
  fetchLatest,
  startPolling,
  stopPolling,
  saveLocalStats,
  saveLocalSettings,
  resetTodayStats,
})

export default store
