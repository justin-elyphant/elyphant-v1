import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/twins-wraps-hero.jpg";

const oswald = { fontFamily: "'Oswald', system-ui, sans-serif" };

const HandwrapsLP: React.FC = () => {
  useEffect(() => {
    // TODO: fire Meta/TikTok pixel "ViewContent" here
  }, []);

  const handleCTA = () => {
    // TODO: route to dedicated checkout for the free+shipping SKU
    window.location.href = "/checkout?lp=twins-handwraps-red";
  };

  return (
    <>
      <Helmet>
        <title>Free Twins Special Muay Thai Handwraps — Just Pay Shipping</title>
        <meta
          name="description"
          content="Pro-grade Twins Special red Muay Thai handwraps shipped free. You cover $6.99 shipping. Limited supply, 1 set per customer."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      <div className="min-h-screen bg-zinc-950 flex items-start justify-center text-zinc-100">
        <div className="max-w-[480px] w-full bg-zinc-950 relative shadow-2xl overflow-hidden border-x border-zinc-900 pb-28">

          {/* Logo Header — no Elyphant chrome */}
          <header className="py-7 flex justify-center border-b border-zinc-900">
            <div
              className="text-3xl font-bold tracking-tighter text-white uppercase"
              style={oswald}
            >
              Twins<span className="text-red-600">Special</span>
            </div>
          </header>

          {/* Hero */}
          <section className="relative px-6 pt-10 pb-14">
            <div className="absolute top-6 right-6 z-10">
              <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-[0.2em] rotate-6 inline-block shadow-xl">
                Free + Shipping
              </span>
            </div>

            <h1
              className="text-6xl font-bold uppercase leading-[0.85] tracking-tighter mb-6 italic"
              style={oswald}
            >
              Claim Your <br />
              <span className="text-red-600">Warrior</span> Wraps
            </h1>

            <p
              className="text-zinc-400 text-sm mb-10 max-w-[280px] uppercase font-bold tracking-tight leading-tight"
              style={oswald}
            >
              The gold standard of Lumpinee Stadium. Yours for $0.00 today.
            </p>

            <div className="relative mb-10">
              <div className="absolute -inset-4 bg-red-600/20 blur-3xl rounded-full" aria-hidden />
              <img
                src={heroImage}
                alt="Twins Special red Muay Thai handwraps on a dark gym floor"
                className="relative w-full aspect-square object-cover border-4 border-zinc-900"
                loading="eager"
              />
              <div
                className="absolute -bottom-3 -left-2 bg-red-600 text-white px-4 py-2 text-xl italic font-bold uppercase tracking-tight"
                style={oswald}
              >
                Authentic Thai Cotton
              </div>
            </div>

            <button
              onClick={handleCTA}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-2xl py-5 uppercase tracking-wider transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.08)] active:translate-x-1 active:translate-y-1 active:shadow-none min-h-[44px]"
              style={oswald}
            >
              Claim My Wraps — $6.99 Shipping
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest">
              <div className="h-px w-8 bg-zinc-800" />
              Limited supply · 1 set per customer
              <div className="h-px w-8 bg-zinc-800" />
            </div>
          </section>

          {/* Value props */}
          <section className="bg-zinc-900/50 px-6 py-14 border-y border-zinc-900">
            <div className="grid gap-10">
              {[
                {
                  n: "01",
                  t: "Bonesaver Support",
                  d: "High-grade semi-elastic cotton keeps your metacarpals locked tight during heavy bag work.",
                },
                {
                  n: "02",
                  t: "The Pro's Choice",
                  d: "Traditional Thai open-mesh weave keeps wraps cool and dry through 100° rounds.",
                },
                {
                  n: "03",
                  t: "180\" Full Length",
                  d: "Professional 5-meter length — full wrist and knuckle protection, every time.",
                },
              ].map((v) => (
                <div key={v.n} className="flex gap-5">
                  <div
                    className="text-red-600 text-4xl font-bold opacity-60"
                    style={oswald}
                  >
                    {v.n}
                  </div>
                  <div>
                    <h3
                      className="text-xl uppercase font-bold tracking-tight text-white mb-1"
                      style={oswald}
                    >
                      {v.t}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-snug">{v.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Social proof */}
          <section className="px-6 py-14 text-center">
            <div className="mb-4 flex justify-center gap-1 text-red-600 text-lg">
              ★★★★★
            </div>
            <p
              className="italic text-xl text-zinc-100 uppercase tracking-tight leading-tight mb-4"
              style={oswald}
            >
              "The only wraps I trust for high-volume striking. They never lose tension or bunch up."
            </p>
            <p
              className="uppercase text-xs tracking-widest text-zinc-500"
              style={oswald}
            >
              — Verified Customer · Brooklyn, NY
            </p>
          </section>

          {/* Founder note */}
          <section className="px-6 py-14 bg-zinc-100 text-zinc-950">
            <h2
              className="text-5xl font-bold uppercase mb-6 leading-[0.85] italic tracking-tighter"
              style={oswald}
            >
              Tested in <br />
              The Heat.
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium">
              We're new. We'd rather earn your first order than buy another ad.
              These red Twins wraps are what we train in — pro-grade, the real
              thing, no rebrand junk. Try a pair on us. If you love them, you'll
              know where to come back for gloves.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-px bg-zinc-950" />
              <p
                className="font-bold text-lg uppercase tracking-tight italic"
                style={oswald}
              >
                The Elyphant Team
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-14 border-t border-zinc-900">
            <h2
              className="text-3xl uppercase mb-8 italic tracking-tighter"
              style={oswald}
            >
              Fight Intel
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "Is it really free?",
                  a: "Yes. The wraps are on us. You only cover $6.99 flat-rate shipping.",
                },
                {
                  q: "How long are they?",
                  a: "Full 5-meter (180\") length — pro standard for wrist and knuckle protection.",
                },
                {
                  q: "When will they arrive?",
                  a: "Ships within 2 business days. Most US orders arrive in 5–7 days.",
                },
                {
                  q: "What's the catch?",
                  a: "None. Limit 1 set per customer while supplies last.",
                },
              ].map((f) => (
                <div key={f.q} className="border-b border-zinc-900 pb-6">
                  <p
                    className="font-bold text-sm uppercase mb-2 text-white"
                    style={oswald}
                  >
                    {f.q}
                  </p>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sticky mobile CTA */}
          <div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 max-w-[480px] w-full p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 z-50"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <button
              onClick={handleCTA}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-4 uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-transform min-h-[44px]"
              style={oswald}
            >
              Claim My Wraps — $6.99
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HandwrapsLP;
