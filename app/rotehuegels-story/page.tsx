// app/rotehuegels-story/page.tsx
import type { Metadata } from "next";
import StoryTOC from "@/components/StoryTOC";
import ShareBlock from "@/components/ShareBlock";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "The Rotehügels Story",
  description:
    "Before the Bombay–Thane railway, before independence, before the tech boom — there were red hills, iron tracks, and granite. This is our story.",
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

const sh = "scroll-mt-36 md:scroll-mt-40 !mt-14 !mb-4";

export default function RotehuegelsStoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-14">
        <article className="prose prose-invert prose-rose prose-lg max-w-none leading-relaxed">
          <div className="mb-4"><Breadcrumb /></div>

          <h1 className="!mb-3 !text-5xl !leading-tight tracking-tight">
            The Rotehügels Story
          </h1>
          <p className="!mt-0 !mb-12 !text-xl text-zinc-400 italic">
            Before the Bombay–Thane railway. Before independence. Before the tech boom.
            There were red hills, iron tracks, and granite.
          </p>

          {/* ── THE TRACKS ───────────────────────────────────── */}
          <h3 id="tracks" className={sh}>The Tracks Before History</h3>

          <p>
            In 1836, seventeen years before the famous Bombay–Thane passenger train,
            the East India Company did something remarkable in a small quarry town
            north of Madras.
          </p>
          <p>
            They laid <strong>3½ miles of iron rails</strong>.
          </p>
          <p>
            Stone-laden carts — pulled by animals, possibly tested with steam — rolled
            from the red granite quarries of <strong>Sengundram</strong> to the port
            at Madras. The purpose was unglamorous: road construction. But the achievement
            was historic.
          </p>
          <p className="!text-lg !font-semibold text-rose-300">
            This was India's first railroad. And it ran through our backyard.
          </p>
          <p>
            The <strong>Redhills Railway</strong> never made it to the textbooks. No
            passenger ever rode it. No politician inaugurated it. It was built to move
            stone — quietly, efficiently, without ceremony.
          </p>
          <p>
            We like that. It reminds us of how real work gets done.
          </p>

          {/* ── THREE LANGUAGES ──────────────────────────────── */}
          <h3 id="name" className={sh}>Three Languages, One Hill</h3>

          <p>
            The quarry town had a name long before the British arrived.
          </p>
          <p>
            In Tamil, it was <strong>செங்குன்றம்</strong> — <em>Sengundram</em>.
            <em>Sen</em> means red. <em>Kundram</em> means hill. The name described
            what everyone could see: red laterite soil, red rocky terrain, red hills
            catching the morning sun.
          </p>
          <p>
            The British translated it literally: <strong>Redhills</strong>.
          </p>
          <p>
            We translated it one more time — into German: <strong>Rotehügel</strong>.
            And added an <strong>"s"</strong> at the end. Not for plural. For belonging.
          </p>

          <div className="not-prose my-8">
            <div className="grid grid-cols-3 gap-4">
              {[
                { lang: 'Tamil', word: 'செங்குன்றம்', romanized: 'Sengundram', era: 'Ancient' },
                { lang: 'English', word: 'Redhills', romanized: 'British translation', era: '1700s' },
                { lang: 'German', word: 'Rotehügels', romanized: 'Our name', era: '2024' },
              ].map((l, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{l.lang} · {l.era}</p>
                  <p className="text-xl font-black text-white mt-2">{l.word}</p>
                  <p className="text-xs text-zinc-500 mt-1">{l.romanized}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-zinc-500 mt-3 italic">
              Three eras. Three languages. Same red hills.
            </p>
          </div>

          {/* ── THE LAKE ─────────────────────────────────────── */}
          <h3 id="water" className={sh}>The Lake That Feeds a City</h3>

          <p>
            Before it was a quarry town, Sengundram was farming country — part of
            <strong> Thondaimandalam</strong>, sustained by ancient irrigation tanks.
          </p>
          <p>
            The <strong>Puzhal Tank</strong> appears in Chola-era inscriptions as a
            boundary marker. In 1876, British engineers expanded it into the
            <strong> Redhills Reservoir</strong> — and it still supplies drinking water
            to Chennai today. Every monsoon, when the reservoir fills, news channels
            report it as front-page relief.
          </p>
          <p>
            A land that has sustained millions for centuries. That's the ground we
            stand on.
          </p>

          {/* ── TEMPLE ───────────────────────────────────────── */}
          <h3 id="temple" className={sh}>Where Devotion Meets Ground</h3>

          <p>
            Every year, lakhs of devotees converge on Redhills for the 12-day carnival
            at the <strong>Arulmigu Sri Angala Eeswari Thirukovil</strong>
            (அருள்மிகு ஸ்ரீ அங்காள ஈஸ்வரி திருக்கோவில்). Special bus services.
            Overflowing streets. Music, folk art, and fire-walking ceremonies that
            haven't changed in generations.
          </p>
          <p>
            Nearby, the <strong>Thirumoolanathar Temple</strong> in Puzhal carries
            Chola and Vijayanagara inscriptions, and the <strong>Thiruneetreshwarar
            Temple</strong> in Padianallur is among the region's oldest Saivite shrines.
          </p>
          <p>
            This is not a place that forgets where it came from. Neither do we.
          </p>

          {/* ── INDUSTRIAL ───────────────────────────────────── */}
          <h3 id="machines" className={sh}>180 Years of Machines</h3>

          <p>
            In the 1840s — just a few years after the Redhills Railway — a Scottish
            company called <strong>Simpsons & Co.</strong> set up shop in North Chennai.
            They built coaches. Then railway carriages. Then motor bodies. Then
            agricultural machinery.
          </p>
          <p>
            Today, as the <strong>Amalgamations Group</strong>, their factories in
            Madhavaram and Sembium still run — a 180-year unbroken line of engineering
            and manufacturing in this part of the city.
          </p>
          <p>
            From granite carts on iron rails to coach-builders to precision manufacturing.
            North Chennai has always been a place where things get built.
          </p>
          <p className="!text-lg !font-semibold text-rose-300">
            We're the latest in that line.
          </p>

          {/* ── OUR BEGINNING ────────────────────────────────── */}
          <h3 id="beginning" className={sh}>September 2024</h3>

          <p>
            Rotehügels started the way most real things do — with one project,
            one person, and a conviction that the gap between laboratory science
            and industrial execution is where projects fail.
          </p>
          <p>
            The first project was in <strong>Zambia</strong>: a zinc dross recovery
            plant. Design, procurement, installation, commissioning — the full cycle,
            delivered from a small office in Redhills to a plant site 8,000 kilometres
            away.
          </p>
          <p>
            From that single project came three proprietary technology platforms:
          </p>

          <div className="not-prose my-8 grid sm:grid-cols-3 gap-4">
            {[
              { name: 'AutoREX™', what: 'Plant Automation', desc: 'AI-powered monitoring, PLC/SCADA integration, real-time production tracking', border: 'border-amber-500/30', text: 'text-amber-400' },
              { name: 'Operon', what: 'Cloud ERP', desc: 'Accounting, HR, procurement, project management, client portal', border: 'border-blue-500/30', text: 'text-blue-400' },
              { name: 'LabREX', what: 'LIMS', desc: 'ICP-OES, AAS, XRF, wet chemistry — sample tracking across industries', border: 'border-emerald-500/30', text: 'text-emerald-400' },
            ].map((p, i) => (
              <div key={i} className={`rounded-xl border bg-zinc-900/40 p-5 ${p.border}`}>
                <p className={`text-lg font-bold ${p.text}`}>{p.name}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{p.what}</p>
                <p className="text-sm text-zinc-400 mt-2">{p.desc}</p>
              </div>
            ))}
          </div>

          <p>
            Today, Rotehügels serves <strong>12+ industries</strong> across
            <strong> India and Africa</strong> — from copper smelters to battery
            recyclers, from textile mills to food processing plants. We design plants,
            build software, supply instrumentation, and operate facilities.
          </p>
          <p>
            Each module — AutoREX™, Operon, LabREX — works independently. Together,
            they give clients complete control over their operations. That integration
            is what sets us apart.
          </p>

          {/* ── WHAT IT MEANS ────────────────────────────────── */}
          <h3 id="meaning" className={sh}>What Rotehügels Means</h3>

          <p>
            Our name isn't branding. It's a compass.
          </p>
          <p>
            The red hills of Sengundram witnessed India's first railway — built not
            for passengers or prestige, but to move stone. They sustained a city with
            water. They nurtured 180 years of engineering. And they're home to a
            temple carnival that hasn't missed a year in living memory.
          </p>
          <p>
            Resilience. Utility. Craft. Community.
          </p>
          <p>
            That's what the red hills stand for. That's what we stand for.
          </p>

          <div className="not-prose my-10 rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-8 text-center">
            <p className="text-2xl font-black text-white leading-snug">
              From red hills to global industries.
            </p>
            <p className="text-lg text-rose-400 font-semibold mt-2">
              That's the Rotehügels story.
            </p>
          </div>

          {/* ── REFERENCES ───────────────────────────────────── */}
          <h3 id="refs" className={sh}>References</h3>
          <ul className="!text-sm text-zinc-500">
            <li>Madras Gazette (1836), Asiatic Journal (1836–37) — reports on the Redhills Railway</li>
            <li>C.S. Crole, <em>Chingleput District Manual</em> (1879)</li>
            <li>S. Srinivasachari, <em>History of the City of Madras</em> (1939)</li>
            <li>Dr. A. Raman, <em>The Redhills Railway – India's First Railroad</em></li>
            <li><em>Madras District Gazetteers: Chingleput</em> (1915)</li>
          </ul>

          <div className="mt-8"><ShareBlock /></div>
        </article>

        <StoryTOC items={toc} />
      </div>
    </main>
  );
}
