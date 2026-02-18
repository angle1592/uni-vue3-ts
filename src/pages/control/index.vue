<template>
  <view class="container">
    <!-- 页面标题 -->
    <view class="page-header">
      <text class="page-title">远程控制</text>
      <view class="connection-status" :class="store.state.isOnline ? 'online' : 'offline'">
        <view class="status-dot"></view>
        <text class="status-text">{{ store.state.isOnline ? '已连接' : '未连接' }}</text>
      </view>
    </view>

    <!-- 设备信息卡片 -->
    <view class="device-card">
      <view class="device-header">
        <view class="device-icon">
          <text class="icon-text">P</text>
        </view>
        <view class="device-info">
          <text class="device-name">智能语音坐姿提醒器</text>
          <text class="device-id">设备: ESP32-S3-N16R8</text>
        </view>
      </view>
      <view class="device-status">
        <view class="status-item">
          <text class="s-label">运行状态</text>
          <text class="s-value" :class="store.state.monitoringEnabled ? 'running' : ''">
            {{ store.state.monitoringEnabled ? '运行中' : '已停止' }}
          </text>
        </view>
        <view class="status-item">
          <text class="s-label">工作模式</text>
          <text class="s-value">{{ store.modeText }}</text>
        </view>
        <view class="status-item">
          <text class="s-label">使用时长</text>
          <text class="s-value">{{ store.usageTimeText }}</text>
        </view>
      </view>
    </view>

    <!-- 工作模式选择 -->
    <view class="mode-section">
      <view class="section-title-row">
        <text class="section-title">工作模式</text>
        <text class="section-desc">选择适合的检测模式</text>
      </view>
      <view class="mode-options">
        <view
          v-for="mode in modeOptions"
          :key="mode.value"
          class="mode-item"
          :class="{ active: store.state.currentMode === mode.value, disabled: !store.state.isOnline }"
          @click="selectMode(mode.value)"
        >
          <view class="mode-icon-box">
            <text class="mode-icon-letter">{{ mode.icon }}</text>
          </view>
          <view class="mode-info">
            <text class="mode-name">{{ mode.label }}</text>
            <text class="mode-desc">{{ mode.description }}</text>
          </view>
          <view class="mode-check" v-if="store.state.currentMode === mode.value">
            <text class="check-mark">V</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提醒方式设置 -->
    <view class="reminder-section">
      <view class="section-title-row">
        <text class="section-title">提醒方式</text>
        <text class="section-desc">设置异常时的提醒方式</text>
      </view>
      <view class="reminder-options">
        <view
          v-for="reminder in reminderOptions"
          :key="reminder.value"
          class="reminder-item"
          :class="{ active: selectedReminders.includes(reminder.value), disabled: !store.state.isOnline }"
          @click="toggleReminder(reminder.value)"
        >
          <text class="reminder-icon">{{ reminder.icon }}</text>
          <text class="reminder-name">{{ reminder.label }}</text>
          <view class="reminder-check" v-if="selectedReminders.includes(reminder.value)">
            <text>V</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 灵敏度调节 -->
    <view class="sensitivity-section">
      <view class="sensitivity-header">
        <text class="section-title">检测灵敏度</text>
        <text class="sensitivity-value">{{ store.state.sensitivity }}%</text>
      </view>
      <slider
        class="sensitivity-slider"
        :value="store.state.sensitivity"
        @change="onSensitivityChange"
        min="0"
        max="100"
        :disabled="!store.state.isOnline"
        show-value
        activeColor="#667eea"
        backgroundColor="#e0e0e0"
        block-color="#667eea"
        :block-size="28"
      />
      <view class="sensitivity-labels">
        <text>宽松</text>
        <text>适中</text>
        <text>严格</text>
      </view>
    </view>

    <!-- 定时提醒 -->
    <view class="timer-section">
      <view class="timer-header">
        <text class="section-title">定时提醒</text>
        <switch
          :checked="timerEnabled"
          @change="onTimerSwitch"
          :disabled="!store.state.isOnline"
          color="#667eea"
        />
      </view>
      <view v-if="timerEnabled" class="timer-settings">
        <view class="timer-row">
          <text class="timer-label">提醒间隔</text>
          <picker mode="selector" :range="intervalOptions" :value="selectedInterval" @change="onIntervalChange">
            <view class="picker-value">{{ intervalOptions[selectedInterval] }}</view>
          </picker>
        </view>
        <view class="timer-row">
          <text class="timer-label">开始时间</text>
          <picker mode="time" :value="startTime" @change="onStartTimeChange">
            <view class="picker-value">{{ startTime }}</view>
          </picker>
        </view>
        <view class="timer-row">
          <text class="timer-label">结束时间</text>
          <picker mode="time" :value="endTime" @change="onEndTimeChange">
            <view class="picker-value">{{ endTime }}</view>
          </picker>
        </view>
      </view>
    </view>

    <!-- 系统控制按钮 -->
    <view class="control-buttons">
      <button
        class="control-btn"
        :class="store.state.monitoringEnabled ? 'stop' : 'start'"
        @click="toggleSystem"
        :disabled="!store.state.isOnline"
      >
        <text class="btn-text">{{ store.state.monitoringEnabled ? '停止系统' : '启动系统' }}</text>
      </button>
      <button class="control-btn reset" @click="resetSettings" :disabled="!store.state.isOnline">
        <text class="btn-text">恢复默认</text>
      </button>
    </view>

    <view class="safe-area-bottom"></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import store from '@/utils/store'
import { setDeviceProperty } from '@/utils/oneNetApi'

// 工作模式选项 (对应ESP32的EC11三个模式)
const modeOptions = ref([
  { value: 'posture', label: '坐姿检测模式', icon: 'A', description: '全自动检测和提醒' },
  { value: 'clock', label: '时钟模式', icon: 'C', description: '显示时间和日期' },
  { value: 'timer', label: '定时器模式', icon: 'T', description: '倒计时提醒功能' },
])

// 提醒方式选项
const reminderOptions = ref([
  { value: 'voice', label: '语音提醒', icon: 'V' },
  { value: 'light', label: '灯光提醒', icon: 'L' },
  { value: 'sound', label: '蜂鸣器', icon: 'B' },
  { value: 'phone', label: '手机推送', icon: 'P' },
])
const selectedReminders = ref<string[]>(['voice', 'light'])

// 定时器设置
const timerEnabled = ref(false)
const intervalOptions = ref(['15分钟', '30分钟', '1小时', '2小时'])
const selectedInterval = ref(1)
const startTime = ref('09:00')
const endTime = ref('18:00')

// 加载本地设置
function loadSettings() {
  try {
    const saved = uni.getStorageSync('controlPageSettings') as any
    if (saved) {
      selectedReminders.value = saved.selectedReminders || ['voice', 'light']
      timerEnabled.value = saved.timerEnabled || false
      selectedInterval.value = saved.selectedInterval ?? 1
      startTime.value = saved.startTime || '09:00'
      endTime.value = saved.endTime || '18:00'
    }
  } catch (e) {
    console.error('[Control] 加载设置失败:', e)
  }
}

// 保存设置到本地
function saveSettings() {
  uni.setStorageSync('controlPageSettings', {
    selectedReminders: selectedReminders.value,
    timerEnabled: timerEnabled.value,
    selectedInterval: selectedInterval.value,
    startTime: startTime.value,
    endTime: endTime.value,
  })
}

// 选择工作模式
async function selectMode(mode: string) {
  if (!store.state.isOnline) {
    uni.showToast({ title: '设备未连接', icon: 'none' })
    return
  }
  store.state.currentMode = mode
  store.saveLocalSettings()

  const success = await setDeviceProperty({ currentMode: mode })
  const modeLabel = modeOptions.value.find(m => m.value === mode)?.label || mode
  uni.showToast({
    title: success ? `已切换到${modeLabel}` : '切换失败，请重试',
    icon: success ? 'success' : 'none',
  })
}

// 切换提醒方式
function toggleReminder(value: string) {
  if (!store.state.isOnline) {
    uni.showToast({ title: '设备未连接', icon: 'none' })
    return
  }
  const index = selectedReminders.value.indexOf(value)
  if (index > -1) {
    selectedReminders.value.splice(index, 1)
  } else {
    selectedReminders.value.push(value)
  }
  saveSettings()
  setDeviceProperty({ reminders: selectedReminders.value })
}

// 灵敏度变化
function onSensitivityChange(e: any) {
  store.state.sensitivity = e.detail.value
  store.saveLocalSettings()
  setDeviceProperty({ sensitivity: store.state.sensitivity })
}

// 定时器开关
function onTimerSwitch(e: any) {
  timerEnabled.value = e.detail.value
  saveSettings()
  setDeviceProperty({
    timerEnabled: timerEnabled.value,
    timerInterval: selectedInterval.value,
    timerStart: startTime.value,
    timerEnd: endTime.value,
  })
}

// 间隔选择
function onIntervalChange(e: any) {
  selectedInterval.value = e.detail.value
  saveSettings()
}

// 开始时间
function onStartTimeChange(e: any) {
  startTime.value = e.detail.value
  saveSettings()
}

// 结束时间
function onEndTimeChange(e: any) {
  endTime.value = e.detail.value
  saveSettings()
}

// 切换系统运行状态
async function toggleSystem() {
  if (!store.state.isOnline) {
    uni.showToast({ title: '设备未连接', icon: 'none' })
    return
  }
  const newState = !store.state.monitoringEnabled
  store.state.monitoringEnabled = newState
  store.saveLocalSettings()

  const success = await setDeviceProperty({ monitoringEnabled: newState })
  uni.showToast({
    title: success
      ? (newState ? '系统已启动' : '系统已停止')
      : '操作失败，请重试',
    icon: success ? 'success' : 'none',
  })
}

// 恢复默认设置
function resetSettings() {
  uni.showModal({
    title: '恢复默认设置',
    content: '确定要恢复所有设置到默认值吗？',
    success: async (res) => {
      if (res.confirm) {
        store.state.currentMode = 'posture'
        store.state.sensitivity = 75
        store.state.monitoringEnabled = true
        selectedReminders.value = ['voice', 'light']
        timerEnabled.value = false
        selectedInterval.value = 1
        startTime.value = '09:00'
        endTime.value = '18:00'

        store.saveLocalSettings()
        saveSettings()

        await setDeviceProperty({
          currentMode: 'posture',
          sensitivity: 75,
          monitoringEnabled: true,
        })

        uni.showToast({ title: '已恢复默认设置', icon: 'success' })
      }
    }
  })
}

// 页面显示时加载设置
onShow(() => {
  loadSettings()
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

  .connection-status {
    display: flex;
    align-items: center;
    padding: 12rpx 24rpx;
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
      margin-right: 12rpx;
    }

    .status-text {
      font-size: 24rpx;
      font-weight: 500;
    }
  }
}

.device-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .device-header {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    padding-bottom: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .device-icon {
      width: 100rpx;
      height: 100rpx;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 24rpx;

      .icon-text {
        font-size: 48rpx;
        font-weight: 700;
        color: #fff;
      }
    }

    .device-info {
      flex: 1;

      .device-name {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 8rpx;
      }

      .device-id {
        display: block;
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  .device-status {
    display: flex;
    justify-content: space-around;

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .s-label {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 8rpx;
      }

      .s-value {
        font-size: 28rpx;
        font-weight: 600;
        color: #333;

        &.running { color: #52c41a; }
      }
    }
  }
}

.mode-section, .reminder-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .section-title-row {
    margin-bottom: 24rpx;

    .section-title {
      display: block;
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 8rpx;
    }

    .section-desc {
      display: block;
      font-size: 24rpx;
      color: #999;
    }
  }
}

.mode-options {
  .mode-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    margin-bottom: 16rpx;
    border: 2rpx solid transparent;

    &:last-child { margin-bottom: 0; }
    &.active {
      background: #e6e9ff;
      border-color: #667eea;
    }
    &.disabled { opacity: 0.5; }

    .mode-icon-box {
      width: 64rpx;
      height: 64rpx;
      background: #667eea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;

      .mode-icon-letter {
        font-size: 28rpx;
        font-weight: 700;
        color: #fff;
      }
    }

    .mode-info {
      flex: 1;

      .mode-name {
        display: block;
        font-size: 28rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 6rpx;
      }

      .mode-desc {
        display: block;
        font-size: 24rpx;
        color: #999;
      }
    }

    .mode-check {
      width: 48rpx;
      height: 48rpx;
      background: #667eea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .check-mark {
        color: #fff;
        font-size: 24rpx;
        font-weight: 700;
      }
    }
  }
}

.reminder-options {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;

  .reminder-item {
    width: calc(50% - 10rpx);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30rpx 20rpx;
    background: #f8f9fa;
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    box-sizing: border-box;

    &.active {
      background: #e6e9ff;
      border-color: #667eea;
    }
    &.disabled { opacity: 0.5; }

    .reminder-icon {
      width: 56rpx;
      height: 56rpx;
      line-height: 56rpx;
      text-align: center;
      font-size: 28rpx;
      font-weight: 700;
      color: #fff;
      background: #667eea;
      border-radius: 50%;
      margin-bottom: 12rpx;
    }

    .reminder-name {
      font-size: 26rpx;
      color: #333;
      margin-bottom: 12rpx;
    }

    .reminder-check {
      width: 36rpx;
      height: 36rpx;
      background: #667eea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        color: #fff;
        font-size: 22rpx;
        font-weight: 700;
      }
    }
  }
}

.sensitivity-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .sensitivity-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }

    .sensitivity-value {
      font-size: 36rpx;
      font-weight: 700;
      color: #667eea;
    }
  }

  .sensitivity-slider {
    margin-bottom: 20rpx;
  }

  .sensitivity-labels {
    display: flex;
    justify-content: space-between;

    text {
      font-size: 24rpx;
      color: #999;
    }
  }
}

.timer-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

  .timer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 30rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .timer-settings {
    padding-top: 20rpx;
    border-top: 1rpx solid #f0f0f0;

    .timer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx 0;

      .timer-label {
        font-size: 28rpx;
        color: #666;
      }

      .picker-value {
        font-size: 28rpx;
        color: #667eea;
        font-weight: 600;
      }
    }
  }
}

.control-buttons {
  display: flex;
  margin-bottom: 20rpx;

  .control-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30rpx 20rpx;
    border-radius: 16rpx;
    border: none;
    margin: 0 8rpx;

    &:first-child { margin-left: 0; }
    &:last-child { margin-right: 0; }
    &::after { border: none; }

    &.start {
      background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
      .btn-text { color: #fff; }
    }

    &.stop {
      background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
      .btn-text { color: #fff; }
    }

    &.reset {
      background: #f0f0f0;
      .btn-text { color: #666; }
    }

    &[disabled] { opacity: 0.5; }

    .btn-text {
      font-size: 28rpx;
      font-weight: 600;
    }
  }
}

.safe-area-bottom {
  height: 40rpx;
}
</style>
