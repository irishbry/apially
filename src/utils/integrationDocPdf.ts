import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataSchema } from '@/types/api.types';

const ENDPOINT = 'https://api.apially.com/functions/v1/data-receiver';

const friendlyDescription = (field: string): string => {
  const map: Record<string, string> = {
    ip: 'Consumer IP address',
    url: 'Source URL or landing page',
    zip: 'Postal code',
    city: 'City',
    email: 'Email address',
    fname: 'First name',
    lname: 'Last name',
    phone: 'Phone number',
    state: 'State or region',
    address: 'Street address',
    created: 'Lead creation timestamp (buyer format)',
    jornaya: 'Jornaya LeadID token',
    trusted_form: 'TrustedForm certificate URL',
    dob: 'Date of birth',
    gender: 'Gender',
    age: 'Age',
  };
  return map[field.toLowerCase()] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const generateIntegrationPdf = (
  sourceName: string,
  apiKey: string,
  schema?: DataSchema,
  companyName = 'ApiAlly'
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const fields = Object.keys(schema?.fieldTypes || {});
  const required = new Set(schema?.requiredFields || []);
  const hasRequired = required.size > 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 14, gap = 10) => {
    ensureSpace(size + gap + 4);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(0);
    doc.text(text, margin, y);
    y += size + gap;
  };

  const subheading = (text: string) => {
    ensureSpace(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(text, margin, y);
    y += 14;
  };

  const paragraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * 13 + 4);
    doc.text(lines, margin, y);
    y += lines.length * 13 + 6;
    doc.setTextColor(0);
  };

  const codeBlock = (code: string) => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(code, contentWidth - 16);
    const blockHeight = lines.length * 11 + 16;
    ensureSpace(blockHeight + 4);
    doc.setFillColor(245, 246, 248);
    doc.setDrawColor(220);
    doc.roundedRect(margin, y, contentWidth, blockHeight, 4, 4, 'FD');
    doc.setTextColor(20);
    doc.text(lines, margin + 8, y + 14);
    y += blockHeight + 10;
    doc.setTextColor(0);
  };

  const divider = () => {
    ensureSpace(14);
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  // ===== Title =====
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${sourceName} Live Posting API`, margin, y);
  y += 22;
  doc.setFontSize(13);
  doc.setTextColor(80);
  doc.text('Buyer Integration Specifications', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Version 1.0   •   Last Updated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 12;
  doc.text('Audience: Approved Buyers & Technical Integration Teams', margin, y);
  y += 20;
  doc.setTextColor(0);

  // ===== 1. Overview =====
  heading('1. Overview');
  paragraph(
    `This document outlines the technical specifications required for buyers to post live lead data to ${companyName} via a secure REST API. The endpoint supports both single-record and batch submissions in JSON format and is designed for real-time ingestion. All submissions must be authenticated using the API key provided below.`
  );

  // ===== 2. Integration Configuration =====
  heading('2. Integration Configuration');
  autoTable(doc, {
    startY: y,
    head: [['Setting', 'Value']],
    body: [
      ['Company Name', companyName],
      ['Data Partner / Source Name', sourceName],
      ['API Endpoint', ENDPOINT],
      ['HTTP Method', 'POST'],
      ['API Key', apiKey],
    ],
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // ===== 3. Authentication =====
  heading('3. Authentication');
  paragraph('All requests must include a valid API key in the request headers:');
  codeBlock(`X-API-Key: ${apiKey}`);
  paragraph('Requests with missing, invalid, or inactive API keys will be rejected with HTTP 403.');

  // ===== 4. Required Headers =====
  heading('4. Required Headers');
  codeBlock(`Content-Type: application/json\nX-API-Key: ${apiKey}`);

  // ===== 5. Request Format =====
  heading('5. Request Format');

  // Build example object using exact schema fields
  const orderedFields = fields.length ? fields : ['email', 'fname', 'lname', 'phone'];
  const exampleObj: Record<string, string> = {};
  orderedFields.forEach(f => { exampleObj[f] = `example-${f}`; });

  subheading('5.1 Single Record Submission');
  paragraph('Example cURL');
  const curl = `curl -X POST ${ENDPOINT} \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${apiKey}" \\\n  -d '${JSON.stringify(exampleObj, null, 2).split('\n').join('\n  ')}'`;
  codeBlock(curl);

  subheading('5.2 Batch Submission');
  paragraph('The endpoint also supports batch submissions by posting an array of objects.');
  const f1 = orderedFields[0] || 'email';
  const f2 = orderedFields[1] || orderedFields[0] || 'phone';
  const batchExample = `[\n  { "${f1}": "example-${f1}-1", "${f2}": "example-${f2}-1" },\n  { "${f1}": "example-${f1}-2", "${f2}": "example-${f2}-2" }\n]`;
  codeBlock(batchExample);

  // ===== 6. JSON Schema =====
  heading('6. JSON Schema');
  const schemaObj: Record<string, string> = {};
  orderedFields.forEach(f => {
    schemaObj[f] = schema?.fieldTypes[f] || 'string';
  });
  codeBlock(JSON.stringify(schemaObj, null, 2));
  if (!hasRequired) {
    paragraph('Note: No fields are currently required. However, Buyers are expected to send the most complete and accurate data available.');
  } else {
    paragraph(`Note: The following fields are required: ${[...required].join(', ')}. Buyers are expected to send the most complete and accurate data available.`);
  }

  // ===== 7. Field Definitions =====
  heading('7. Field Definitions');
  const fieldRows = orderedFields.map(f => [
    f,
    schema?.fieldTypes[f] || 'string',
    hasRequired ? (required.has(f) ? 'Yes' : 'No') : '—',
    friendlyDescription(f),
  ]);
  autoTable(doc, {
    startY: y,
    head: [['Field Name', 'Type', 'Required', 'Description']],
    body: fieldRows,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 110, font: 'courier' },
      1: { cellWidth: 60 },
      2: { cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 16;

  // ===== 8. Responses =====
  heading('8. Responses');

  subheading('8.1 Success – Single Record');
  paragraph('HTTP 200 OK');
  const singleResp = {
    success: true,
    message: 'Data received successfully',
    data: {
      id: 'entry-1770762223-123',
      sourceId: 'source-123',
      ...exampleObj,
    },
  };
  codeBlock(JSON.stringify(singleResp, null, 2));

  subheading('8.2 Success – Batch Submission');
  paragraph('HTTP 200 OK');
  const batchResp = {
    success: true,
    message: 'Batch data received successfully',
    data: {
      receivedCount: 2,
      failedCount: 0,
      entries: [
        { id: 'entry-1770762223-123', sourceId: 'source-123' },
        { id: 'entry-1770762223-124', sourceId: 'source-123' },
      ],
    },
  };
  codeBlock(JSON.stringify(batchResp, null, 2));

  subheading('8.3 Authentication Error');
  paragraph('HTTP 403 Forbidden');
  codeBlock(JSON.stringify({
    success: false,
    message: 'Invalid API key or inactive source',
    code: 'AUTH_FAILED',
  }, null, 2));

  subheading('8.4 Validation Error');
  paragraph('HTTP 400 Bad Request');
  codeBlock(JSON.stringify({
    success: false,
    message: 'Data validation failed',
    code: 'VALIDATION_ERROR',
    errors: ['Missing required field: email'],
  }, null, 2));

  // ===== 9. Rate Limits =====
  heading('9. Rate Limits');
  paragraph('Limit: 1,000 requests per hour per API key. Exceeding the limit returns HTTP 429. Implement retry logic with exponential backoff.');

  // ===== 10. Best Practices =====
  heading('10. Best Practices');
  paragraph(
    '• Send leads in real time whenever possible\n• Ensure consent artifacts (Jornaya / TrustedForm) are accurate and unmodified\n• Do not resend the same lead unless explicitly instructed\n• Contact us before scaling volume or changing payload structure'
  );

  // ===== 11. Support =====
  heading('11. Support');
  paragraph(`For API access, whitelisting, or technical questions, please contact your ${companyName} account representative.`);

  divider();
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text(`Generated by ${companyName} • ${new Date().toISOString()}`, margin, y);

  doc.save(`${sourceName.replace(/[^a-z0-9]/gi, '_')}_Integration_Specs.pdf`);
};
