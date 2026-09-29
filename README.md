# 拼音星球

一个适配手机、平板和电脑的普通话拼音练习网页。选择音节分类、声母、韵母与声调后，随机生成卡片；第二页可逐张点读。

## 启动

需要 Node.js 16 或更新版本。项目运行时没有第三方依赖。

```bash
npm run dev
```

打开 `http://localhost:5173`。同一局域网里的其他设备可以使用电脑的局域网 IP 和端口访问。通过 HTTPS 或 localhost 打开时，支持安装为网页应用，并缓存页面文件以供离线使用；语音是否能离线播放取决于设备的中文语音包。

## 打包部署

```bash
npm run build
```

打包结果位于 `dist/`，包含网页、脚本、样式、字体与离线缓存文件，可以直接部署到静态网站服务。`dist/` 纳入版本控制；修改源码后重新运行打包命令，提交更新后的文件。

## 练习内容

- 常用普通话音节与可选的少见、口语音节分开管理。
- 分类包含两拼、三拼、整体认读、零声母；声母按发音部位分组，韵母按单韵母、复韵母、前鼻、后鼻、特殊韵母分组。
- `y` / `w` 开头的拼写归入零声母；`j` / `q` / `x` 后面的 `u` 按实际韵母 `ü` 处理；`iu` / `ui` / `un` 在拆分时还原为 `iou` / `uei` / `uen`。
- 可以同时选择一至四声和轻声。默认只生成有对应例字的带调组合；打开“探索所有声调组合”后，也可练习没有常用汉字对应的拼读组合。
- 一至四声优先朗读相同拼音与声调的例字；轻声通过完整例词呈现语境中的轻读。没有例字或例词时交由设备中文语音引擎朗读带调拼音。不同设备的语音包和浏览器可能产生不同发音。

## 数据和参考

音节拼合与分类根据[普通话语音分析（内蒙古师范大学普通话培训测试工作站）](https://pc.imnu.edu.cn/info/1063/1097.htm)、[普通话的音节（南阳医专）](https://jwc.nymc.edu.cn/info/1076/1240.htm)整理，并参照[上海市教委发布的 ISO 7098 汉语拼音说明](https://edu.sh.gov.cn/yywz_gfbz_gyhypy/20150705/0015-yywz_1998.html)处理声调和轻声。音节库维护在 `src/pinyin-data.js`。

例字按 [pinyin-pro](https://github.com/zh-lx/pinyin-pro) 3.8.2 字表的顺序、使用 [pypinyin](https://github.com/mozillazg/python-pinyin) 0.55.0 的默认字音生成，两者均为 MIT 许可。修改音节库后，运行 `npm install`、`python -m pip install -r requirements-dev.txt`、`npm run generate:voices` 更新 `src/voice-examples.js`。

朗读使用浏览器的 [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)；设备需要具备可用的中文语音能力。

带调拼音使用项目内置的 [Noto Sans](https://github.com/google/fonts/tree/main/ofl/notosans) 字体子集，避免不同终端缺字时声调与元音分离。字体遵循 SIL Open Font License 1.1，许可文本见 `assets/OFL-Noto-Sans.txt`。
