# 拼音音源调研与接入记录

调研日期：2026-09-30。

目标：寻找可下载、可说明使用许可的真人拼音录音，支持本项目逐音节、逐声调点读。公开下载、真人录制与国家认证是不同条件；以下资源均未被本次调研确认为国家统一指定录音。

## 1. audio-cmn（本项目采用）

- 来源：[hugolpz/audio-cmn](https://github.com/hugolpz/audio-cmn)。
- 内容：1707 条拼音音节录音，以及 HSK 字词录音；本项目选用 `64k/syllabs`，录音者为 Chen Wang。
- 下载：GitHub 仓库可下载；本项目导入脚本按固定提交下载需要的 MP3。
- 许可：上游 README 声明 **CC BY-SA**，但未注明版本。保留作者、项目、来源链接及上游许可声明，不自行改为某个具体版本。发布页页脚提供署名，部署音频目录保留来源说明和清单。
- 优点：音频按拼音和声调分别存储，适合静态网页和离线播放。
- 已知问题：[作者的 issue #7](https://github.com/hugolpz/audio-cmn/issues/7) 标记了部分音频质量问题，标题称约 5% 的音节录音存在质量退化；也说明未录制轻声。不能用一声录音冒充轻声。

### 接入方式

- 固定源提交：`ff9ed3d0c631195bd2c06f39450f3264c7124040`。
- 本次导入 1668 条与项目音节表相符的录音，覆盖原有 1231 条例字组合中的 1195 条。剩余 36 条为 35 个轻声例词组合及 `yo1`；这些卡片不提供点读。其他导入录音可用于“探索所有声调组合”。
- `scripts/import-audio-cmn.py` 从源仓库文件树中选取本项目音节表内的一至四声录音。下载完成后逐条校验 Git blob SHA-1，再复制原始字节到 `assets/audio/audio-cmn/`。
- 拼写映射：移除 `cmn-` 和稀有音节的前置 `_`；`lv/nv` 对应 `lü/nü`，`jv/qv/xv` 对应 `ju/qu/xu`。不通过修改波形、变速或变调制造缺失录音。
- `src/audio-data.js` 由导入脚本生成，作为界面播放能力的唯一清单；`assets/audio/audio-cmn-manifest.json` 保留原始文件路径及校验值。
- 例字仍来自 `src/voice-examples.js`。例字仅作教学参考，不能证明对应录音存在；没有例字但有真人录音的探索组合也可点读。
- 没有录音的卡片仍可显示并练习，拼音显示为普通文字，不显示喇叭、不绑定点击发声事件。
- 原 Kokoro MP3 在成功导入后移除。新录音采用独立目录，Service Worker 升级缓存版本，避免继续播放旧录音。
- 所有录音文件通过来源校验，不表示已逐条完成人工听审。

重新导入：先克隆源仓库的文件树（无需检出音频），再运行导入和打包。需要 Git、Python 3.9+、Node.js 16+；Python 脚本只使用标准库。

```powershell
git clone --filter=blob:none --depth 1 --no-checkout https://github.com/hugolpz/audio-cmn.git <本地源仓库目录>
python scripts/import-audio-cmn.py --source-repo <本地源仓库目录>
npm run build
```

如果上游更新导致浅克隆不再包含固定提交，应先取得上述固定提交后再导入。脚本下载失败或校验失败时不会替换项目音频。

## 2. Tone Perfect（优先考虑的教学音库）

- 来源：[密歇根州立大学 Tone Perfect](https://tone.lib.msu.edu/)。
- 项目团队说明：[A Tone Perfect Story](https://ideah.pubpub.org/pub/hh90jpsu/release/4)。
- 内容：410 个音节 × 四声 × 六位北京普通话母语者，共 9840 条录音；男女各三位。团队说明录制时有发音指导、声调检查和后续审听。
- 下载：团队公开说明全量 MP3 ZIP 约 300 MB，需申请并确认非商业用途；经批准后通过 MSU FileDepot 提供。调研时源站返回访问限制，尚未取得全量音包，当前申请条件需以源站回复为准。
- 许可：录音有非商业用途限制。介绍文章的 CC BY 4.0 许可不能直接套用于录音文件。
- 适用：四声教学、男女声音色选择、声调辨识；不直接补齐轻声。

## 3. Mandarin Sounds（可直接下载）

- 来源：Chinese Lessons；[阿姆斯特丹大学 SpeakGoodChinese 下载页面](https://www.fon.hum.uva.nl/sgc/wordlists.html)提供教学音包。
- [ZIP 下载](https://www.fon.hum.uva.nl/sgc/wordlists/MandarinSounds.zip)。
- 内容：实际下载检查得到 1193 个 WAV 文件及 `LICENSE.txt`，ZIP 大小 28,611,793 字节。
- 许可：包内明确声明 **CC BY-NC-ND 3.0 US**；署名指向 Chinese Lessons，限制非商业用途和改编。[许可条款](https://creativecommons.org/licenses/by-nc-nd/3.0/us/)。
- 适用：原样使用的非商业拼音学习项目；覆盖范围不等于本项目全部组合，需要建立实际文件清单。

## 4. Sinosplice Mandarin Chinese Tone Pair Drills

- 来源及下载：[Sinosplice 声调组合练习](https://www.sinosplice.com/learn-chinese/tone-pair-drills)。
- 内容：双音节词和声调组合练习，有网页音频及下载包。
- 许可：页面明确声明 **CC BY-NC-SA 2.5**。
- 适用：未来扩展连读和双音节练习；不能直接替代当前全部单音节卡片。

## 5. Ting Yi Ting

- 来源：[堪萨斯大学开放教材](https://opentext.ku.edu/tingyiting/)，作者 Sheree Willis 与 Yan Li。
- 内容：声母、韵母、声调及变调教学，包含大量音频示例；章节中有 MP3 文件链接。
- 许可：教材声明 **CC BY-NC 4.0**，明确排除另行注明的内容；取用具体录音时要确认对应素材有无单独声明。
- 适用：发音讲解和教学示例；本次未确认存在完整、统一的逐音节下载包。

## 6. AISHELL-3

- 来源：[OpenSLR 93 官方资源页](https://www.openslr.org/93/)。
- 内容：约 85 小时、218 位说话人、88035 条普通话录音，提供汉字及拼音标注；整包约 19 GB。
- 许可：资源页声明 **Apache License 2.0**。
- 适用：语音研究和模型训练。素材主要是语句，若裁切单音节需处理连读、变调及边界，接入成本高，不作为当前首选。

## 其他检索到的 GitHub 汇总库

- [shikangkai/Chinese-Pinyin-Audio](https://github.com/shikangkai/Chinese-Pinyin-Audio)：女声 1617 条、男声 1568 条，README 指向其他音源；未确认完整录音授权链。
- [davinfifield/mp3-chinese-pinyin-sound](https://github.com/davinfifield/mp3-chinese-pinyin-sound)：仓库有 Unlicense，但 README 对录音者和录音原始权属的说明不足，本次未据此认定全部音频可无条件使用。
- [zispace/hanyu-pinyin-audio](https://github.com/zispace/hanyu-pinyin-audio)：聚合多个网站和仓库的录音，作者声明来自网络、仅供参考。适合寻找线索，不能把汇总仓库当作所有录音的统一许可来源。
