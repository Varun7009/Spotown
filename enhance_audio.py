#!/usr/bin/env python3
"""
enhance_audio.py — Post-download audio enhancer for Spotown
Applies: normalization, subtle EQ boost, and high-fidelity mastering (MP3/FLAC/WAV)
Usage: python enhance_audio.py <filepath>
"""
import sys
import os
import subprocess
import shutil

def enhance(filepath: str):
    if not os.path.isfile(filepath):
        print(f"[enhancer] File not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    ext = os.path.splitext(filepath)[1].lower()
    tmp = filepath + ".tmp" + ext

    # ffmpeg filter chain:
    # loudnorm   → EBU R128 loudness normalization (broadcast standard)
    # equalizer  → gentle presence boost at 3kHz (+1.5dB) and air at 12kHz (+1dB)
    # aecho      → tiny stereo warmth (not reverb, just subtle spaciousness)
    filter_chain = (
        "loudnorm=I=-14:LRA=11:TP=-1,"
        "equalizer=f=3000:t=o:w=1:g=1.5,"
        "equalizer=f=12000:t=o:w=1:g=1.0"
    )

    # Choose codec based on format
    if ext == ".mp3":
        codec_args = ["-c:a", "libmp3lame", "-q:a", "0"]
    elif ext == ".flac":
        codec_args = ["-c:a", "flac", "-compression_level", "8"]
    elif ext == ".wav":
        codec_args = ["-c:a", "pcm_s24le"]
    else:
        print(f"[enhancer] Unsupported format: {ext}", file=sys.stderr)
        sys.exit(1)

    cmd = [
        "ffmpeg", "-y",
        "-i", filepath,
        "-af", filter_chain,
        *codec_args,
        # Copy all metadata tags intact
        "-map_metadata", "0",
        # Copy album art if present
        "-map", "0",
        "-map", "-0:v",          # drop video (thumbnail) to avoid conflicts
        tmp
    ]

    print(f"[enhancer] Enhancing: {os.path.basename(filepath)}")
    result = subprocess.run(cmd, capture_output=True)

    if result.returncode != 0:
        print(f"[enhancer] ffmpeg error:\n{result.stderr.decode()}", file=sys.stderr)
        # Clean up temp and leave original intact
        if os.path.exists(tmp):
            os.remove(tmp)
        sys.exit(1)

    # Replace original with enhanced file
    shutil.move(tmp, filepath)
    print(f"[enhancer] Done: {os.path.basename(filepath)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python enhance_audio.py <filepath>", file=sys.stderr)
        sys.exit(1)
    enhance(sys.argv[1])
