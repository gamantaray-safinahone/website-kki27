import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin sign in - Safinah One",
  robots: { index: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="border-border bg-surface-strong w-full max-w-sm border p-6">
        <h1 className="text-kapur-muda mb-1 text-xl font-bold">Admin</h1>
        <p className="text-sage-dingin mb-6 text-sm">
          Sign in to manage runs, photos, and courses.
        </p>
        <LoginForm />
        <Link
          href="/"
          className="text-sage-dingin hover:text-lime-neon mt-6 block text-center text-sm"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
