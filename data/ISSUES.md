# データ品質課題リスト

`scripts/convert.py` が変換時に自動生成するファイル。手動で編集しない
(課題を解消したら元データを修正して再変換する)。

変換サマリ: NFT 646件 / シリーズ 58件 / アーティスト 79名 (入力 1294行、ローカル画像照合 645件)

## 除外した下書き(draft)レコード (2件)

publishでないため JSON には含めていない。元CSVには残っている。

- Title=`SHITTO` Slug=`` (Status=draft)
- Title=`(空)` Slug=`` (Status=draft)

## 対訳ペアの異常 (0件)

英日1件ずつの想定から外れたレコード。

- なし

## 対訳ペア間の言語非依存フィールド不一致 (9件)

英語版・日本語版で同一のはずの値が食い違っている。変換では英語版を正として採用した。

- **DOGEMUSK** `Blockchains`: EN=`Counterparty` / JA=`Counterparty|Monaparty` → EN値を採用
- **SOGRAID** `Blockchains`: EN=`(空)` / JA=`Counterparty` → EN値を採用
- **GOLEMNET** `Blockchains`: EN=`(空)` / JA=`Counterparty` → EN値を採用
- **SINGULARDTV** `Blockchains`: EN=`(空)` / JA=`Counterparty` → EN値を採用
- **NEMBALLOON** `Blockchains`: EN=`(空)` / JA=`Counterparty` → EN値を採用
- **DAMENFT** `Blockchains`: EN=`Counterparty|Ethereum|Monaparty|Polygon` / JA=`Counterparty` → EN値を採用
- **DAMENFT** `Blockchains`(=Counterparty|Ethereum|Monaparty|Polygon) が chains配列(=Counterparty|Monaparty) と不一致 → chains配列を正とする
- **YANAGINIPEPE** `Blockchains`: EN=`Counterparty` / JA=`(空)` → EN値を採用
- **PEPEMOM** `Blockchains`: EN=`Counterparty` / JA=`(空)` → EN値を採用

## 同名トークンの重複レコード (5件)

旧サイト由来で同じトークンが複数コレクションに別レコードとして掲載されている。作品数の集計時は二重計上に注意。

- **FWCFCFIERYCC**: `fwcfcfierycc`, `fwcfcfierycc-sog` — トークン照会URLも同一(オンチェーン上は同一資産の二重掲載)
- **FWCFCTHEMONC**: `fwcfcthemonc`, `fwcfcthemonc-sog` — トークン照会URLも同一(オンチェーン上は同一資産の二重掲載)
- **FWCFCUMRATTC**: `fwcfcumrattc`, `fwcfcumrattc-sog` — トークン照会URLも同一(オンチェーン上は同一資産の二重掲載)
- **FWSDLFIETHSC**: `fwsdlfiethsc`, `fwsdlfiethsc-sog` — トークン照会URLも同一(オンチェーン上は同一資産の二重掲載)
- **FWSDLICEDRAC**: `fwsdlicedrac`, `fwsdlicedrac-sog` — トークン照会URLも同一(オンチェーン上は同一資産の二重掲載)

## 自動正規化した値 (16件)

機械的に安全と判断して変換時に正規化したもの。元CSVは未修整。

- issued `July 2017` → `Jul 2017` (月名の表記ゆれを略称に統一)
- issued `October 2017` → `Oct 2017` (月名の表記ゆれを略称に統一)
- **ZAIFCARD**: card=`??` → null (数値でない)
- **SHUMAICARD**: card=`??` → null (数値でない)
- **CNPCARD**: card=`??` → null (数値でない)
- **CCMCARD**: card=`??` → null (数値でない)
- **COINPORTALCD**: card=`??` → null (数値でない)
- **WHEREBCYCARD**: card=`??` → null (数値でない)
- **SARUTOBICARD**: card=`??` → null (数値でない)
- **GOXCARD**: card=`??` → null (数値でない)
- **DOGECOINCARD**: card=`??` → null (数値でない)
- **FWCFCFIERYCC**: card=`??` → null (数値でない)
- **FWCFCUMRATTC**: card=`??` → null (数値でない)
- **FWCFCTHEMONC**: card=`??` → null (数値でない)
- **FWSDLICEDRAC**: card=`??` → null (数値でない)
- **FWSDLFIETHSC**: card=`??` → null (数値でない)

## 取り込めなかったデータ (3件)

スキーマに載せられず JSON から欠落する情報。必要なら元CSVを参照。

- **PEPEBAZAAR**: `chain_name_0`=`Counterparty` は対応URLが無くchains配列に取り込めない(元CSV参照)
- **IDOJAWAN**: `chain_name_0`=`Tron` は対応URLが無くchains配列に取り込めない(元CSV参照)
- `_wp_old_slug`(旧スラッグ履歴)444行・225種は取り込んでいない(旧URLリダイレクト用。必要なら元CSV参照)

## 英語説明文に日本語が含まれる作品(未翻訳の可能性) (27件)

- **PEPEBAZAAR** (`pepebazaar`)
- **IDOJAWAN** (`idojawan`)
- **LOVENFT** (`lovenft`)
- **NOMOREDEFI** (`nomoredefi`)
- **HWFASHION** (`hwfashion`)
- **KAMATTE** (`kamatte`)
- **FIRSTPEN** (`firstpen`)
- **HAGEPEPE** (`hagepepe`)
- **KOEDAME** (`koedame`)
- **NOBUNSAN** (`nobunsan`)
- **OSHIKOMARE** (`oshikomare`)
- **NOTSOON** (`notsoon`)
- **SHIBACOINER** (`shibacoiner`)
- **GOXGIRL** (`goxgirl`)
- **SHITTO** (`shitto`)
- **DOGEMUSK** (`dogemusk`)
- **WACKNAKAMOTO** (`wacknakamoto`)
- **WACKWATANABE** (`wackwatanabe`)
- **KOJIPEPE** (`kojipepe`)
- **WAGUPEPE** (`wagupepe`)
- **JOSHIKI** (`joshiki`)
- **SCAMWAY** (`scamway`)
- **INUCOINER** (`inucoiner`)
- **MAKAI** (`makai`)
- **NFTZUKAMI** (`nftzukami`)
- **TAKANELASER** (`takanelaser`)
- **TAKANEZUKAMI** (`takanezukami`)

## 不規則な日本語スラッグ (4件)

旧サイトURLとの互換性確認時に注意。

- **MCDUMPING**: JAスラッグ `mcdumping-2` が `mcdumping-ja` 形式でない
- **PEPETARO**: JAスラッグ `pepetaro-2` が `pepetaro-ja` 形式でない
- **PEPESURFING**: JAスラッグ `pepesurfing-2` が `pepesurfing-ja` 形式でない
- **PEPEDJ**: JAスラッグ `pepedj-2` が `pepedj-ja` 形式でない

## 同名のローカル画像が複数あるNFT (18件)

- **MASTERINGPC**: 候補が複数。`data/source/image/Memorychain/Fantastic fourth(38-54)/MASTERINGPC.png` を採用、他: `data/source/image/Memorychain/Sixth sense/MASTERINGPC.png`
- **ESTOPIA**: 候補が複数。`data/source/image/Memorychain/Lucky 7/ESTOPIA.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/ESTOPIA (2).png`
- **CCLOVERSBTC**: 候補が複数。`data/source/image/Memorychain/Memorychiain transfer/CCLOVERSBTC.png` を採用、他: `data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/CCLOVERSBTC.png`
- **CHAOO**: 候補が複数。`data/source/image/Memorychain/Memorychiain transfer/CHAOO.png` を採用、他: `data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/CHAOO.png`
- **ETHTATTOO**: 候補が複数。`data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/ETHTATTOO.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/ETHTATTOO (1).png`
- **IDOLNEMONE**: 候補が複数。`data/source/image/Memorychain/Memorychiain transfer/IDOLNEMONE.png` を採用、他: `data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/IDOLNEMONE.png`
- **NEMBAE**: 候補が複数。`data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/NEMBAE.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/NEMBAE (2).png`
- **PEPEEYES**: 候補が複数。`data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/PEPEEYES.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/PEPEEYES (1).png`
- **PRINCESSNEM**: 候補が複数。`data/source/image/Memorychain/Memorychiain transfer/PRINCESSNEM.png` を採用、他: `data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/PRINCESSNEM.png`
- **SNCOLDHEARTB**: 候補が複数。`data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/SNCOLDHEARTB.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/SNCOLDHEARTB (1).png`
- **XRPBAACHAN**: 候補が複数。`data/source/image/Oasis Mining/Genesis確定（2017-7-25 ローンチ済 25枚）/XRPBAACHAN.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/XRPBAACHAN (1).png`
- **BLACKSMITHS**: 候補が複数。`data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/2nd修正版/BLACKSMITHS.png` を採用、他: `data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/BLACKSMITHS.png`
- **CODEISLAW**: 候補が複数。`data/source/image/Memorychain/Memorychiain transfer/CODEISLAW.png` を採用、他: `data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/CODEISLAW.png`
- **EHARDFORK**: 候補が複数。`data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/EHARDFORK.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/EHARDFORK (1).png`
- **MONABAACHAN**: 候補が複数。`data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/MONABAACHAN.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/MONABAACHAN (1).png`
- **NEMBAACHAN**: 候補が複数。`data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/NEMBAACHAN.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/NEMBAACHAN (1).png`
- **XAORANGERG**: 候補が複数。`data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/2nd修正版/XAORANGERG.gif` を採用、他: `data/source/image/Oasis Mining/2nd確定(2017-8-8 ローンチ済 26枚)/XAORANGERG .gif`
- **GACHIHO**: 候補が複数。`data/source/image/Oasis Mining/3rd確定(2017-9-17ローンチ済15枚)/GACHIHO.png` を採用、他: `data/source/image/Memorychain/Memorychiain transfer/GACHIHO (1).png`

## どのNFTにも紐づかなかったローカル画像ファイル (7件)

typo・複製・誤混入の可能性。

- `data/source/image/Oasis Mining/3rd確定(2017-9-17ローンチ済15枚)/WHOISSATOSHI.png.docx` (画像でない拡張子)
- `data/source/image/ETHENTERPRIS.png`
- `data/source/image/ETHMETOROPOLI.png`
- `data/source/image/ETHSERENITY.png`
- `data/source/image/NEMAPOSTILLE.png`
- `data/source/image/TENBURGER.png`
- `data/source/image/WHITECERBERU.png`

## ローカル画像が無いNFT (1件)

`image.local` が null。旧サイトでの画像ファイル名(`image.source`)のみ判明しており、実ファイルは未取得。画像を入手したらファイル名で紐付けられる。

- `dogemusk` (DOGEMUSK)

## アーティスト情報の突合結果 (7件)

- `pom779`: xlsx「その他」欄の記載はJSON未収載(掲載可否は編集判断): 私は作品がBadger capsuleシリーズのみですが、「作者アクティブ」状態です。
- `ごっつ`: xlsx「その他」欄の記載はJSON未収載(掲載可否は編集判断): 特定のカードを売る気がない、秘密鍵が紛失した、アーティスト名を変更したいなど。 ーーーー サイトに下記の4項目を設定・表示させる予定です。 作者アクティブ：作者…
- `タヌ神`: アーティストxlsxに該当行なし(補足情報なし)
- `念能力ﾄﾚｰﾀﾞｰℳ`: xlsx「その他」欄の記載はJSON未収載(掲載可否は編集判断): 秘密鍵紛失https://twitter.com/crypto_M_esi/status/1450762458516242437?s=20&t=XpEGh32N…
- `空廻ロジカ《Sorane Logica》`: xlsxの `ロジカ` 行と別名マップで紐付け
- `空廻ロジカ《Sorane Logica》`: xlsx「その他」欄の記載はJSON未収載(掲載可否は編集判断): 空廻ロジカ《Sorane Logica》
- `藤堂竜白`: xlsx「その他」欄の記載はJSON未収載(掲載可否は編集判断): メモチェンカード図鑑(http://kasaneate.starfree.jp/mc/)・レアペペディレクトリ(http://kasaneate.starfre…

## ソースデータに関する既知の注意事項 (5件)

- 旧サイト(rarejapanesenfts.com)は閉鎖済みで、CSV中の画像URLは参照できない。このためJSONにはURLを保持せず、画像ファイル名(`image.source`。全646作品で一意)のみを識別子として保持している。
- `data/source/other/ビンテージNFT日本人アーティスト状況.xlsx` と同名の「のコピー」ファイルが併存しており二重管理状態。変換には前者の「220526～追加分」シートを使用している。
- `data/source/image/Memorychain/Memorychiain transfer/` はフォルダ名にtypoあり(chiain)。
- `data/source/image/Oasis Mining/3rd確定(2017-9-17ローンチ済15枚)/WHOISSATOSHI.png.docx` は画像フォルダに誤混入したWordファイル。
- BitGirlsの出演者実名対応表が `data/source/other/データ入力.xlsx` にあるが、公開データに含めるかは編集判断が必要なため JSON 化していない。
