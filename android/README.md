# 拼音星球 Android APK

这是当前网页的离线 Android 版本，内置网页、拼音字体及全部 audio-cmn 真人录音。Android 8.0 及以上可安装，使用系统 Android System WebView 渲染页面。无需联网权限，筛选设置保存在本机，练习页支持系统返回键。

## 构建

需要 Node.js 16+、JDK 17+、Android SDK Platform 35 和 Build Tools 35。此项目直接使用官方 SDK 的 AAPT2、D8、zipalign、apksigner，不需要 Gradle 或 Android Studio。

```powershell
npm run build:android
# 自定义 SDK / JDK 路径：
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-android.ps1 -SdkRoot C:\Android\Sdk -JavaHome C:\Java\jdk-17
```

默认 SDK 路径为 `ANDROID_SDK_ROOT`，未设置时使用本机 `F:\AI\tools\android-sdk`。输出文件：`android/output/pinyin-planet-1.0.0.apk`。

首次构建自动生成本机签名证书和随机密码，保存在 `android/.signing/`，此目录不纳入 Git。请安全备份整个目录，后续更新安装必须使用相同证书；每次正式更新还需提高 Manifest 的 versionCode/versionName 并更新输出文件名。当前包用于直接安装分发，未发布应用商店。

## 安装和验证

把 APK 传到安卓手机，打开文件并允许该文件来源安装应用。或在启用 USB 调试后执行 `adb install -r android/output/pinyin-planet-1.0.0.apk`。

安装后验证：断网启动、选择声母/韵母/声调、生成练习卡片、连续点读、没有录音的卡片隐藏喇叭、返回选择页、退出重开保留筛选、横竖屏切换、系统状态栏和底部导航不遮挡按钮。

应用内资源使用固定 HTTPS 虚拟域名，由 WebView 请求拦截器读取 APK assets；模块脚本、存储、字体及音频均保持相同来源。音频请求支持 200 与 Range 206；页面导航限制在应用内来源。不提供 JavaScript 原生桥接。

音频署名及许可原文随 APK 保留于 `assets/audio/README.md`，文件校验清单位于 `assets/audio/audio-cmn-manifest.json`；字体许可位于 `assets/OFL-Pinyin-Font.txt`。Android 外壳不修改音频原始字节。
