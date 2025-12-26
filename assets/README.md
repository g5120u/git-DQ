# Assets 資料夾說明

## 📁 圖片素材放置位置

請將以下圖片檔案放到對應位置：

### 角色圖片（Characters）

**位置**：`assets/characters/`

**檔案名稱對應**：
- `hero.png` - 主角/冒險者（用於 git init 畫面）
- `warrior.png` - 戰士像素圖（主線分支使用）
- `wizard.png` 或 `mage.png` - 魔法師像素圖（支線分支使用）
- `slime.png` - 史萊姆（衝突/錯誤時使用）
- `boss.png` - Boss（重大衝突時使用）

**圖片要求**：
- 格式：PNG（支援透明背景）
- 尺寸：建議 64x64 或 128x128 像素
- 背景：透明（去背）
- 風格：像素藝術風格（8-bit RPG）

### 背景圖片（Backgrounds）

**位置**：`assets/backgrounds/`（可選，目前使用 CSS 漸變）

**檔案名稱**（如果未來要使用）：
- `dungeon.png` - 地牢背景
- `village.png` - 村莊背景
- `temple.png` - 神殿背景
- `battle.png` - 戰鬥背景
- `castle.png` - 城堡背景

### 其他資源

**位置**：`assets/` 根目錄

- `icon.png` - 應用程式圖示（可選）

## 🎨 如何添加圖片

### 步驟 1：準備圖片檔案

1. 準備你的像素圖圖片（PNG 格式，透明背景）
2. 確保檔案名稱符合上述命名規則

### 步驟 2：放置圖片

將圖片檔案放到對應的資料夾：
```
git-dq/
└── assets/
    ├── characters/
    │   ├── hero.png      ← 主角圖片
    │   ├── warrior.png   ← 戰士圖片
    │   ├── wizard.png    ← 魔法師圖片
    │   ├── mage.png      ← 魔法師（備用名稱）
    │   ├── slime.png     ← 史萊姆圖片
    │   └── boss.png      ← Boss 圖片
    └── backgrounds/      ← 背景圖片（可選）
        ├── dungeon.png
        ├── village.png
        ├── temple.png
        ├── battle.png
        └── castle.png
```

### 步驟 3：檢查圖片路徑

應用程式會自動從以下路徑載入圖片：
- 角色圖片：`assets/characters/{id}.png`
- 背景圖片：`assets/backgrounds/{bg}.png`

### 步驟 4：如果圖片載入失敗

如果圖片檔案不存在或載入失敗，應用程式會自動使用 emoji 圖示作為備用顯示：
- `hero` → 🧙
- `warrior` → ⚔️
- `mage` / `wizard` → 🧙
- `slime` → 🟢
- `boss` → 👹

## 📝 圖片命名規則

在 `renderer/PixelSprite.jsx` 中，角色 ID 對應的檔案名稱：

| ID | 檔案名稱 | Emoji 備用 |
|---|---|---|
| `hero` | `hero.png` | 🧙 |
| `warrior` | `warrior.png` | ⚔️ |
| `mage` | `mage.png` 或 `wizard.png` | 🧙 |
| `slime` | `slime.png` | 🟢 |
| `boss` | `boss.png` | 👹 |

## 🔍 如何修改角色 ID

如果你想使用不同的角色 ID，需要修改：

1. **`renderer/PixelSprite.jsx`**：
   - 在 `spriteData` 物件中添加新的角色定義
   - 例如：`myCharacter: { emoji: "🦄", color: "#FF69B4" }`

2. **`renderer/App.jsx`**：
   - 修改 `<PixelSprite id="hero" />` 為 `<PixelSprite id="myCharacter" />`

3. **放置圖片**：
   - 將圖片命名為 `myCharacter.png` 並放到 `assets/characters/` 資料夾

## ✅ 檢查清單

- [ ] 圖片檔案已放到正確的資料夾
- [ ] 檔案名稱符合命名規則
- [ ] 圖片格式為 PNG
- [ ] 圖片背景已去背（透明）
- [ ] 圖片尺寸適合（64x64 或 128x128）
- [ ] 重新啟動應用程式查看效果

## 🎮 範例

假設你想添加一個名為 `knight` 的角色：

1. 準備 `knight.png` 圖片
2. 放到 `assets/characters/knight.png`
3. 在 `renderer/PixelSprite.jsx` 中添加：
   ```javascript
   knight: { emoji: "🛡️", color: "#C0C0C0" }
   ```
4. 在 `renderer/App.jsx` 中使用：
   ```jsx
   <PixelSprite id="knight" x={100} y={200} />
   ```

---

**記住：如果圖片不存在，應用程式會自動使用 emoji 作為備用顯示！** 🎨✨
