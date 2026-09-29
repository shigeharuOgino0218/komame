# AGENTS.md

komame は「使ったら、こまめに。」を掲げる家計簿 PWA。開いた瞬間に金額を記録できることを最優先にする。
機能を足すより入力の速さを守る。MVP の範囲外（外部連携・共有 UI・予算など）は頼まれるまで作らない。

## スタック

React 19 / React Router 8（データモード）/ TanStack Query / Supabase（Postgres・Auth・RLS）/ Tailwind v4 / shadcn/ui（base-ui）/ Vite 8 / pnpm 11 / mise

## コマンド

```bash
mise install && pnpm install
pnpm db:start     # ローカル Supabase（Docker 必須、ポート 554xx）
pnpm dev
pnpm lint && pnpm build && pnpm test && pnpm db:test   # 変更後に必ず通す
```

- スキーマ変更: `supabase migration new <name>` → `pnpm db:reset` → `pnpm db:test` → `pnpm db:types`
- 本番への適用は `pnpm db:push`（ユーザーの確認を取ってから）

## 構成

- `src/features/<機能>/` 画面・フック・API をまとめる（entry / transactions / summary / masters / auth / settings）
- `src/lib/` React に依存しないロジック（`date.ts` `money.ts` `uuid.ts`）と Supabase クライアント
- `src/lib/database.types.ts` は生成物。手で編集しない
- `src/components/ui/` は shadcn の生成物
- ファイル名は kebab-case、import は `@/` エイリアス

## DB のルール

- データの所有単位は household（世帯）。新しいテーブルには `household_id` を持たせ、RLS を有効にして `household_id in (select private.my_household_ids())` で制限する。anon には権限を与えない
- 列挙は Postgres enum ではなく `text + CHECK`
- 金額は `integer`（円）で正の値。符号は `type`（expense / income / transfer）で表す
- 利用日は `occurred_on date`（JST）。「今日」はクライアントでは必ず `lib/date.ts` の `todayYmd()` で決める
- `category_id` / `payment_method_id` は NULL 可（未分類）。他世帯の参照は複合 FK で防いでいる
- 外部明細は `source` + `external_id` の UNIQUE 制約で重複を防ぐ。手入力は `source = 'manual'`、`external_id` は NULL
- push 済みのマイグレーションは編集しない。新しいマイグレーションを追加する

## 注意点

- 金額入力は自前テンキー。iOS は起動時に OS キーボードを出せないので `input` に置き換えない
- 保存は楽観的更新。id はクライアントで `lib/uuid.ts` の `uuid()` で生成し、upsert で冪等にする
- `VITE_` 付きの環境変数はビルド時にブラウザ向けの JS へ埋め込まれる。secret キーを入れない。未設定のままビルドすると画面が真っ白になる
- `supabase/config.toml` の `[auth.email] enable_signup` は `true` のまま（false にするとメールログイン自体が無効になる）。サインアップの無効化は `[auth] enable_signup = false` で行う
- pnpm 11 の minimumReleaseAge ポリシーに引っかかった場合、ポリシーは緩めずにバージョンを解決し直す

## Git

- Phase・機能ごとにブランチを切り、手順ごとにコミットして PR を作る。main へ直接コミットしない

## デプロイ

フロントは Vercel の GitHub 連携で自動デプロイされる（Vercel CLI は使わない）。ブランチの push で Preview、main へのマージで Production が作られる。

1. 作業中のブランチと関係ない修正は `origin/main` から新しいブランチを切って載せる（未マージの PR に混ぜない）
2. `pnpm lint && pnpm build && pnpm test && pnpm db:test` を通してコミットし、push して `gh pr create`
3. マイグレーションを含むなら、マージ前に `pnpm db:push` で本番 DB に適用する（ユーザーの確認を取ってから）。フロントが新しい列を参照するため、DB を先に進める。適用状況は `supabase migration list --linked` で確認できる
4. `gh pr merge <番号> --merge --delete-branch` でマージする（履歴はマージコミットで残している）
5. 反映を確認する: `gh api repos/shigeharuOgino0218/komame/deployments --jq '.[0] | {environment, sha, created_at}'` で main のマージコミットに対する `Production` のデプロイがあること、`gh api repos/shigeharuOgino0218/komame/deployments/<id>/statuses --jq '.[0].state'` が `success` になること
