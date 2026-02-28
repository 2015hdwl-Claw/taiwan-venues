#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新集思台大會議中心會議室資料，補充缺失的資訊
"""

import json
import re

# 手動收集的會議室詳細資料
room_details = {
    "The Forum": {
        "floor": "B1",
        "type": "階梯劇院/扇型會議廳",
        "size": "253.6坪/挑高6米",
        "capacity": {
            "theater": 400
        }
    },
    "Socrates": {
        "floor": "B1",
        "type": "階梯劇院/扇形會議廳",
        "size": "59.8坪",
        "capacity": {
            "theater": 145
        }
    },
    "Alexander": {
        "floor": "B1",
        "type": "平面會議空間",
        "size": "31.3坪",
        "capacity": {
            "theater": 70,
            "classroom": 54
        }
    },
    "Plato": {
        "floor": "B1",
        "type": "平面式菱形多用途會議廳",
        "size": "69.3坪",
        "capacity": {
            "theater": 220,
            "classroom": 150
        }
    },
    "Aristotle": {
        "floor": "B1",
        "type": "平面教室",
        "size": "10.5坪",
        "capacity": {
            "theater": 18,
            "classroom": 18
        }
    },
    "Archimedes": {
        "floor": "B1",
        "type": "平面會議空間",
        "size": "31.3坪",
        "capacity": {
            "theater": 70,
            "classroom": 54
        }
    },
    "Locke": {
        "floor": "B1",
        "type": "平面會議空間",
        "size": "37.7坪",
        "capacity": {
            "theater": 120,
            "classroom": 90
        }
    },
    "Davinci": {
        "floor": "B1",
        "type": "階梯型會議空間",
        "size": "41.4坪",
        "capacity": {
            "classroom": 48
        }
    },
    "Raphael": {
        "floor": "B1",
        "type": "階梯型會議空間",
        "size": "41.4坪",
        "capacity": {
            "classroom": 72
        }
    },
    "Michelangelo": {
        "floor": "B1",
        "type": "階梯型會議空間",
        "size": "41.4坪",
        "capacity": {
            "classroom": 72
        }
    },
    "Nietzsche": {
        "floor": "B1",
        "type": "階梯型會議空間",
        "size": "41.4坪",
        "capacity": {
            "classroom": 48
        }
    }
}

def main():
    # 讀取原始資料
    input_file = "/root/.openclaw/workspace/taiwan-venues/gis-ntu-rooms.json"
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 更新每個會議室的資料
    for room in data["rooms"]:
        room_name = room.get("name")
        if room_name in room_details:
            details = room_details[room_name]
            room["floor"] = details.get("floor", room.get("floor"))
            room["type"] = details.get("type", room.get("type"))
            room["size"] = details.get("size", room.get("size"))

            # 更新容量
            if "capacity" in details:
                for capacity_type, value in details["capacity"].items():
                    if capacity_type not in room["capacity"]:
                        room["capacity"][capacity_type] = value

            # 清理設備清單（移除空項目）
            room["equipment"] = [e for e in room.get("equipment", []) if e.strip() and len(e) < 100]
            room["features"] = [f for f in room.get("features", []) if f.strip() and len(f) < 100]

    # 保存更新後的資料
    output_file = "/root/.openclaw/workspace/taiwan-venues/gis-ntu-rooms.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print("=" * 80)
    print("✅ 資料更新完成！")
    print(f"📁 資料已保存至: {output_file}")
    print("=" * 80)

    # 顯示更新摘要
    print("\n會議室資料摘要:")
    print("-" * 80)
    for room in data["rooms"]:
        print(f"  {room['name']}")
        print(f"    樓層: {room.get('floor', 'N/A')}")
        print(f"    類型: {room.get('type', 'N/A')}")
        print(f"    大小: {room.get('size', 'N/A')}")
        print(f"    容量: {room.get('capacity', {})}")
        print(f"    價格: {room.get('pricing', {})}")
        print(f"    照片: {len(room.get('photos', []))} 張")
        print()

if __name__ == "__main__":
    main()
