#!/bin/bash

# # Info: 20251028 - Tzuhan 確保腳本從專案根目錄執行
cd "$(dirname "$0")/.."

# # Info: 20251028 - Tzuhan --- 參數解析 ---
DOWNLOADER_SCRIPT_ABS_PATH="shell/run_twse_crawler_task_download.sh" 
DATA_FOLDER="private/data/twse_data" # # Info: 20251028 - Tzuhan 預設資料夾
IMPORT_ARGS=() # # Info: 20251028 - Tzuhan 存放傳給 import 腳本的參數

# # Info: 20251028 - Tzuhan 遍歷所有傳入的參數
for arg in "$@"; do
  # # Info: 20251028 - Tzuhan 如果參數是 -- 開頭的選項，就加到 IMPORT_ARGS 陣列中
  if [[ $arg == --* ]]; then
    IMPORT_ARGS+=("$arg")
  # # Info: 20251028 - Tzuhan 否則，就認定它是 DATA_FOLDER 的路徑
  else
    DATA_FOLDER="$arg"
  fi
done
# # Info: 20251028 - Tzuhan --------------------

echo "📂 指定資料根目錄: $(realpath "$DATA_FOLDER")"
# # Info: 20251028 - Tzuhan 如果有額外的匯入參數，就印出來
if [ ${#IMPORT_ARGS[@]} -ne 0 ]; then
  echo "⚙️  附加匯入參數: ${IMPORT_ARGS[*]}"
fi

echo "🚀 開始執行爬蟲任務..."
chmod +x "$DOWNLOADER_SCRIPT_ABS_PATH"

# # Info: 20251028 - Tzuhan --- 步驟 1: 下載新資料 ---
# # Info: 20251028 - Tzuhan 下載腳本不受日期參數影響，它總是會智慧續傳
echo "--- (1/2) 正在下載 TWSE 每日行情資料 ---"
bash "$DOWNLOADER_SCRIPT_ABS_PATH" "$DATA_FOLDER"
if [ $? -ne 0 ]; then
    echo "❌ 下載資料時發生錯誤，任務中止。"
    exit 1
fi

# # Info: 20251028 - Tzuhan --- 步驟 2: 匯入資料 ---
echo "--- (2/2) 正在將資料匯入資料庫 ---"
# # Info: 20251028 - Tzuhan 將路徑和所有額外參數傳遞給 import:market-data
# # Info: 20251028 - Tzuhan npm run ... -- a b c -> 會執行 tsx ... a b c
npm run import:market-data -- "$DATA_FOLDER" "${IMPORT_ARGS[@]}"
if [ $? -ne 0 ]; then
    echo "❌ 匯入資料到資料庫時發生錯誤。"
    exit 1
fi

echo "✅ 爬蟲任務成功完成！"
