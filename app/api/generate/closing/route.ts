import { NextResponse } from "next/server";
import { generateBlogDraft } from "@/lib/openai";
import { CLOSING_PROMPT } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const draft = await generateBlogDraft(CLOSING_PROMPT);
    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "오후 마감 시황 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
