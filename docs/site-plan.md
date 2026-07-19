# カード一覧サイト 構築計画 (SSG + GitHub Pages)

> このドキュメントは**実装計画書**です。前提知識ゼロで読めるように書いています。
> フェーズ別の実行チェックリストは [`site-todo.md`](./site-todo.md) を参照してください。

## 1. 目的とゴール

`data/json/` にある正規化済みデータを使って、クラシックな日本発NFT(Counterparty系)を
一覧・検索できる**静的サイト(SSG)を構築し、GitHub Pages に公開**する。

- 公開URL(想定): `https://rarejapanesenfts.github.io/directory/`
  → **プロジェクトページ**なので base path は `/directory`。全アセット・リンクで考慮が必要。
- サーバー不要の完全静的サイト。ビルド成果物を GitHub Actions で Pages にデプロイする。

## 2. データの前提(サイトが読む入力)

すべて `data/json/` 配下。日英対訳は `{ "en": ..., "ja": ... }` 形式で、値が無ければ `null`。
詳細スキーマはリポジトリルートの `README.md` を参照。

| ファイル | 件数 | 主なフィールド |
|---|---|---|
| `nfts.json` | **646** | `id`(一意スラッグ), `name`, `slug.{en,ja}`, `description.{en,ja}`(多くが null), `artistId`, `seriesId`, `card`, `issued.date`(`YYYY-MM`), `issued.display.{en,ja}`, `totalSupply`, `chains[]`(`{name,url}`), `image.source`, `image.local`, `publishedAt` |
| `series.json` | **58** | `id`, `collectionId`, `collectionName`, `name`, `description.{en,ja}`(全 null), `nftCount` |
| `artists.json` | **79** | `id`, `name.{en,ja}`, `links.{twitter,opensea,website}`, `cpAddress`, `bio.{en,ja}`, `nftCount` |

カード ↔ シリーズ ↔ アーティストは `seriesId` / `artistId` で相互参照。ビルド時に join できる。

## 3. 既知の落とし穴(必読)

1. **画像カバレッジ 34%**: `image.local` が設定されているのは **646件中218件のみ**。
   残り約428件は画像が無い → **プレースホルダー表示が必須**。
2. **画像ソースパスが厄介**: `data/source/image/` 配下はシリーズ別フォルダで、フォルダ名に
   日本語・スペース・括弧を含む(例: `Genesis確定（2017-7-25 ローンチ済 25枚）/`)。
   末尾スペース付きファイル名(`XAORANGERG .gif`)や `2nd修正版/` の重複名も存在する。
   → **入力パスは `nfts.json` の `image.local` を機械的に読むだけ**にし、
   **出力名は一意な `image.source` から導出**して、厄介なパスを出力側へ持ち込まない。
3. **base path**: GitHub Pages プロジェクトページのため `/directory` プレフィックスが必要。
   SvelteKit の `paths.base` で一元管理し、内部リンク・画像URLは必ず `base` を経由させる。
4. **アニメGIF**: 27枚のGIFにはアニメーションがある。単純変換で静止画にしないよう、
   `sharp(input, { animated: true }).webp()` を使う(失敗時はGIFのままコピーにフォールバック)。
5. **descriptions/bios が null 中心**: 本文が無いカードが多い。UIは本文欠落を前提に組む。

## 4. 技術選定(決定事項)

| 項目 | 選定 | 理由 |
|---|---|---|
| フレームワーク | **SvelteKit + `@sveltejs/adapter-static`** | Vite + TS ベースで公式に完全SSG対応。646カードの個別ページのプリレンダーが標準機能で完結。React案(vike 等の追加ツールが必要)より構成がシンプルで、バンドルも軽量 |
| ビルド | **Vite + TypeScript** | 前提要件 |
| パッケージ管理/実行 | **Bun** | インストール高速。画像最適化スクリプトも `bun run` で実行 |
| 画像最適化 | **ビルド時に `sharp` スクリプト** | 下記 §7 の比較参照 |
| デプロイ | **GitHub Actions → `actions/deploy-pages`** | gh-pages ブランチ方式より設定が素直。ビルド成果物を直接 Pages Artifact 化 |

### React を選ぶ場合(不採用だが参考)
Vite ベースで完全SSGにするには vike(旧 vite-plugin-ssr)等が必要で、1,500超の
動的ページのプリレンダー設定に手数がかかる。SvelteKit の方が本用途では素直。

## 5. リポジトリ構成(サイト追加後)

既存の `data/` `scripts/`(Python)はそのまま残し、サイトは **`site/` サブディレクトリ**へ。

```
directory/
├── data/json/            # 既存(サイトのデータソース)
├── data/source/image/    # 既存(画像ソース)
├── scripts/              # 既存(Pythonデータ変換)
├── docs/                 # ★本計画ドキュメント
├── site/                 # ★SvelteKitアプリ
│   ├── package.json, bun.lock, svelte.config.js, vite.config.ts, tsconfig.json
│   ├── .gitignore        # node_modules, build, .svelte-kit, static/img, .image-cache
│   ├── scripts/optimize-images.ts       # ビルド時画像最適化(Bun + sharp)
│   ├── src/
│   │   ├── lib/data/types.ts            # Nft/Series/Artist 型定義
│   │   ├── lib/data/index.ts            # JSON読込 + join(card↔series↔artist)
│   │   ├── lib/data/images.json         # ★生成物: source名 → {thumb,full,width,height}
│   │   ├── lib/i18n.ts                  # locale型 / null時フォールバック
│   │   ├── lib/components/              # CardGrid, CardTile, FilterBar, Placeholder 等
│   │   ├── params/locale.ts             # param matcher (ja|en)
│   │   └── routes/
│   │       ├── +layout.ts               # prerender = true / trailingSlash = 'always'
│   │       ├── +page.svelte             # / → /ja/ リダイレクト
│   │       └── [locale]/
│   │           ├── +page.svelte                 # カード一覧(フィルタ/検索)
│   │           ├── cards/[id]/+page.(svelte|ts) # カード詳細 ×646
│   │           ├── series/[id]/+page.(svelte|ts)# シリーズ別一覧 ×58
│   │           └── artists/[id]/+page.(svelte|ts)# アーティスト別一覧 ×79
│   └── static/
│       ├── .nojekyll     # GitHub Pages で _ 始まりパスを配信するため必須
│       └── img/          # optimize-images.ts の出力先(gitignore)
└── .github/workflows/deploy.yml   # ★GitHub Pages デプロイ
```

> `site/` から `../data/json/` を参照する。`vite.config.ts` の `server.fs.allow` に
> リポジトリルートを含めて、プロジェクト外への import を許可する必要がある場合がある。

## 6. 主要設計

### 6.1 データ層 (`site/src/lib/data/`)
- **`types.ts`**: README のスキーマ通りに `Nft` / `Series` / `Artist` を定義。
  共通型 `type Localized = { en: string | null; ja: string | null }`。
- **`index.ts`**: 3つのJSONを Vite の JSON import で静的に読み込み、
  `Map<id, Nft>` などを構築。`getCardsBySeries(id)` / `getCardsByArtist(id)` /
  `joinCard(card)`(series・artist を埋めた表示用オブジェクトを返す)などを提供。
  ビルド時のみ実行される(各ルートの `+page.ts` load から呼ぶ)。

### 6.2 プリレンダー(全ページ静的化)
- ルート `+layout.ts` で `export const prerender = true;` と `export const trailingSlash = 'always';`。
- 動的ルートはクローラ任せにせず、`svelte.config.js` の `kit.prerender.entries` に
  **データから全URLを生成して明示列挙**する。総ページ数の目安:
  `2 locale × (1 一覧 + 646 カード + 58 シリーズ + 79 アーティスト) ≒ 1,568 ページ`。
  リンク切れによる生成漏れを防ぐため `entries` 明示を推奨(`handleHttpError` も設定)。

### 6.3 i18n
- URL: `/ja/...` と `/en/...`。`src/params/locale.ts` の matcher で `ja|en` のみ許可。
- テキスト解決ヘルパ `t(localized, locale)`: 指定 locale が null なら他方へフォールバック、
  両方 null なら空(UI側で非表示)。**本文 null が多い**ので全表示箇所でこれを通す。
- ルート `/` は `/ja/` への静的リダイレクトページ(`<meta http-equiv="refresh">` + JS)。

### 6.4 一覧ページ UX
- レスポンシブ CSS グリッド + カードタイル(サムネイル、`name`、シリーズ名、`issued.display`)。
- **クライアントサイド**のフィルタ(シリーズ/アーティストの select + テキスト検索)。
  状態は Svelte のリアクティビティのみ。ライブラリ追加なし。
  646件全件をクライアントに載せても軽量(数百KB程度のJSON)。

### 6.5 詳細ページ
- カード: 大きめ画像 or プレースホルダー、`name`、本文、発行情報、`totalSupply`、
  `chains[]` の外部リンク、アーティストページ・シリーズページへの内部リンク。
- シリーズ/アーティスト: メタ情報 + 所属カードのグリッド(一覧タイルを再利用)。

## 7. 画像パイプライン(ビルド時、`site/scripts/optimize-images.ts`)

### 設計
- 入力: `nfts.json` を読み、`image.local` が設定された **218件**を処理。
- **出力キー**: `image.source`(全646件で一意)から拡張子除去 + サニタイズした slug を使用。
  → 日本語・スペース・括弧を含む入力パスを出力側に持ち込まない。
- 生成物(→ `site/static/img/`、Bun + `sharp`):
  - **サムネイル**: 幅 400px WebP(一覧グリッド用)
  - **詳細用**: 最大幅 1200px WebP(原寸がそれ以下ならアップスケールしない)
  - **アニメGIF**: `sharp(input, { animated: true }).webp()` で animated WebP 化。
    変換に失敗したら元GIFをそのままコピーするフォールバック。
- **マニフェスト生成**: `src/lib/data/images.json` に `source名 → {thumb, full, width, height}`
  を出力。コンポーネントは `<img width height>` を付与して CLS を防止。
- **キャッシュ**: 入力ファイルのハッシュ + 変換設定を `site/.image-cache/manifest.json` に記録し、
  変更が無い画像はスキップ。CI では `actions/cache` でこのディレクトリを保持
  → 毎ビルドの再最適化を回避(242枚/75MBでも初回のみ数分、以降は数秒)。
- **プレースホルダー**: 画像なし約428件は共通プレースホルダー(カード名イニシャルを描く
  インライン SVG コンポーネント等)。追加のバイナリ生成は不要。
- `package.json` の build: `"build": "bun run scripts/optimize-images.ts && vite build"`。

### 代替案の比較(なぜビルド時 sharp か)
| 案 | 評価 |
|---|---|
| **ビルド時 sharp スクリプト(採用)** | JSON駆動で242枚を一括処理でき、CIキャッシュで実用的なビルド時間。リポジトリを汚さない。アニメGIF・サニタイズ・マニフェストを一箇所で制御できる |
| `vite-imagetools` / `@sveltejs/enhanced-img` | import 単位の最適化が前提で、JSON駆動の動的な画像集合には不向き(全画像の静的 import を生成する回避策が要る) |
| 事前生成してコミット | ビルドは速いがリポジトリが肥大化。再生成の規律が必要で、画像追加フローが二度手間 |
| ランタイムCDN(wsrv.nl 等) | ビルド不要だが外部サービス依存・可用性リスク。静的サイトの自己完結性を損なう |

## 8. GitHub Pages デプロイ (`.github/workflows/deploy.yml`)

- トリガー: `main` への push(+ PR ではビルドチェックのみ、デプロイなし)。
- ジョブ手順:
  1. `actions/checkout`
  2. `oven-sh/setup-bun`
  3. `actions/cache`(`site/.image-cache`, `site/node_modules` を restore/save)
  4. `bun install`(`site/` で)
  5. `bun run build`。環境変数 `BASE_PATH=/directory` を `svelte.config.js` の
     `kit.paths.base` に注入(ローカル開発では未設定 = 空でOK)。
  6. `actions/upload-pages-artifact`(`path: site/build`)
  7. `actions/deploy-pages`(`main` push 時のみ)
- **手動作業(1回だけ・計画外の唯一の手作業)**: リポジトリ設定 → Pages → Source を
  「GitHub Actions」に変更する必要がある。
- `static/.nojekyll` を配置(SvelteKit の `_app/` 配信のため必須)。

## 9. 実装フェーズ(概要)

詳細な着手可能タスクは [`site-todo.md`](./site-todo.md) にチェックリスト化。

1. **スキャフォールド**: `site/` に SvelteKit + adapter-static + TS を Bun で初期化、
   base path / trailingSlash / `.gitignore` 設定。空サイトで `bun run build` 成功。
2. **データ層 + ルーティング**: 型定義、loader/join、4種ページ(素朴なマークアップ)、
   prerender entries、i18n フォールバック。全 ~1,568 ページ生成成功。
3. **画像パイプライン**: `optimize-images.ts`(sharp・キャッシュ・GIF対応・manifest 出力)、
   プレースホルダー。
4. **一覧 UX**: グリッドデザイン、フィルタ/検索、詳細ページの体裁。
5. **デプロイ**: workflow 作成、Pages 設定、本番URL確認。
6. **仕上げ**: OGP/title 等メタタグ、サイトマップ、404ページ。

## 10. 検証方法

- `cd site && bun run build` — 全 ~1,568 ページの生成成功とビルド時間を確認。
- `bun run preview`(base path 付き)で以下をスポットチェック:
  - `/directory/ja/` 一覧のフィルタ/検索動作
  - 画像ありカード詳細(WebP 表示・アニメ WebP 再生)/ 画像なしカード(プレースホルダー)
  - `/en/` ルートと null フォールバック表示
  - 内部リンク・画像が base path 込みで壊れていないこと
- 画像キャッシュ: 2回目のビルドで最適化がスキップされること。
- push 後、Actions の成功と本番URL(`https://rarejapanesenfts.github.io/directory/`)の表示確認。
