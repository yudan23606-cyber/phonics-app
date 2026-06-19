# 小树拼读 — 安卓 App

> AI 发音老师 · 自然拼读练习 · Expo React Native
>
> 📱 双版本项目：[鸿蒙版](../phonics-harmony/README.md) 同步开发中

---

## 快速开始

### 1. 环境准备

```bash
# 安装 Node.js 22+ 和 npm
# 安装 Expo CLI
npm install -g expo-cli eas-cli

# 进入项目目录
cd phonics-app

# 安装依赖
npm install
```

### 2. 启动开发

```bash
# 启动 Expo 开发服务器
npx expo start

# 扫码在真机运行（需要手机安装 Expo Go）
# 或连接 USB 用 Android Studio 模拟器
npx expo start --android
```

### 3. 构建 APK

```bash
# 安装 EAS CLI 并登录
npm install -g eas-cli
eas login

# 构建预览版 APK
eas build --platform android --profile preview

# 构建生产版 AAB
eas build --platform android --profile production
```

---

## 项目结构

```
phonics-app/
├── App.js                         入口文件
├── app.json                       Expo 配置（包名 com.enn.phonics）
├── package.json                   依赖
├── eas.json                       EAS 构建配置
├── babel.config.js                Babel 配置
└── src/
    ├── services/
    │   ├── cloudbase.js           CloudBase SDK 封装（匿名登录 + 云函数 + 数据库）
    │   ├── audio.js               expo-av 录音/播放
    │   └── constants.js           常量（20 音素、配色、配置）
    ├── screens/
    │   ├── HomeScreen.js          首页（打卡 + 进度 + 开始练习）
    │   ├── PracticeScreen.js      练习页（跟读打分 + 听音选字母）
    │   ├── ResultScreen.js        结果页（成绩单 + 星星动画）
    │   ├── PhonicsScreen.js       音素总览（Phase 2 网格）
    │   └── ReportScreen.js        家长报告（日历 + 日报/周报 + 薄弱音素）
    └── navigation/
        └── AppNavigator.js        导航（底部 Tab + Stack）
```

---

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | React Native 0.76 + Expo 52 |
| 导航 | @react-navigation/native 7 |
| 音频 | expo-av（录音/播放） |
| 后端 | CloudBase 云函数（复用原小程序后端） |
| ASR | 腾讯云一句话识别（scoreEngine 云函数） |
| 数据库 | CloudBase NoSQL（users/learning_records/daily_tasks/phoneme_content） |
| 构建 | EAS Build → APK/AAB |

---

## 与小程序版本的差异

| 维度 | 微信小程序 | 安卓 App |
|------|-----------|---------|
| 审核 | ❌ 教育类目需企业主体 | ✅ 无审核，直装 |
| 分发 | 微信内搜索 | APK 直接安装 |
| 录音 API | wx.getRecorderManager | expo-av Audio.Recording |
| 云存储上传 | wx.cloud.uploadFile | CloudBase SDK uploadFile |
| 音频上传降级 | 无 | ✅ base64 直传云函数 |
| 用户标识 | wxContext.OPENID | CloudBase 匿名登录 UID |

---

## 评分流程

```
用户按住录音 → expo-av 录制 MP3
    ↓
方案 A：上传 CloudBase 存储 → 云函数 scoreEngine
方案 B（降级）：读取本地文件 → base64 编码 → 直传云函数
    ↓
腾讯云 ASR 一句话识别 (16k_en)
    ↓
音素词典 190+ 词匹配 → ⭐⭐⭐/⭐⭐/⭐ 评分
    ↓
反馈文案 + 写入 learning_records
```

---

## 上线检查清单

- [ ] 替换 `app.json` 中的包名 `com.enn.phonics`
- [ ] 生成 App 图标（1024x1024 放 `assets/icon.png`）
- [ ] 生成启动屏（可选，放 `assets/splash.png`）
- [ ] 确认 CloudBase 环境 ID `resume-1-d5gn952g8682d6d1b`
- [ ] 确认腾讯云 ASR SecretId/SecretKey（已配置在 scoreEngine 云函数）
- [ ] 真机测试录音 + 评分全流程
- [ ] 测试 CloudBase 上传 + 降级 base64 双通道
- [ ] 构建 APK → 安装测试
- [ ] 如需上架应用商店 → 注册开发者账号

---

## 后端云函数

复用原小程序的所有云函数（无需修改）：

| 云函数 | 用途 | 备注 |
|--------|------|------|
| `scoreEngine` | 评分引擎 | ✅ 已兼容 base64 直传 |
| `contentManager` | 内容管理 | 无需改动 |
| `reportGenerator` | 报告生成 | 无需改动 |
| `initDatabase` | 数据库初始化 | 首次部署时执行一次 |

---

## MVP 投入

| 项目 | 金额 |
|------|------|
| APK 构建（EAS Free） | ¥0 |
| CloudBase 免费额度 | ¥0（前 1000 用户） |
| 腾讯云 ASR 前 1000 次/月 | ¥0（免费额度） |
| 开发者账号（如需上架） | $25 一次性 |
| **总计** | **≈ ¥0（纯自有分发）** |

---

## 联系方式

ENN-DevTeam · 能新科多 Agent 软件开发团队
