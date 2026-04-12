import { Linkedin, Globe, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-black/60 backdrop-blur text-xs text-zinc-400">
      <div className="container mx-auto px-6 py-6 grid gap-6 md:grid-cols-4">

        {/* 1. Company */}
        <div>
          <p className="font-semibold text-white text-sm">Rotehügels</p>
          <p className="italic text-rose-300/80 text-[11px] mt-0.5">"Where Research Meets Business Excellence"</p>
          <p className="mt-2 flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
            <a href="https://maps.app.goo.gl/6ubSNGzomScS4gaV7" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Chennai, India
            </a>
          </p>
        </div>

        {/* 2. Quick Links */}
        <div>
          <p className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Company</p>
          <ul className="space-y-0.5">
            <li><a href="/about" className="hover:underline hover:text-white">About Us</a></li>
            <li><a href="/services" className="hover:underline hover:text-white">Services</a></li>
            <li><a href="/careers" className="hover:underline hover:text-white">Careers</a></li>
            <li><a href="/contact" className="hover:underline hover:text-white">Contact</a></li>
          </ul>
        </div>

        {/* 3. Register */}
        <div>
          <p className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Register</p>
          <ul className="space-y-0.5">
            <li><a href="/customers/register" className="hover:underline text-rose-300 hover:text-rose-200">Customer Registration</a></li>
            <li><a href="/suppliers/register" className="hover:underline hover:text-white">Supplier Registration</a></li>
            <li><a href="/rex" className="hover:underline hover:text-white">REX Network</a></li>
          </ul>
        </div>

        {/* 4. Connect */}
        <div>
          <p className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Connect</p>
          <ul className="space-y-0.5">
            <li><a href="mailto:sales@rotehuegels.com" className="hover:underline hover:text-white">sales@rotehuegels.com</a></li>
            <li><a href="mailto:info@rotehuegels.com" className="hover:underline hover:text-white">info@rotehuegels.com</a></li>
            <li><a href="https://www.rotehuegels.com" className="hover:underline hover:text-white">www.rotehuegels.com</a></li>
          </ul>
          <div className="mt-2 flex gap-3">
            <a href="https://www.linkedin.com/company/rotehuegels" target="_blank" rel="noopener noreferrer" aria-label="Company LinkedIn" className="hover:text-white">
              <Linkedin className="h-3.5 w-3.5" />
            </a>
            <a href="https://www.linkedin.com/in/sivakumarshanmugam/" target="_blank" rel="noopener noreferrer" aria-label="Founder LinkedIn" className="hover:text-white">
              <Linkedin className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* JSON-LD (hidden, SEO only) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://www.rotehuegels.com/#organization",
            "name": "Rotehuegel Research Business Consultancy Private Limited",
            "url": "https://www.rotehuegels.com",
            "logo": "https://www.rotehuegels.com/favicon.ico",
            "tagline": "Where Research Meets Business Excellence",
            "founder": { "@type": "Person", "name": "Sivakumar Shanmugam", "jobTitle": "Founder & CEO", "sameAs": "https://www.linkedin.com/in/sivakumarshanmugam/" },
            "foundingDate": "2024-09-01",
            "sameAs": ["https://www.linkedin.com/company/rotehuegels", "https://www.linkedin.com/in/sivakumarshanmugam/"],
            "address": { "@type": "PostalAddress", "addressLocality": "Chennai", "addressRegion": "Tamil Nadu", "postalCode": "600052", "addressCountry": "IN" },
            "contactPoint": [
              { "@type": "ContactPoint", "email": "sales@rotehuegels.com", "contactType": "sales", "areaServed": "Worldwide" },
              { "@type": "ContactPoint", "email": "info@rotehuegels.com", "contactType": "customer service", "areaServed": "Worldwide" },
            ]
          })
        }}
      />

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-3 text-center text-[11px] text-zinc-600">
        © {year} Rotehügels. All rights reserved.
      </div>
    </footer>
  );
}
