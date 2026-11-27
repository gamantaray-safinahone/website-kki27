import { Ship } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="text-sage-dingin flex w-full flex-1 flex-col items-center justify-center gap-14 p-6 font-mono">
      <div className="flex flex-col items-center gap-8 sm:flex-row sm:gap-10">
        <Ship
          aria-hidden
          strokeWidth={1.5}
          className="text-sage-dingin/80 size-20 motion-safe:animate-[float_3s_ease-in-out_infinite]"
        />
        <div className="flex items-center gap-8">
          <h1 className="border-sage-dingin/30 text-kapur-muda border-r-2 pr-8 text-6xl font-medium tracking-tight">
            404
          </h1>
          <p className="text-2xl">Page not found.</p>
        </div>
      </div>
      <Link
        href="/"
        className="hover:text-lime-neon text-lg underline underline-offset-8 transition-colors"
      >
        Back to the live dashboard
      </Link>
    </main>
  );
}
