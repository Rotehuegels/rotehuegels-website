import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Data Sources — Rotehügels',
  description: 'Every public source that feeds the Rotehügels India Circular Economy Ecosystem directory — CPCB, SPCBs, MoEF, BSE/NSE, credit-rating agencies, and curated editorial.',
};

const LAST_UPDATED = '19 April 2026';

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-7 w-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Data Sources</h1>
        </div>
        <p className="text-sm text-zinc-500 mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5 mb-10">
          <p className="text-sm text-sky-300 font-semibold mb-2">Our directory is a public-record compilation.</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Every facility listed at <Link href="/ecosystem" className="text-sky-400 underline">/ecosystem</Link> is drawn from publicly
            available government registries, regulatory disclosures, industry-association directories, credit-rating agency public
            releases, or facility self-disclosures. We add our own editorial layer — plant-level GPS coordinates, tier-based
            classification, and cross-source verification — on top of that public record. Individual facts (facility names, addresses,
            public capacities) are not copyrightable; our editorial compilation is our own work.
          </p>
          <p className="text-xs text-zinc-500 mt-3">
            Spot an error or an addition? Write to <a href="mailto:info@rotehuegels.com?subject=Data%20Sources%20—%20correction" className="text-sky-400 underline">info@rotehuegels.com</a>.
          </p>
        </div>

        <section className="space-y-10 text-sm text-zinc-300 leading-relaxed">

          <Group title="A. Central Pollution Control Board (CPCB) — Government of India">
            <Source
              name="CPCB — List of Dismantlers / Recyclers under E-Waste (Management) Rules, 2022"
              url="https://www.cpcb.nic.in/e-waste-recyclers-dismantler/"
              scope="Facility name, state, category, authorisation number, authorised quantity."
            />
            <Source
              name="CPCB — Registered Recyclers of Used Lead-Acid Batteries"
              url="https://cpcb.nic.in/uploads/hwmd/List_Used_LA_Batteries_Registered_Recyclers.pdf"
              scope="672 units with capacity (MTA) under Battery Waste Management Rules, 2022."
            />
            <Source
              name="CPCB EPR Portal — Battery Waste Management"
              url="https://eprbattery.cpcb.gov.in"
              scope="Producer / collector / recycler / refurbisher registrations."
            />
            <Source
              name="MoEF / CPCB — List of Non-Ferrous Metal Waste Reprocessors (376 units)"
              url="http://ciiwasteexchange.org/Data/Non-ferrous%20metal%20waste%20reprocessors.pdf"
              scope="Facility name, state, waste type, authorised quantity under Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016."
            />
          </Group>

          <Group title="B. State Pollution Control Boards / Pollution Control Committees">
            <Source name="Maharashtra Pollution Control Board (MPCB)" url="https://www.mpcb.gov.in/" scope="Authorised e-waste recyclers + refurbishers, May 2024 master list." />
            <Source name="Tamil Nadu Pollution Control Board (TNPCB)" url="https://tnpcb.gov.in/" scope="List of e-waste dismantlers / recyclers + EIA filings." />
            <Source name="Telangana State Pollution Control Board (TSPCB)" url="https://tspcb.cgg.gov.in/" scope="Authorised e-waste dismantlers, recyclers, and producers." />
            <Source name="Rajasthan State Pollution Control Board (RSPCB / RPCB)" url="https://environment.rajasthan.gov.in/" scope="Dismantlers, refurbishers, recyclers + hazardous-waste registrations." />
            <Source name="Karnataka State Pollution Control Board (KSPCB)" url="https://kspcb.karnataka.gov.in/" scope="E-waste authorised recyclers / dismantlers." />
            <Source name="West Bengal Pollution Control Board (WBPCB)" url="https://wbpcb.gov.in/" scope="Consent orders + authorised unit notifications." />
            <Source name="Gujarat Pollution Control Board (GPCB)" url="https://gpcb.gujarat.gov.in/" scope="GPCB master e-waste recyclers list + EC notifications." />
            <Source name="Haryana State Pollution Control Board (HSPCB)" url="https://hspcb.gov.in/" scope="Consent-to-operate notifications." />
            <Source name="Uttar Pradesh Pollution Control Board (UPPCB)" url="https://uppcb.com/" scope="E-waste authorised units." />
            <Source name="Delhi Pollution Control Committee (DPCC)" url="https://dpcc.delhigovt.nic.in/" scope="DPCC-approved recyclers list for NCT Delhi." />
            <Source name="Odisha State Pollution Control Board (OSPCB)" url="https://www.ospcboard.org/" scope="Consent-to-operate orders." />
            <Source name="Punjab Pollution Control Board (PPCB)" url="https://www.ppcb.gov.in/" scope="Consent orders + hazardous-waste authorisations." />
            <Source name="Himachal Pradesh State Pollution Control Board (HPPCB)" url="https://hppcb.nic.in/" scope="Consent orders + EIA summaries." />
          </Group>

          <Group title="C. Statutory &amp; regulatory filings">
            <Source name="Ministry of Environment, Forest and Climate Change (MoEFCC)" url="https://moef.gov.in/" scope="Environmental clearance (EC) letters, rules and notifications including E-Waste, Battery Waste, and Hazardous Waste Rules." />
            <Source name="environmentclearance.nic.in" url="https://environmentclearance.nic.in/" scope="Project-level EC/CtE documents used to cross-verify capacity filings." />
            <Source name="Ministry of Corporate Affairs (MCA) portal" url="https://www.mca.gov.in/" scope="Legal entity information, CIN registrations, director master data (used for cross-reference; not redistributed raw)." />
            <Source name="Goods and Services Tax (GST) portal" url="https://www.gst.gov.in/" scope="GSTIN validation for registered entities. Detailed GST look-ups performed via our licensed gstincheck.co.in credits; raw API responses are held internally only." />
          </Group>

          <Group title="D. Listed-company disclosures">
            <Source name="Bombay Stock Exchange (BSE)" url="https://www.bseindia.com/" scope="Annual reports, investor presentations, quarterly results of BSE-listed companies." />
            <Source name="National Stock Exchange of India (NSE)" url="https://www.nseindia.com/" scope="Listed-company filings, SME platform disclosures." />
            <Source name="Securities and Exchange Board of India (SEBI)" url="https://www.sebi.gov.in/" scope="DRHP / RHP filings for IPO-bound companies." />
          </Group>

          <Group title="E. Credit-rating agency public releases">
            <p className="text-xs text-zinc-500 mb-3">
              Rating-agency press releases (&ldquo;PRs&rdquo;) are published by each agency under SEBI rules for rated debt. They typically
              disclose installed capacity, plant location, product mix, and financial metrics — particularly valuable for unlisted
              SMEs that do not file with BSE/NSE but take bank debt.
            </p>
            <Source name="ICRA Limited" url="https://www.icra.in/" scope="Rating rationales for rated issuers." />
            <Source name="CARE Ratings" url="https://www.careratings.com/" scope="Press releases + rationales." />
            <Source name="Infomerics Ratings" url="https://www.infomerics.com/" scope="SME-focused rating PRs." />
            <Source name="Acuité Ratings &amp; Research" url="https://www.acuite.in/" scope="Rating rationales across sectors." />
            <Source name="Brickwork Ratings" url="https://www.brickworkratings.com/" scope="Rating reports." />
          </Group>

          <Group title="F. Facility self-disclosures">
            <p className="text-xs text-zinc-500">
              Company websites, investor-relations pages, sustainability reports, annual reports, press releases, and public tender
              documents. Each is cross-verified against a regulatory or rating source where possible.
            </p>
          </Group>

          <Group title="G. Rotehügels editorial layer">
            <p className="text-xs text-zinc-500">
              The following layers are added by Rotehügels on top of the above public-record sources and constitute our own editorial
              work:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs">
              <li>Plant-level GPS coordinates (geo-coded from publicly-disclosed plant addresses).</li>
              <li>Tier classification into upstream / forward / reverse-loop groups.</li>
              <li>Category assignments (e-waste, battery, black-mass, non-ferrous, zinc-dross, primary-metal, critical-minerals, EV OEM, battery-pack, cell/CAM maker).</li>
              <li>Group-level rollups where a single corporate family operates multiple plants.</li>
              <li>Cross-source verification and reconciliation of conflicting capacity figures.</li>
              <li>Honest labelling where capacity is not publicly disclosed or where a facility is a trader rather than a processor.</li>
            </ul>
          </Group>

          <Group title="H. Disclaimers">
            <p>
              Information is compiled in good faith from the above public sources. We do not guarantee that any specific entry is
              current, complete, or accurate at the moment of use. Users must independently verify facility credentials
              (CPCB/SPCB/MoEF authorisations) directly with the issuing regulator before relying on the data for any commercial or
              compliance purpose. See <Link href="/terms" className="text-emerald-400 underline">Terms of Use § 4</Link> for the full
              accuracy disclaimer, and <Link href="/grievance" className="text-emerald-400 underline">Grievance Redressal</Link> for
              the correction process.
            </p>
          </Group>

        </section>

        <p className="mt-12 text-xs text-zinc-600">
          © {new Date().getFullYear()} Rotehuegel Research Business Consultancy Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Source({ name, url, scope }: { name: string; url: string; scope: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 text-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-zinc-200">{name}</p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
             className="text-emerald-400 hover:text-emerald-300 underline shrink-0 whitespace-nowrap">
            visit ↗
          </a>
        )}
      </div>
      <p className="text-zinc-500 mt-1">{scope}</p>
    </div>
  );
}
