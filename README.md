# Lobby Dashboard Desa Cibenda

Kiosk website untuk TV lobby Kantor Desa Cibenda (`/tv`, 1280×720, read-only) dan halaman mobile via QR (`/`). Data dibaca dari SIGAP, SID, dan CiMart melalui aggregator di repo ini.

## Menjalankan

Butuh Node 22 LTS (`.nvmrc`) dan pnpm 10 (`corepack enable` atau `npm i -g pnpm@10`).

```bash
pnpm install
pnpm exec playwright install chromium   # sekali saja, untuk pnpm e2e
pnpm dev
```

`pnpm dev` menjalankan tiga proses dengan data tiruan:

| Proses               | URL                                                        |
| -------------------- | ---------------------------------------------------------- |
| Web (Vite)           | http://localhost:5173/tv dan http://localhost:5173/        |
| Aggregator (Hono)    | http://localhost:8080/healthz                              |
| Mock upstream (Hono) | http://localhost:8090 (SIGAP, SID, CiMart dalam satu port) |

Skenario mock dipilih dengan `MOCK_SCENARIO=<nama>` saat start, atau saat berjalan lewat `http://localhost:8090/__scenario/<nama>`. Daftar skenario ada di [tools/mock-upstream/src/scenarios.ts](tools/mock-upstream/src/scenarios.ts).

## Perintah

| Perintah      | Isi                                         |
| ------------- | ------------------------------------------- |
| `pnpm dev`    | mock upstream + aggregator + web            |
| `pnpm check`  | lint (ESLint + Prettier) + typecheck + test |
| `pnpm build`  | build web (Vite) dan aggregator (tsup)      |
| `pnpm e2e`    | Playwright, menjalankan `pnpm dev` sendiri  |
| `pnpm format` | merapikan kode dengan Prettier              |

## Struktur

```
apps/aggregator      Proses Node: sinkron upstream, cache, API /api/lobby/*
apps/web             Vite + React: rute / (mobile) dan /tv (TV)
packages/contract    @lobby/contract: skema Zod upstream + API Lobby, fixture
packages/core        @lobby/core: logic murni tanpa I/O
tools/mock-upstream  Server tiruan SIGAP/SID/CiMart dengan skenario
config/              lobby.config.json (divalidasi saat start)
```

Rahasia dan URL upstream hanya dari env; lihat [.env.example](.env.example).
