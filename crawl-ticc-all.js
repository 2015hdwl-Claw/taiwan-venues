// TICC 所有會議室批量抓取腳本
// 使用 agent-browser 逐一抓取每個會議室的詳細資料

const { execSync } = require('child_process');
const fs = require('fs');

// TICC 所有會議室 URL
const venues = [
  { name: "大會堂", roomId: "PH", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=PH&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101全室", roomId: "101", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101A", roomId: "101A", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101A&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101AB", roomId: "101AB", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101AB&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101B", roomId: "101B", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101B&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101C", roomId: "101C", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101C&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101CD", roomId: "101CD", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101CD&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "101D", roomId: "101D", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=101D&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "102", roomId: "102", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=102&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "103", roomId: "103", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=103&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "105", roomId: "105", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=105&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "106", roomId: "106", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=106&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "1F北貴賓室", roomId: "1FVIP_N", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=1FVIP_N&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "1F南貴賓室", roomId: "1FVIP_S", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=1FVIP_S&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201全室", roomId: "201", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201A", roomId: "201A", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201A&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201AB", roomId: "201AB", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201AB&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201ABC", roomId: "201ABC", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201ABC&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201ABEF", roomId: "201ABEF", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201ABEF&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201AF", roomId: "201AF", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201AF&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201B", roomId: "201B", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201B&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201BC", roomId: "201BC", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201BC&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201BCDE", roomId: "201BCDE", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201BCDE&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201BE", roomId: "201BE", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201BE&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201C", roomId: "201C", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201C&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201CD", roomId: "201CD", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201CD&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201D", roomId: "201D", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201D&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201DE", roomId: "201DE", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201DE&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201DEF", roomId: "201DEF", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201DEF&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201E", roomId: "201E", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201E&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201EF", roomId: "201EF", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201EF&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "201F", roomId: "201F", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=201F&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "202全室", roomId: "202", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=202&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "202A", roomId: "202A", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=202A&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "202B", roomId: "202B", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=202B&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "203全室", roomId: "203", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=203&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "203A", roomId: "203A", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=203A&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "203B", roomId: "203B", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=203B&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "3樓宴會廳", roomId: "3FBA", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=3FBA&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "3樓北軒", roomId: "3FLG_N", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=3FLG_N&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "3樓南軒", roomId: "3FLG_S", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=3FLG_S&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "401會議室", roomId: "401", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=401&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "4樓悅軒", roomId: "402", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=402&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "4樓雅軒", roomId: "4FLGN", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=4FLGN&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" },
  { name: "4樓鳳凰廳", roomId: "4FVIP", url: "https://www.ticc.com.tw/wSite/sp?xdUrl=/wSite/ap/cp_VenueSearch.jsp&roomId=4FVIP&ctNode=322&CtUnit=99&BaseDSD=7&mp=1" }
];

console.log(`總共 ${venues.length} 個會議室需要抓取`);
console.log('');

// 輸出為 JSON 供後續處理
fs.writeFileSync('ticc-all-rooms.json', JSON.stringify(venues, null, 2));
console.log('會議室列表已儲存到 ticc-all-rooms.json');
