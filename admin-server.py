#!/usr/bin/env python3
"""
場地資料庫後台管理伺服器
啟動方式: python3 admin-server.py
預設網址: http://localhost:8080
"""

import http.server
import json
import os
from urllib.parse import parse_qs, urlparse

PORT = 8080
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
MAIN_DB = os.path.join(DATA_DIR, 'venues-all-cities.json')

class VenueAdminHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DATA_DIR, **kwargs)
    
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == '/api/venues':
            self.get_venues(parsed.query)
        elif parsed.path == '/api/stats':
            self.get_stats()
        elif parsed.path == '/':
            self.redirect('/admin.html')
        else:
            super().do_GET()
    
    def do_POST(self):
        parsed = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        if parsed.path == '/api/venues/save':
            self.save_venues(body)
        elif parsed.path == '/api/venue/update':
            self.update_venue(body)
        elif parsed.path == '/api/venue/delete':
            self.delete_venue(body)
        else:
            self.send_error(404, 'Not Found')
    
    def get_venues(self, query):
        try:
            with open(MAIN_DB, 'r', encoding='utf-8') as f:
                venues = json.load(f)
            
            # 解析查詢參數
            params = parse_qs(query)
            
            # 篩選
            if 'city' in params and params['city'][0]:
                city = params['city'][0]
                venues = [v for v in venues if v.get('city') == city]
            
            if 'type' in params and params['type'][0]:
                venue_type = params['type'][0]
                venues = [v for v in venues if v.get('venueType') == venue_type]
            
            # 狀態篩選（預設只顯示上架）
            status = params.get('status', ['上架'])[0]
            if status:
                venues = [v for v in venues if v.get('status', '上架') == status]
            
            if 'search' in params and params['search'][0]:
                keyword = params['search'][0].lower()
                venues = [v for v in venues if 
                    keyword in v.get('name', '').lower() or
                    keyword in v.get('address', '').lower() or
                    keyword in v.get('roomName', '').lower()]
            
            self.send_json(venues)
        except Exception as e:
            self.send_error(500, str(e))
    
    def get_stats(self):
        try:
            with open(MAIN_DB, 'r', encoding='utf-8') as f:
                venues = json.load(f)
            
            cities = {}
            types = {}
            issues = []
            
            for v in venues:
                city = v.get('city', '未知')
                cities[city] = cities.get(city, 0) + 1
                
                vt = v.get('venueType', '未知')
                types[vt] = types.get(vt, 0) + 1
                
                # 檢查問題
                if not v.get('contactPhone'):
                    issues.append({'id': v.get('id'), 'name': v.get('name'), 'issue': '缺少電話'})
                if not v.get('images') or len(v.get('images', [])) == 0:
                    issues.append({'id': v.get('id'), 'name': v.get('name'), 'issue': '缺少照片'})
                if not v.get('priceHalfDay') and not v.get('priceFullDay') and not v.get('pricePerHour'):
                    issues.append({'id': v.get('id'), 'name': v.get('name'), 'issue': '缺少價格'})
            
            # 狀態統計
            status_count = {'上架': 0, '下架': 0}
            for v in venues:
                s = v.get('status', '上架')
                status_count[s] = status_count.get(s, 0) + 1
            
            self.send_json({
                'total': len(venues),
                'cities': cities,
                'types': types,
                'status': status_count,
                'issues': issues
            })
        except Exception as e:
            self.send_error(500, str(e))
    
    def save_venues(self, body):
        try:
            data = json.loads(body)
            with open(MAIN_DB, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            self.send_json({'success': True, 'message': '儲存成功'})
        except Exception as e:
            self.send_json({'success': False, 'message': str(e)}, 500)
    
    def update_venue(self, body):
        try:
            update = json.loads(body)
            venue_id = update.get('id')
            
            with open(MAIN_DB, 'r', encoding='utf-8') as f:
                venues = json.load(f)
            
            for i, v in enumerate(venues):
                if v.get('id') == venue_id:
                    venues[i] = {**v, **update}
                    break
            
            with open(MAIN_DB, 'w', encoding='utf-8') as f:
                json.dump(venues, f, ensure_ascii=False, indent=2)
            
            self.send_json({'success': True, 'message': '更新成功'})
        except Exception as e:
            self.send_json({'success': False, 'message': str(e)}, 500)
    
    def delete_venue(self, body):
        try:
            data = json.loads(body)
            venue_id = data.get('id')
            
            with open(MAIN_DB, 'r', encoding='utf-8') as f:
                venues = json.load(f)
            
            venues = [v for v in venues if v.get('id') != venue_id]
            
            with open(MAIN_DB, 'w', encoding='utf-8') as f:
                json.dump(venues, f, ensure_ascii=False, indent=2)
            
            self.send_json({'success': True, 'message': '刪除成功'})
        except Exception as e:
            self.send_json({'success': False, 'message': str(e)}, 500)
    
    def send_json(self, data, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def redirect(self, location):
        self.send_response(302)
        self.send_header('Location', location)
        self.end_headers()
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    print(f"🏛️ 場地資料庫後台管理系統")
    print(f"📊 資料檔案: {MAIN_DB}")
    print(f"🌐 啟動網址: http://localhost:{PORT}")
    print(f"⚠️  按 Ctrl+C 停止伺服器")
    print()
    
    server = http.server.HTTPServer(('', PORT), VenueAdminHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 伺服器已停止")
