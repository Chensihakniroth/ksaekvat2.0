import os
import requests
from PIL import Image
from io import BytesIO
import time
import random

# --- Helper function to download and convert image via API ---
def download_via_api(charecter_name, session, output_dir):
    """
    Downloads Genshin cards. Skips if already exists. Preserves transparency.
    Returns True if successful/skipped, False if failed. (◕‿◕✿)
    """
    safe_filename = charecter_name.replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")
    final_path = os.path.join(output_dir, f"{safe_filename}_Card.webp")

    # --- VERIFY IF EXISTS ---
    if os.path.exists(final_path):
        print(f"✨ You already have {charecter_name}! Skipping... (◕‿-) ♡")
        return True

    print(f"\nProcessing (Genshin): {charecter_name}... (っ˘ω˘ς)")

    charecter_path = charecter_name.replace(" ", "_")
    image_url = None

    for ext in ["png", "jpg"]:
        api_url = "https://genshin-impact.fandom.com/api.php"
        params = {
            "action": "query",
            "titles": f"File:{charecter_path}_Card.{ext}",
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
                    image_url = pages[p_id]["imageinfo"][0].get("url")
                    if image_url: break
            if image_url: break
        except: continue

    if image_url:
        try:
            if "/revision/latest" in image_url:
                image_url = image_url.split("/revision/latest")[0] + "/revision/latest"
            
            img_data = session.get(image_url, timeout=15).content
            image = Image.open(BytesIO(img_data))
            
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            # Lossless for perfect quality and transparency
            image.save(final_path, "WEBP", lossless=True, quality=100)
            print(f"  [LOG] SUCCESS! Saved to {final_path} ヽ(>∀<☆)ノ")
            return True
        except Exception as e:
            print(f"  [ERR] Failed to process {charecter_name}: {e}")
    else:
        print(f"  [LOG] Could not find a card for {charecter_name}. (｡•́︿•̀｡)")
    
    return False

# --- Main script ---
if __name__ == "__main__":
    genshin_characters = [
        "Albedo", "Alhaitham", "Arlecchino", "Baizhu", "Chasca", "Chiori", "Citlali", 
        "Clorinde", "Columbina", "Cyno", "Dehya", "Diluc", "Durin", "Emilie", 
        "Escoffier", "Eula", "Flins", "Furina", "Ganyu", "Hu Tao", "Ineffa", "Jean", 
        "Kaedehara Kazuha", "Kamisato Ayaka", "Kamisato Ayato", "Keqing", "Kinich", 
        "Klee", "Lauma", "Lyney", "Mavuika", "Mona", "Mualani", "Nahida", "Navia", 
        "Neuvillette", "Nilou", "Qiqi", "Raiden Shogun", "Sangonomiya Kokomi", 
        "Shenhe", "Sigewinne", "Skirk", "Tartaglia", "Tighnari", "Varka", "Venti", 
        "Wanderer", "Wriothesley", "Xianyun", "Xiao", "Xilonen", "Yae Miko", "Yelan", 
        "Yoimiya", "Zhongli", "Amber", "Barbara", "Beidou", "Bennett", "Candace", 
        "Charlotte", "Chevreuse", "Chongyun", "Collei", "Dahlia", "Diona", "Dori", 
        "Faruzan", "Fischl", "Freminet", "Gaming", "Gorou", "Iansan", "Kaeya", 
        "Kachina", "Kaveh", "Kirara", "Kujou Sara", "Kuki Shinobu", "Lan Yan", 
        "Layla", "Lisa", "Lynette", "Mika", "Ningguang", "Noelle", "Ororon", 
        "Razor", "Rosaria", "Sayu", "Sethos", "Shikanoin Heizou", "Sucrose", 
        "Thoma", "Xiangling", "Xingqiu", "Xinyan", "Yanfei", "Yaoyao", "Yun Jin"
    ]

    output_folder = "Genshin_Impact_Cards_WebP"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    print(f"--- Starting Genshin Download (Checking for existing files...) --- (｡♥‿♥｡)")
    
    failed_characters = []
    success_count = 0

    with requests.Session() as session:
        session.headers.update({'User-Agent': 'Mozilla/5.0'})
        for name in genshin_characters:
            if download_via_api(name, session, output_folder):
                success_count += 1
            else:
                failed_characters.append(name)
            time.sleep(0.3)

    print(f"\n--- Genshin Final Report --- (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
    print(f"✅ Successfully processed: {success_count}")
    if failed_characters:
        print(f"❌ Missed characters ({len(failed_characters)}):")
        for char in failed_characters:
            print(f"   • {char}")
    else:
        print("🎉 Perfect score! Every character was captured or already exists! (｡♥‿♥｡)")
