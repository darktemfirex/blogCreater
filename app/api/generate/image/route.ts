import { NextResponse } from "next/server";
import { generateCoverImage } from "@/lib/openai";
import { IMAGE_PROMPT } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const image = await generateCoverImage(IMAGE_PROMPT);
    return NextResponse.json(image);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "대표 이미지 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
