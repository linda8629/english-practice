# English Practice

一套純前端（HTML5 + CSS3 + Vanilla JavaScript ES6 Modules）、可長期擴充的英文學習平台。
不需要任何後端、資料庫或建置工具，下載後即可直接開啟，也可以直接部署到 GitHub Pages。

---

## 目錄

- [專案介紹](#專案介紹)
- [架構設計](#架構設計)
- [安裝與執行方式](#安裝與執行方式)
- [部署到 GitHub Pages](#部署到-github-pages)
- [資料夾說明](#資料夾說明)
- [words.json 資料格式](#wordsjson-資料格式)
- [題型插件化機制](#題型插件化機制)
- [未來規劃](#未來規劃)
- [Version History](#version-history)

---

## 專案介紹

English Practice 是一套「每天十分鐘」的英文單字練習工具。所有題目皆由程式根據
`data/words.json` **動態產生**，不存在任何寫死的固定題目，因此每次測驗都不重複。

目前（v0.1）支援的核心迴圈：

首頁 → 開始每日測驗 → 動態產生 10 題選擇題 → 即時判斷 + 顯示解析 → 測驗結果 →
錯題自動存入錯題本，並更新學習統計。

---

## 架構設計

### 為什麼選擇這樣的架構

專案規格要求「未來三年都不用大改架構」，因此在 v0.1 就導入了幾個標準規格書
沒有明確要求、但對長期維護性至關重要的設計：

| 設計 | 原因 |
|---|---|
| **ES6 Modules**（`<script type="module">`）| 用真正的 `import`/`export` 取代全域變數與載入順序依賴，天生符合 High Cohesion / Low Coupling |
| **Plugin Registry**（`questionTypes/registry.js`）| 瀏覽器無法讀取資料夾內容，靜態網站必須有一個明確的清單。新增題型只需寫一支檔案 + 在 registry 註冊一行，`quizManager.js` 完全不用修改（符合 Open/Closed Principle） |
| **Repository 層**（`wordManager.js`）| 所有 `words.json` 的存取都集中於此。未來若要改成呼叫 AI API 動態出題，只需替換這一支檔案 |
| **Storage 層 + schemaVersion**（`storage.js`）| 所有 LocalStorage 存取集中管理；內建版本號與 migration 機制，避免未來調整資料結構時破壞使用者現有的學習紀錄 |
| **EventBus**（`eventBus.js`）| Quiz 結束時只會 `emit('quiz:finished', summary)`，不需要知道統計、複習功能的存在。新增功能監聽這個事件即可，不用改 `scoreManager.js` |
| **config.js** | 所有 LocalStorage 鍵名、預設值、常數集中於一處，避免「魔法字串」散落各檔案 |

### 分層總覽

```
Pages (index/quiz/vocab/...) — 只負責 DOM 渲染與使用者互動
        │
        ▼
Modules (quizManager / scoreManager / wordManager / reviewManager / statisticsManager)
        │  — 純商業邏輯，不碰 DOM
        ▼
questionTypes/*  (插件)         storage.js (LocalStorage 唯一入口)
        │                              │
        ▼                              ▼
   words.json                    window.localStorage
```

---

## 安裝與執行方式

因為所有頁面都使用 ES Modules（`<script type="module">`），瀏覽器基於安全性限制，
**不允許**直接用 `file://` 開啟 HTML，必須透過本地端 HTTP Server。

```bash
# 進入專案資料夾
cd english-practice

# 任選一種方式啟動本地伺服器
python3 -m http.server 8000
# 或
npx serve .

# 開啟瀏覽器造訪
http://localhost:8000
```

---

## 部署到 GitHub Pages

1. 將整個 `english-practice/` 資料夾內容 push 到 GitHub repository 的根目錄（或 `docs/`）。
2. 到 repository 的 **Settings → Pages**，選擇要部署的分支與資料夾。
3. 幾分鐘後即可透過 GitHub 提供的網址造訪，例如：
   `https://<username>.github.io/<repo-name>/`

不需要任何建置（build）步驟。

---

## 資料夾說明

```
english-practice/
├── index.html          首頁
├── quiz.html            每日測驗（核心功能）
├── vocab.html            單字庫（搜尋 / 篩選）
├── review.html           錯題本
├── statistics.html       學習統計
├── settings.html         設定
│
├── css/
│   ├── reset.css         瀏覽器預設值重置
│   ├── style.css         Design tokens（顏色 / 字體 / 間距）+ 基礎樣式
│   ├── layout.css        頁面結構、Header、底部導覽列
│   ├── components.css    按鈕、卡片、題目選項、進度條等共用元件
│   └── responsive.css    平板 / 桌機的斷點調整（Mobile First）
│
├── js/
│   ├── app.js             每個頁面共用的啟動邏輯（套用設定、Migration、Nav 高亮）
│   ├── config.js          常數集中管理（Storage Key、預設值）
│   ├── eventBus.js         發布/訂閱事件匯流排
│   ├── storage.js          LocalStorage 唯一存取入口 + schema migration
│   ├── router.js           頁面清單 + Nav 高亮輔助
│   ├── utils.js             共用工具函式（shuffle / randomInt / formatDate...）
│   │
│   ├── questionTypes/       題型 Plugin（每支檔案 = 一種題型）
│   │   ├── meaning.js        英文 → 中文
│   │   ├── translation.js    中文 → 英文
│   │   ├── synonym.js        同義字
│   │   └── registry.js       Plugin 清單（新增題型只改這裡）
│   │
│   └── modules/              商業邏輯層（不碰 DOM）
│       ├── wordManager.js         words.json 存取（Repository）
│       ├── quizManager.js         組出一份測驗
│       ├── scoreManager.js        紀錄作答、結算、寫入統計/錯題本
│       ├── reviewManager.js       錯題本 CRUD
│       ├── statisticsManager.js   彙整學習統計
│       └── syncManager.js         選用的 Google Sheets 雲端備份/還原
│
├── data/
│   └── words.json         唯一的單字資料庫
│
├── apps-script/
│   └── Code.gs             雲端同步後端範例（貼到 Google Apps Script）
│
├── assets/
│   ├── icon/
│   └── image/
│
└── README.md
```

---

## words.json 資料格式

```json
{
  "schemaVersion": 1,
  "words": [
    {
      "id": "w0001",
      "word": "abandon",
      "meaning": "放棄；遺棄",
      "pronunciation": "/əˈbæn.dən/",
      "syllables": ["a", "ban", "don"],
      "partOfSpeech": "verb",
      "synonyms": ["desert", "forsake", "give up"],
      "antonyms": ["keep", "maintain"],
      "collocations": ["abandon a plan", "abandon ship"],
      "examples": ["The captain refused to abandon the sinking ship."],
      "exampleTranslation": ["船長拒絕棄船。"],
      "derivedWords": ["abandonment", "abandoned"],
      "level": "B2",
      "tags": ["emotion", "action"],
      "difficulty": 3
    }
  ]
}
```

新增欄位（例如未來 AI 出題需要的 `aiHints`、`audioUrl`）可以直接加在每個單字物件裡，
不需要修改任何既有程式 — `wordManager.js` 只做原樣傳遞，不會因為多了欄位而壞掉。

---

## 題型插件化機制

新增一種題型（例如「拼字」）的完整步驟：

1. 建立 `js/questionTypes/spelling.js`，實作以下介面：

   ```js
   export const spellingQuestionType = {
     id: 'spelling',
     label: '拼字',
     isEligible(word) { return true; }, // 可選；預設一律符合資格
     generate(targetWord, allWords) {
       return {
         type: this.id,
         stem: '...',
         options: [{ id, text, correct }, ...],
         correctOptionId: '...',
         explanation: '...',
         sourceWordId: targetWord.id,
       };
     },
   };
   ```

2. 在 `js/questionTypes/registry.js` `import` 這支檔案並加進 `QUESTION_TYPES` 陣列。

**不需要**修改 `quizManager.js`、`quiz.html` 或任何其他檔案。

---

## 未來規劃

- **v0.3**：學習統計加入圖表視覺化、每日/每題型正確率趨勢。
- **v1.0**：完整 QA、無障礙（a11y）與效能優化，正式對外發佈。
- **AI 功能（資料結構已預留擴充性）**：
  - AI 出題：`wordManager.js` 可替換為呼叫 ChatGPT API 動態產生單字或例句
  - AI 推薦複習：`statisticsManager.getWeakestWords()` 已提供弱點單字清單，
    未來可接上 AI 判斷最佳複習時機（間隔重複 / Spaced Repetition）
  - AI 依程度調整難度：`words.json` 已有 `level` / `difficulty` 欄位可作為依據
  - AI 自動產生例句：`examples` / `exampleTranslation` 為陣列，可持續附加

---

## 雲端同步（Google Sheets，選用功能）

GitHub Pages 是純靜態網站，資料預設只存在瀏覽器的 LocalStorage —— 換瀏覽器、
清快取、或用不同裝置開啟都看不到之前的紀錄。v0.2 加入了一個**選用**的雲端備份
機制，用 Google Sheets 當作免費的資料儲存後端。

### 運作方式

- LocalStorage 仍然是主要資料來源：測驗、看單字庫、看統計，全部都是即時讀寫
  本機資料，**不需要網路也能正常使用**。
- 每次測驗結束後，會在背景把這次結果「附加」一筆記錄到你自己的 Google Sheet
  （失敗也不影響本機功能，純粹是備份，不會卡住 UI）。
- 到新裝置或清過快取後，可以在「設定」頁按 **「從雲端還原」**，把 Sheet 裡所有
  紀錄重新彙整回本機的錯題本與統計。

### 為什麼網址和金鑰不寫在程式碼裡

這個 repo 是公開的，寫在程式碼裡的任何東西都等於公開。因此 Web App 網址與
同步金鑰**只透過「設定」頁面輸入**，存在你瀏覽器自己的 LocalStorage 裡，
不會出現在 GitHub 上的原始碼中。Apps Script 那邊仍會做一層金鑰比對，
當作訪客誤觸網址時的第二道防線 —— 但這仍是共用金鑰而非真正的登入驗證，
請不要把敏感資料放進這張表。這是純前端 + 免費後端能做到的合理上限。

### 設定步驟

1. 開一個新的 Google Sheet（任意命名）。
2. 上方選單「擴充功能」→「Apps Script」，把預設內容清空，
   貼上 [`apps-script/Code.gs`](apps-script/Code.gs) 的完整內容。
3. 把程式碼裡的 `SYNC_KEY` 改成你自訂的密碼字串。
4. 「部署」→「新增部署」：
   - 類型選「網頁應用程式」
   - 「執行身分」選 Me（你自己）
   - 「存取權限」選「任何人」
5. 部署後複製產生的網址（以 `/exec` 結尾）。
6. 回到 English Practice 的「設定」頁，貼上網址、填入跟第 3 步相同的
   `SYNC_KEY`，按「儲存設定」即可。

之後每次測驗結束都會自動嘗試備份；到別的裝置時記得重複第 6 步（貼上同一組
網址+金鑰），再按「從雲端還原」把歷史紀錄拉回來。

### 單字資料也改用 Google Sheets（選用）

同一個 Apps Script 部署，也可以拿來取代 `data/words.json` 當作單字來源 ——
之後要新增/修改單字，直接編輯 Google Sheet 的儲存格即可，不用改程式碼或
重新部署網站。

**設定方式：**
1. 完成上面「設定步驟」1–6（雲端同步已可運作）之後，
2. 到「設定」頁把「**從雲端讀取單字（取代 words.json）**」打開即可。

打開後，網站第一次呼叫時會自動在你的 Google Sheet 建立一個叫 **Words** 的
工作表，並附上一列範例（`diligent`），照著格式繼續往下新增即可：

| 欄位 | 說明 | 範例 |
|---|---|---|
| `id` | 唯一識別碼，留空會自動產生 | `w0001` |
| `word` | 英文單字 | `diligent` |
| `meaning` | 中文意思 | `勤勉的；勤奮的` |
| `pronunciation` | KK/IPA 音標 | `/ˈdɪl.ɪ.dʒənt/` |
| `syllables` | 音節，逗號分隔 | `dil,i,gent` |
| `partOfSpeech` | 詞性 | `adjective` |
| `synonyms` | 同義字，逗號分隔 | `hardworking, industrious` |
| `antonyms` | 反義字，逗號分隔 | `lazy, idle` |
| `collocations` | 搭配詞，逗號分隔 | `diligent student, diligent effort` |
| `example` | 例句（一句） | `He is a diligent student.` |
| `exampleTranslation` | 例句翻譯（一句） | `他是個勤勉的學生。` |
| `derivedWords` | 衍生字，逗號分隔 | `diligence, diligently` |
| `level` | 難度等級 | `B1` |
| `tags` | 分類標籤，逗號分隔 | `personality, school` |
| `difficulty` | 難度數字 | `2` |

**注意事項：**
- 逗號分隔欄位裡的每一項不要再包含逗號。
- 為求 Sheet 好編輯，`example` / `exampleTranslation` 目前僅支援**一句**
  （原本 `words.json` 支援多句例句的能力仍保留，只是 Sheet 介面先簡化為單句）。
- 若雲端讀取失敗（例如暫時沒網路），網站會自動改用**上一次成功抓取時
  快取在本機的版本**，快取也讀不到才會退回內建的 `data/words.json`，
  所以離線時仍然可以測驗。

---

## Version History

### v0.2.1
- 單字資料來源新增「從雲端讀取（Google Sheets）」選項，可取代 `data/words.json`；
  失敗時自動退回本機快取，再退回內建 JSON，離線仍可使用
  （沿用同一個 Apps Script 部署，新增 `resource=words` 路徑）

### v0.2
- 修正桌機版（≥1024px）導覽列版位錯亂的 CSS bug（改用 CSS Grid 排版側邊欄）
- 新增 10 個「日常生活對話」主題單字，取代原本的種子資料
- 新增選用的 Google Sheets 雲端同步：測驗結果自動背景備份、可從雲端還原到新裝置
  （`syncManager.js` + `apps-script/Code.gs`），網址與金鑰僅存於使用者瀏覽器

### v0.1
- 建立完整專案架構（分層、插件化、LocalStorage 統一管理、EventBus）
- 首頁、每日測驗（含 3 種題型：英中互譯、同義字）、單字庫搜尋、
  錯題本、學習統計、設定頁面皆為可執行版本
- 15 筆種子單字資料
- Mobile First 響應式設計，支援深色模式與字體大小調整
