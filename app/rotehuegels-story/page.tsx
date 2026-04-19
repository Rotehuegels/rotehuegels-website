// app/rotehuegels-story/page.tsx
import type { Metadata } from "next";
import StoryTOC from "@/components/StoryTOC";
import ShareBlock from "@/components/ShareBlock";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "The Rotehügels Story",
  description:
    "Before the Bombay–Thane railway, before independence — there were red hills, iron tracks, and granite. This is our story.",
  alternates: { canonical: "/rotehuegels-story" },
};

const toc = [
  { id: "tracks", label: "The Tracks Before History" },
  { id: "name", label: "Three Languages, One Hill" },
  { id: "water", label: "The Lake That Feeds a City" },
  { id: "temple", label: "Where Devotion Meets Ground" },
  { id: "machines", label: "180 Years of Machines" },
  { id: "beginning", label: "September 2024" },
  { id: "meaning", label: "What Rotehügels Means" },
  { id: "refs", label: "References" },
];

function SectionDivider() {
  return <div className="my-16 flex justify-center"><div className="w-16 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" /></div>;
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-10 pl-6 border-l-4 border-rose-500/40">
      <p className="text-xl md:text-2xl font-bold text-rose-300 leading-relaxed">{children}</p>
    </div>
  );
}

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-36 md:scroll-mt-40 text-2xl md:text-3xl font-bold text-white mt-0 mb-6">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-base md:text-lg text-zinc-300 leading-relaxed mb-6">{children}</p>;
}

export default function RotehuegelsStoryPage() {
  return (
    <main className="mx-auto max-w-[1800px] px-6 lg:px-10 py-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-14">

        {/* Main content */}
        <div>
          <div className="mb-4"><Breadcrumb /></div>

          {/* Hero */}
          <div className="mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-6">
              The Rotehügels Story
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 leading-relaxed max-w-2xl">
              Before the Bombay–Thane railway. Before independence. Before the tech boom.
              There were red hills, iron tracks, and granite.
            </p>
          </div>

          {/* ── THE TRACKS ────────────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="tracks">The Tracks Before History</SectionTitle>

            <P>
              In 1836, seventeen years before the famous Bombay–Thane passenger train,
              the East India Company did something remarkable in a small quarry town
              north of Madras.
            </P>

            <P>
              They laid <strong className="text-white">3½ miles of iron rails</strong>.
            </P>

            <P>
              Stone-laden carts — pulled by animals, possibly tested with steam — rolled
              from the red granite quarries of <strong className="text-white">Sengundram</strong> to
              the port at Madras. The purpose was unglamorous: road construction. But the
              achievement was historic.
            </P>

            <PullQuote>
              This was India's first railroad. And it ran through our backyard.
            </PullQuote>

            <P>
              The <strong className="text-white">Redhills Railway</strong> never made it to the
              textbooks. No passenger ever rode it. No politician inaugurated it. It was built
              to move stone — quietly, efficiently, without ceremony.
            </P>

            <P>
              We like that. It reminds us of how real work gets done.
            </P>
          </section>

          <SectionDivider />

          {/* ── THREE LANGUAGES ───────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="name">Three Languages, One Hill</SectionTitle>

            <P>
              The quarry town had a name long before the British arrived.
            </P>

            <P>
              In Tamil, it was <strong className="text-white">செங்குன்றம்</strong> — <em>Sengundram</em>.
              <em> Sen</em> means red. <em>Kundram</em> means hill. The name described what everyone
              could see: red laterite soil, red rocky terrain, red hills catching the morning sun.
            </P>

            <P>
              The British translated it literally: <strong className="text-white">Redhills</strong>.
            </P>

            <P>
              We translated it one more time — into German: <strong className="text-white">Rotehügel</strong>.
              And added an <strong className="text-white">"s"</strong> at the end. Not for plural.
              For belonging.
            </P>

            <div className="my-10 grid grid-cols-3 gap-4 md:gap-6">
              {[
                { lang: 'Tamil', word: 'செங்குன்றம்', sub: 'Sengundram', era: 'Ancient' },
                { lang: 'English', word: 'Redhills', sub: 'British translation', era: '1700s' },
                { lang: 'German', word: 'Rotehügels', sub: 'Our name', era: '2024' },
              ].map((l, i) => (
                <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 md:p-6 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{l.lang} · {l.era}</p>
                  <p className="text-xl md:text-2xl font-black text-white mt-3">{l.word}</p>
                  <p className="text-xs text-zinc-500 mt-2">{l.sub}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-zinc-500 italic mb-6">
              Three eras. Three languages. Same red hills.
            </p>
          </section>

          <SectionDivider />

          {/* ── THE LAKE ──────────────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="water">The Lake That Feeds a City</SectionTitle>

            <P>
              Before it was a quarry town, Sengundram was farming country — part of
              <strong className="text-white"> Thondaimandalam</strong>, sustained by ancient irrigation tanks.
            </P>

            <P>
              The <strong className="text-white">Puzhal Tank</strong> appears in Chola-era inscriptions
              as a boundary marker. In 1876, British engineers expanded it into the
              <strong className="text-white"> Redhills Reservoir</strong> — and it still supplies
              drinking water to Chennai today. Every monsoon, when the reservoir fills, news
              channels report it as front-page relief.
            </P>

            <PullQuote>
              A land that has sustained millions for centuries. That's the ground we stand on.
            </PullQuote>
          </section>

          <SectionDivider />

          {/* ── TEMPLE ────────────────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="temple">Where Devotion Meets Ground</SectionTitle>

            <P>
              Every year, lakhs of devotees converge on Redhills for the 12-day carnival at the
              <strong className="text-white"> Arulmigu Sri Angala Eeswari Thirukovil</strong>
              (அருள்மிகு ஸ்ரீ அங்காள ஈஸ்வரி திருக்கோவில்). Special bus services. Overflowing streets.
              Music, folk art, and fire-walking ceremonies that haven't changed in generations.
            </P>

            <P>
              Nearby, the <strong className="text-white">Thirumoolanathar Temple</strong> in Puzhal
              carries Chola and Vijayanagara inscriptions, and the
              <strong className="text-white"> Thiruneetreshwarar Temple</strong> in Padianallur is
              among the region's oldest Saivite shrines.
            </P>

            <PullQuote>
              This is not a place that forgets where it came from. Neither do we.
            </PullQuote>
          </section>

          <SectionDivider />

          {/* ── INDUSTRIAL ────────────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="machines">180 Years of Machines</SectionTitle>

            <P>
              In the 1840s — just a few years after the Redhills Railway — a Scottish company
              called <strong className="text-white">Simpsons & Co.</strong> set up shop in North
              Chennai. They built coaches. Then railway carriages. Then motor bodies. Then
              agricultural machinery.
            </P>

            <P>
              Today, as the <strong className="text-white">Amalgamations Group</strong>, their
              factories in Madhavaram and Sembium still run — a 180-year unbroken line of
              engineering and manufacturing in this part of the city.
            </P>

            <P>
              From granite carts on iron rails to coach-builders to precision manufacturing.
              North Chennai has always been a place where things get built.
            </P>

            <PullQuote>We're the latest in that line.</PullQuote>
          </section>

          <SectionDivider />

          {/* ── OUR BEGINNING ─────────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="beginning">September 2024</SectionTitle>

            <P>
              Rotehügels started the way most real things do — with one project, one person,
              and a conviction that the gap between laboratory science and industrial execution
              is where projects fail.
            </P>

            <P>
              The first project was in <strong className="text-white">Zambia</strong>: a zinc dross
              recovery plant. Design, procurement, installation, commissioning — the full cycle,
              delivered from a small office in Redhills to a plant site 8,000 kilometres away.
            </P>

            <P>From that single project came three proprietary technology platforms:</P>

            <div className="my-10 grid sm:grid-cols-3 gap-5">
              {[
                { name: 'AutoREX™', what: 'Plant Automation', desc: 'AI-powered monitoring, PLC/SCADA integration, real-time production tracking', border: 'border-amber-500/30', accent: 'text-amber-400' },
                { name: 'Operon', what: 'Cloud ERP', desc: 'Accounting, HR, procurement, project management, client portal', border: 'border-blue-500/30', accent: 'text-blue-400' },
                { name: 'LabREX', what: 'LIMS', desc: 'ICP-OES, AAS, XRF, wet chemistry — sample tracking across industries', border: 'border-emerald-500/30', accent: 'text-emerald-400' },
              ].map((p, i) => (
                <div key={i} className={`rounded-2xl border bg-zinc-900/60 p-6 ${p.border}`}>
                  <p className={`text-xl font-bold ${p.accent}`}>{p.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{p.what}</p>
                  <p className="text-sm text-zinc-400 mt-3 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            <P>
              Today, Rotehügels serves <strong className="text-white">12+ industries</strong> across
              <strong className="text-white"> India and Africa</strong> — from copper smelters to
              battery recyclers, from textile mills to food processing plants. We design plants,
              build software, supply instrumentation, and operate facilities.
            </P>
          </section>

          <SectionDivider />

          {/* ── WHAT IT MEANS ─────────────────────────────────── */}
          <section className="mb-0">
            <SectionTitle id="meaning">What Rotehügels Means</SectionTitle>

            <P>Our name isn't branding. It's a compass.</P>

            <P>
              The red hills of Sengundram witnessed India's first railway — built not for
              passengers or prestige, but to move stone. They sustained a city with water.
              They nurtured 180 years of engineering. And they're home to a temple carnival
              that hasn't missed a year in living memory.
            </P>

            <div className="my-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Resilience', 'Utility', 'Craft', 'Community'].map(w => (
                <div key={w} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
                  <p className="text-lg font-bold text-white">{w}</p>
                </div>
              ))}
            </div>

            <P>That's what the red hills stand for. That's what we stand for.</P>

            {/* Closing callout */}
            <div className="my-14 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-10 text-center">
              <p className="text-3xl md:text-4xl font-black text-white leading-tight">
                From red hills to global industries.
              </p>
              <p className="text-xl text-rose-400 font-semibold mt-3">
                That's the Rotehügels story.
              </p>
            </div>
          </section>

          {/* ── REFERENCES ────────────────────────────────────── */}
          <section>
            <SectionTitle id="refs">References</SectionTitle>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>Madras Gazette (1836), Asiatic Journal (1836–37) — reports on the Redhills Railway</li>
              <li>C.S. Crole, <em>Chingleput District Manual</em> (1879)</li>
              <li>S. Srinivasachari, <em>History of the City of Madras</em> (1939)</li>
              <li>Dr. A. Raman, <em>The Redhills Railway – India's First Railroad</em></li>
              <li><em>Madras District Gazetteers: Chingleput</em> (1915)</li>
            </ul>
          </section>

          <div className="mt-12"><ShareBlock /></div>
        </div>

        {/* TOC sidebar */}
        <StoryTOC items={toc} />
      </div>
    </main>
  );
}
