#!/usr/bin/env python3
"""
Detailed Character Image Checker

This script provides a more thorough analysis of character images with exact name matching
and better handling of character name variations.

Usage: python detailed_character_checker.py
"""

import os
import re
from pathlib import Path


class DetailedCharacterChecker:
    def __init__(self):
        # Wuthering Waves characters with exact expected filenames
        self.wuwa_characters = {
            "Aalto_Card.webp": "Aalto",
            "Aemeath_Card.webp": "Aemeath", 
            "Augusta_Card.webp": "Augusta",
            "Baizhi_Card.webp": "Baizhi",
            "Brant_Card.webp": "Brant",
            "Buling_Card.webp": "Buling",
            "Calcharo_Card.webp": "Calcharo",
            "Camellya_Card.webp": "Camellya",
            "Cantarella_Card.webp": "Cantarella",
            "Carlotta_Card.webp": "Carlotta",
            "Cartethyia_Card.webp": "Cartethyia",
            "Changli_Card.webp": "Changli",
            "Chisa_Card.webp": "Chisa",
            "Chixia_Card.webp": "Chixia",
            "Ciaccona_Card.webp": "Ciaccona",
            "Danjin_Card.webp": "Danjin",
            "Encore_Card.webp": "Encore",
            "Galbrena_Card.webp": "Galbrena",
            "Iuno_Card.webp": "Iuno",
            "Jianxin_Card.webp": "Jianxin",
            "Jinhsi_Card.webp": "Jinhsi",
            "Jiyan_Card.webp": "Jiyan",
            "Lingyang_Card.webp": "Lingyang",
            "Lumi_Card.webp": "Lumi",
            "Lupa_Card.webp": "Lupa",
            "Luuk_Herssen_Card.webp": "Luuk Herssen",
            "Lynae_Card.webp": "Lynae",
            "Mornye_Card.webp": "Mornye",
            "Mortefi_Card.webp": "Mortefi",
            "Phoebe_Card.webp": "Phoebe",
            "Phrolova_Card.webp": "Phrolova",
            "Qiuyuan_Card.webp": "Qiuyuan",
            "Roccia_Card.webp": "Roccia",
            "Rover_Card.webp": "Rover",
            "Sanhua_Card.webp": "Sanhua",
            "Shorekeeper_Card.webp": "Shorekeeper",
            "Sigrika_Card.webp": "Sigrika",
            "Taoqi_Card.webp": "Taoqi",
            "Verina_Card.webp": "Verina",
            "Xiangli_Yao_Card.webp": "Xiangli Yao",
            "Yangyang_Card.webp": "Yangyang",
            "Yinlin_Card.webp": "Yinlin",
            "Youhu_Card.webp": "Youhu",
            "Yuanwu_Card.webp": "Yuanwu",
            "Zani_Card.webp": "Zani",
            "Zhezhi_Card.webp": "Zhezhi"
        }
        
        # Genshin Impact characters with exact expected filenames
        self.genshin_characters = {
            "Albedo_Card.webp": "Albedo",
            "Alhaitham_Card.webp": "Alhaitham",
            "Amber_Card.webp": "Amber",
            "Arlecchino_Card.webp": "Arlecchino",
            "Baizhu_Card.webp": "Baizhu",
            "Barbara_Card.webp": "Barbara",
            "Beidou_Card.webp": "Beidou",
            "Bennett_Card.webp": "Bennett",
            "Candace_Card.webp": "Candace",
            "Charlotte_Card.webp": "Charlotte",
            "Chasca_Card.webp": "Chasca",
            "Chevreuse_Card.webp": "Chevreuse",
            "Chiori_Card.webp": "Chiori",
            "Chongyun_Card.webp": "Chongyun",
            "Citlali_Card.webp": "Citlali",
            "Clorinde_Card.webp": "Clorinde",
            "Collei_Card.webp": "Collei",
            "Columbina_Card.webp": "Columbina",
            "Cyno_Card.webp": "Cyno",
            "Dahlia_Card.webp": "Dahlia",
            "Dehya_Card.webp": "Dehya",
            "Diluc_Card.webp": "Diluc",
            "Diona_Card.webp": "Diona",
            "Dori_Card.webp": "Dori",
            "Durin_Card.webp": "Durin",
            "Emilie_Card.webp": "Emilie",
            "Escoffier_Card.webp": "Escoffier",
            "Eula_Card.webp": "Eula",
            "Faruzan_Card.webp": "Faruzan",
            "Fischl_Card.webp": "Fischl",
            "Flins_Card.webp": "Flins",
            "Freminet_Card.webp": "Freminet",
            "Furina_Card.webp": "Furina",
            "Gaming_Card.webp": "Gaming",
            "Ganyu_Card.webp": "Ganyu",
            "Gorou_Card.webp": "Gorou",
            "Hu_Tao_Card.webp": "Hu Tao",
            "Iansan_Card.webp": "Iansan",
            "Ineffa_Card.webp": "Ineffa",
            "Jean_Card.webp": "Jean",
            "Kachina_Card.webp": "Kachina",
            "Kaedehara_Kazuha_Card.webp": "Kaedehara Kazuha",
            "Kaeya_Card.webp": "Kaeya",
            "Kamisato_Ayaka_Card.webp": "Kamisato Ayaka",
            "Kamisato_Ayato_Card.webp": "Kamisato Ayato",
            "Kaveh_Card.webp": "Kaveh",
            "Keqing_Card.webp": "Keqing",
            "Kinich_Card.webp": "Kinich",
            "Kirara_Card.webp": "Kirara",
            "Klee_Card.webp": "Klee",
            "Kujou_Sara_Card.webp": "Kujou Sara",
            "Kuki_Shinobu_Card.webp": "Kuki Shinobu",
            "Lan_Yan_Card.webp": "Lan Yan",
            "Lauma_Card.webp": "Lauma",
            "Layla_Card.webp": "Layla",
            "Lisa_Card.webp": "Lisa",
            "Lynette_Card.webp": "Lynette",
            "Lyney_Card.webp": "Lyney",
            "Mavuika_Card.webp": "Mavuika",
            "Mika_Card.webp": "Mika",
            "Mona_Card.webp": "Mona",
            "Mualani_Card.webp": "Mualani",
            "Nahida_Card.webp": "Nahida",
            "Navia_Card.webp": "Navia",
            "Neuvillette_Card.webp": "Neuvillette",
            "Nilou_Card.webp": "Nilou",
            "Ningguang_Card.webp": "Ningguang",
            "Noelle_Card.webp": "Noelle",
            "Ororon_Card.webp": "Ororon",
            "Qiqi_Card.webp": "Qiqi",
            "Raiden_Shogun_Card.webp": "Raiden Shogun",
            "Razor_Card.webp": "Razor",
            "Rosaria_Card.webp": "Rosaria",
            "Sangonomiya_Kokomi_Card.webp": "Sangonomiya Kokomi",
            "Sayu_Card.webp": "Sayu",
            "Sethos_Card.webp": "Sethos",
            "Shenhe_Card.webp": "Shenhe",
            "Shikanoin_Heizou_Card.webp": "Shikanoin Heizou",
            "Sigewinne_Card.webp": "Sigewinne",
            "Skirk_Card.webp": "Skirk",
            "Sucrose_Card.webp": "Sucrose",
            "Tartaglia_Card.webp": "Tartaglia",
            "Thoma_Card.webp": "Thoma",
            "Tighnari_Card.webp": "Tighnari",
            "Varka_Card.webp": "Varka",
            "Venti_Card.webp": "Venti",
            "Wanderer_Card.webp": "Wanderer",
            "Wriothesley_Card.webp": "Wriothesley",
            "Xiangling_Card.webp": "Xiangling",
            "Xianyun_Card.webp": "Xianyun",
            "Xiao_Card.webp": "Xiao",
            "Xilonen_Card.webp": "Xilonen",
            "Xingqiu_Card.webp": "Xingqiu",
            "Xinyan_Card.webp": "Xinyan",
            "Yae_Miko_Card.webp": "Yae Miko",
            "Yanfei_Card.webp": "Yanfei",
            "Yaoyao_Card.webp": "Yaoyao",
            "Yelan_Card.webp": "Yelan",
            "Yoimiya_Card.webp": "Yoimiya",
            "Yun_Jin_Card.webp": "Yun Jin",
            "Zhongli_Card.webp": "Zhongli"
        }
        
        # Honkai: Star Rail characters with exact expected filenames
        self.hsr_characters = {
            "Acheron_Render.webp": "Acheron",
            "Aglaea_Render.webp": "Aglaea",
            "Anaxa_Render.webp": "Anaxa",
            "Archer_Render.webp": "Archer",
            "Argenti_Render.webp": "Argenti",
            "Arlan_Render.webp": "Arlan",
            "Asta_Render.webp": "Asta",
            "Aventurine_Render.webp": "Aventurine",
            "Bailu_Render.webp": "Bailu",
            "Black_Swan_Render.webp": "Black Swan",
            "Blade_Render.webp": "Blade",
            "Boothill_Render.webp": "Boothill",
            "Bronya_Render.webp": "Bronya",
            "Castorice_Render.webp": "Castorice",
            "Cerydra_Render.webp": "Cerydra",
            "Cipher_Render.webp": "Cipher",
            "Clara_Render.webp": "Clara",
            "Dan_Heng_IL_Imbibitor_Lunae_Render.webp": "Dan Heng • IL",
            "Dan_Heng_Render.webp": "Dan Heng",
            "Dr._Ratio_Render.webp": "Dr. Ratio",
            "Feixiao_Render.webp": "Feixiao",
            "Firefly_Render.webp": "Firefly",
            "Fu_Xuan_Render.webp": "Fu Xuan",
            "Fugue_Render.webp": "Fugue",
            "Gallagher_Render.webp": "Gallagher",
            "Gepard_Render.webp": "Gepard",
            "Guinaifen_Render.webp": "Guinaifen",
            "Hanya_Render.webp": "Hanya",
            "Herta_Render.webp": "Herta",
            "Himeko_Render.webp": "Himeko",
            "Hook_Render.webp": "Hook",
            "Huohuo_Render.webp": "Huohuo",
            "Hyacine_Render.webp": "Hyacine",
            "Jade_Render.webp": "Jade",
            "Jiaoqiu_Render.webp": "Jiaoqiu",
            "Jing_Yuan_Render.webp": "Jing Yuan",
            "Jingliu_Render.webp": "Jingliu",
            "Kafka_Render.webp": "Kafka",
            "Lingsha_Render.webp": "Lingsha",
            "Luka_Render.webp": "Luka",
            "Luocha_Render.webp": "Luocha",
            "Lynx_Render.webp": "Lynx",
            "March_7th_Render.webp": "March 7th",
            "Misha_Render.webp": "Misha",
            "Moze_Render.webp": "Moze",
            "Natasha_Render.webp": "Natasha",
            "Pela_Render.webp": "Pela",
            "Phainon_Render.webp": "Phainon",
            "Qingque_Render.webp": "Qingque",
            "Rappa_Render.webp": "Rappa",
            "Robin_Render.webp": "Robin",
            "Ruan_Mei_Render.webp": "Ruan Mei",
            "Sampo_Render.webp": "Sampo",
            "Seele_Render.webp": "Seele",
            "Serval_Render.webp": "Serval",
            "Silver_Wolf_Render.webp": "Silver Wolf",
            "Sparkle_Render.webp": "Sparkle",
            "Sparxie_Render.webp": "Sparxie",
            "Sunday_Render.webp": "Sunday",
            "Sushang_Render.webp": "Sushang",
            "The_Herta_Render.webp": "The Herta",
            "Tingyun_Render.webp": "Tingyun",
            "Topaz_and_Numby_Render.webp": "Topaz & Numby",
            "Tribbie_Render.webp": "Tribbie",
            "Welt_Render.webp": "Welt",
            "Xueyi_Render.webp": "Xueyi",
            "Yanqing_Render.webp": "Yanqing",
            "Yao_Guang_Render.webp": "Yao Guang",
            "Yukong_Render.webp": "Yukong"
        }
        
        # Zenless Zone Zero characters with exact expected filenames
        self.zzz_characters = {
            "Alexandrina_Sebastiane_Portrait.webp": "Rina",
            "Alice_Thymefield_Portrait.webp": "Alice Thymefield",
            "Anby_Demara_Portrait.webp": "Anby Demara",
            "Anton_Ivanov_Portrait.webp": "Anton Ivanov",
            "Aria_Portrait.webp": "Aria",
            "Astra_Yao_Portrait.webp": "Astra Yao",
            "Banyue_Portrait.webp": "Banyue",
            "Ben_Bigger_Portrait.webp": "Ben Bigger",
            "Billy_Kid_Portrait.webp": "Billy Kid",
            "Burnice_White_Portrait.webp": "Burnice White",
            "Caesar_King_Portrait.webp": "Caesar King",
            "Cissia_Portrait.webp": "Cissia",
            "Corin_Wickes_Portrait.webp": "Corin Wickes",
            "Dialyn_Portrait.webp": "Dialyn",
            "Ellen_Joe_Portrait.webp": "Ellen Joe",
            "Evelyn_Chevalier_Portrait.webp": "Evelyn Chevalier",
            "Grace_Howard_Portrait.webp": "Grace Howard",
            "Hoshimi_Miyabi_Portrait.webp": "Hoshimi Miyabi",
            "Hugo_Vlad_Portrait.webp": "Hugo Vlad",
            "Jane_Doe_Portrait.webp": "Jane Doe",
            "Ju_Fufu_Portrait.webp": "Ju Fufu",
            "Koleda_Belobog_Portrait.webp": "Koleda Belobog",
            "Komano_Manato_Portrait.webp": "Manato",
            "Lighter_Portrait.webp": "Lighter",
            "Lucia_Elowen_Portrait.webp": "Lucia Elowen",
            "Luciana_de_Montefio_Portrait.webp": "Lucy",
            "Nangong_Yu_Portrait.webp": "Nangong Yu",
            "Nekomiya_Mana_Portrait.webp": "Nekomata",
            "Nicole_Demara_Portrait.webp": "Nicole Demara",
            "Orphie_Magnusson_and_Magus_Portrait.webp": "Orphie & Magus",
            "Pan_Yinhu_Portrait.webp": "Pan Yinhu",
            "Piper_Wheel_Portrait.webp": "Piper Wheel",
            "Pulchra_Fellini_Portrait.webp": "Pulchra",
            "Qingyi_Portrait.webp": "Qingyi",
            "Seed_Portrait.webp": "Seed",
            "Seth_Lowell_Portrait.webp": "Seth Lowell",
            "Soldier_11_Portrait.webp": "Soldier 11",
            "Soukaku_Portrait.webp": "Soukaku",
            "Sunna_Portrait.webp": "Sunna",
            "Trigger_Portrait.webp": "Trigger",
            "Tsukishiro_Yanagi_Portrait.webp": "Yanagi",
            "Ukinami_Yuzuha_Portrait.webp": "Yuzuha",
            "Vivian_Banshee_Portrait.webp": "Vivian Banshee",
            "Von_Lycaon_Portrait.webp": "Von Lycaon",
            "Ye_Shunguang_Portrait.webp": "Ye Shunguang",
            "Yidhari_Murphy_Portrait.webp": "Yidhari Murphy",
            "Yixuan_Portrait.webp": "Yixuan",
            "Zhao_Portrait.webp": "Zhao",
            "Zhu_Yuan_Portrait.webp": "Zhu Yuan"
        }
        
        self.folders = {
            "wuwa_char": self.wuwa_characters,
            "gs": self.genshin_characters,
            "hsr": self.hsr_characters,
            "zzz": self.zzz_characters
        }
    
    def check_folder(self, folder_name, expected_characters):
        """Check characters in a specific folder with exact filename matching."""
        folder_path = Path(folder_name)
        if not folder_path.exists():
            print(f"❌ Folder '{folder_name}' not found!")
            return
        
        print(f"\n📁 Checking folder: {folder_name}")
        print("=" * 60)
        
        # Get all image files
        image_files = [f.name for f in folder_path.iterdir() if f.is_file() and f.suffix.lower() == '.webp']
        
        found = []
        missing = []
        unexpected = []
        
        # Check expected characters
        for filename, character_name in expected_characters.items():
            if filename in image_files:
                found.append((character_name, filename))
            else:
                missing.append((character_name, filename))
        
        # Check for unexpected files
        for filename in image_files:
            if filename not in expected_characters:
                unexpected.append(filename)
        
        # Report results
        print(f"\n✅ Found ({len(found)}):")
        for char, filename in found:
            print(f"   • {char:<25} → {filename}")
        
        if missing:
            print(f"\n❌ Missing ({len(missing)}):")
            for char, filename in missing:
                print(f"   • {char:<25} → {filename}")
        
        if unexpected:
            print(f"\n⚠️  Unexpected files ({len(unexpected)}):")
            for filename in unexpected:
                print(f"   • {filename}")
        
        percentage = (len(found) / len(expected_characters) * 100) if expected_characters else 0
        print(f"\n📊 Completion: {len(found)}/{len(expected_characters)} ({percentage:.1f}%)")
        
        return len(found), len(expected_characters)
    
    def generate_summary(self):
        """Generate a summary of all character collections."""
        print("\n" + "="*80)
        print("📊 DETAILED CHARACTER COLLECTION SUMMARY")
        print("="*80)
        
        total_found = 0
        total_expected = 0
        
        for folder_name, expected_characters in self.folders.items():
            folder_path = Path(folder_name)
            if not folder_path.exists():
                continue
                
            found_count, expected_count = self.check_folder(folder_name, expected_characters)
            total_found += found_count
            total_expected += expected_count
        
        print("\n" + "="*80)
        print("📈 OVERALL SUMMARY")
        print("="*80)
        percentage = (total_found / total_expected * 100) if total_expected > 0 else 0
        print(f"Total Characters: {total_found}/{total_expected} ({percentage:.1f}%)")
        print(f"Missing: {total_expected - total_found} characters")
    
    def run_check(self):
        """Run the complete character check."""
        print("🎮 Detailed Character Image Collection Checker")
        print("=" * 60)
        print("Checking your character image collection with exact name matching...")
        
        for folder_name, expected_characters in self.folders.items():
            self.check_folder(folder_name, expected_characters)
        
        self.generate_summary()
        
        print("\n" + "="*80)
        print("💡 NOTES:")
        print("• This checker uses exact filename matching")
        print("• If you have a character but it shows as missing, check the filename")
        print("• Unexpected files might be alternate art or different naming conventions")
        print("="*80)


def main():
    checker = DetailedCharacterChecker()
    checker.run_check()


if __name__ == "__main__":
    main()