"""Create a lossless Extended JSON snapshot of the configured MongoDB database."""

import gzip
import json
from datetime import datetime, timezone
from pathlib import Path

from bson import json_util
from decouple import config
from pymongo import MongoClient


BASE_DIR = Path(__file__).resolve().parents[1]


def main():
    client = MongoClient(
        config("MONGO_URI", default="mongodb://localhost:27017/clubsite_db"),
        serverSelectionTimeoutMS=5000,
    )
    try:
        database = client[config("MONGO_DB", default="clubsite_db")]
        database.command("ping")

        backup_dir = BASE_DIR / "backups"
        backup_dir.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        destination = backup_dir / f"mongodb-{stamp}.json.gz"
        if destination.exists():
            raise FileExistsError(destination)

        counts = {}
        snapshot = {"database": database.name, "created_at": stamp, "collections": {}}
        for collection_name in sorted(database.list_collection_names()):
            documents = list(database[collection_name].find({}))
            counts[collection_name] = len(documents)
            snapshot["collections"][collection_name] = documents

        with gzip.open(destination, "wt", encoding="utf-8") as archive:
            archive.write(json_util.dumps(snapshot, ensure_ascii=False, separators=(",", ":")))

        print(f"MongoDB snapshot written: {destination.relative_to(BASE_DIR)}")
        print("Document counts:", json.dumps(counts, sort_keys=True))
        print(f"Compressed bytes: {destination.stat().st_size}")
    finally:
        client.close()


if __name__ == "__main__":
    main()
