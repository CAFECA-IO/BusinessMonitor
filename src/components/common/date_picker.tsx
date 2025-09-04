'use client';

import React, { useState, useCallback /* useEffect */ } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { FiCalendar } from 'react-icons/fi';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { IPeriod } from '@/interfaces/period';

// Info: (20250825 - Julian) Constants
const MONTH_LIST = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEK_LIST = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type IDates = {
  date: number;
  timestamp: number;
  disable: boolean;
};

interface IPopulateDatesProps {
  daysInMonth: IDates[];
  selectedPeriod: IPeriod;
  setSelectedPeriod: React.Dispatch<React.SetStateAction<IPeriod>>;
}

interface IDatePickerProps {
  selectedPeriod: IPeriod;
  setSelectedPeriod: React.Dispatch<React.SetStateAction<IPeriod>>;
  label?: string;
  minDate?: number;
  maxDate?: number;
  initialSelectedYear?: number;
  initialSelectedMonth?: number;
}

const PopulateDates: React.FC<IPopulateDatesProps> = ({
  daysInMonth,
  selectedPeriod,
  setSelectedPeriod,
}) => {
  const [dateOne, setDateOne] = useState<number | null>(null);
  const [dateTwo, setDateTwo] = useState<number | null>(null);

  const weekHeader = WEEK_LIST.map((day) => (
    <p key={day} className="font-bold text-text-note">
      {day.slice(0, 1)}
    </p>
  ));

  const isOnlyOneDate =
    (dateOne !== null && dateTwo === null) || (dateOne === null && dateTwo !== null);

  const dateGrid = daysInMonth.map((el, index) => {
    if (!el) return <div key={`null-${index}`}></div>;

    // Info: (20250825 - Julian) 判斷該日期是否在選取範圍內
    const isStart = el.timestamp === selectedPeriod.startTimestamp;
    const isSelected =
      el.timestamp > (selectedPeriod.startTimestamp ?? 0) &&
      el.timestamp < (selectedPeriod.endTimestamp ?? 0);
    const isEnd = el.timestamp === selectedPeriod.endTimestamp;

    // Info: (20250903 - Julian) 單選 -> 整圓，區間選取 -> 左右半圓
    const startDateStyle = `text-text-invert before:bg-datepicker-active ${isOnlyOneDate ? 'before:rounded-full' : 'before:rounded-l-full'}`;
    const endDateStyle = `text-text-invert before:bg-datepicker-active ${isOnlyOneDate ? 'before:rounded-full' : 'before:rounded-r-full'}`;

    // Info: (20250903 - Julian) 根據日期狀態決定樣式
    const dateStyle = isStart
      ? startDateStyle
      : isEnd
        ? endDateStyle
        : isSelected
          ? 'before:bg-datepicker-hover'
          : 'text-text-primary bg-transparent';

    // ToDo: (20250903 - Julian) 補上重選的邏輯
    const handleDateClick = () => {
      if (el.disable) return; // Info: (20250903 - Julian) 禁用的日期不處理

      if (dateOne === null) {
        setDateOne(el.timestamp);
      } else if (dateOne !== null && dateTwo === null) {
        setDateTwo(el.timestamp);
      }
    };

    // useEffect(() => {
    //   if (dateOne !== null && dateTwo !== null) {
    //     if (dateOne < dateTwo) {
    //       setSelectedPeriod({ startTimestamp: dateOne, endTimestamp: dateTwo });
    //     } else {
    //       setSelectedPeriod({ startTimestamp: dateTwo, endTimestamp: dateOne });
    //     }
    //   } else if (dateOne !== null && dateTwo === null) {
    //     setSelectedPeriod({ startTimestamp: dateOne, endTimestamp: dateOne });
    //   } else {
    //     setSelectedPeriod({ startTimestamp: 0, endTimestamp: 0 });
    //   }
    // }, [dateOne, dateTwo, setSelectedPeriod]);

    return (
      <button
        key={`${el.date}`}
        type="button"
        disabled={el.disable}
        onClick={handleDateClick}
        className={`relative h-32px py-2px font-normal ${dateStyle} rounded-full before:absolute before:inset-0 before:z-0 before:h-full before:w-full hover:text-text-invert enabled:hover:bg-datepicker-active disabled:text-text-note`}
      >
        <p className="relative z-10">{el.date}</p>
      </button>
    );
  });

  return (
    <div className="grid grid-cols-7 gap-y-spacing-3xs text-center text-base">
      {/* Info: (20250825 - Julian) Weekday Header */}
      {weekHeader}
      {/* Info: (20250825 - Julian) Date Grid */}
      {dateGrid}
    </div>
  );
};

const DatePicker: React.FC<IDatePickerProps> = ({
  selectedPeriod,
  setSelectedPeriod,
  label,
  minDate,
  maxDate,
  initialSelectedYear,
  initialSelectedMonth,
}) => {
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState<number>(
    initialSelectedYear ?? today.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    initialSelectedMonth ?? today.getMonth() + 1
  );

  const dateStr = 'YYYY-MM-DD';
  const monthStr = MONTH_LIST[selectedMonth - 1];
  const formattedMonth = monthStr.length > 3 ? `${monthStr.slice(0, 3)}.` : monthStr;
  const monthAndYearStr = `${formattedMonth} ${selectedYear}`;

  const {
    targetRef: dateRef,
    componentVisible: isOpenDatePicker,
    setComponentVisible: setOpenDatePicker,
  } = useOuterClick<HTMLDivElement>(false);

  const toggleDatePicker = () => {
    setOpenDatePicker(!isOpenDatePicker);
  };

  // Info: (20250825 - Julian) 取得該月份的第一天是星期幾 (0~6, 0 代表星期天)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(`${year}/${month}/01`).getDay();
  };

  // Info: (20250825 - Julian) 取得該月份的天數
  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = getFirstDayOfMonth(year, month);
    const dayLength = new Date(year, month, 0).getDate();

    let dates: IDates[] = [];
    for (let i = 0; i < dayLength; i++) {
      const timestamp = new Date(`${year}/${month}/${i + 1}`).getTime();

      const date = {
        date: i + 1,
        timestamp: Math.floor(timestamp / 1000), // Info: (20250903 - Julian) 轉換為秒
        disable:
          (minDate && timestamp < minDate) || (maxDate && timestamp > maxDate) ? true : false, // Info: (20250825 - Julian) 禁用範圍外的日期
      };
      dates.push(date);
    }

    // Info: (20250825 - Julian) 補足該月份第一天前的空白日期
    dates = Array(...Array(firstDay)).concat(dates);
    return dates;
  };

  // Info: (20250825 - Julian) 切換到上一個月份
  const goToPrevMonth = useCallback(() => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (newMonth === 1) {
      newMonth = 12;
      newYear -= 1;
    } else {
      newMonth -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  }, [selectedMonth, selectedYear]);

  // Info: (20250825 - Julian) 切換到下一個月份
  const goToNextMonth = useCallback(() => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (newMonth === 12) {
      newMonth = 1;
      newYear += 1;
    } else {
      newMonth += 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  }, [selectedMonth, selectedYear]);

  const isShowLabel = label && <p className="text-sm font-normal text-text-primary">{label}</p>;

  return (
    <div className="flex flex-col items-start gap-8px">
      {isShowLabel}

      {/* Info: (20250825 - Julian) Date Picker */}
      <div ref={dateRef} className="relative flex flex-col gap-8px">
        {/* Info: (20250825 - Julian) Banner */}
        <div
          onClick={toggleDatePicker}
          className={`flex min-w-300px items-center rounded-radius-s border bg-surface-primary p-spacing-2xs transition-all duration-200 ease-in-out hover:cursor-pointer hover:border-border-brand ${isOpenDatePicker ? 'border-border-brand' : 'border-border-secondary'} `}
        >
          <p className="flex-1 text-base font-normal text-text-note">{dateStr}</p>
          <FiCalendar size={24} className="text-text-primary" />
        </div>

        {/* Info: (20250825 - Julian) Date Picker Content */}
        <div
          className={`absolute top-64px flex w-full flex-col gap-16px rounded-radius-s bg-surface-primary p-24px shadow-drop-L transition-all duration-200 ease-in-out ${isOpenDatePicker ? 'visible opacity-100' : 'invisible opacity-0'}`}
        >
          {/* Info: (20250825 - Julian) Header */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={goToPrevMonth}>
              <FaChevronLeft size={20} className="text-text-primary" />
            </button>
            <p className="text-base font-bold text-text-brand">{monthAndYearStr}</p>
            <button type="button" onClick={goToNextMonth}>
              <FaChevronRight size={20} className="text-text-primary" />
            </button>
          </div>
          <PopulateDates
            daysInMonth={getDaysInMonth(selectedYear, selectedMonth)}
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
          />
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
