#!/usr/bin/env python3
"""
Agent 調度器 - 用於啟動和管理各個 Agent 任務
"""

import json
import os
from datetime import datetime
from pathlib import Path

# 配置路徑
BASE_DIR = Path("/root/.openclaw/workspace/taiwan-venues/agents")
CONFIG_FILE = BASE_DIR / "config.json"
TASK_BOARD = BASE_DIR / "shared" / "tasks" / "board.json"

def load_config():
    """載入 Agent 配置"""
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_task_board():
    """載入任務看板"""
    with open(TASK_BOARD, 'r', encoding='utf-8') as f:
        return json.load(f)

def get_agent_prompt(agent_id: str) -> str:
    """取得指定 Agent 的 prompt"""
    config = load_config()
    agent = config['agents'].get(agent_id)
    
    if not agent:
        return None
    
    soul_path = BASE_DIR / agent_id / "SOUL.md"
    with open(soul_path, 'r', encoding='utf-8') as f:
        return f.read()

def dispatch_task(task_id: str, agent_id: str):
    """分派任務給指定 Agent"""
    board = load_task_board()
    
    # 找到任務
    task = None
    for t in board['board']['todo']:
        if t['id'] == task_id:
            task = t
            break
    
    if not task:
        return {"error": "Task not found"}
    
    # 更新狀態
    task['status'] = 'in_progress'
    task['assignee'] = agent_id
    task['startedAt'] = datetime.now().isoformat()
    
    # 移動到進行中
    board['board']['todo'].remove(task)
    board['board']['inProgress'].append(task)
    board['board']['stats']['pending'] -= 1
    board['board']['stats']['inProgress'] += 1
    
    # 儲存
    with open(TASK_BOARD, 'w', encoding='utf-8') as f:
        json.dump(board, f, ensure_ascii=False, indent=2)
    
    return {
        "success": True,
        "task": task,
        "agent": agent_id,
        "prompt": get_agent_prompt(agent_id)
    }

def complete_task(task_id: str, result: str):
    """完成任務"""
    board = load_task_board()
    
    # 找到任務
    task = None
    for t in board['board']['inProgress']:
        if t['id'] == task_id:
            task = t
            break
    
    if not task:
        return {"error": "Task not found in progress"}
    
    # 更新狀態
    task['status'] = 'completed'
    task['result'] = result
    task['completedAt'] = datetime.now().isoformat()
    
    # 移動到已完成
    board['board']['inProgress'].remove(task)
    board['board']['completed'].append(task)
    board['board']['stats']['inProgress'] -= 1
    board['board']['stats']['completed'] += 1
    
    # 儲存
    with open(TASK_BOARD, 'w', encoding='utf-8') as f:
        json.dump(board, f, ensure_ascii=False, indent=2)
    
    return {"success": True, "task": task}

def get_daily_report():
    """生成每日報告"""
    config = load_config()
    board = load_task_board()
    
    stats = board.get('stats', {
        'total': len(board['board']['todo']) + len(board['board']['inProgress']) + len(board['board']['completed']),
        'pending': len(board['board']['todo']),
        'inProgress': len(board['board']['inProgress']),
        'completed': len(board['board']['completed']),
        'blocked': len(board['board']['blocked'])
    })
    
    report = f"""
📊 台灣活動場地資料庫 - 每日進度報告
日期：{datetime.now().strftime('%Y-%m-%d %H:%M')}

📈 任務統計：
- 待辦：{stats['pending']}
- 進行中：{stats['inProgress']}
- 已完成：{stats['completed']}
- 阻塞：{stats['blocked']}

📍 資料庫狀態：
- 總場地數：{config['dataStatus']['totalVenues']}
- 台北市：{config['dataStatus']['cities']['台北市']}
- 新北市：{config['dataStatus']['cities']['新北市']}

✅ 今日完成：
"""
    
    for task in board['board']['completed']:
        if task.get('completedAt', '').startswith(datetime.now().strftime('%Y-%m-%d')):
            report += f"- {task['title']}（{task['assignee']}）\n"
    
    report += "\n🔄 進行中：\n"
    for task in board['board']['inProgress']:
        report += f"- {task['title']}（{task['assignee']}）\n"
    
    report += "\n📋 明日計畫：\n"
    for task in board['board']['todo'][:3]:
        report += f"- {task['title']}（{task['assignee']}）\n"
    
    return report

if __name__ == "__main__":
    # 測試
    print(get_daily_report())
