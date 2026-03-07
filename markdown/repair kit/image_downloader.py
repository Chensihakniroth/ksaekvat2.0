import os
import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO
import time
import random

# --- Helper function to download and convert image ---
def download_and_convert(charecter_name, session, output_dir):
    """
    Downloads the character card. Now with "Mega Disguise" and API fallback!
    """
    print(f"\nProcessing: {charecter_name}... (◕‿◕✿)")

    charecter_path = charecter_name.replace(" ", "_")
    charecter_file = charecter_name.replace(" ", "+")

    # Strategy 1: Try the URL format you requested (with browser disguise)
    search_urls = [
        f"https://wutheringwaves.fandom.com/wiki/{charecter_path}?file={charecter_file}+Card.jpg",
        f"https://wutheringwaves.fandom.com/wiki/{charecter_path}?file={charecter_file}+Card.png"
    ]

    image_url = None

    for target_url in search_urls:
        try:
            print(f"  [LOG] Scanning page: {target_url}")
            # Human-like delay
            time.sleep(random.uniform(1.5, 3.0))
            
            response = session.get(target_url, timeout=15)
            
            if response.status_code == 403:
                print(f"  [LOG] 403 Forbidden! Grumpy website blocked the scan. (╯︵╰,)")
                break # If blocked, move to the API fallback immediately
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                # Looking for your WikiaLightbox block links
                full_size_tag = soup.select_one(".see-full-size-link, .fullImageLink a")
                if full_size_tag and full_size_tag.get('href'):
                    image_url = full_size_tag['href']
                    print(f"  [LOG] Success! Found link on the page.")
                    break
        except Exception as e:
            print(f"  [ERR] Page scan failed: {e}")

    # Strategy 2: API Fallback (The "Secret Entrance" that rarely gets blocked)
    if not image_url:
        print(f"  [LOG] Trying the API Fallback... (◕‿◕✿)")
        for ext in ["jpg", "png"]:
            api_url = "https://wutheringwaves.fandom.com/api.php"
            params = {
                "action": "query",
                "titles": f"File:{charecter_path}_Card.{ext}",
                "prop": "imageinfo",
                "iiprop": "url",
                "format": "json"
            }
            try:
                api_resp = session.get(api_url, params=params, timeout=10)
                data = api_resp.json()
                pages = data.get("query", {}).get("pages", {})
                for p_id in pages:
                    info = pages[p_id].get("imageinfo", [{}])[0]
                    if info.get("url"):
                        image_url = info["url"]
                        print(f"  [LOG] Success! Found link via API. (ﾉ´ヮ`)ﾉ*:･ﾟ✧")
                        break
                if image_url: break
            except: continue

    if image_url:
        try:
            # Clean URL for max quality
            if "/revision/latest" in image_url:
                image_url = image_url.split("/revision/latest")[0] + "/revision/latest"
            
            print(f"  [LOG] Downloading high-res image...")
            img_data = session.get(image_url, timeout=15).content
            image = Image.open(BytesIO(img_data))
            
            if image.mode in ('RGBA', 'P'):
                image = image.convert('RGB')
            
            safe_filename = charecter_name.replace(" ", "_").replace("(", "").replace(")", "").replace("/", "_")
            final_path = os.path.join(output_dir, f"{safe_filename}_Card.webp")
            
            image.save(final_path, "WEBP", quality=95)
            print(f"  [LOG] DONE! Saved as {final_path} (っ˘ω˘ς)")
            return True
        except Exception as e:
            print(f"  [ERR] Failed to save image: {e}")
    else:
        print(f"  [LOG] I'm so sorry, darling. I couldn't find a card for {charecter_name}. (｡•́︿•̀｡)")
    
    return False

# --- Main script ---
if __name__ == "__main__":
    characters_to_download = [
        "Jianxin", "Jinhsi", "Jiyan", "Lingyang", "Luuk Herssen", "Lupa", "Lynae",
        "Phoebe", "Roccia", "Rover (Spectro/Havoc/Aero)", "Shorekeeper", "Sigrika",
        "Verina", "Xiangli Yao", "Yinlin", "Zhezhi", "Aalto", "Baizhi", "Chisa",
        "Chixia", "Lumi", "Mortefi", "Sanhua", "Taoqi", "Yangyang", "Youhu", "Yuanwu",
    ]

    output_folder = "Wuthering_Waves_Cards_WebP"
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    with requests.Session() as session:
        # --- Mega Disguise Headers ---
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://wutheringwaves.fandom.com/wiki/Wuthering_Waves_Wiki',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        success_count = 0
        for name in characters_to_download:
            if download_and_convert(name, session, output_folder):
                success_count += 1
            # Add a bit of space between characters to be extra safe
            time.sleep(random.uniform(1, 2))

    print(f"\nAll finished! I successfully captured {success_count} cards for you! (◕‿◕✿)")
