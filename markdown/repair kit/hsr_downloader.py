import os
import requests
from PIL import Image
from io import BytesIO
import time
import random

# --- Helper function to download and convert image via API ---
def download_hsr_via_api(charecter_name, session, output_dir):
    """
    Downloads HSR renders. Skips if already exists. Preserves transparency.
    Returns True if successful/skipped, False if failed. (◕‿◕✿)
    """
    # Create a safe filename for our local storage
    safe_filename = charecter_name.replace(" ", "_").replace("•", "IL").replace("&", "and").replace("/", "_")
    final_path = os.path.join(output_dir, f"{safe_filename}_Render.webp")

    # --- VERIFY IF EXISTS ---
    if os.path.exists(final_path):
        print(f"✨ You already have {charecter_name}! Skipping... (◕‿-) ♡")
        return True

    print(f"\nProcessing (HSR): {charecter_name}... (っ˘ω˘ς)")

    # Clean name for the wiki API
    clean_name = charecter_name.replace(" & ", " and ")
    
    # Try common naming patterns for HSR renders
    file_patterns = [
        f"{clean_name}_Render.png",
        f"Character_{clean_name}_Splash_Art.png",
        f"Character_{clean_name}_Portrait.png",
        f"{clean_name}_Splash_Art.png",
    ]

    image_url = None
    for file_title in file_patterns:
        api_url = "https://honkai-star-rail.fandom.com/api.php"
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
            
            # Lossless saves perfect quality and transparency
            image.save(final_path, "WEBP", lossless=True, quality=100)
            print(f"  [LOG] SUCCESS! Saved to {final_path} ヽ(>∀<☆)ノ")
            return True
        except Exception as e:
            print(f"  [ERR] Failed to process {charecter_name}: {e}")
    else:
        print(f"  [LOG] Could not find a render for {charecter_name}. (｡•́︿•̀｡)")
    
    return False

# --- Main script ---
if __name__ == "__main__":
    # Your updated HSR roster! (｡♥‿♥｡)
    hsr_characters = [
        "Acheron", "Aglaea", "Anaxa", "Archer", "Argenti", "Aventurine", "Bailu", 
        "Black Swan", "Blade", "Boothill", "Bronya", "Castorice", "Cerydra", 
        "Cipher", "Clara", "Dan Heng • Imbibitor Lunae", "Dr. Ratio", "Feixiao", "Firefly", 
        "Fu Xuan", "Fugue", "Gepard", "Himeko", "Huohuo", "Hyacine", "Jade", 
        "Jiaoqiu", "Jing Yuan", "Jingliu", "Kafka", "Lingsha", "Luocha", "Phainon", 
        "Rappa", "Robin", "Ruan Mei", "Seele", "Silver Wolf", "Sparkle", "Sparxie", 
        "Sunday", "The Herta", "Topaz & Numby", "Tribbie", "Welt", "Yanqing", 
        "Yao Guang", "Arlan", "Asta", "Dan Heng", "Gallagher", "Guinaifen", "Hanya", 
        "Herta", "Hook", "Luka", "Lynx", "March 7th", "Misha", "Moze", "Natasha", 
        "Pela", "Qingque", "Sampo", "Serval", "Sushang", "Tingyun", "Xueyi", "Yukong"
    ]

    output_folder = "Honkai_Star_Rail_Renders_WebP"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    print(f"--- Starting HSR Download (Checking for existing files...) --- (｡♥‿♥｡)")
    
    failed_characters = []
    success_count = 0

    with requests.Session() as session:
        session.headers.update({'User-Agent': 'Mozilla/5.0'})
        for name in hsr_characters:
            if download_hsr_via_api(name, session, output_folder):
                success_count += 1
            else:
                failed_characters.append(name)
            time.sleep(0.3)

    print(f"\n--- HSR Final Report --- (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
    print(f"✅ Successfully processed: {success_count}")
    if failed_characters:
        print(f"❌ Missed characters ({len(failed_characters)}):")
        for char in failed_characters:
            print(f"   • {char}")
    else:
        print("🎉 Perfect score! Every character was captured or already exists! (｡♥‿♥｡)")
