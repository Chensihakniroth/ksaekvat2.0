import re
import pymongo
import datetime
import argparse
import os

DB_NAME = "ksae_bot"
COLLECTION_NAME = "characters"
REPORT_PATH = "markdown/combined_character_database.md"

def parse_report(file_path):
    if not os.path.exists(file_path):
        print(f"❌ Report file not found: {file_path}")
        return []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by "## " to get game sections
    sections = re.split(r'##\s+', content)
    
    data = []
    
    for section in sections[1:]:
        lines = section.strip().split('\n')
        
        # First line is the game name
        game_raw = lines[0].strip()
        
        # Remove emojis from game name
        game_match = re.search(r'[a-zA-Z].*', game_raw)
        current_game = game_match.group(0).strip() if game_match else game_raw

        for line in lines[1:]:
            line = line.strip()
            if line.startswith('|') and not line.startswith('| :---') and not line.startswith('| Character'):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 4:
                    char_name = parts[1]
                    element_col = parts[2]
                    role = parts[3]
                    
                    elem_match = re.match(r'(<:[a-zA-Z0-9_]+:\d+>|:[a-zA-Z0-9_]+:)\s*(.*)', element_col)
                    if elem_match:
                        emoji = elem_match.group(1).strip()
                        element_text = elem_match.group(2).strip()
                    else:
                        emoji = "✨"
                        element_text = element_col

                    data.append({
                        "name": char_name,
                        "game": current_game,
                        "element": element_text,
                        "emoji": emoji,
                        "role": role
                    })
    
    return data

def update_mongodb(char_list, mongo_uri):
    print(f"ℹ️ Connecting to MongoDB with URI: {mongo_uri}")
    client = None
    try:
        client = pymongo.MongoClient(mongo_uri)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        client.server_info()
        print("✅ Successfully connected to MongoDB.")

        print(f"🚀 Checking {len(char_list)} characters in collection '{COLLECTION_NAME}'...")
        
        updated_count = 0
        skipped_count = 0
        not_found_count = 0
        
        missing_log = open("missing_characters.log", "w", encoding="utf-8")

        for char in char_list:
            # We want to strictly match the name
            existing_char = collection.find_one({
                "name": {"$regex": f"^{re.escape(char['name'])}$", "$options": "i"} 
            })
            
            if existing_char:
                # Update document with element, role, and the custom emoji
                updates = {}
                
                # Check what needs updating to avoid unnecessary writes
                if existing_char.get("element") != char["element"]: updates["element"] = char["element"]
                if existing_char.get("role") != char["role"]: updates["role"] = char["role"]
                # For emoji we usually don't want to overwrite unless necessary, but the user explicitly requested it.
                if existing_char.get("emoji") != char["emoji"]: updates["emoji"] = char["emoji"]
                
                if updates:
                    updates["updatedAt"] = datetime.datetime.utcnow()
                    collection.update_one(
                        {"_id": existing_char["_id"]},
                        {"$set": updates}
                    )
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                # We only update existing ones
                missing_log.write(f"⚠️ Character not found in DB: {char['name']} ({char['game']})\n")
                not_found_count += 1

        missing_log.close()
        
        print(f"✅ MongoDB update complete! (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
        print(f"   - 🔄 Updated: {updated_count}")
        print(f"   - ⏭️ Skipped (already up-to-date): {skipped_count}")
        print(f"   - ❌ Not found in DB: {not_found_count}")

    except pymongo.errors.ConnectionFailure as e:
        print(f"❌ MongoDB Connection Error. Details: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--uri', 
        type=str, 
        default="mongodb://127.0.0.1:27017/",
    )
    args = parser.parse_args()

    characters = parse_report(REPORT_PATH)
    
    if characters:
        update_mongodb(characters, args.uri)
    else:
        print("❓ No character data found in the report.")
