import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 text-white flex flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <Image
          src="/logo.png" // Replace with your logo file in public/
          alt="Logo"
          width={120}
          height={120}
          className="mb-6"
        />
        <h1 className="text-5xl font-extrabold drop-shadow-lg">
          Smart Finance Manager
        </h1>
        <p className="mt-4 text-lg max-w-xl text-white/90">
          Scan receipts, track expenses, and manage your finances — all in one
          place.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          <Link
            href="/receipt"
            className="bg-white text-purple-700 px-6 py-3 rounded-full font-semibold hover:bg-purple-100 transition"
          >
            Scan Receipt
          </Link>
          <Link
            href="/financeTracker"
            className="bg-purple-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-800 transition"
          >
            View Finances
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/20 py-4 text-center text-sm">
        © {new Date().getFullYear()} Smart Finance Manager. All rights reserved.
      </footer>
    </main>
  );
}
