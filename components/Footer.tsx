import { Linkedin, Globe, Mail } from "lucide-react";

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
          <p className="mt-2 max-w-xs opacity-90">
            A global research-driven engineering and consulting company
            specializing in critical minerals, EPC solutions, and
            sustainable process innovations.
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
            </li>
            <li>
              <Mail className="inline h-4 w-4 mr-1 text-rose-400" />
              <a href="mailto:sales@rotehuegels.com" className="hover:underline">
                sales@rotehuegels.com
              </a>
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