export interface ICandlestickChartNode {
  x: number; // Info: (20250910 - Julian) Timestamp
  y: [number, number, number, number]; // Info: (20250910 - Julian) [open, high, low, close]
}

export interface IBarGraphNode {
  x: number; // Info: (20250910 - Julian) Timestamp
  y: number; // Info: (20250910 - Julian) Value
  fillColor: string; // Info: (20250910 - Julian) Bar Color
}

export interface ILineGraphNode {
  x: number; // Info: (20250910 - Julian) Timestamp
  y: number; // Info: (20250910 - Julian) Value
}
