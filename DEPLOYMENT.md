# Cloudflare 배포 방법

이 프로젝트는 Next.js App Router API Route를 사용하므로 정적 Cloudflare Pages 배포만으로는 동작하지 않습니다.
Cloudflare의 최신 권장 방식인 OpenNext 기반 Workers 배포를 사용합니다.

## 1. 로컬에서 배포

```bash
npm install
npx wrangler login
npx wrangler secret put OPENAI_API_KEY
npm run deploy
```

배포가 끝나면 `https://blogcreater.<계정명>.workers.dev` 형태의 주소가 생성됩니다.

## 2. Cloudflare 대시보드에서 연결

`Workers & Pages`에서 Pages 정적 사이트로 만들지 말고, Workers 쪽에서 GitHub 저장소를 연결합니다.

- Repository: `darktemfirex/blogCreater`
- Build command: 비워두거나 `npm run cf:build`
- Deploy command: `npx wrangler deploy`
- Node.js version: `22` 또는 `20`
- Secret: `OPENAI_API_KEY`

`OPENAI_TEXT_MODEL`, `OPENAI_IMAGE_MODEL`은 `wrangler.toml`의 `[vars]`에 들어 있습니다.

중요: Build command에 `npm run build`만 넣으면 안 됩니다. `npm run build`는 Next.js 빌드만 수행하므로
OpenNext 배포에 필요한 `.open-next/.build/open-next.config.edge.mjs`가 생성되지 않습니다.
이 경우 deploy 단계에서 `Could not find compiled Open Next config` 오류가 납니다.

## 3. 왜 Pages 404가 나는가

Cloudflare Pages의 정적 배포는 루트에 `index.html` 같은 정적 파일이 있어야 합니다.
하지만 이 앱은 `/api/generate/morning`, `/api/generate/closing`, `/api/generate/image` 서버 라우트가 필요합니다.
OpenNext는 이 서버 라우트를 `.open-next/worker.js`로 변환하므로 Workers 런타임에서 실행해야 합니다.

따라서 `blogcreater.pages.dev`에서 404가 나면 Pages 프로젝트가 정적 산출물만 바라보고 있는 상태입니다.
