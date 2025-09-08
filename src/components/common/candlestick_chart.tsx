'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Info: (20250908 - Julian) 動態載入，避免 SSR 錯誤
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const CandlestickChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: 'line', // Info: (20250908 - Julian) 基底類型 (混合圖不用設成 candlestick)
      height: 350,
      toolbar: { show: true },
      zoom: { enabled: true, autoScaleYaxis: true, allowMouseWheelZoom: false },
    },
    xaxis: {
      type: 'datetime',
    },
    yaxis: [
      {
        seriesName: 'Price',
        opposite: true,
        tooltip: { enabled: true },
      },
      {
        seriesName: 'Volume',
        tooltip: { enabled: true },
        show: false,
      },
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
    tooltip: { enabled: false },
  };

  const series = [
    {
      name: 'Price',
      type: 'candlestick', // Info: (20250908 - Julian) 蠟燭圖
      data: [
        // [Open, High, Low, Close]
        { x: new Date(2023, 0, 1), y: [451.98, 493.29, 401.59, 420.85] },
        { x: new Date(2023, 0, 2), y: [353.66, 374.99, 281.35, 320.95] },
        { x: new Date(2023, 0, 3), y: [352.96, 403.78, 351.54, 388.48] },
        { x: new Date(2023, 0, 4), y: [402.54, 462.79, 407.88, 349.24] },
        { x: new Date(2023, 0, 5), y: [449.17, 482.86, 417.7, 491.78] },
        { x: new Date(2023, 0, 6), y: [500.31, 550.35, 480.54, 530.34] },
        { x: new Date(2023, 0, 7), y: [530.25, 600.56, 520.62, 580.56] },
        { x: new Date(2023, 0, 8), y: [580.34, 620.47, 570.68, 600.23] },
        { x: new Date(2023, 0, 9), y: [600.12, 630.89, 590.45, 620.78] },
      ],
    },
    {
      name: 'Volume',
      type: 'column', // Info: (20250908 - Julian) 柱狀圖
      data: [
        { x: new Date(2023, 0, 1), y: 212 },
        { x: new Date(2023, 0, 2), y: 220 },
        { x: new Date(2023, 0, 3), y: 193 },
        { x: new Date(2023, 0, 4), y: 312 },
        { x: new Date(2023, 0, 5), y: 242 },
        { x: new Date(2023, 0, 6), y: 352 },
        { x: new Date(2023, 0, 7), y: 252 },
        { x: new Date(2023, 0, 8), y: 442 },
        { x: new Date(2023, 0, 9), y: 362 },
      ],
    },
  ];

  return (
    <div id="chart">
      <Chart options={options} series={series} type="candlestick" height={350} />
    </div>
  );
};

export default CandlestickChart;
