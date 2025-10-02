// app/contact/page.tsx
export const metadata = { title: "Contact Us — Rotehuegels" };

export default function ContactPage() {
  return (
    <main className="mt-10 px-4">
      <h1 className="text-center text-3xl font-bold">Contact Us</h1>

      {/* Two equal cards, centered within a max width */}
      <section className="mx-auto mt-8 grid max-w-6xl auto-rows-fr gap-6 md:grid-cols-2">
        {/* India HQ */}
        <div className="card h-full text-center md:text-left">
          <h3 className="text-lg font-semibold">Registered Office (India HQ)</h3>
          <p className="mt-2 opacity-90">
            No. 1/584, 7th Street, Jothi Nagar, Padianallur,
            <br />
            Near Gangaiamman Kovil, Redhills, Chennai – 600052
            <br />
            Tamil Nadu, India
          </p>

          <div className="mt-3 space-y-1">
            <p>
              📧{" "}
              <a href="mailto:info@rotehuegels.com" className="hover:underline">
                info@rotehuegels.com
              </a>
            </p>
            <p>
              📧{" "}
              <a href="mailto:sales@rotehuegels.com" className="hover:underline">
                sales@rotehuegels.com
              </a>{" "}
              (RFPs / Proposals)
            </p>
            <p>
              📱{" "}
              <a href="tel:+919004491275" className="hover:underline">
                +91&nbsp;90044&nbsp;91275
              </a>
            </p>
            <p>
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
        </div>

        {/* International Sales */}
        <div className="card h-full text-center md:text-left">
          <h3 className="text-lg font-semibold">International Sales &amp; Marketing</h3>
          <p className="mt-2 opacity-90">
            <strong>Ms. Vaishnavi Elumalai</strong>
            <br />
            Sales &amp; Marketing (Technical)
            <br />
            Americas, Europe &amp; Africa
          </p>

          <div className="mt-3 space-y-1">
            <p>
              📧{" "}
              <a href="mailto:vaishnavi@rotehuegels.com" className="hover:underline">
                vaishnavi@rotehuegels.com
              </a>
            </p>
            <p>
              📱{" "}
              <a href="tel:+18477787595" className="hover:underline">
                +1&nbsp;847&nbsp;778&nbsp;7595
              </a>
            </p>
            <p>
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

      {/* Territory Allocation (aligned to same width as cards) */}
      <section className="mx-auto mt-8 max-w-6xl">
        <div className="card text-center md:text-left">
          <h3 className="text-lg font-semibold">Territory Allocation</h3>
          <ul className="mt-2 space-y-2 text-sm opacity-90">
            <li>
              • <strong>Ms. Vaishnavi Elumalai</strong> —{" "}
              <em>Americas (USA, Canada, South America), Europe, and Africa</em>
            </li>
            <li>
              • <strong>Mr. Sivakumar Shanmugam</strong> (Director &amp; CEO, Rotehügels) —{" "}
              <em>Asia-Pacific, Middle East, India, and Oceania</em>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
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