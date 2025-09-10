import React from 'react';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { ILineGraphNode } from '@/interfaces/chart';

// Info: (20250908 - Julian) 動態載入，避免 SSR 錯誤
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ILineGraphProps {
  lineColor: string;
  data: ILineGraphNode[];
}

const LineGraph: React.FC<ILineGraphProps> = ({ lineColor, data }) => {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 40,
      toolbar: { show: false },
      zoom: { enabled: false },
      // Info: (20250910 - Julian) sparkline：小圖模式
      // 隱藏 labels, axisTicks, grid, legend, dataLabels 等...
      sparkline: { enabled: true },
    },
    stroke: { width: 2, curve: 'straight' },
    tooltip: { enabled: false },
    colors: [lineColor], // Info: (20250910 - Julian) Line Color
    fill: {
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [50, 100],
      },
    },
  };

  const series = [{ name: 'Price', data }];

  return <Chart options={options} series={series} type="area" height={40} />;
};

export default LineGraph;
