import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/twins-wraps-hero.jpg";

const oswald = { fontFamily: "'Oswald', system-ui, sans-serif" };

const HandwrapsLP: React.FC = () => {
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [fighterName, setFighterName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // TODO: fire Meta/TikTok pixel "ViewContent" here
  }, []);

  const scrollToClaim = () => {
    document.getElementById("claim")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !birthday) return;
    setSubmitting(true);
    // TODO: persist lead (email, birthday, fighterName) to Elyphant + route to checkout
    const params = new URLSearchParams({
      lp: "twins-handwraps-red",
      email,
      dob: birthday,
      gift_for: fighterName,
    });
    window.location.href = `/checkout?${params.toString()}`;
  };

  return (
    <>
      <Helmet>
        <title>The Perfect Gift for the MMA Fighter in Your Life | Elyphant</title>
        <meta
          name="description"
          content="Join Elyphant and send pro-grade Twins Special Muay Thai handwraps free — just cover shipping. The smarter way to gift the fighter in your life."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      <div className="min-h-screen bg-zinc-950 flex items-start justify-center text-zinc-100">
        <div className="max-w-[480px] w-full bg-zinc-950 relative shadow-2xl overflow-hidden border-x border-zinc-900 pb-28">

          {/* Logo Header */}
          <header className="py-7 flex flex-col items-center gap-1 border-b border-zinc-900">
            <div
              className="text-3xl font-bold tracking-tighter text-white uppercase"
              style={oswald}
            >
              Elyphant
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-zinc-500" style={oswald}>
              Gifting, Handled.
            </div>
          </header>

          {/* Hero */}
          <section className="relative px-6 pt-10 pb-14">
            <div className="flex justify-end mb-4 sm:mb-0 sm:absolute sm:top-6 sm:right-6 sm:z-10">
              <span className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-[0.2em] sm:rotate-6 inline-block shadow-xl">
                FREE + $6.99 SHIPPING
              </span>
            </div>

            <p
              className="text-red-600 text-xs uppercase tracking-[0.3em] mb-4 font-bold"
              style={oswald}
            >
              For the fighter in your life
            </p>

            <h1
              className="text-5xl font-bold uppercase leading-[0.85] tracking-tighter mb-6 italic"
              style={oswald}
            >
              The Perfect Gift <br />
              For Those Who Train <span className="text-red-600">Like A Fighter</span>
            </h1>

            <p
              className="text-zinc-300 text-base mb-10 leading-snug"
            >
              Sign up for Elyphant today and we'll send them pro-grade Twins Special handwraps — <span className="text-white font-semibold">on us.</span> Just cover $6.99 shipping.
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
              onClick={scrollToClaim}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-2xl py-5 uppercase tracking-wider transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.08)] active:translate-x-1 active:translate-y-1 active:shadow-none min-h-[44px]"
              style={oswald}
            >
              Send The Gift — $6.99
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest">
              <div className="h-px w-8 bg-zinc-800" />
              Limited supply · 1 set per customer
              <div className="h-px w-8 bg-zinc-800" />
            </div>
          </section>

          {/* What is Elyphant */}
          <section className="bg-zinc-100 text-zinc-950 px-6 py-14">
            <p className="text-red-600 text-xs uppercase tracking-[0.3em] mb-3 font-bold" style={oswald}>
              What is Elyphant?
            </p>
            <h2
              className="text-4xl font-bold uppercase mb-5 leading-[0.9] italic tracking-tighter"
              style={oswald}
            >
              Never forget a gift again.
            </h2>
            <p className="text-sm leading-relaxed mb-6 font-medium">
              Elyphant remembers every birthday, anniversary, and big moment for the people you love — then sends the perfect gift automatically. No more last-minute scrambles. No more generic gift cards.
            </p>
            <ul className="space-y-3 text-sm font-medium">
              {[
                "Auto-gifting for birthdays & milestones",
                "AI picks gifts they'll actually love",
                "You approve before anything ships",
              ].map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="text-red-600 font-bold" style={oswald}>→</span>
                  {b}
                </li>
              ))}
            </ul>
          </section>

          {/* Why these wraps */}
          <section className="bg-zinc-900/50 px-6 py-14 border-y border-zinc-900">
            <p className="text-red-600 text-xs uppercase tracking-[0.3em] mb-3 font-bold" style={oswald}>
              About the gift
            </p>
            <h2 className="text-3xl uppercase mb-8 italic tracking-tighter" style={oswald}>
              Why Twins Special
            </h2>
            <div className="grid gap-10">
              {[
                {
                  n: "01",
                  t: "Bonesaver Support",
                  d: "High-grade semi-elastic cotton keeps their metacarpals locked tight during heavy bag work.",
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
                  <div className="text-red-600 text-4xl font-bold opacity-60" style={oswald}>
                    {v.n}
                  </div>
                  <div>
                    <h3 className="text-xl uppercase font-bold tracking-tight text-white mb-1" style={oswald}>
                      {v.t}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-snug">{v.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Claim form */}
          <section id="claim" className="px-6 py-14 border-t border-zinc-900">
            <p className="text-red-600 text-xs uppercase tracking-[0.3em] mb-3 font-bold" style={oswald}>
              Step 1 of 2
            </p>
            <h2 className="text-4xl uppercase mb-3 italic tracking-tighter leading-[0.9]" style={oswald}>
              Claim Their <br />Wraps
            </h2>
            <p className="text-zinc-400 text-sm mb-8">
              Create your free Elyphant account. We'll ship the wraps to your fighter and remember every gift moment from here on out.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-2" style={oswald}>
                  Your email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-lg text-white placeholder:text-white focus:border-red-600 focus:outline-none min-h-[52px]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-2" style={oswald}>
                  Your birthday
                </label>
                <input
                  type="date"
                  required
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-lg text-white placeholder:text-white focus:border-red-600 focus:outline-none min-h-[52px]"
                />
                <p className="text-[11px] text-zinc-600 mt-1">So your people can gift you back.</p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-widest text-zinc-500 mb-2" style={oswald}>
                  Who's the fighter? <span className="text-zinc-700 normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={fighterName}
                  onChange={(e) => setFighterName(e.target.value)}
                  placeholder="First name"
                  className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-lg text-white placeholder:text-white focus:border-red-600 focus:outline-none min-h-[52px]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xl py-5 uppercase tracking-wider transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.08)] active:translate-x-1 active:translate-y-1 active:shadow-none min-h-[44px]"
                style={oswald}
              >
                Continue — $6.99 Shipping
              </button>
              <p className="text-[11px] text-zinc-600 text-center">
                By continuing you agree to Elyphant's Terms & Privacy.
              </p>
            </form>
          </section>

          {/* Social proof */}
          <section className="px-6 py-14 text-center border-t border-zinc-900">
            <div className="mb-4 flex justify-center gap-1 text-red-600 text-lg">★★★★★</div>
            <p className="italic text-xl text-zinc-100 uppercase tracking-tight leading-tight mb-4" style={oswald}>
              "Got these for my brother's birthday through Elyphant. He texted me from the gym the next week."
            </p>
            <p className="uppercase text-xs tracking-widest text-zinc-500" style={oswald}>
              — Verified Customer · Brooklyn, NY
            </p>
          </section>

          {/* Founder note */}
          <section className="px-6 py-14 bg-zinc-100 text-zinc-950">
            <h2 className="text-5xl font-bold uppercase mb-6 leading-[0.85] italic tracking-tighter" style={oswald}>
              From the <br />Elyphant team.
            </h2>
            <p className="text-sm mb-6 leading-relaxed font-medium">
              We built Elyphant because gifting the people we love shouldn't be a chore. Start with a real gift — pro-grade Twins wraps for your fighter — and let us handle every moment that comes next.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-px bg-zinc-950" />
              <p className="font-bold text-lg uppercase tracking-tight italic" style={oswald}>
                The Elyphant Team
              </p>
            </div>
          </section>

          {/* FAQ */}
          <section className="px-6 py-14 border-t border-zinc-900">
            <h2 className="text-3xl uppercase mb-8 italic tracking-tighter" style={oswald}>
              Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "Is the gift really free?",
                  a: "Yes. The wraps are on us. You only cover $6.99 flat-rate shipping.",
                },
                {
                  q: "Why do you need my birthday?",
                  a: "Elyphant works both ways — your connections can auto-gift you on your big day too.",
                },
                {
                  q: "Do I have to use Elyphant after this?",
                  a: "Nope. Cancel anytime. But once you see how easy gifting becomes, you probably won't want to.",
                },
                {
                  q: "When will the wraps arrive?",
                  a: "Ships within 2 business days. Most US orders arrive in 5–7 days.",
                },
              ].map((f) => (
                <div key={f.q} className="border-b border-zinc-900 pb-6">
                  <p className="font-bold text-sm uppercase mb-2 text-white" style={oswald}>
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
              onClick={scrollToClaim}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xl py-4 uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-transform min-h-[44px]"
              style={oswald}
            >
              Send The Gift — $6.99
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HandwrapsLP;
