#!/usr/bin/env python3
"""Transcreve um arquivo de áudio em pt-BR usando faster-whisper local.

Uso: python3 scripts/transcribe_audio.py <caminho-do-audio>
Imprime APENAS o texto transcrito (uma linha) no stdout.
"""
import os
import sys

# av 19 removeu o kwarg metadata_errors que o faster-whisper 1.2 ainda passa.
import av

_orig_open = av.open


def _open(*args, **kwargs):
    kwargs.pop("metadata_errors", None)
    return _orig_open(*args, **kwargs)


av.open = _open

from faster_whisper import WhisperModel  # noqa: E402

if len(sys.argv) < 2:
    print("", end="")
    sys.exit(1)

model_name = os.environ.get("STT_MODEL", "small")
model = WhisperModel(model_name, device="cpu", compute_type="int8")
segments, _info = model.transcribe(
    sys.argv[1], language="pt", beam_size=5, vad_filter=True
)
texto = " ".join(s.text.strip() for s in segments if s.text and s.text.strip()).strip()
print(texto)
