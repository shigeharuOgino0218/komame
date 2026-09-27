# komame

使ったら、こまめに。— 開いた瞬間に支出を記録できる家計簿 PWA。

React 19 + React Router 8（データモード）+ TanStack Query + Supabase（Postgres / Auth / RLS）+ Tailwind v4 + shadcn/ui

## セットアップ

前提: [mise](https://mise.jdx.dev/)、Docker Desktop

```bash
mise install          # node / pnpm / supabase CLI
pnpm install
pnpm db:start         # ローカル Supabase（ポートは 554xx）
cp .env.example .env.local   # db:start の API_URL / PUBLISHABLE_KEY を記入
pnpm dev
```

ローカルのログイン: `dev@komame.local` / `password123`（`supabase/seed.sql`）

## DB

| コマンド | 内容 |
|---|---|
| `pnpm db:reset` | マイグレーションとシードを適用し直す |
| `pnpm db:test` | pgTAP テスト（RLS・制約）を実行 |
| `pnpm db:types` | `src/lib/database.types.ts` を再生成 |
| `pnpm db:push` | リンク済みの本番プロジェクトにマイグレーションを適用 |

スキーマを変えるときは `supabase migration new <name>` でファイルを作り、`db:reset` → `db:test` → `db:types` の順で確認する。

- データは household（世帯）単位で所有し、全テーブルを RLS で保護する
- サインアップは無効。本番のユーザーは Supabase ダッシュボードの「Add user」で作成する（作成時にトリガーで世帯と初期マスタが作られる）

## 本番

1. Supabase で Tokyo リージョンのプロジェクトを作成
2. `supabase login` → `supabase link --project-ref <ref>` → `pnpm db:push`
3. ダッシュボードで Authentication > Sign In / Providers の「Allow new users to sign up」をオフにし、自分のユーザーを作成
4. Vercel に GitHub リポジトリをインポートし、環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` を設定
5. Supabase の Authentication > URL Configuration の Site URL を Vercel の URL にする
