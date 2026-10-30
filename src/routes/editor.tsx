import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Scissors, Play, Pause, Download, ImagePlus, Music2, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { alignWords, buildScenes, cutSilences, detectSpeech, peaks, type Scene, type Segment, type Word } from "@/lib/audio-engine";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [
      { title: "Editor — DarkCut AI" },
      { name: "description", content: "Edite vídeos verticais com corte de silêncio, sincronia de cenas e legendas virais." },
      { property: "og:title", content: "Editor DarkCut AI" },
      { property: "og:description", content: "Narração + imagens = vídeo viral 9:16." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Editor,
});

const W = 720, H = 1280;

function themeScript(t: string) {
  return `Você já ouviu falar sobre ${t}? Poucas pessoas conhecem essa história. Tudo começou numa noite fria, quando ninguém esperava. O que aconteceu depois mudou tudo para sempre. E até hoje, ninguém conseguiu explicar. Fique até o final, porque a verdade é mais assustadora do que você imagina.`;
}

const soundIdeas = [
  { category: "Terror", title: "Sussurros na Escuridão", mood: "Drones graves, sussurros distantes e tensão crescente.", use: "Casas assombradas, aparições e relatos sobrenaturais." },
  { category: "Terror", title: "Presença Atrás de Você", mood: "Ruídos ambientes, notas dissonantes e impactos repentinos.", use: "Sustos, perseguições e revelações assustadoras." },
  { category: "Suspense", title: "Contagem Regressiva", mood: "Batidas pulsantes que aceleram gradualmente.", use: "Perigo iminente, investigações e situações urgentes." },
  { category: "Mistério", title: "O Segredo Esquecido", mood: "Piano minimalista, cordas suaves e atmosfera enigmática.", use: "Casos inexplicáveis, desaparecimentos e teorias." },
  { category: "Psicológico", title: "Mente em Colapso", mood: "Texturas inquietantes, ecos e notas instáveis.", use: "Paranoia, obsessão e reviravoltas." },
  { category: "Emocionante", title: "Lágrimas em Silêncio", mood: "Piano lento e cordas delicadas.", use: "Perdas, despedidas, saudade e histórias comoventes." },
  { category: "Superação", title: "Depois da Tempestade", mood: "Piano inspirador e cordas cinematográficas.", use: "Recomeços, coragem e transformação." },
  { category: "Motivação", title: "Mentalidade Imparável", mood: "Percussão firme, synths épicos e ritmo crescente.", use: "Conquistas, disciplina, ambição e grandes viradas." },
  { category: "Ação", title: "Perseguição Final", mood: "Percussão intensa, pulsos eletrônicos e cordas rápidas.", use: "Fugas, confrontos e desafios." },
  { category: "Épico", title: "O Grande Destino", mood: "Metais, coral cinematográfico e crescendos.", use: "Descobertas extraordinárias e momentos decisivos." },
  { category: "Documentário", title: "Verdade Oculta", mood: "Ambient eletrônico discreto e pulsação investigativa.", use: "Curiosidades, fatos reais e documentários dark." },
  { category: "Reflexão", title: "Ecos do Tempo", mood: "Piano contemplativo, pads suaves e textura ambiente.", use: "Lições de vida, pensamentos e histórias profundas." },
] as const;

function Editor() {
  const ctxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [orig, setOrig] = useState<AudioBuffer | null>(null);
  const [narr, setNarr] = useState<AudioBuffer | null>(null);
  const [segs, setSegs] = useState<Segment[]>([]);
  const [music, setMusic] = useState<AudioBuffer | null>(null);
  const [imgs, setImgs] = useState<HTMLImageElement[]>([]);
  const [script, setScript] = useState("");
  const [theme, setTheme] = useState("");
  const [thr, setThr] = useState(-40);
  const [musicVol, setMusicVol] = useState(0.5);
  const [selectedSoundIdea, setSelectedSoundIdea] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState("");
  const play = useRef<{ start: number; stop: () => void } | null>(null);

  const ac = () => (ctxRef.current ??= new AudioContext());
  const dur = narr?.duration ?? 0;
  const scenes: Scene[] = useMemo(() => buildScenes(segs, dur, imgs.length), [segs, dur, imgs.length]);
  const words: Word[] = useMemo(() => alignWords(script, segs), [script, segs]);
  const wave = useMemo(() => (narr ? peaks(narr, 300) : []), [narr]);

  async function loadAudio(f: File) {
    const b = await ac().decodeAudioData(await f.arrayBuffer());
    setOrig(b); setNarr(b); setSegs([{ start: 0, end: b.duration }]); setMsg(`Áudio carregado: ${b.duration.toFixed(1)}s`);
  }
  function runCut() {
    if (!orig) return;
    const s = detectSpeech(orig, thr);
    const r = cutSilences(ac(), orig, s);
    setNarr(r.buffer); setSegs(r.segments);
    setMsg(`Silêncios removidos: ${orig.duration.toFixed(1)}s → ${r.buffer.duration.toFixed(1)}s (${s.length} frases)`);
  }
  async function loadImgs(fs: FileList) {
    const list = await Promise.all([...fs].map((f) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.src = URL.createObjectURL(f); })));
    setImgs((p) => [...p, ...list]);
  }

  // Render a frame at time t
  function draw(t: number) {
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
    c.fillStyle = "#0b0a10"; c.fillRect(0, 0, W, H);
    const idx = scenes.findIndex((s) => t >= s.start && t < s.end);
    const drawScene = (s: Scene, alpha: number) => {
      const img = imgs[s.img]; if (!img) return;
      const p = Math.min(1, Math.max(0, (t - s.start) / (s.end - s.start)));
      const base = Math.max(W / img.width, H / img.height);
      const z = s.motion === 1 ? 1.25 - 0.2 * p : 1.05 + 0.2 * p;
      const dx = s.motion === 2 ? (p - 0.5) * 80 : s.motion === 3 ? (0.5 - p) * 80 : 0;
      const w = img.width * base * z, h = img.height * base * z;
      c.globalAlpha = alpha;
      c.drawImage(img, (W - w) / 2 + dx, (H - h) / 2, w, h);
      c.globalAlpha = 1;
    };
    if (idx >= 0) {
      const s = scenes[idx]!;
      drawScene(s, 1);
      const next = scenes[idx + 1];
      const tr = 0.4;
      if (next && s.end - t < tr) drawScene(next, 1 - (s.end - t) / tr);
    }
    const g = c.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.75)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // captions: groups of 3 words
    const wi = words.findIndex((w) => t >= w.start && t < w.end);
    if (wi >= 0) {
      const g0 = Math.floor(wi / 3) * 3;
      const group = words.slice(g0, g0 + 3);
      c.font = "bold 76px 'Bebas Neue', Impact, sans-serif";
      c.textBaseline = "middle";
      const sp = 18;
      const widths: number[] = group.map((w) => c.measureText(w.text.toUpperCase()).width);
      let x = (W - widths.reduce((a, b) => a + b, 0) - sp * (group.length - 1)) / 2;
      const y = H * 0.72;
      group.forEach((w, i) => {
        const active = g0 + i === wi;
        const txt = w.text.toUpperCase();
        if (active) { c.fillStyle = "#ef4a2b"; c.fillRect(x - 8, y - 44, widths[i]! + 16, 88); }
        c.lineWidth = 8; c.strokeStyle = "#000"; c.strokeText(txt, x, y);
        c.fillStyle = active ? "#fff" : "#f5e9d6"; c.fillText(txt, x, y);
        x += widths[i]! + sp;
      });
    }
  }

  useEffect(() => { draw(time); }, [time, scenes, words, imgs]); // eslint-disable-line react-hooks/exhaustive-deps

  function startAudio(dest?: AudioNode) {
    const a = ac();
    const out = dest ?? a.destination;
    const n = a.createBufferSource(); n.buffer = narr!; n.connect(out);
    if (dest) n.connect(a.destination);
    let m: AudioBufferSourceNode | null = null;
    if (music) {
      m = a.createBufferSource(); m.buffer = music; m.loop = true;
      const gain = a.createGain(); m.connect(gain); gain.connect(out); if (dest) gain.connect(a.destination);
      const t0 = a.currentTime + 0.05;
      gain.gain.setValueAtTime(musicVol, t0);
      // audio ducking: lower music during speech
      for (const s of segs) {
        gain.gain.setTargetAtTime(musicVol * 0.18, t0 + s.start, 0.08);
        gain.gain.setTargetAtTime(musicVol, t0 + s.end, 0.25);
      }
      m.start(t0);
    }
    const start = a.currentTime + 0.05;
    n.start(start);
    return { start, stop: () => { try { n.stop(); m?.stop(); } catch { /* */ } }, node: n };
  }

  function toggle() {
    if (!narr) return;
    if (playing) { play.current?.stop(); setPlaying(false); return; }
    const p = startAudio();
    play.current = p; setPlaying(true);
    const loop = () => {
      if (!play.current) return;
      const t = ac().currentTime - p.start;
      if (t >= dur) { setPlaying(false); setTime(0); play.current = null; return; }
      setTime(Math.max(0, t)); requestAnimationFrame(loop);
    };
    p.node.onended = () => { play.current = null; setPlaying(false); };
    requestAnimationFrame(loop);
  }

  async function exportVideo() {
    if (!narr || !canvasRef.current) return;
    setExporting(true); setMsg("Renderizando... mantenha esta aba aberta.");
    const a = ac();
    const dest = a.createMediaStreamDestination();
    const stream = new MediaStream([...canvasRef.current.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const mime = ["video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const el = document.createElement("a"); el.href = url; el.download = `darkcut.${mime.includes("mp4") ? "mp4" : "webm"}`; el.click();
      setExporting(false); setMsg("Vídeo exportado!");
    };
    rec.start();
    const p = startAudio(dest);
    const loop = () => {
      const t = a.currentTime - p.start;
      if (t >= dur) { rec.stop(); setTime(0); return; }
      setTime(Math.max(0, t)); draw(Math.max(0, t)); requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  const Card = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-3"><span className="font-display text-3xl text-ember">0{n}</span><h2 className="font-bold">{title}</h2></div>
      {children}
    </div>
  );
  const fileBtn = "flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm hover:border-primary";

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="flex items-center justify-between border-b border-border px-5 py-3">
        <Link to="/" className="font-display text-3xl tracking-wider">DARK<span className="text-ember">CUT</span></Link>
        <span className="text-sm text-muted-foreground">{msg}</span>
      </header>
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <Card n={1} title="Narração (áudio ou tema)">
            <label className={fileBtn}><Upload className="h-4 w-4" /> Enviar áudio da narração
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && loadAudio(e.target.files[0])} />
            </label>
            <div className="mt-3 flex gap-2">
              <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ou digite um tema: ex. o farol assombrado" className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" />
              <button onClick={() => theme && setScript(themeScript(theme))} className="flex items-center gap-1 rounded-xl bg-secondary px-3 text-sm"><Sparkles className="h-4 w-4" /> Gerar roteiro</button>
            </div>
            <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={3} placeholder="Texto da narração (usado nas legendas palavra por palavra)" className="mt-3 w-full rounded-xl border border-input bg-background p-3 text-sm" />
          </Card>

          <Card n={2} title="Cortar silêncios">
            <div className="flex items-center gap-4">
              <span className="w-40 text-xs text-muted-foreground">Sensibilidade: {thr} dB</span>
              <Slider min={-60} max={-20} step={1} value={[thr]} onValueChange={(v) => setThr(v[0] ?? -40)} className="flex-1" />
              <button disabled={!orig} onClick={runCut} className="flex items-center gap-2 rounded-xl bg-ember px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-40"><Scissors className="h-4 w-4" /> Cortar</button>
            </div>
            {narr && (
              <div className="relative mt-4 flex h-16 items-center gap-px overflow-hidden rounded-lg bg-background px-1">
                {wave.map((p, i) => <div key={i} className="flex-1 rounded bg-primary/70" style={{ height: `${Math.max(4, p * 100)}%` }} />)}
                <div className="absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${(time / dur) * 100}%` }} />
              </div>
            )}
          </Card>

          <Card n={3} title="Imagens (sincronizadas no ritmo da fala)">
            <label className={fileBtn}><ImagePlus className="h-4 w-4" /> Adicionar imagens
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && loadImgs(e.target.files)} />
            </label>
            {imgs.length > 0 && <button onClick={() => setImgs([])} className="mt-2 text-xs text-muted-foreground underline">Limpar imagens</button>}
          </Card>

          <Card n={4} title="Trilha sonora (ducking automático)">
            <div className="flex items-center gap-4">
              <label className={fileBtn + " flex-1"}><Music2 className="h-4 w-4" /> {music ? "Trilha carregada ✓" : "Enviar trilha"}
                <input type="file" accept="audio/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setMusic(await ac().decodeAudioData(await f.arrayBuffer())); }} />
              </label>
              <span className="text-xs text-muted-foreground">Volume</span>
              <Slider min={0} max={1} step={0.05} value={[musicVol]} onValueChange={(v) => setMusicVol(v[0] ?? 0.5)} className="w-32" />
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">Ideias de trilhas para sua história</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Escolha uma referência de clima para orientar a trilha que deseja usar.</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground">12 estilos</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {soundIdeas.map((idea) => (
                  <button
                    key={idea.title}
                    type="button"
                    onClick={() => { setSelectedSoundIdea(idea.title); setMsg(`Referência selecionada: ${idea.title}`); }}
                    aria-pressed={selectedSoundIdea === idea.title}
                    className={`rounded-xl border p-3 text-left transition-colors hover:border-primary ${selectedSoundIdea === idea.title ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ember">{idea.category}</span>
                      {selectedSoundIdea === idea.title && <span className="text-[10px] font-semibold text-primary">Selecionada ✓</span>}
                    </div>
                    <h4 className="text-sm font-semibold">{idea.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{idea.mood}</p>
                    <p className="mt-2 text-[11px] leading-relaxed"><span className="font-semibold">Ideal para:</span> {idea.use}</p>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Estas sugestões são referências de estilo, não arquivos de áudio. Para ouvir a trilha no vídeo, envie um arquivo de música usando “Enviar trilha”.
              </p>
              {selectedSoundIdea && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs">
                  <span>Referência escolhida: <strong>{selectedSoundIdea}</strong></span>
                  <button type="button" onClick={() => setSelectedSoundIdea(null)} className="underline text-muted-foreground">Limpar seleção</button>
                </div>
              )}
            </div>
          </Card>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 font-bold">Timeline de cenas</h2>
            {scenes.length === 0 ? <p className="text-sm text-muted-foreground">Envie áudio e imagens para montar a timeline.</p> : (
              <div className="flex h-24 gap-1 overflow-hidden rounded-lg">
                {scenes.map((s, i) => (
                  <button key={i} onClick={() => setTime(s.start)} className={`relative overflow-hidden rounded border-2 ${time >= s.start && time < s.end ? "border-primary" : "border-transparent"}`} style={{ flex: s.end - s.start }}>
                    <img src={imgs[s.img]?.src} className="h-full w-full object-cover" alt="" />
                    <span className="absolute bottom-0 left-0 bg-background/80 px-1 text-[10px]">{(s.end - s.start).toFixed(1)}s</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} width={W} height={H} className="aspect-[9/16] w-[300px] rounded-3xl border-4 border-border bg-card shadow-glow md:w-[340px]" />
          <div className="text-sm text-muted-foreground">{time.toFixed(1)}s / {dur.toFixed(1)}s</div>
          <div className="flex gap-2">
            <button disabled={!narr || exporting} onClick={toggle} className="flex items-center gap-2 rounded-full bg-secondary px-5 py-3 font-bold disabled:opacity-40">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playing ? "Pausar" : "Prévia"}</button>
            <button disabled={!narr || !imgs.length || exporting || playing} onClick={exportVideo} className="flex items-center gap-2 rounded-full bg-ember px-5 py-3 font-bold text-primary-foreground disabled:opacity-40"><Download className="h-4 w-4" /> {exporting ? "Exportando..." : "Exportar"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
