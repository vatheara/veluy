import React from 'react'
import './fonts/font.css'
import Link from 'next/link'
const LandingPage = () => {
  return (
    <main className="min-h-screen bg-[#f3f4f6] text-gray-800">
    {/* Hero Section */}
    <section className="flex flex-col items-center justify-center text-center py-20 px-6 bg-white text-black">
      <h1 className="text-4xl md:text-6xl font-bold mb-4">Veluy - <span className='font-km'>វេលុយ</span></h1>
      <p className="text-lg md:text-2xl max-w-2xl">
        An open-source toolkit to build fast, flexible, and accessible web apps.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/documents/getting_start"
          className="bg-black text-white font-semibold px-6 py-3 rounded-xl shadow transition"
        >
          Get Started
        </Link>
        <Link
          href="https://github.com/vatheara/veluy"
          rel='noreferrer'
          target="_blank"
          className="bg-white text-black font-semibold px-6 py-3 rounded-xl shadow transition"
        >
          GitHub
        </Link>
      </div>
    </section>

    {/* Features Section */}
    <section className="py-20 px-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">Why Veluy?</h2>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-2">⚡ Fast & Lightweight</h3>
          <p>Built for performance with minimal overhead and fast rendering times.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-2">🧩 Modular Design</h3>
          <p>Use only what you need — Veluy is fully modular and tree-shakable.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-2">🌍 Open & Community-Driven</h3>
          <p>MIT-licensed and open for contribution by developers around the world.</p>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="text-center py-20 bg-white text-black">
      <h2 className="text-3xl font-bold mb-4">Ready to build with Veluy?</h2>
      <p className="mb-8">Check out our docs and start contributing today.</p>
      <Link
        href="/documents"
        className="bg-black text-white font-semibold px-8 py-3 rounded-xl"
      >
        Read the Docs
      </Link>
    </section>
  </main>
  )
}

export default LandingPage