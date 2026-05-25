import { BLOG_RULES } from "./prompts";
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
    input: `${BLOG_RULES}\n\n${prompt}`
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
