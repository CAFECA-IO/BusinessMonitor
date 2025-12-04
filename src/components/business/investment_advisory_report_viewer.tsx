'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { IPeriod } from '@/interfaces/period';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const BUSINESS_ID = '1419726';
const FILE_URL =
  'https://storage.cafeca.io/api/v1/file/QmTzzMVfUGg6evKAABryMQy1SKHhePxwUHd3PgjtoGeyJg';

const InvestmentAdvisoryReportViewer: React.FC<{ businessId: string; activePeriod: IPeriod }> = ({
  businessId,
  activePeriod,
}) => {
  const [pages, setPages] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);

  const isSelectedPeriodValid =
    activePeriod.startTimestamp !== 0 && activePeriod.endTimestamp !== 0;

  const handleRWD = () => {
    const innerWidth = window.innerWidth;

    if (innerWidth > 768) {
      setWidth(900); // Info: (20251201 - Julian) PC View
    } else if (innerWidth > 576) {
      setWidth(600); // Info: (20251201 - Julian) Tablet View
    } else setWidth(300); // Info: (20251201 - Julian) Mobile View
  };

  // Info: (20251201 - Julian) PDF 自適應寬度 RWD
  useEffect(() => {
    window.addEventListener('resize', handleRWD);
    return () => {
      window.removeEventListener('resize', handleRWD);
    };
  }, []);

  // Info: (20251201 - Julian) 將 PDF 展開
  const reportPages = Array.from({ length: pages }, (_, i) => (
    <Page key={i} pageNumber={i + 1} width={width} renderTextLayer renderAnnotationLayer />
  ));

  const isShowViewer =
    businessId === BUSINESS_ID ? (
      <div className="flex flex-col items-center">
        <Document
          file={FILE_URL}
          onLoadSuccess={(pdf) => setPages(pdf.numPages)}
          loading={<div className="py-10 text-center">載入中...</div>}
          error={<div className="text-red py-10 text-center">無法載入 PDF</div>}
        >
          {reportPages}
        </Document>
      </div>
    ) : (
      <div>No Investment Advisory Report Data</div>
    );

  const isDisplayReport = isSelectedPeriodValid ? (
    isShowViewer
  ) : (
    <div>Please select a valid period to view the report.</div>
  );

  return <>{isDisplayReport}</>;
};

export default InvestmentAdvisoryReportViewer;
