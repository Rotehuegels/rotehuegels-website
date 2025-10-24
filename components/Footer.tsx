import { Linkedin, Globe, Mail, MapPin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-white/10 bg-black/60 backdrop-blur text-sm text-zinc-300">
      <div className="container mx-auto px-6 py-10 grid gap-10 md:grid-cols-3">
        {/* 1. Company Summary */}
        <div>
          <p className="font-semibold text-white text-base">
            Rotehuegel Research Business Consultancy Private Limited
          </p>
          <p className="italic text-rose-300 text-sm">
            “Where Research Meets Business Excellence”
          </p>
          <p className="mt-3 flex items-start gap-2 leading-relaxed opacity-90">
            <MapPin className="h-4 w-4 mt-0.5 text-rose-400" />
            <span>
              <a
                href="https://maps.app.goo.gl/6ubSNGzomScS4gaV7"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                No. 1/584, 7th Street, Jothi Nagar, Padianallur,<br />
                Near Gangaiamman Kovil, Redhills, Chennai – 600052,<br />
                Tamil Nadu, India
              </a>
            </span>
          </p>
        </div>

        {/* 2. Quick Links */}
        <div>
          <p className="font-semibold text-white text-base mb-2">Quick Links</p>
          <ul className="space-y-1">
            <li><a href="/about" className="hover:underline">About Us</a></li>
            <li><a href="/services" className="hover:underline">Services</a></li>
            <li><a href="/careers" className="hover:underline">Careers</a></li>
            <li><a href="/contact" className="hover:underline">Contact</a></li>
            <li><a href="/rotehuegels-story" className="hover:underline">The Rotehügels Story</a></li>
          </ul>
        </div>

        {/* 3. Connect */}
        <div>
          <p className="font-semibold text-white text-base mb-2">Connect With Us</p>
          <ul className="space-y-1">
            <li>
              <Mail className="inline h-4 w-4 mr-1 text-rose-400" />
              <a href="mailto:info@rotehuegels.com" className="hover:underline">
                info@rotehuegels.com
              </a>
              <span className="text-zinc-500"> · General Communications</span>
            </li>
            <li>
              <Mail className="inline h-4 w-4 mr-1 text-rose-400" />
              <a href="mailto:sales@rotehuegels.com" className="hover:underline">
                sales@rotehuegels.com
              </a>
              <span className="text-zinc-500"> · RFPs / Sales Inquiries</span>
            </li>
            <li>
              <Mail className="inline h-4 w-4 mr-1 text-rose-400" />
              <a href="mailto:ir@rotehuegels.com" className="hover:underline">
                ir@rotehuegels.com
              </a>
              <span className="text-zinc-500"> · Investor Relations</span>
            </li>
            <li>
              <Globe className="inline h-4 w-4 mr-1 text-rose-400" />
              <a
                href="https://www.rotehuegels.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                www.rotehuegels.com
              </a>
            </li>
          </ul>

          <div className="mt-3 flex gap-4 text-zinc-300">
            <a
              href="https://www.linkedin.com/company/rotehuegels"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Rotehuegels (Company) on LinkedIn"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <Linkedin className="h-4 w-4 text-rose-400" />
              <span>Company</span>
            </a>
            <a
              href="https://www.linkedin.com/in/sivakumarshanmugam/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Sivakumar Shanmugam on LinkedIn"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <Linkedin className="h-4 w-4 text-rose-400" />
              <span>Founder &amp; CEO</span>
            </a>
          </div>
        </div>
      </div>

      {/* Google Business / Organization JSON-LD */}
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
            "founder": {
              "@type": "Person",
              "name": "Sivakumar Shanmugam",
              "jobTitle": "Founder & CEO",
              "sameAs": "https://www.linkedin.com/in/sivakumarshanmugam/"
            },
            "foundingDate": "2025-09-17",
            "sameAs": [
              "https://www.linkedin.com/company/rotehuegels",
              "https://www.linkedin.com/in/sivakumarshanmugam/"
            ],
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "No. 1/584, 7th Street, Jothi Nagar, Padianallur, Near Gangaiamman Kovil, Redhills",
              "addressLocality": "Chennai",
              "addressRegion": "Tamil Nadu",
              "postalCode": "600052",
              "addressCountry": "IN"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 13.1709652,
              "longitude": 80.1783202
            },
            "hasMap": "https://maps.app.goo.gl/6ubSNGzomScS4gaV7",
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "contactType": "General Communications",
                "email": "info@rotehuegels.com",
                "areaServed": "Worldwide",
                "availableLanguage": ["en"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "RFPs / Sales Inquiries",
                "email": "sales@rotehuegels.com",
                "areaServed": "Worldwide",
                "availableLanguage": ["en"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "Investor Relations",
                "email": "ir@rotehuegels.com",
                "areaServed": "Worldwide",
                "availableLanguage": ["en"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "Customer service",
                "areaServed": "APAC",
                "telephone": "+91-8939120320",
                "availableLanguage": ["en"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "Customer service",
                "areaServed": "EMEA",
                "telephone": "+260-773540064",
                "availableLanguage": ["en"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "Customer service",
                "areaServed": "Americas",
                "telephone": "+1-847-778-7595",
                "availableLanguage": ["en"]
              }
            ]
          })
        }}
      />

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-500">
        © {year} Rotehuegels. All rights reserved. ·{" "}
        <a href="/contact" className="text-rose-300 hover:underline">
          View Global Contact Details
        </a>
      </div>
    </footer>
  );
}