import { Activity, Boxes, ShieldCheck } from "lucide-react";

const foundationItems = [
  {
    label: "App Router",
    detail: "Next.js shell",
    icon: Boxes,
  },
  {
    label: "Runtime checks",
    detail: "Health and readiness",
    icon: Activity,
  },
  {
    label: "Portable base",
    detail: "PostgreSQL and Docker",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.16),_transparent_36%),linear-gradient(180deg,_#fffaf0_0%,_#f5f2ea_100%)]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between text-sm">
          <span className="font-semibold text-teal-900">Pobal</span>
          <span className="rounded-full border border-stone-300 bg-white/70 px-3 py-1 text-stone-700">
            Foundation
          </span>
        </header>

        <div className="grid flex-1 content-center gap-8 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-5">
            <p className="text-sm font-medium uppercase text-orange-700">
              Initial scaffold
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-tight text-stone-950 sm:text-6xl">
              Pobal
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-700">
              The mobile-web-first foundation is ready for the next build stage.
            </p>
          </div>

          <div className="grid gap-3">
            {foundationItems.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="flex items-center gap-4 rounded-lg border border-stone-300 bg-white/80 p-4 shadow-sm"
                  key={item.label}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-teal-800 text-white">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-stone-950">
                      {item.label}
                    </span>
                    <span className="block text-sm text-stone-600">
                      {item.detail}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
