import CharacterPreview from "./CharacterPreview";
export default async function Page({searchParams}:{searchParams:Promise<{uiLang?:string}>}) {
  const q=await searchParams;
  const locale=q.uiLang==="en"?"en":"vi";
  return <CharacterPreview locale={locale}/>;
}
