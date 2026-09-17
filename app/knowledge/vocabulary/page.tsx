import { redirect } from "next/navigation";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function VocabularySearchCompatibilityRedirect({ searchParams }: Props) {
  const query = await searchParams;
  const params = new URLSearchParams();

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else if (value) {
      params.set(key, value);
    }
  });

  const serialized = params.toString();
  redirect(serialized ? `/knowledge?${serialized}` : "/knowledge");
}
