#!/usr/bin/env python3
"""ビンテージNFT日本人アーティスト状況.xlsx からアーティスト補足情報を抽出する。

出力: data/source/artists-enrichment.json
このファイルは convert.py が artists.json を組み立てる際にマージする中間データ。
xlsx を編集したらこのスクリプトを再実行してから convert.py を実行する。

依存: openpyxl (scripts/requirements.txt)
"""

import json
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "data" / "source" / "other" / "ビンテージNFT日本人アーティスト状況.xlsx"
OUT = ROOT / "data" / "source" / "artists-enrichment.json"

# 「220526～追加分」が最新の全量シート(「220524入力済み」は旧版)
SHEET = "220526～追加分"

COLUMNS = {
    "データ未入力or修正必要": "needsReview",
    "Artists": "name",
    "Twitter": "twitter",
    "Opensea": "opensea",
    "CPアドレス": "cpAddress",
    "Website": "website",
    "アーティスト紹介文（外注し、英訳する予定です。）": "bioJa",
    "その他何かあれば": "notes",
}


def clean(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def main():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb[SHEET]
    rows = list(ws.iter_rows(values_only=True))
    header = [clean(c) for c in rows[0]]
    mapping = {i: COLUMNS[h] for i, h in enumerate(header) if h in COLUMNS}

    entries = {}
    for row in rows[1:]:
        record = {
            key: clean(row[i]) if i < len(row) else None
            for i, key in mapping.items()
        }
        name = record.pop("name")
        if not name:
            continue
        record["needsReview"] = record.get("needsReview") == "True"
        entries[name] = record

    OUT.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {OUT.relative_to(ROOT)}: {len(entries)} artists")


if __name__ == "__main__":
    main()
