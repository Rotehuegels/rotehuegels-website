// components/Footer.tsx
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
            href="mailto:sivakumar@rotehuegels.com"
            className="hover:underline"
          >
            sivakumar@rotehuegels.com
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
        <p className="text-xs text-zinc-500 mt-2">
          © 2025 Rotehügels. All rights reserved.
        </p>
      </div>
    </footer>
  )
}