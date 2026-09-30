# 拼音音源说明

## 当前接入：audio-cmn

- 作品：audio-cmn 的 syllabs v.2（64k/syllabs）。
- 录音者：Chen Wang。
- 来源：https://github.com/hugolpz/audio-cmn
- 固定版本：ff9ed3d0c631195bd2c06f39450f3264c7124040。
- 许可：上游 README 声明 CC BY-SA，未注明具体版本；沿用该声明，不自行指定版本。详见 https://github.com/hugolpz/audio-cmn#license 。
- 音频字节未修改，仅调整文件名以对应本项目的拼音拼写。

录音保存在 `audio-cmn/`，文件名为拼音加声调，例如 `mao4.mp3`、`lü3.mp3`。`audio-cmn-manifest.json` 记录每条音频的原始路径、Git blob SHA-1 和 SHA-256，可追溯原始文件。

`src/audio-data.js` 是实际可播放音频清单；它与例字表独立。没有录音的卡片不显示喇叭，不提供点击播放。当前只导入项目音节表内的一至四声真人录音，不用一声替代轻声，也不回退到合成音频。

当前导入 1668 条录音，覆盖例字表 1231 个拼音与声调组合中的 1195 个。其余 36 个组合（35 个轻声及 `yo1`）没有对应录音，卡片不显示喇叭，也不能点击发声。

作者报告过部分录音质量问题：https://github.com/hugolpz/audio-cmn/issues/7 。本项目保留原始录音，来源和校验值不代表每条发音已经听审或获得国家认证。

## 后续可考虑接入的音源

以下均为候选，目前尚未接入。选用前需要确认音频本身的许可、取得所需授权，并听审实际录音。

- **[Tone Perfect](https://tone.lib.msu.edu/)**：密歇根州立大学的普通话单音节录音，410 个音节 × 四声 × 六位说话人，共 9840 条。适合替换或补充单音节示范音；下载需要申请，非商业使用条件及具体授权须向项目方确认，不含轻声。
- **[Mandarin Sounds](https://www.fon.hum.uva.nl/sgc/wordlists.html)**：ChineseLessons 的录音，由阿姆斯特丹大学提供[下载 ZIP](https://www.fon.hum.uva.nl/sgc/wordlists/MandarinSounds.zip)，内有 1193 个 WAV 文件。许可为 CC BY-NC-ND 3.0 US，适合符合许可的非商业原始录音使用；须署名，不得分享改编版本，接入前核对实际覆盖范围。
- **[Sinosplice Tone Pair Drills](https://www.sinosplice.com/learn-chinese/tone-pair-drills)**：双音节声调组合练习录音，许可为 CC BY-NC-SA 2.5。适合后续双音节、连读和声调组合练习。
- **[Ting Yi Ting](https://opentext.ku.edu/tingyiting/)**：堪萨斯大学开放普通话听音教材，包含声调、音节及变调示例。教材默认许可为 CC BY-NC 4.0，另有声明的素材按各自许可处理；适合补充专项教学示例，尚未确认有完整单音节录音包。
- **[AISHELL-3 / OpenSLR 93](https://www.openslr.org/93/)**：约 85 小时、218 位说话人的普通话语音库，许可为 Apache 2.0。适合进一步建设自有录音素材库；素材主要是句子，需要处理切分、音节边界和变调，不能直接作为单音节卡片音源替换。

## 后续接入约定

- 每套音源记录作者、来源、固定版本、许可及逐文件出处；遵守对应署名和分发条件。
- 按实际存在的录音生成播放清单，确认拼音、声调与文件对应；缺失录音继续隐藏喇叭和点击播放，不用其他声调或合成语音补位。
- 替换录音时同步更新来源说明、清单、构建产物和 Service Worker 缓存版本。

详细调研、当前文件映射及重新导入方法见项目根目录的 `docs/audio-sources.md`。
