# 拼音星球

一个适配手机、平板和电脑的普通话拼音练习网页。选择音节分类、声母、韵母与声调后，随机生成卡片；第二页可逐张点读。

## 启动

需要 Node.js 16 或更新版本。项目运行时没有第三方依赖。

```bash
npm run dev
```

打开 `http://localhost:5173`。同一局域网里的其他设备可以使用电脑的局域网 IP 和端口访问。通过 HTTPS 或 localhost 打开时，支持安装为网页应用。练习页的拼音音频会在首次点读时加载并缓存；听过的音频之后可离线播放。

## 打包部署

### Android APK

运行 `npm run build:android`，生成可直接安装、内置全部音频的离线 APK。构建环境、签名备份和手机安装说明见 [Android 打包说明](android/README.md)。

### 网页部署

```bash
npm run build
```

打包结果位于 `dist/`，包含网页、脚本、样式、字体与离线缓存文件，可以直接部署到静态网站服务。`dist/` 纳入版本控制；修改源码后重新运行打包命令，提交更新后的文件。

推送到 `main` 后，`.github/workflows/deploy-pages.yml` 会把 `dist/` 发布到 GitHub Pages。首次部署前，在仓库 `Settings → Pages → Build and deployment → Source` 中选择 `GitHub Actions`。

## 练习内容

- 常用普通话音节与可选的少见、口语音节分开管理。
- 分类包含两拼、三拼、整体认读、零声母；声母按发音部位分组，韵母按单韵母、复韵母、前鼻、后鼻、特殊韵母分组。
- `y` / `w` 开头的拼写归入零声母；`j` / `q` / `x` 后面的 `u` 按实际韵母 `ü` 处理；`iu` / `ui` / `un` 在拆分时还原为 `iou` / `uei` / `uen`。
- 可以同时选择一至四声和轻声。默认只生成有对应例字的带调组合；打开“探索所有声调组合”后，也可练习没有常用汉字对应的拼读组合。
- 带喇叭的拼音卡片和喇叭按钮都可点读，使用 audio-cmn 真人音节录音，不依赖手机系统语音或浏览器 Web Speech API。
- 默认只生成带有例字/例词的音节与声调组合。音频是否存在由实际录音清单决定；没有录音的卡片仅作视觉拼读练习，隐藏喇叭、不提供点击播放。

## 数据和参考

音节拼合与分类根据[普通话语音分析（内蒙古师范大学普通话培训测试工作站）](https://pc.imnu.edu.cn/info/1063/1097.htm)、[普通话的音节（南阳医专）](https://jwc.nymc.edu.cn/info/1076/1240.htm)整理，并参照[上海市教委发布的 ISO 7098 汉语拼音说明](https://edu.sh.gov.cn/yywz_gfbz_gyhypy/20150705/0015-yywz_1998.html)处理声调和轻声。音节库维护在 `src/pinyin-data.js`。

例字按 [pinyin-pro](https://github.com/zh-lx/pinyin-pro) 3.8.2 字表的顺序、使用 [pypinyin](https://github.com/mozillazg/python-pinyin) 0.55.0 的默认字音生成，两者均为 MIT 许可。修改音节库后，运行 `npm install`、`python -m pip install -r requirements-dev.txt`、`npm run generate:voices` 更新 `src/voice-examples.js`。

音频使用 [audio-cmn](https://github.com/hugolpz/audio-cmn) 的 `64k/syllabs` 真人录音，录音者 Chen Wang，上游声明 CC BY-SA（未注明版本）。音频原始字节保持不变，保存在 `assets/audio/audio-cmn/`；网页只在点读时按需加载，并通过 Service Worker 缓存已播放文件。来源署名见 `assets/audio/README.md`，每条音频的源路径与校验值见 `assets/audio/audio-cmn-manifest.json`，播放清单见 `src/audio-data.js`。没有轻声录音时不使用其他声调或合成音频代替。

其他候选音源、许可、已知质量问题和导入步骤见[音源调研与接入记录](docs/audio-sources.md)。`scripts/generate-audio.py` 和 `requirements-audio.txt` 是先前 Kokoro 方案保留的工具，当前网站不使用其合成音频。

拼音练习使用 [宝宝字帖拼音字体](https://github.com/jaywcjlove/pinyin-font) 1.10.2 常规体，带调字母采用单层 `a` 字形，适合拼音识读。字体遵循 SIL Open Font License 1.1，许可文本见 `assets/OFL-Pinyin-Font.txt`。
