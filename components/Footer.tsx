// components/Footer.tsx
import { Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="text-sm text-zinc-400 border-t border-zinc-800 mt-12">
      <div className="container mx-auto py-6 text-center space-y-3 px-4">
        <p className="font-semibold text-white">
          Rotehügel Research Business Consultancy Private Limited
        </p>

        <p className="max-w-2xl mx-auto">
          Registered Office: No. 1/584, 7th Street, Jothi Nagar, Padianallur,
          Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India
        </p>

        <p>
          <a href="mailto:info@rotehuegels.com" className="hover:underline">
            info@rotehuegels.com
          </a>{" "}
          ·{" "}
          <a href="mailto:sales@rotehuegels.com" className="hover:underline">
          sales@rotehuegels.com
          </a>{" "}
          ·{" "}
          <a href="tel:+919004491275" className="hover:underline">
            +91&nbsp;90044&nbsp;91275
          </a>{" "}
          ·{" "}
          <a
            href="https://www.rotehuegels.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            www.rotehuegels.com
          </a>
        </p>

        {/* LinkedIn Links */}
        <div className="flex justify-center gap-6 mt-2 text-zinc-300">
          <a
            href="https://www.linkedin.com/company/rotehuegels"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Rotehügels (Company) on LinkedIn"
            className="inline-flex items-center gap-2 hover:text-white"
          >
            <Linkedin className="h-4 w-4 text-rose-400" />
            <span>Rotehügels (Company)</span>
          </a>
          <a
            href="https://www.linkedin.com/in/sivakumarshanmugam/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Sivakumar Shanmugam on LinkedIn"
            className="inline-flex items-center gap-2 hover:text-white"
          >
            <Linkedin className="h-4 w-4 text-rose-400" />
            <span>Sivakumar Shanmugam (Founder & CEO)</span>
          </a>
        </div>

        <p className="text-xs text-zinc-500">
          © 2025 Rotehügels. All rights reserved.
        </p>
      </div>
    </footer>
  );
}