# 拼音星球

一个适配手机、平板和电脑的普通话拼音练习网页。选择音节分类、声母、韵母与声调后，随机生成卡片；第二页可逐张点读。

## 启动

需要 Node.js 16 或更新版本。项目运行时没有第三方依赖。

```bash
npm run dev
```

打开 `http://localhost:5173`。同一局域网里的其他设备可以使用电脑的局域网 IP 和端口访问。通过 HTTPS 或 localhost 打开时，支持安装为网页应用。练习页的拼音音频会在首次点读时加载并缓存；听过的音频之后可离线播放。

## 打包部署

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
- 拼音卡片和喇叭按钮都可点读。音频由 Kokoro 普通话语音模型预先生成，不依赖手机系统语音或浏览器 Web Speech API。
- 默认只生成带有例字/例词的音节与声调组合；探索模式中没有对应例音的组合会保留为视觉拼读练习，点读按钮禁用。

## 数据和参考

音节拼合与分类根据[普通话语音分析（内蒙古师范大学普通话培训测试工作站）](https://pc.imnu.edu.cn/info/1063/1097.htm)、[普通话的音节（南阳医专）](https://jwc.nymc.edu.cn/info/1076/1240.htm)整理，并参照[上海市教委发布的 ISO 7098 汉语拼音说明](https://edu.sh.gov.cn/yywz_gfbz_gyhypy/20150705/0015-yywz_1998.html)处理声调和轻声。音节库维护在 `src/pinyin-data.js`。

例字按 [pinyin-pro](https://github.com/zh-lx/pinyin-pro) 3.8.2 字表的顺序、使用 [pypinyin](https://github.com/mozillazg/python-pinyin) 0.55.0 的默认字音生成，两者均为 MIT 许可。修改音节库后，运行 `npm install`、`python -m pip install -r requirements-dev.txt`、`npm run generate:voices` 更新 `src/voice-examples.js`。

音频文件使用 [Kokoro-82M-v1.1-zh](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh) Apache 2.0 中文语音模型生成，使用说明和许可见该模型仓库。需要更新音节音频时，安装 `requirements-audio.txt` 后运行 `python scripts/generate-audio.py`；模型权重会下载到本机缓存，不会打入网页包。音频输出为 48 kbps 单声道 MP3，网页只在点读时按需加载，并通过 Service Worker 缓存已播放文件。

带调拼音使用项目内置的 [Noto Sans](https://github.com/google/fonts/tree/main/ofl/notosans) 字体子集，避免不同终端缺字时声调与元音分离。字体遵循 SIL Open Font License 1.1，许可文本见 `assets/OFL-Noto-Sans.txt`。
