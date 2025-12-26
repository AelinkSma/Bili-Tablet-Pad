# Bili-Tablet (Android / Vue 3)

> ✨ 一个基于 Vue 3 + Capacitor 构建的高颜值的第三方 Bilibili 平板客户端。
> A beautiful third-party Bilibili tablet client built with Vue 3 & Capacitor.

## ⚠️ 免责声明 / Disclaimer

**请务必仔细阅读 / Please read carefully:**

1.  **仅供学习 (For Education Only)**: 本项目仅用于学习 Vue 3、Capacitor 框架以及 RESTful API 架构设计，**严禁用于任何商业用途**。
2.  **API 来源 (API Source)**: 本项目中使用的 API 来源于 Bilibili 官方接口的公开分析，版权归上海幻电信息科技有限公司所有。
3.  **风险提示 (Risk Warning)**: 使用非官方客户端登录 Bilibili 账号可能存在账号被限制或封禁的风险，开发者不对因此产生的任何后果负责。请谨慎使用主账号登录。
4.  **无侵入性 (No Intrusion)**: 本项目不包含任何破解 VIP、破解付费视频或恶意攻击服务器的代码。

---

## 🛠️ 技术栈 / Tech Stack

- **核心框架**: Vue 3 + Vite
- **跨平台引擎**: Capacitor 8 (Android)
- **状态管理**: Pinia + Persistence
- **播放器核心**: ArtPlayer + Danmuku (弹幕支持) + Shaka Player (DASH 流媒体支持)
- **核心算法**: Wbi 签名自动化 / 视频流链接解析

## 🚀 快速开始 / Quick Start

### 环境要求
- Node.js >= 20
- Java JDK 17+ (For Android Build)
- Android Studio (For APK Signing)

### 安装依赖
```bash
npm install
```

### 开发模式 (Web)
```bash
npm run dev
```

### 编译安卓应用 (Android)
简易版：
```bash
npm run app
```

详细版：
```bash
# 1. 构建前端资源
npm run build

# 2. 同步到安卓原生目录
npx cap sync

# 3. 打开 Android Studio 进行调试/打包
npx cap open android
```

## 🤝 贡献 / Contribution

欢迎提交 Issue 或 PR 改进代码结构。请确保不上传任何包含个人 `SESSDATA` 或 `Cookie` 的配置文件。
---
*Created with ❤️ by the Open Source Community*