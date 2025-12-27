# Bili Tablet Pad 📺

<div align="center">

![Vue 3](https://img.shields.io/badge/Vue-3.3+-4FC08D?style=flat-square&logo=vue.js)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat-square&logo=vite)
![Capacitor](https://img.shields.io/badge/Capacitor-5.0+-1199EE?style=flat-square&logo=capacitor)
![License](https://img.shields.io/badge/License-AGPL%20v3-red?style=flat-square)

**为平板而生 · 沉浸式 B 站第三方客户端**

Designed & Developed by **隣に佇んて**

</div>

---

## 📖 缘起 (Motivation)

> "Every decision you make, every action you take, is a choice about the world."

这个项目的诞生，始于一个极其朴素的愿望：我只想躺在床上，用最舒适的姿势刷视频。

官方应用在平板端的体验往往只是手机版的简单放大，操作逻辑割裂，难以单手掌控。并拒绝竖屏短视频流那种“被算法投喂”的被动感。

**Bili Tablet Pad** 是一款基于 Vue 3 全家桶与 Capacitor 构建的实验性客户端。它拒绝竖屏绑架，专注于横屏沉浸体验，试图在指尖重构那个纯粹的 Bilibili。

虽然因个人健康原因（即将迎来一场手术），项目的更新或许会暂时按下暂停键，但我相信代码是有温度的。希望这份开源代码能成为后来者的基石。

## 🚀 快速开始 / Quick Start

### 环境要求
- Node.js >= 20
- Java JDK 17+ (For Android Build)
- Android Studio (For APK Signing)
### 简易版：
- Windows 用户可使用简易构建命令
```bash
npm run easyWin
```
- Linux 用户可使用简易构建命令
```bash
npm run easyLin
```
### 完整安装
#### 安装依赖
```bash
npm install
```

#### 开发模式 (Web)
```bash
npm run dev
```

#### 编译安卓应用 (Android)

```bash
npm run app
```
#### 打开Android Studio
```bash
npx cap open android
```

## 🛠️ 技术栈 (Tech Stack)

本项目感谢以下开源力量的支持：

* **Core Framework**: [Vue 3](https://vuejs.org/) (Composition API)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Cross-Platform**: [Capacitor](https://capacitorjs.com/)
* **State Management**: [Pinia](https://pinia.vuejs.org/)
* **Video Player**: [ArtPlayer](https://artplayer.org/) / [Shaka Player](https://github.com/shaka-project/shaka-player)
* **Network**: [Axios](https://axios-http.com/)
* **Utils**: [VueUse](https://vueuse.org/), [Protobuf.js](https://github.com/protobufjs/protobuf.js), [Spark-MD5](https://github.com/satazor/js-spark-md5)

## ⚠️ 免责声明 (Disclaimer)

1.  **非官方声明**：本项目是开源社区爱好者作品，与 **哔哩哔哩 (Bilibili)** 及其运营主体无任何关联。
2.  **仅供学习**：本项目仅供 Vue 3 技术交流与学习使用，请在下载后 **24 小时内删除**。
3.  **禁止商用**：依据 **AGPL v3.0** 协议及开发者意愿，**严禁**将本项目用于任何形式的商业盈利（包括付费分发、广告植入、会员倒卖）。
4.  **设备限制**：本项目**严禁安装于电视端（TV/OTT）**。未适配电视端鉴权机制，强制运行后果自负。
5.  **账号风险**：使用非官方客户端存在被平台风控的风险，继续使用即代表您愿承担账号被限制等后果。

## 🤝 贡献与反馈 (Contribution)

虽然我可能因手术暂时无法高频维护，但欢迎提交 PR 或 Issue。

* 🐛 [反馈 Bug](https://github.com/AelinkSma/Bili-Tablet-Pad/issues)
* 🐙 [Fork 项目](https://github.com/AelinkSma/Bili-Tablet-Pad/fork)

## ❤️ 致谢

特别感谢 **Google Gemini**、**Tencent CodeBuddy** 与 **小爱同学** 在开发过程中提供的智慧支持。

---

<div align="center">
  <i>有缘再见，无缘再见。</i>
</div>