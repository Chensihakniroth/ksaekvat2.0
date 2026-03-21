import re
import pymongo
import os
import datetime
import argparse

# === CONFIGURATION ===
ENDPOINT = "http://bucket-production-4ca0.up.railway.app"
BUCKET = "gacha-images"  # Using exactly as provided in your .env
DB_NAME = "kohi_bot"
COLLECTION_NAME = "characters"
REPORT_PATH = "markdown/character_collection_report.txt"

def parse_report(file_path):
    """Parses the report to extract character names and construct Minio URLs."""
    if not os.path.exists(file_path):
        print(f"❌ Report file not found: {file_path}")
        return []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    sections = re.split(r'📁 Checking path\s*:?\s*gacha-images/', content)
    
    data = []
    for section in sections[1:]:
        lines = section.strip().split('\n')
        if not lines:
            continue
        
        folder = lines[0].strip().split(' ')[0]
        
        for line in lines:
            match = re.search(r'•\s+(.+?)\s+→\s+(.+?\.webp)', line)
            if match:
                char_name = match.group(1).strip()
                file_name = match.group(2).strip()
                
                image_url = f"{ENDPOINT}/{BUCKET}/{folder}/{file_name}"
                data.append({
                    "name": char_name,
                    "image_url": image_url
                })
    
    return data

def update_mongodb(char_list, mongo_uri):
    """Updates or inserts character image links into MongoDB, avoiding redundant updates."""
    print(f"ℹ️ Connecting to MongoDB with URI: {mongo_uri}")
    client = None  # Initialize client to None
    try:
        client = pymongo.MongoClient(mongo_uri)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Test connection
        client.server_info()
        print("✅ Successfully connected to MongoDB.")

        print(f"🚀 Checking {len(char_list)} characters in collection '{COLLECTION_NAME}'...")
        
        updated_count = 0
        added_count = 0
        skipped_count = 0
        
        for char in char_list:
            existing_char = collection.find_one({"name": char["name"]})
            
            if existing_char:
                if existing_char.get("image_url") != char["image_url"]:
                    collection.update_one(
                        {"_id": existing_char["_id"]},
                        {"$set": {"image_url": char["image_url"], "updatedAt": datetime.datetime.utcnow()}}
                    )
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                collection.insert_one({
                    "name": char["name"],
                    "image_url": char["image_url"],
                    "createdAt": datetime.datetime.utcnow(),
                    "updatedAt": datetime.datetime.utcnow()
                })
                added_count += 1

        print(f"✅ MongoDB update complete! (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
        print(f"   - ✨ Added: {added_count}")
        print(f"   - 🔄 Updated: {updated_count}")
        print(f"   - ⏭️ Skipped: {skipped_count}")

    except pymongo.errors.ConnectionFailure as e:
        print(f"❌ MongoDB Connection Error: Could not connect to the server at {mongo_uri}. Please check the URI and network settings.")
        print(f"   Details: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mommy's Character Link Generator and Updater.")
    parser.add_argument(
        '--uri', 
        type=str, 
        default="mongodb://127.0.0.1:27017/",
        help="The MongoDB connection URI. Defaults to local MongoDB instance."
    )
    args = parser.parse_args()

    print("✨ Mommy's Character Link Generator starting... (｡♥‿♥｡)")
    
    characters = parse_report(REPORT_PATH)
    
    if characters:
        update_mongodb(characters, args.uri)
    else:
        print("❓ No character data found in the report. Please check the file format!")

