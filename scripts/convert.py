#!/usr/bin/env python3
"""WordPressエクスポートCSVを正規化JSONに変換する。

入力:
  data/source/NFTs-Export-2022-June-11-0636.csv  (メインデータ、英日2レコード/作品)
  data/source/artists-enrichment.json            (scripts/enrich_artists.py の出力)
  data/source/image/                             (ローカル画像の照合に使用)

出力:
  data/json/nfts.json        全カードの配列(id昇順)
  data/json/series.json
  data/json/artists.json
  data/ISSUES.md             検出した品質課題のリスト

決定的(冪等)に出力する: 2回連続で実行しても git diff が出ないこと。
依存: 標準ライブラリのみ。
"""

import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "data" / "source" / "NFTs-Export-2022-June-11-0636.csv"
ENRICHMENT_PATH = ROOT / "data" / "source" / "artists-enrichment.json"
IMAGE_DIR = ROOT / "data" / "source" / "image"
JSON_DIR = ROOT / "data" / "json"
ISSUES_PATH = ROOT / "data" / "ISSUES.md"

# ソースCSVを更新した場合はここも更新する(変換結果の予期しない変動を検出するため)
EXPECTED_COUNTS = {"nfts": 646, "series": 58, "artists": 79}

MONTHS = {m: i + 1 for i, m in enumerate(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])}
FULL_MONTHS = {m: i + 1 for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July",
     "August", "September", "October", "November", "December"])}

JAPANESE_RE = re.compile(r"[぀-ヿ一-鿿]")
DUP_SUFFIX_RE = re.compile(r"\s*\(\d+\)$")
IMAGE_EXTS = {".png", ".gif", ".jpg", ".jpeg"}

# CSVのArtists表記 → アーティストxlsxの表記(同一人物の表記ゆれを吸収)
ENRICHMENT_ALIASES = {"空廻ロジカ《Sorane Logica》": "ロジカ"}

# 対訳ペアで一致すべき言語非依存フィールド(不一致は英語版を採用しISSUESへ)
SHARED_FIELDS = ["Title", "Artists", "artist_name", "collections",
                 "issued", "issued_ja", "total_supply", "card", "Blockchains"]


def slugify(text):
    """英数字以外をハイフンに置換したASCIIスラッグ。CJK・かなは保持する。"""
    text = unicodedata.normalize("NFKC", text).casefold().strip()
    out = []
    for ch in text:
        if ("a" <= ch <= "z") or ("0" <= ch <= "9") or JAPANESE_RE.match(ch):
            out.append(ch)
        else:
            out.append("-")
    return re.sub(r"-+", "-", "".join(out)).strip("-")


def parse_issued(raw, issues):
    """'Nov 2021' / 'July 2017' を ('2021-11', 'Nov 2021') に正規化する。"""
    raw = raw.strip()
    m = re.fullmatch(r"([A-Za-z]+) (\d{4})", raw)
    if not m:
        return None, raw or None
    month_word, year = m.group(1), int(m.group(2))
    if month_word in MONTHS:
        month = MONTHS[month_word]
        display = raw
    elif month_word in FULL_MONTHS:
        month = FULL_MONTHS[month_word]
        abbrev = list(MONTHS)[month - 1]
        display = f"{abbrev} {year}"
        issues["normalized"].append(
            f"issued `{raw}` → `{display}` (月名の表記ゆれを略称に統一)")
    else:
        return None, raw
    return f"{year:04d}-{month:02d}", display


def parse_int(raw):
    raw = raw.strip()
    return int(raw) if raw.isdigit() else None


def normalized_stem(name):
    stem = DUP_SUFFIX_RE.sub("", Path(name).stem.strip())
    return stem.upper()


def build_image_index():
    """data/source/image/ 配下の画像を 正規化stem → [相対パス] で索引化する。"""
    index = defaultdict(list)
    non_image = []
    for path in sorted(IMAGE_DIR.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in IMAGE_EXTS:
            non_image.append(path.relative_to(ROOT).as_posix())
            continue
        index[normalized_stem(path.name)].append(path.relative_to(ROOT).as_posix())
    return index, non_image


def match_image(name, featured_basename, index, claimed, issues):
    """Title → フィーチャー画像名の2段階でローカル画像を照合する。"""
    for key in (normalized_stem(name), normalized_stem(featured_basename)):
        candidates = index.get(key)
        if not candidates:
            continue
        # 複製サフィックス「 (1)」等が付かない素のファイル名を優先する
        plain = [p for p in candidates if normalized_stem(Path(p).name) == Path(p).stem.strip().upper()]
        chosen = sorted(plain or candidates)[0]
        if len(candidates) > 1:
            others = ", ".join(f"`{p}`" for p in sorted(candidates) if p != chosen)
            issues["image_multi"].append(
                f"**{name}**: 候補が複数。`{chosen}` を採用、他: {others}")
        claimed.update(candidates)
        return chosen
    return None


def load_rows():
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def pair_rows(rows, issues):
    """publish行を post_translations キーで英日ペアにまとめる。"""
    for row in rows:
        if row["Status"] != "publish":
            issues["drafts"].append(
                f"Title=`{row['Title'] or '(空)'}` Slug=`{row['Slug']}` (Status={row['Status']})")
    published = [r for r in rows if r["Status"] == "publish"]

    groups = defaultdict(list)
    for i, row in enumerate(published):
        key = row["post_translations"].strip() or f"__nokey_{i}"
        groups[key].append(row)

    pairs = []
    for key, members in groups.items():
        by_lang = {}
        for row in sorted(members, key=lambda r: r["Slug"]):
            lang = "en" if row["Languages"] == "English" else "ja"
            if lang in by_lang:
                issues["pairing"].append(
                    f"キー `{key}` に {row['Languages']} 行が複数。"
                    f"Slug=`{by_lang[lang]['Slug']}` を採用、`{row['Slug']}` を除外")
            else:
                by_lang[lang] = row
        if "en" not in by_lang or "ja" not in by_lang:
            only = "en" if "en" in by_lang else "ja"
            issues["pairing"].append(
                f"対訳が片方のみ: Title=`{by_lang[only]['Title']}` ({only}のみ)")
        pairs.append(by_lang)
    return pairs


def build_nft(pair, image_index, claimed_images, issues):
    en = pair.get("en") or pair["ja"]
    ja = pair.get("ja")

    # 言語非依存フィールドの英日不一致を検出(英語版を正とする)
    if ja is not None and pair.get("en") is not None:
        for field in SHARED_FIELDS + [f"chain_{k}_{i}" for i in range(1, 5)
                                      for k in ("name", "url")]:
            if en[field].strip() != ja[field].strip():
                issues["mismatch"].append(
                    f"**{en['Title']}** `{field}`: EN=`{en[field].strip() or '(空)'}` / "
                    f"JA=`{ja[field].strip() or '(空)'}` → EN値を採用")

    name = en["Title"].strip()

    chains = []
    for i in range(1, 5):
        chain_name = en[f"chain_name_{i}"].strip()
        chain_url = en[f"chain_url_{i}"].strip()
        if chain_name or chain_url:
            chains.append({"name": chain_name or None, "url": chain_url or None})
    if en["chain_name_0"].strip():
        issues["leftover"].append(
            f"**{name}**: `chain_name_0`=`{en['chain_name_0'].strip()}` は対応URLが無く"
            "chains配列に取り込めない(元CSV参照)")

    blockchains = {b.strip() for b in en["Blockchains"].split("|") if b.strip()}
    if blockchains and blockchains != {c["name"] for c in chains}:
        issues["mismatch"].append(
            f"**{name}** `Blockchains`(={en['Blockchains']}) が chains配列"
            f"(={'|'.join(c['name'] for c in chains)}) と不一致 → chains配列を正とする")

    card_raw = en["card"].strip()
    card = parse_int(card_raw)
    if card is None and card_raw:
        issues["normalized"].append(f"**{name}**: card=`{card_raw}` → null (数値でない)")

    date_iso, display_en = parse_issued(en["issued"], issues)
    if date_iso is None and en["issued"].strip():
        issues["normalized"].append(
            f"**{name}**: issued=`{en['issued']}` をパースできず date=null")

    en_slug = (pair["en"]["Slug"] if pair.get("en") else None)
    ja_slug = (pair["ja"]["Slug"] if ja is not None else None)
    nft_id = en_slug or ja_slug
    if en_slug and ja_slug and ja_slug != f"{en_slug}-ja":
        issues["slug"].append(f"**{name}**: JAスラッグ `{ja_slug}` が `{en_slug}-ja` 形式でない")

    desc_en = (pair["en"]["Content"].strip() or None) if pair.get("en") else None
    desc_ja = (ja["Content"].strip() or None) if ja is not None else None
    if desc_en and JAPANESE_RE.search(desc_en):
        issues["untranslated"].append(f"**{name}** (`{nft_id}`)")

    featured = en["Image Featured"].strip()
    featured_basename = featured.rsplit("/", 1)[-1] if featured else None
    local = None
    if featured_basename:
        local = match_image(name, featured_basename, image_index,
                            claimed_images, issues)

    return {
        "id": nft_id,
        "name": name,
        "slug": {"en": en_slug, "ja": ja_slug},
        "description": {"en": desc_en, "ja": desc_ja},
        "artistId": slugify(en["Artists"]),
        "seriesId": "/".join(slugify(p) for p in en["collections"].split(">") if p.strip()) or None,
        "card": card,
        "issued": {
            "date": date_iso,
            "display": {"en": display_en, "ja": en["issued_ja"].strip() or None},
        },
        "totalSupply": parse_int(en["total_supply"]),
        "chains": chains,
        "image": {"source": featured or None, "local": local},
        "publishedAt": en["Date"].strip() or None,
        "translationKey": en["post_translations"].strip() or None,
    }


def build_series(pairs):
    counts = defaultdict(int)
    labels = {}
    for pair in pairs:
        en = pair.get("en") or pair["ja"]
        raw = en["collections"].strip()
        if not raw:
            continue
        parts = [p.strip() for p in raw.split(">") if p.strip()]
        series_id = "/".join(slugify(p) for p in parts)
        counts[series_id] += 1
        labels[series_id] = parts
    series = []
    for series_id in sorted(counts):
        parts = labels[series_id]
        series.append({
            "id": series_id,
            "collectionId": slugify(parts[0]),
            "collectionName": parts[0],
            "name": parts[1] if len(parts) > 1 else None,
            # シリーズ紹介文は data/source/other/ の docx から将来転記する
            "description": {"en": None, "ja": None},
            "nftCount": counts[series_id],
        })
    return series


def build_artists(pairs, issues):
    counts = defaultdict(int)
    displays = defaultdict(set)
    for pair in pairs:
        en = pair.get("en") or pair["ja"]
        artist = en["Artists"].strip()
        if not artist:
            continue
        counts[artist] += 1
        display = en["artist_name"].strip()
        if display and display != artist:
            displays[artist].add(display)

    names = {}
    for artist in counts:
        variants = sorted(displays.get(artist, ()))
        names[artist] = variants[0] if variants else artist
        if len(variants) > 1:
            issues["artists"].append(
                f"`{artist}`: artist_name の表記が複数 ({', '.join(variants)})。"
                f"`{variants[0]}` を採用")

    enrichment = {}
    if ENRICHMENT_PATH.exists():
        enrichment = json.loads(ENRICHMENT_PATH.read_text(encoding="utf-8"))
    else:
        issues["artists"].append(
            f"`{ENRICHMENT_PATH.relative_to(ROOT)}` が無いため補足情報なしで生成 "
            "(scripts/enrich_artists.py を先に実行する)")

    artists = []
    ids = {}
    for artist in sorted(counts):
        artist_id = slugify(artist)
        if artist_id in ids:
            raise SystemExit(
                f"アーティストIDが衝突: `{artist}` と `{ids[artist_id]}` が共に `{artist_id}`")
        ids[artist_id] = artist
        xlsx_key = ENRICHMENT_ALIASES.get(artist, artist)
        extra = enrichment.get(xlsx_key, {})
        if extra and xlsx_key != artist:
            issues["artists"].append(
                f"`{artist}`: xlsxの `{xlsx_key}` 行と別名マップで紐付け")
        if not extra:
            issues["artists"].append(f"`{artist}`: アーティストxlsxに該当行なし(補足情報なし)")
        if extra.get("needsReview"):
            issues["artists"].append(f"`{artist}`: xlsxで「データ未入力or修正必要」フラグあり")
        note = extra.get("notes")
        if note:
            excerpt = " ".join(note.split())
            if len(excerpt) > 80:
                excerpt = excerpt[:80] + "…"
            issues["artists"].append(
                f"`{artist}`: xlsx「その他」欄の記載はJSON未収載(掲載可否は編集判断): {excerpt}")
        artists.append({
            "id": artist_id,
            "name": {"en": artist, "ja": names[artist]},
            "links": {
                "twitter": extra.get("twitter"),
                "opensea": extra.get("opensea"),
                "website": extra.get("website"),
            },
            "cpAddress": extra.get("cpAddress"),
            "bio": {"en": None, "ja": extra.get("bioJa")},
            "nftCount": counts[artist],
        })
    used_keys = {ENRICHMENT_ALIASES.get(a, a) for a in counts}
    for xlsx_name in sorted(set(enrichment) - used_keys):
        issues["artists"].append(
            f"`{xlsx_name}`: xlsxにあるがCSVのArtistsに存在しない(表記ゆれ or 未掲載作家)")
    return artists


def write_json(path, data):
    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


ISSUE_SECTIONS = [
    ("drafts", "除外した下書き(draft)レコード",
     "publishでないため JSON には含めていない。元CSVには残っている。"),
    ("pairing", "対訳ペアの異常",
     "英日1件ずつの想定から外れたレコード。"),
    ("mismatch", "対訳ペア間の言語非依存フィールド不一致",
     "英語版・日本語版で同一のはずの値が食い違っている。変換では英語版を正として採用した。"),
    ("duplicates", "同名トークンの重複レコード",
     "旧サイト由来で同じトークンが複数コレクションに別レコードとして掲載されている。"
     "作品数の集計時は二重計上に注意。"),
    ("normalized", "自動正規化した値",
     "機械的に安全と判断して変換時に正規化したもの。元CSVは未修整。"),
    ("leftover", "取り込めなかったデータ",
     "スキーマに載せられず JSON から欠落する情報。必要なら元CSVを参照。"),
    ("untranslated", "英語説明文に日本語が含まれる作品(未翻訳の可能性)", None),
    ("slug", "不規則な日本語スラッグ",
     "旧サイトURLとの互換性確認時に注意。"),
    ("image_multi", "同名のローカル画像が複数あるNFT", None),
    ("image_unclaimed", "どのNFTにも紐づかなかったローカル画像ファイル",
     "typo・複製・誤混入の可能性。"),
    ("image_missing", "ローカル画像が無いNFT",
     "`image.local` が null。画像は本番サイトURL(`image.source`)のみ存在する。"),
    ("artists", "アーティスト情報の突合結果", None),
    ("static", "ソースデータに関する既知の注意事項", None),
]

STATIC_NOTES = [
    "`data/source/other/ビンテージNFT日本人アーティスト状況.xlsx` と同名の「のコピー」ファイルが"
    "併存しており二重管理状態。変換には前者の「220526～追加分」シートを使用している。",
    "`data/source/image/Memorychain/Memorychiain transfer/` はフォルダ名にtypoあり(chiain)。",
    "`data/source/image/Oasis Mining/3rd確定(2017-9-17ローンチ済15枚)/WHOISSATOSHI.png.docx` は"
    "画像フォルダに誤混入したWordファイル。",
    "BitGirlsの出演者実名対応表が `data/source/other/データ入力.xlsx` にあるが、"
    "公開データに含めるかは編集判断が必要なため JSON 化していない。",
]


def write_issues(issues, summary):
    lines = [
        "# データ品質課題リスト",
        "",
        "`scripts/convert.py` が変換時に自動生成するファイル。手動で編集しない",
        "(課題を解消したら元データを修正して再変換する)。",
        "",
        f"変換サマリ: {summary}",
        "",
    ]
    for key, title, note in ISSUE_SECTIONS:
        items = issues.get(key, [])
        lines.append(f"## {title} ({len(items)}件)")
        lines.append("")
        if note:
            lines.append(note)
            lines.append("")
        if items:
            lines.extend(f"- {item}" for item in items)
        else:
            lines.append("- なし")
        lines.append("")
    ISSUES_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def main():
    issues = defaultdict(list)
    issues["static"] = list(STATIC_NOTES)

    rows = load_rows()
    pairs = pair_rows(rows, issues)
    image_index, non_image = build_image_index()
    issues["image_unclaimed"].extend(
        f"`{p}` (画像でない拡張子)" for p in non_image)

    claimed_images = set()
    nfts = sorted((build_nft(p, image_index, claimed_images, issues) for p in pairs),
                  key=lambda n: n["id"])
    series = build_series(pairs)
    artists = build_artists(pairs, issues)

    # 参照整合・一意性チェック
    nft_ids = [n["id"] for n in nfts]
    assert len(nft_ids) == len(set(nft_ids)), "NFT IDが重複"
    series_ids = {s["id"] for s in series}
    artist_ids = {a["id"] for a in artists}
    for nft in nfts:
        assert nft["seriesId"] is None or nft["seriesId"] in series_ids, nft["id"]
        assert nft["artistId"] in artist_ids, nft["id"]

    # 同名トークンの重複レコード検出(FoW/SoG両掲載など)
    by_name = defaultdict(list)
    for nft in nfts:
        by_name[nft["name"]].append(nft)
    for dup_name in sorted(by_name):
        group = by_name[dup_name]
        if len(group) < 2:
            continue
        ids = ", ".join(f"`{n['id']}`" for n in group)
        same_chains = all(n["chains"] == group[0]["chains"] for n in group[1:])
        detail = ("トークン照会URLも同一(オンチェーン上は同一資産の二重掲載)"
                  if same_chains else "チェーン情報は異なる")
        issues["duplicates"].append(f"**{dup_name}**: {ids} — {detail}")

    # 取り込んでいない旧スラッグ履歴の記録
    old_slug_rows = [r for r in rows
                     if r["Status"] == "publish" and r["_wp_old_slug"].strip()]
    if old_slug_rows:
        uniq = {r["_wp_old_slug"].strip() for r in old_slug_rows}
        issues["leftover"].append(
            f"`_wp_old_slug`(旧スラッグ履歴){len(old_slug_rows)}行・{len(uniq)}種は"
            "取り込んでいない(旧URLリダイレクト用。必要なら元CSV参照)")

    # 画像の消化状況
    all_images = {p for paths in image_index.values() for p in paths}
    for path in sorted(all_images - claimed_images):
        issues["image_unclaimed"].append(f"`{path}`")
    missing = [n for n in nfts if n["image"]["local"] is None]
    issues["image_missing"].extend(
        f"`{n['id']}` ({n['name']})" for n in missing)

    JSON_DIR.mkdir(parents=True, exist_ok=True)
    write_json(JSON_DIR / "nfts.json", nfts)
    write_json(JSON_DIR / "series.json", series)
    write_json(JSON_DIR / "artists.json", artists)

    counts = {"nfts": len(nfts), "series": len(series), "artists": len(artists)}
    summary = (f"NFT {counts['nfts']}件 / シリーズ {counts['series']}件 / "
               f"アーティスト {counts['artists']}名 "
               f"(入力 {len(rows)}行、ローカル画像照合 {len(nfts) - len(missing)}件)")
    write_issues(issues, summary)
    print(summary)

    if counts != EXPECTED_COUNTS:
        print(f"warning: 件数が想定と異なる (期待 {EXPECTED_COUNTS} / 実際 {counts})。"
              "ソースを意図的に更新した場合は EXPECTED_COUNTS を更新すること。",
              file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
