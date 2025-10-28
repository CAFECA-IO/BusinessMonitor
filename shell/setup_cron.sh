#!/bin/bash

# Info: 20251028 - Tzuhan
# 使用辦法
# 在終端機中執行 chmod +x shell/setup_cron.sh。
# 然後執行腳本並指定時間（24 小時制），例如每天凌晨 2 點：
#   bash shell/setup_cron.sh 02:00
# 如果不指定時間，預設為每天凌晨 2 點：
#   bash shell/setup_cron.sh


# Info: 20251028 - Tzuhan --- 設定預設值 ---
DEFAULT_TIME="02:00"
CRAWLER_SCRIPT_REL_PATH="shell/run_crawler.sh"
LOG_FILE_REL_PATH="private/data/crawler.log"

# Info: 20251028 - Tzuhan --- 解析參數 ---
SCHEDULE_TIME=${1:-$DEFAULT_TIME}

# Info: 20251028 - Tzuhan 驗證時間格式 HH:MM
if ! [[ "$SCHEDULE_TIME" =~ ^([01]?[0-9]|2[0-3]):[0-5][0-9]$ ]]; then
  echo "❌ 錯誤：時間格式無效。請使用 HH:MM 格式（例如：02:00 或 14:30）。"
  exit 1
fi

HOUR=$(echo "$SCHEDULE_TIME" | cut -d: -f1)
MINUTE=$(echo "$SCHEDULE_TIME" | cut -d: -f2 | sed 's/^0*//') # Info: 20251028 - Tzuhan 移除前導 0 以符合 crontab 語法

# Info: 20251028 - Tzuhan --- 取得絕對路徑 ---
# Info: 20251028 - Tzuhan 這個腳本應該放在 shell/ 目錄下，所以我們回到專案根目錄
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
CRAWLER_SCRIPT_ABS_PATH="$PROJECT_ROOT/$CRAWLER_SCRIPT_REL_PATH"
LOG_FILE_ABS_PATH="$PROJECT_ROOT/$LOG_FILE_REL_PATH"

# Info: 20251028 - Tzuhan 確保 run_crawler.sh 存在且可執行
if [ ! -f "$CRAWLER_SCRIPT_ABS_PATH" ]; then
  echo "❌ 錯誤：找不到爬蟲腳本 $CRAWLER_SCRIPT_ABS_PATH"
  exit 1
fi
chmod +x "$CRAWLER_SCRIPT_ABS_PATH" # Info: 20251028 - Tzuhan 確保腳本有執行權限

# Info: 20251028 - Tzuhan 確保 log 檔案目錄存在
mkdir -p "$(dirname "$LOG_FILE_ABS_PATH")"

# Info: 20251028 - Tzuhan --- 建立 cron job 指令 ---
# 每天在指定的分鐘和小時執行
# >> 將標準輸出附加到 log 檔案
# 2>&1 將標準錯誤也重定向到標準輸出，因此也會被附加到 log 檔案
CRON_JOB_LINE="$MINUTE $HOUR * * * $CRAWLER_SCRIPT_ABS_PATH >> $LOG_FILE_ABS_PATH 2>&1"

# Info: 20251028 - Tzuhan --- 檢查 crontab 是否已存在相同的任務 ---
# crontab -l 可能會因為沒有 crontab 而失敗，所以忽略錯誤 (2>/dev/null)
EXISTING_CRONTAB=$(crontab -l 2>/dev/null)

if echo "$EXISTING_CRONTAB" | grep -Fxq "$CRON_JOB_LINE"; then
  echo "ℹ️  排程任務已存在，無需新增："
  echo "   $CRON_JOB_LINE"
  exit 0
else
  echo "➕ 正在新增每日排程任務到 crontab..."
  # Info: 20251028 - Tzuhan (crontab -l ; echo "...") | crontab - 是新增 cron job 的標準安全做法
  (crontab -l 2>/dev/null; echo "$CRON_JOB_LINE") | crontab -
  if [ $? -eq 0 ]; then
    echo "✅ 成功設定每日 $SCHEDULE_TIME 執行的爬蟲任務。"
    echo "   任務指令：$CRON_JOB_LINE"
    echo "   日誌將記錄在：$LOG_FILE_ABS_PATH"
  else
    echo "❌ 錯誤：無法寫入 crontab。請檢查權限或手動設定。"
    exit 1
  fi
fi

exit 0