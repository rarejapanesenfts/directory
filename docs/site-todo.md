# カード一覧サイト 実装 TODO

> フェーズ別の着手可能タスク。各項目は**単独で着手でき、完了条件が検証可能**な粒度。
> 設計の背景・理由は [`site-plan.md`](./site-plan.md) を参照。
> セッションをまたいで進捗管理するため、完了したら `[ ]` → `[x]` に更新する。

## 開始前チェック(次セッションの最初にやること)
- [ ] `git branch --show-current` が `claude/card-list-ssg-planning-lbejau`(または新規実装ブランチ)であることを確認
- [ ] `data/json/nfts.json` / `series.json` / `artists.json` が存在し、それぞれ 646 / 58 / 79 件あることを確認
- [ ] `bun --version` が使えることを確認(なければ Node + npm で代替可)
- [ ] `site-plan.md` の §3「既知の落とし穴」に目を通す

---

## フェーズ1: スキャフォールド
**ゴール: 空のSvelteKitサイトが `bun run build` で静的生成でき、Pages向け設定が入っている。**

- [ ] `site/` に SvelteKit を初期化(TypeScript, Vite ベース)
- [ ] `@sveltejs/adapter-static` を導入し `svelte.config.js` に設定
- [ ] `kit.paths.base` を `process.env.BASE_PATH ?? ''` に設定(本番は `/directory`、ローカルは空)
- [ ] `kit.prerender` と `trailingSlash = 'always'` を設定
- [ ] `static/.nojekyll` を作成
- [ ] `site/.gitignore` に `node_modules`, `build`, `.svelte-kit`, `static/img`, `.image-cache` を追加
- [ ] `sharp` を devDependency に追加
- [ ] **完了条件**: 空サイトで `cd site && bun install && bun run build` が成功し、`site/build/` に `index.html` が出る

## フェーズ2: データ層 + ルーティング
**ゴール: 全 ~1,568 ページ(2 locale × データ件数)が中身付きでプリレンダーされる。**

- [ ] `src/lib/data/types.ts`: `Nft` / `Series` / `Artist` と共通型 `Localized` を定義
- [ ] `src/lib/data/index.ts`: 3つのJSONを import し join ヘルパ(`joinCard`, `getCardsBySeries`, `getCardsByArtist`)を実装
  - [ ] `../data/json/` を参照できるよう `vite.config.ts` の `server.fs.allow` を調整(必要なら)
- [ ] `src/lib/i18n.ts`: `Locale = 'ja' | 'en'` と `t(localized, locale)`(null フォールバック)を実装
- [ ] `src/params/locale.ts`: `ja|en` の param matcher
- [ ] `src/routes/+layout.ts`: `prerender = true`, `trailingSlash = 'always'`
- [ ] `src/routes/+page.svelte`: `/` → `/ja/` リダイレクト
- [ ] `[locale]/+page.svelte`: カード一覧(まずは素朴なリスト表示)
- [ ] `[locale]/cards/[id]/`: カード詳細(load で id 解決)
- [ ] `[locale]/series/[id]/`: シリーズ別一覧
- [ ] `[locale]/artists/[id]/`: アーティスト別一覧
- [ ] `svelte.config.js` の `kit.prerender.entries` に全URLをデータから生成して列挙
- [ ] **完了条件**: `bun run build` が全 ~1,568 ページを生成し、リンク切れ/prerender エラーが無い

## フェーズ3: 画像パイプライン
**ゴール: 218枚が最適化WebP化され、欠落カードはプレースホルダー表示される。**

- [ ] `site/scripts/optimize-images.ts`: `nfts.json` の `image.local` を持つ218件を処理
  - [ ] 出力名は `image.source` 由来の slug(拡張子除去 + サニタイズ)
  - [ ] サムネイル(幅400 WebP)と詳細用(最大幅1200 WebP)を生成
  - [ ] アニメGIF は `{ animated: true }` で animated WebP 化、失敗時はGIFコピーにフォールバック
  - [ ] `src/lib/data/images.json`(source → {thumb, full, width, height})を出力
  - [ ] `.image-cache/manifest.json` でハッシュキャッシュ、未変更はスキップ
- [ ] `package.json` の build を `bun run scripts/optimize-images.ts && vite build` に変更
- [ ] プレースホルダーコンポーネント(カード名イニシャルのインラインSVG等)
- [ ] カードタイル/詳細ページを画像 or プレースホルダー表示に接続(`<img width height>` 付与)
- [ ] **完了条件**: ビルド後 `static/img/` に WebP が生成され、2回目のビルドで最適化がスキップされる。画像なしカードでプレースホルダーが出る

## フェーズ4: 一覧 UX + 体裁
**ゴール: 実用的な見た目とフィルタ/検索。**

- [ ] `CardGrid` / `CardTile` コンポーネント(レスポンシブCSSグリッド)
- [ ] `FilterBar`: シリーズ/アーティスト select + テキスト検索(クライアントサイド、ライブラリなし)
- [ ] カード詳細: `chains[]` 外部リンク、アーティスト/シリーズへの内部リンク、発行情報・totalSupply
- [ ] シリーズ/アーティストページ: メタ情報 + 所属カードグリッド(タイル再利用)
- [ ] 内部リンク・画像URLがすべて `base`(paths.base)経由になっていることを確認
- [ ] **完了条件**: `bun run preview` でフィルタ/検索が動作し、詳細・シリーズ・アーティスト間の回遊ができる

## フェーズ5: デプロイ
**ゴール: push で自動的に GitHub Pages が更新される。**

- [ ] `.github/workflows/deploy.yml` を作成(checkout → setup-bun → cache → install → build(`BASE_PATH=/directory`)→ upload-pages-artifact → deploy-pages)
- [ ] PR ではビルドチェックのみ(deploy ジョブは `main` push 限定)
- [ ] `actions/cache` で `site/.image-cache` を保持
- [ ] **手動**: リポジトリ設定 → Pages → Source を「GitHub Actions」に変更
- [ ] **完了条件**: `main` への push 後、Actions が成功し `https://rarejapanesenfts.github.io/directory/` が表示される

## フェーズ6: 仕上げ
**ゴール: 公開品質。**

- [ ] `<title>` / OGP / description メタタグ(ページ別・locale別)
- [ ] `sitemap.xml`(prerender entries から生成)
- [ ] 404ページ
- [ ] 言語切り替えUI(同一ページの他 locale へのリンク)
- [ ] README にサイトの説明とローカル起動手順を追記
- [ ] **完了条件**: Lighthouse で大きな問題が無く、SNS共有時にOGPが出る

---

## 未確定・要判断(実装中に相談が必要になりうる点)
- 画像未取得の約428件をどう見せるか(プレースホルダーのデザイン水準)
- 英語本文/日本語本文が両方 null のカードの詳細ページの見せ方
- BitGirls 実名など公開センシティブなデータの扱い(README スコープ外項目)
- デザインの方向性(トーン&マナー、ダーク/ライト対応の要否)
