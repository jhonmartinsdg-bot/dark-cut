export type Segment = { start: number; end: number };

/** Detects speech segments by RMS energy in 20ms windows. */
export function detectSpeech(buf: AudioBuffer, thresholdDb = -40, minSilence = 0.35, pad = 0.08): Segment[] {
  const data = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const win = Math.floor(sr * 0.02);
  const thr = Math.pow(10, thresholdDb / 20);
  const raw: Segment[] = [];
  let cur: Segment | null = null;
  for (let i = 0; i < data.length; i += win) {
    let sum = 0;
    const end = Math.min(i + win, data.length);
    for (let j = i; j < end; j++) { const v = data[j]!; sum += v * v; }
    const rms = Math.sqrt(sum / (end - i));
    const t = i / sr;
    if (rms > thr) {
      if (!cur) cur = { start: t, end: t + 0.02 };
      else cur.end = t + 0.02;
    } else if (cur && t - cur.end > minSilence) {
      raw.push(cur);
      cur = null;
    }
  }
  if (cur) raw.push(cur);
  return raw.map((s) => ({ start: Math.max(0, s.start - pad), end: Math.min(buf.duration, s.end + pad) }));
}

/** Builds a new buffer with only the speech segments; returns new segment times. */
export function cutSilences(ctx: BaseAudioContext, buf: AudioBuffer, segs: Segment[]) {
  const sr = buf.sampleRate;
  const total = segs.reduce((a, s) => a + Math.floor((s.end - s.start) * sr), 0);
  const out = ctx.createBuffer(buf.numberOfChannels, Math.max(total, 1), sr);
  const newSegs: Segment[] = [];
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const src = buf.getChannelData(c);
    const dst = out.getChannelData(c);
    let off = 0;
    for (const s of segs) {
      const a = Math.floor(s.start * sr);
      const len = Math.floor((s.end - s.start) * sr);
      dst.set(src.subarray(a, a + len), off);
      if (c === 0) newSegs.push({ start: off / sr, end: (off + len) / sr });
      off += len;
    }
  }
  return { buffer: out, segments: newSegs };
}

/** Peaks for waveform drawing. */
export function peaks(buf: AudioBuffer, n = 400) {
  const d = buf.getChannelData(0);
  const step = Math.floor(d.length / n) || 1;
  return Array.from({ length: n }, (_, i) => {
    let m = 0;
    for (let j = i * step; j < (i + 1) * step && j < d.length; j++) m = Math.max(m, Math.abs(d[j]!));
    return m;
  });
}

export type Word = { text: string; start: number; end: number };

/** Distributes script words across speech segments proportionally to character length. */
export function alignWords(script: string, segs: Segment[]): Word[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (!words.length || !segs.length) return [];
  const speech = segs.reduce((a, s) => a + s.end - s.start, 0);
  const chars = words.reduce((a, w) => a + w.length + 1, 0);
  const out: Word[] = [];
  let si = 0;
  let t = segs[0]!.start;
  for (const w of words) {
    let dur = ((w.length + 1) / chars) * speech;
    const start = t;
    while (dur > 0 && si < segs.length) {
      const room = segs[si]!.end - t;
      if (dur <= room) { t += dur; dur = 0; }
      else { dur -= room; si++; t = segs[si]?.start ?? t; }
    }
    out.push({ text: w, start, end: t });
  }
  return out;
}

export type Scene = { start: number; end: number; img: number; motion: number };

/** Places scene cuts on speech-segment boundaries closest to an even split. */
export function buildScenes(segs: Segment[], duration: number, imgCount: number): Scene[] {
  if (!imgCount) return [];
  const bounds = segs.map((s) => s.start).filter((t) => t > 0.3);
  const cuts: number[] = [0];
  for (let i = 1; i < imgCount; i++) {
    const ideal = (duration * i) / imgCount;
    const best = bounds.reduce((b, t) => (Math.abs(t - ideal) < Math.abs(b - ideal) ? t : b), ideal);
    cuts.push(best > cuts[cuts.length - 1]! + 0.5 ? best : ideal);
  }
  cuts.push(duration);
  return cuts.slice(0, -1).map((c, i) => ({ start: c, end: cuts[i + 1]!, img: i, motion: i % 4 }));
}
