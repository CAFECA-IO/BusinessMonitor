#!/bin/bash

# --- 跨平台相容性設定 (偵測 macOS 或 Ubuntu) ---
OS_TYPE=$(uname)
if [[ "$OS_TYPE" == "Darwin" ]]; then
    # macOS (BSD) date
    echo "🍎 偵測到作業系統為 macOS"
    date_to_seconds() { date -j -f "%Y%m%d" "$1" "+%s"; }
    seconds_to_date() { date -j -f "%s" "$1" "+%Y%m%d"; }
    seconds_to_year() { date -j -f "%s" "$1" "+%Y"; }
    next_day_from_date() { date -j -v+1d -f "%Y%m%d" "$1" "+%Y%m%d"; }
else
    # Linux (GNU) date
    echo "🐧 偵測到作業系統為 Linux/Ubuntu"
    date_to_seconds() { date -d "$1" "+%s"; }
    seconds_to_date() { date -d "@$1" "+%Y%m%d"; }
    seconds_to_year() { date -d "@$1" "+%Y"; }
    next_day_from_date() { date -d "$1 + 1 day" "+%Y%m%d"; }
fi
# ---------------------------------------------------

# 步驟 1: 從指令列第一個參數讀取資料的根目錄路徑
base_data_folder=${1:-"twse_data"}
mkdir -p "$base_data_folder"

# 步驟 2: 智慧決定開始日期
default_start="20240101" # 設定一個較合理的預設起始日
end_date=$(date "+%Y%m%d")
start_date=""

# 2a: 優先從資料庫查詢最新日期
echo "🔍 正在查詢資料庫中最新的資料日期..."
# 執行我們剛剛建立的 TS 腳本來獲取日期
latest_db_date=$(npx tsx scripts/lib/get_latest_market_date.ts)

if [[ "$latest_db_date" =~ ^[0-9]{8}$ ]]; then
    start_date=$(next_day_from_date "$latest_db_date")
    echo "📦 資料庫已有資料至 $latest_db_date。將從 $start_date 開始下載。"
# 2b: 若資料庫為空，則掃描本地資料夾找尋最新檔案
elif [ -d "$base_data_folder" ] && [ "$(ls -A $base_data_folder 2>/dev/null)" ]; then
    echo "📂 資料庫為空。正在掃描本地資料夾找尋最新檔案..."
    # 遞迴尋找所有 .csv 檔，取出檔名(YYYYMMDD)，排序後取最新的
    latest_file_date=$(find "$base_data_folder" -name "*.csv" -print0 | xargs -0 basename -a | sort -r | head -n 1 | sed 's/\.csv//')
    if [[ "$latest_file_date" =~ ^[0-9]{8}$ ]]; then
        start_date=$(next_day_from_date "$latest_file_date")
        echo "📄 本地最新檔案為 $latest_file_date。將從 $start_date 開始下載。"
    fi
fi

# 2c: 若資料庫和本地資料夾都為空，則使用預設起始日
if [ -z "$start_date" ]; then
    start_date=$default_start
    echo "🆕 找不到任何現有資料。將從預設日期 $start_date 開始下載。"
fi

# 主迴圈
start_sec=$(date_to_seconds "$start_date")
end_sec=$(date_to_seconds "$end_date")

# 如果開始日期已經晚於結束日期，則不需下載
if [ "$start_sec" -gt "$end_sec" ]; then
    echo "✅ 資料已是最新，無需下載。任務結束。"
    exit 0
fi

current_sec=$start_sec
while [ "$current_sec" -le "$end_sec" ]; do
    date_str=$(seconds_to_date "$current_sec")
    year=$(seconds_to_year "$current_sec")

    # ✨ 核心修改：資料夾結構改為 YYYY
    year_folder="${base_data_folder}/${year}"
    mkdir -p "$year_folder"

    url="https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=${date_str}&type=ALL&response=csv"
    output_file="${year_folder}/${date_str}.csv"

    echo "📅 正在下載 $date_str -> ${output_file}"
    curl -s -o "$output_file" "$url" --connect-timeout 15

    if [ -f "$output_file" ] && [ $(stat -f%z "$output_file") -gt 1024 ]; then
        echo "✅ 下載成功。"
    else
        echo "⚠️  $date_str 無資料 (可能為假日或非交易日)，已刪除空檔案。"
        rm -f "$output_file"
    fi

    sleep_time=$((2 + RANDOM % 5))
    echo "⏳ 等待 $sleep_time 秒..."
    sleep "$sleep_time"

    current_sec=$((current_sec + 86400))
done

echo "🏁 下載流程處理完畢。"