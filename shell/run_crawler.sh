#!/bin/bash

# 確保腳本從專案根目錄執行
cd "$(dirname "$0")/.."

# 從指令列第一個參數讀取資料根目錄，預設為 'twse_data'
DATA_FOLDER=${1:-"twse_data"}
echo "📂 指定資料根目錄: $(realpath "$DATA_FOLDER")"

echo "🚀 開始執行定期爬蟲任務..."

# --- 步驟 1: 下載新資料 ---
# 下載腳本會自動從資料庫或本地檔案判斷續傳點
echo "--- (1/2) 正在下載 TWSE 每日行情資料 ---"
bash shell/download_twse_data.sh "$DATA_FOLDER"
if [ $? -ne 0 ]; then
    echo "❌ 下載資料時發生錯誤，任務中止。"
    exit 1
fi

# --- 步驟 2: 匯入所有已下載的資料 ---
# 匯入腳本會處理整個資料夾，並自動跳過資料庫中已存在的日期
echo "--- (2/2) 正在將所有新資料匯入資料庫 ---"
npm run import:market-data -- "$DATA_FOLDER"
if [ $? -ne 0 ]; then
    echo "❌ 匯入資料到資料庫時發生錯誤。"
    exit 1
fi

echo "✅ 定期爬蟲任務成功完成！"