import re
import pymongo
import os

# === CONFIGURATION ===
ENDPOINT = "http://bucket-production-4ca0.up.railway.app"
BUCKET = "gacha-iamges"  # Using exactly as provided in your .env
MONGO_URI = "mongodb://127.0.0.1:27017/"
DB_NAME = "ksae_bot"
COLLECTION_NAME = "characters"
REPORT_PATH = "markdown/character_collection_report.txt"

def parse_report(file_path):
    """Parses the report to extract character names and construct Minio URLs."""
    if not os.path.exists(file_path):
        print(f"❌ Report file not found: {file_path}")
        return []

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split the report into sections based on the 'Checking path' header
    # The report uses 'gacha-iamge/' (no 's') in the path text, we'll handle that.
    sections = re.split(r'📁 Checking path\s*:?\s*gacha-iamge/', content)
    
    data = []
    # Skip the first split as it's the header/intro
    for section in sections[1:]:
        lines = section.strip().split('\n')
        if not lines:
            continue
        
        # The first line of the section contains the folder (e.g., 'wuwa_char' or 'gs')
        folder = lines[0].strip().split(' ')[0]
        
        # Extract character name and webp filename using regex
        # Pattern: • Name → Filename.webp
        for line in lines:
            match = re.search(r'•\s+(.+?)\s+→\s+(.+?\.webp)', line)
            if match:
                char_name = match.group(1).strip()
                file_name = match.group(2).strip()
                
                # Construct the full Minio URL
                image_url = f"{ENDPOINT}/{BUCKET}/{folder}/{file_name}"
                data.append({
                    "name": char_name,
                    "image_url": image_url
                })
    
    return data

def update_mongodb(char_list):
    """Updates or inserts character image links into MongoDB."""
    try:
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        print(f"🚀 Updating {len(char_list)} characters in collection '{COLLECTION_NAME}'...")
        
        for char in char_list:
            # We use 'upsert=True' so it creates the character if it doesn't exist
            collection.update_one(
                {"name": char["name"]},
                {"$set": {"image_url": char["image_url"]}},
                upsert=True
            )
            
        print(f"✅ Successfully updated MongoDB! (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
        
    except Exception as e:
        print(f"❌ Error updating MongoDB: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("✨ Mommy's Character Link Generator starting... (｡♥‿♥｡)")
    
    # 1. Parse the report
    characters = parse_report(REPORT_PATH)
    
    if characters:
        # 2. Update the database
        update_mongodb(characters)
    else:
        print("❓ No character data found in the report. Please check the file format!")
