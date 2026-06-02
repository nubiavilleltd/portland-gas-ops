// ── Constants ─────────────────────────────────────────────────────────────────

export const HR_DEPARTMENTS = [
  "Legal", "Commercial", "Assets", "Engineering", "Operations",
  "Finance", "HR", "IT", "Safety", "Admin",
] as const;

export const EMPLOYMENT_CATEGORIES = ["Full Time", "Part Time", "Contract", "Intern"] as const;

export const GRADE_LEVELS = [
  "1","2","3","4","5","6","7","8","9","10","11","12","13","14","15",
] as const;

export const LEAVE_TYPES = [
  "Annual Leave", "Sick Leave", "Casual Leave",
  "Maternity Leave", "Paternity Leave", "Compassionate Leave", "Study Leave",
] as const;

export const POLICY_CATEGORIES = ["General", "Leave", "Conduct", "Safety", "Finance", "Travel"] as const;

export const PAYROLL_PERIODS = [
  "June 2026", "May 2026", "April 2026", "March 2026", "February 2026", "January 2026",
] as const;

export const HR_DEPT_OPTIONS = HR_DEPARTMENTS.map((d) => ({ value: d, label: d }));
export const CATEGORY_OPTIONS = EMPLOYMENT_CATEGORIES.map((c) => ({ value: c, label: c }));
export const GRADE_OPTIONS = GRADE_LEVELS.map((g) => ({ value: g, label: `Grade ${g}` }));
export const LEAVE_TYPE_OPTIONS = LEAVE_TYPES.map((t) => ({ value: t, label: t }));

// ── Approvers ─────────────────────────────────────────────────────────────────

export const HR_APPROVERS: Record<string, { lineManager: string; hrReview: string }> = {
  Legal:       { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Commercial:  { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Assets:      { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Engineering: { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Operations:  { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Finance:     { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  HR:          { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  IT:          { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Safety:      { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
  Admin:       { lineManager: "Samuel Eze", hrReview: "Oluwaseun Sowemimo" },
};

// ── Reference generator ───────────────────────────────────────────────────────

export function genHRRef(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
  return `${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${hex}`;
}

export function fmtDate(d: string): string {
  return d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  birthday: string;
  category: string;
  grade: string;
  email: string;
  lineManager?: string;
  lineManagerEmail?: string;
  basicSalary?: number;
  housingAllowance?: number;
  transportAllowance?: number;
  mealAllowance?: number;
  paye?: number;
  pension?: number;
  nhf?: number;
  loanRepayment?: number;
}

export interface LeaveRequest {
  id: string;
  ref: string;
  requestType?: "self" | "others";
  requester?: string;
  employee: string;
  jobTitle?: string;
  type: string;
  department: string;
  startDate: string;
  endDate: string;
  days: number;
  reliever: string;
  reason?: string;
  supportingDocuments?: string[];
  status: "draft" | "pending" | "approved" | "in_progress" | "rejected";
  date: string;
}

export interface EmployeeRecord {
  id: string;
  employee: string;
  docType: string;
  fileName: string;
  filePath?: string;
  uploadDate: string;
  uploadedBy: string;
}

export interface Policy {
  id: number;
  name: string;
  category: string;
  version: string;
  effectiveDate: string;
  acknowledged: number;
  total: number;
}

export interface PolicySection {
  heading: string;
  body: string;
}

export interface PolicyDoc {
  title: string;
  sections: PolicySection[];
}

export interface PaySlip {
  id: string;
  employee: string;
  empId: string;
  department: string;
  period: string;
  basic: number;
  housing: number;
  transport: number;
  meal: number;
  paye: number;
  pension: number;
  nhf: number;
  loan: number;
  net: number;
}

export interface PayrollRun {
  id: string;
  ref: string;
  period: string;
  runDate: string;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employees: number;
  status: "pending" | "approved" | "processed" | "draft" | "rejected";
  preparedBy: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

export const SEED_EMPLOYEES: Employee[] = [
  { id: "1", firstName: "Magdalene",  lastName: "Edozie",   title: "Software Developer",    department: "Legal",      birthday: "2025-12-17", category: "Full Time", grade: "7",  email: "magdalene.edozie@portlandgas.com",   lineManager: "Oluwaseun Sowemimo", lineManagerEmail: "oluwaseun.sowemimo@portlandgas.com", basicSalary: 650000,  housingAllowance: 150000, transportAllowance: 80000,  mealAllowance: 40000, paye: 85000,  pension: 52000, nhf: 16250, loanRepayment: 30000 },
  { id: "2", firstName: "Oluwaseun",  lastName: "Sowemimo", title: "Software Developer",    department: "Commercial", birthday: "",           category: "Full Time", grade: "14", email: "oluwaseun.sowemimo@portlandgas.com", lineManager: "Bola Adeyemi",       lineManagerEmail: "bola.adeyemi@portlandgas.com",       basicSalary: 950000,  housingAllowance: 250000, transportAllowance: 120000, mealAllowance: 60000, paye: 165000, pension: 76000, nhf: 23750, loanRepayment: 0     },
  { id: "3", firstName: "Opeyemi",    lastName: "Busari",   title: "Data Analyst",          department: "Assets",     birthday: "2025-01-26", category: "Full Time", grade: "10", email: "opeyemi.busari@portlandgas.com",     lineManager: "Ifeanyi Chukwu",     lineManagerEmail: "ifeanyi.chukwu@portlandgas.com",     basicSalary: 720000,  housingAllowance: 180000, transportAllowance: 90000,  mealAllowance: 45000, paye: 100000, pension: 57600, nhf: 18000, loanRepayment: 0     },
  { id: "4", firstName: "Felix",      lastName: "Ohemu",    title: "Field Supervisor",      department: "Assets",     birthday: "2026-04-15", category: "Full Time", grade: "10", email: "felix.ohemu@portlandgas.com",        lineManager: "Ifeanyi Chukwu",     lineManagerEmail: "ifeanyi.chukwu@portlandgas.com",     basicSalary: 700000,  housingAllowance: 175000, transportAllowance: 85000,  mealAllowance: 42000, paye: 95000,  pension: 56000, nhf: 17500, loanRepayment: 0     },
  { id: "5", firstName: "Johnson",    lastName: "Ibikunle", title: "Application Developer", department: "Legal",      birthday: "",           category: "Full Time", grade: "7",  email: "johnson.ibikunle@portlandgas.com",   lineManager: "Magdalene Edozie",   lineManagerEmail: "magdalene.edozie@portlandgas.com",   basicSalary: 600000,  housingAllowance: 140000, transportAllowance: 75000,  mealAllowance: 38000, paye: 75000,  pension: 48000, nhf: 15000, loanRepayment: 0     },
  { id: "6", firstName: "Joseph",     lastName: "Chika",    title: "Operations Manager",    department: "Operations", birthday: "1990-03-12", category: "Full Time", grade: "12", email: "joseph.chika@portlandgas.com",       lineManager: "Johnson Ibikunle",   lineManagerEmail: "johnson.ibikunle@portlandgas.com",   basicSalary: 850000,  housingAllowance: 200000, transportAllowance: 100000, mealAllowance: 50000, paye: 125000, pension: 68000, nhf: 21250, loanRepayment: 0     },
  { id: "7", firstName: "David",      lastName: "Okeke",    title: "Safety Officer",        department: "Safety",     birthday: "1988-07-22", category: "Full Time", grade: "9",  email: "david.okeke@portlandgas.com",        lineManager: "Samuel Eze",         lineManagerEmail: "samuel.eze@portlandgas.com",         basicSalary: 750000,  housingAllowance: 185000, transportAllowance: 92000,  mealAllowance: 46000, paye: 105000, pension: 60000, nhf: 18750, loanRepayment: 0     },
];

export const EMPLOYEE_STORE: Employee[] = [...SEED_EMPLOYEES];

export const SEED_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "l1", ref: "LRQ-20260515-A1B2", requestType: "self",   requester: "Joseph Chika",    employee: "Joseph Chika",     jobTitle: "Operations Manager", type: "Annual Leave", department: "Operations", startDate: "2026-06-01", endDate: "2026-06-10", days: 8,  reliever: "David Okeke",      status: "pending",     date: "15 May 2026", reason: "Annual rest and family time during the Q2 break period." },
  { id: "l2", ref: "LRQ-20260510-C3D4", requestType: "others", requester: "Joseph Chika",    employee: "Magdalene Edozie", jobTitle: "Software Developer",  type: "Sick Leave",   department: "Legal",      startDate: "2026-05-12", endDate: "2026-05-13", days: 2,  reliever: "Johnson Ibikunle", status: "approved",    date: "10 May 2026", reason: "Employee is unwell and has been advised to rest by her physician." },
  { id: "l3", ref: "LRQ-20260503-E5F6", requestType: "others", requester: "Joseph Chika",    employee: "Opeyemi Busari",   jobTitle: "Data Analyst",        type: "Study Leave",  department: "Assets",     startDate: "2026-06-15", endDate: "2026-06-30", days: 12, reliever: "Felix Ohemu",      status: "in_progress", date: "3 May 2026",  reason: "Attending a professional data science certification program at the University of Lagos.", supportingDocuments: ["admission-letter-unilag.pdf"] },
];

export const LEAVE_STORE: LeaveRequest[] = [...SEED_LEAVE_REQUESTS];

export const SEED_EMPLOYEE_RECORDS: EmployeeRecord[] = [
  { id: "r1", employee: "Magdalene Edozie",   docType: "Employment Contract", fileName: "Edozie_Contract_2024.pdf",  filePath: "/sample-docs/Edozie_Contract_2024.pdf",  uploadDate: "10 Jan 2025", uploadedBy: "HR Admin"     },
  { id: "r2", employee: "Oluwaseun Sowemimo", docType: "ID / Passport Copy",  fileName: "Sowemimo_NIN.pdf",          filePath: "/sample-docs/Sowemimo_NIN.pdf",          uploadDate: "15 Feb 2025", uploadedBy: "HR Admin"     },
  { id: "r3", employee: "Joseph Chika",       docType: "Certificates",        fileName: "Chika_MBA_Cert.pdf",        filePath: "/sample-docs/Chika_MBA_Cert.pdf",        uploadDate: "3 Mar 2026",  uploadedBy: "Joseph Chika" },
  { id: "r4", employee: "Felix Ohemu",        docType: "Employment Contract", fileName: "Ohemu_Contract_2026.pdf",   filePath: "/sample-docs/Ohemu_Contract_2026.pdf",   uploadDate: "15 Apr 2026", uploadedBy: "HR Admin"     },
  { id: "r5", employee: "David Okeke",        docType: "Safety Certification",fileName: "Okeke_HSE_Cert.pdf",        filePath: "/sample-docs/Okeke_HSE_Cert.pdf",        uploadDate: "20 Apr 2026", uploadedBy: "David Okeke"  },
];

export const SEED_POLICIES: Policy[] = [
  { id: 1, name: "Employee Handbook 2026",  category: "General", version: "3.1", effectiveDate: "1 Jan 2026",  acknowledged: 3, total: 7 },
  { id: 2, name: "Annual Leave Policy",     category: "Leave",   version: "2.0", effectiveDate: "1 Jan 2026",  acknowledged: 5, total: 7 },
  { id: 3, name: "Code of Conduct",         category: "Conduct", version: "1.5", effectiveDate: "1 Mar 2025",  acknowledged: 7, total: 7 },
  { id: 4, name: "Health & Safety Policy",  category: "Safety",  version: "4.0", effectiveDate: "15 Jan 2026", acknowledged: 4, total: 7 },
  { id: 5, name: "Travel & Expense Policy", category: "Finance", version: "2.2", effectiveDate: "1 Apr 2026",  acknowledged: 2, total: 7 },
  { id: 6, name: "Anti-Harassment Policy",  category: "Conduct", version: "1.0", effectiveDate: "1 Jun 2025",  acknowledged: 6, total: 7 },
];

export const POLICY_DOCS: Record<number, PolicyDoc> = {
  1: {
    title: "Employee Handbook 2026",
    sections: [
      { heading: "1. Introduction",            body: "Welcome to Portland Gas. This handbook outlines the policies, procedures, and expectations that govern your employment. All employees are expected to familiarize themselves with its contents and comply with the guidelines herein." },
      { heading: "2. Employment Terms",         body: "Employment at Portland Gas is governed by the terms set forth in your offer letter and this handbook. Standard working hours are 8:00 AM to 5:00 PM, Monday through Friday. Overtime must be pre-approved by your Line Manager. Probationary period for new hires is 6 months." },
      { heading: "3. Compensation & Benefits", body: "Salaries are paid monthly on the 25th of each month via direct bank transfer. Benefits include health insurance (HMO), pension contributions (in line with the Pension Reform Act), housing allowance, transport allowance, and meal subsidy. Annual salary reviews are conducted in Q1." },
      { heading: "4. Leave Entitlements",       body: "Annual Leave: 20 working days per year. Sick Leave: 10 working days (medical certificate required after 2 consecutive days). Maternity Leave: 12 weeks. Paternity Leave: 10 working days. Casual Leave: 5 days per year. Study Leave: subject to approval." },
      { heading: "5. Disciplinary Procedures", body: "Portland Gas follows a progressive discipline approach: verbal warning, written warning, final written warning, and termination. Gross misconduct (fraud, theft, violence, harassment) may result in immediate dismissal. All disciplinary actions are documented in the employee's record." },
    ],
  },
  2: {
    title: "Annual Leave Policy",
    sections: [
      { heading: "1. Eligibility",           body: "All confirmed full-time employees are entitled to 20 working days of annual leave per calendar year. Leave accrues at 1.67 days per month. Employees on probation may take up to 5 days with Line Manager approval." },
      { heading: "2. Application Process",   body: "Leave requests must be submitted at least 2 weeks in advance through the HR portal. The request goes through a 2-level approval: Line Manager (Approver 1) and HR Review (Approver 2). Emergency leave requests will be considered on a case-by-case basis." },
      { heading: "3. Carry-Over & Buy-Back", body: "A maximum of 5 unused leave days may be carried over to the following year. Carried-over days must be used by March 31st. Unused leave beyond the carry-over limit is forfeited. There is no cash buy-back for unused leave days." },
    ],
  },
  3: {
    title: "Code of Conduct",
    sections: [
      { heading: "1. Professional Behaviour", body: "Employees are expected to maintain the highest standards of professional conduct. This includes punctuality, respectful communication, appropriate dress code, and adherence to company policies. Representing Portland Gas externally requires prior approval." },
      { heading: "2. Conflict of Interest",   body: "Employees must avoid situations where personal interests conflict with the company's interests. Any potential conflicts must be disclosed to HR immediately. Outside employment or business activities require written approval from the Head of Department." },
      { heading: "3. Confidentiality",        body: "All proprietary information, trade secrets, client data, and internal communications are strictly confidential. Unauthorized disclosure of company information — during or after employment — is grounds for disciplinary action and potential legal proceedings." },
    ],
  },
  4: {
    title: "Health & Safety Policy",
    sections: [
      { heading: "1. General Safety",       body: "Portland Gas is committed to providing a safe and healthy work environment for all employees, contractors, and visitors. All personnel must comply with safety regulations, wear required PPE, and report hazards immediately to the Safety Officer." },
      { heading: "2. Emergency Procedures", body: "Emergency assembly points are clearly marked at all facilities. Fire drills are conducted quarterly. All employees must familiarize themselves with evacuation routes and first aid locations. Emergency contact: Safety Hotline — 0800-SAFE-PG." },
      { heading: "3. Incident Reporting",   body: "All workplace incidents, injuries, near-misses, and unsafe conditions must be reported within 24 hours using the HSE Incident Report form. Failure to report incidents is a disciplinary offence. Investigations are conducted by the Safety Committee." },
    ],
  },
  5: {
    title: "Travel & Expense Policy",
    sections: [
      { heading: "1. Travel Authorization",      body: "All business travel must be pre-approved via a Travel Request Form submitted through the Finance portal. Domestic travel requires Line Manager approval. International travel requires additional approval from the Head of Department and Finance." },
      { heading: "2. Expense Claims",            body: "Employees may claim reimbursement for approved business expenses. Claims must be submitted within 14 days of the expense with original receipts. Per diem rates: Lagos — ₦15,000/day; Other cities — ₦12,000/day; International — determined per destination." },
      { heading: "3. Accommodation & Transport", body: "Hotel bookings should be made through the Admin department where possible. Maximum hotel rates: Lagos — ₦35,000/night; Other cities — ₦25,000/night. Local transport: official company vehicles or approved ride-hailing services. Personal car mileage: ₦80/km." },
    ],
  },
  6: {
    title: "Anti-Harassment Policy",
    sections: [
      { heading: "1. Policy Statement",          body: "Portland Gas has zero tolerance for harassment, bullying, or discrimination of any kind. This policy applies to all employees, contractors, and visitors across all company premises, events, and digital platforms." },
      { heading: "2. What Constitutes Harassment", body: "Harassment includes but is not limited to: unwelcome physical contact, verbal abuse, intimidation, offensive jokes or comments, sexual advances, cyberbullying, exclusion or isolation, and retaliation against those who report harassment." },
      { heading: "3. Reporting & Resolution",    body: "Reports can be made to your Line Manager, HR, or anonymously via the Ethics Hotline. All reports are investigated confidentially within 10 working days. Substantiated cases result in disciplinary action up to and including termination. Whistleblower protections apply." },
    ],
  },
};

export const SEED_PAYSLIPS: PaySlip[] = [
  // Joseph Chika - Jan to Jun 2026
  { id: "ps1-jc-jan", employee: "Joseph Chika",      empId: "PG-006", department: "Operations", period: "January 2026", basic: 850000, housing: 200000, transport: 100000, meal: 50000, paye: 125000, pension: 68000, nhf: 21250, loan: 0,     net: 985750  },
  { id: "ps1-jc-feb", employee: "Joseph Chika",      empId: "PG-006", department: "Operations", period: "February 2026", basic: 850000, housing: 200000, transport: 100000, meal: 50000, paye: 125000, pension: 68000, nhf: 21250, loan: 0,     net: 985750  },
  { id: "ps1-jc-mar", employee: "Joseph Chika",      empId: "PG-006", department: "Operations", period: "March 2026", basic: 850000, housing: 200000, transport: 100000, meal: 50000, paye: 125000, pension: 68000, nhf: 21250, loan: 0,     net: 985750  },
  { id: "ps1-jc-apr", employee: "Joseph Chika",      empId: "PG-006", department: "Operations", period: "April 2026", basic: 850000, housing: 200000, transport: 100000, meal: 50000, paye: 125000, pension: 68000, nhf: 21250, loan: 0,     net: 985750  },
  { id: "ps1-jc-may", employee: "Joseph Chika",      empId: "PG-006", department: "Operations", period: "May 2026", basic: 850000, housing: 200000, transport: 100000, meal: 50000, paye: 125000, pension: 68000, nhf: 21250, loan: 0,     net: 985750  },
  { id: "ps1-jc-jun", employee: "Joseph Chika",      empId: "PG-006", department: "Operations", period: "June 2026", basic: 850000, housing: 200000, transport: 100000, meal: 50000, paye: 125000, pension: 68000, nhf: 21250, loan: 0,     net: 985750  },
  // Other employees - April 2026 only
  { id: "ps2", employee: "Magdalene Edozie",  empId: "PG-001", department: "Legal",      period: "April 2026", basic: 650000, housing: 150000, transport: 80000,  meal: 40000, paye: 85000,  pension: 52000, nhf: 16250, loan: 30000, net: 736750  },
  { id: "ps3", employee: "Oluwaseun Sowemimo",empId: "PG-002", department: "Commercial", period: "April 2026", basic: 950000, housing: 250000, transport: 120000, meal: 60000, paye: 165000, pension: 76000, nhf: 23750, loan: 0,     net: 1115250 },
];

export const SEED_PAYROLL: PayrollRun[] = [
  { id: "pr1", ref: "PAY-202604-A1B2", period: "April 2026", runDate: "28 Apr 2026", totalGross: 3500000, totalDeductions: 662250, totalNet: 2837750, employees: 7, status: "approved",  preparedBy: "Adaeze Nwosu" },
  { id: "pr2", ref: "PAY-202603-C3D4", period: "March 2026", runDate: "28 Mar 2026", totalGross: 3500000, totalDeductions: 662250, totalNet: 2837750, employees: 7, status: "processed", preparedBy: "Adaeze Nwosu" },
  { id: "pr3", ref: "PAY-202605-E5F6", period: "May 2026",   runDate: "—",           totalGross: 0,       totalDeductions: 0,      totalNet: 0,       employees: 7, status: "draft",     preparedBy: "Adaeze Nwosu" },
];

// ── Leave Balance ─────────────────────────────────────────────────────────────

export const LEAVE_ENTITLEMENTS: Record<string, number> = {
  "Annual Leave":        21,
  "Sick Leave":          10,
  "Casual Leave":         5,
  "Maternity Leave":     90,
  "Paternity Leave":      7,
  "Compassionate Leave":  5,
  "Study Leave":         14,
};

export function calcLeaveBalance(
  employeeName: string,
  leaveType: string,
  year: number = new Date().getFullYear(),
): { entitlement: number; used: number; remaining: number } {
  const entitlement = LEAVE_ENTITLEMENTS[leaveType] ?? 0;
  const used = LEAVE_STORE
    .filter(
      (r) =>
        r.employee === employeeName &&
        r.type === leaveType &&
        r.status === "approved" &&
        new Date(r.startDate).getFullYear() === year,
    )
    .reduce((sum, r) => sum + r.days, 0);
  return { entitlement, used, remaining: Math.max(0, entitlement - used) };
}
