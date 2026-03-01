#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
從維基百科提取照片
"""

import requests
import re
import json
import time
from urllib.parse import unquote

def get_wikipedia_image_url(file_page_url):
    """從維基百科檔案頁面提取原始圖片網址"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(file_page_url, headers=headers, timeout=10)
        html = response.text
        
        # 尋找原始檔案連結
        # 格式：href="//upload.wikimedia.org/wikipedia/commons/..."
        pattern = r'href="(//upload\.wikimedia\.org/wikipedia/commons/[^"]+)"'
        matches = re.findall(pattern, html)
        
        if matches:
            # 取第一個（通常是原始檔案）
            img_url = matches[0]
            if img_url.startswith('//'):
                img_url = 'https:' + img_url
            return img_url
        
        return None
    except Exception as e:
        print(f"  ❌ 提取失敗: {e}")
        return None

def extract_wikipedia_photos(wiki_url):
    """從維基百科頁面提取所有照片"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        print(f"正在爬取: {wiki_url}")
        response = requests.get(wiki_url, headers=headers, timeout=15)
        html = response.text
        
        # 提取所有檔案連結
        pattern = r'/wiki/File:([^"]+)"'
        file_names = re.findall(pattern, html)
        
        # 去重
        file_names = list(set(file_names))
        
        print(f"  找到 {len(file_names)} 個檔案")
        
        images = []
        for file_name in file_names[:10]:  # 只處理前10個
            file_name = unquote(file_name)
            file_url = f"https://zh.wikipedia.org/wiki/File:{file_name}"
            
            print(f"  處理: {file_name}")
            img_url = get_wikipedia_image_url(file_url)
            
            if img_url:
                images.append({
                    'file_name': file_name,
                    'file_page': file_url,
                    'image_url': img_url
                })
                print(f"    ✅ {img_url}")
            
            time.sleep(0.5)  # 避免請求太快
        
        return images
        
    except Exception as e:
        print(f"❌ 爬取失敗: {e}")
        return []

# 主程式
if __name__ == '__main__':
    # 台北國際會議中心
    wiki_url = "https://zh.wikipedia.org/wiki/台北國際會議中心"
    
    print("="*80)
    print("📍 從維基百科提取照片")
    print("="*80)
    print()
    
    images = extract_wikipedia_photos(wiki_url)
    
    if images:
        print(f"\n✅ 成功提取 {len(images)} 張照片")
        
        # 儲存結果
        with open('wikipedia_photos.json', 'w', encoding='utf-8') as f:
            json.dump(images, f, ensure_ascii=False, indent=2)
        
        print("✅ 已儲存到 wikipedia_photos.json")
    else:
        print("\n❌ 沒有找到照片")
