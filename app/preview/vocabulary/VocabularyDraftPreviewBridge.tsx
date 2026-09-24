"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveInterfaceLocale } from "@/lib/interfaceLocaleRegistry";
import {
  resolveKnowledgeLanguage,
  type KnowledgeLanguage,
} from "@/lib/knowledgeLanguage";
import { preservedLearnerContextQuery } from "@/lib/proficiencyContext";
import VocabularyDetailView from "@/app/knowledge/vocabulary/[publicId]/VocabularyDetailView";
import { parseVocabularyDraftPreviewPayload } from "@/lib/vocabularyDraftPreview";
import styles from "./VocabularyDraftPreviewBridge.module.css";

const HANDOFF_PATTERN = /^[a-f0-9]{32}$/u;
const HANDOFF_TTL_MS = 10 * 60 * 1000;
const CLOCK_SKEW_MS = 30 * 1000;
const STORAGE_PREFIX = "yunchinese:vocabulary-draft-preview:";

type JsonObject = Record<string, unknown>;

type PreviewEnvelope = {
  type: "YUNCHINESE_VOCABULARY_DRAFT_PREVIEW";
  handoff: string;
  issuedAt: number;
  expiresAt: number;
  payloads: {
    vi: JsonObject;
    en: JsonObject;
    zh: JsonObject;
  };
};

type PreviewReadyMessage = {
  type: "YUNCHINESE_VOCABULARY_DRAFT_PREVIEW_READY";
  handoff: string;
};

type BridgeState =
  | { status: "WAITING" }
  | { status: "READY"; envelope: PreviewEnvelope }
  | { status: "INVALID"; reason: string };

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isAllowedAdminStagingOrigin(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return false;
    return (
      url.hostname === "listen-to-chinese-staging.vercel.app"
      || (
        url.hostname.startsWith("listen-to-chinese-staging-")
        && url.hostname.endsWith(".vercel.app")
      )
    );
  } catch {
    return false;
  }
}

function parseEnvelope(
  value: unknown,
  expectedHandoff: string,
  now: number,
): PreviewEnvelope | null {
  if (!isObject(value)) return null;
  if (value.type !== "YUNCHINESE_VOCABULARY_DRAFT_PREVIEW") return null;
  if (value.handoff !== expectedHandoff) return null;
  if (
    typeof value.issuedAt !== "number"
    || typeof value.expiresAt !== "number"
    || !Number.isFinite(value.issuedAt)
    || !Number.isFinite(value.expiresAt)
  ) {
    return null;
  }

  if (value.expiresAt <= now) return null;
  if (value.issuedAt > now + CLOCK_SKEW_MS) return null;
  if (value.expiresAt - value.issuedAt > HANDOFF_TTL_MS) return null;

  const payloads = isObject(value.payloads) ? value.payloads : null;
  const vi = payloads && isObject(payloads.vi) ? payloads.vi : null;
  const en = payloads && isObject(payloads.en) ? payloads.en : null;
  const zh = payloads && isObject(payloads.zh) ? payloads.zh : null;
  if (!vi || !en || !zh) return null;

  return {
    type: "YUNCHINESE_VOCABULARY_DRAFT_PREVIEW",
    handoff: expectedHandoff,
    issuedAt: value.issuedAt,
    expiresAt: value.expiresAt,
    payloads: { vi, en, zh },
  };
}

function readStoredEnvelope(handoff: string): PreviewEnvelope | null {
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${handoff}`);
    if (!raw) return null;
    const parsed = parseEnvelope(JSON.parse(raw), handoff, Date.now());
    if (!parsed) {
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}${handoff}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function storeEnvelope(envelope: PreviewEnvelope) {
  window.sessionStorage.setItem(
    `${STORAGE_PREFIX}${envelope.handoff}`,
    JSON.stringify(envelope),
  );
}

function contentLocaleFor(
  interfaceLocaleCode: string,
  knowledgeLanguage: KnowledgeLanguage,
): "vi" | "en" | "zh" {
  if (knowledgeLanguage === "zh") return "zh";
  return interfaceLocaleCode === "vi" ? "vi" : "en";
}

export default function VocabularyDraftPreviewBridge() {
  const searchParams = useSearchParams();
  const handoff = searchParams.get("handoff") ?? "";
  const interfaceLocale = resolveInterfaceLocale(
    searchParams.get("uiLang"),
    searchParams.get("lang"),
  );
  const knowledgeLanguage = resolveKnowledgeLanguage(
    searchParams.get("knowledgeLang"),
  );
  const [state, setState] = useState<BridgeState>({ status: "WAITING" });
  const copy = interfaceLocale.code === "vi"
    ? {
        waitingTitle: "Đang nhận bản nháp từ Admin…",
        waitingBody: "Bản xem trước chỉ hoạt động khi được mở trực tiếp từ phiên quản trị hợp lệ.",
        invalidTitle: "Không thể mở bản xem trước.",
        invalidBody: "Phiên review không hợp lệ, đã hết hạn hoặc không được mở từ Admin Staging.",
        payloadTitle: "Không thể dựng bản xem trước.",
        payloadBody: "Dữ liệu xem trước không hợp lệ hoặc phiên review đã hết hạn.",
        banner: "Bản xem trước bản nháp · Chỉ dành cho quản trị · Không công khai · Tự hết hạn",
      }
    : {
        waitingTitle: "Receiving the draft from Admin…",
        waitingBody: "Draft Preview works only when opened directly from a valid Owner session.",
        invalidTitle: "Draft Preview cannot be opened.",
        invalidBody: "The review handoff is invalid, expired, or was not opened from Admin Staging.",
        payloadTitle: "Draft Preview cannot be rendered.",
        payloadBody: "The Preview payload is invalid or the handoff has expired.",
        banner: "Draft preview · Owner review only · Private · Expires automatically",
      };

  useEffect(() => {
    if (!HANDOFF_PATTERN.test(handoff)) {
      setState({ status: "INVALID", reason: "INVALID_HANDOFF" });
      return;
    }

    const stored = readStoredEnvelope(handoff);
    if (stored) {
      setState({ status: "READY", envelope: stored });
      return;
    }

    const opener = window.opener;
    if (!opener) {
      setState({ status: "INVALID", reason: "OWNER_HANDOFF_REQUIRED" });
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      if (active) {
        setState({ status: "INVALID", reason: "HANDOFF_TIMEOUT" });
      }
    }, 8000);

    const onMessage = (event: MessageEvent) => {
      if (!active || event.source !== opener) return;
      if (!isAllowedAdminStagingOrigin(event.origin)) return;

      const envelope = parseEnvelope(event.data, handoff, Date.now());
      if (!envelope) return;

      storeEnvelope(envelope);
      window.clearTimeout(timeout);
      active = false;
      setState({ status: "READY", envelope });
    };

    window.addEventListener("message", onMessage);

    const ready: PreviewReadyMessage = {
      type: "YUNCHINESE_VOCABULARY_DRAFT_PREVIEW_READY",
      handoff,
    };
    opener.postMessage(ready, "*");

    return () => {
      active = false;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };
  }, [handoff]);

  useEffect(() => {
    if (state.status !== "READY") return;
    const remaining = state.envelope.expiresAt - Date.now();
    if (remaining <= 0) {
      setState({ status: "INVALID", reason: "HANDOFF_EXPIRED" });
      return;
    }
    const timer = window.setTimeout(() => {
      window.sessionStorage.removeItem(
        `${STORAGE_PREFIX}${state.envelope.handoff}`,
      );
      setState({ status: "INVALID", reason: "HANDOFF_EXPIRED" });
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [state]);

  const detail = useMemo(() => {
    if (state.status !== "READY") return null;

    const locale = contentLocaleFor(
      interfaceLocale.code,
      knowledgeLanguage,
    );
    return parseVocabularyDraftPreviewPayload(
      state.envelope.payloads[locale],
    );
  }, [state, interfaceLocale.code, knowledgeLanguage]);

  const learnerContextQuery = preservedLearnerContextQuery({
    uiLang: searchParams.get("uiLang") ?? undefined,
    lang: searchParams.get("lang") ?? undefined,
    knowledgeLang: knowledgeLanguage,
    levelSystem: searchParams.get("levelSystem") ?? undefined,
    level: searchParams.get("level") ?? undefined,
  });

  if (state.status === "WAITING") {
    return (
      <div className={styles.statusWrap} data-draft-preview-state="waiting">
        <strong>{copy.waitingTitle}</strong>
        <p>{copy.waitingBody}</p>
      </div>
    );
  }

  if (state.status === "INVALID") {
    return (
      <div
        className={styles.statusWrap}
        data-draft-preview-state="invalid"
        data-draft-preview-reason={state.reason}
      >
        <strong>{copy.invalidTitle}</strong>
        <p>{copy.invalidBody}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div
        className={styles.statusWrap}
        data-draft-preview-state="invalid-payload"
      >
        <strong>{copy.payloadTitle}</strong>
        <p>{copy.payloadBody}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={styles.previewBanner}
        data-draft-preview-state="rendered"
        data-draft-preview-contract="K1F_VOCABULARY_LOCALIZED_DETAIL_PUBLIC_PROJECTION_V1"
      >
        {copy.banner}
      </div>
      <VocabularyDetailView
        detail={detail}
        characters={[]}
        interfaceLocaleCode={interfaceLocale.code}
        interfaceDirection={interfaceLocale.direction}
        knowledgeLanguage={knowledgeLanguage}
        learnerContextQuery={learnerContextQuery}
      />
    </>
  );
}
