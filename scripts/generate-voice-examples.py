"""Generate speech example characters for syllable and tone pairs."""

import json
import re
import subprocess
from pathlib import Path

from pypinyin import Style, lazy_pinyin


ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "node_modules" / "pinyin-pro" / "data" / "dict1.ts"
OUTPUT = ROOT / "src" / "voice-examples.js"

syllables = json.loads(
    subprocess.check_output(
        [
            "node",
            "--input-type=module",
            "-e",
            "import {SYLLABLES} from './src/pinyin-data.js'; console.log(JSON.stringify(SYLLABLES.map(x=>x.spelling)));",
        ],
        cwd=ROOT,
        text=True,
        encoding="utf-8",
    )
)
all_requested = {f"{spelling}{tone}" for spelling in syllables for tone in range(5)}
requested = {f"{spelling}{tone}" for spelling in syllables for tone in range(1, 5)}
examples = {}

for match in re.finditer(r"^DICT1\[(\d+)\] = '", DATA.read_text(encoding="utf-8"), re.MULTILINE):
    character = chr(int(match.group(1)))
    try:
        character.encode("gb2312")  # 用中文常用字集排除日文汉字及过于生僻的例字。
    except UnicodeEncodeError:
        continue
    reading = lazy_pinyin(
        character,
        style=Style.TONE3,
    )[0].replace("v", "ü")
    if reading in requested and reading not in examples:
        examples[reading] = character

examples["zi3"] = "子"
# 轻声依赖词语语境；朗读完整例词，听其中的轻声音节。
examples.update({
    "a0": "好啊", "ba0": "走吧", "bian0": "方便", "chu0": "清楚", "dao0": "知道",
    "de0": "好的", "di0": "慢慢地", "fu0": "舒服", "ge0": "这个", "guo0": "见过",
    "hua0": "笑话", "huo0": "家伙", "jia0": "人家", "jie0": "姐姐", "jing0": "动静",
    "la0": "好啦", "le0": "好了", "li0": "屋里", "liang0": "商量", "ma0": "好吗",
    "mei0": "妹妹", "me0": "什么", "men0": "我们", "ne0": "你呢", "qi0": "客气",
    "shang0": "衣裳", "shi0": "认识", "tou0": "石头", "xi0": "东西", "xie0": "谢谢",
    "ya0": "哎呀", "ying0": "答应", "you0": "朋友", "zhe0": "看着", "zi0": "孩子",
})
examples = {key: value for key, value in examples.items() if key in all_requested}
output = (
    "// 根据 pinyin-pro 3.8.2 字表顺序与 pypinyin 0.55.0 默认读音生成；两者均为 MIT 许可。轻声使用例词。\n"
    f"export const VOICE_EXAMPLES = {json.dumps(dict(sorted(examples.items())), ensure_ascii=False, indent=2)};\n"
)
OUTPUT.write_text(output, encoding="utf-8")
print(f"已生成 {len(examples)} 个带调音节的汉字点读示例。")
