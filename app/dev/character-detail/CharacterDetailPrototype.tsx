"use client";

import { useMemo, useState } from "react";
import styles from "./CharacterDetailPrototype.module.css";

type ModuleState = "PRESENT" | "N/A" | "PENDING";

type FormRecord = {
  id: string;
  glyph: string;
  label: string;
  strokeCount: number;
  strokeOrderState: "PRESENT" | "PENDING";
};

type PronunciationRecord = {
  id: string;
  pinyin: string;
  hanViet: string;
  orientations: readonly string[];
  vocabulary: Readonly<{
    state: ModuleState;
    items: readonly string[];
    note?: string;
  }>;
};

type ConstructionModule =
  | Readonly<{ state: "N/A" }>
  | Readonly<{
      state: "PRESENT";
      structure: string;
      formula: string;
      components: readonly Readonly<{
        glyph: string;
        role: string;
      }>[];
    }>;

type RadicalModule = Readonly<{
  state: "PRESENT" | "PENDING";
  radical?: string;
  displayForm?: string;
  note?: string;
}>;

type CharacterFixture = Readonly<{
  id: "chang" | "qing";
  displayLabel: string;
  forms: readonly FormRecord[];
  identicalScriptForms: boolean;
  pronunciations: readonly PronunciationRecord[];
  radical: RadicalModule;
  construction: ConstructionModule;
}>;

// Prototype-only view model. This is NOT a canonical database/API/authoring schema.
// It exists only to prove that one learner-facing architecture can preserve the
// exact Owner-provided Knowledge handoff for 长/長 and 清 without semantic loss.
const FIXTURES: readonly CharacterFixture[] = [
  {
    id: "chang",
    displayLabel: "长 / 長",
    identicalScriptForms: false,
    forms: [
      {
        id: "chang-simplified",
        glyph: "长",
        label: "Giản thể",
        strokeCount: 4,
        strokeOrderState: "PRESENT",
      },
      {
        id: "chang-traditional",
        glyph: "長",
        label: "Phồn thể",
        strokeCount: 8,
        strokeOrderState: "PENDING",
      },
    ],
    pronunciations: [
      {
        id: "chang-long",
        pinyin: "cháng",
        hanViet: "trường",
        orientations: [
          "dài / lâu",
          "độ dài",
          "sở trường / điểm mạnh",
          "giỏi về một việc",
        ],
        vocabulary: {
          state: "PRESENT",
          items: ["长期", "长度", "特长"],
        },
      },
      {
        id: "chang-grow",
        pinyin: "zhǎng",
        hanViet: "trưởng",
        orientations: [
          "lớn tuổi hơn / vai vế cao hơn",
          "người đứng đầu",
          "lớn lên / sinh trưởng / phát triển",
          "tăng lên",
        ],
        vocabulary: {
          state: "PRESENT",
          items: ["长大", "增长", "长辈"],
        },
      },
    ],
    radical: {
      state: "PENDING",
      note: "Exact Knowledge package hiện chưa cung cấp radical cho 长 / 長.",
    },
    construction: {
      state: "N/A",
    },
  },
  {
    id: "qing",
    displayLabel: "清",
    identicalScriptForms: true,
    forms: [
      {
        id: "qing-shared",
        glyph: "清",
        label: "Giản thể = Phồn thể",
        strokeCount: 11,
        strokeOrderState: "PRESENT",
      },
    ],
    pronunciations: [
      {
        id: "qing-reading",
        pinyin: "qīng",
        hanViet: "thanh",
        orientations: [
          "trong / sạch",
          "thuần / không pha",
          "rõ ràng",
          "làm sạch / loại bỏ",
          "rà soát / xử lý cho rõ",
          "thanh liêm",
          "yên tĩnh",
          "nhà Thanh",
        ],
        vocabulary: {
          state: "PENDING",
          items: [],
          note: "Exact Knowledge package hiện chưa cung cấp danh sách Vocabulary links cho 清.",
        },
      },
    ],
    radical: {
      state: "PRESENT",
      radical: "水",
      displayForm: "氵",
    },
    construction: {
      state: "PRESENT",
      structure: "Trái – phải",
      formula: "清 = 氵 + 青",
      components: [
        { glyph: "氵", role: "gợi nghĩa" },
        { glyph: "青", role: "gợi âm" },
      ],
    },
  },
] as const;

function PendingState({ children }: { children: string }) {
  return (
    <div className={styles.pendingState} role="status">
      <span className={styles.pendingBadge}>Chưa có trong gói mẫu</span>
      <p>{children}</p>
    </div>
  );
}

function OrientationList({ items }: { items: readonly string[] }) {
  return (
    <ul className={styles.orientationGrid}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function VocabularyRelations({ pronunciation }: { pronunciation: PronunciationRecord }) {
  if (pronunciation.vocabulary.state === "PENDING") {
    return <PendingState>{pronunciation.vocabulary.note ?? "Dữ liệu đang chờ bổ sung."}</PendingState>;
  }

  return (
    <div className={styles.vocabularyRelations}>
      {pronunciation.vocabulary.items.map((word) => (
        <div key={word} className={styles.vocabularyRelation}>
          <span className={styles.vocabularyWord}>{word}</span>
          <span className={styles.vocabularyType}>Vocabulary</span>
          <span className={styles.relationArrow} aria-hidden="true">↗</span>
        </div>
      ))}
    </div>
  );
}

function WritingPanel({
  fixture,
  activeFormId,
  onFormChange,
}: {
  fixture: CharacterFixture;
  activeFormId: string;
  onFormChange: (id: string) => void;
}) {
  const activeForm = fixture.forms.find((form) => form.id === activeFormId) ?? fixture.forms[0];

  return (
    <section className={styles.sideSection} aria-labelledby="writing-heading">
      <div className={styles.sectionHeadingRow}>
        <div>
          <span className={styles.eyebrow}>Viết chữ</span>
          <h2 id="writing-heading">Nét & dạng chữ</h2>
        </div>
        <span className={styles.strokeCount}>{activeForm.strokeCount} nét</span>
      </div>

      {fixture.forms.length > 1 ? (
        <div className={styles.formSelector} aria-label="Chọn dạng chữ">
          {fixture.forms.map((form) => (
            <button
              key={form.id}
              type="button"
              aria-pressed={activeForm.id === form.id}
              onClick={() => onFormChange(form.id)}
            >
              <strong>{form.glyph}</strong>
              <span>{form.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.identicalForms}>
          <span className={styles.identicalGlyph}>{activeForm.glyph}</span>
          <span>Giản thể = Phồn thể</span>
        </div>
      )}

      <div className={styles.writingGrid} aria-label={`Ô luyện viết chữ ${activeForm.glyph}`}>
        <span>{activeForm.glyph}</span>
      </div>

      {activeForm.strokeOrderState === "PRESENT" ? (
        <div className={styles.availableState}>
          <span className={styles.availableDot} aria-hidden="true" />
          <div>
            <strong>Thứ tự nét đã có dữ liệu xác minh</strong>
            <p>Prototype không dựng animation hoặc stroke asset ngoài exact Knowledge input.</p>
          </div>
        </div>
      ) : (
        <div className={styles.pendingStroke} role="status">
          <span>PENDING</span>
          <p>Chi tiết thứ tự nét cho {activeForm.glyph} chưa được Knowledge cung cấp.</p>
        </div>
      )}
    </section>
  );
}

function ConstructionPanel({ construction }: { construction: ConstructionModule }) {
  if (construction.state !== "PRESENT") return null;

  return (
    <section className={styles.sideSection} aria-labelledby="construction-heading">
      <div className={styles.sectionHeadingRow}>
        <div>
          <span className={styles.eyebrow}>Cấu tạo</span>
          <h2 id="construction-heading">Kết cấu chữ</h2>
        </div>
        <span className={styles.structureBadge}>{construction.structure}</span>
      </div>

      <div className={styles.formula}>{construction.formula}</div>

      <div className={styles.componentList}>
        {construction.components.map((component) => (
          <div key={component.glyph} className={styles.componentRow}>
            <span className={styles.componentGlyph}>{component.glyph}</span>
            <span className={styles.componentRole}>{component.role}</span>
          </div>
        ))}
      </div>

      <p className={styles.boundaryNote}>
        Vai trò thành phần chỉ áp dụng cho exact sample này; prototype không suy thành quy tắc chung cho mọi Hán tự.
      </p>
    </section>
  );
}

export default function CharacterDetailPrototype() {
  const [activeCharacterId, setActiveCharacterId] = useState<CharacterFixture["id"]>("chang");
  const fixture = useMemo(
    () => FIXTURES.find((item) => item.id === activeCharacterId) ?? FIXTURES[0],
    [activeCharacterId],
  );
  const [activeReadingId, setActiveReadingId] = useState(FIXTURES[0].pronunciations[0].id);
  const [activeFormId, setActiveFormId] = useState(FIXTURES[0].forms[0].id);

  const activeReading =
    fixture.pronunciations.find((reading) => reading.id === activeReadingId) ?? fixture.pronunciations[0];
  const activeForm = fixture.forms.find((form) => form.id === activeFormId) ?? fixture.forms[0];

  function chooseFixture(nextId: CharacterFixture["id"]) {
    const next = FIXTURES.find((item) => item.id === nextId);
    if (!next) return;
    setActiveCharacterId(nextId);
    setActiveReadingId(next.pronunciations[0].id);
    setActiveFormId(next.forms[0].id);
  }

  return (
    <main className={styles.page}>
      <div className={styles.prototypeNotice}>
        <span>Prototype v1</span>
        <p>Source-grounded Character Detail · VI Knowledge mode · chưa nối runtime/schema.</p>
      </div>

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <span>Kiến thức</span>
        <span aria-hidden="true">/</span>
        <span>Hán tự</span>
        <span aria-hidden="true">/</span>
        <strong>{fixture.displayLabel}</strong>
      </nav>

      <div className={styles.fixtureBar}>
        <div>
          <span className={styles.eyebrow}>Test records</span>
          <strong>Một kiến trúc · hai độ phức tạp</strong>
        </div>
        <div className={styles.fixtureSwitcher} aria-label="Chọn Character test record">
          {FIXTURES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === fixture.id}
              onClick={() => chooseFixture(item.id)}
            >
              {item.displayLabel}
            </button>
          ))}
        </div>
      </div>

      <article className={styles.workspace}>
        <div className={styles.primaryColumn}>
          <header className={styles.identityHeader}>
            <div className={styles.glyphBlock} aria-label={`Hán tự ${activeForm.glyph}`}>
              <span>{activeForm.glyph}</span>
            </div>

            <div className={styles.identityCopy}>
              <div className={styles.identityTopline}>
                <span className={styles.familyBadge}>Hán tự</span>
                {fixture.identicalScriptForms ? (
                  <span className={styles.scriptNote}>Giản thể = Phồn thể</span>
                ) : (
                  <span className={styles.scriptNote}>Giản thể {fixture.forms[0].glyph} · Phồn thể {fixture.forms[1].glyph}</span>
                )}
              </div>

              <h1>{fixture.displayLabel}</h1>

              {fixture.pronunciations.length > 1 ? (
                <div className={styles.readingSelector} aria-label="Chọn cách đọc">
                  {fixture.pronunciations.map((reading) => (
                    <button
                      key={reading.id}
                      type="button"
                      aria-pressed={reading.id === activeReading.id}
                      onClick={() => setActiveReadingId(reading.id)}
                    >
                      <strong>{reading.pinyin}</strong>
                      <span>{reading.hanViet}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.singleReading}>
                  <strong>{activeReading.pinyin}</strong>
                  <span>Hán Việt · {activeReading.hanViet}</span>
                </div>
              )}
            </div>
          </header>

          <section className={styles.readingPanel} aria-labelledby="meaning-heading">
            <div className={styles.readingPanelHead}>
              <div>
                <span className={styles.eyebrow}>
                  {fixture.pronunciations.length > 1 ? "Theo cách đọc" : "Cách đọc"}
                </span>
                <h2>{activeReading.pinyin}</h2>
              </div>
              <div className={styles.hanVietValue}>
                <span>Hán Việt</span>
                <strong>{activeReading.hanViet}</strong>
              </div>
            </div>

            <div className={styles.semanticBoundary}>
              <strong>Định hướng nghĩa theo chữ</strong>
              <span>Không phải danh sách Vocabulary Sense</span>
            </div>

            <h3 id="meaning-heading" className={styles.visuallyHidden}>Định hướng nghĩa</h3>
            <OrientationList items={activeReading.orientations} />
          </section>

          <section className={styles.vocabularySection} aria-labelledby="vocabulary-heading">
            <div className={styles.sectionHeadingRow}>
              <div>
                <span className={styles.eyebrow}>Liên kết kiến thức</span>
                <h2 id="vocabulary-heading">Từ vựng theo cách đọc</h2>
              </div>
              {fixture.pronunciations.length > 1 ? (
                <span className={styles.readingContext}>{activeReading.pinyin}</span>
              ) : null}
            </div>

            <p className={styles.sectionLead}>
              Đây là quan hệ tới Vocabulary objects; Character Detail không sao chép nghĩa từ vựng vào trang này.
            </p>
            <VocabularyRelations pronunciation={activeReading} />
          </section>
        </div>

        <aside className={styles.sideColumn} aria-label="Thông tin chữ">
          <section className={styles.sideSection} aria-labelledby="facts-heading">
            <div className={styles.sectionHeadingRow}>
              <div>
                <span className={styles.eyebrow}>Thông tin chữ</span>
                <h2 id="facts-heading">Thông tin nhanh</h2>
              </div>
            </div>

            <dl className={styles.factList}>
              <div>
                <dt>Số nét</dt>
                <dd>{activeForm.strokeCount}</dd>
              </div>
              <div>
                <dt>Bộ thủ</dt>
                <dd>
                  {fixture.radical.state === "PRESENT" ? (
                    <span className={styles.radicalValue}>
                      <strong>{fixture.radical.radical}</strong>
                      {fixture.radical.displayForm ? <span>dạng viết {fixture.radical.displayForm}</span> : null}
                    </span>
                  ) : (
                    <span className={styles.pendingInline}>Chưa có trong gói mẫu</span>
                  )}
                </dd>
              </div>
            </dl>

            {fixture.radical.state === "PENDING" && fixture.radical.note ? (
              <p className={styles.sourceGapNote}>{fixture.radical.note}</p>
            ) : null}
          </section>

          <WritingPanel fixture={fixture} activeFormId={activeForm.id} onFormChange={setActiveFormId} />
          <ConstructionPanel construction={fixture.construction} />
        </aside>
      </article>

      <footer className={styles.prototypeFooter}>
        <strong>Semantic boundary:</strong>
        <span>Character ≠ Vocabulary · pronunciation groups remain distinct · missing/PENDING data is never guessed.</span>
      </footer>
    </main>
  );
}
