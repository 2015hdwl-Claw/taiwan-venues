// AI 對話服務
const https = require('https');

// GLM API 配置
const GLM_API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';
const GLM_API_KEY = (process.env.GLM_API_KEY_NEW || process.env.GLM_API_KEY || '').trim();

// 對話記憶 (session-based)
const sessions = new Map();

// 系統 prompt
const SYSTEM_PROMPT = `你是台灣場地搜尋助手。使用者會描述他們的活動需求，你需要幫助他們找到最適合的場地。

你的任務：
1. 理解使用者需求（人數、預算、地點、設備需求、活動類型）
2. 當使用者提供足夠資訊時，告訴他們你會幫忙搜尋
3. 推薦場地時要包含：名稱、地點、價格範圍、容納人數、特色
4. 主動詢問缺少的資訊（如果只知道部分需求）
5. 態度友善專業，回覆簡潔明瞭

重要資訊收集順序：
1. 活動類型（會議、培訓、宴會、發表會等）
2. 預估人數
3. 預算範圍
4. 希望的地點或城市
5. 特殊設備需求（投影機、音響、厨房等）

回覆格式：
- 使用條列式呈現重點
- 場地推薦最多 3-5 個
- 每個場地包含：名稱、地址、價格、容納人數、聯絡方式`;

// 呼叫 GLM API
async function callGLMAPI(messages) {
  return new Promise((resolve, reject) => {
    // 動態獲取並清理 API key
    const apiKey = (process.env.GLM_API_KEY_NEW || process.env.GLM_API_KEY || '').trim();

    if (!apiKey) {
      // 如果沒有 API key，返回模擬回應
      console.log('[GLM API] No API key found');
      resolve({
        choices: [{
          message: {
            content: '我了解您的需求了！請問您希望的活動地點是在哪個城市？預算大約是多少呢？'
          }
        }]
      });
      return;
    }

    console.log('[GLM API] Calling API with key length:', apiKey.length);

    const postData = JSON.stringify({
      model: 'glm-4.7-flash',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const options = {
      hostname: 'api.z.ai',
      port: 443,
      path: '/api/coding/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('[GLM API] Response status:', res.statusCode);
        try {
          const json = JSON.parse(data);
          if (json.error) {
            console.error('[GLM API] Error:', json.error);
          }
          resolve(json);
        } catch (error) {
          console.error('[GLM API] Parse error:', error.message);
          console.error('[GLM API] Raw data:', data.substring(0, 200));
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[GLM API] Request error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 處理對話
async function chat(sessionId, userMessage, searchResults = null) {
  // 取得或建立 session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      createdAt: new Date()
    });
  }

  const session = sessions.get(sessionId);

  // 如果有搜尋結果，加入上下文
  let contextMessage = userMessage;
  if (searchResults && searchResults.length > 0) {
    const venueInfo = searchResults.map((v, i) =>
      `${i + 1}. ${v.name}（${v.city}）
   - 地址: ${v.address}
   - 價格: ${v.minPrice === Infinity ? '請洽詢' : v.minPrice + '元起'}
   - 容納: ${v.maxCapacity}人
   - 聯絡: ${v.contactPhone}
   - Email: ${v.contactEmail}`
    ).join('\n');

    contextMessage = `根據搜尋結果，我找到以下場地：

${venueInfo}

請根據這些結果，用友善的方式推薦給使用者。`;
  }

  // 加入使用者訊息
  session.messages.push({ role: 'user', content: contextMessage });

  try {
    // 呼叫 AI
    const response = await callGLMAPI(session.messages);

    // 檢查 API 錯誤
    if (response.error) {
      console.error('[GLM API] API returned error:', response.error);
      throw new Error(response.error.message || 'API 調用失敗');
    }

    // 檢查回應格式
    if (!response.choices || !response.choices[0] || !response.choices[0].message) {
      console.error('[GLM API] Invalid response format:', JSON.stringify(response).substring(0, 200));
      throw new Error('API 回應格式錯誤');
    }

    // 取得 AI 回覆
    const aiMessage = response.choices[0].message.content;

    // 儲存 AI 回覆
    session.messages.push({ role: 'assistant', content: aiMessage });

    // 清理舊 session (保留最近 100 個)
    if (sessions.size > 100) {
      const oldestKey = sessions.keys().next().value;
      sessions.delete(oldestKey);
    }

    return {
      success: true,
      message: aiMessage,
      sessionId: sessionId
    };
  } catch (error) {
    console.error('AI Error:', error);
    return {
      success: false,
      message: '抱歉，我現在有點忙不過來。請稍後再試一次。',
      error: error.message
    };
  }
}

// 清理過期的 session (超過 1 小時)
function cleanExpiredSessions() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [sessionId, session] of sessions.entries()) {
    if (new Date(session.createdAt).getTime() < oneHourAgo) {
      sessions.delete(sessionId);
    }
  }
}

// 每小時清理一次
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = {
  chat,
  sessions
};
