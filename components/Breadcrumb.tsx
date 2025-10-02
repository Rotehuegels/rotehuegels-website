import Link from "next/link";

export default function Breadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-400">
      <ol className="flex items-center space-x-2">
        <li>
          <Link href="/" className="hover:text-rose-400">
            Home
          </Link>
        </li>
        <li>/</li>
        <li className="text-neutral-200 font-medium">The Rotehügels Story</li>
      </ol>
    </nav>
  );
}