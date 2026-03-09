import os
import json
import requests
import urllib.parse
import time

# --- Configuration ---
BASE_OUTPUT_DIR = "char_icon"
CHARACTERS_JSON_PATH = "scripts/characters.json"

if not os.path.exists(BASE_OUTPUT_DIR):
    os.makedirs(BASE_OUTPUT_DIR)

def get_fandom_image_url(wiki_name, filename):
    base_url = f"https://{wiki_name}.fandom.com/api.php"
    params = {
        "action": "query",
        "titles": f"File:{filename}",
        "prop": "imageinfo",
        "iiprop": "url",
        "format": "json"
    }
    try:
        response = requests.get(f"{base_url}?{urllib.parse.urlencode(params)}", timeout=10)
        response.raise_for_status()
        data = response.json()
        pages = data.get("query", {}).get("pages", {})
        page_id = next(iter(pages), "-1")
        if page_id != "-1":
            image_info = pages[page_id].get("imageinfo")
            if image_info:
                return image_info[0].get("url")
    except Exception as e:
        print(f"  Wiki API error ({wiki_name}): {e}")
    return None

def download_icons():
    try:
        with open(CHARACTERS_JSON_PATH, 'r', encoding='utf-8') as f:
            characters = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    print(f"Starting organized backup download for {len(characters)} characters...")
    
    downloaded_count = 0
    skipped_count = 0
    failed_count = 0

    for char in characters:
        name = char.get("name")
        game = char.get("game")
        rarity = str(char.get("rarity", "unknown"))
        if not name or not game: continue

        # Prepare folder structure: char_icon/<game>/<rarity>/
        game_folder = game.replace(" ", "_")
        target_dir = os.path.join(BASE_OUTPUT_DIR, game_folder, rarity)
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)

        clean_name = "".join(c if c.isalnum() else "_" for c in name)
        filename = f"{clean_name}.png"
        output_path = os.path.join(target_dir, filename)

        # Existing checker (skip if file exists)
        if os.path.exists(output_path):
            print(f"Skipping {name} ({game} {rarity}★) - Already exists.")
            skipped_count += 1
            continue

        print(f"Processing {name} ({game} {rarity}★)...")
        urls_to_try = []

        # Define priority list for each game
        if game == "genshin":
            api_id = name.lower().replace(" ", "-")
            urls_to_try.append(f"https://genshin.jmp.blue/characters/{api_id}/icon-big")
            fandom_url = get_fandom_image_url("genshin-impact", f"{name} Icon.png")
            if fandom_url: urls_to_try.append(fandom_url)
        elif game == "hsr":
            fandom_url = get_fandom_image_url("honkai-star-rail", f"Character {name} Icon.png")
            if fandom_url: urls_to_try.append(fandom_url)
        elif game == "wuwa":
            fandom_url = get_fandom_image_url("wutheringwaves", f"Resonator {name}.png")
            if fandom_url: urls_to_try.append(fandom_url)
        elif game == "zzz":
            fandom_url = get_fandom_image_url("zenless-zone-zero", f"Agent {name} Icon.png")
            if fandom_url: urls_to_try.append(fandom_url)

        success = False
        for url in urls_to_try:
            try:
                img_res = requests.get(url, timeout=15)
                img_res.raise_for_status()
                
                with open(output_path, 'wb') as f:
                    f.write(img_res.content)
                print(f"  ✓ Saved to {output_path}")
                downloaded_count += 1
                success = True
                break 
            except Exception:
                continue
        
        if not success:
            print(f"  ✗ Failed to download icon for {name}")
            failed_count += 1
        
        time.sleep(0.3)

    print("\n--- Download Summary ---")
    print(f"Newly downloaded: {downloaded_count}")
    print(f"Already existed (skipped): {skipped_count}")
    print(f"Failed: {failed_count}")
    print("------------------------")

if __name__ == "__main__":
    download_icons()
