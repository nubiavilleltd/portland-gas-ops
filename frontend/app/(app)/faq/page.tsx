"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Laptop, Users, ShieldCheck, Briefcase, Phone } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import { cn } from "@/lib/utils";

interface FAQ { q: string; a: string; }
interface Category { icon: React.ElementType; label: string; color: string; bg: string; faqs: FAQ[]; }

const CATEGORIES: Category[] = [
  {
    icon: Laptop, label: "IT Support", color: "#1E40AF", bg: "#EFF6FF",
    faqs: [
      { q: "How do I reset my work password?", a: "Visit the IT Self-Service Portal at it.portlandgas.com and click 'Reset Password'. You will need your staff ID and registered mobile number. If you are locked out, call the IT Help Desk on ext. 1001." },
      { q: "How do I connect to the VPN?", a: "Download the Cisco AnyConnect client from the IT portal. Use your email address as your username and your network password. Contact IT if you need the server address or encounter connection issues." },
      { q: "How do I request a new device?", a: "Raise a request via the Workflow Portal under IT Requests > Device Request. Your operations manager must approve the request before it is processed by IT. Allow 5–7 working days for fulfilment." },
      { q: "What do I do if my laptop won't start?", a: "First, try a hard reset by holding the power button for 10 seconds. If it still won't start, log a ticket on the IT portal or call ext. 1001. Do not attempt to repair the device yourself." },
      { q: "How do I set up my work email on my phone?", a: "Go to your phone's email settings and add a new account using your Portland Gas email and password. Use Microsoft Exchange or Outlook as the account type. If it fails, contact IT for the server configuration details." },
    ],
  },
  {
    icon: Users, label: "HR & Payroll", color: "#7234BD", bg: "#F3EEFF",
    faqs: [
      { q: "How do I apply for leave?", a: "Log in to the Workflow Portal and navigate to HR Management > Leave Requests. Select your leave type, dates, and add a note if required. Your operations manager will receive a notification to approve or decline." },
      { q: "When is payroll processed?", a: "Payroll is processed on the last working day of each month. Your payslip will be available on the HR portal within two working days of payment. Contact payroll@portlandgas.com for payslip queries." },
      { q: "How do I update my bank details?", a: "Submit a bank details change request via HR Management > My Profile in the Workflow Portal. You must attach a copy of your new bank statement or letter. Changes take effect from the following payroll cycle." },
      { q: "How do I check my leave balance?", a: "Your current leave balance is visible on your profile in the HR Management section of the Workflow Portal. It is updated in real time as leave requests are approved or declined." },
      { q: "What is the process for a salary advance?", a: "Salary advance requests are submitted via the Workflow Portal under HR > Salary Advance. Requests must be submitted at least 10 working days before the required date and are subject to operations manager and HR approval." },
    ],
  },
  {
    icon: ShieldCheck, label: "HSE", color: "#166534", bg: "#F0FDF4",
    faqs: [
      { q: "Where do I find the HSE manual?", a: "The HSE manual is available on the intranet under Policies & Procedures. You can also access it via the Workflow Portal > Document Repository > HSE. The current version is Rev. 4 (March 2026)." },
      { q: "How do I report a near-miss or incident?", a: "All near-misses must be reported within 24 hours. Use the HSE Incident Report form on the Workflow Portal or contact your supervisor immediately. For serious incidents, call the HSE hotline on ext. 1002." },
      { q: "Who is my nearest first-aider?", a: "First-aider lists are posted on notice boards at all Portland Gas locations. You can also find the list for your location on the intranet under HSE > First Aid Contacts." },
      { q: "What PPE is required at CNG stations?", a: "Minimum PPE at CNG stations includes: safety boots, high-visibility vest, and safety glasses. Hard hats are required in all construction or maintenance zones. Check the HSE manual for the full site-specific requirements." },
      { q: "How do I access HSE training records?", a: "Your training history and certifications are in the Workflow Portal under HR Management > My Training. For certificates not yet uploaded, contact hse@portlandgas.com." },
    ],
  },
  {
    icon: Briefcase, label: "Procurement", color: "#C2410C", bg: "#FFF7ED",
    faqs: [
      { q: "How do I raise a purchase request?", a: "Go to the Workflow Portal and navigate to Procurement > New Request. Fill in the required details including category, items, vendor (if applicable), and justification. Your operations manager will be notified to approve." },
      { q: "What is the vendor approval process?", a: "New vendors must be registered by the Procurement team before they can be used in a purchase request. Email vendor details to procurement@portlandgas.com. Approval typically takes 3–5 working days." },
      { q: "How do I track my purchase request status?", a: "Log in to the Workflow Portal and go to Procurement > My Requests. You will see the current status of all your requests, including who the next approver is." },
      { q: "What is the purchase limit that requires MD approval?", a: "Purchase requests above ₦5,000,000 require MD approval in addition to the standard operations manager and procurement sign-off. This threshold applies per request, not per item." },
      { q: "How long does procurement approval take?", a: "Standard procurement requests are processed within 5–10 working days, depending on the approval chain. Urgent requests can be flagged at submission — please include a justification for the urgency." },
    ],
  },
  {
    icon: Phone, label: "General", color: "#B45309", bg: "#FFFBEB",
    faqs: [
      { q: "Who do I contact for building access issues?", a: "Contact the Admin & Facilities team at facilities@portlandgas.com or call ext. 1003. For after-hours emergencies, call the security desk at the front of the building." },
      { q: "How do I book a meeting room?", a: "Meeting rooms can be booked via the Workflow Portal under Admin > Room Booking. Select your location, room, date, and time. You will receive a confirmation email once the booking is confirmed." },
      { q: "Where can I find the company org chart?", a: "The current organisational chart is available on the intranet under About Portland Gas > Our People. It is updated quarterly by the HR team." },
      { q: "How do I submit a suggestion or feedback?", a: "Use the feedback form at the bottom of the intranet home page, or email feedback@portlandgas.com. Anonymous submissions are welcome." },
      { q: "What is the dress code policy?", a: "Smart casual is the standard for office-based staff. Field staff must adhere to HSE-approved workwear at all times. The full dress code policy is in the HR Policies & Procedures section of the intranet." },
    ],
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-[#7234BD] transition-colors group"
      >
        <span className={cn("text-sm font-medium leading-snug", open ? "text-[#7234BD]" : "text-[#1C043B]")}>
          {faq.q}
        </span>
        <ChevronDown
          size={15}
          className={cn("text-gray-300 shrink-0 transition-transform duration-200 group-hover:text-[#7234BD]", open && "rotate-180 text-[#7234BD]")}
        />
      </button>
      {open && (
        <div className="pb-4 pr-6">
          <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visible = activeCategory
    ? CATEGORIES.filter((c) => c.label === activeCategory)
    : CATEGORIES;

  return (
    <IntranetLayout>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-[#1C043B] pt-12 pb-8 px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-[#FFBC00] text-xs font-bold uppercase tracking-widest mb-2">Portland Gas Intranet</p>
          <h1 className="text-3xl font-extrabold text-white mb-1" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
            Frequently Asked Questions
          </h1>
          <p className="text-white/50 text-sm">IT, HR, HSE, Procurement and more — all in one place.</p>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold transition-all",
              !activeCategory ? "bg-[#7234BD] text-white" : "bg-white border border-gray-200 text-gray-500 hover:text-[#7234BD] hover:border-[#7234BD]/30"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(activeCategory === cat.label ? null : cat.label)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                activeCategory === cat.label
                  ? "bg-[#7234BD] text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:text-[#7234BD] hover:border-[#7234BD]/30"
              )}
            >
              <cat.icon size={13} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Two-column FAQ grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visible.map((cat) => (
            <div key={cat.label} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg }}>
                  <cat.icon size={16} style={{ color: cat.color }} />
                </div>
                <p className="text-sm font-bold text-[#1C043B]">{cat.label}</p>
                <span className="ml-auto text-xs text-gray-400">{cat.faqs.length} questions</span>
              </div>

              {/* FAQs */}
              <div className="px-6">
                {cat.faqs.map((faq) => (
                  <FAQItem key={faq.q} faq={faq} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-2xl bg-[#F3EEFF] border border-[#7234BD]/15 px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-[#7234BD] flex items-center justify-center shrink-0">
              <HelpCircle size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1C043B]">Can&apos;t find your answer?</p>
              <p className="text-xs text-gray-500 mt-0.5">Reach out to the relevant team and we&apos;ll help you out.</p>
            </div>
          </div>
          <a
            href="mailto:support@portlandgas.com"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7234BD] text-white text-sm font-semibold hover:bg-[#5c2899] transition-colors"
          >
            Contact Support
          </a>
        </div>

      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-4">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
