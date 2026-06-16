"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Users,
  LayoutDashboard,
  FileText,
  Calendar,
  Cake,
  MapPin,
  ArrowRight,
  Mic2,
  Sparkles,
  Play,
  Star,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  X,
  User,
  FolderOpen,
  Receipt,
} from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import IntranetSearchBar from "@/components/ui/IntranetSearchBar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

// ── Config ───────────────────────────────────────────────────────────────────
const PG = "https://portlandgasltd.com/wp-content/uploads/2026/03";
const AV = "https://i.pravatar.cc/150";

// ── Data ─────────────────────────────────────────────────────────────────────
const LEADERSHIP_MESSAGES = [
  {
    id: 1,
    from: "Adeola Ogunleye",
    role: "Managing Director",
    dept: "MD's Office",
    date: "10 Jun 2026",
    avatar: `${AV}?img=68`,
    bgImg: `${PG}/Portland-gas-29-scaled-1.png`,
    message: "As we close Q2 and look ahead to an ambitious second half of 2026, I want to personally thank every one of you. The commissioning of our 14th CNG station is a testament to what this team achieves together. Our pipeline expansion is on schedule, our safety record remains strong, and our culture is one I am proud of every single day.",
  },
  {
    id: 2,
    from: "Chidi Okonkwo",
    role: "Chief Executive Officer",
    dept: "CEO's Office",
    date: "5 Jun 2026",
    avatar: `${AV}?img=52`,
    bgImg: `${PG}/Portland-gas-46-1.png`,
    message: "Portland Gas is at an inflection point. The investments we are making today in infrastructure, people, and technology will define our next decade. I am proud to lead an organisation with this level of dedication. As we approach the second half of the year, let us maintain the momentum and continue to set the standard for clean energy in Nigeria.",
  },
  {
    id: 3,
    from: "Amaka Eze",
    role: "Chief Operating Officer",
    dept: "Operations",
    date: "2 Jun 2026",
    avatar: `${AV}?img=45`,
    bgImg: `${PG}/CNG-bus-fleet.jpg`,
    message: "Operational excellence is not a destination — it is a daily commitment. Our teams in the field continue to deliver safely and on time, and that does not happen by accident. It happens because each of you shows up prepared, trained, and focused. Thank you for holding the standard.",
  },
];

const NEWS = [
  { id: 1, category: "Company News",   badge: "bg-[#7234BD] text-white",        title: "Portland Gas Commissions New CNG Refuelling Station in Lekki",       excerpt: "The newly commissioned station marks our 14th fuelling point in Lagos, expanding access to clean energy for fleet operators and private vehicle owners.", date: "9 Jun 2026",  author: "Corporate Communications",     img: `${PG}/Portland-gas-46-1.png` },
  { id: 2, category: "Announcement",   badge: "bg-[#FFBC00] text-[#1C043B]",    title: "Q2 2026 Town Hall — All Staff Meeting Thursday 12 June",              excerpt: "The MD will address Q2 performance and strategic priorities for H2 2026, then open the floor to questions. Attendance is mandatory for all staff.",       date: "8 Jun 2026",  author: "MD's Office",                  img: `${PG}/NASENI-PORTLAND-GAS-LAUNCH-4-scaled-1.jpg` },
  { id: 3, category: "Policy Update",  badge: "bg-white/90 text-[#1C043B]",     title: "Updated Remote Work & Flexible Hours Policy Effective 1 July",       excerpt: "HR has published the revised hybrid work policy. All staff must read and acknowledge the new policy before end of June 2026.",                          date: "6 Jun 2026",  author: "Human Resources",              img: `${PG}/Portland-gas-18.png` },
  { id: 4, category: "Project Update", badge: "bg-[#7234BD] text-white",        title: "Phase 2 of Sagamu–Ibadan LNG Pipeline Now Underway",                 excerpt: "Engineering teams have mobilised to site as the second phase of the landmark pipeline project begins. Completion is targeted for Q4 2026.",              date: "4 Jun 2026",  author: "Projects & Engineering",       img: `${PG}/CNG-bus-fleet.jpg` },
  { id: 5, category: "Safety",         badge: "bg-red-500 text-white",          title: "Mandatory HSE Refresher Training — All Field Staff by 30 June",      excerpt: "HSE has scheduled refresher sessions across all field locations. Supervisors must ensure 100% participation before the end-of-month deadline.",          date: "3 Jun 2026",  author: "Health, Safety & Environment", img: `${PG}/Portland-gas-23.png` },
  { id: 6, category: "Events",         badge: "bg-[#FFBC00] text-[#1C043B]",   title: "Portland Gas Annual Family Fun Day — Saturday 28 June",              excerpt: "Join us for a day of fun, food, and fellowship. Venue: Landmark Event Centre, Victoria Island. Registration closes 20 June — don't miss out.",          date: "2 Jun 2026",  author: "Admin & Corporate Services",   img: `${PG}/KL7V2Q3.webp` },
];

const BIRTHDAYS = [
  { id: 1, name: "Chinyere Okafor",  dept: "Supply Chain", date: "Today",    avatar: `${AV}?img=44` },
  { id: 2, name: "Emeka Adeyemi",    dept: "Engineering",  date: "Tomorrow", avatar: `${AV}?img=12` },
  { id: 3, name: "Fatima Al-Hassan", dept: "Finance",      date: "Wed 11",   avatar: `${AV}?img=32` },
  { id: 4, name: "Tunde Babangida",  dept: "HSE",          date: "Fri 13",   avatar: `${AV}?img=15` },
  { id: 5, name: "Ngozi Eze",        dept: "HR",           date: "Sat 14",   avatar: `${AV}?img=47` },
];

const EVENTS = [
  { id: 1, day: 12, month: "JUN", type: "Town Hall", title: "Q2 All-Staff Town Hall — MD Briefing",        location: "Head Office, Boardroom A",     color: "#7234BD" },
  { id: 2, day: 18, month: "JUN", type: "Training",  title: "HSE Field Safety Refresher — Lagos Stations", location: "Portland Gas Training Centre", color: "#166534" },
  { id: 3, day: 20, month: "JUN", type: "Deadline",  title: "Q2 Performance Appraisal Submissions Due",    location: "HR Portal (online)",           color: "#C2410C" },
  { id: 4, day: 25, month: "JUN", type: "Workshop",  title: "Fleet Conversion Technology Symposium",       location: "Eko Hotel Convention Centre",  color: "#1E40AF" },
  { id: 5, day: 28, month: "JUN", type: "Social",    title: "Annual Family Fun Day 2026",                  location: "Landmark Event Centre, VI",    color: "#B45309" },
];

const QUICK_LINKS = [
  { icon: LayoutDashboard, label: "Workflow Portal",       href: "/home",                      bg: "#1C043B", fg: "#FFFFFF" },
  { icon: User,            label: "My Profile",            href: "/hr-management/my-profile",  bg: "#F3EEFF", fg: "#7234BD" },
  { icon: Receipt,         label: "My Payslips",           href: "/hr-management/my-payslips", bg: "#F0FDF4", fg: "#166534" },
  { icon: FolderOpen,      label: "Document Repository",   href: "#",                          bg: "#EFF6FF", fg: "#1E40AF" },
  { icon: Users,           label: "Employee Directory",    href: "#",                          bg: "#FFFBEB", fg: "#B45309" },
];


const EMPLOYEE_OF_MONTH = {
  name: "Adaeze Nwankwo",
  role: "Procurement Manager",
  dept: "Supply Chain",
  month: "June 2026",
  message: "Adaeze led our vendor rationalisation initiative, cutting procurement cycle time by 34% in Q2. Her process discipline and mentorship of junior colleagues embodies the Portland Gas standard.",
  avatar: `${AV}?img=49`,
};

const SPOTLIGHTS = [
  {
    id: 1,
    name: "Obinna Eze",
    role: "Senior Field Engineer",
    dept: "Operations",
    highlight: "Led the safe commissioning of three new CNG stations ahead of schedule in Q1.",
    avatar: `${AV}?img=33`,
    tag: "Safety Champion",
    tagColor: "#166534",
    tagBg: "#F0FDF4",
  },
  {
    id: 2,
    name: "Halima Musa",
    role: "Finance Analyst",
    dept: "Finance & Strategy",
    highlight: "Redesigned the monthly close process, reducing reporting time from 5 days to 2.",
    avatar: `${AV}?img=25`,
    tag: "Process Innovator",
    tagColor: "#1E40AF",
    tagBg: "#EFF6FF",
  },
  {
    id: 3,
    name: "Tobi Adeyinka",
    role: "Fleet Coordinator",
    dept: "Logistics",
    highlight: "Achieved 98% on-time delivery rate for Q2, the highest in the department's history.",
    avatar: `${AV}?img=60`,
    tag: "Top Performer",
    tagColor: "#7234BD",
    tagBg: "#F3EEFF",
  },
];

const TABS = ["All", "News", "Announcements", "Events", "Policies"];

// Calendar helpers
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Su","Mo","Tu","We","Th","Fr","Sa"];
function buildCalendar(y: number, m: number) {
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

function greet(name?: string) {
  const h = new Date().getHours();
  const t = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${t}${name ? `, ${name}` : ""}`;
}
function todayStr() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function IntranetHomePage() {
  const { user } = useCurrentUser();
  const [tab,         setTab]         = useState("All");
  const [q,           setQ]           = useState("");
  const [slide,       setSlide]       = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mounted,     setMounted]     = useState(false);
  useEffect(() => setMounted(true), []);

  // Use a stable date on the server; swap to real date after hydration
  const calNow    = mounted ? new Date() : new Date("2026-06-10");
  const firstName = user?.name?.split(" ")[0] ?? "Kemi";

  // Carousel auto-advance
  const next = useCallback(() => setSlide((s) => (s + 1) % LEADERSHIP_MESSAGES.length), []);
  const prev = () => setSlide((s) => (s - 1 + LEADERSHIP_MESSAGES.length) % LEADERSHIP_MESSAGES.length);
  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  const tabMap: Record<string, string[]> = {
    News: ["Company News", "Project Update"],
    Announcements: ["Announcement"],
    Events: ["Events"],
    Policies: ["Policy Update", "Safety"],
  };
  const feed = NEWS.filter((n) => {
    if (tab !== "All" && !tabMap[tab]?.includes(n.category)) return false;
    if (q) return n.title.toLowerCase().includes(q.toLowerCase()) || n.excerpt.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  const calYear   = calNow.getFullYear();
  const calMonth  = calNow.getMonth();
  const calCells  = buildCalendar(calYear, calMonth);
  const todayNum  = calNow.getDate();
  const eventDays = new Set(EVENTS.map((e) => e.day));

  // Filtered events for the list panel
  const visibleEvents = selectedDay
    ? EVENTS.filter((e) => e.day === selectedDay)
    : EVENTS;

  const msg = LEADERSHIP_MESSAGES[slide];

  return (
    <IntranetLayout>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: 460 }}>
        <Image
          src={`${PG}/13TH-OF-AUGUST-52-scaled-1.jpg`}
          alt="Portland Gas operations"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C043B]/80 via-[#1C043B]/70 to-[#1C043B]/85" />

        <div className="relative w-full max-w-2xl mx-auto px-4 text-center py-14">
          <p className="text-[#FFBC00] text-xs font-bold uppercase tracking-widest mb-3" suppressHydrationWarning>
            {mounted ? todayStr() : ""}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-2" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-white/55 text-base mb-8">The Clean Energy Standard — stay informed, stay connected.</p>

          {/* Search bar */}
          <IntranetSearchBar
            value={q}
            onChange={setQ}
            placeholder="Search news, events, policies, people…"
            className="max-w-xl mx-auto"
          />
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10 space-y-12">

        {/* ── 1. Quick Links ───────────────────────────────────────────── */}
        <section className="animate-fade-up">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#F3EEFF] flex items-center justify-center">
              <LayoutDashboard size={15} className="text-[#7234BD]" />
            </div>
            <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              Quick Links
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {QUICK_LINKS.map(({ icon: Icon, label, href, bg, fg }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl text-xs font-semibold text-center transition-all duration-150 hover:scale-105 hover:shadow-md btn-press"
                style={{ backgroundColor: bg, color: fg }}
              >
                <Icon size={18} />
                <span className="leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 2. Leadership Message Carousel ───────────────────────────── */}
        <section className="animate-fade-up animate-fade-up-1">
          <div className="relative rounded-3xl overflow-hidden" style={{ minHeight: 280 }}>
            <Image
              src={msg.bgImg}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C043B]/95 via-[#1C043B]/80 to-[#1C043B]/40" />

            <div
              className="absolute top-0 right-1/3 text-white/5 font-serif leading-none pointer-events-none select-none hidden lg:block"
              style={{ fontSize: "22rem", lineHeight: 0.8 }}
            >
              &ldquo;
            </div>

            <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 px-8 sm:px-12 py-10">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[#FFBC00] text-[10px] font-extrabold uppercase tracking-[0.15em]">{msg.dept}</span>
                  <span className="text-white/20 text-xs">·</span>
                  <span className="text-white/40 text-[10px]">{msg.date}</span>
                </div>
                <p className="text-white/90 text-lg sm:text-xl leading-relaxed font-medium max-w-xl" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  &ldquo;{msg.message}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <Image src={msg.avatar} alt={msg.from} width={44} height={44} className="rounded-full ring-2 ring-white/20 shrink-0" />
                  <div>
                    <p className="text-white font-bold text-sm">{msg.from}</p>
                    <p className="text-white/50 text-xs">{msg.role}</p>
                  </div>
                </div>
              </div>

              <div className="flex lg:flex-col items-center gap-3 shrink-0">
                <button onClick={prev} className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all btn-press">
                  <ChevronLeft size={16} />
                </button>
                <div className="flex lg:flex-col gap-1.5">
                  {LEADERSHIP_MESSAGES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlide(i)}
                      className={cn(
                        "rounded-full transition-all duration-300 btn-press",
                        i === slide ? "bg-[#FFBC00] w-6 h-2 lg:w-2 lg:h-6" : "bg-white/30 w-2 h-2"
                      )}
                    />
                  ))}
                </div>
                <button onClick={next} className="h-10 w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all btn-press">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Latest News ───────────────────────────────────────────── */}
        <section className="animate-fade-up animate-fade-up-2">
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-0.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 btn-press",
                  tab === t ? "bg-[#7234BD] text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:text-[#7234BD] hover:border-[#7234BD]/30"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              {tab === "All" ? "Latest News" : tab}
            </h2>
            <Link href="/news" className="flex items-center gap-1 text-sm text-[#7234BD] font-semibold hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {feed.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Search size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No results for &ldquo;{q}&rdquo;</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {feed.slice(0, 6).map((item, i) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className={cn(
                    "group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer animate-fade-up",
                    `animate-fade-up-${Math.min(i + 1, 5)}`
                  )}
                >
                  <div className="relative h-44 bg-gray-100 overflow-hidden">
                    <Image
                      src={item.img}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className={`absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${item.badge}`}>
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[#1C043B] text-sm leading-snug mb-2 group-hover:text-[#7234BD] transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-4">{item.excerpt}</p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{item.author}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── 4. Birthdays ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 animate-fade-up animate-fade-up-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Cake size={16} className="text-[#FFBC00]" />
              </div>
              <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>Birthdays</h2>
            </div>
            <span className="text-[11px] text-[#7234BD] font-semibold bg-[#F3EEFF] px-2.5 py-1 rounded-full">This week</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
            {BIRTHDAYS.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
                <Image src={b.avatar} alt={b.name} width={40} height={40} className="rounded-full object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1C043B] truncate">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.dept}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0",
                  b.date === "Today"    ? "bg-[#FFBC00] text-[#1C043B]" :
                  b.date === "Tomorrow" ? "bg-[#F3EEFF] text-[#7234BD]" :
                                         "bg-gray-100 text-gray-500"
                )}>
                  {b.date}
                </span>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full text-[11px] text-[#7234BD] font-semibold py-2 rounded-xl hover:bg-[#F3EEFF] transition-colors btn-press">
            View all upcoming →
          </button>
        </section>

        {/* ── 5. Calendar + Events (merged) ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 animate-fade-up animate-fade-up-4">

          {/* Calendar */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#F3EEFF] flex items-center justify-center">
                  <Calendar size={16} className="text-[#7234BD]" />
                </div>
                <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </h2>
              </div>
              {selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#7234BD] font-semibold transition-colors"
                >
                  <X size={11} /> Clear
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="grid grid-cols-7 mb-2">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calCells.map((day, i) => {
                  if (!day) return <div key={`e-${i}`} />;
                  const isToday    = day === todayNum;
                  const hasEvent   = eventDays.has(day);
                  const isSelected = day === selectedDay;
                  return (
                    <button
                      key={day}
                      onClick={() => hasEvent ? setSelectedDay(isSelected ? null : day) : setSelectedDay(null)}
                      className={cn(
                        "relative h-8 w-full flex items-center justify-center text-xs rounded-lg transition-all duration-150 btn-press",
                        isToday    ? "bg-[#7234BD] text-white font-bold shadow-sm" :
                        isSelected ? "bg-[#7234BD]/15 text-[#7234BD] font-bold ring-1 ring-[#7234BD]/30" :
                        hasEvent   ? "text-[#7234BD] font-bold hover:bg-[#F3EEFF]" :
                                     "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {day}
                      {hasEvent && !isToday && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#FFBC00]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-1.5">
                {EVENTS.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedDay(selectedDay === ev.day ? null : ev.day)}
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] text-gray-500 px-2.5 py-1 rounded-full transition-all btn-press",
                      selectedDay === ev.day ? "bg-[#7234BD]/10 text-[#7234BD] font-semibold" : "bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                    <span>{ev.day} {ev.month} · {ev.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Events List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#F3EEFF] flex items-center justify-center">
                  <MapPin size={15} className="text-[#7234BD]" />
                </div>
                <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  {selectedDay ? `Events on ${selectedDay} ${MONTH_NAMES[calMonth].slice(0, 3)}` : "Upcoming Events"}
                </h2>
              </div>
              <Link href="/events" className="flex items-center gap-1 text-xs text-[#7234BD] font-semibold hover:gap-1.5 transition-all">
                View all <ChevronRight size={12} />
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
              {visibleEvents.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Calendar size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No events on this day</p>
                </div>
              ) : (
                visibleEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/events/${ev.id}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div
                      className="rounded-xl px-2.5 py-2 flex flex-col items-center min-w-[48px] shrink-0"
                      style={{ backgroundColor: ev.color }}
                    >
                      <span className="text-white text-sm font-extrabold leading-none">{ev.day}</span>
                      <span className="text-white/75 text-[9px] font-bold uppercase mt-0.5">{ev.month}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: ev.color }}>{ev.type}</p>
                      <p className="text-sm font-semibold text-[#1C043B] group-hover:text-[#7234BD] transition-colors leading-snug">{ev.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={9} className="text-gray-400 shrink-0" />
                        <p className="text-[11px] text-gray-400 truncate">{ev.location}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-[#7234BD] transition-colors shrink-0 mt-1" />
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ── 6. Employee of the Month + Spotlight ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 animate-fade-up animate-fade-up-5">

          {/* Employee of the Month */}
          <section>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star size={15} className="text-[#FFBC00] fill-[#FFBC00]" />
              </div>
              <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                Employee of the Month
              </h2>
            </div>

            <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: 340 }}>
              <Image src={`${PG}/Portland-gas-29-scaled-1.png`} alt="" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C043B] via-[#1C043B]/80 to-[#1C043B]/50" />
              <div className="relative flex flex-col items-center text-center p-7 h-full" style={{ minHeight: 340 }}>
                <div className="relative mt-2 mb-4">
                  <Image
                    src={EMPLOYEE_OF_MONTH.avatar}
                    alt={EMPLOYEE_OF_MONTH.name}
                    width={80}
                    height={80}
                    className="rounded-2xl ring-4 ring-[#FFBC00]/50 shadow-xl object-cover"
                  />
                  <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-[#FFBC00] flex items-center justify-center shadow">
                    <Sparkles size={11} className="text-[#1C043B]" />
                  </div>
                </div>
                <span className="text-[#FFBC00] text-[10px] font-extrabold uppercase tracking-widest mb-2">
                  {EMPLOYEE_OF_MONTH.month}
                </span>
                <h3 className="text-xl font-extrabold text-white leading-tight mb-0.5" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  {EMPLOYEE_OF_MONTH.name}
                </h3>
                <p className="text-white/50 text-xs mb-0.5">{EMPLOYEE_OF_MONTH.role}</p>
                <p className="text-white/35 text-[11px] mb-4">{EMPLOYEE_OF_MONTH.dept}</p>
                <p className="text-white/70 text-xs leading-relaxed line-clamp-3 mb-5">
                  &ldquo;{EMPLOYEE_OF_MONTH.message}&rdquo;
                </p>
                <button className="mt-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFBC00] text-[#1C043B] text-xs font-bold hover:bg-amber-300 transition-colors btn-press shadow-lg">
                  <Users size={12} /> View Profile
                </button>
              </div>
            </div>
          </section>

          {/* Employee Spotlight */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#F3EEFF] flex items-center justify-center">
                  <Sparkles size={15} className="text-[#7234BD]" />
                </div>
                <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  Employee Spotlight
                </h2>
              </div>
              <button className="flex items-center gap-1 text-xs text-[#7234BD] font-semibold hover:gap-1.5 transition-all">
                View all <ChevronRight size={12} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-[calc(100%-44px)]">
              {SPOTLIGHTS.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                >
                  <Image
                    src={s.avatar}
                    alt={s.name}
                    width={60}
                    height={60}
                    className="rounded-2xl object-cover shadow-md mb-3"
                  />
                  <span
                    className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3"
                    style={{ backgroundColor: s.tagBg, color: s.tagColor }}
                  >
                    {s.tag}
                  </span>
                  <h3 className="text-sm font-bold text-[#1C043B] mb-0.5" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                    {s.name}
                  </h3>
                  <p className="text-xs text-gray-400 mb-1">{s.role}</p>
                  <p className="text-[11px] text-[#7234BD] font-semibold mb-3">{s.dept}</p>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{s.highlight}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── 7. FAQ CTA ───────────────────────────────────────────────── */}
        <section className="animate-fade-up">
          <div className="bg-white rounded-2xl border border-gray-100 px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-[#F3EEFF] flex items-center justify-center shrink-0">
                <HelpCircle size={22} className="text-[#7234BD]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1C043B]" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">IT support, HR, HSE, procurement — all in one place.</p>
              </div>
            </div>
            <Link
              href="/faq"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7234BD] text-white text-sm font-semibold hover:bg-[#5c2899] transition-colors btn-press"
            >
              Browse FAQs <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* ── 8. Podcast + Footer CTA ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-up">

          {/* Podcast */}
          <section className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[220px]">
            <Image src={`${PG}/Portland-gas-17-2-scaled-1.png`} alt="Podcast" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-[#1C043B]/80" />
            <div className="relative p-6 flex flex-col justify-between h-full min-h-[220px]">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-[#7234BD] flex items-center justify-center">
                    <Mic2 size={13} className="text-white" />
                  </div>
                  <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Portland Gas Podcast</span>
                </div>
                <h3 className="text-white text-base font-bold leading-snug mb-1.5" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                  &ldquo;Nigeria&apos;s Gas-to-Power Opportunity — EP. 12&rdquo;
                </h3>
                <p className="text-white/50 text-xs">The MD and Chief Engineer on CNG&apos;s expanding role. 38 min.</p>
              </div>
              <button className="mt-5 flex items-center gap-3 group self-start btn-press">
                <div className="h-11 w-11 rounded-full bg-[#FFBC00] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play size={15} className="text-[#1C043B] ml-0.5 fill-[#1C043B]" />
                </div>
                <span className="text-white/60 text-sm group-hover:text-white transition-colors">Play episode</span>
              </button>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="lg:col-span-3 relative rounded-2xl overflow-hidden text-center">
            <Image src={`${PG}/Portland-gas-40-1-1.png`} alt="" fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-[#1C043B]/85" />
            <div className="relative px-8 py-10 flex flex-col items-center justify-center h-full min-h-[220px]">
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-white/10 mb-4">
                <Mic2 size={18} className="text-[#FFBC00]" />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
                Your Voice Matters
              </h2>
              <p className="text-white/55 text-sm max-w-md mx-auto mb-6">
                Help us improve the Portland Gas intranet. Share feedback, suggest content, or report an issue.
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFBC00] text-[#1C043B] text-sm font-bold hover:bg-amber-300 transition-all duration-150 shadow-lg btn-press">
                Submit Feedback
              </button>
            </div>
          </section>
        </div>

        <div className="h-4" />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Image
            src="https://portlandgasltd.com/wp-content/uploads/2024/06/Portland-gas-42.png"
            alt="Portland Gas"
            width={100}
            height={26}
            className="h-6 w-auto opacity-50"
          />
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
          <p className="text-xs text-gray-400">The Clean Energy Standard</p>
        </div>
      </footer>

    </IntranetLayout>
  );
}
