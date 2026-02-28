#!/usr/bin/env python3
import json
import re

# 台灣飯店和文化場地資訊
venues = {
    "hotels": [
        "台北晶華酒店",
        "台北國賓大飯店",
        "台北文華東方酒店",
        "墾丁福華渡假飯店",
        "墾丁凱撒大飯店",
        "板橋凱撒大飯店",
        "福容大飯店淡水漁人碼頭",
        "台北遠東香格里拉酒店"
    ],
    "venues": [
        "中正紀念堂",
        "台北小巨蛋",
        "高雄市立美術館",
        "宜蘭傳藝中心",
        "國家表演藝術中心"
    ]
}

# 已知的網站 URL
hotel_urls = {
    "台北晶華酒店": "https://regenttaipei.com/",
    "台北國賓大飯店": "https://www.plazahotel.net.tw/",
    "台北文華東方酒店": "https://www.mandarinoriental.com/taipei",
    "墾丁福華渡假飯店": "https://howard-hotels.com/booking/hotel-5",
    "墾丁凱撒大飯店": "https://www.caesar-park.com.tw/kenting/",
    "板橋凱撒大飯店": "https://www.caesar-park.com.tw/banqiao/",
    "福容大飯店淡水漁人碼頭": "https://www.fullon-hotels.com.tw/fisherman/",
    "台北遠東香格里拉酒店": "https://www.shangri-la.com/taipei/fareasternplaza/"
}

venue_urls = {
    "中正紀念堂": "https://www.cksmh.gov.tw/",
    "台北小巨蛋": "https://www.taipeiarena.com.tw/",
    "高雄市立美術館": "https://khm.gov.tw/",
    "宜蘭傳藝中心": "https://www.ncafroc.gov.tw/",
    "國家表演藝術中心": "https://www.npac-ntt.org.tw/"
}

def create_venue_json(name, venue_type):
    """為每個場地創建基本的 JSON 結構"""
    data = {
        "name": name,
        "type": venue_type,
        "photos": {
            "main": "",
            "gallery": []
        },
        "pricing": {
            "halfDay": "需詢價",
            "fullDay": "需詢價",
            "note": "價格需與場地聯繫確認"
        },
        "capacity": {
            "theater": None,
            "classroom": None,
            "banquet": None
        }
    }
    return data

# 創建所有場地的 JSON 檔案
print("開始創建場地資料檔案...")

# 創建飯店資料
for hotel in venues["hotels"]:
    data = create_venue_json(hotel, "hotel")
    filename = hotel.replace("/", "-").replace(" ", "_")
    with open(f"/root/.openclaw/workspace/taiwan-venues/{filename}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ 已創建: {hotel}")

# 創建文化場地資料
for venue in venues["venues"]:
    data = create_venue_json(venue, "venue")
    filename = venue.replace("/", "-").replace(" ", "_")
    with open(f"/root/.openclaw/workspace/taiwan-venues/{filename}.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ 已創建: {venue}")

print("\n所有場地基本資料檔案已創建完成！")
print("現在開始收集詳細資訊...")
