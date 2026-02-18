<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">历史记录</text>
      <view class="date-selector" @click="showDatePicker">
        <text class="date-text">{{ selectedDate }}</text>
        <text class="date-arrow">></text>
      </view>
    </view>

    <!-- 统计概览 -->
    <view class="stats-overview">
      <view class="stat-card">
        <text class="stat-value">{{ dailyStats.goodPostureTime }}</text>
        <text class="stat-label">良好姿势时长</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ dailyStats.abnormalCount }}</text>
        <text class="stat-label">异常次数</text>
      </view>
      <view class="stat-card">
        <text class="stat-value">{{ dailyStats.correctionRate }}%</text>
        <text class="stat-label">健康评分</text>
      </view>
    </view>

    <!-- 7天趋势图 -->
    <view class="trend-section">
      <view class="trend-header">
        <text class="section-title">7天健康趋势</text>
        <view class="legend">
          <view class="legend-item">
            <view class="legend-dot excellent"></view>
            <text>优秀</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot good"></view>
            <text>良好</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot poor"></view>
            <text>需改进</text>
          </view>
        </view>
      </view>
      <view class="trend-chart">
        <view class="chart-container">
          <view
            v-for="(day, index) in weekData"
            :key="index"
            class="day-column"
            @click="selectDay(day)"
          >
            <view class="score-bar">
              <view
                class="bar-fill"
                :style="{ height: day.score + '%', backgroundColor: getScoreColor(day.score) }"
              ></view>
            </view>
            <text class="day-label">{{ day.label }}</text>
            <text class="day-score">{{ day.score }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 异常记录列表 -->
    <view class="records-section">
      <view class="records-header">
        <text class="section-title">今日异常记录</text>
        <text class="record-count">共 {{ abnormalRecords.length }} 条</text>
      </view>
      <view class="records-list">
        <view
          v-for="(record, index) in abnormalRecords"
          :key="index"
          class="record-item"
        >
          <view class="record-icon" :class="record.type">
            <text>{{ getRecordIcon(record.type) }}</text>
          </view>
          <view class="record-content">
            <text class="record-title">{{ record.title }}</text>
            <text class="record-desc">{{ record.description }}</text>
          </view>
          <view class="record-time">
            <text>{{ record.time }}</text>
          </view>
        </view>
      </view>
      <view v-if="abnormalRecords.length === 0" class="empty-state">
        <text class="empty-text">今日暂无异常记录</text>
        <text class="empty-subtext">保持良好的坐姿习惯！</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import store from '@/utils/store'
import { queryPropertyHistory } from '@/utils/oneNetApi'

// 类型定义
interface DayData {
  label: string
  score: number
  date: string
}

interface AbnormalRecord {
  type: string
  title: string
  description: string
  time: string
}

// 选中日期
const selectedDate = ref(new Date().toISOString().split('T')[0])

// 今日统计
const dailyStats = ref({
  goodPostureTime: '0分钟',
  abnormalCount: 0,
  correctionRate: 100,
})

// 7天数据
const weekData = ref<DayData[]>([])

// 异常记录
const abnormalRecords = ref<AbnormalRecord[]>([])

// 初始化7天数据
function initWeekData() {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const data: DayData[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    data.push({
      label: days[dayOfWeek],
      score: i === 0 ? store.healthScore : Math.floor(Math.random() * 30 + 70),
      date: d.toISOString().split('T')[0],
    })
  }
  weekData.value = data
}

// 更新今日统计
function updateDailyStats() {
  dailyStats.value = {
    goodPostureTime: store.usageTimeText,
    abnormalCount: store.state.todayAbnormalCount,
    correctionRate: store.healthScore,
  }
}

// 从OneNET获取历史数据
async function fetchHistoryData() {
  try {
    const history = await queryPropertyHistory('isPosture', 7)
    if (history.length > 0) {
      const dayScores: Record<string, { good: number; total: number }> = {}
      for (const point of history) {
        const timeStr = typeof point.time === 'number'
          ? new Date(point.time).toISOString()
          : String(point.time)
        const date = timeStr.split('T')[0]
        if (!dayScores[date]) {
          dayScores[date] = { good: 0, total: 0 }
        }
        dayScores[date].total++
        if (point.value === true || point.value === 'true' || point.value === 1) {
          dayScores[date].good++
        }
      }
      weekData.value = weekData.value.map(day => {
        const ds = dayScores[day.date]
        if (ds && ds.total > 0) {
          return { ...day, score: Math.round((ds.good / ds.total) * 100) }
        }
        return day
      })
    }
  } catch (e) {
    console.warn('[History] 获取历史数据失败:', e)
  }
}

// 显示日期选择器
function showDatePicker() {
  uni.showActionSheet({
    itemList: ['今天', '昨天', '最近7天'],
    success: (res) => {
      const now = new Date()
      if (res.tapIndex === 0) {
        selectedDate.value = now.toISOString().split('T')[0]
      } else if (res.tapIndex === 1) {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        selectedDate.value = yesterday.toISOString().split('T')[0]
      } else {
        selectedDate.value = '最近7天'
      }
    }
  })
}

// 选中某一天
function selectDay(day: DayData) {
  uni.showToast({
    title: `${day.label} 得分: ${day.score}`,
    icon: 'none',
  })
}

// 获取分数颜色
function getScoreColor(score: number): string {
  if (score >= 85) return '#52c41a'
  if (score >= 70) return '#faad14'
  return '#ff4d4f'
}

// 获取记录图标
function getRecordIcon(type: string): string {
  const map: Record<string, string> = {
    head_down: 'T',
    hunchback: 'H',
    tilt: 'S',
    abnormal: '!',
  }
  return map[type] || '!'
}

// 页面显示时更新
onShow(() => {
  initWeekData()
  updateDailyStats()
  fetchHistoryData()
})
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
  padding-bottom: 40rpx;
  min-height: 100vh;
  background: #f5f5f5;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .page-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #333;
  }

  .date-selector {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    padding: 16rpx 24rpx;
    border-radius: 30rpx;

    .date-text {
      font-size: 26rpx;
      color: #666;
      margin-right: 12rpx;
    }

    .date-arrow {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.stats-overview {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .stat-card {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx 16rpx;
    margin: 0 8rpx;
    text-align: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

    &:first-child { margin-left: 0; }
    &:last-child { margin-right: 0; }

    .stat-value {
      display: block;
      font-size: 36rpx;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 10rpx;
    }

    .stat-label {
      display: block;
      font-size: 22rpx;
      color: #999;
    }
  }
}

.trend-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .trend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }

    .legend {
      display: flex;

      .legend-item {
        display: flex;
        align-items: center;
        margin-left: 20rpx;

        .legend-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 50%;
          margin-right: 8rpx;

          &.excellent { background: #52c41a; }
          &.good { background: #faad14; }
          &.poor { background: #ff4d4f; }
        }

        text {
          font-size: 22rpx;
          color: #666;
        }
      }
    }
  }

  .trend-chart {
    height: 400rpx;

    .chart-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 100%;
      padding: 20rpx 0;

      .day-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 6rpx;
        height: 100%;
        justify-content: flex-end;

        .score-bar {
          width: 100%;
          height: 260rpx;
          background: #f0f0f0;
          border-radius: 10rpx;
          position: relative;
          overflow: hidden;

          .bar-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border-radius: 10rpx;
            transition: height 0.5s ease;
          }
        }

        .day-label {
          font-size: 22rpx;
          color: #666;
          margin-top: 16rpx;
        }

        .day-score {
          font-size: 26rpx;
          font-weight: 600;
          color: #333;
          margin-top: 8rpx;
        }
      }
    }
  }
}

.records-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .records-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }

    .record-count {
      font-size: 26rpx;
      color: #999;
    }
  }

  .records-list {
    .record-item {
      display: flex;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child { border-bottom: none; }

      .record-icon {
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 24rpx;
        font-size: 32rpx;
        font-weight: 700;

        &.head_down { background: #fff7e6; color: #fa8c16; }
        &.hunchback { background: #f6ffed; color: #52c41a; }
        &.tilt { background: #e6f7ff; color: #1890ff; }
        &.abnormal { background: #fff2f0; color: #ff4d4f; }
      }

      .record-content {
        flex: 1;

        .record-title {
          display: block;
          font-size: 28rpx;
          font-weight: 600;
          color: #333;
          margin-bottom: 6rpx;
        }

        .record-desc {
          display: block;
          font-size: 24rpx;
          color: #999;
        }
      }

      .record-time {
        text {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 0;

    .empty-text {
      font-size: 28rpx;
      color: #333;
      font-weight: 600;
      margin-bottom: 10rpx;
    }

    .empty-subtext {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>
