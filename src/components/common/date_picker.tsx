'use client';

import React, { useState, useCallback } from 'react';
import useOuterClick from '@/lib/hooks/use_outer_click';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import { FiCalendar } from 'react-icons/fi';

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

type Dates = {
  date: number;
  disable: boolean;
};

type IPeriod = {
  startTimestamp: number | null;
  endTimestamp: number | null;
};

interface IPopulateDatesProps {
  selectedYear: number;
  selectedMonth: number;
  daysInMonth: Dates[];
  selectedPeriod: IPeriod;
}

interface IDatePickerProps {
  selectedYear: number;
  selectedMonth: number;
  label?: string;
  minDate?: number;
  maxDate?: number;
}

const PopulateDates: React.FC<IPopulateDatesProps> = ({
  daysInMonth,
  selectedYear,
  selectedMonth,
  selectedPeriod,
}) => {
  const weekHeader = WEEK_LIST.map((day) => (
    <p key={day} className="font-bold text-text-note">
      {day.slice(0, 1)}
    </p>
  ));

  const dateGrid = daysInMonth.map((el, index) => {
    // Deprecated: (20250825 - Luphia) remove eslint-disable
    // eslint-disable-next-line react/jsx-key
    if (!el) return <p className={`null-${index}`}></p>;

    // Info: (20250825 - Julian) 取得該日期的 timestamp (秒)
    const timestamp = new Date(`${selectedYear}/${selectedMonth}/${el.date}`).getTime() / 1000;

    // Info: (20250825 - Julian) 判斷該日期是否在選取範圍內
    const isStart = timestamp === selectedPeriod.startTimestamp;
    const isSelected =
      timestamp > (selectedPeriod.startTimestamp ?? 0) &&
      timestamp < (selectedPeriod.endTimestamp ?? 0);
    const isEnd = timestamp === selectedPeriod.endTimestamp;

    const dateStyle = isStart
      ? 'text-text-invert before:bg-datepicker-active before:rounded-l-full'
      : isEnd
        ? 'text-text-invert before:bg-datepicker-active before:rounded-r-full'
        : isSelected
          ? 'before:bg-datepicker-hover'
          : 'text-text-primary bg-transparent';

    return (
      <button
        key={`${el.date}`}
        type="button"
        disabled={el.disable}
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

const DatePicker: React.FC<IDatePickerProps> = ({ label, minDate, maxDate }) => {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const [selectedPeriod, setSelectedPeriod] = useState<IPeriod>({
    startTimestamp: 1755166788,
    endTimestamp: 1756483200,
  });

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

    let dates: Dates[] = [];
    for (let i = 0; i < dayLength; i++) {
      const timestamp = new Date(`${year}/${month}/${i + 1}`).getTime();

      const date = {
        date: i + 1,
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
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            daysInMonth={getDaysInMonth(selectedYear, selectedMonth)}
            selectedPeriod={selectedPeriod}
          />
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
