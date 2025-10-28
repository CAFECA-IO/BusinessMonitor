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
CRAWLER_SCRIPT_REL_PATH="shell/run_twse_crawler_task.sh" # <-- 使用新名稱
LOG_FILE_REL_PATH="private/data/crawler.log"

# Info: 20251028 - Tzuhan --- 解析參數 ---
SCHEDULE_TIME=${1:-$DEFAULT_TIME}

# Info: 20251028 - Tzuhan 驗證時間格式 HH:MM
if ! [[ "$SCHEDULE_TIME" =~ ^([01]?[0-9]|2[0-3]):[0-5][0-9]$ ]]; then
  echo "❌ 錯誤：時間格式無效。請使用 HH:MM 格式（例如：02:00 或 14:30）。"
  exit 1
fi

HOUR=$(echo "$SCHEDULE_TIME" | cut -d: -f1)
MINUTE=$(echo "$SCHEDULE_TIME" | cut -d: -f2 | sed 's/^0*//')

# Info: 20251028 - Tzuhan --- 取得絕對路徑 ---
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
CRAWLER_SCRIPT_ABS_PATH="$PROJECT_ROOT/$CRAWLER_SCRIPT_REL_PATH"
LOG_FILE_ABS_PATH="$PROJECT_ROOT/$LOG_FILE_REL_PATH"

# Info: 20251028 - Tzuhan 確保 run_twse_crawler_task.sh 存在且可執行
if [ ! -f "$CRAWLER_SCRIPT_ABS_PATH" ]; then
  echo "❌ 錯誤：找不到爬蟲腳本 $CRAWLER_SCRIPT_ABS_PATH"
  exit 1
fi
chmod +x "$CRAWLER_SCRIPT_ABS_PATH"

# Info: 20251028 - Tzuhan 確保 log 檔案目錄存在
mkdir -p "$(dirname "$LOG_FILE_ABS_PATH")"

# Info: 20251028 - Tzuhan --- 建立 cron job 指令 ---
# 每天在指定的分鐘和小時執行
# >> 將標準輸出附加到 log 檔案
# 2>&1 將標準錯誤也重定向到標準輸出，因此也會被附加到 log 檔案
CRON_JOB_LINE="$MINUTE $HOUR * * * $CRAWLER_SCRIPT_ABS_PATH >> $LOG_FILE_ABS_PATH 2>&1"

# Info: 20251028 - Tzuhan --- 檢查 crontab 是否已存在相同的任務 ---
EXISTING_CRONTAB=$(crontab -l 2>/dev/null)
CRON_JOB_COMMAND_PART="$CRAWLER_SCRIPT_ABS_PATH >> $LOG_FILE_ABS_PATH 2>&1"

TASK_ALREADY_EXISTS=false
if echo "$EXISTING_CRONTAB" | grep -Fq "$CRON_JOB_COMMAND_PART"; then
  if echo "$EXISTING_CRONTAB" | grep -Fxq "$CRON_JOB_LINE"; then
     echo "ℹ️  完全相同的排程任務已存在，無需新增。"
     TASK_ALREADY_EXISTS=true
  else
     echo "⚠️  排程任務似乎已存在但時間或 PATH 不同。正在更新..."
     # Info: 20251028 - Tzuhan 移除舊的
     (crontab -l 2>/dev/null | grep -vF "$CRON_JOB_COMMAND_PART") | crontab -
  fi
fi

# Info: 20251028 - Tzuhan 如果任務不存在或已被移除 (因為要更新)，則新增
if [ "$TASK_ALREADY_EXISTS" = false ]; then
  echo "➕ 正在新增或更新每日排程任務到 crontab..."
  (crontab -l 2>/dev/null; echo "$CRON_JOB_LINE") | crontab -
  if [ $? -eq 0 ]; then
    echo "✅ 成功設定每日 $SCHEDULE_TIME 執行的爬蟲任務。"
    echo "   任務指令：$CRON_JOB_LINE"
    echo "   日誌將記錄在：$LOG_FILE_ABS_PATH"
  else
    echo "❌ 錯誤：無法寫入 crontab。請檢查權限或手動設定。"
    # Info: 20251028 - Tzuhan 即使 crontab 設定失敗，還是嘗試執行一次
  fi
fi

# Info: 20251028 - Tzuhan --- *** 新增：立即執行一次爬蟲任務 *** ---
echo "" # 空行分隔
echo "🚀 正在立即執行一次爬蟲任務 (輸出將附加到 $LOG_FILE_ABS_PATH)..."
# Info: 20251028 - Tzuhan 使用 nohup 在背景執行，這樣即使關閉終端機也能繼續跑完
# Info: 20251028 - Tzuhan 使用與 cron 相同的 PATH 設定確保環境一致
nohup env PATH="$NODE_BIN_PATH:$PATH" "$CRAWLER_SCRIPT_ABS_PATH" >> "$LOG_FILE_ABS_PATH" 2>&1 &

# Info: 20251028 - Tzuhan 取得背景執行的 PID
IMMEDIATE_RUN_PID=$!
echo "✅ 已啟動立即執行的爬蟲任務，PID: $IMMEDIATE_RUN_PID。請稍後查看日誌。"

exit 0
