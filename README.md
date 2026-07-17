# Rare Japanese NFTs — Directory Data

クラシックな日本発NFT(Counterparty系: Memorychain / Oasis Mining / Japanese Rarepepe /
Badger Capsule / BitGirls / Force of Will など)を紹介するディレクトリサイトのためのデータリポジトリ。
現在はサイト構築前のデータ整理段階で、旧WordPressサイト(rarejapanesenfts.com)のエクスポートを
正規化したJSONを正とするデータ構造に移行している。

## ディレクトリ構成

```
data/
├── source/                  # 元データ(不変の入力。手を加えない)
│   ├── NFTs-Export-2022-June-11-0636.csv    # WordPressエクスポート(変換の入力)
│   ├── NFTs-Export-2022-June-11-0636 - sheet1.csv  # 上記の10列抜粋(参考。変換には未使用)
│   ├── artists-enrichment.json              # scripts/enrich_artists.py の出力(中間データ)
│   ├── image/               # ローカル画像 242枚(シリーズ別フォルダ)
│   └── other/               # Excel台帳・ホワイトペーパー・サイト文言などの原稿類
├── json/                    # ★正規化済みデータ(サイトはここを読む)
│   ├── nfts.json            # 全カードの配列(646作品、id昇順)
│   ├── series.json          # コレクション/シリーズ一覧(58件)
│   └── artists.json         # アーティスト一覧(79名)
└── ISSUES.md                # 変換時に自動検出した品質課題(自動生成。手動編集しない)
scripts/
├── convert.py               # CSV → data/json/ 変換(標準ライブラリのみ)
├── enrich_artists.py        # アーティストxlsx → artists-enrichment.json(要openpyxl)
└── requirements.txt
```

## データスキーマ

英語・日本語の対訳は1レコードに統合し、`{ "en": ..., "ja": ... }` 形式で保持する。
値が無い場合は `null`。

### `data/json/nfts.json`

全カードを1つの配列で持つ。各要素のスキーマ:

| フィールド | 説明 |
|---|---|
| `id` | 英語版スラッグ(全作品で一意) |
| `name` | トークン名(例: `PEPEBAZAAR`。言語共通) |
| `slug.{en,ja}` | 旧サイトのURLスラッグ(旧URL互換用) |
| `description.{en,ja}` | 作品解説 |
| `artistId` | `artists.json` の `id` への参照 |
| `seriesId` | `series.json` の `id` への参照(例: `memorychain/series-7`) |
| `card` | シリーズ内カード番号(不明 `??` は null) |
| `issued.date` | 発行年月 `YYYY-MM`(ソート・集計用) |
| `issued.display.{en,ja}` | 発行時期の表示用文字列(例: `Nov 2021` / `2021年11月`) |
| `totalSupply` | 発行数 |
| `chains[]` | `{name, url}` の配列。発行チェーンとトークン照会リンク(xchain.io等) |
| `image.source` | 旧サイトでのフィーチャー画像ファイル名(全646作品で一意)。旧サイトは閉鎖済みでURLは参照できないため、サイト構築時に画像を配置する際の紐付けキーとして使う |
| `image.local` | リポジトリ内で照合できた画像パス(無い作品は null。218/646件) |
| `publishedAt` | 旧サイトでの投稿日(来歴) |
| `translationKey` | 元CSVの対訳キー(再変換時の突合用) |

### `data/json/series.json`

`{id, collectionId, collectionName, name, description.{en,ja}, nftCount}` の配列。
`collections` の「プロジェクト > シリーズ」2階層をスラッグ化(例: `japanese-rarepepe/series-01`)。
`description` は現在すべて null — 将来 `data/source/other/RJN文言◎About&コレクションページ.docx`
から手動転記するための席。

### `data/json/artists.json`

`{id, name.{en,ja}, links.{twitter,opensea,website}, cpAddress, bio.{en,ja}, nftCount}` の配列。
CSVのアーティスト情報に `data/source/other/ビンテージNFT日本人アーティスト状況.xlsx`
(「220526～追加分」シート)の連絡先・紹介文をマージしたもの。

## 再生成手順

`data/json/` と `data/ISSUES.md` は生成物。手で直さず、元データを直して再生成する。

```bash
pip install -r scripts/requirements.txt   # openpyxl(enrich_artists.py にのみ必要)
python3 scripts/enrich_artists.py         # xlsx → data/source/artists-enrichment.json
python3 scripts/convert.py                # CSV → data/json/ + data/ISSUES.md
```

出力は決定的で、連続2回実行しても差分は出ない。件数が想定
(NFT 646 / シリーズ 58 / アーティスト 79)から変わると `convert.py` が警告を出すので、
ソースを意図的に更新した場合はスクリプト内の `EXPECTED_COUNTS` を合わせて更新する。

## 変換時のルール

- draft(下書き)2行は除外(詳細は `data/ISSUES.md`)
- 対訳ペアで言語非依存の値が食い違う場合は英語版を採用し、ISSUESに記録
- `issued` の月名表記ゆれ(`July 2017` 等)は略称に自動統一
- 元CSVのWordPress内部列・SEO列・全行空の列はJSONに含めない(元CSVに残っている)

## スコープ外(今後の課題)

- `data/source/other/` のdocx原稿(シリーズ紹介文・ホワイトペーパー・コラム)のJSON/Markdown化
- 画像のリネーム・再配置(ローカル画像は242枚と不完全なため、全量取得時にまとめて実施)
- BitGirls出演者の実名対応表(`データ入力.xlsx`)の扱い(公開可否の編集判断が必要)
- `data/ISSUES.md` に列挙された元データの修正(typo画像ファイル、xlsxの二重管理など)
