<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import store from "./utils/store";

// 应用启动
onLaunch(() => {
  console.log("[App] Launch");
  store.init();
});

// 应用显示（前台）
onShow(() => {
  console.log("[App] Show");
  store.startPolling();
});

// 应用隐藏（后台）
onHide(() => {
  console.log("[App] Hide");
  store.stopPolling();
});
</script>

<style lang="scss">
/* 全局基础样式 */
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  color: #333;
  font-size: 28rpx;
}

/* 安全区域底部 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 加载状态 */
.loading-text {
  text-align: center;
  color: #999;
  font-size: 26rpx;
  padding: 40rpx 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;

  .empty-text {
    font-size: 30rpx;
    color: #333;
    font-weight: 600;
    margin-bottom: 12rpx;
  }

  .empty-subtext {
    font-size: 26rpx;
    color: #999;
  }
}
</style>
