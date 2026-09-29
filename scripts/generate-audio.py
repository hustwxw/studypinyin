"""Generate compressed Mandarin example audio assets with Kokoro Chinese TTS."""

import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path

import lameenc
import numpy as np
import torch
from huggingface_hub import hf_hub_download
from kokoro import KModel, KPipeline


ROOT = Path(__file__).resolve().parent.parent
REPO = "hexgrad/Kokoro-82M-v1.1-zh"
OUTPUT = ROOT / "assets" / "audio"


def load_examples():
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            "import {VOICE_EXAMPLES} from './src/voice-examples.js'; process.stdout.write(JSON.stringify(VOICE_EXAMPLES));",
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(result.stdout)


def encode_mp3(audio):
    pcm = np.clip(audio, -1, 1)
    pcm = (pcm * 32767).astype(np.int16)
    encoder = lameenc.Encoder()
    encoder.set_in_sample_rate(24000)
    encoder.set_channels(1)
    encoder.set_bit_rate(48)
    encoder.set_quality(3)
    return encoder.encode(pcm.tobytes()) + encoder.flush()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--model-path",
        help="Optional local Kokoro .pth file; if omitted, download it from Hugging Face.",
    )
    parser.add_argument("--voice", default="zf_001", help="Kokoro voice ID (default: zf_001).")
    parser.add_argument("--limit", type=int, help="Generate only the first N clips, for sampling.")
    args = parser.parse_args()

    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
    model_path = args.model_path or hf_hub_download(
        repo_id=REPO, filename="kokoro-v1_1-zh.pth"
    )
    model = KModel(repo_id=REPO, model=model_path).eval()
    pipeline = KPipeline(lang_code="z", repo_id=REPO, model=model, device="cpu")
    examples = sorted(load_examples().items())
    if args.limit:
        examples = examples[: args.limit]
    OUTPUT.mkdir(parents=True, exist_ok=True)

    generated = 0
    for index, (key, text) in enumerate(examples, start=1):
        target = OUTPUT / f"{key}.mp3"
        if target.exists() and target.stat().st_size > 256:
            continue
        result = next(pipeline(text, voice=args.voice, split_pattern=None))
        if result.audio is None or result.audio.numel() == 0:
            raise RuntimeError(f"No audio generated for {key}: {text}")
        data = encode_mp3(result.audio.detach().cpu().numpy().squeeze())
        with tempfile.NamedTemporaryFile(dir=OUTPUT, suffix=".mp3", delete=False) as temp:
            temp.write(data)
            temp_path = Path(temp.name)
        temp_path.replace(target)
        generated += 1
        if index % 25 == 0 or index == len(examples):
            print(f"Generated {index}/{len(examples)} clips ({generated} new).", flush=True)

    print(f"Audio generation complete: {generated} new files in {OUTPUT}")


if __name__ == "__main__":
    main()
