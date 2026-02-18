// OneNET IoT HTTP API — 已通过实际请求验证全部4个端点
// Base: iot-api.heclouds.com (物联网套件API，非openapi.heclouds.com)
// Auth: device-level token, res=products/{pid}/devices/{devname}, method=md5
// Token有效期至2029年

const CONFIG = {
  thingmodelBase: 'https://iot-api.heclouds.com/thingmodel',
  deviceBase: 'https://iot-api.heclouds.com/device',
  productId: 'DX0LtPPJQ9',
  deviceName: 'main',
  // 3年有效token (至2029-02-17)，由AccessKey生成
  token: 'version=2018-10-31&res=products%2FDX0LtPPJQ9%2Fdevices%2Fmain&et=1866012442&method=md5&sign=pTkwfP7V2u5Lh%2FRVlscf%2Bw%3D%3D',
}

// ===== 类型定义 =====

export interface PropertyItem {
  identifier: string
  time: number
  value: any
  data_type?: string
  access_mode?: string
  name?: string
  description?: string
}

export interface HistoryDataPoint {
  time: number
  value: any
}

interface DeviceDetail {
  status: number  // 1=在线(设备已激活且连接中)
  last_time: string
  activate_time?: string
  enable_status?: boolean
}

// ===== 通用请求 =====

function request<T>(url: string, method: 'GET' | 'POST' = 'GET', data?: any): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method,
      data,
      header: {
        'authorization': CONFIG.token,
        'Content-Type': 'application/json',
      },
      success: (res: any) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        const body = res.data
        if (body && body.code !== undefined && body.code !== 0) {
          console.warn(`[OneNET] code=${body.code}: ${body.msg}`)
          reject(new Error(`${body.code}: ${body.msg}`))
          return
        }
        resolve(body.data as T)
      },
      fail: (err: any) => {
        reject(new Error(err.errMsg || '网络错误'))
      }
    })
  })
}

function qs(params: Record<string, string | number>): string {
  return Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
}

// ===== API =====

/**
 * GET /thingmodel/query-device-property?product_id=...&device_name=...
 * 返回: PropertyItem[] (data直接是数组)
 */
export async function queryDeviceProperty(): Promise<PropertyItem[] | null> {
  try {
    const q = qs({ product_id: CONFIG.productId, device_name: CONFIG.deviceName })
    const result = await request<PropertyItem[]>(`${CONFIG.thingmodelBase}/query-device-property?${q}`)
    return Array.isArray(result) ? result : null
  } catch (e) {
    console.error('[OneNET] 查询属性失败:', e)
    return null
  }
}

/**
 * POST /thingmodel/set-device-property
 * body: { product_id, device_name, params: { key: value } }
 */
export async function setDeviceProperty(params: Record<string, any>): Promise<boolean> {
  try {
    await request(
      `${CONFIG.thingmodelBase}/set-device-property`,
      'POST',
      { product_id: CONFIG.productId, device_name: CONFIG.deviceName, params }
    )
    return true
  } catch (e) {
    console.error('[OneNET] 设置属性失败:', e)
    return false
  }
}

/**
 * GET /thingmodel/query-device-property-history?...&start_time=...&end_time=...
 * 返回: { list: HistoryDataPoint[] }
 */
export async function queryPropertyHistory(
  identifier: string,
  days: number = 7
): Promise<HistoryDataPoint[]> {
  try {
    const end_time = Date.now()
    const start_time = end_time - days * 86400000
    const q = qs({
      product_id: CONFIG.productId,
      device_name: CONFIG.deviceName,
      identifier,
      start_time,
      end_time,
      limit: 200,
      sort: 'DESC',
    })
    const result = await request<{ list: HistoryDataPoint[] }>(
      `${CONFIG.thingmodelBase}/query-device-property-history?${q}`
    )
    return result?.list || []
  } catch (e) {
    console.error('[OneNET] 查询历史失败:', e)
    return []
  }
}

/**
 * GET /device/detail?product_id=...&device_name=...
 * 返回: DeviceDetail (status=1表示在线, last_time=最后通信时间)
 */
export async function queryDeviceStatus(): Promise<boolean> {
  try {
    const q = qs({ product_id: CONFIG.productId, device_name: CONFIG.deviceName })
    const result = await request<DeviceDetail>(`${CONFIG.deviceBase}/detail?${q}`)
    // status=1 且 last_time在60秒内 → 在线
    if (result.status === 1 && result.last_time) {
      const lastMs = new Date(result.last_time).getTime()
      return Date.now() - lastMs < 120000
    }
    return false
  } catch (e) {
    console.warn('[OneNET] 查询设备状态失败:', e)
    return false
  }
}

// ===== 配置管理 =====

export function getConfig() {
  return {
    baseUrl: CONFIG.thingmodelBase,
    productId: CONFIG.productId,
    deviceName: CONFIG.deviceName,
    hasToken: !!CONFIG.token,
  }
}

export function updateToken(newToken: string) {
  CONFIG.token = newToken
  uni.setStorageSync('oneNetToken', newToken)
}

export function restoreToken() {
  const saved = uni.getStorageSync('oneNetToken') as string
  if (saved) CONFIG.token = saved
}

export default {
  queryDeviceProperty,
  setDeviceProperty,
  queryPropertyHistory,
  queryDeviceStatus,
  getConfig,
  updateToken,
  restoreToken,
}
