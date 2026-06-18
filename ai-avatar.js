/**
 * ai-avatar.js
 * 耀德植研生醫 · Phase 3 · AI Health Consultant Avatar
 * 全站智慧健康顧問 · Chatbot · 語音引導 · 智能推薦
 */

class AIHealthAvatar {
  constructor() {
    this.isOpen      = false;
    this.isTyping    = false;
    this.msgHistory  = [];
    this.context     = { page: this._detectPage() };
    this._inject();
    this._bind();
    setTimeout(() => this._greet(), 1800);
  }

  /* ── 偵測當前頁面 ── */
  _detectPage() {
    const p = location.pathname;
    if (p.includes('experience'))     return 'experience';
    if (p.includes('digital-twin'))   return 'digital-twin';
    if (p.includes('health-dashboard')) return 'dashboard';
    if (p.includes('product'))        return 'product';
    if (p.includes('antrodia'))       return 'antrodia';
    if (p.includes('shop'))          return 'shop';
    return 'home';
  }

  /* ── 注入 HTML ── */
  _inject() {
    const wrap = document.createElement('div');
    wrap.id = 'ai-avatar-wrap';
    wrap.innerHTML = `
      <!-- Chat Panel -->
      <div id="chat-panel">
        <div class="chat-header">
          <div class="chat-avatar-sm">🤖</div>
          <div class="chat-title">
            <strong>耀德 AI 健康顧問</strong>
            <span>⬤ 線上中 · 立即回覆</span>
          </div>
          <button class="chat-close" id="chat-close-btn" aria-label="關閉">×</button>
        </div>
        <div class="chat-messages" id="chat-messages"></div>
        <div class="chat-quick-btns" id="chat-quick-btns"></div>
        <div class="chat-input-area">
          <textarea class="chat-input" id="chat-input"
            placeholder="詢問健康問題、產品建議…" rows="1"></textarea>
          <button class="chat-send" id="chat-send-btn" aria-label="送出">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" width="18" height="18">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Avatar Bubble -->
      <div class="avatar-bubble" id="avatar-bubble" aria-label="開啟 AI 健康顧問">
        <div class="status-ring"></div>
        <div class="pulse-ring"></div>
        🤖
      </div>
    `;
    document.body.appendChild(wrap);
  }

  /* ── 事件綁定 ── */
  _bind() {
    document.getElementById('avatar-bubble').addEventListener('click', () => this.toggle());
    document.getElementById('chat-close-btn').addEventListener('click', () => this.close());
    document.getElementById('chat-send-btn').addEventListener('click', () => this._sendUser());

    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendUser();
      }
    });
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });
  }

  /* ── 開關 ── */
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  open() {
    this.isOpen = true;
    document.getElementById('chat-panel').classList.add('open');
    document.getElementById('chat-input').focus();
  }
  close() {
    this.isOpen = false;
    document.getElementById('chat-panel').classList.remove('open');
  }

  /* ── 初始問候 ── */
  _greet() {
    const greets = {
      home:        '您好！我是耀德 AI 健康顧問 🌿\n\n我可以幫您了解牛樟芝功效、找到最適合您的產品，或導覽我們的沉浸式 3D 體驗。\n\n請問您今天最關心什麼健康議題？',
      experience:  '歡迎進入耀德 3D 沉浸式體驗空間！🔬\n\n您可以旋轉產品模型、點擊成分節點查看研究數據，或讓我帶您導覽虛擬工廠。\n\n需要我解說哪個成分嗎？',
      'digital-twin': '歡迎來到耀德虛擬品牌館！🏛️\n\n這裡有沉浸式產品展示空間，您可以在 3D 環境中瀏覽、體驗並直接選購。\n\n有感興趣的產品嗎？',
      dashboard:   '您好，歡迎回到您的健康儀表板！📊\n\n我已為您準備了本週健康摘要與 AI 補充建議。\n\n需要我解讀您的健康數據嗎？',
      product:     '您好！正在查看我們的明星產品 🌟\n\n需要了解成分說明、適合對象，或想比較不同方案嗎？',
      antrodia:    '您好！正在探索牛樟芝的科學世界 🍄\n\n三萜類、多醣體、抗氧化——需要我詳細解說哪個功效機制嗎？',
      shop:        '您好！準備選購了嗎？🛒\n\n我可以根據您的健康需求，幫您推薦最適合的產品組合，讓保健更精準有效。',
    };
    const msg = greets[this.context.page] || greets.home;
    this._addMsg('bot', msg);
    this._setQuickBtns(this._getContextQuickBtns());
  }

  /* ── 快速按鈕依頁面 ── */
  _getContextQuickBtns() {
    const map = {
      home:     ['牛樟芝功效', '產品推薦', '3D 體驗導覽', '查看會員方案'],
      experience: ['三萜類是什麼', '段木栽培說明', '虛擬工廠導覽', '加入購物車'],
      'digital-twin': ['查看旗艦產品', '比較方案', '優惠活動', '訂閱方案'],
      dashboard: ['本週健康分析', '補充建議', '服用提醒', '回購時間'],
      product:  ['成分說明', '適合對象', '如何服用', '加入購物車'],
      antrodia: ['三萜類研究', '多醣體功效', '栽培方式比較', '購買推薦'],
      shop:     ['幫我推薦', '入門組合', '進階方案', '訂閱折扣'],
    };
    return map[this.context.page] || map.home;
  }

  /* ── 設定快速按鈕 ── */
  _setQuickBtns(btns) {
    const container = document.getElementById('chat-quick-btns');
    container.innerHTML = btns.map(b =>
      `<button class="chat-quick-btn" onclick="window._aiAvatar._sendQuick('${b}')">${b}</button>`
    ).join('');
  }

  /* ── 快速送出 ── */
  _sendQuick(text) {
    document.getElementById('chat-input').value = text;
    this._sendUser();
  }

  /* ── 使用者送出 ── */
  _sendUser() {
    const input = document.getElementById('chat-input');
    const text  = input.value.trim();
    if (!text || this.isTyping) return;
    input.value = '';
    input.style.height = 'auto';
    this._addMsg('user', text);
    this.msgHistory.push({ role: 'user', content: text });
    this._aiReply(text);
  }

  /* ── 新增訊息 ── */
  _addMsg(role, text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if (role === 'bot') {
      div.innerHTML = `<div class="msg-label">耀德 AI 顧問</div>${this._formatText(text)}`;
    } else {
      div.textContent = text;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  _formatText(text) {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  /* ── 打字動畫 ── */
  _showTyping() {
    const container = document.getElementById('chat-messages');
    const dots = document.createElement('div');
    dots.className = 'msg bot';
    dots.id = 'typing-indicator';
    dots.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div>`;
    container.appendChild(dots);
    container.scrollTop = container.scrollHeight;
  }
  _hideTyping() {
    const d = document.getElementById('typing-indicator');
    if (d) d.remove();
  }

  /* ── AI 回覆引擎 ── */
  _aiReply(userText) {
    this.isTyping = true;
    this._showTyping();
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      this._hideTyping();
      const reply = this._generateReply(userText.toLowerCase());
      this._addMsg('bot', reply.text);
      this.msgHistory.push({ role: 'bot', content: reply.text });
      if (reply.quickBtns) this._setQuickBtns(reply.quickBtns);
      this.isTyping = false;
    }, delay);
  }

  /* ── 知識庫回覆生成 ── */
  _generateReply(text) {
    /* 牛樟芝成分類 */
    if (this._match(text, ['三萜', 'triterp', '多醣', 'polysacc', '活性物', '成分'])) {
      return {
        text: `牛樟芝的核心活性成分主要有三大類：\n\n🔬 **三萜類化合物**：已發現 70+ 種，是最重要的免疫調節成分，段木栽培的含量是液態菌絲體的 8–12 倍。\n\n🛡️ **多醣體 (β-葡聚醣)**：具有強力免疫活化作用，啟動自然殺手細胞 (NK cell) 活性。\n\n⚡ **超氧化物歧化酶 (SOD)**：清除自由基的天然抗氧化酵素，保護細胞免於氧化損傷。\n\n耀德使用段木栽培子實體，保留最完整的活性物質組成。`,
        quickBtns: ['段木 vs 液態培養', '科學研究論文', '推薦產品', '如何挑選牛樟芝'],
      };
    }

    /* 功效類 */
    if (this._match(text, ['功效', '功能', '好處', '作用', '效果', '適合'])) {
      return {
        text: `耀德牛樟芝的主要健康功效，均有 SCI 科學論文支持：\n\n🌿 **免疫調節**：活化 NK 細胞、T 細胞，強化先天及後天免疫系統\n\n🫁 **護肝保肝**：改善 ALT、AST 指數，支持肝細胞再生修復\n\n💪 **抗氧化**：消除自由基，減緩細胞老化與慢性發炎\n\n😴 **改善疲勞**：協同馬卡、紅參，提升粒線體能量代謝\n\n特別適合：熬夜族、壓力族、工作繁忙者、重視免疫健康的您。`,
        quickBtns: ['適合我嗎？', '查看產品', '科學根據', '需要多久見效'],
      };
    }

    /* 產品推薦類 */
    if (this._match(text, ['推薦', '哪個', '選擇', '比較', '哪種', '適合我'])) {
      return {
        text: `根據您的需求，以下是耀德的核心產品推薦：\n\n🏆 **大牛能量氣泡飲**（最暢銷）\n適合：熬夜族 · 需要即時能量 · 喜歡日常飲用\n特色：牛樟芝 + 馬卡 + 紅參 + 牛磺酸，$259/罐\n\n⭐ **旗艦保健膠囊**（高濃度）\n適合：重視品質 · 補充型保健 · 追求最高規格\n特色：段木子實體高濃縮，$1,800/盒\n\n🌱 **日常保健錠**（入門推薦）\n適合：初次嘗試 · 日常維持 · 預算友善\n特色：基礎劑量，$980/盒\n\n需要我幫您做更精準的健康評估推薦嗎？`,
        quickBtns: ['做健康評估', '立即購買', '訂閱方案', '查看評價'],
      };
    }

    /* 價格 / 購買 */
    if (this._match(text, ['價格', '多少錢', '費用', '購買', '訂購', '加入購物'])) {
      return {
        text: `耀德的產品價格區間：\n\n💫 **大牛能量氣泡飲**：NT$259 / 罐，12罐組 NT$2,988\n\n⭐ **頂級旗艦膠囊**：NT$1,800 / 盒（30顆）\n\n🌱 **日常保健錠**：NT$980 / 盒（60顆）\n\n🔄 **訂閱方案**（最划算）：首月 75折，長期訂閱 8折，免費月送到府\n\n✅ 現在下單享：免運費 + SGS 品質保證 + 30天滿意保障\n\n需要我帶您到購物頁面嗎？`,
        quickBtns: ['前往購買', '訂閱方案', '領取優惠', '查看評價'],
      };
    }

    /* 服用 / 怎麼吃 */
    if (this._match(text, ['怎麼吃', '如何服用', '服用方式', '劑量', '幾顆', '幾罐'])) {
      return {
        text: `耀德牛樟芝建議服用方式：\n\n🍺 **大牛能量氣泡飲**：每日 1–2 罐，建議早餐後或運動前飲用，直接冰鎮更美味。\n\n💊 **旗艦膠囊**：每日 2 顆，隨餐服用效果最佳，持續補充 3 個月以上效果最顯著。\n\n💡 **入門建議**：\n• 第 1–2 週：每日基礎劑量，讓身體適應\n• 第 3–4 週：可視需求增至建議量\n• 部分人初期可能有輕微暝眩反應，這是正常排毒現象\n\n有特殊健康狀況建議先諮詢醫師。需要更詳細的個人化建議嗎？`,
        quickBtns: ['暝眩反應說明', '特殊族群注意', '搭配建議', '訂閱自動補貨'],
      };
    }

    /* 3D 體驗 / 導覽 */
    if (this._match(text, ['3d', '體驗', '導覽', '虛擬', '沉浸', 'experience'])) {
      return {
        text: `耀德 Phase 3 沉浸式體驗空間提供：\n\n🔬 **成分互動展示**：點擊每個成分節點，查看科學研究數據與產地資訊\n\n🏭 **虛擬工廠導覽**：全程透明化生產流程，GMP 廠房 360° 環境\n\n🌿 **原料產地之旅**：從台灣山林到最終產品的完整溯源\n\n🛒 **Spatial Commerce**：在 3D 空間中瀏覽產品並直接加入購物車\n\n現在點擊頁面的成分節點，開始互動體驗！或輸入「帶我去工廠」進行導覽。`,
        quickBtns: ['成分互動', '工廠導覽', '原料溯源', '立即購買'],
      };
    }

    /* 認證 / 安全 */
    if (this._match(text, ['認證', '安全', '合法', 'sgs', 'gmp', '安心', '檢驗'])) {
      return {
        text: `耀德植研生醫擁有台灣最嚴格的多重認證：\n\n✅ **SGS 第三方檢驗**：農藥、重金屬、微生物全項目檢測通過\n\n🏭 **GMP 優良製造規範**：衛福部認證標準製造廠\n\n📊 **ISO 22000 食品安全**：國際食品安全管理系統認證\n\n🔬 **SCI 科研背書**：47 篇 SCI 收錄國際期刊研究論文\n\n🌿 **台灣研發製造 100%**：深耕台灣牛樟芝研究逾 20 年\n\n每批產品均有完整 QR Code 溯源查詢，讓您安心補充健康。`,
        quickBtns: ['查看認證報告', '原料溯源', '科研論文', '立即購買'],
      };
    }

    /* 暝眩反應 */
    if (this._match(text, ['暝眩', '副作用', '不舒服', '頭暈', '異常反應'])) {
      return {
        text: `關於牛樟芝的暝眩反應，請放心 🌿\n\n**暝眩反應是什麼？**\n指身體在排毒或免疫系統活化過程中產生的短暫反應，是身體回應的正常現象。\n\n**常見表現**：\n• 輕微頭暈或疲倦感（1–3天）\n• 輕微腸胃調整感\n• 睡眠品質暫時變化\n\n**如何應對**：\n• 初期可減半劑量，約 1 週後恢復正常量\n• 多喝水，幫助代謝\n• 症狀若超過 1 週或加劇，請暫停並諮詢醫師\n\n**重要提醒**：器官移植者、正在服用抗凝血藥物者，請先諮詢主治醫師。`,
        quickBtns: ['調整建議', '特殊族群', '諮詢真人顧問', '繼續服用建議'],
      };
    }

    /* 訂閱 / 回購 */
    if (this._match(text, ['訂閱', '定期', '自動', '回購', '長期'])) {
      return {
        text: `耀德「智能訂閱方案」是最划算的補充方式：\n\n🔄 **彈性週期**：每月 / 每 2 月 / 每季，自由調整\n\n💰 **訂閱折扣**：\n• 首月特惠 **75折**\n• 第 2 月起 **8折**（長期不中斷享最優惠）\n\n🚚 **免運費配送**：全程免費到府，節省時間\n\n📱 **智能提醒**：即將用完時提前通知\n\n🔬 **AI 健康追蹤**：會員儀表板追蹤您的健康進度，隨時調整方案\n\n現在訂閱，首月即省約 NT$500–700，立即開始累積健康資產！`,
        quickBtns: ['立即訂閱', '比較方案', '取消流程', '查看會員福利'],
      };
    }

    /* 會員 / Dashboard */
    if (this._match(text, ['會員', 'dashboard', '儀表板', '健康記錄', '我的帳號'])) {
      return {
        text: `耀德會員 Digital Twin 健康儀表板提供：\n\n📊 **個人化健康數據**：免疫力評分、能量指數、睡眠品質追蹤\n\n🤖 **AI 每週建議**：根據您的服用紀錄與健康目標，自動產生補充建議\n\n📅 **服用紀錄**：完整記錄，確保補充不中斷\n\n🔮 **回購預測**：AI 預估最佳補充時間，讓您提前準備\n\n🎯 **健康目標設定**：免疫力、精力、睡眠、肝臟保健，客製化追蹤方向\n\n點選「健康儀表板」進入您的個人空間！`,
        quickBtns: ['進入儀表板', '設定健康目標', '查看建議', '訂閱通知'],
      };
    }

    /* 無匹配 — 通用智能回覆 */
    return {
      text: `感謝您的詢問！我正在為您尋找最準確的健康資訊 🌿\n\n針對「${document.getElementById('chat-input').value || '您的問題'}」，建議您可以：\n\n📞 **真人諮詢**：前往聯絡頁面，我們的健康顧問將在 1 小時內回覆\n\n🔬 **健康評估**：完成 AI 健康問卷，獲得個人化產品推薦\n\n📚 **深入了解**：前往「認識牛樟芝」頁面查看完整科學研究\n\n有其他問題隨時提問，我在這裡！`,
      quickBtns: ['真人諮詢', '健康評估', '了解成分', '查看產品'],
    };
  }

  /* ── 關鍵字匹配工具 ── */
  _match(text, keywords) {
    return keywords.some(k => text.includes(k));
  }
}

/* ── 全站頁面導航快捷 ── */
function aiNavigate(url) {
  if (url.startsWith('http')) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}

/* ── 初始化 ── */
document.addEventListener('DOMContentLoaded', () => {
  window._aiAvatar = new AIHealthAvatar();
});
