#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
集思台大會議中心會議室資料收集腳本
"""

import re
import json
import sys
from urllib.parse import urljoin

# 會議室清單
rooms = [
    {"name": "The Forum", "url": "https://www.meeting.com.tw/ntu/the-forum.php", "file": "the-forum"},
    {"name": "Socrates", "url": "https://www.meeting.com.tw/ntu/socrates.php", "file": "socrates"},
    {"name": "Alexander", "url": "https://www.meeting.com.tw/ntu/alexander.php", "file": "alexander"},
    {"name": "Plato", "url": "https://www.meeting.com.tw/ntu/plato.php", "file": "plato"},
    {"name": "Aristotle", "url": "https://www.meeting.com.tw/ntu/aristotle.php", "file": "aristotle"},
    {"name": "Archimedes", "url": "https://www.meeting.com.tw/ntu/archimedes.php", "file": "archimedes"},
    {"name": "Locke", "url": "https://www.meeting.com.tw/ntu/locke.php", "file": "locke"},
    {"name": "Davinci", "url": "https://www.meeting.com.tw/ntu/davinci.php", "file": "davinci"},
    {"name": "Raphael", "url": "https://www.meeting.com.tw/ntu/raphael.php", "file": "raphael"},
    {"name": "Michelangelo", "url": "https://www.meeting.com.tw/ntu/michelangelo.php", "file": "michelangelo"},
    {"name": "Nietzsche", "url": "https://www.meeting.com.tw/ntu/nietzsche.php", "file": "nietzsche"},
]

def extract_room_info(html_content, room_name, base_url):
    """從 HTML 中提取會議室資訊"""

    room_info = {
        "name": room_name,
        "source": base_url,
        "photos": [],
        "floor": None,
        "type": None,
        "size": None,
        "capacity": {},
        "pricing": {},
        "sessions": {},
        "equipment": [],
        "features": []
    }

    # 提取樓層資訊
    floor_match = re.search(r'<span class="orange">(.*?)</span>.*?h1>', html_content, re.DOTALL)
    if floor_match:
        room_info["floor"] = floor_match.group(1).strip()

    # 提取會議室類型和大小
    type_match = re.search(r'<p>(.*?)/(.*?坪/.*?)</p>', html_content)
    if type_match:
        room_info["type"] = type_match.group(1).strip()
        room_info["size"] = type_match.group(2).strip()

    # 提取照片
    photo_pattern = r'<img src="images/lease/(.*?\.jpg)"'
    photos = re.findall(photo_pattern, html_content)
    unique_photos = list(dict.fromkeys(photos))  # 去重
    for photo in unique_photos:
        full_url = urljoin(base_url, f"images/lease/{photo}")
        if full_url not in room_info["photos"]:
            room_info["photos"].append(full_url)

    # 提取容納人數
    capacity_patterns = [
        r'劇院型\s*(\d+)\s*位',
        r'劇院型客席沙發座椅(\d+)位',
        r'教室型\s*(\d+)\s*位',
        r'宴會型\s*(\d+)\s*位',
        r'容量\s*(\d+)\s*人',
    ]
    for pattern in capacity_patterns:
        match = re.search(pattern, html_content)
        if match:
            if "劇院" in pattern:
                room_info["capacity"]["theater"] = int(match.group(1))
            elif "教室" in pattern:
                room_info["capacity"]["classroom"] = int(match.group(1))
            elif "宴會" in pattern:
                room_info["capacity"]["banquet"] = int(match.group(1))
            elif "容量" in pattern:
                if "theater" not in room_info["capacity"]:
                    room_info["capacity"]["theater"] = int(match.group(1))

    # 提取價格
    price_patterns = [
        r'\(平日\)每時段新台幣([0-9,]+)元',
        r'\(假日\)每時段新台幣([0-9,]+)元',
        r'平日.*?([0-9,]+)元',
        r'假日.*?([0-9,]+)元',
    ]
    price_keywords = ["平日", "假日"]
    for i, pattern in enumerate(price_patterns):
        match = re.search(pattern, html_content)
        if match:
            price = int(match.group(1).replace(',', ''))
            if i < 2:
                if "weekday" not in room_info["pricing"] and "平日" in price_keywords[i]:
                    room_info["pricing"]["weekday"] = price
                elif "weekend" not in room_info["pricing"] and "假日" in price_keywords[i]:
                    room_info["pricing"]["weekend"] = price

    # 提取場地時段
    session_pattern = r'上午\s*(\d{2}:\d{2})\s*–\s*(\d{2}:\d{2})\s*<br>\s*下午\s*(\d{2}:\d{2})\s*–\s*(\d{2}:\d{2})\s*<br>\s*晚上\s*(\d{2}:\d{2})\s*–\s*(\d{2}:\d{2})'
    session_match = re.search(session_pattern, html_content)
    if session_match:
        room_info["sessions"] = {
            "morning": f"{session_match.group(1)}-{session_match.group(2)}",
            "afternoon": f"{session_match.group(3)}-{session_match.group(4)}",
            "evening": f"{session_match.group(5)}-{session_match.group(6)}"
        }

    # 提取設備
    equipment_patterns = [
        r'麥克風',
        r'投影',
        r'音響',
        r'LED',
        r'字幕',
        r'報到桌',
        r'白板',
        r'講台',
    ]
    for pattern in equipment_patterns:
        if re.search(pattern, html_content):
            # 嘗試提取具體設備名稱
            specific_matches = re.findall(r'<li.*?>(.*?)</li>', html_content, re.DOTALL)
            for match in specific_matches:
                clean_text = re.sub(r'<[^>]+>', '', match).strip()
                if pattern in clean_text or clean_text:
                    if clean_text and clean_text not in room_info["equipment"] and len(clean_text) < 50:
                        room_info["equipment"].append(clean_text)

    # 提取場地特色
    features_section = re.search(r'場地特色.*?<ul.*?>(.*?)</ul>', html_content, re.DOTALL)
    if features_section:
        feature_items = re.findall(r'<li>(.*?)</li>', features_section.group(1), re.DOTALL)
        for feature in feature_items:
            clean_feature = re.sub(r'<[^>]+>', '', feature).strip()
            if clean_feature and clean_feature not in room_info["features"]:
                room_info["features"].append(clean_feature)

    return room_info

def main():
    print("=" * 80)
    print("集思台大會議中心會議室資料收集")
    print("=" * 80)

    all_rooms_data = []

    for i, room in enumerate(rooms, 1):
        print(f"\n[{i}/{len(rooms)}] 正在收集: {room['name']}")
        print(f"URL: {room['url']}")

        # 使用 curl 獲取 HTML
        import subprocess
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
                room_info = extract_room_info(html_content, room['name'], room['url'])
                all_rooms_data.append(room_info)

                # 顯示基本資訊
                print(f"  樓層: {room_info.get('floor', 'N/A')}")
                print(f"  類型: {room_info.get('type', 'N/A')}")
                print(f"  大小: {room_info.get('size', 'N/A')}")
                print(f"  容納人數: {room_info.get('capacity', {})}")
                print(f"  價格: {room_info.get('pricing', {})}")
                print(f"  照片數量: {len(room_info.get('photos', []))}")
                print(f"  設備數量: {len(room_info.get('equipment', []))}")
                print(f"  特色數量: {len(room_info.get('features', []))}")
            else:
                print(f"  ❌ 獲取失敗")
                all_rooms_data.append({
                    "name": room['name'],
                    "source": room['url'],
                    "error": "Failed to fetch page"
                })

        except Exception as e:
            print(f"  ❌ 錯誤: {e}")
            all_rooms_data.append({
                "name": room['name'],
                "source": room['url'],
                "error": str(e)
            })

    # 保存資料
    output_file = "/root/.openclaw/workspace/taiwan-venues/gis-ntu-rooms.json"

    conference_center_data = {
        "name": "集思台大會議中心",
        "venueType": "會議中心",
        "venueUrl": "https://www.meeting.com.tw/ntu/",
        "address": "台北市大安區羅斯福路四段1號（台灣大學內）",
        "contact": {
            "phone": "(02) 2363-5868",
            "email": "meeting@gisgroup.com",
            "line": "@fnn1258v",
            "website": "https://www.meeting.com.tw/ntu/index.php"
        },
        "rooms": all_rooms_data,
        "totalRooms": len([r for r in all_rooms_data if "error" not in r]),
        "lastUpdated": "2026-02-28",
        "dataSource": "https://www.meeting.com.tw/ntu/"
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(conference_center_data, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"✅ 資料收集完成！共收集 {len([r for r in all_rooms_data if 'error' not in r])} 個會議室")
    print(f"📁 資料已保存至: {output_file}")
    print("=" * 80)

if __name__ == "__main__":
    main()
