// app/contact/page.tsx
export const metadata = { title: "Contact Us — Rotehuegels" };

export default function ContactPage() {
  return (
    <main className="mt-10 px-4">
      <h1 className="text-center text-3xl font-bold">Contact Us</h1>

      {/* Three region cards, responsive grid */}
      <section className="mx-auto mt-8 grid max-w-6xl auto-rows-fr gap-6 md:grid-cols-3">
        {/* APAC — Chennai */}
        <div className="card h-full text-center md:text-left">
          <h3 className="text-lg font-semibold">Asia–Pacific (APAC) — Chennai, India</h3>
          <p className="mt-1 text-xs opacity-80">IST (UTC+5:30) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <p>
              📧{" "}
              <a href="mailto:apac@rotehuegels.com" className="hover:underline">
                apac@rotehuegels.com
              </a>
            </p>
            <p>
              📱{" "}
              <a href="tel:+919004491275" className="hover:underline">
                +91&nbsp;90044&nbsp;91275
              </a>
            </p>
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Rotehügels Headquarters</p>
            <p className="mt-1">
              No. 1/584, 7th Street, Jothi Nagar, Padianallur,
              <br />
              Near Gangaiamman Kovil, Redhills, Chennai – 600052
              <br />
              Tamil Nadu, India
            </p>
            <p className="mt-3">
              🌐{" "}
              <a
                href="https://www.rotehuegels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                www.rotehuegels.com
              </a>
            </p>
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Corporate HQ · R&amp;D · Engineering · EPC · Asia-Pacific Client Engagement</p>
            <p className="mt-2">
              <span className="font-medium">Contact:</span> Mr. Sivakumar Shanmugam — Director &amp; CEO
            </p>
          </div>
        </div>

        {/* EMEA — Zambia */}
        <div className="card h-full text-center md:text-left">
          <h3 className="text-lg font-semibold">Europe, Middle East &amp; Africa (EMEA) — Zambia</h3>
          <p className="mt-1 text-xs opacity-80">CAT (UTC+2) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <p>
              📧{" "}
              <a href="mailto:emea@rotehuegels.com" className="hover:underline">
                emea@rotehuegels.com
              </a>
            </p>
            <p>
              📱{" "}
              <a href="tel:+260773540064" className="hover:underline">
                +260&nbsp;77354&nbsp;0064
              </a>
            </p>
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Sales &amp; Marketing support across Africa and Europe, coordinated via Chennai and Dallas.</p>
            <p className="mt-2">
              <span className="font-medium">Contact:</span> Ms. Vaishnavi Elumalai — Sales &amp; Marketing (Technical)
            </p>
            <p className="mt-1">
              🔗{" "}
              <a
                href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                LinkedIn — Vaishnavi Elumalai
              </a>
            </p>
          </div>
        </div>

        {/* Americas — Dallas */}
        <div className="card h-full text-center md:text-left">
          <h3 className="text-lg font-semibold">Americas — Dallas, USA</h3>
          <p className="mt-1 text-xs opacity-80">CST (UTC−6) • 08:00–18:00</p>

          <div className="mt-3 space-y-1">
            <p>
              📧{" "}
              <a href="mailto:americas@rotehuegels.com" className="hover:underline">
                americas@rotehuegels.com
              </a>
            </p>
            <p>
              📱{" "}
              <a href="tel:+18477787595" className="hover:underline">
                +1&nbsp;847&nbsp;778&nbsp;7595
              </a>
            </p>
          </div>

          <div className="mt-4 text-sm opacity-90">
            <p className="font-medium">Functions</p>
            <p>Client acquisition · Partnership development · Investor relations across the Americas.</p>
            <p className="mt-2">
              <span className="font-medium">Contact:</span> Ms. Vaishnavi Elumalai — Sales &amp; Marketing (Technical)
            </p>
            <p className="mt-1">
              🔗{" "}
              <a
                href="https://www.linkedin.com/in/vaishnavi-elumalai-7b5562245/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                LinkedIn — Vaishnavi Elumalai
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Territory Allocation */}
      <section className="mx-auto mt-8 max-w-6xl">
        <div className="card">
          <h3 className="text-lg font-semibold text-center md:text-left">Territory Allocation</h3>
          <div className="mt-3 grid gap-3 text-sm opacity-90 md:grid-cols-2">
            <div className="rounded-md bg-white/5 p-3">
              <p className="font-medium">APAC</p>
              <p>India, South Asia, Southeast Asia, East Asia, Central Asia, Middle East, Oceania</p>
              <p className="mt-1">
                <span className="font-medium">Lead:</span> Mr. Sivakumar Shanmugam — Director &amp; CEO
              </p>
            </div>
            <div className="rounded-md bg-white/5 p-3">
              <p className="font-medium">EMEA &amp; Americas</p>
              <p>All African &amp; European countries; North, Central &amp; South America</p>
              <p className="mt-1">
                <span className="font-medium">Lead:</span> Ms. Vaishnavi Elumalai — Sales &amp; Marketing (Technical)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global email shortcuts */}
      <section className="mx-auto mt-10 max-w-3xl text-center">
        <p className="opacity-90">Prefer email? Choose the right address:</p>
        <div className="mt-3 space-y-1">
          <p>
            General Enquiries:{" "}
            <a className="text-rose-400 hover:underline" href="mailto:info@rotehuegels.com">
              info@rotehuegels.com
            </a>
          </p>
          <p>
            RFPs / Scope Notes:{" "}
            <a className="text-rose-400 hover:underline" href="mailto:sales@rotehuegels.com">
              sales@rotehuegels.com
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}