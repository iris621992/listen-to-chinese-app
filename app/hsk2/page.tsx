import { HskPage } from "@/components/HskPage";

type Props = {
  searchParams: Promise<{ cursor?: string; lang?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  return <HskPage level={2} cursor={query.cursor} locale={query.lang} />;
}
