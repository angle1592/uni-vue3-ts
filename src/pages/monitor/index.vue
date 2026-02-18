<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">实时监控</text>
      <view class="live-badge">
        <view class="live-dot"></view>
        <text class="live-text">LIVE</text>
      </view>
    </view>

    <!-- 关键指标 -->
    <view class="metrics-section">
      <view class="metric-card">
        <text class="metric-value" :class="store.postureType">{{ store.postureText }}</text>
        <text class="metric-label">当前姿势</text>
      </view>
      <view class="metric-card">
        <text class="metric-value">{{ store.state.todayAbnormalCount }}</text>
        <text class="metric-label">今日异常</text>
      </view>
      <view class="metric-card">
        <text class="metric-value">{{ store.healthScore }}</text>
        <text class="metric-label">健康评分</text>
      </view>
    </view>

    <!-- 姿势详情 -->
    <view class="detail-section">
      <text class="section-title">姿势详情</text>
      <view class="detail-list">
        <view class="detail-item">
          <text class="item-label">坐姿状态</text>
          <view class="item-value">
            <text class="status-text" :class="store.state.isPosture ? 'normal' : 'danger'">
              {{ store.state.isPosture ? '正常' : '异常' }}
            </text>
          </view>
        </view>
        <view class="detail-item">
          <text class="item-label">监控模式</text>
          <view class="item-value">
            <text class="status-text normal">{{ store.modeText }}</text>
          </view>
        </view>
        <view class="detail-item">
          <text class="item-label">设备状态</text>
          <view class="item-value">
            <text class="status-text" :class="store.state.isOnline ? 'normal' : 'danger'">
              {{ store.state.isOnline ? '在线' : '离线' }}
            </text>
          </view>
        </view>
        <view class="detail-item">
          <text class="item-label">最后更新</text>
          <view class="item-value">
            <text class="info-text">{{ store.lastUpdateTimeText }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 实时日志 -->
    <view class="log-section">
      <view class="log-header">
        <text class="section-title">实时日志</text>
        <text class="clear-btn" @click="clearLogs">清空</text>
      </view>
      <scroll-view class="log-list" scroll-y>
        <view v-if="logs.length === 0" class="log-empty">
          <text>暂无日志记录</text>
        </view>
        <view
          v-for="(log, index) in logs"
          :key="index"
          :class="['log-item', log.type]"
        >
          <text class="log-time">{{ log.time }}</text>
          <text class="log-content">{{ log.message }}</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import store from '@/utils/store'

// 日志记录
interface LogEntry {
  time: string
  message: string
  type: string
}

const logs = ref<LogEntry[]>([])

// 添加日志
function addLog(message: string, type: string = 'info') {
  const now = new Date()
  const time = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  logs.value.unshift({ time, message, type })
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 清空日志
function clearLogs() {
  logs.value = []
  addLog('日志已清空', 'info')
}

// 监听姿势变化
watch(
  () => store.state.isPosture,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      if (newVal) {
        addLog('姿势已恢复正常', 'success')
      } else {
        addLog('检测到不良姿势', 'warning')
      }
    }
  }
)

// 监听设备在线状态变化
watch(
  () => store.state.isOnline,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      addLog(newVal ? '设备已上线' : '设备已离线', newVal ? 'success' : 'error')
    }
  }
)

// 页面显示时：加快轮询频率
onShow(() => {
  addLog('监控页面已打开', 'info')
  store.stopPolling()
  store.startPolling(3000)
})

// 页面隐藏时：恢复正常频率
onHide(() => {
  store.stopPolling()
  store.startPolling(5000)
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

  .live-badge {
    display: flex;
    align-items: center;
    background: #ff4d4f;
    padding: 8rpx 16rpx;
    border-radius: 8rpx;

    .live-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      background: #fff;
      margin-right: 10rpx;
      animation: pulse 1s infinite;
    }

    .live-text {
      font-size: 24rpx;
      color: #fff;
      font-weight: 600;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.metrics-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;

  .metric-card {
    flex: 1;
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx 20rpx;
    margin: 0 8rpx;
    text-align: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

    &:first-child { margin-left: 0; }
    &:last-child { margin-right: 0; }

    .metric-value {
      display: block;
      font-size: 40rpx;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 10rpx;

      &.normal { color: #52c41a; }
      &.abnormal { color: #ff4d4f; }
    }

    .metric-label {
      display: block;
      font-size: 24rpx;
      color: #999;
    }
  }
}

.detail-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-title {
    display: block;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
    margin-bottom: 20rpx;
  }

  .detail-list {
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child { border-bottom: none; }

      .item-label {
        font-size: 28rpx;
        color: #666;
      }

      .item-value {
        .status-text {
          font-size: 28rpx;
          font-weight: 600;
          &.normal { color: #52c41a; }
          &.warning { color: #faad14; }
          &.danger { color: #ff4d4f; }
        }
        .info-text {
          font-size: 26rpx;
          color: #999;
        }
      }
    }
  }
}

.log-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }

    .clear-btn {
      font-size: 24rpx;
      color: #667eea;
    }
  }

  .log-list {
    max-height: 400rpx;
    background: #f8f9fa;
    border-radius: 12rpx;
    padding: 20rpx;

    .log-empty {
      text-align: center;
      color: #999;
      font-size: 26rpx;
      padding: 40rpx 0;
    }

    .log-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16rpx;
      font-size: 24rpx;

      &:last-child { margin-bottom: 0; }
      &.info { color: #1890ff; }
      &.warning { color: #faad14; }
      &.error { color: #ff4d4f; }
      &.success { color: #52c41a; }

      .log-time {
        color: #999;
        margin-right: 16rpx;
        white-space: nowrap;
      }

      .log-content {
        flex: 1;
        word-break: break-all;
      }
    }
  }
}
</style>
