// components/Footer.tsx
import { Linkedin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800/70 bg-zinc-900/40 backdrop-blur text-sm text-zinc-400 mt-12">
      <div className="container mx-auto px-6 py-10 space-y-6 text-center sm:text-left">
        {/* Company Info */}
        <div>
          <p className="font-semibold text-white">
            Rotehügel Research Business Consultancy Private Limited
          </p>
          <p className="mt-1">
            Registered Office: No. 1/584, 7th Street, Jothi Nagar, Padianallur,
            Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India
          </p>
        </div>

        {/* Contact + Links */}
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <a
              href="mailto:info@rotehuegels.com"
              className="flex items-center gap-2 hover:text-zinc-200"
            >
              <Mail className="h-4 w-4 text-rose-400" />
              info@rotehuegels.com
            </a>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-rose-400" />
              +91-90044-91275
            </span>
            <a
              href="https://www.rotehuegels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-200"
            >
              www.rotehuegels.com
            </a>
          </div>

          <div className="flex gap-6">
            <a
              href="https://www.linkedin.com/company/rotehuegels"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-200"
            >
              <Linkedin className="h-4 w-4 text-rose-400" />
              Company LinkedIn
            </a>
            <a
              href="https://www.linkedin.com/in/sivakumarshanmugam/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-zinc-200"
            >
              <Linkedin className="h-4 w-4 text-rose-400" />
              Sivakumar Shanmugam
            </a>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-xs text-zinc-500 text-center sm:text-left border-t border-zinc-800 pt-4">
          © {new Date().getFullYear()} Rotehügels. All rights reserved. • Built with Next.js & Supabase • Deployed on Vercel
        </p>
      </div>
    </footer>
  );
}