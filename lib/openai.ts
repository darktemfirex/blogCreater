import { BLOG_RULES } from "./prompts";
import { SAMPLE_ARTICLE } from "./sampleArticle";
import { formatForNaver, type BlogDraft, type FormattedBlogDraft } from "./naverFormatter";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

type OpenAITextResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    result?: string;
  }>;
};

export async function generateBlogDraft(prompt: string): Promise<FormattedBlogDraft> {
  const response = await callOpenAI({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-5.2",
    tools: [
      {
        type: "web_search",
        search_context_size: "medium",
        user_location: {
          type: "approximate",
          country: "KR",
          timezone: "Asia/Seoul"
        }
      }
    ],
    tool_choice: "auto",
    include: ["web_search_call.action.sources"],
    input: [
      BLOG_RULES,
      getDateContext(),
      "미국 3대 지수 최종 마감 수치와 전일 대비 등락폭, 등락률은 웹 검색으로 확인한 뒤 작성해.",
      "가능하면 Nasdaq, S&P Dow Jones Indices, CNBC, MarketWatch, Yahoo Finance, Investing.com 등 신뢰 가능한 금융 출처를 교차 확인해.",
      "아래 샘플 본문의 말투, 문단 흐름, 쉬운 설명 방식을 참고해. 단, 샘플 내용을 그대로 베끼지 말고 현재 요청에 맞게 새로 작성해.",
      `<샘플 본문>\n${SAMPLE_ARTICLE}\n</샘플 본문>`,
      prompt
    ].join("\n\n")
  });

  const text = extractText(response);
  const draft = parseJsonDraft(text);

  return formatForNaver(draft);
}

export async function generateCoverImage(prompt: string): Promise<{ imageDataUrl: string }> {
  const response = await callOpenAI({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-5.2",
    input: prompt,
    tools: [
      {
        type: "image_generation",
        size: "1024x1024",
        quality: "medium"
      }
    ],
    tool_choice: {
      type: "image_generation"
    }
  });

  const imageBase64 = response.output?.find(
    (item) => item.type === "image_generation_call" && item.result
  )?.result;

  if (!imageBase64) {
    throw new Error("이미지 생성 결과를 찾지 못했습니다.");
  }

  return {
    imageDataUrl: `data:image/png;base64,${imageBase64}`
  };
}

async function callOpenAI(payload: Record<string, unknown>): Promise<OpenAITextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 환경 변수가 필요합니다.");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as OpenAITextResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI API 요청에 실패했습니다.");
  }

  return data;
}

function extractText(response: OpenAITextResponse): string {
  if (response.output_text) {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("글 생성 결과를 찾지 못했습니다.");
  }

  return text;
}

function parseJsonDraft(text: string): BlogDraft {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as BlogDraft;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as BlogDraft;
    }

    throw new Error("글 생성 결과를 JSON으로 해석하지 못했습니다.");
  }
}

function getDateContext(): string {
  const now = new Date();
  const koreaDate = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(now);

  return `생성 기준 시각은 한국 시간 ${koreaDate}입니다. "전날 미국 시장"은 한국 시간 기준으로 확인 가능한 가장 최근 미국 정규장 최종 마감일을 의미합니다.`;
}
