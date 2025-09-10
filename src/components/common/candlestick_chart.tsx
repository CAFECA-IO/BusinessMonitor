'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { ICandidateChartNode } from '@/interfaces/chart';
// import { MONTH_LIST } from '@/constants/date';

// Info: (20250908 - Julian) 動態載入，避免 SSR 錯誤
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ICandlestickChartProps {
  chartData: ICandidateChartNode[];
}

const CandlestickChart: React.FC<ICandlestickChartProps> = ({ chartData }) => {
  const options: ApexOptions = {
    chart: {
      // type: 'line', // Info: (20250908 - Julian) 基底類型 (混合圖不用設成 candlestick)
      type: 'candlestick',
      height: 470,
      zoom: { enabled: false, autoScaleYaxis: false, allowMouseWheelZoom: false },
      toolbar: { show: false }, // Info: (20250908 - Julian) 不顯示工具列
    },
    xaxis: {
      type: 'datetime',
      tickAmount: 10,
      labels: {
        style: { colors: '#8181A0', fontFamily: 'Jost', fontSize: '12px', fontWeight: 500 },
        // formatter: function (value) {
        //   // Info: (20250909 - Julian) x 軸只顯示月份的前三個字母
        //   const date = new Date(value);
        //   return `${MONTH_LIST[date.getMonth()].slice(0, 3)}`;
        // },
        datetimeFormatter: {
          day: 'dd MMM',
          month: "MMM 'yy",
        },
      },
    },
    yaxis: [
      {
        seriesName: 'Price',
        opposite: true,
        tooltip: { enabled: true },
        labels: {
          style: { colors: '#8181A0', fontFamily: 'Jost', fontSize: '12px', fontWeight: 500 },
        },
      },
      // {
      //   seriesName: 'Volume',
      //   tooltip: { enabled: true },
      //   show: false,
      // },
    ],
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#3DD08C', // Info: (20250908 - Julian) 上漲的顏色
          downward: '#FF5959', // Info: (20250908 - Julian) 下跌的顏色
        },
        wick: {
          useFillColor: true,
        },
      },
    },
    grid: {
      borderColor: '#DBDBEB',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: true } },
    },
    fill: { opacity: [1, 0.3] }, // Info: (20250908 - Julian) 不透明度，第一個 chart 100% 第二個 30%
    tooltip: { enabled: true },
  };

  const series = [
    {
      name: 'Price',
      type: 'candlestick', // Info: (20250908 - Julian) 蠟燭圖
      data: chartData,
    },
    //   {
    //     name: 'Volume',
    //     type: 'column', // Info: (20250908 - Julian) 柱狀圖
    //     data: [
    //       { x: new Date(2023, 0, 1), y: 212 },
    //       { x: new Date(2023, 0, 2), y: 220 },
    //       { x: new Date(2023, 0, 3), y: 193 },
    //       { x: new Date(2023, 0, 4), y: 312 },
    //       { x: new Date(2023, 0, 5), y: 242 },
    //       { x: new Date(2023, 0, 6), y: 352 },
    //       { x: new Date(2023, 0, 7), y: 252 },
    //       { x: new Date(2023, 0, 8), y: 442 },
    //       { x: new Date(2023, 0, 9), y: 362 },
    //     ],
    //   },
  ];

  return (
    <div id="chart">
      <Chart options={options} series={series} type="candlestick" height={470} />
    </div>
  );
};

export default CandlestickChart;
