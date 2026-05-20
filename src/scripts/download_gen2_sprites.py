#!/usr/bin/env python3
"""
Download Gen 2 Pokemon sprites - final version.
"""

import requests
from pathlib import Path

# Official Pokemon name to ID mapping (Gen 2: 152-251)
POKEMON = {
    "chikorita": 152, "bayleef": 153, "meganium": 154,
    "cyndaquil": 155, "quilava": 156, "typhlosion": 157,
    "totodile": 158, "croconaw": 159, "feraligatr": 160,
    "sentret": 161, "furret": 162, "hoothoot": 163,
    "noctowl": 164, "ledyba": 165, "ledian": 166,
    "spinarak": 167, "ariados": 168, "crobat": 169,
    "chinchou": 170, "lanturn": 171, "pichu": 172,
    "cleffa": 173, "igglybuff": 174, "togepi": 175,
    "togetic": 176, "natu": 177, "xatu": 178,
    "mareep": 179, "flaaffy": 180, "ampharos": 181,
    "bellossom": 182, "marill": 183, "azumarill": 184,
    "sudowoodo": 185, "politoed": 186, "hoppip": 187,
    "skiploom": 188, "jumpluff": 189, "aipom": 190,
    "sunkern": 191, "sunflora": 192, "yanma": 193,
    "wooper": 194, "quagsire": 195, "espeon": 196,
    "umbreon": 197, "murkrow": 198, "slowking": 199,
    "misdreavus": 200, "girafarig": 201, "pineco": 202,
    "forretress": 203, "dunsparce": 204, "gligar": 205,
    "steelix": 206, "snubbull": 207, "granbull": 208,
    "qwilfish": 209, "scizor": 210, "shuckle": 211,
    "heracross": 212, "sneasel": 213, "teddiursa": 214,
    "ursaring": 215, "slugma": 216, "magcargo": 217,
    "swinub": 218, "piloswine": 219, "corsola": 220,
    "remoraid": 221, "octillery": 222, "delibird": 223,
    "mantine": 224, "skarmory": 225, "houndour": 226,
    "houndoom": 227, "kingdra": 228, "phanpy": 229,
    "donphan": 230, "porygon2": 231, "stantler": 232,
    "smeargle": 233, "tyrogue": 234, "hitmontop": 235,
    "smoochum": 236, "elekid": 237, "magby": 238,
    "miltank": 239, "blissey": 240, "raikou": 241,
    "entei": 242, "suicune": 243, "larvitar": 244,
    "pupitar": 245, "tyranitar": 246, "lugia": 247,
    "ho_oh": 248, "celebi": 249
}

OUTPUT_DIR = Path(__file__).parent.parent.parent / "assets" / "pokemon" / "gen2"

def download_all():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading to {OUTPUT_DIR}")
    
    base_url = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon"
    
    for name, pid in POKEMON.items():
        url = f"{base_url}/{pid}.png"
        try:
            r = requests.get(url, timeout=5)
            if r.status_code == 200 and len(r.content) > 100:
                fp = OUTPUT_DIR / f"{name}.png"
                fp.write_bytes(r.content)
                print(f"OK: {name}")
        except Exception as e:
            print(f"FAIL: {name} - {e}")
    
    print("Done!")

if __name__ == "__main__":
    download_all()