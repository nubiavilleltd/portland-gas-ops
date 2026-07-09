"use client";

import { useState } from "react";
import type { FAQItem, FAQCategoryLabel } from "../types/intranet.types";

const NOW = new Date().toISOString();
let nextId = 100;

// Category metadata (UI only — category is stored as a plain string in DB)
export const FAQ_CATEGORIES: { label: FAQCategoryLabel; iconName: string; color: string; bg: string }[] = [
  { label: "IT Support",  iconName: "Laptop",      color: "#1E40AF", bg: "#EFF6FF" },
  { label: "HR & Payroll",iconName: "Users",        color: "#7234BD", bg: "#F3EEFF" },
  { label: "HSE",         iconName: "ShieldCheck",  color: "#166534", bg: "#F0FDF4" },
  { label: "Procurement", iconName: "Briefcase",    color: "#C2410C", bg: "#FFF7ED" },
  { label: "General",     iconName: "Phone",        color: "#B45309", bg: "#FFFBEB" },
];

// Track category visibility (UI only — no DB column; could be added later as is_active)
const INITIAL_VISIBILITY: Record<FAQCategoryLabel, boolean> = {
  "IT Support": true,
  "HR & Payroll": true,
  "HSE": true,
  "Procurement": true,
  "General": true,
};

const INITIAL_FAQS: FAQItem[] = [
  // IT Support
  { id: 1,  question: "How do I reset my work password?",        answer: "Visit the IT Self-Service Portal at it.portlandgas.com and click 'Reset Password'. You will need your staff ID and registered mobile number. If you are locked out, call the IT Help Desk on ext. 1001.", category: "IT Support",   order_index: 0, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 2,  question: "How do I connect to the VPN?",            answer: "Download the Cisco AnyConnect client from the IT portal. Use your email address as your username and your network password. Contact IT if you need the server address or encounter connection issues.",       category: "IT Support",   order_index: 1, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 3,  question: "How do I request a new device?",          answer: "Raise a request via the Workflow Portal under IT Requests > Device Request. Your line manager must approve the request before it is processed by IT. Allow 5–7 working days for fulfilment.",               category: "IT Support",   order_index: 2, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 4,  question: "What do I do if my laptop won't start?",  answer: "First, try a hard reset by holding the power button for 10 seconds. If it still won't start, log a ticket on the IT portal or call ext. 1001. Do not attempt to repair the device yourself.",             category: "IT Support",   order_index: 3, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 5,  question: "How do I set up my work email on my phone?", answer: "Go to your phone's email settings and add a new account using your Portland Gas email and password. Use Microsoft Exchange or Outlook as the account type.",                                          category: "IT Support",   order_index: 4, is_published: true, created_at: NOW, updated_at: NOW },
  // HR & Payroll
  { id: 6,  question: "How do I apply for leave?",               answer: "Log in to the Workflow Portal and navigate to HR Management > Leave Requests. Select your leave type, dates, and add a note if required. Your line manager will receive a notification to approve or decline.", category: "HR & Payroll", order_index: 0, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 7,  question: "When is payroll processed?",              answer: "Payroll is processed on the last working day of each month. Your payslip will be available on the HR portal within two working days of payment.",                                                          category: "HR & Payroll", order_index: 1, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 8,  question: "How do I update my bank details?",        answer: "Submit a bank details change request via HR Management > My Profile in the Workflow Portal. You must attach a copy of your new bank statement or letter.",                                                  category: "HR & Payroll", order_index: 2, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 9,  question: "How do I check my leave balance?",        answer: "Your current leave balance is visible on your profile in the HR Management section of the Workflow Portal. It is updated in real time as leave requests are approved or declined.",                         category: "HR & Payroll", order_index: 3, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 10, question: "What is the process for a salary advance?", answer: "Salary advance requests are submitted via the Workflow Portal under HR > Salary Advance. Requests must be submitted at least 10 working days before the required date.",                                 category: "HR & Payroll", order_index: 4, is_published: true, created_at: NOW, updated_at: NOW },
  // HSE
  { id: 11, question: "Where do I find the HSE manual?",         answer: "The HSE manual is available on the intranet under Policies & Procedures. The current version is Rev. 4 (March 2026).",                                                                                    category: "HSE",          order_index: 0, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 12, question: "How do I report a near-miss or incident?",answer: "All near-misses must be reported within 24 hours. Use the HSE Incident Report form on the Workflow Portal or contact your supervisor immediately. For serious incidents, call ext. 1002.",               category: "HSE",          order_index: 1, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 13, question: "Who is my nearest first-aider?",          answer: "First-aider lists are posted on notice boards at all Portland Gas locations. You can also find the list for your location on the intranet under HSE > First Aid Contacts.",                               category: "HSE",          order_index: 2, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 14, question: "What PPE is required at CNG stations?",   answer: "Minimum PPE at CNG stations includes: safety boots, high-visibility vest, and safety glasses. Hard hats are required in all construction or maintenance zones.",                                           category: "HSE",          order_index: 3, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 15, question: "How do I access HSE training records?",   answer: "Your training history and certifications are in the Workflow Portal under HR Management > My Training.",                                                                                                   category: "HSE",          order_index: 4, is_published: true, created_at: NOW, updated_at: NOW },
  // Procurement
  { id: 16, question: "How do I raise a purchase request?",      answer: "Go to the Workflow Portal and navigate to Procurement > New Request. Fill in the required details including category, items, vendor (if applicable), and justification.",                                  category: "Procurement",  order_index: 0, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 17, question: "What is the vendor approval process?",    answer: "New vendors must be registered by the Procurement team before they can be used in a purchase request. Email vendor details to procurement@portlandgas.com. Approval typically takes 3–5 working days.",   category: "Procurement",  order_index: 1, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 18, question: "How do I track my purchase request status?", answer: "Log in to the Workflow Portal and go to Procurement > My Requests. You will see the current status of all your requests.",                                                                             category: "Procurement",  order_index: 2, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 19, question: "What is the purchase limit requiring MD approval?", answer: "Purchase requests above ₦5,000,000 require MD approval in addition to the standard line manager and procurement sign-off.",                                                                     category: "Procurement",  order_index: 3, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 20, question: "How long does procurement approval take?",answer: "Standard procurement requests are processed within 5–10 working days. Urgent requests can be flagged at submission.",                                                                                     category: "Procurement",  order_index: 4, is_published: true, created_at: NOW, updated_at: NOW },
  // General
  { id: 21, question: "How do I book a meeting room?",           answer: "Meeting rooms can be booked via the Workflow Portal under Admin > Room Booking. Select your preferred location, date, time, and room size.",                                                               category: "General",      order_index: 0, is_published: true, created_at: NOW, updated_at: NOW },
  { id: 22, question: "Who do I contact for building access issues?", answer: "For access card issues, contact the Admin team at admin@portlandgas.com or call ext. 1003. After-hours emergencies should be directed to the security desk on ext. 1000.",                          category: "General",      order_index: 1, is_published: true, created_at: NOW, updated_at: NOW },
];

export function useIntranetFAQs() {
  const [faqs, setFaqs] = useState<FAQItem[]>(INITIAL_FAQS);
  const [visibility, setVisibility] = useState<Record<FAQCategoryLabel, boolean>>(INITIAL_VISIBILITY);

  function faqsByCategory(cat: FAQCategoryLabel) {
    return faqs.filter((f) => f.category === cat).sort((a, b) => a.order_index - b.order_index);
  }

  function toggleCategoryVisibility(cat: FAQCategoryLabel) {
    setVisibility((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function addFaq(faq: Omit<FAQItem, "id" | "created_at" | "updated_at">) {
    const id = nextId++;
    const ts = new Date().toISOString();
    setFaqs((prev) => [...prev, { ...faq, id, created_at: ts, updated_at: ts }]);
  }

  function updateFaq(id: number, patch: Partial<Omit<FAQItem, "id" | "created_at">>) {
    setFaqs((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch, updated_at: new Date().toISOString() } : f))
    );
  }

  function removeFaq(id: number) {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  }

  function moveFaq(id: number, direction: "up" | "down") {
    setFaqs((prev) => {
      const item = prev.find((f) => f.id === id);
      if (!item) return prev;
      const siblings = prev
        .filter((f) => f.category === item.category)
        .sort((a, b) => a.order_index - b.order_index);
      const idx = siblings.findIndex((f) => f.id === id);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return prev;
      const swapItem = siblings[swapIdx];
      return prev.map((f) => {
        if (f.id === id) return { ...f, order_index: swapItem.order_index };
        if (f.id === swapItem.id) return { ...f, order_index: item.order_index };
        return f;
      });
    });
  }

  return { faqs, faqsByCategory, visibility, toggleCategoryVisibility, addFaq, updateFaq, removeFaq, moveFaq };
}
