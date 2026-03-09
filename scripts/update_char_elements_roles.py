import re
import pymongo
from pymongo import UpdateOne
import argparse
import os

DB_NAME = "test"
COLLECTION_NAME = "characters"
REPORT_PATH = "markdown/combined_character_database.md"

def parse_report(file_path):
    if not os.path.exists(file_path):
        print(f"❌ Report file not found: {file_path}")
        return []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = re.split(r'##\s+', content)
    data = []

    for section in sections[1:]:
        lines = section.strip().split('\n')
        game_raw = lines[0].strip()
        game_match = re.search(r'[a-zA-Z].*', game_raw)
        current_game = game_match.group(0).strip() if game_match else game_raw

        for line in lines[1:]:
            line = line.strip()
            if line.startswith('|') and not line.startswith('| :---') and not line.startswith('| Character'):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 4:
                    char_name = parts[1].strip()
                    element_col = parts[2].strip()
                    role = parts[3].strip()

                    elem_match = re.match(r'(<:[a-zA-Z0-9_]+:\d+>|:[a-zA-Z0-9_]+:)\s*(.*)', element_col)
                    if elem_match:
                        element_text = elem_match.group(2).strip()
                    else:
                        element_text = element_col

                    if char_name and role and element_text:
                        data.append({
                            "name": char_name,
                            "game": current_game,
                            "element": element_text,
                            "role": role
                        })

    print(f"✅ Parsed {len(data)} characters from report.")
    return data


def update_mongodb(char_list, mongo_uri):
    print(f"ℹ️ Connecting to MongoDB...")
    client = None
    try:
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        client.server_info()
        total = collection.count_documents({})
        print(f"✅ Connected! DB: '{DB_NAME}', Collection: '{COLLECTION_NAME}' ({total} docs)")

        # Build bulk operations — single network round-trip!
        operations = []
        for char in char_list:
            operations.append(UpdateOne(
                {"name": char["name"]},
                {"$set": {
                    "element": char["element"],
                    "role": char["role"],
                }},
                upsert=False
            ))

        if not operations:
            print("❌ No operations to perform.")
            return

        print(f"🚀 Running bulk_write with {len(operations)} operations...")
        result = collection.bulk_write(operations, ordered=False)

        print(f"\n✅ MongoDB bulk update complete! (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
        print(f"   - 🔄 Matched:  {result.matched_count}")
        print(f"   - ✏️  Modified: {result.modified_count}")
        print(f"   - ❌ Not found: {len(operations) - result.matched_count}")

    except pymongo.errors.ConnectionFailure as e:
        print(f"❌ MongoDB Connection Error: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if client:
            client.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--uri', type=str, default="mongodb://127.0.0.1:27017/")
    args = parser.parse_args()

    characters = parse_report(REPORT_PATH)
    if characters:
        update_mongodb(characters, args.uri)
    else:
        print("❓ No character data found in the report.")
