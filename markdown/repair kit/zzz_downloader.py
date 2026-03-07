import os
import requests
from PIL import Image
from io import BytesIO
import time
import random

# --- Helper function to download, compress and convert ---
def download_zzz_agent(agent_name, session, output_dir, max_size_kb=500):
    """
    Downloads ZZZ portraits via API, preserves transparency, 
    and compresses to stay under 500KB. 
    """
    file_safe_name = agent_name.replace(" ", "_").replace("&", "and").replace("(", "").replace(")", "")
    final_filename = f"{file_safe_name}_Portrait.webp"
    final_path = os.path.join(output_dir, final_filename)

    if os.path.exists(final_path):
        print(f"✨ You already have {agent_name}! Skipping... (◕‿-) ♡")
        return True

    print(f"\nProcessing (ZZZ): {agent_name}... (っ˘ω˘ς)")

    # Clean name for the wiki API titles
    # We keep the '&' because the wiki actually uses it!
    clean_name = agent_name.replace(" ", "_")
    
    file_patterns = [
        f"Agent_{clean_name}_Portrait.png",
        f"{clean_name}_Portrait.png",
        f"Character_{clean_name}_Portrait.png",
        f"Agent_{clean_name}.png"
    ]

    image_url = None

    for file_title in file_patterns:
        api_url = "https://zenless-zone-zero.fandom.com/api.php"
        params = {
            "action": "query",
            "titles": f"File:{file_title}",
            "prop": "imageinfo",
            "iiprop": "url",
            "format": "json"
        }
        
        try:
            time.sleep(random.uniform(0.3, 0.6))
            api_resp = session.get(api_url, params=params, timeout=10)
            data = api_resp.json()
            
            pages = data.get("query", {}).get("pages", {})
            for p_id in pages:
                if "imageinfo" in pages[p_id]:
                    info = pages[p_id]["imageinfo"][0]
                    if info.get("url"):
                        image_url = info["url"]
                        print(f"  [LOG] Found image as: {file_title}!")
                        break
            if image_url: break
        except:
            continue

    if image_url:
        try:
            if "/revision/latest" in image_url:
                image_url = image_url.split("/revision/latest")[0] + "/revision/latest"
            
            img_data = session.get(image_url, timeout=15).content
            image = Image.open(BytesIO(img_data))
            
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            final_path = os.path.join(output_dir, f"{file_safe_name}_Portrait.webp")

            # --- SMART COMPRESSION LOOP ---
            quality = 95
            while quality > 10:
                buffer = BytesIO()
                image.save(buffer, "WEBP", quality=quality, method=6)
                file_size_kb = buffer.tell() / 1024
                
                if file_size_kb <= max_size_kb:
                    with open(final_path, "wb") as f:
                        f.write(buffer.getvalue())
                    print(f"  [LOG] SUCCESS! Saved {final_path} ({file_size_kb:.1f}KB, Quality: {quality}) ヽ(>∀<☆)ノ")
                    return True
                quality -= 5
            
        except Exception as e:
            print(f"  [ERR] Failed to process {agent_name}: {e}")
    else:
        print(f"  [LOG] Could not find a portrait for {agent_name}. (｡•́︿•̀｡)")
    
    return False

# --- Main script ---
if __name__ == "__main__":
    zzz_agents = [
        # S-Rank Agents (Corrected Names)
        "Alice Thymefield", "Aria", "Astra Yao", "Burnice White", "Caesar King", 
        "Cissia", "Dialyn", "Ellen Joe", "Evelyn Chevalier", "Grace Howard", 
        "Hoshimi Miyabi", "Jane Doe", "Ju Fufu", "Koleda Belobog", "Lighter", 
        "Lucia Elowen", "Nangong Yu", "Nekomiya Mana", "Orphie Magnusson & Magus", "Qingyi", 
        "Alexandrina Sebastiane", "Seed", "Anby Demara", "Soldier 11", "Sunna", "Trigger", 
        "Vivian Banshee", "Von Lycaon", "Tsukishiro Yanagi", "Ye Shunguang", "Yidhari Murphy", 
        "Yixuan", "Ukinami Yuzuha", "Zhao", "Zhu Yuan",
        # A-Rank Agents
        "Anby Demara", "Anton Ivanov", "Banyue", "Ben Bigger", "Billy Kid", 
        "Corin Wickes", "Hugo Vlad", "Luciana de Montefio", "Komano Manato", "Nicole Demara", 
        "Pan Yinhu", "Piper Wheel", "Pulchra Fellini", "Seth Lowell", "Soukaku"
    ]

    output_folder = "ZZZ_Portraits_WebP"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    print(f"--- Starting ZZZ Download (Updated Roster) --- (｡♥‿♥｡)")
    
    failed_characters = []
    success_count = 0
    
    with requests.Session() as session:
        session.headers.update({'User-Agent': 'Mozilla/5.0'})
        for name in zzz_agents:
            if download_zzz_agent(name, session, output_folder):
                success_count += 1
            else:
                failed_characters.append(name)
            time.sleep(0.4)

    print(f"\n--- Final Report --- (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
    print(f"✅ Successfully processed: {success_count}")
    if failed_characters:
        print(f"❌ Missed characters ({len(failed_characters)}):")
        for char in failed_characters:
            print(f"   • {char}")
    else:
        print("🎉 Perfect score! (｡♥‿♥｡)")
