import os
import json
import requests
import urllib.parse
import time
import re

# --- Configuration ---
BASE_OUTPUT_DIR = "char_icon"
CHARACTERS_JSON_PATH = "scripts/characters.json"
REPORT_FILE = "char_icon_report.txt"

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

    # Filter out "Rover" (｡•́︿•̀｡)
    initial_count = len(characters)
    characters = [c for c in characters if c.get("name", "").lower() != "rover"]
    if len(characters) < initial_count:
        print(f"Filtered out {initial_count - len(characters)} 'Rover' entries.")

    print(f"Starting organized backup download for {len(characters)} characters...")
    
    downloaded_count = 0
    skipped_count = 0
    failed_count = 0

    # Store mapping for the report: filename_no_ext -> original_name
    name_mapping = {}

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

        # Better sanitization: Dan Heng • Imbibitor Lunae -> Dan_Heng_Imbibitor_Lunae
        clean_name = re.sub(r'[^a-zA-Z0-9]+', '_', name).strip('_')
        filename = f"{clean_name}.png"
        output_path = os.path.join(target_dir, filename)
        
        # Save name for report
        name_mapping[f"{game_folder}/{rarity}/{clean_name}"] = name

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
        
        time.sleep(0.2)

    print("\n--- Download Summary ---")
    print(f"Newly downloaded: {downloaded_count}")
    print(f"Already existed (skipped): {skipped_count}")
    print(f"Failed: {failed_count}")
    print("------------------------")

    # --- Report Generation (Scan Existing) ---
    print(f"\nScanning directory for report: {BASE_OUTPUT_DIR}")
    report_lines = []
    report_lines.append(f"{'GAME':<15} | {'RARITY':<8} | {'CHARACTER NAME':<40} | {'FILENAME':<50} | {'EXT'}")
    report_lines.append("-" * 125)

    for root, dirs, files in os.walk(BASE_OUTPUT_DIR):
        for file in files:
            if file.endswith('.png'):
                # Extract game and rarity from path
                rel_path = os.path.relpath(root, BASE_OUTPUT_DIR).replace('\\', '/')
                path_parts = rel_path.split('/')
                
                game_name = path_parts[0] if len(path_parts) > 0 else "Unknown"
                rarity_val = path_parts[1] if len(path_parts) > 1 else "?"
                
                clean_name = os.path.splitext(file)[0]
                lookup_key = f"{rel_path}/{clean_name}"
                
                # Get original name from our mapping or pretty-print the filename
                original_name = name_mapping.get(lookup_key, clean_name.replace('_', ' '))
                
                report_lines.append(f"{game_name:<15} | {rarity_val:<8} | {original_name:<40} | {file:<50} | .png")

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
    
    print(f"Report generated successfully: {REPORT_FILE}")

if __name__ == "__main__":
    download_icons()
