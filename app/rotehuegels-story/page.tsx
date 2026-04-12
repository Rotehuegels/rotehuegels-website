// app/rotehuegels-story/page.tsx
import type { Metadata } from "next";
import StoryTOC from "@/components/StoryTOC";
import ShareBlock from "@/components/ShareBlock";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "The Rotehügels Story",
  description:
    "From Sengundram (செங்குன்றம்) to Redhills to Rotehügels — how a name shaped by red hills, India's first railway, and engineering heritage became a global technology company.",
  alternates: { canonical: "/rotehuegels-story" },
};

const toc = [
  { id: "name", label: "The Name" },
  { id: "land", label: "The Land" },
  { id: "railway", label: "India's First Railway" },
  { id: "heritage", label: "Cultural Heritage" },
  { id: "industrial", label: "Industrial Legacy" },
  { id: "journey", label: "Our Journey" },
  { id: "why", label: "Why Rotehügels" },
  { id: "refs", label: "References" },
];

const sh = "scroll-mt-36 md:scroll-mt-40 !mt-14 !mb-4";

export default function RotehuegelsStoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-14">
        <article className="prose prose-invert prose-rose prose-lg max-w-none leading-relaxed">
          <div className="mb-4"><Breadcrumb /></div>

          <h1 className="!mb-2 !text-5xl !leading-tight tracking-tight">
            The Rotehügels Story
          </h1>
          <p className="!mt-0 !mb-10 !text-xl text-zinc-400">
            How a name rooted in red hills, India's first railway, and 180 years of engineering
            heritage became a global technology company.
          </p>

          {/* ── THE NAME ─────────────────────────────────────── */}
          <h3 id="name" className={sh}>Rotehügel = Red Hill</h3>

          <p>
            North of Chennai lies <strong>Redhills</strong> (ரெட்ஹில்ஸ்) — known in Tamil as
            <strong> Sengundram</strong> (செங்குன்றம்), from <em>sen</em> (red) and <em>kundram</em> (hill).
            The red lateritic soil and rocky terrain gave this land its name centuries before the
            British translated it.
          </p>
          <p>
            <strong>Rotehügel</strong> is the German equivalent of Redhills. The final <strong>"s"</strong> is
            a mark of belonging — <em>Rotehügels is the company that belongs to Redhills.</em>
          </p>
          <p>
            Three languages. One meaning. The red hills that shaped a landscape now shape a company.
          </p>

          <div className="not-prose my-8 grid grid-cols-3 gap-4">
            {[
              { lang: 'Tamil', name: 'செங்குன்றம்', sub: 'Sengundram' },
              { lang: 'English', name: 'Redhills', sub: 'British translation' },
              { lang: 'German', name: 'Rotehügels', sub: 'Our name' },
            ].map((l, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{l.lang}</p>
                <p className="text-lg font-bold text-white mt-1">{l.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{l.sub}</p>
              </div>
            ))}
          </div>

          {/* ── THE LAND ─────────────────────────────────────── */}
          <h3 id="land" className={sh}>The Land</h3>

          <p>
            Sengundram was part of <strong>Thondaimandalam</strong>, a fertile region sustained by
            ancient irrigation tanks. The <strong>Puzhal Tank</strong> — mentioned in Chola
            inscriptions — was expanded in 1876 into the <strong>Redhills Reservoir</strong>,
            which remains one of Chennai's primary drinking water sources to this day.
          </p>
          <p>
            A land that has sustained millions with water for centuries — this is where Rotehügels
            calls home.
          </p>

          {/* ── INDIA'S FIRST RAILWAY ────────────────────────── */}
          <h3 id="railway" className={sh}>India's First Railway — Right Here (1836)</h3>

          <p>
            Most people think India's railway story began with the 1853 Bombay–Thane passenger train.
            It didn't. <strong>It began here, in Redhills, in 1836.</strong>
          </p>
          <p>
            The East India Company laid a <strong>3½-mile Redhills Railway</strong> to carry granite
            from Sengundram quarries to Madras for road construction. Stone-laden carts rolled on
            iron rails — the first time tracks carried cargo in India.
          </p>
          <p>
            India's first railroad was built to move stone. Our company was built to move industries forward.
            The parallel is not lost on us.
          </p>

          {/* ── CULTURAL HERITAGE ────────────────────────────── */}
          <h3 id="heritage" className={sh}>Cultural Heritage</h3>

          <p>
            At the heart of Redhills stands the <strong>Arulmigu Sri Angala Eeswari Thirukovil</strong>
            (அருள்மிகு ஸ்ரீ அங்காள ஈஸ்வரி திருக்கோவில்) — renowned for its annual 12-day carnival
            that draws lakhs of devotees. The region is also home to the <strong>Thirumoolanathar
            Temple</strong> in Puzhal (with Chola inscriptions), the <strong>Thiruneetreshwarar
            Temple</strong> in Padianallur, and shrines across the Alamathi–Naravarikuppam belt.
          </p>
          <p>
            Redhills is where heritage and devotion thrive alongside modern growth — a character
            our company inherits.
          </p>

          {/* ── INDUSTRIAL LEGACY ─────────────────────────────── */}
          <h3 id="industrial" className={sh}>180 Years of Engineering</h3>

          <p>
            North Chennai's industrial belt preserves a legacy over 150 years old. <strong>Simpsons
            & Co.</strong>, founded in the 1840s as a coach-builder, grew into a manufacturer of
            railway carriages, motor bodies, and agricultural machinery. Today, as part of the
            <strong> Amalgamations Group</strong>, its factories in Madhavaram and Sembium continue
            that tradition.
          </p>
          <p>
            From granite railways to coach-building to modern manufacturing — Redhills, Madhavaram,
            and Sembium share a story of engineering excellence. Rotehügels is the next chapter
            in that story.
          </p>

          {/* ── OUR JOURNEY ──────────────────────────────────── */}
          <h3 id="journey" className={sh}>Our Journey</h3>

          <p>
            In <strong>September 2024</strong>, Rotehügels began with a single project in
            <strong> Zambia</strong> — designing and commissioning a zinc dross recovery plant.
            What started as hands-on engineering consultancy quickly grew into something larger.
          </p>
          <p>
            From that first project, we built three proprietary technology platforms:
          </p>

          <div className="not-prose my-6 grid sm:grid-cols-3 gap-4">
            {[
              { name: 'AutoREX™', desc: 'AI-powered plant automation', color: 'border-amber-500/30 text-amber-400' },
              { name: 'Operon', desc: 'Cloud ERP for operations', color: 'border-blue-500/30 text-blue-400' },
              { name: 'LabREX', desc: 'Laboratory management (LIMS)', color: 'border-emerald-500/30 text-emerald-400' },
            ].map((p, i) => (
              <div key={i} className={`rounded-xl border bg-zinc-900/40 p-4 ${p.color.split(' ')[0]}`}>
                <p className={`font-bold ${p.color.split(' ')[1]}`}>{p.name}</p>
                <p className="text-xs text-zinc-400 mt-1">{p.desc}</p>
              </div>
            ))}
          </div>

          <p>
            Today, we serve <strong>12+ industries</strong> across <strong>India and Africa</strong> —
            from copper smelters to battery recyclers, from textile mills to food processing plants.
            We design plants, build software, supply instrumentation, and operate facilities.
          </p>

          {/* ── WHY ROTEHÜGELS ────────────────────────────────── */}
          <h3 id="why" className={sh}>Why Rotehügels</h3>

          <p>
            Our name is not just a translation. It's a statement.
          </p>
          <p>
            The red hills of Sengundram witnessed India's first railway. They sustained a city with
            water. They nurtured 180 years of engineering and manufacturing. And now, they're home
            to a company building technology for the world's process industries.
          </p>
          <p className="!text-xl !font-bold text-rose-400">
            From red hills to global industries — that's the Rotehügels story.
          </p>

          {/* ── REFERENCES ───────────────────────────────────── */}
          <h3 id="refs" className={sh}>References</h3>
          <ul className="!text-sm text-zinc-500">
            <li>Madras Gazette (1836), Asiatic Journal (1836–37) — reports on the Redhills Railway</li>
            <li>C.S. Crole, <em>Chingleput District Manual</em> (1879)</li>
            <li>S. Srinivasachari, <em>History of the City of Madras</em> (1939)</li>
            <li>Dr. A. Raman, <em>The Redhills Railway – India's First Railroad</em></li>
            <li><em>Madras District Gazetteers: Chingleput</em> (1915)</li>
          </ul>

          <div className="mt-8">
            <ShareBlock />
          </div>
        </article>

        <StoryTOC items={toc} />
      </div>
    </main>
  );
}
