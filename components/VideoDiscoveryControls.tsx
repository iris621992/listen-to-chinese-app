"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const COPY = {
  en: {
    searchLabel: "Search videos",
    searchPlaceholder: "Search Chinese or English titles",
    searchAction: "Search",
    durationLabel: "Duration",
    durationAny: "Any duration",
    under5: "Under 5 min",
    fiveToTen: "5–10 min",
    tenToTwenty: "10–20 min",
    twentyPlus: "20+ min",
    sortLabel: "Sort",
    newest: "Newest",
    oldest: "Oldest",
  },
  vi: {
    searchLabel: "Tìm video",
    searchPlaceholder: "Tìm tiêu đề tiếng Trung hoặc tiếng Anh",
    searchAction: "Tìm",
    durationLabel: "Thời lượng",
    durationAny: "Mọi thời lượng",
    under5: "Dưới 5 phút",
    fiveToTen: "5–10 phút",
    tenToTwenty: "10–20 phút",
    twentyPlus: "20+ phút",
    sortLabel: "Sắp xếp",
    newest: "Mới nhất",
    oldest: "Cũ nhất",
  },
} as const;

type Props = {
  interfaceLocaleCode: string;
  initialSearchQuery?: string;
  initialDuration?: string;
  initialSort?: string;
};

export function VideoDiscoveryControls({
  interfaceLocaleCode,
  initialSearchQuery = "",
  initialDuration = "any",
  initialSort = "newest",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const copy = interfaceLocaleCode === "vi" ? COPY.vi : COPY.en;
  const [searchValue, setSearchValue] = useState(initialSearchQuery);

  function pushDiscoveryParams(mutator: (params: URLSearchParams) => void) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("cursor");
    mutator(next);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushDiscoveryParams((next) => {
      const value = searchValue.trim();
      if (value) next.set("q", value);
      else next.delete("q");
    });
  }

  return (
    <section
      aria-label={copy.searchLabel}
      className="mt-6 rounded-3xl border border-orange-100 bg-paper p-4 shadow-soft sm:p-5"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-end">
        <form onSubmit={submitSearch} className="min-w-0">
          <label htmlFor="video-search" className="mb-2 block text-sm font-semibold text-stone-700">
            {copy.searchLabel}
          </label>
          <div className="flex min-w-0 gap-2">
            <input
              id="video-search"
              name="q"
              type="search"
              value={searchValue}
              maxLength={120}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="min-h-11 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-2xl bg-cinnabar px-5 font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
            >
              {copy.searchAction}
            </button>
          </div>
        </form>

        <label className="block min-w-44">
          <span className="mb-2 block text-sm font-semibold text-stone-700">{copy.durationLabel}</span>
          <select
            value={initialDuration}
            onChange={(event) => pushDiscoveryParams((next) => {
              const value = event.target.value;
              if (value === "any") next.delete("duration");
              else next.set("duration", value);
            })}
            className="min-h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            <option value="any">{copy.durationAny}</option>
            <option value="under5">{copy.under5}</option>
            <option value="5to10">{copy.fiveToTen}</option>
            <option value="10to20">{copy.tenToTwenty}</option>
            <option value="20plus">{copy.twentyPlus}</option>
          </select>
        </label>

        <label className="block min-w-40">
          <span className="mb-2 block text-sm font-semibold text-stone-700">{copy.sortLabel}</span>
          <select
            value={initialSort}
            onChange={(event) => pushDiscoveryParams((next) => {
              const value = event.target.value;
              if (value === "newest") next.delete("sort");
              else next.set("sort", value);
            })}
            className="min-h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-800 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
          >
            <option value="newest">{copy.newest}</option>
            <option value="oldest">{copy.oldest}</option>
          </select>
        </label>
      </div>
    </section>
  );
}
