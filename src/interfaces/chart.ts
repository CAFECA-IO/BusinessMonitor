export interface ICandidateChartNode {
  x: number; // Info: (20250910 - Julian) Timestamp
  y: [number, number, number, number]; // Info: (20250910 - Julian) [open, high, low, close]
}

export interface ILineGraphNode {
  x: number; // Info: (20250910 - Julian) Timestamp
  y: number; // Info: (20250910 - Julian) Value
}
