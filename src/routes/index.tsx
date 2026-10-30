import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type MouseEvent } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import sectionBg from "@/assets/section-bg.jpg";
import figure from "@/assets/figure.png";
import { Scissors, Wand2, Captions, Music2, Film, Zap, Check, Star, Play } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DarkCut AI — Vídeos virais para canais dark em minutos" },
      { name: "description", content: "Envie a narração e as imagens: a IA corta silêncios, sincroniza cenas, anima e legenda palavra por palavra." },
      { property: "og:title", content: "DarkCut AI — Vídeos virais em minutos" },
      { property: "og:description", content: "Editor com IA para canais dark, histórias e shorts virais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Scissors, t: "Corte automático de silêncios", d: "A IA detecta pausas e respirações e entrega uma narração ágil, sem tempo morto." },
  { icon: Wand2, t: "Sincronia no ritmo da fala", d: "Cada corte de cena cai exatamente no início de uma frase. Retenção lá em cima." },
  { icon: Film, t: "Pan, zoom e transições", d: "Movimento cinematográfico em todas as imagens. Nada de slideshow parado." },
  { icon: Captions, t: "Legendas palavra por palavra", d: "O estilo viral que prende o olhar, com destaque na palavra falada." },
  { icon: Music2, t: "Audio ducking automático", d: "A trilha abaixa sozinha quando você fala e sobe nas pausas." },
  { icon: Zap, t: "Prévia 9:16 e exportação", d: "Veja o resultado em tempo real e exporte pronto para Shorts, Reels e TikTok." },
];

const plans = [
  { n: "Iniciante", p: "47", f: ["30 vídeos/mês", "Legendas virais", "Exportação 720p"] },
  { n: "Criador", p: "97", f: ["150 vídeos/mês", "Tudo do Iniciante", "Exportação 1080p", "Trilhas premium"], hot: true },
  { n: "Agência", p: "247", f: ["Vídeos ilimitados", "Multi-canais", "Prioridade no render", "Suporte VIP"] },
];

const testimonials = [
  { n: "Rafael S.", r: "Canal de mistério · 480k inscritos", q: "Eu levava 6 horas por vídeo. Hoje publico 3 por dia." },
  { n: "Camila T.", r: "Histórias de terror · TikTok", q: "As legendas palavra por palavra dobraram minha retenção." },
  { n: "Diego M.", r: "Curiosidades dark · YouTube", q: "O corte de silêncio sozinho já paga a assinatura." },
];

const faq: [string, string][] = [
  ["Preciso saber editar vídeo?", "Não. Você envia áudio e imagens, a IA faz o resto. Ajustes são opcionais."],
  ["Funciona com qualquer narração?", "Sim: voz própria, locutor ou voz gerada por IA, em qualquer idioma."],
  ["Posso cancelar quando quiser?", "Sim, sem fidelidade. Cancele com um clique."],
  ["Os vídeos são monetizáveis?", "Sim. O conteúdo é seu; use imagens com direito de uso."],
];

function Tilt({ children }: { children: React.ReactNode }) {
  const [r, setR] = useState({ x: 0, y: 0 });
  const move = (e: MouseEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    setR({ x: ((e.clientY - b.top) / b.height - 0.5) * -18, y: ((e.clientX - b.left) / b.width - 0.5) * 22 });
  };
  return (
    <div style={{ perspective: 1200 }} onMouseMove={move} onMouseLeave={() => setR({ x: 0, y: 0 })}>
      <div style={{ transform: `rotateX(${r.x}deg) rotateY(${r.y}deg)`, transformStyle: "preserve-3d", transition: "transform .15s ease-out" }}>
        {children}
      </div>
    </div>
  );
}

function PhoneDemo() {
  const words = ["NINGUÉM", "VOLTOU", "DAQUELA", "CASA..."];
  return (
    <Tilt>
      <div className="relative mx-auto aspect-[9/16] w-52 overflow-hidden rounded-[2.2rem] border-4 border-border bg-card shadow-glow sm:w-64 md:w-72">
        <div className="absolute inset-0 animate-floaty bg-[radial-gradient(circle_at_30%_20%,var(--primary),transparent_55%),radial-gradient(circle_at_70%_80%,var(--primary-glow),transparent_50%)] opacity-40" />
        <div className="absolute inset-x-0 top-1/3 text-center font-display text-6xl leading-none tracking-wide" style={{ transform: "translateZ(60px)" }}>
          <span className="text-ember">A CASA</span>
          <br />
          <span className="text-foreground">ABANDONADA</span>
        </div>
        <div className="absolute inset-x-4 bottom-24 flex flex-wrap justify-center gap-2 font-display text-3xl" style={{ transform: "translateZ(80px)" }}>
          {words.map((w, i) => (
            <span key={w} className={i === 1 ? "rounded bg-primary px-1 text-primary-foreground" : ""}>{w}</span>
          ))}
        </div>
        <div className="absolute inset-x-4 bottom-6 flex h-10 items-end gap-1">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="flex-1 origin-bottom animate-wave rounded bg-ember" style={{ height: "100%", animationDelay: `${(i * 70) % 900}ms` }} />
          ))}
        </div>
      </div>
    </Tilt>
  );
}

function Hero3D() {
  const [m, setM] = useState({ x: 0, y: 0 });
  const [sy, setSy] = useState(0);
  useEffect(() => {
    const on = () => setSy(window.scrollY);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const move = (e: MouseEvent<HTMLElement>) => setM({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
  const layer = (d: number, s = 1) => ({ transform: `translate3d(${m.x * -d}px, ${m.y * -d + sy * s}px, 0) scale(1.15)`, transition: "transform .25s ease-out" });
  return (
    <section onMouseMove={move} className="relative min-h-screen overflow-hidden" style={{ perspective: 1000 }}>
      <img src={heroBg} alt="Mansão sombria sob lua vermelha" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" style={layer(25, 0.4)} />
      <div className="pointer-events-none absolute inset-0 animate-fog bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--background)_85%)]" />
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <span key={i} className="absolute h-1 w-1 animate-ember rounded-full bg-accent" style={{ left: `${(i * 37) % 100}%`, bottom: "-10px", animationDelay: `${(i * 0.43) % 8}s`, animationDuration: `${6 + (i % 5)}s` }} />
        ))}
      </div>
      <img src={figure} alt="" width={768} height={1152} className="pointer-events-none absolute right-[-18%] top-[190px] h-[55vh] w-auto opacity-80 drop-shadow-[0_0_40px_var(--primary)] sm:opacity-60 lg:-bottom-10 lg:right-[-6%] lg:top-auto lg:h-[85vh] lg:opacity-90" style={layer(70, 0.15)} />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 pb-16 pt-24 md:gap-12 md:pt-28 md:grid-cols-2">
        <div style={{ transform: `translate3d(${m.x * 15}px, ${m.y * 15}px, 0)`, transition: "transform .3s ease-out" }}>
          <span className="animate-rise rounded-full border border-primary/50 bg-background/50 px-3 py-1 text-xs uppercase tracking-widest text-accent backdrop-blur">Para canais dark · histórias · shorts</span>
          <h1 className="mt-6 animate-rise font-display text-[3.4rem] leading-[0.88] sm:text-7xl drop-shadow-2xl md:text-8xl" style={{ animationDelay: ".15s" }}>
            Histórias que <span className="text-ember">arrepiam.</span><br />Vídeos que <span className="text-ember">viralizam.</span>
          </h1>
          <p className="mt-6 max-w-lg animate-rise text-lg text-foreground/80" style={{ animationDelay: ".3s" }}>
            Envie a narração e as imagens. Em 3 minutos a IA entrega um vídeo cinematográfico: silêncios cortados, cenas no ritmo da voz e legendas que prendem até o último segundo.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3" style={{ animationDelay: ".45s" }}>
            <Link to="/editor" className="inline-flex items-center gap-2 rounded-full bg-ember px-7 py-4 font-bold text-primary-foreground shadow-glow transition hover:scale-105">
              <Play className="h-5 w-5" /> Criar meu primeiro vídeo
            </Link>
            <a href="#planos" className="rounded-full border border-border bg-background/40 px-7 py-4 font-semibold backdrop-blur">Ver planos</a>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-foreground/70">
            <div className="flex text-accent">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
            +12.000 criadores publicando todos os dias
          </div>
        </div>
        <div className="relative flex justify-center" style={{ transform: `translate3d(${m.x * 40}px, ${m.y * 40}px, 0)`, transition: "transform .3s ease-out" }}>
          <div className="absolute h-72 w-72 md:h-96 md:w-96 animate-spin3d rounded-full border-2 border-primary/40" style={{ transformStyle: "preserve-3d" }} />
          <PhoneDemo />
        </div>
      </div>
    </section>
  );
}


function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <span className="font-display text-3xl tracking-wider">DARK<span className="text-ember">CUT</span></span>
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="#faq">FAQ</a>
          </nav>
          <Link to="/editor" className="rounded-full bg-ember px-5 py-2 text-sm font-bold text-primary-foreground">Abrir editor</Link>
        </div>
      </header>

      <Hero3D />

      <section className="relative overflow-hidden py-28">
        <img src={sectionBg} alt="" loading="lazy" width={1920} height={1088} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
        <div className="relative mx-auto max-w-4xl px-5 text-center">
          <h2 className="font-display text-5xl leading-none md:text-7xl">Cada história merece ser <span className="text-ember">sentida.</span></h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">Seu roteiro arrepia. Sua voz prende. Agora o vídeo vai à altura: cortes no ritmo do coração, movimento cinematográfico e legendas que fazem ninguém piscar.</p>
        </div>
      </section>

      <section className="border-y border-border bg-card/50 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 text-center md:grid-cols-3">
          {[["6h → 3min", "tempo de edição"], ["+87%", "retenção média"], ["3x", "mais vídeos por semana"]].map(([a, b]) => (
            <div key={b}><div className="font-display text-6xl text-ember">{a}</div><div className="text-muted-foreground">{b}</div></div>
          ))}
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-center font-display text-5xl md:text-7xl">Tudo que um editor faz. <span className="text-ember">Sem o editor.</span></h2>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <Tilt key={f.t}>
              <div className="h-full rounded-2xl border border-border bg-card p-7 transition hover:border-primary">
                <f.icon className="h-9 w-9 text-primary" />
                <h3 className="mt-4 text-xl font-extrabold">{f.t}</h3>
                <p className="mt-2 text-muted-foreground">{f.d}</p>
              </div>
            </Tilt>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-display text-5xl">Como funciona</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {["Suba a narração", "A IA corta os silêncios", "Suba as imagens", "Exporte o vídeo 9:16"].map((s, i) => (
            <div key={s} className="rounded-2xl border border-border p-6">
              <div className="font-display text-5xl text-ember">0{i + 1}</div>
              <div className="mt-2 font-bold">{s}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-center font-display text-5xl">Quem usa, não volta atrás</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.n} className="rounded-2xl border border-border bg-card p-7">
              <blockquote className="text-lg">“{t.q}”</blockquote>
              <figcaption className="mt-4 text-sm"><b>{t.n}</b><div className="text-muted-foreground">{t.r}</div></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-6xl px-5 py-24">
        <h2 className="text-center font-display text-5xl md:text-7xl">Escolha seu plano</h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.n} className={`relative rounded-3xl border p-8 ${p.hot ? "border-primary bg-card shadow-glow md:-translate-y-4" : "border-border"}`}>
              {p.hot && <span className="absolute -top-3 left-8 rounded-full bg-ember px-3 py-1 text-xs font-bold text-primary-foreground">MAIS POPULAR</span>}
              <div className="font-bold">{p.n}</div>
              <div className="mt-3 font-display text-6xl">R${p.p}<span className="font-sans text-base text-muted-foreground">/mês</span></div>
              <ul className="mt-6 space-y-2">{p.f.map((f) => <li key={f} className="flex gap-2"><Check className="h-5 w-5 text-primary" />{f}</li>)}</ul>
              <Link to="/editor" className={`mt-8 block rounded-full py-3 text-center font-bold ${p.hot ? "bg-ember text-primary-foreground" : "border border-border"}`}>Começar agora</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Garantia incondicional de 7 dias.</p>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 py-24">
        <h2 className="text-center font-display text-5xl">Perguntas frequentes</h2>
        <Accordion type="single" collapsible className="mt-10">
          {faq.map(([q, a]) => (
            <AccordionItem key={q} value={q}><AccordionTrigger className="text-left text-lg">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="px-5 pb-24 text-center">
        <h2 className="font-display text-6xl md:text-8xl">Seu próximo viral <span className="text-ember">começa agora.</span></h2>
        <Link to="/editor" className="mt-8 inline-block rounded-full bg-ember px-10 py-5 text-lg font-bold text-primary-foreground shadow-glow">Abrir o editor</Link>
      </section>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">© 2026 DarkCut AI</footer>
    </div>
  );
}
