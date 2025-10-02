// app/rotehuegels-story/page.tsx
import type { Metadata } from "next";
import StoryTOC from "@/components/StoryTOC";
import FactPanel from "@/components/FactPanel";
import Breadcrumb from "@/components/Breadcrumb";
import ShareBlock from "@/components/ShareBlock";

export const metadata: Metadata = {
  title: "The Rotehügels Story",
  description:
    "From Sengundram (செங்குன்றம்) to Redhills (ரெட்ஹில்ஸ்) to Rotehügels — a name shaped by the land, water and industry.",
  alternates: { canonical: "/rotehuegels-story" },
};

const toc = [
  { id: "origins", label: "Origins of the Name" },
  { id: "water-land", label: "Water, Land & Heritage" },
  { id: "railway", label: "India’s First Railway (1836–37)" },
  { id: "angalaeshwari", label: "Arulmigu Sri Angala Eeswari Thirukovil" },
  { id: "temples", label: "Temples & Landmarks" },
  { id: "industry", label: "Industry & Connectivity" },
  { id: "amalgamations", label: "Industrial Heritage" },
  { id: "metro", label: "Redhills Metro & Future Growth" },
  { id: "why-name", label: "Why the Name Rotehügels?" },
  { id: "refs", label: "References" },
];

// Anchor offset so headings don't hide under sticky header + ticker
const sectionHead = "scroll-mt-36 md:scroll-mt-40 !mt-12 !mb-4";

export default function RotehuegelsStoryPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 lg:px-10 py-12">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_380px] gap-10 lg:gap-14">
        <article className="prose prose-invert prose-rose prose-lg max-w-none leading-relaxed">
          <div className="mb-4">
            <Breadcrumb />
          </div>

          <h1 className="!mb-2 !text-5xl !leading-tight tracking-tight">
            The Rotehügels Story
          </h1>
          <h2 className="!mt-0 !mb-7 !text-2xl !font-semibold !leading-snug">
            From Sengundram (செங்குன்றம்) to Redhills (ரெட்ஹில்ஸ்) to Rotehügels
          </h2>
          <p className="!mt-0 !mb-10 italic text-neutral-400">
            A name shaped by the land
          </p>

          <h3 id="origins" className={sectionHead}>
            Origins of the Name
          </h3>
          <p>
            North of Chennai lies the locality now known as <strong>Redhills (ரெட்ஹில்ஸ்)</strong>.
            Its older Tamil name, <strong>Sengundram (செங்குன்றம்)</strong>, comes from two words:
            <em>sen</em> (red) and <em>kundram</em> (hill). The name reflects the red lateritic
            soil and rocky terrain that define the landscape.
          </p>
          <p>
            When the British translated place names, Sengundram became Redhills.
            Our company name, <strong>Rotehügels</strong>, carries this legacy forward.
            <strong>Rotehügel</strong> is the German equivalent of Redhills; the final “s”
            symbolically means belonging. In short, <strong>Rotehügels is the company that belongs to Redhills.</strong>
          </p>

          <h3 id="water-land" className={sectionHead}>
            Water, Land and Heritage
          </h3>
          <p>
            For centuries, Sengundram (செங்குன்றம்) was part of Thondaimandalam, a fertile agrarian
            region sustained by irrigation tanks. The <strong>Puzhal Tank</strong> (later called
            Redhills Lake) is mentioned in Chola inscriptions as a boundary landmark.
            In 1876, under British engineers, the tank was expanded into the
            <strong> Redhills Reservoir</strong>, which even today remains one of Chennai’s primary
            drinking water sources.
          </p>

          <h3 id="railway" className={sectionHead}>
            India’s First Railway (1836–37)
          </h3>
          <p>
            Few know that India’s railway history began here. In 1836, the East India Company
            laid a 3½-mile <strong>Redhills Railway</strong>, carrying granite from Sengundram
            quarries to Madras for road works.
          </p>
          <ul>
            <li>Stone-laden carts rolled smoothly on rails.</li>
            <li>Contemporary reports mention animal traction, with experiments on locomotives.</li>
            <li>
              Although overshadowed by the 1853 Bombay–Thane passenger train, the Redhills Railway
              was India’s first railroad.
            </li>
          </ul>

          <h3 id="angalaeshwari" className={sectionHead}>
            Arulmigu Sri Angala Eeswari Thirukovil (அருள்மிகு ஸ்ரீ அங்காள ஈஸ்வரி திருக்கோவில்)
          </h3>
          <p>
            At the heart of Redhills’ cultural identity stands the
            <strong> Arulmigu Sri Angala Eeswari Thirukovil (அருள்மிகு ஸ்ரீ அங்காள ஈஸ்வரி திருக்கோவில்)</strong>.
          </p>
          <ul>
            <li>The temple is renowned for its annual 12-day carnival, attracting lakhs of devotees each year.</li>
            <li>Special bus services are arranged during the festive season to accommodate the influx of pilgrims.</li>
            <li>
              Beyond being a centre of worship, the temple is a living cultural landmark, reflecting
              Redhills’ deep ties to Tamil traditions, music, folk arts, and communal celebrations.
            </li>
          </ul>
          <p>
            The festival highlights Redhills as a place where heritage and devotion thrive alongside modern growth.
          </p>

          <h3 id="temples" className={sectionHead}>Temples and Landmarks</h3>
          <p>The region preserves its cultural depth with ancient temples and civic landmarks:</p>
          <ul>
            <li><strong>Thirumoolanathar Temple, Puzhal</strong> – Shiva temple with Chola and Vijayanagara inscriptions.</li>
            <li><strong>Thiruneetreshwarar Temple, Padianallur</strong> – an early Saivite temple northeast of Redhills.</li>
            <li><strong>Pachai Amman Temple, Edapalayam</strong> and Murugan/Amman shrines in the Alamathi–Naravarikuppam belt.</li>
            <li><strong>Puzhal Central Prison (2006)</strong> – a modern institution in North Chennai.</li>
          </ul>

          <h3 id="industry" className={sectionHead}>Industry and Connectivity</h3>
          <p>Today, Redhills is an emerging hub at the crossroads of logistics, industry, and recycling.</p>

          <h4 className="!mt-7 !mb-2">Ports (distance from Redhills)</h4>
          <ul>
            <li>Kamarajar (Ennore) – ~20 km</li>
            <li>Kattupalli – ~24 km</li>
            <li>Chennai Port – ~22 km</li>
          </ul>

          <h4 className="!mt-7 !mb-2">Airport</h4>
          <ul>
            <li>Chennai International (MAA) – ~30 km</li>
          </ul>

          <h4 className="!mt-7 !mb-2">Warehousing &amp; Bonded Facilities</h4>
          <ul>
            <li>DP World Redhills CFS (20.5 acres, ~45,000 TEUs p.a.)</li>
            <li>Central Warehousing Corporation (CWC), Chennai Region</li>
            <li>Private bonded warehouses across Redhills–Madhavaram–Manali</li>
          </ul>

          <h4 className="!mt-7 !mb-2">Industrial Clusters Nearby</h4>
          <ul>
            <li>Manali – petrochemicals and refining</li>
            <li>Madhavaram – logistics &amp; trucking hubs</li>
            <li>Gummidipoondi SIPCOT – heavy industries</li>
            <li>Recycling belt – e-waste and metal recycling units (growing sector)</li>
          </ul>

          <h3 id="amalgamations" className={sectionHead}>
            Industrial Heritage – Simpsons to Amalgamations Group
          </h3>
          <p>
            North Chennai’s industrial belt also preserves a legacy over 150 years old: the
            <strong> Amalgamations Group</strong>, originally <strong>Simpsons &amp; Co.</strong>
          </p>
          <ul>
            <li>Founded in the 1840s as a coach-builder, Simpsons grew into a manufacturer of railway carriages, motor bodies, and agricultural machinery.</li>
            <li>
              Today, as part of the diversified Amalgamations Group, its factories in
              <strong> Madhavaram</strong> and <strong> Sembium</strong> continue that tradition.
            </li>
            <li>
              Sembium, another locality with strong historical resonance, became a cradle of industrial
              innovation that shaped Chennai’s engineering identity through the 20th century.
            </li>
          </ul>
          <p>
            This heritage ties Redhills, Madhavaram, and Sembium into a wider story of railways,
            engineering, and manufacturing excellence—a story that continues with new-age ventures like ours.
          </p>

          <h3 id="metro" className={sectionHead}>
            Redhills Metro &amp; Future Growth
          </h3>
          <p>
            The Chennai Metro Phase II corridors (2025–28) will bring new connectivity to the region.
            While Redhills does not yet have its own station, the Outer Ring Road (ORR) and proposed
            Metro extensions ensure it remains firmly in Chennai’s growth map.
          </p>

          <h3 id="why-name" className={sectionHead}>Why the Name Rotehügels?</h3>
          <p>Our identity is rooted in this landscape:</p>
          <ul>
            <li><strong>Rotehügel</strong> = German for Redhills / Sengundram.</li>
            <li><strong>Rotehügels</strong> = friendly short form, symbolising belonging.</li>
            <li>The final “s” = a mark of identity—our company belongs to Redhills.</li>
          </ul>
          <p>
            Through this name, we carry the spirit of resilience, innovation, and global vision that defines Redhills.
          </p>

          <h3 id="refs" className={sectionHead}>References</h3>
          <ul>
            <li>Madras Gazette (1836), Asiatic Journal (1836–37) – reports on the Redhills Railway</li>
            <li>C.S. Crole, <em>Chingleput District Manual</em> (1879)</li>
            <li>S. Srinivasachari, <em>History of the City of Madras</em> (1939)</li>
            <li>Dr. A. Raman, <em>The Redhills Railway – India’s First Railroad</em></li>
            <li><em>Madras District Gazetteers: Chingleput</em> (1915)</li>
          </ul>

          <div className="mt-12">
            <FactPanel />
          </div>

          <div className="mt-8">
            <ShareBlock />
          </div>
        </article>

        <StoryTOC items={toc} />
      </div>
    </main>
  );
}