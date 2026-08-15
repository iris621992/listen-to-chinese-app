export default function MembershipPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="rounded-[2rem] bg-paper p-6 text-center shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cinnabar">Gentle support</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Membership for steady Mandarin listening practice</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-600">Use the free lessons whenever you like. If you want deeper review, membership will add more exercises and calm explanations. This is only a placeholder—no payment is connected yet.</p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] bg-paper p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold">Free</h2>
          <ul className="mt-5 space-y-3 text-stone-600">
            {['video', 'script', 'pinyin', 'translation', 'audio', '3 exercises'].map((item) => <li key={item}>✓ {item}</li>)}
          </ul>
        </div>
        <div className="rounded-[2rem] border-2 border-cinnabar bg-paper p-6 shadow-soft sm:p-8">
          <h2 className="text-2xl font-bold">Member</h2>
          <ul className="mt-5 space-y-3 text-stone-600">
            {['full exercises', 'answer explanations', 'review practice'].map((item) => <li key={item}>✓ {item}</li>)}
          </ul>
          <button className="mt-8 rounded-full bg-cinnabar px-6 py-3 font-semibold text-white">Membership CTA placeholder</button>
        </div>
      </section>
    </main>
  );
}
