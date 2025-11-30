'use client';

import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const BUSINESS_ID = '1419726';
const FILE_URL =
  'https://storage.cafeca.io/api/v1/file/QmTzzMVfUGg6evKAABryMQy1SKHhePxwUHd3PgjtoGeyJg';

const InvestmentAdvisoryReportViewer: React.FC<{ businessId: string }> = ({ businessId }) => {
  // ToDo: (20251128 - Julian) During Development:
  // 1. Document styles are not fully applied.
  // 2. PDF should be loaded after period selection.
  const isShowViewer =
    businessId === BUSINESS_ID ? (
      <Document file={FILE_URL}>
        <Page pageNumber={1} />
      </Document>
    ) : (
      <div>No Investment Advisory Report Data</div>
    );

  return <>{isShowViewer}</>;
};

export default InvestmentAdvisoryReportViewer;
