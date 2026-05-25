export type IndexSnapshot = {
  name: string;
  close: string;
  change: string;
  changePercent: string;
};

export type BlogDraft = {
  title: string;
  summary: string;
  indexSnapshot: IndexSnapshot[];
  marketPoints: string[];
  strategyPoints: string[];
  caution: string;
  tags: string[];
};

export type FormattedBlogDraft = BlogDraft & {
  body: string;
  tagText: string;
};

export function normalizeDraft(input: Partial<BlogDraft>): BlogDraft {
  return {
    title: cleanText(input.title) || "Money Pick 오늘의 시황",
    summary: cleanText(input.summary) || "오늘 시장의 핵심 흐름을 쉽게 정리했습니다.",
    indexSnapshot: toIndexSnapshot(input.indexSnapshot),
    marketPoints: toTwoItems(input.marketPoints),
    strategyPoints: toTwoItems(input.strategyPoints),
    caution:
      cleanText(input.caution) ||
      "투자는 원금 손실 가능성이 있으니 본인의 판단과 책임으로 결정해야 합니다.",
    tags: toFiveTags(input.tags)
  };
}

export function formatForNaver(input: BlogDraft): FormattedBlogDraft {
  const draft = normalizeDraft(input);
  const body = [
    `한줄 요약: ${draft.summary}`,
    "",
    "미국 3대 지수 최종 마감",
    "지수 | 마감 수치 | 전일 대비 등락폭 | 등락률",
    ...draft.indexSnapshot.map(
      (item) => `${item.name} | ${item.close} | ${item.change} | ${item.changePercent}`
    ),
    "",
    "시황 포인트",
    `1. ${draft.marketPoints[0]}`,
    `2. ${draft.marketPoints[1]}`,
    "",
    "초보자 전략",
    `1. ${draft.strategyPoints[0]}`,
    `2. ${draft.strategyPoints[1]}`,
    "",
    `투자 유의사항: ${draft.caution}`
  ].join("\n");

  return {
    ...draft,
    body,
    tagText: draft.tags.join(" ")
  };
}

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toTwoItems(value: unknown): string[] {
  const items = Array.isArray(value)
    ? value.map(cleanText).filter(Boolean)
    : [];

  return [
    items[0] || "큰 흐름을 먼저 보고, 하루 변동에 너무 흔들리지 않는 것이 좋습니다.",
    items[1] || "뉴스와 환율, 금리 흐름을 함께 확인하면 시장 분위기를 이해하기 쉽습니다."
  ];
}

function toIndexSnapshot(value: unknown): IndexSnapshot[] {
  const defaults = [
    { name: "나스닥", close: "확인 필요", change: "확인 필요", changePercent: "확인 필요" },
    { name: "S&P500", close: "확인 필요", change: "확인 필요", changePercent: "확인 필요" },
    { name: "다우존스", close: "확인 필요", change: "확인 필요", changePercent: "확인 필요" }
  ];

  if (!Array.isArray(value)) {
    return defaults;
  }

  return defaults.map((fallback, index) => {
    const item = value[index] as Partial<IndexSnapshot> | undefined;

    return {
      name: cleanText(item?.name) || fallback.name,
      close: cleanText(item?.close) || fallback.close,
      change: cleanText(item?.change) || fallback.change,
      changePercent: cleanText(item?.changePercent) || fallback.changePercent
    };
  });
}

function toFiveTags(value: unknown): string[] {
  const defaults = ["#MoneyPick", "#주식시황", "#미국증시", "#초보투자", "#경제공부"];
  const tags = Array.isArray(value)
    ? value.map(cleanText).filter(Boolean)
    : [];

  return defaults.map((fallback, index) => {
    const tag = tags[index] || fallback;
    return tag.startsWith("#") ? tag : `#${tag}`;
  });
}
