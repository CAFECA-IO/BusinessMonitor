export const timestampToString = (timestamp: number) => {
  if (!timestamp || timestamp == 0) return { formattedDate: '-', time: '-' };

  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Info: (20250812 - Julian) 月份從 0 開始算，所以需要加 1
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();

  const monthWithDoubleDigit = month.toString().padStart(2, '0');
  const dayWithDoubleDigit = day.toString().padStart(2, '0');
  const hourWithDoubleDigit = hour.toString().padStart(2, '0');
  const minuteWithDoubleDigit = minute.toString().padStart(2, '0');

  return {
    formattedDate: `${year}-${monthWithDoubleDigit}-${dayWithDoubleDigit}`,
    time: `${hourWithDoubleDigit}:${minuteWithDoubleDigit}`,
  };
};

export const formatNumberWithCommas = (num: number | string) => {
  if (num === null || num === undefined) return '-';
  if (typeof num === 'number' && isNaN(num)) return '-';

  const integerPart = num.toString().split('.')[0];
  const decimalPart = num.toString().split('.')[1] ?? '';

  // Info: (20250812 - Julian) 整數部分才要格式化，小數部分不需要
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  // Info: (20250812 - Julian) 如果有小數部分，則保留小數點和小數部分
  const formattedDecimalPart = decimalPart ? `.${decimalPart}` : '';

  return `${formattedIntegerPart}${formattedDecimalPart}`;
};
