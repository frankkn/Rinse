# Rinse 💦

> 一款用程式碼生成的**高壓水柱清洗**網頁遊戲。拖曳水柱把髒污沖掉，底下的乾淨表面就會露出來——出奇地舒壓。

## 立即遊玩

**https://rinse-omega.vercel.app**

無需安裝、無需登入，直接在瀏覽器開始洗。

---

## 遊戲模式

### 關卡模式（12 關）

由淺入深，每關通關（清潔度 ≥ 99%）後解鎖下一關，並記錄最佳時間。

| 關卡 | 名稱 | 表面 | 髒污 | 特殊污漬 |
|------|------|------|------|----------|
| 1 | 起霧的窗 | 玻璃 | 灰塵 | — |
| 2 | 灰塵磁磚 | 磁磚 | 灰塵 | — |
| 3 | 油膩廚房 | 磁磚 | 油垢 | — |
| 4 | 塵封木桌 | 木頭 | 灰塵＋油垢 | — |
| 5 | 泥濘後院 | 水泥 | 泥巴 | 頑強污漬 |
| 6 | 生苔石階 | 磚牆 | 苔蘚 | 頑強污漬 |
| 7 | 鏽蝕鐵板 | 金屬 | 鏽斑 | 頑強污漬 |
| 8 | 髒污磚牆 | 磚牆 | 油垢＋泥巴 | 頑強污漬 |
| 9 | 潮濕浴室 | 磁磚 | 苔蘚＋油垢 | 頑強污漬＋化學污漬 |
| 10 | 廢棄車道 | 水泥 | 泥巴＋苔蘚 | 頑強污漬＋化學污漬 |
| 11 | 海邊鐵窗 | 金屬 | 鏽斑＋油垢 | 頑強污漬＋化學污漬 |
| 12 | 荒廢玻璃屋 | 玻璃 | 苔蘚＋灰塵 | 頑強污漬＋化學污漬 |

### 禪模式

隨機產生表面與髒污組合，隨時按「換一片」換下一塊，沒有通關條件，純粹解壓。

---

## 特殊污漬說明

### 頑強污漬（橘棕色）

出現在第 5–12 關。這類污漬比普通髒污更難處理：

- 需要**持續刷洗 3 次**才能完全清除
- 每次刷過後顏色會逐漸變淡
- 方法：用水管直接來回刷，重複 3 次即可

### 化學污漬（黃綠色）

出現在第 9–12 關。這類污漬需要搭配洗劑才有效：

1. 切換到 🧴 **洗劑**，點一下污漬噴上去（出現白色泡泡代表生效）
2. 切換回 🚿 **水管**，沖洗掉泡泡即可清除
- 純用水管無法清除，必須先上洗劑

> 工具切換按鈕在遊戲畫面**右側**。

---

## 操作方式

| 操作 | 說明 |
|------|------|
| 按住拖曳 | 噴水清洗 |
| 點右側 🧴 | 切換洗劑模式（點一下噴一塊） |
| 點右側 🚿 | 切換回水管 |
| 按「重來」 | 重置當前關卡 |
| 按「換一片」 | 禪模式換新表面 |

---

## 在本機執行

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # tsc -b && vite build
npm run typecheck   # tsc -b
npm run test:e2e    # Playwright（首次需執行 npx playwright install chromium）
```

---

## 技術架構

純 TypeScript 引擎，React 只做 UI 外殼。畫布座標用 CSS px，全部乘以 `devicePixelRatio` 保持高解析度清晰。

- **`src/engine/`** — 清洗引擎（4 層疊加畫布：clean → dirt → tough → fx）、`destination-out` 軟筆刷、水柱粒子系統（水滴、噴霧、逕流、衝擊環）、value-noise 程序化表面與髒污生成器、`ToughDirtSystem` 頑強污漬系統
- **`src/audio/sound.ts`** — 噴水聲為帶 LFO 的白噪音迴圈，音量跟著清除速度即時變化；通關播放合成和弦。無音訊檔案
- **`src/data/levels.ts`** — 12 關設定（表面 × 髒污 × 種子 × 特殊污漬）
- **`src/engine/surfaces/`** — 實拍照片表面（`public/surfaces/`），找不到圖片時自動退回程序化生成
- **`src/lib/`** — localStorage 進度（本地優先）+ `prefers-reduced-motion` 支援

---

## 可選雲端同步（Firebase）

登入完全選用。不設定時遊戲照常運作，登入按鈕自動隱藏。若要啟用 Google 登入與跨裝置進度同步：

1. 建立 Firebase 專案，啟用 **Google 驗證** 與 **Firestore**
2. 複製 `.env.example` 為 `.env.local`，填入 `VITE_FIREBASE_*` 的值（取自 Firebase 控制台 → 專案設定 → 網頁應用程式）
3. Firestore 規則在 [`firestore.rules`](firestore.rules)，每位使用者只能讀寫自己的 `users/{uid}` 文件

Firebase SDK 使用動態 `import()` 懶加載，僅在實際登入時下載，初始包不受影響。

---

## 部署（Vercel）

repo 內含 [`vercel.json`](vercel.json)（Vite preset、SPA rewrite、靜態資源快取）。部署步驟：

1. 在 Vercel 匯入此 repo
2. 選用：加入 `VITE_FIREBASE_*` 環境變數以啟用線上登入
3. 部署後，將部署網域加到 Firebase → **Authentication → Settings → Authorized domains**

---

## 使用技術

React 19 · TypeScript · Vite · Tailwind v4 · Canvas 2D · Web Audio API · Firebase（選用）· Playwright
