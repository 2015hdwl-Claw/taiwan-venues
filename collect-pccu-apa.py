#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文化大學推廣教育部APA藝文中心會議室資料收集腳本
"""

import re
import json
import subprocess
from urllib.parse import urljoin

# 會議室清單（從價格表獲取）
rooms = [
    {
        "name": "數位演講廳",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=2&r=01",
        "price": 14000,
        "category": "專業場地"
    },
    {
        "name": "國際會議廳",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=02",
        "price": 15000,
        "category": "專業場地"
    },
    {
        "name": "B1表演廳",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=03",
        "price": 15000,
        "category": "專業場地"
    },
    {
        "name": "10樓會議室",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=01",
        "price": 14000,
        "category": "專業場地"
    },
    {
        "name": "圓形演講廳(一)",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=2&r=02",
        "price": 14000,
        "category": "專業場地"
    },
    {
        "name": "圓形演講廳(二)",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=2&r=03",
        "price": 14000,
        "category": "專業場地"
    },
    {
        "name": "電腦教室",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=08",
        "price": "依人數",
        "category": "專業場地"
    },
    {
        "name": "舞蹈教室",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=09",
        "price": 1000,
        "price_unit": "小時",
        "category": "專業場地"
    },
    {
        "name": "頂級教室(70人)",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=07",
        "price": 9000,
        "category": "平面教室"
    },
    {
        "name": "大型教室",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=04",
        "price": 7000,
        "category": "平面教室"
    },
    {
        "name": "中型教室",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=05",
        "price": 5000,
        "category": "平面教室"
    },
    {
        "name": "小型教室(30人以下)",
        "url": "https://apa.sce.pccu.edu.tw/booking?b=1&r=06",
        "price": 4000,
        "category": "平面教室"
    }
]

def extract_room_info(html_content, room_data):
    """從 HTML 中提取會議室資訊"""

    room_info = {
        "name": room_data["name"],
        "category": room_data["category"],
        "source": room_data["url"],
        "photos": [],
        "floor": None,
        "type": None,
        "size": None,
        "capacity": {},
        "pricing": {
            "price_per_session": room_data["price"],
            "price_unit": "時段" if "price_unit" not in room_data else room_data["price_unit"]
        },
        "sessions": {
            "morning": "08:00-12:00",
            "afternoon": "13:00-17:00",
            "evening": "18:00-22:00"
        },
        "equipment": [],
        "features": []
    }

    # 提取照片
    photo_patterns = [
        r'<img[^>]+src="([^"]+\.(jpg|jpeg|png|gif))"',
        r'images/[^\s"]+\.(jpg|jpeg|png|gif)'
    ]
    for pattern in photo_patterns:
        photos = re.findall(pattern, html_content, re.IGNORECASE)
        for photo in photos:
            photo_url = photo[0] if isinstance(photo, tuple) else photo
            if not photo_url.startswith('http'):
                photo_url = urljoin(room_data["url"], photo_url)
            if photo_url not in room_info["photos"]:
                room_info["photos"].append(photo_url)

    # 提取容納人數
    capacity_patterns = [
        r'容納(\d+)人',
        r'(\d+)人',
        r'容量(\d+)',
        r'座位(\d+)',
    ]
    for pattern in capacity_patterns:
        matches = re.findall(pattern, html_content)
        for match in matches:
            if "theater" not in room_info["capacity"]:
                room_info["capacity"]["theater"] = int(match)

    # 提取設備
    equipment_keywords = ['投影', '音響', '麥克風', 'LED', 'WiFi', '網路', '空調', '白板']
    for keyword in equipment_keywords:
        if keyword in html_content:
            if keyword not in room_info["equipment"]:
                room_info["equipment"].append(keyword)

    return room_info

def main():
    print("=" * 80)
    print("文化大學推廣教育部APA藝文中心會議室資料收集")
    print("=" * 80)

    all_rooms_data = []

    for i, room in enumerate(rooms, 1):
        print(f"\n[{i}/{len(rooms)}] 正在收集: {room['name']}")
        print(f"URL: {room['url']}")
        print(f"價格: {room['price']} {'/小時' if room.get('price_unit') == '小時' else '/時段'}")

        # 使用 curl 獲取 HTML
        try:
            result = subprocess.run(
                ['curl', '-L', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                 room['url']],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout:
                html_content = result.stdout
                room_info = extract_room_info(html_content, room)
                all_rooms_data.append(room_info)

                # 顯示基本資訊
                print(f"  類別: {room_info.get('category', 'N/A')}")
                print(f"  容量: {room_info.get('capacity', {})}")
                print(f"  照片數量: {len(room_info.get('photos', []))}")
                print(f"  設備數量: {len(room_info.get('equipment', []))}")
            else:
                print(f"  ❌ 獲取失敗")
                # 即使失敗也保存基本資訊
                all_rooms_data.append({
                    "name": room["name"],
                    "category": room["category"],
                    "source": room["url"],
                    "pricing": {
                        "price_per_session": room["price"],
                        "price_unit": "時段" if "price_unit" not in room else room["price_unit"]
                    },
                    "sessions": {
                        "morning": "08:00-12:00",
                        "afternoon": "13:00-17:00",
                        "evening": "18:00-22:00"
                    },
                    "error": "Failed to fetch page"
                })

        except Exception as e:
            print(f"  ❌ 錯誤: {e}")
            # 即使錯誤也保存基本資訊
            all_rooms_data.append({
                "name": room["name"],
                "category": room["category"],
                "source": room["url"],
                "pricing": {
                    "price_per_session": room["price"],
                    "price_unit": "時段" if "price_unit" not in room else room["price_unit"]
                },
                "sessions": {
                    "morning": "08:00-12:00",
                    "afternoon": "13:00-17:00",
                    "evening": "18:00-22:00"
                },
                "error": str(e)
            })

    # 保存資料
    output_file = "/root/.openclaw/workspace/taiwan-venues/pccu-sce-rooms.json"

    conference_center_data = {
        "name": "文化大學推廣教育部APA藝文中心",
        "venueType": "會議中心",
        "venueUrl": "https://apa.sce.pccu.edu.tw/",
        "address": "台北市建國北路二段233號B1（大夏館）",
        "contact": {
            "phone": "(02) 2533-1111",
            "email": "apa@sce.pccu.edu.tw",
            "website": "https://www.sce.pccu.edu.tw/",
            "line": "http://nav.cx/5b7j4LU"
        },
        "rooms": all_rooms_data,
        "totalRooms": len(all_rooms_data),
        "lastUpdated": "2026-02-28",
        "dataSource": "https://apa.sce.pccu.edu.tw/price"
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(conference_center_data, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"✅ 資料收集完成！共收集 {len(all_rooms_data)} 個會議室")
    print(f"📁 資料已保存至: {output_file}")
    print("=" * 80)

if __name__ == "__main__":
    main()
