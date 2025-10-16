#!/bin/bash

# 確保腳本從專案根目錄執行
cd "$(dirname "$0")/.."

# --- 參數解析 ---
DATA_FOLDER="twse_data" # 預設資料夾
IMPORT_ARGS=() # 存放傳給 import 腳本的參數

# 遍歷所有傳入的參數
for arg in "$@"; do
  # 如果參數是 -- 開頭的選項，就加到 IMPORT_ARGS 陣列中
  if [[ $arg == --* ]]; then
    IMPORT_ARGS+=("$arg")
  # 否則，就認定它是 DATA_FOLDER 的路徑
  else
    DATA_FOLDER="$arg"
  fi
done
# --------------------

echo "📂 指定資料根目錄: $(realpath "$DATA_FOLDER")"
# 如果有額外的匯入參數，就印出來
if [ ${#IMPORT_ARGS[@]} -ne 0 ]; then
  echo "⚙️  附加匯入參數: ${IMPORT_ARGS[*]}"
fi

echo "🚀 開始執行爬蟲任務..."

# --- 步驟 1: 下載新資料 ---
# 下載腳本不受日期參數影響，它總是會智慧續傳
echo "--- (1/2) 正在下載 TWSE 每日行情資料 ---"
bash shell/download_twse_data.sh "$DATA_FOLDER"
if [ $? -ne 0 ]; then
    echo "❌ 下載資料時發生錯誤，任務中止。"
    exit 1
fi

# --- 步驟 2: 匯入資料 ---
echo "--- (2/2) 正在將資料匯入資料庫 ---"
# 將路徑和所有額外參數傳遞給 import:market-data
# npm run ... -- a b c -> 會執行 tsx ... a b c
npm run import:market-data -- "$DATA_FOLDER" "${IMPORT_ARGS[@]}"
if [ $? -ne 0 ]; then
    echo "❌ 匯入資料到資料庫時發生錯誤。"
    exit 1
fi

echo "✅ 爬蟲任務成功完成！"
