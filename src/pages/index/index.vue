<template>
  <view class="container">
    <!-- 设备状态卡片 -->
    <view class="status-card">
      <view class="status-header">
        <text class="status-title">设备状态</text>
        <view class="status-badge" :class="store.state.isOnline ? 'online' : 'offline'">
          <view class="status-dot"></view>
          <text class="status-text">{{ store.state.isOnline ? '在线' : '离线' }}</text>
        </view>
      </view>
      <view class="status-grid">
        <view class="status-item">
          <text class="item-value" :class="store.postureType">{{ store.postureText }}</text>
          <text class="item-label">当前姿势</text>
        </view>
        <view class="status-item">
          <text class="item-value">{{ store.state.todayAbnormalCount }}</text>
          <text class="item-label">今日异常</text>
        </view>
        <view class="status-item">
          <text class="item-value">{{ store.usageTimeText }}</text>
          <text class="item-label">使用时长</text>
        </view>
      </view>
    </view>

    <!-- 实时姿势监控 -->
    <view class="monitor-section">
      <view class="section-header">
        <text class="section-title">实时姿势监控</text>
        <text class="update-time">更新于 {{ store.lastUpdateTimeText }}</text>
      </view>
      <view class="posture-display">
        <view class="posture-figure" :class="store.postureType">
          <view class="figure-head"></view>
          <view class="figure-body"></view>
        </view>
        <view class="posture-info">
          <text class="posture-status">{{ store.state.isPosture ? '姿势良好' : '姿势异常' }}</text>
          <text class="posture-desc">{{ store.state.isPosture ? '您的坐姿保持良好，继续保持！' : '检测到不良坐姿，请及时纠正' }}</text>
          <view class="mode-info">
            <text class="mode-tag">{{ store.modeText }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 今日健康评分 -->
    <view class="health-section">
      <view class="section-header">
        <text class="section-title">今日健康评分</text>
      </view>
      <view class="health-score">
        <view class="score-circle" :class="scoreLevel">
          <text class="score-value">{{ store.healthScore }}</text>
          <text class="score-label">分</text>
        </view>
        <view class="score-detail">
          <view class="detail-item">
            <text class="detail-label">良好姿势</text>
            <text class="detail-value good">{{ goodPercent }}%</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">异常姿势</text>
            <text class="detail-value bad">{{ badPercent }}%</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">监控状态</text>
            <text class="detail-value" :class="store.state.monitoringEnabled ? 'good' : ''">
              {{ store.state.monitoringEnabled ? '开启中' : '已关闭' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="goTo('/pages/monitor/index')">
        <text class="action-icon-text">M</text>
        <text class="action-text">详细监控</text>
      </view>
      <view class="action-item" @click="goTo('/pages/history/index')">
        <text class="action-icon-text">H</text>
        <text class="action-text">历史记录</text>
      </view>
      <view class="action-item" @click="goTo('/pages/control/index')">
        <text class="action-icon-text">C</text>
        <text class="action-text">远程控制</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import store from '@/utils/store'

// 计算属性
const goodPercent = computed(() => store.healthScore)
const badPercent = computed(() => 100 - store.healthScore)
const scoreLevel = computed(() => {
  const s = store.healthScore
  if (s >= 85) return 'excellent'
  if (s >= 70) return 'good'
  return 'poor'
})

// 页面跳转 (tabBar页面用switchTab)
function goTo(url: string) {
  uni.switchTab({ url })
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
  padding-bottom: 40rpx;
}

// 设备状态卡片
.status-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .status-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .status-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .status-badge {
      display: flex;
      align-items: center;
      padding: 8rpx 20rpx;
      border-radius: 30rpx;

      &.online {
        background: #e6f7e6;
        .status-dot { background: #52c41a; }
        .status-text { color: #52c41a; }
      }

      &.offline {
        background: #fff2f0;
        .status-dot { background: #ff4d4f; }
        .status-text { color: #ff4d4f; }
      }

      .status-dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        margin-right: 10rpx;
      }

      .status-text {
        font-size: 24rpx;
        font-weight: 500;
      }
    }
  }

  .status-grid {
    display: flex;
    justify-content: space-around;

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .item-value {
        font-size: 40rpx;
        font-weight: 700;
        color: #333;
        margin-bottom: 10rpx;

        &.normal { color: #52c41a; }
        &.abnormal { color: #ff4d4f; }
      }

      .item-label {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

// 实时姿势监控
.monitor-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .update-time {
      font-size: 24rpx;
      color: #999;
    }
  }

  .posture-display {
    display: flex;
    align-items: center;
    padding: 30rpx;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20rpx;

    .posture-figure {
      width: 160rpx;
      height: 220rpx;
      margin-right: 40rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .figure-head {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        margin-bottom: 10rpx;
      }

      .figure-body {
        width: 80rpx;
        height: 100rpx;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 40rpx;
      }

      &.abnormal {
        transform: rotate(15deg);
        .figure-head, .figure-body {
          background: rgba(255, 77, 79, 0.7);
        }
      }
    }

    .posture-info {
      flex: 1;
      color: #fff;

      .posture-status {
        display: block;
        font-size: 40rpx;
        font-weight: 700;
        margin-bottom: 10rpx;
      }

      .posture-desc {
        display: block;
        font-size: 26rpx;
        opacity: 0.9;
        margin-bottom: 20rpx;
      }

      .mode-info {
        .mode-tag {
          display: inline-block;
          font-size: 22rpx;
          padding: 6rpx 16rpx;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20rpx;
        }
      }
    }
  }
}

// 健康评分
.health-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-header {
    margin-bottom: 30rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .health-score {
    display: flex;
    align-items: center;

    .score-circle {
      width: 200rpx;
      height: 200rpx;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-right: 40rpx;

      &.excellent {
        background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
        box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.3);
      }
      &.good {
        background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
        box-shadow: 0 8rpx 24rpx rgba(250, 173, 20, 0.3);
      }
      &.poor {
        background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
        box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.3);
      }

      .score-value {
        font-size: 72rpx;
        font-weight: 700;
        color: #fff;
        line-height: 1;
      }

      .score-label {
        font-size: 28rpx;
        color: #fff;
        opacity: 0.9;
      }
    }

    .score-detail {
      flex: 1;

      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16rpx 0;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child { border-bottom: none; }

        .detail-label {
          font-size: 28rpx;
          color: #666;
        }

        .detail-value {
          font-size: 32rpx;
          font-weight: 600;
          color: #333;

          &.good { color: #52c41a; }
          &.bad { color: #ff4d4f; }
        }
      }
    }
  }
}

// 快捷操作
.quick-actions {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30rpx 40rpx;
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
    flex: 1;
    margin: 0 10rpx;

    &:first-child { margin-left: 0; }
    &:last-child { margin-right: 0; }

    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }

    .action-icon-text {
      width: 60rpx;
      height: 60rpx;
      line-height: 60rpx;
      text-align: center;
      font-size: 28rpx;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      margin-bottom: 12rpx;
    }

    .action-text {
      font-size: 24rpx;
      color: #666;
    }
  }
}
</style>
