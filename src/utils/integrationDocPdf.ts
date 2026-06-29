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
  companyName = 'RVNU'
) => {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 50;
  let y = margin;

  const fields = Object.keys(schema?.fieldTypes || {});
  const required = new Set(schema?.requiredFields || []);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${companyName} Live Posting API – Buyer Integration Specs`, margin, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Version 1.0  •  Last Updated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 14;
  doc.text('Audience: Approved Buyers & Technical Integration Teams', margin, y);
  y += 22;
  doc.setTextColor(0);

  // Configuration Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Integration Configuration', margin, y);
  y += 6;

  autoTable(doc, {
    startY: y + 4,
    head: [['Setting', 'Value']],
    body: [
      ['Company Name', companyName],
      ['Data Partner Name', sourceName],
      ['API Endpoint', ENDPOINT],
      ['API Key', apiKey],
    ],
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40] },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: margin, right: margin },
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // Sections
  const addSection = (title: string, body: string) => {
    if (y > 700) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(body, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 12 + 10;
  };

  addSection('1. Overview',
    `This document outlines the technical specifications required for buyers to post live lead data to ${companyName} via a secure REST API. The endpoint supports both single-record and batch submissions in JSON format and is designed for real-time ingestion. All submissions must be authenticated using the API key provided above.`
  );

  addSection('2. API Endpoint', `Base URL: ${ENDPOINT}\nHTTP Method: POST`);
  addSection('3. Authentication',
    'All requests must include a valid API key in the request headers:\n\nX-API-Key: <your-api-key>\n\nRequests with missing, invalid, or inactive API keys will be rejected.'
  );
  addSection('4. Headers',
    'All requests must include the following headers:\n\nContent-Type: application/json\nX-API-Key: <your-api-key>'
  );

  // Example cURL with schema fields
  const exampleObj: Record<string, string> = {};
  (fields.length ? fields : ['email', 'fname', 'lname', 'phone']).forEach(f => {
    exampleObj[f] = `example-${f}`;
  });
  const curl = `curl -X POST ${ENDPOINT} \\\n -H "Content-Type: application/json" \\\n -H "X-API-Key: ${apiKey}" \\\n -d '${JSON.stringify(exampleObj, null, 2)}'`;

  if (y > 600) { doc.addPage(); y = margin; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('5. Request Format – Single Record', margin, y);
  y += 14;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  const curlLines = doc.splitTextToSize(curl, pageWidth - margin * 2);
  if (y + curlLines.length * 11 > 740) { doc.addPage(); y = margin; }
  doc.text(curlLines, margin, y);
  y += curlLines.length * 11 + 16;

  // Field table
  if (fields.length > 0) {
    if (y > 600) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('6. Field Specifications', margin, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [['Field Name', 'Type', 'Required', 'Description']],
      body: fields.map(f => [
        f,
        schema?.fieldTypes[f] || 'string',
        required.has(f) ? 'Yes' : 'No',
        friendlyDescription(f),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 20;
  }

  addSection('7. Batch Submission',
    'The endpoint also supports batch submissions by posting a JSON array of objects with the same field structure as a single record.'
  );

  addSection('8. Responses',
    'Success (HTTP 200):\n{ "success": true, "message": "Data received successfully", "data": { "id": "...", "sourceId": "..." } }\n\nBatch Success (HTTP 200):\n{ "success": true, "message": "Batch data received successfully", "data": { "receivedCount": N, "failedCount": 0, "entries": [...] } }'
  );

  addSection('9. Error Handling',
    'Authentication Error (HTTP 403):\n{ "success": false, "message": "Invalid API key or inactive source", "code": "AUTH_FAILED" }\n\nValidation Error (HTTP 400):\n{ "success": false, "message": "Data validation failed", "code": "VALIDATION_ERROR", "errors": ["..."] }'
  );

  addSection('10. Rate Limits',
    'Limit: 1,000 requests per hour per API key. Exceeding the limit returns HTTP 429. Implement retry logic with exponential backoff.'
  );

  addSection('11. Best Practices',
    '• Send leads in real time whenever possible\n• Ensure consent artifacts (Jornaya / TrustedForm) are accurate and unmodified\n• Do not resend the same lead unless explicitly instructed\n• Contact us before scaling volume or changing payload structure'
  );

  addSection('12. Support',
    `For API access, whitelisting, or technical questions, please contact your ${companyName} account representative.`
  );

  doc.save(`${sourceName.replace(/[^a-z0-9]/gi, '_')}_Integration_Specs.pdf`);
};
