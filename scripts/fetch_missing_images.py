#!/usr/bin/env python3
"""ローカル画像が無いNFTのカード画像を tokenscan.io から回収する。

data/json/nfts.json のうち `image.local` が null の作品(旧サイト閉鎖により
画像実体が手元に無い)について、Counterparty ブロックエクスプローラの
tokenscan.io(旧 xchain.io の後継)から画像を取得する。

取得ルート(順に試行):
  1. https://tokenscan.io/api/asset/{ASSET} の description に
     「imgur/xxxx.png;ASSET」形式の参照があれば https://i.imgur.com/ から取得
  2. https://tokenscan.io/img/cards/{ASSET}.{ext} を拡張子総当たりで取得
     (image.source の拡張子を最優先。実体の拡張子が source と違う例あり)

保存先は data/source/image/Recovered/{コレクションID}/{sourceのstem}.{実際の拡張子}。
ファイル名を image.source の stem に合わせることで、scripts/convert.py の
featured_basename 照合がそのまま効く(保存後に convert.py を再実行すること)。
Force of Will と Japanese SOG で同一アセットを共有する5組は stem も同一なので
1ファイルにまとめ、両カードから照合される。

取得元URL・ハッシュ等の来歴は data/source/image-recovered.json に記録する。
既に保存済みのファイルはスキップするので再実行は差分のみ。
"""
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NFTS_PATH = ROOT / "data" / "json" / "nfts.json"
OUT_DIR = ROOT / "data" / "source" / "image" / "Recovered"
MANIFEST_PATH = ROOT / "data" / "source" / "image-recovered.json"

API_URL = "https://tokenscan.io/api/asset/{asset}"
CARD_URL = "https://tokenscan.io/img/cards/{asset}.{ext}"
IMGUR_URL = "https://i.imgur.com/{file}"
USER_AGENT = ("rarejapanesenfts-directory/1.0 "
              "(one-off card image recovery; github.com/rarejapanesenfts/directory)")
REQUEST_INTERVAL = 0.6  # 秒。エクスプローラへの礼儀としてのレート制限
TRY_EXTS = ["png", "jpg", "jpeg", "gif"]

# description 中の imgur 参照(例: "imgur/348lKGr.png;SCAMWAY")
IMGUR_RE = re.compile(
    r"(?:https?://)?(?:i\.)?imgur(?:\.com)?/([A-Za-z0-9]+\.(?:png|gif|jpe?g))",
    re.IGNORECASE)

MAGIC = [(b"\x89PNG\r\n\x1a\n", "png"), (b"GIF87a", "gif"),
         (b"GIF89a", "gif"), (b"\xff\xd8\xff", "jpg")]

_last_request = 0.0


def throttle():
    global _last_request
    wait = _last_request + REQUEST_INTERVAL - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last_request = time.monotonic()


def fetch(url, retries=3):
    """URLを取得して (bytes, content_type) を返す。404はNone、他は指数バックオフで再試行。"""
    for attempt in range(retries):
        throttle()
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                return res.read(), res.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None, None
            if attempt == retries - 1:
                print(f"    HTTP {e.code}: {url}", file=sys.stderr)
                return None, None
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            if attempt == retries - 1:
                print(f"    失敗 {e}: {url}", file=sys.stderr)
                return None, None
        time.sleep(2 ** attempt)
    return None, None


def sniff_ext(data):
    for magic, ext in MAGIC:
        if data.startswith(magic):
            return ext
    return None


def image_urls_for(asset, source_ext):
    """試行する画像URLを優先順に列挙する。"""
    body, _ = fetch(API_URL.format(asset=asset))
    description = ""
    if body:
        try:
            description = json.loads(body).get("description") or ""
        except json.JSONDecodeError:
            pass
    m = IMGUR_RE.search(description)
    if m:
        yield IMGUR_URL.format(file=m.group(1)), description
    exts = [source_ext] + [e for e in TRY_EXTS if e != source_ext]
    for ext in exts:
        yield CARD_URL.format(asset=asset, ext=ext), description


def main():
    nfts = json.loads(NFTS_PATH.read_text(encoding="utf-8"))
    manifest = {}
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    # stem(=convert.pyの照合キー)単位でまとめる。共有アセットは1ファイルに集約
    targets = {}
    for nft in nfts:
        if nft["image"]["local"]:
            continue
        asset = next(c["url"].rsplit("/", 1)[-1] for c in nft["chains"]
                     if c["name"] == "Counterparty")
        source = nft["image"]["source"]
        stem = Path(source).stem
        entry = targets.setdefault(stem.upper(), {
            "asset": asset, "stem": stem,
            "source_ext": Path(source).suffix.lstrip(".").lower() or "png",
            "collection": nft["seriesId"].split("/")[0], "cards": []})
        entry["cards"].append(nft["id"])

    print(f"対象: {len(targets)}ファイル(カード{sum(len(t['cards']) for t in targets.values())}件)")
    ok = skipped = failed = 0
    failures = []
    for i, t in enumerate(sorted(targets.values(), key=lambda t: t["stem"]), 1):
        dest_dir = OUT_DIR / t["collection"]
        existing = list(dest_dir.glob(t["stem"] + ".*"))
        if existing:
            skipped += 1
            continue
        print(f"[{i}/{len(targets)}] {t['asset']} ({t['collection']})")
        saved = False
        for url, description in image_urls_for(t["asset"], t["source_ext"]):
            data, ctype = fetch(url)
            if not data:
                continue
            ext = sniff_ext(data)
            if not ext:  # Cloudflare のHTMLエラーページ等を除外
                continue
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = dest_dir / f"{t['stem']}.{ext}"
            dest.write_bytes(data)
            manifest[dest.relative_to(ROOT).as_posix()] = {
                "asset": t["asset"], "cards": t["cards"], "url": url,
                "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
                "content_type": ctype, "description": description,
                "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            print(f"    -> {dest.relative_to(ROOT)} ({len(data):,} bytes)")
            ok += 1
            saved = True
            break
        if not saved:
            failed += 1
            failures.append(t)
            print(f"    !! 取得できず: {t['asset']} (cards: {', '.join(t['cards'])})")
        # 中断されても来歴が残るよう都度書き出す
        MANIFEST_PATH.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
            encoding="utf-8")

    print(f"\n完了: 取得 {ok} / スキップ(取得済み) {skipped} / 失敗 {failed}")
    for t in failures:
        print(f"  失敗: {t['asset']} ({t['collection']}) cards: {', '.join(t['cards'])}")


if __name__ == "__main__":
    main()
