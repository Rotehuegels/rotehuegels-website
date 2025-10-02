// components/Footer.tsx
import { Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="text-sm text-zinc-400 border-t border-zinc-800 mt-12">
      <div className="container mx-auto py-6 text-center space-y-2 px-4">
        <p className="font-semibold text-white">
          Rotehügel Research Business Consultancy Private Limited
        </p>
        <p>
          Registered Office: No. 1/584, 7th Street, Jothi Nagar, Padianallur,
          Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India
        </p>
        <p>
          <a
            href="mailto:info@rotehuegels.com"
            className="hover:underline"
          >
            info@rotehuegels.com
          </a>{" "}
          · +91-90044-91275 ·{" "}
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
        <div className="flex justify-center gap-6 mt-3 text-zinc-300">
          <a
            href="https://www.linkedin.com/company/rotehuegels"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-white"
          >
            <Linkedin className="h-4 w-4 text-rose-400" />
            <span>Rotehügels (Company)</span>
          </a>
          <a
            href="https://www.linkedin.com/in/sivakumarshanmugam/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-white"
          >
            <Linkedin className="h-4 w-4 text-rose-400" />
            <span>Sivakumar Shanmugam (Founder & CEO)</span>
          </a>
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          © 2025 Rotehügels. All rights reserved.
        </p>
      </div>
    </footer>
  )
}