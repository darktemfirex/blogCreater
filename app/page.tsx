"use client";

import { useMemo, useState } from "react";

type Draft = {
  title: string;
  body: string;
  tagText: string;
};

const NAVER_WRITE_URL = "https://blog.naver.com/GoBlogWrite.naver";

export default function Home() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const statusText = useMemo(() => {
    if (loading) return "전날 미국 시장 요약 생성 중...";
    if (draft) return "생성 완료";
    return "대기 중";
  }, [draft, loading]);

  async function generate() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const [articleResponse, imageResponse] = await Promise.all([
        fetch("/api/generate/morning", { method: "POST" }),
        fetch("/api/generate/image", { method: "POST" })
      ]);

      const articleData = await articleResponse.json();
      const imageData = await imageResponse.json();

      if (!articleResponse.ok) {
        throw new Error(articleData.error || "글 생성에 실패했습니다.");
      }

      if (!imageResponse.ok) {
        throw new Error(imageData.error || "이미지 생성에 실패했습니다.");
      }

      setDraft({
        title: articleData.title,
        body: articleData.body,
        tagText: articleData.tagText
      });
      setImageDataUrl(imageData.imageDataUrl);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(label: string, value?: string) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} 복사 완료`);
    } catch {
      setNotice("브라우저 권한 때문에 복사하지 못했습니다. 내용을 직접 선택해서 복사해 주세요.");
    }
  }

  function downloadImage() {
    if (!imageDataUrl) return;

    const link = document.createElement("a");
    link.href = imageDataUrl;
    link.download = "money-pick-cover.png";
    link.click();
    setNotice("이미지 다운로드를 시작했습니다.");
  }

  return (
    <main className="page">
      <div className="shell">
        <header className="topbar">
          <div className="headingGroup">
            <p className="eyebrow">Money Pick</p>
            <h1 className="title">블로그 생성기</h1>
            <p className="subtitle">생성 결과는 저장되지 않고 현재 화면에서만 복사하거나 다운로드할 수 있습니다.</p>
          </div>
          <div className="status" aria-live="polite">
            <span className={loading ? "statusDot active" : "statusDot"} />
            {statusText}
          </div>
        </header>

        <section className="commandBar" aria-label="시황 생성">
          <button
            className="primaryButton"
            disabled={loading}
            onClick={generate}
          >
            전날 미국 시장 요약
          </button>
        </section>

        {error ? <div className="error">{error}</div> : null}

        <div className="workspace">
          <section className="panel articlePanel" aria-label="생성된 블로그 글">
            <div className="panelHeader">
              <h2 className="panelTitle">블로그 글</h2>
              <div className="copyGrid">
                <button
                  className="ghostButton"
                  disabled={!draft}
                  onClick={() => copyText("제목", draft?.title)}
                >
                  제목 복사
                </button>
                <button
                  className="ghostButton"
                  disabled={!draft}
                  onClick={() => copyText("본문", draft?.body)}
                >
                  본문 복사
                </button>
                <button
                  className="ghostButton"
                  disabled={!draft}
                  onClick={() => copyText("태그", draft?.tagText)}
                >
                  태그 복사
                </button>
              </div>
            </div>

            <div className="content">
              <label className="field">
                <span className="label">생성된 제목</span>
                <input
                  className="readonly"
                  readOnly
                  value={draft?.title || ""}
                  placeholder="생성 버튼을 누르면 제목이 표시됩니다."
                />
              </label>

              <label className="field">
                <span className="label">생성된 본문</span>
                <textarea
                  className="readonly bodyBox"
                  readOnly
                  value={draft?.body || ""}
                  placeholder="생성 버튼을 누르면 네이버 블로그에 붙여넣기 좋은 본문이 표시됩니다."
                />
              </label>

              <label className="field lastField">
                <span className="label">생성된 태그</span>
                <textarea
                  className="readonly tagBox"
                  readOnly
                  value={draft?.tagText || ""}
                  placeholder="#MoneyPick #주식시황 #초보투자"
                />
              </label>
            </div>
          </section>

          <aside className="panel imagePanel" aria-label="대표 이미지">
            <div className="panelHeader compactHeader">
              <h2 className="panelTitle">대표 이미지</h2>
            </div>

            <div className="imageWrap">
              <div className="preview">
                {imageDataUrl ? (
                  <img src={imageDataUrl} alt="생성된 Money Pick 블로그 대표 이미지" />
                ) : (
                  <p className="empty">생성 버튼을 누르면 대표 이미지가 표시됩니다.</p>
                )}
              </div>

              <div className="imageActions">
                <button className="ghostButton" disabled={!imageDataUrl} onClick={downloadImage}>
                  이미지 다운로드
                </button>
                <button
                  className="primaryButton"
                  onClick={() => window.open(NAVER_WRITE_URL, "_blank", "noopener,noreferrer")}
                >
                  네이버 블로그 글쓰기 열기
                </button>
              </div>

              {notice ? <p className="notice">{notice}</p> : null}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
