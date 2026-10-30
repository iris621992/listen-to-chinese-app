"use client";

import Link from "next/link";
import type { InterfaceTextDirection } from "@/lib/interfaceLocaleRegistry";
import type { KnowledgeLanguage } from "@/lib/knowledgeLanguage";
import type { VocabularyCharacterOccurrence } from "@/lib/vocabularyCharacterDelivery";
import type {
  VocabularyDetail,
  VocabularyReadingItem,
} from "@/lib/vocabularyDetail";
import { vocabularySenseHeading } from "@/lib/vocabularySenseHeading";
import KnowledgeLanguageToggle from "./KnowledgeLanguageToggle";
import VocabularyCharacterRail from "./VocabularyCharacterRail";
import VocabularyPronunciationMeta from "./VocabularyPronunciationMeta";
import VocabularyRichSupport from "./VocabularyRichSupport";
import VocabularyStickyNav from "./VocabularyStickyNav";
import {
  knowledgeLanguageUserLabel,
  vocabularyDetailLabelsFor,
} from "./VocabularyDetailLabels";
import styles from "./VocabularyDetail.module.css";

type VocabularyNavItem = {
  label: string;
  href: string;
  mobileOnly?: boolean;
};

type PosGroup = {
  key: string;
  posCode: string;
  items: VocabularyReadingItem[];
};

const POS_LABELS: Record<string, Record<string, string>> = {
  noun: { en: "Noun", vi: "Danh từ", ar: "اسم" },
  verb: { en: "Verb", vi: "Động từ", ar: "فعل" },
  adjective: { en: "Adjective", vi: "Tính từ", ar: "صفة" },
  surname: { en: "Surname", vi: "Họ", ar: "اسم عائلة" },
  adverb: { en: "Adverb", vi: "Phó từ", ar: "حال" },
  pronoun: { en: "Pronoun", vi: "Đại từ", ar: "ضمير" },
  preposition: { en: "Preposition", vi: "Giới từ", ar: "حرف جر" },
  conjunction: { en: "Conjunction", vi: "Liên từ", ar: "أداة ربط" },
  particle: { en: "Particle", vi: "Trợ từ", ar: "أداة" },
  measure_word: { en: "Measure word", vi: "Lượng từ", ar: "كلمة قياس" },
};

const REGION_LABELS: Record<string, Record<string, string>> = {
  mainland_mandarin: {
    en: "Mainland China",
    vi: "Trung Quốc đại lục",
    ar: "الصين القارية",
  },
};

const localizedCodeLabel = (
  code: string | null,
  localeCode: string,
  dictionary: Record<string, Record<string, string>>,
) => {
  if (!code) return null;
  return dictionary[code]?.[localeCode] ?? dictionary[code]?.en ?? null;
};

const posLabel = (code: string | null, localeCode: string) =>
  code ? POS_LABELS[code]?.[localeCode] ?? POS_LABELS[code]?.en ?? null : null;

const proficiencyLabel = (
  systemCode: string,
  levelCode: string,
  fallbackLabel: string,
) => systemCode === "gf0025_2021"
  ? `${fallbackLabel}${levelCode}`
  : `${systemCode} ${levelCode}`;

const distinctProficiency = (
  rows: Array<{ levelSystemCode: string; levelCode: string }>,
) => rows.filter((row, index, allRows) => (
  allRows.findIndex((candidate) => (
    candidate.levelSystemCode === row.levelSystemCode
    && candidate.levelCode === row.levelCode
  )) === index
));

const groupByPartOfSpeech = (items: VocabularyReadingItem[]): PosGroup[] => {
  const groups: PosGroup[] = [];
  const groupsByCode = new Map<string, PosGroup>();

  for (const item of items) {
    const posCode = item.partOfSpeechCode ?? "unspecified";
    const existing = groupsByCode.get(posCode);
    if (existing) {
      existing.items.push(item);
      continue;
    }

    const group = {
      key: posCode,
      posCode,
      items: [item],
    };
    groupsByCode.set(posCode, group);
    groups.push(group);
  }

  return groups;
};

const distinctPosCodes = (items: VocabularyReadingItem[]) => [
  ...new Set(items.map((item) => item.partOfSpeechCode).filter((code): code is string => Boolean(code))),
];

const posAnchorMap = (pronunciationPublicId: string, groups: PosGroup[]) => {
  const anchors = new Map<string, string>();
  for (const group of groups) {
    if (group.posCode === "unspecified") continue;
    anchors.set(group.posCode, `#pos-${pronunciationPublicId}-${group.key}`);
  }
  return anchors;
};



type VocabularyDetailViewProps = {
  detail: VocabularyDetail;
  characters: VocabularyCharacterOccurrence[];
  interfaceLocaleCode: string;
  interfaceDirection: InterfaceTextDirection;
  knowledgeLanguage: KnowledgeLanguage;
  learnerContextQuery: Record<string, string>;
};

export default function VocabularyDetailView({
  detail,
  characters,
  interfaceLocaleCode,
  interfaceDirection,
  knowledgeLanguage,
  learnerContextQuery,
}: VocabularyDetailViewProps) {
  const labels = vocabularyDetailLabelsFor(interfaceLocaleCode);
  const showHanViet = interfaceLocaleCode === "vi" && knowledgeLanguage === "user";
  const primaryPronunciation =
    detail.pronunciations.find((item) => item.isDefault) ?? detail.pronunciations[0];
  const primaryForm = detail.forms.find((form) => form.isPrimary) ?? detail.forms[0];
  const secondaryForms = detail.forms.filter((form) => form.publicId !== primaryForm.publicId);
  const allReadingItems = detail.pronunciations.flatMap((item) => item.readingItems);
  const allProficiency = distinctProficiency([
    ...detail.proficiency,
    ...detail.pronunciations.flatMap((pronunciation) => pronunciation.proficiency),
    ...allReadingItems.flatMap((item) => item.proficiency),
  ]);
  const headerProficiency = allProficiency;
  const singleSummary = allReadingItems.length === 1
    ? vocabularySenseHeading(allReadingItems[0])
    : null;
  const allPosCodes = distinctPosCodes(allReadingItems);
  const hasReadingNavigation = detail.pronunciations.length > 1;

  const primaryGroups = primaryPronunciation
    ? groupByPartOfSpeech(primaryPronunciation.readingItems)
    : [];
  const primaryPosAnchors = primaryPronunciation
    ? posAnchorMap(primaryPronunciation.publicId, primaryGroups)
    : new Map<string, string>();
  const hasPosNavigation = !hasReadingNavigation
    && allPosCodes.length > 1
    && allPosCodes.every((code) => primaryPosAnchors.has(code));

  const navItems: VocabularyNavItem[] = hasReadingNavigation
    ? detail.pronunciations.map((pronunciation) => ({
        label: pronunciation.pronunciation,
        href: `#reading-${pronunciation.publicId}`,
      }))
    : hasPosNavigation
      ? allPosCodes.map((code) => ({
          label: posLabel(code, interfaceLocaleCode) ?? labels.partOfSpeech,
          href: primaryPosAnchors.get(code)!,
        }))
      : [];

  if (characters.length > 0) {
    navItems.push({ label: labels.characters, href: "#characters", mobileOnly: true });
  }

  const characterLabels = {
    characters: labels.characters,
    radical: labels.radical,
    strokes: labels.strokes,
    hanViet: labels.hanViet,
    writingOpen: labels.writingOpen,
    writingReplay: labels.writingReplay,
    writingUnavailable: labels.writingUnavailable,
    writingSource: labels.writingSource,
  };

  return (
    <main className={styles.page} dir={interfaceDirection} data-demo-v837="true">
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href={{ pathname: "/knowledge", query: learnerContextQuery }}>
          {labels.knowledge}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{labels.vocabulary}</span>
        <span aria-hidden="true">/</span>
        <span className={styles.breadcrumbCurrent}>{detail.displayForm}</span>
      </nav>

      <VocabularyStickyNav
        headword={detail.displayForm}
        pronunciation={primaryPronunciation?.pronunciation ?? null}
        navItems={navItems}
        knowledgeLanguage={knowledgeLanguage}
        userLanguageLabel={knowledgeLanguageUserLabel(interfaceLocaleCode)}
      />

      <div className={styles.workspace}>
        <article
          id="vocabulary-entry-card"
          className={styles.entryCard}
          data-single-sense={singleSummary ? "true" : undefined}
        >
          <header id="vocabulary-entry-header" className={styles.entryHeader}>
            <div className={styles.headwordWrap}>
              <div className={styles.writtenLine}>
                <h1 className={styles.headword}>{detail.displayForm}</h1>
              </div>

              {primaryPronunciation ? (
                <VocabularyPronunciationMeta
                  pronunciation={primaryPronunciation.pronunciation}
                  hanViet={showHanViet ? detail.hanViet?.text ?? null : null}
                  secondaryForms={secondaryForms}
                  proficiency={headerProficiency}
                  labels={{
                    hanViet: labels.hanViet,
                    traditional: labels.traditional,
                    simplified: labels.simplified,
                    writtenForm: labels.writtenForm,
                    proficiency: labels.proficiency,
                  }}
                />
              ) : null}
              <div className={styles.headerPosChips}>{allPosCodes.map((code) => {
                const label = posLabel(code, interfaceLocaleCode);
                return label ? <span key={code} className={styles.headerPosChip}>{label}</span> : null;
              })}</div>

              {hasReadingNavigation ? (
                <div className={styles.readingSelector} aria-label={labels.readings}>
                  {detail.pronunciations.map((pronunciation) => (
                    <a
                      key={pronunciation.publicId}
                      className={styles.readingButton}
                      href={`#reading-${pronunciation.publicId}`}
                    >
                      <strong>{pronunciation.pronunciation}</strong>
                      <span>
                        {pronunciation.readingItems.length} {pronunciation.readingItems.length === 1 ? labels.sense : labels.senses}
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div className={styles.headerActions}>
              <KnowledgeLanguageToggle
                value={knowledgeLanguage}
                userLanguageLabel={knowledgeLanguageUserLabel(interfaceLocaleCode)}
              />
            </div>
          </header>

          {!hasReadingNavigation && allReadingItems.length > 0 ? (
            <div className={styles.posSummary} aria-label={labels.partOfSpeech}>
              {allPosCodes.map((code) => {
                const count = allReadingItems.filter((item) => item.partOfSpeechCode === code).length;
                const learnerLabel = posLabel(code, interfaceLocaleCode);
                const anchor = primaryPosAnchors.get(code);
                if (!learnerLabel) return null;
                const content = (
                  <>
                    <strong>{learnerLabel}</strong>
                    <span aria-hidden="true"> · </span>
                    {count} {count === 1 ? labels.sense : labels.senses}
                  </>
                );
                return anchor ? (
                  <a key={code} className={styles.posSummaryChip} href={anchor}>{content}</a>
                ) : (
                  <span key={code} className={styles.posSummaryChip}>{content}</span>
                );
              })}
            </div>
          ) : null}

          {(hasReadingNavigation || hasPosNavigation) ? (
            <nav className={styles.sectionNav} aria-label={labels.sensesUsage}>
              {hasReadingNavigation
                ? detail.pronunciations.map((pronunciation) => (
                    <a key={pronunciation.publicId} href={`#reading-${pronunciation.publicId}`}>
                      {pronunciation.pronunciation}
                    </a>
                  ))
                : allPosCodes.map((code) => (
                    <a key={code} href={primaryPosAnchors.get(code)}>
                      {posLabel(code, interfaceLocaleCode)}
                    </a>
                  ))}
            </nav>
          ) : null}

          <div className={styles.entryBody}>
            <section aria-labelledby="vocabulary-senses-title">
              <h2 id="vocabulary-senses-title" className={styles.sectionTitle}>
                {labels.sensesUsage}
              </h2>

              <div className={`${styles.readingFlow} ${hasReadingNavigation ? styles.hasMultipleReadings : ""}`}>
                {detail.pronunciations.map((pronunciation) => {
                  const posGroups = groupByPartOfSpeech(pronunciation.readingItems);
                  return (
                    <section
                      key={pronunciation.publicId}
                      id={`reading-${pronunciation.publicId}`}
                      className={`${styles.readingSection} ${pronunciation.publicId === primaryPronunciation?.publicId ? styles.defaultReading : ""}`}
                    >
                      {hasReadingNavigation ? (
                        <div className={styles.readingHeading}>
                          <span>{labels.pronunciation}</span>
                          <strong>{pronunciation.pronunciation}</strong>
                          {pronunciation.proficiency.map((row) => (
                            <small key={row.levelSystemCode + row.levelCode}>
                              {proficiencyLabel(
                                row.levelSystemCode,
                                row.levelCode,
                                labels.proficiency,
                              )}
                            </small>
                          ))}
                          {pronunciation.usage?.context ? (
                            <small>{pronunciation.usage.context}</small>
                          ) : null}
                        </div>
                      ) : null}

                      <div className={styles.posFlow}>
                        {posGroups.map((group) => {
                          const learnerPosLabel = posLabel(
                            group.posCode === "unspecified" ? null : group.posCode,
                            interfaceLocaleCode,
                          );
                          return (
                            <section
                              key={`${pronunciation.publicId}-${group.key}`}
                              id={`pos-${pronunciation.publicId}-${group.key}`}
                              className={styles.posSection}
                            >
                              {learnerPosLabel ? (
                                <div className={styles.posSectionHead}>
                                  <span className={styles.posLabel}>{learnerPosLabel}</span>
                                  <span className={styles.posCount}>
                                    {group.items.length} {group.items.length === 1 ? labels.sense : labels.senses}
                                  </span>
                                </div>
                              ) : null}

                              <div className={styles.senseStack}>
                                {group.items.map((item, itemIndex) => {
                                  const meaningHeading = vocabularySenseHeading(item);
                                  const itemRegion = localizedCodeLabel(
                                    item.regionProfileCode,
                                    interfaceLocaleCode,
                                    REGION_LABELS,
                                  );
                                  return (
                                    <article
                                      key={item.publicId}
                                      className={`${styles.sense} ${(item.isSubsense || item.parentPublicId) ? styles.subsense : ""}`}
                                    >
                                      <div className={styles.senseIntro}>
                                      <div className={styles.senseHead}>
                                        <span className={styles.senseNum}>{itemIndex + 1}</span>
                                        <div className={styles.senseMain}>
                                          {item.itemType === "usage" ? (
                                            <span className={styles.usageType}>{labels.usage}</span>
                                          ) : null}
                                          {meaningHeading ? (
                                            <h3 className={styles.meaning}>{meaningHeading}</h3>
                                          ) : null}
                                          {item.fullExplanation ? (
                                            <p className={styles.meaningExplanation}>{item.fullExplanation}</p>
                                          ) : null}
                                          {(itemRegion || item.proficiency.length > 0) ? (
                                            <div className={styles.tags}>
                                              {itemRegion ? <span className={styles.tag}>{itemRegion}</span> : null}
                                              {item.proficiency.map((row) => (
                                                <span
                                                  key={row.levelSystemCode + row.levelCode}
                                                  className={styles.tag}
                                                >
                                                  {proficiencyLabel(
                                                    row.levelSystemCode,
                                                    row.levelCode,
                                                    labels.proficiency,
                                                  )}
                                                </span>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                      {item.examples[0] ? (
                                        <div className={styles.representativeExample}>
                                          <strong>{item.examples[0].chineseText}</strong>
                                          {item.examples[0].pinyinText ? <small>{item.examples[0].pinyinText}</small> : null}
                                          {item.examples[0].translationText ? <span>{item.examples[0].translationText}</span> : null}
                                        </div>
                                      ) : null}
                                      </div>

                                      <VocabularyRichSupport
                                        item={item}
                                        sourceExpression={detail.displayForm}
                                        labels={{
                                          usage: labels.usageNote,
                                          nuanceContext: labels.nuanceContext,
                                          memoryTip: labels.memoryTip,
                                          constructions: labels.constructions,
                                          collocations: labels.collocations,
                                          classifiers: labels.classifiers,
                                          example: labels.example,
                                          translationEquivalent: labels.translationEquivalent,
                                          synonyms: labels.synonyms,
                                          nearSynonyms: labels.nearSynonyms,
                                          antonyms: labels.antonyms,
                                          relatedWords: labels.relatedWords,
                                          quickDistinction: labels.quickDistinction,
                                          commonMistakes: labels.commonMistakes,
                                          relatedKnowledge: labels.relatedKnowledge,
                                          practice: labels.practice,
                                          showMore: labels.showMore,
                                          collapse: labels.collapse,
                                        }}
                                      />
                                    </article>
                                  );
                                })}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>

            {characters.length > 0 ? (
              <div className={styles.mobileCharacterPanel}>
                <VocabularyCharacterRail
                  occurrences={characters}
                  labels={characterLabels}
                  showHanViet={showHanViet}
                  variant="embedded"
                  anchorId="characters"
                />
              </div>
            ) : null}
          </div>
        </article>

        <VocabularyCharacterRail
          occurrences={characters}
          labels={characterLabels}
          showHanViet={showHanViet}
          variant="rail"
          anchorId="characters-rail"
        />
      </div>
    </main>
  );
}
