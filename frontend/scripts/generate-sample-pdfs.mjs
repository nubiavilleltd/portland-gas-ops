import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/sample-docs");
mkdirSync(OUT, { recursive: true });

function esc(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function makePdf(title, subtitle, fields, footer) {
  let sc = "BT\n";
  // Title
  sc += `/F2 20 Tf\n1 0 0 1 72 740 Tm\n(${esc(title)}) Tj\n`;
  // Subtitle
  sc += `/F1 12 Tf\n1 0 0 1 72 714 Tm\n(${esc(subtitle)}) Tj\n`;
  // Divider hint
  sc += `/F1 10 Tf\n1 0 0 1 72 698 Tm\n(Portland Gas Company Ltd   -   Confidential HR Record) Tj\n`;

  let y = 655;
  for (const [label, value] of fields) {
    sc += `/F2 10 Tf\n1 0 0 1 72 ${y} Tm\n(${esc(label + ":")}) Tj\n`;
    y -= 17;
    sc += `/F1 11 Tf\n1 0 0 1 72 ${y} Tm\n(${esc(value)}) Tj\n`;
    y -= 28;
  }

  // Footer
  sc += `/F1 9 Tf\n1 0 0 1 72 60 Tm\n(${esc(footer)}) Tj\n`;
  sc += `1 0 0 1 72 46 Tm\n(This document is a sample generated for demonstration purposes only.) Tj\n`;
  sc += "ET\n";

  const objs = [
    "1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n",
    "2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n",
    "3 0 obj\n<</Type /Page /MediaBox [0 0 612 792] /Parent 2 0 R\n" +
      "  /Resources <</Font <</F1 4 0 R /F2 5 0 R>>>>\n" +
      "  /Contents 6 0 R>>\nendobj\n",
    "4 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\nendobj\n",
    "5 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>>\nendobj\n",
    `6 0 obj\n<</Length ${sc.length}>>\nstream\n${sc}endstream\nendobj\n`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  for (const obj of objs) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefPos = pdf.length;
  const total = objs.length + 1;
  pdf += `xref\n0 ${total}\n`;
  pdf += "0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<</Size ${total} /Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`;

  return pdf;
}

const docs = [
  {
    file: "Edozie_Contract_2024.pdf",
    title: "Employment Contract",
    subtitle: "Standard Employment Agreement",
    fields: [
      ["Employee Name",   "Magdalene Edozie"],
      ["Job Title",       "Software Developer"],
      ["Department",      "Legal"],
      ["Employee ID",     "PG-001"],
      ["Start Date",      "1 January 2024"],
      ["Contract Type",   "Full Time - Permanent"],
      ["Grade Level",     "Grade 7"],
      ["Issued By",       "HR Admin"],
      ["Issue Date",      "10 January 2025"],
    ],
    footer: "Portland Gas Company Ltd  |  Human Resources Department  |  Lagos, Nigeria",
  },
  {
    file: "Sowemimo_NIN.pdf",
    title: "ID / Passport Copy",
    subtitle: "National Identity Number (NIN) Slip",
    fields: [
      ["Employee Name",   "Oluwaseun Sowemimo"],
      ["Employee ID",     "PG-002"],
      ["Document Type",   "National ID - NIN Slip"],
      ["ID Number",       "NIN-7734-****-2891"],
      ["Date of Birth",   "14 March 1989"],
      ["Verified By",     "HR Admin"],
      ["Verification Date", "15 February 2025"],
    ],
    footer: "Portland Gas Company Ltd  |  Human Resources Department  |  Lagos, Nigeria",
  },
  {
    file: "Chika_MBA_Cert.pdf",
    title: "Certificate",
    subtitle: "Master of Business Administration (MBA)",
    fields: [
      ["Employee Name",    "Joseph Chika"],
      ["Employee ID",      "PG-003"],
      ["Certificate Type", "MBA - Master of Business Administration"],
      ["Institution",      "University of Lagos"],
      ["Year Awarded",     "2022"],
      ["Specialisation",   "Finance and Strategy"],
      ["Uploaded By",      "Joseph Chika"],
      ["Upload Date",      "3 March 2026"],
    ],
    footer: "Portland Gas Company Ltd  |  Human Resources Department  |  Lagos, Nigeria",
  },
  {
    file: "Ohemu_Contract_2026.pdf",
    title: "Employment Contract",
    subtitle: "Standard Employment Agreement",
    fields: [
      ["Employee Name",  "Felix Ohemu"],
      ["Job Title",      "Procurement Officer"],
      ["Department",     "Procurement"],
      ["Employee ID",    "PG-004"],
      ["Start Date",     "1 April 2026"],
      ["Contract Type",  "Full Time - Permanent"],
      ["Grade Level",    "Grade 5"],
      ["Issued By",      "HR Admin"],
      ["Issue Date",     "15 April 2026"],
    ],
    footer: "Portland Gas Company Ltd  |  Human Resources Department  |  Lagos, Nigeria",
  },
  {
    file: "Okeke_HSE_Cert.pdf",
    title: "Safety Certification",
    subtitle: "Health, Safety and Environment (HSE) Level 3",
    fields: [
      ["Employee Name",   "David Okeke"],
      ["Employee ID",     "PG-005"],
      ["Certificate",     "HSE - Health Safety and Environment Level 3"],
      ["Issuing Body",    "National Examination Board in Occupational Safety and Health"],
      ["Certificate No.", "HSE-2026-04-DKO-0045"],
      ["Issue Date",      "20 April 2026"],
      ["Expiry Date",     "19 April 2029"],
      ["Uploaded By",     "David Okeke"],
    ],
    footer: "Portland Gas Company Ltd  |  Human Resources Department  |  Lagos, Nigeria",
  },
];

for (const doc of docs) {
  const pdf = makePdf(doc.title, doc.subtitle, doc.fields, doc.footer);
  const outPath = join(OUT, doc.file);
  writeFileSync(outPath, pdf, "utf8");
  console.log(`Created: ${doc.file}`);
}

console.log(`\nAll sample PDFs written to: ${OUT}`);
