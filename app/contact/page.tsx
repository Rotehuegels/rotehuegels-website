// app/contact/page.tsx
export const metadata = { title: "Contact Us — Rotehügels" };

export default function ContactPage() {
  return (
    <section className="container mt-10">
      <h1 className="text-center text-3xl font-bold">Contact Us</h1>

      {/* Centered Grid */}
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 mt-8 text-left">
        {/* Registered Office */}
        <div className="card text-center md:text-left">
          <h3 className="font-semibold text-lg">Registered Office (India HQ)</h3>
          <p className="mt-2 opacity-90">
            No. 1/584, 7th Street, Jothi Nagar, Padianallur,
            <br />
            Near Gangaiamman Kovil, Redhills, Chennai – 600052
            <br />
            Tamil Nadu, India
          </p>
          <p className="mt-3">
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

        {/* International Sales */}
        <div className="card text-center md:text-left">
          <h3 className="font-semibold text-lg">International Sales & Marketing</h3>
          <p className="mt-2 opacity-90">
            <strong>Ms. Vaishnavi Elumalai</strong>
            <br />
            Sales & Marketing (Technical)
            <br />
            Americas, Europe &amp; Africa
          </p>
          <p className="mt-3">
            📧{" "}
            <a
              href="mailto:vaishnavi@rotehuegels.com"
              className="hover:underline"
            >
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

      {/* Territory */}
      <div className="max-w-4xl mx-auto mt-10 card text-center md:text-left">
        <h3 className="font-semibold text-lg">Territory Allocation</h3>
        <p className="mt-2 opacity-90">
          • <strong>Ms. Vaishnavi Elumalai</strong> (Independent Contractor – Sales & Marketing, Technical):{" "}
          <em>Americas (USA, Canada, South America), Europe, and Africa</em>.
        </p>
        <p className="mt-2 opacity-90">
          • <strong>Mr. Sivakumar Shanmugam</strong> (Director & CEO, Rotehügels):{" "}
          <em>Asia-Pacific, Middle East, India, and Oceania</em>.
        </p>
      </div>
    </section>
  );
}