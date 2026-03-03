# Gemini Prompt - 簡潔版（直接複製使用）

```
請驗證以下 30 個台灣飯店是否有會議室。這些飯店被標記為「下架」，需要確認是否真的無會議室。

【驗證清單】
1. 六福萬怡酒店 - https://www.courtyard.com/taipei
2. 台中中港大飯店 - http://www.harbor-hotel.com.tw/
3. 台中全国大飯店 - https://www.hotel-national.com.tw/
4. 台中日月千禧酒店 - https://www.millenniumhotels.com/zh-tw/taichung/
5. 台中日航酒店 - https://www.nikko-taichung.com/
6. 台中林酒店 - https://www.thelin.com.tw/
7. 台中永豐棧酒店 - https://www.tempus.com.tw/
8. 台中福華大飯店 - https://www.howard-hotels.com.tw/zh_TW/HotelBusiness/96
9. 台中裕元花園酒店 - https://www.windsortaiwan.com/
10. 台南劍橋大飯店 - http://www.cambridge-hotel.com.tw/
11. 台南和逸飯店 - https://hotelcozzi.com/tainan-ximen/
12. 台東娜路彎大酒店 - https://www.naruwan-hotel.com.tw/
13. 台東知本老爺酒店 - https://www.hotelroyal.com.tw/zh-tw/chihpen
14. 嘉義兆品酒店 - https://chiayi.maisondechinehotel.com/
15. 嘉義耐斯王子大飯店 - https://www.niceprincehotel.com.tw/
16. 基隆華國大飯店 - https://www.huakuo.com.tw
17. 基隆長榮桂冠酒店 - https://www.evergreen-hotels.com/branch2/?d1b_sn=4
18. 傳藝老爺行旅 - https://www.hotelroyal.com.tw/yilan
19. 宜蘭傳藝老爺行旅 - https://www.yilanhotelroyal.com
20. 墾丁凱撒大飯店 - https://kenting.caesarpark.com.tw/
21. 台北淡水將捷金鬱金香酒店 - https://www.goldentulip-fabhotel.com.tw/
22. 台北淡水承億酒店 - https://www.hotelday.com.tw/hotel.aspx?id=12
23. 新竹喜來登大飯店 - https://www.marriott.com/en-us/hotels/hszsi-sheraton-hsinchu-hotel/
24. 桃園假日酒店 - https://www.ihg.com/holidayinn/hotels/tw/zh/taoyuan/tyntw/hoteldetail
25. 桃園南方莊園度假飯店 - https://www.southgarden.com.tw/
26. 澎湖福朋喜來登酒店 - https://www.fourpoints-penghu.com/
27. 彰化桂冠歐悅酒店 - https://www.ohya.com.tw/
28. 嘉義長榮文苑酒店 - https://www.evergreen-hotels.com/branch2/?d1b_sn=65
29. 南投涵碧樓大飯店 - https://www.thelalu.com.tw/
30. 南投溪頭妖怪主題飯店 - https://www.mingshan.com.tw/

【輸出格式】
對於有會議室的飯店，請以 JSON 格式輸出：

```json
[
  {
    "id": "場地ID（從上面列表的序號）",
    "name": "飯店名稱",
    "url": "官網URL",
    "venueListUrl": "會議室頁面URL",
    "roomsCount": 會議室數量,
    "roomNames": ["會議室1", "會議室2"],
    "notes": "說明"
  }
]
```

【重要】
- 只輸出有會議室的飯店
- 確實無會議室的不需要輸出
- 請優先查找官方網站的「會議室」、「宴會廳」、「場地租借」頁面
```

---

**使用方式**：
1. 複製以上提示詞
2. 貼到 Google Gemini（https://gemini.google.com）
3. 收到 JSON 回應後，提供給我更新資料庫
