#!/usr/bin/env python3
"""
Character Image Checker

This script checks if you have all the character images for Wuthering Waves, Genshin Impact, 
Honkai: Star Rail, and Zenless Zone Zero based on the provided character lists.

Usage: python character_checker.py
"""

import os
import re
from pathlib import Path


class CharacterChecker:
    def __init__(self):
        # Wuthering Waves characters
        self.wuwa_5star = [
            "Aemeath", "Augusta", "Brant", "Calcharo", "Camellya", "Cantarella", 
            "Carlotta", "Cartethyia", "Changli", "Ciaccona", "Chisa", "Encore", 
            "Galbrena", "Iuno", "Jianxin", "Jinhsi", "Jiyan", "Lingyang", 
            "Luuk Herssen", "Lupa", "Lynae", "Mornye", "Phoebe", "Phrolova", 
            "Qiuyuan", "Roccia", "Rover", "Shorekeeper", "Sigrika", "Verina", 
            "Xiangli Yao", "Yinlin", "Zani", "Zhezhi"
        ]
        
        self.wuwa_4star = [
            "Aalto", "Baizhi", "Buling", "Chisa", "Chixia", "Danjin", "Lumi", 
            "Mortefi", "Sanhua", "Taoqi", "Yangyang", "Youhu", "Yuanwu"
        ]
        
        # Genshin Impact characters
        self.genshin_5star = [
            "Albedo", "Alhaitham", "Arlecchino", "Baizhu", "Chasca", "Chiori", 
            "Citlali", "Clorinde", "Columbina", "Cyno", "Dehya", "Diluc", "Durin", 
            "Emilie", "Escoffier", "Eula", "Flins", "Furina", "Ganyu", "Hu Tao", 
            "Ineffa", "Jean", "Kaedehara Kazuha", "Kamisato Ayaka", "Kamisato Ayato", 
            "Keqing", "Kinich", "Klee", "Lauma", "Lyney", "Mavuika", "Mona", 
            "Mualani", "Nahida", "Navia", "Neuvillette", "Nilou", "Qiqi", 
            "Raiden Shogun", "Sangonomiya Kokomi", "Shenhe", "Sigewinne", "Skirk", 
            "Tartaglia", "Tighnari", "Varka", "Venti", "Wanderer", "Wriothesley", 
            "Xianyun", "Xiao", "Xilonen", "Yae Miko", "Yelan", "Yoimiya", "Zhongli"
        ]
        
        self.genshin_4star = [
            "Amber", "Barbara", "Beidou", "Bennett", "Candace", "Charlotte", 
            "Chevreuse", "Chongyun", "Collei", "Dahlia", "Diona", "Dori", 
            "Faruzan", "Fischl", "Freminet", "Gaming", "Gorou", "Iansan", "Kaeya", 
            "Kachina", "Kaveh", "Kirara", "Kujou Sara", "Kuki Shinobu", "Lan Yan", 
            "Layla", "Lisa", "Lynette", "Mika", "Ningguang", "Noelle", "Ororon", 
            "Razor", "Rosaria", "Sayu", "Sethos", "Shikanoin Heizou", "Sucrose", 
            "Thoma", "Xiangling", "Xingqiu", "Xinyan", "Yanfei", "Yaoyao", "Yun Jin"
        ]
        
        # Honkai: Star Rail characters
        self.hsr_5star = [
            "Acheron", "Aglaea", "Anaxa", "Archer", "Argenti", "Aventurine", 
            "Bailu", "Black Swan", "Blade", "Boothill", "Bronya", "Castorice", 
            "Cerydra", "Cipher", "Clara", "Dan Heng • IL", "Dr. Ratio", "Feixiao", 
            "Firefly", "Fu Xuan", "Fugue", "Gepard", "Himeko", "Huohuo", "Hyacine", 
            "Jade", "Jiaoqiu", "Jing Yuan", "Jingliu", "Kafka", "Lingsha", "Luocha", 
            "Phainon", "Rappa", "Robin", "Ruan Mei", "Seele", "Silver Wolf", 
            "Sparkle", "Sparxie", "Sunday", "The Herta", "Topaz & Numby", "Tribbie", 
            "Welt", "Yanqing", "Yao Guang"
        ]
        
        self.hsr_4star = [
            "Arlan", "Asta", "Dan Heng", "Gallagher", "Guinaifen", "Hanya", 
            "Herta", "Hook", "Luka", "Lynx", "March 7th", "Misha", "Moze", 
            "Natasha", "Pela", "Qingque", "Sampo", "Serval", "Sushang", "Tingyun", 
            "Xueyi", "Yukong"
        ]
        
        # Zenless Zone Zero characters
        self.zzz_srank = [
            "Alice Thymefield", "Aria", "Astra Yao", "Burnice White", "Caesar King", 
            "Cissia", "Dialyn", "Ellen Joe", "Evelyn Chevalier", "Grace Howard", 
            "Hoshimi Miyabi", "Jane Doe", "Ju Fufu", "Koleda Belobog", "Lighter", 
            "Lucia Elowen", "Nangong Yu", "Nekomata", "Orphie & Magus", "Qingyi", 
            "Rina", "Seed", "Soldier 0 - Anby", "Soldier 11", "Sunna", "Trigger", 
            "Vivian Banshee", "Von Lycaon", "Yanagi", "Ye Shunguang", "Yidhari Murphy", 
            "Yixuan", "Yuzuha", "Zhao", "Zhu Yuan"
        ]
        
        self.zzz_arank = [
            "Anby Demara", "Anton Ivanov", "Banyue", "Ben Bigger", "Billy Kid", 
            "Corin Wickes", "Hugo Vlad", "Lucy", "Manato", "Nicole Demara", 
            "Pan Yinhu", "Piper Wheel", "Pulchra", "Seth Lowell", "Soukaku"
        ]
        
        # Folder mappings
        self.folders = {
            "wuwa_char": {
                "5star": self.wuwa_5star,
                "4star": self.wuwa_4star,
                "pattern": r"(.+)_Card\.webp"
            },
            "gs": {
                "5star": self.genshin_5star,
                "4star": self.genshin_4star,
                "pattern": r"(.+)_Card\.webp"
            },
            "hsr": {
                "5star": self.hsr_5star,
                "4star": self.hsr_4star,
                "pattern": r"(.+)_Render\.webp"
            },
            "zzz": {
                "sr": self.zzz_srank,
                "ar": self.zzz_arank,
                "pattern": r"(.+)_Portrait\.webp"
            }
        }
    
    def normalize_name(self, name):
        """Normalize character name for comparison."""
        # Remove special characters and extra spaces
        name = re.sub(r'[^\w\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        return name
    
    def extract_character_name(self, filename, pattern):
        """Extract character name from filename."""
        match = re.match(pattern, filename)
        if match:
            return match.group(1)
        return None
    
    def check_folder(self, folder_name, folder_data):
        """Check characters in a specific folder."""
        folder_path = Path(folder_name)
        if not folder_path.exists():
            print(f"❌ Folder '{folder_name}' not found!")
            return
        
        print(f"\n📁 Checking folder: {folder_name}")
        print("=" * 50)
        
        # Get all image files
        image_files = [f.name for f in folder_path.iterdir() if f.is_file() and f.suffix.lower() == '.webp']
        
        # Check each character tier
        for tier, characters in folder_data.items():
            if tier == "pattern":
                continue
                
            print(f"\n⭐ {tier.upper()} Characters:")
            found = []
            missing = []
            
            for character in characters:
                normalized_char = self.normalize_name(character)
                found_in_folder = False
                
                for filename in image_files:
                    extracted_name = self.extract_character_name(filename, folder_data["pattern"])
                    if extracted_name:
                        normalized_filename = self.normalize_name(extracted_name)
                        # Check if character name is in filename (handles variations)
                        if normalized_char.lower() in normalized_filename.lower() or normalized_filename.lower() in normalized_char.lower():
                            found.append((character, filename))
                            found_in_folder = True
                            break
                
                if not found_in_folder:
                    missing.append(character)
            
            # Report results
            print(f"  ✅ Found ({len(found)}):")
            for char, filename in found:
                print(f"    • {char} → {filename}")
            
            if missing:
                print(f"  ❌ Missing ({len(missing)}):")
                for char in missing:
                    print(f"    • {char}")
            else:
                print(f"  🎉 All {tier} characters found!")
    
    def generate_summary(self):
        """Generate a summary of all character collections."""
        print("\n" + "="*80)
        print("📊 CHARACTER COLLECTION SUMMARY")
        print("="*80)
        
        total_missing = 0
        total_found = 0
        
        for folder_name, folder_data in self.folders.items():
            folder_path = Path(folder_name)
            if not folder_path.exists():
                continue
                
            image_files = [f.name for f in folder_path.iterdir() if f.is_file() and f.suffix.lower() == '.webp']
            
            for tier, characters in folder_data.items():
                if tier == "pattern":
                    continue
                    
                found_count = 0
                missing_count = 0
                
                for character in characters:
                    normalized_char = self.normalize_name(character)
                    found_in_folder = False
                    
                    for filename in image_files:
                        extracted_name = self.extract_character_name(filename, folder_data["pattern"])
                        if extracted_name:
                            normalized_filename = self.normalize_name(extracted_name)
                            if normalized_char.lower() in normalized_filename.lower() or normalized_filename.lower() in normalized_char.lower():
                                found_count += 1
                                found_in_folder = True
                                break
                    
                    if not found_in_folder:
                        missing_count += 1
                
                total_found += found_count
                total_missing += missing_count
                
                percentage = (found_count / len(characters) * 100) if characters else 0
                print(f"{folder_name.upper():<12} {tier.upper():<6} {found_count:3}/{len(characters):3} ({percentage:5.1f}%)")
        
        print("-" * 80)
        total_expected = sum(len(characters) for folder_data in self.folders.values() 
                           for tier, characters in folder_data.items() if tier != "pattern")
        print(f"TOTAL        {total_found:3}/{total_expected:3} ({total_found/total_expected*100:5.1f}%)")
        print(f"Missing: {total_missing} characters")
    
    def run_check(self):
        """Run the complete character check."""
        print("🎮 Character Image Collection Checker")
        print("=" * 50)
        print("Checking your character image collection...")
        
        for folder_name, folder_data in self.folders.items():
            self.check_folder(folder_name, folder_data)
        
        self.generate_summary()
        
        print("\n" + "="*80)
        print("💡 TIPS:")
        print("• If a character is listed as missing, check the filename format")
        print("• Some characters might have different naming conventions")
        print("• Make sure all image files are in the correct folders")
        print("="*80)


def main():
    checker = CharacterChecker()
    checker.run_check()


if __name__ == "__main__":
    main()