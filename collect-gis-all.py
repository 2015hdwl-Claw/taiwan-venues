#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
集思會議中心全部分點會議室資料收集腳本
"""

import re
import json
import subprocess
from urllib.parse import urljoin

# 集思會議中心分點
branches = [
    {
        "name": "集思交通部國際會議中心",
        "url": "https://www.meeting.com.tw/motc/index.php",
        "rooms": [
            {"name": "auditorium.php", "url": "https://www.meeting.com.tw/motc/auditorium.php"},
            {"name": "plenary-hall.php", "url": "https://www.meeting.com.tw/motc/plenary-hall.php"},
            {"name": "room-202.php", "url": "https://www.meeting.com.tw/motc/room-202.php"},
            {"name": "room-201.php", "url": "https://www.meeting.com.tw/motc/room-201.php"},
        ]
    },
    {
        "name": "集思北科大會議中心",
        "url": "https://www.meeting.com.tw/ntut/index.php",
        "rooms": []
    },
    {
        "name": "集思竹科會議中心",
        "url": "https://www.meeting.com.tw/hsp/index.php",
        "rooms": []
    },
    {
        "name": "集思台中文心會議中心",
        "url": "https://www.meeting.com.tw/wenxin/index.php",
        "rooms": []
    },
    {
        "name": "集思台中新烏日會議中心",
        "url": "https://www.meeting.com.tw/xinwuri/index.php",
        "rooms": []
    },
    {
        "name": "集思國際會議高雄分公司",
        "url": "https://www.meeting.com.tw/kaohsiung/index.php",
        "rooms": []
    },
]

def extract_rooms_from_index(html_content, branch_url):
    """從分點首頁提取會議室清單"""

    rooms = []

    # 尋找會議室連結和大小資訊
    room_pattern = r'href="([^"]+\.php)"[^>]*title="([^"]*)"'
    matches = re.findall(room_pattern, html_content)

    for match in matches:
        room_url = match[0]
        title_info = match[1]

        # 解析標題資訊
        room_type = None
        room_size = None

        if "平面" in title_info:
            room_type = "平面會議空間"
        elif "階梯" in title_info:
            room_type = "階梯教室型" if "教室" in title_info else "階梯劇院型"
        elif "教室" in title_info:
            room_type = "教室"

        # 提取坪數
        size_match = re.search(r'(\d+\.?\d*)坪', title_info)
        if size_match:
            room_size = size_match.group(1)

        # 完整 URL
        full_url = urljoin(branch_url, room_url) if not room_url.startswith('http') else room_url

        # 提取會議室名稱
        room_name_match = re.search(r'([^/]+)\.php', room_url)
        if room_name_match:
            room_name = room_name_match.group(1)
            room_name = room_name.replace('-', ' ').title()
        else:
            room_name = room_url

        rooms.append({
            "name": room_name,
            "url": full_url,
            "type": room_type,
            "size": f"{room_size}坪" if room_size else None,
            "source": full_url
        })

    return rooms

def extract_room_details(html_content, room_info):
    """從會議室頁面提取詳細資訊"""

    details = {
        "name": room_info["name"],
        "type": room_info.get("type"),
        "size": room_info.get("size"),
        "source": room_info["source"],
        "photos": [],
        "capacity": {},
        "pricing": {},
        "equipment": []
    }

    # 提取照片
    photo_patterns = [
        r'<img[^>]+src="([^"]+\.(jpg|jpeg|png|gif))"',
    ]
    for pattern in photo_patterns:
        photos = re.findall(pattern, html_content, re.IGNORECASE)
        for photo in photos:
            photo_url = photo[0] if isinstance(photo, tuple) else photo
            if not photo_url.startswith('http'):
                photo_url = urljoin(room_info["source"], photo_url)
            if 'images/lease' in photo_url or 'images/room' in photo_url:
                if photo_url not in details["photos"]:
                    details["photos"].append(photo_url)

    # 提取容納人數
    capacity_patterns = [
        r'容納(\d+)人',
        r'(\d+)人',
        r'容量(\d+)',
        r'座位(\d+)',
        r'劇院型(\d+)',
        r'教室型(\d+)',
    ]
    for pattern in capacity_patterns:
        matches = re.findall(pattern, html_content)
        for match in matches:
            if match.isdigit() and int(match) < 1000:  # 過濾掉不合理的數字
                if "theater" not in details["capacity"]:
                    details["capacity"]["theater"] = int(match)

    # 提取價格
    price_patterns = [
        r'\(平日\)每時段.*?([0-9,]+)元',
        r'\(假日\)每時段.*?([0-9,]+)元',
        r'平日.*?([0-9,]+)元',
        r'假日.*?([0-9,]+)元',
    ]
    for i, pattern in enumerate(price_patterns):
        match = re.search(pattern, html_content)
        if match:
            price = int(match.group(1).replace(',', ''))
            if i < 2:
                if i == 0 and "weekday" not in details["pricing"]:
                    details["pricing"]["weekday"] = price
                elif i == 1 and "weekend" not in details["pricing"]:
                    details["pricing"]["weekend"] = price

    return details

def main():
    print("=" * 80)
    print("集思會議中心全部分點會議室資料收集")
    print("=" * 80)

    all_branches_data = []

    for branch in branches:
        print(f"\n正在收集: {branch['name']}")
        print(f"URL: {branch['url']}")

        # 獲取分點首頁
        try:
            result = subprocess.run(
                ['curl', '-L', '-A', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                 branch['url']],
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0 and result.stdout:
                html_content = result.stdout

                # 如果沒有預定義的會議室，則從首頁提取
                if not branch.get("rooms"):
                    rooms = extract_rooms_from_index(html_content, branch['url'])
                else:
                    rooms = branch["rooms"]

                print(f"  找到 {len(rooms)} 個會議室")

                branch_data = {
                    "name": branch["name"],
                    "url": branch["url"],
                    "rooms": []
                }

                # 收集每個會議室的詳細資訊
                for i, room in enumerate(rooms, 1):
                    print(f"  [{i}/{len(rooms)}] 收集: {room.get('name', room['url'])}")

                    try:
                        room_result = subprocess.run(
                            ['curl', '-L', '-A', 'Mozilla/5.0', room['url']],
                            capture_output=True,
                            text=True,
                            timeout=30
                        )

                        if room_result.returncode == 0 and room_result.stdout:
                            room_details = extract_room_details(room_result.stdout, room)
                            branch_data["rooms"].append(room_details)
                            print(f"    容量: {room_details.get('capacity', {})}")
                            print(f"    照片: {len(room_details.get('photos', []))} 張")
                        else:
                            print(f"    ❌ 獲取失敗")
                    except Exception as e:
                        print(f"    ❌ 錯誤: {e}")

                all_branches_data.append(branch_data)
            else:
                print(f"  ❌ 無法訪問")

        except Exception as e:
            print(f"  ❌ 錯誤: {e}")

    # 保存資料
    output_file = "/root/.openclaw/workspace/taiwan-venues/gis-conference-rooms.json"

    conference_center_data = {
        "name": "集思會議中心",
        "venueType": "會議中心集團",
        "venueUrl": "https://www.meeting.com.tw/",
        "branches": all_branches_data,
        "totalRooms": sum(len(b.get("rooms", [])) for b in all_branches_data),
        "totalBranches": len(all_branches_data),
        "lastUpdated": "2026-02-28",
        "dataSource": "https://www.meeting.com.tw/"
    }

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(conference_center_data, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 80)
    print(f"✅ 資料收集完成！共收集 {len(all_branches_data)} 個分點，{conference_center_data['totalRooms']} 個會議室")
    print(f"📁 資料已保存至: {output_file}")
    print("=" * 80)

if __name__ == "__main__":
    main()
