"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Users,
  LayoutDashboard,
  Mic2,
  Play,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  X,
  User,
  FolderOpen,
  Receipt,
  MapPin,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import ActionModal from "@/components/ui/ActionModal";
import Avatar from "@/components/ui/Avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { useIntranetNewsPublished, useIntranetNewsCategories, useIntranetEventsPublished, useIntranetSpotlightPublished, useIntranetLeadershipPublished, usePodcastsPublished } from "@/lib/modules/intranet/queries";
import { useSubmitFeedback } from "@/lib/modules/intranet/mutations";
import { useWeekBirthdays, useMyEmployee } from "@/lib/modules/employees/hooks";
import { useSendBirthdayWishes } from "@/lib/modules/notifications/hooks";

type FeedbackCategory = "General" | "IT" | "HR" | "Suggestion" | "Complaint";
const FEEDBACK_CATEGORY_OPTIONS: { value: FeedbackCategory; label: string }[] = [
  { value: "General",    label: "General" },
  { value: "IT",         label: "IT Support" },
  { value: "HR",         label: "HR" },
  { value: "Suggestion", label: "Suggestion" },
  { value: "Complaint",  label: "Complaint" },
];

// ── Config ───────────────────────────────────────────────────────────────────
const HERO_BG = "/portland-hero.jpg";

// Tailwind-safe badge classes by color key — driven by category.color from DB
const COLOR_BADGE_CLASS: Record<string, string> = {
  purple: "bg-[#7234BD] text-white",
  yellow: "bg-[#FFBC00] text-[#1C043B]",
  gray:   "bg-gray-100 text-[#1C043B]",
  red:    "bg-red-100 text-red-700",
  blue:   "bg-blue-100 text-blue-700",
  green:  "bg-green-100 text-green-700",
  teal:   "bg-teal-100 text-teal-700",
  orange: "bg-orange-100 text-orange-700",
};

// EVENTS, EMPLOYEE_OF_MONTH, SPOTLIGHTS are now derived from the API — see component below

const QUICK_LINKS = [
  { icon: LayoutDashboard, label: "Workflow Portal",     href: "/home"                       },
  { icon: User,            label: "My Profile",          href: "/hr-management/my-profile"   },
  { icon: Receipt,         label: "My Payslips",         href: "/hr-management/my-payslips"  },
  { icon: FolderOpen,      label: "Document Repository", href: "#"                           },
  { icon: Users,           label: "Employee Directory",  href: "/people"                     },
];

// EOM and Spotlight are derived from API — see component below

// TABS now built dynamically from the database — see component

// ── Calendar helpers ──────────────────────────────────────────────────────────
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function buildCalendar(y: number, m: number) {
  const first = new Date(y, m, 1).getDay();
  const days  = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return cells;
}

function todayStr() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}


// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntranetHomePage() {
  const { user } = useCurrentUser();
  const toast = useToast();
  const [tab,                setTab]                = useState("All");
  const [q,                  setQ]                  = useState("");
  const [slide,              setSlide]              = useState(0);
  const [selectedDay,        setSelectedDay]        = useState<number | null>(null);
  const [mounted,            setMounted]            = useState(false);
  const [birthdayModalOpen,  setBirthdayModalOpen]  = useState(false);
  const [wishesSent,         setWishesSent]         = useState<Set<string>>(new Set());
  const [wishesLoading,      setWishesLoading]      = useState<Set<string>>(new Set());

  const { data: myEmployee } = useMyEmployee();
  const sendWishesMutation = useSendBirthdayWishes();
  const submitFeedbackMutation = useSubmitFeedback();

  // News — pulled from API, mapped to the shape the feed UI expects
  const { data: birthdays = [],     isLoading: birthdaysLoading }  = useWeekBirthdays();
  const { data: rawNews = [],       isLoading: newsLoading }       = useIntranetNewsPublished();
  const { data: categories = [],    isLoading: catsLoading }       = useIntranetNewsCategories();
  const { data: rawEvents = [],     isLoading: eventsLoading }     = useIntranetEventsPublished();
  const { data: rawSpotlight = [],  isLoading: spotlightLoading }  = useIntranetSpotlightPublished();
  const { data: rawLeadership = [], isLoading: leadershipLoading } = useIntranetLeadershipPublished();
  const { data: podcasts = [] }                                    = usePodcastsPublished();
  const featuredPodcast = podcasts.find((p) => p.is_featured) ?? podcasts[0] ?? null;

  const peopleLoading    = spotlightLoading;
  const leaderLoading    = leadershipLoading;
  const newsFeedLoading  = newsLoading || catsLoading;
  const calLoading       = eventsLoading;

  // Map backend events to the shape the calendar/events UI expects
  const EVENTS = rawEvents.map((ev) => {
    const d = new Date(ev.event_date + "T00:00:00");
    return {
      id:       ev.id,
      day:      d.getDate(),
      month:    d.toLocaleString("en-GB", { month: "short" }).toUpperCase(),
      monthNum: d.getMonth(),   // 0-indexed
      year:     d.getFullYear(),
      type:     ev.event_type,
      title:    ev.title,
      location: ev.location ?? ev.virtual_link ?? "Online",
      color:    ev.color,
      colorBg:  ev.color + "20",  // hex with 12.5% opacity for light bg tint
    };
  });

  // Employee of the Month — most recent published entry with category employee_of_month
  const eomEntry = rawSpotlight.find((s) => s.category === "employee_of_month") ?? null;
  const EMPLOYEE_OF_MONTH = eomEntry
    ? {
        employeeId: eomEntry.employee_id,
        name:    eomEntry.employee_name,
        role:    eomEntry.employee_role ?? "",
        dept:    eomEntry.employee_dept ?? "",
        month:   [null,"January","February","March","April","May","June","July","August","September","October","November","December"][eomEntry.month ?? 0] + " " + (eomEntry.year ?? new Date().getFullYear()),
        message: eomEntry.message,
        avatar:  eomEntry.avatar_url ?? null,
      }
    : null;

  // Spotlight cards — published non-EOM entries (max 3)
  const SPOTLIGHTS = rawSpotlight
    .filter((s) => s.category !== "employee_of_month")
    .slice(0, 3)
    .map((s) => ({
      id:       s.id,
      name:     s.employee_name,
      role:     s.employee_role ?? "",
      dept:     s.employee_dept ?? "",
      highlight: s.message,
      avatar:   s.avatar_url ?? null,
      tag:      s.tag ?? "",
      tagColor: s.tag_color ?? "#7234BD",
      tagBg:    s.tag_bg ?? "#F3EEFF",
    }));
  const TABS = ["All", ...categories.map((c) => c.name)];
  const colorByName = Object.fromEntries(categories.map((c) => [c.name, c.color]));
  const NEWS = rawNews.map((n) => ({
    id:          n.id,
    category:    n.category,
    badge:       COLOR_BADGE_CLASS[colorByName[n.category] ?? "gray"] ?? "bg-gray-100 text-[#1C043B]",
    title:       n.title,
    bodyHtml:    n.body,
    excerptText: n.body.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(),
    date:        n.published_at
      ? new Date(n.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "",
    author:      n.author_name,
    img:         n.cover_image_url ?? "",
  }));

  // Feedback modal state
  const [feedbackOpen,      setFeedbackOpen]      = useState(false);
  const [feedbackSubject,   setFeedbackSubject]   = useState("");
  const [feedbackMessage,   setFeedbackMessage]   = useState("");
  const [feedbackCategory,  setFeedbackCategory]  = useState<FeedbackCategory>("General");
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);
  const [feedbackErrors,    setFeedbackErrors]    = useState<Record<string, string>>({});
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  function openFeedback() {
    setFeedbackSubject("");
    setFeedbackMessage("");
    setFeedbackCategory("General");
    setFeedbackAnonymous(false);
    setFeedbackErrors({});
    setFeedbackOpen(true);
  }

  async function submitFeedback() {
    const errs: Record<string, string> = {};
    if (!feedbackSubject.trim()) errs.subject = "Subject is required";
    if (!feedbackMessage.trim()) errs.message = "Please enter your feedback";
    setFeedbackErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setFeedbackSubmitting(true);
    try {
      await submitFeedbackMutation.mutateAsync({
        category:     feedbackCategory,
        subject:      feedbackSubject,
        message:      feedbackMessage,
        is_anonymous: feedbackAnonymous,
      });
      setFeedbackOpen(false);
      toast.success("Feedback submitted. Thank you!");
    } catch {
      toast.error("Could not submit feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  // Calendar navigation state — start at June 2026 on server, hydrate to real date
  const [calYear,  setCalYear]  = useState(2026);
  const [calMonth, setCalMonth] = useState(5); // 0-indexed

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
  }, []);

  // Auto-open birthday modal once per day for the birthday person
  const isMyBirthday = (() => {
    if (!myEmployee?.birthday) return false;
    const today = new Date();
    const bday  = new Date(myEmployee.birthday + "T00:00:00");
    return bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate();
  })();

  useEffect(() => {
    if (!mounted || !isMyBirthday) return;
    const todayKey = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    const shownKey = "portland-gas-birthday-shown";
    if (localStorage.getItem(shownKey) !== todayKey) {
      setBirthdayModalOpen(true);
      localStorage.setItem(shownKey, todayKey);
    }
  }, [mounted, isMyBirthday]);

  const firstName = user?.first_name ?? user?.name?.split(" ")[0] ?? "";

  // Format birthday label: "Today", "Tomorrow", or "Wed 11"
  function birthdayLabel(daysUntil: number): string {
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    const d = new Date();
    d.setDate(d.getDate() + daysUntil);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  }

  async function sendWishes(employeeId: string) {
    if (wishesSent.has(employeeId) || wishesLoading.has(employeeId)) return;
    setWishesLoading((prev) => new Set(prev).add(employeeId));
    try {
      await sendWishesMutation.mutateAsync(employeeId);
      setWishesSent((prev) => new Set(prev).add(employeeId));
      toast.success("Birthday wishes sent! 🎉");
    } catch {
      toast.error("Could not send wishes. Try again.");
    } finally {
      setWishesLoading((prev) => { const s = new Set(prev); s.delete(employeeId); return s; });
    }
  }

  // Carousel auto-advance
  const LEADERSHIP_MESSAGES = rawLeadership.map((m) => ({
    id:      m.id,
    from:    m.author_name,
    role:    m.author_role ?? "",
    dept:    m.author_dept ?? "",
    date:    m.published_at
               ? new Date(m.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
               : "",
    avatar:  m.avatar_url ?? null,
    message: m.body,
  }));

  const carouselLength = LEADERSHIP_MESSAGES.length || 1;
  const next = useCallback(() => setSlide((s) => (s + 1) % carouselLength), [carouselLength]);
  const prev = () => setSlide((s) => (s - 1 + carouselLength) % carouselLength);
  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  // Calendar nav
  function prevMonth() {
    setSelectedDay(null);
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  // Actual today for "today" highlight
  const realNow      = mounted ? new Date() : new Date("2026-06-17");
  const todayYear    = realNow.getFullYear();
  const todayMonthN  = realNow.getMonth();
  const todayNum     = realNow.getDate();
  const isCurrentMo  = calYear === todayYear && calMonth === todayMonthN;

  const calCells    = buildCalendar(calYear, calMonth);

  // Events for the currently viewed month
  const monthEvents = EVENTS.filter(e => e.year === calYear && e.monthNum === calMonth);

  // Upcoming events — in the current month, only show today and future; future months show all
  const upcomingMonthEvents = isCurrentMo
    ? monthEvents.filter(ev => ev.day >= todayNum)
    : monthEvents;

  // Map day → events[] for cells (multiple events can share a day)
  const dayEventsMap: Record<number, typeof EVENTS> = {};
  monthEvents.forEach(e => {
    if (!dayEventsMap[e.day]) dayEventsMap[e.day] = [];
    dayEventsMap[e.day].push(e);
  });

  // News feed — tab is either "All" or a category name directly
  const feed = NEWS.filter(n => {
    if (tab !== "All" && n.category !== tab) return false;
    if (q) return n.title.toLowerCase().includes(q.toLowerCase()) || n.excerptText.toLowerCase().includes(q.toLowerCase());
    return true;
  });

  const msg = LEADERSHIP_MESSAGES[slide] ?? null;

  return (
    <IntranetLayout>

      {/* ── Hero — Background image + split layout ──────────────────────── */}
      {/* -mt-16 pulls the hero behind the fixed transparent header; pt-16 inside keeps text clear */}
      <section
        className="w-full relative overflow-hidden -mt-16"
        style={{ minHeight: 460, backgroundColor: "#1C043B" }}
      >
        {/* Background photo — inline styles so no Next.js domain config needed */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${HERO_BG}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(28, 4, 59, 0.85)" }} />

        {/* Content constrained to same max-width as body */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8 flex flex-col lg:flex-row w-full" style={{ minHeight: 460 }}>

        {/* Left panel — pt-16 extra to clear the fixed navbar */}
        <div className="flex-1 lg:w-[55%] px-6 pt-24 pb-12 flex flex-col justify-center">
          <p className="text-[#FFBC00] text-xs font-bold uppercase tracking-widest mb-3" suppressHydrationWarning>
            {mounted ? todayStr() : ""}
          </p>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-2">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-white/50 text-sm mb-6">The Clean Energy Standard — stay informed, stay connected.</p>

          <p className="text-[9px] font-bold uppercase tracking-widest text-white/30 mt-6 mb-2">Quick Links</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="bg-white/[0.08] border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-white/70 hover:bg-white/[0.15] hover:text-white transition-all"
              >
                <Icon size={13} className="text-[#FFBC00] shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right panel — Leadership carousel — pt-16 to clear navbar */}
        <div className="lg:w-[45%] flex items-center justify-center pt-20 pb-4 px-4">
          <div className="bg-white/5 rounded-2xl p-7 w-full relative overflow-hidden flex flex-col" style={{ minHeight: 300 }}>
            <span
              className="text-white/5 font-serif leading-none absolute top-2 right-4 pointer-events-none select-none"
              style={{ fontSize: "120px" }}
              aria-hidden="true"
            >
              &ldquo;
            </span>
            {leaderLoading ? (
              <div className="flex flex-col flex-1 animate-pulse">
                <div className="h-3 w-32 bg-white/10 rounded mb-5" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-full bg-white/10 rounded" />
                  <div className="h-3 w-5/6 bg-white/10 rounded" />
                  <div className="h-3 w-4/6 bg-white/10 rounded" />
                  <div className="h-3 w-3/4 bg-white/10 rounded" />
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <div className="h-10 w-10 rounded-full bg-white/10 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-28 bg-white/10 rounded" />
                    <div className="h-2.5 w-20 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            ) : msg ? (
              <>
                <p className="text-[#FFBC00] text-[9px] font-extrabold uppercase tracking-widest mb-4">
                  {msg.dept} · {msg.date}
                </p>
                <p className="text-white/85 text-sm leading-relaxed flex-1">
                  &ldquo;{msg.message}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-6">
                  <Avatar name={msg.from} src={msg.avatar} size="xl" className="ring-2 ring-white/20" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm">{msg.from}</p>
                    <p className="text-white/50 text-xs">{msg.role}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-white/40 text-sm flex-1 flex items-center justify-center">No messages published yet.</p>
            )}
            <div className="flex items-center gap-1.5 mt-5">
              {LEADERSHIP_MESSAGES.map((_m, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={cn("rounded-full transition-all duration-300", i === slide ? "bg-[#FFBC00] w-5 h-1.5" : "bg-white/20 w-1.5 h-1.5")}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
              <div className="flex-1" />
              <button onClick={prev} className="h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all" aria-label="Previous">
                <ChevronLeft size={13} />
              </button>
              <button onClick={next} className="h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all" aria-label="Next">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
        </div>{/* end max-width container */}
      </section>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 space-y-10">

        {/* ── People First ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFBC00]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FFBC00]">People First</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#1C043B] mb-5">People at Portland Gas</h2>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-5 items-stretch">

            {/* Employee of the Month */}
            <div className="rounded-2xl p-7 flex flex-col items-center text-center h-full" style={{ backgroundColor: "#1C043B" }}>
              {peopleLoading ? (
                <div className="flex flex-col items-center w-full animate-pulse flex-1">
                  <div className="h-3 w-32 bg-white/10 rounded mb-5" />
                  <div className="h-20 w-20 rounded-xl bg-white/10 mb-4" />
                  <div className="h-5 w-36 bg-white/10 rounded mb-2" />
                  <div className="h-3 w-24 bg-white/10 rounded mb-1" />
                  <div className="h-3 w-20 bg-white/10 rounded mb-6" />
                  <div className="space-y-2 w-full flex-1">
                    <div className="h-3 w-full bg-white/10 rounded" />
                    <div className="h-3 w-5/6 bg-white/10 rounded" />
                    <div className="h-3 w-4/6 bg-white/10 rounded" />
                  </div>
                  <div className="h-8 w-28 bg-white/10 rounded-xl mt-6" />
                </div>
              ) : EMPLOYEE_OF_MONTH ? (
                <>
                  <p className="text-[#FFBC00] text-[9px] font-extrabold uppercase tracking-widest mb-4">
                    Employee of the Month · {EMPLOYEE_OF_MONTH.month}
                  </p>
                  <Avatar name={EMPLOYEE_OF_MONTH.name} src={EMPLOYEE_OF_MONTH.avatar} size="lg" rounded="xl" className="ring-4 ring-[#FFBC00]/50 mb-4" />
                  <h3 className="text-xl font-extrabold text-white leading-tight mb-0.5">{EMPLOYEE_OF_MONTH.name}</h3>
                  <p className="text-white/50 text-xs mb-0.5">{EMPLOYEE_OF_MONTH.role}</p>
                  <p className="text-white/35 text-xs mb-4">{EMPLOYEE_OF_MONTH.dept}</p>
                  <p className="text-white/65 text-xs leading-relaxed line-clamp-4 my-4 flex-1">
                    &ldquo;{EMPLOYEE_OF_MONTH.message}&rdquo;
                  </p>
                  {EMPLOYEE_OF_MONTH.employeeId ? (
                    <Link
                      href={`/people/${EMPLOYEE_OF_MONTH.employeeId}`}
                      className="mt-auto bg-[#FFBC00] text-[#1C043B] font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors"
                    >
                      View Profile →
                    </Link>
                  ) : (
                    <button className="mt-auto bg-[#FFBC00] text-[#1C043B] font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors">
                      View Profile →
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-white/30">
                  <User size={32} className="mb-3" />
                  <p className="text-xs">Employee of the Month not yet configured</p>
                </div>
              )}
            </div>

            {/* Employee Spotlight — same height via flex-col + h-full */}
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1C043B] text-sm">Employee Spotlight</h3>
                <Link href="/people" className="text-xs text-[#7234BD] font-semibold hover:underline">View all →</Link>
              </div>
              <div className={cn(
                "grid gap-4 flex-1",
                SPOTLIGHTS.length === 1
                  ? "grid-cols-1 sm:grid-cols-1 sm:max-w-xs"
                  : SPOTLIGHTS.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-3"
              )}>
                {peopleLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center animate-pulse h-full">
                      <div className="h-16 w-16 rounded-xl bg-gray-100 mb-3" />
                      <div className="h-5 w-20 bg-gray-100 rounded-full mb-3" />
                      <div className="h-4 w-28 bg-gray-100 rounded mb-1" />
                      <div className="h-3 w-20 bg-gray-100 rounded mb-1" />
                      <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-4/5 bg-gray-100 rounded" />
                        <div className="h-3 w-3/5 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))
                ) : SPOTLIGHTS.length === 0 ? (
                  <div className="sm:col-span-3 flex items-center justify-center py-10 text-gray-400 text-xs">
                    No spotlight cards published yet.
                  </div>
                ) : SPOTLIGHTS.map((s) => (
                  <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center text-center hover:shadow-lg hover:-translate-y-0.5 transition-all h-full">
                    <Avatar name={s.name} src={s.avatar} size="lg" rounded="xl" className="mb-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3" style={{ backgroundColor: s.tagBg, color: s.tagColor }}>
                      {s.tag}
                    </span>
                    <h4 className="font-bold text-sm text-[#1C043B] mb-0.5">{s.name}</h4>
                    <p className="text-gray-400 text-xs mb-1">{s.role}</p>
                    <p className="text-xs font-semibold mb-3" style={{ color: "#7234BD" }}>{s.dept}</p>
                    <p className="text-gray-500 text-xs leading-relaxed flex-1">{s.highlight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Birthdays Strip ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-6 py-5">
          {/* Mobile: stack label on top, grid below */}
          <div className="flex flex-col sm:flex-row sm:gap-6">

            {/* Label row — horizontal on mobile, vertical column on sm+ */}
            <div className="flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 sm:gap-0 shrink-0 sm:w-28 mb-4 sm:mb-0">
              <div className="flex items-center gap-2 sm:block">
                <span className="text-xl">🎂</span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#FFBC00] leading-tight">Birthdays</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">This week</p>
                </div>
              </div>
              {/* "View all" on mobile */}
              <Link href="/people" className="sm:hidden text-xs text-[#7234BD] font-semibold hover:underline whitespace-nowrap">View all →</Link>
            </div>

            {/* Birthday cards grid */}
            <div className="flex-1 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {birthdaysLoading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50/50 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                      <div className="h-2.5 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="h-5 w-14 bg-gray-200 rounded-full shrink-0" />
                  </div>
                ))
              ) : birthdays.length === 0 ? (
                <div className="col-span-4 flex items-center justify-center py-4 text-gray-400 text-xs">
                  No birthdays this week 🎉
                </div>
              ) : birthdays.map((b) => {
                const label   = birthdayLabel(b.days_until);
                const isToday = b.days_until === 0;
                const isMine  = myEmployee?.id === b.employee_id;
                const sent    = wishesSent.has(b.employee_id);
                const loading = wishesLoading.has(b.employee_id);
                return (
                  <div key={b.employee_id} className={cn(
                    "flex flex-col gap-2 border rounded-xl px-3 py-2.5",
                    isToday ? "border-[#FFBC00]/50 bg-[#FFFBEB]" : "border-gray-200 bg-gray-50/50"
                  )}>
                    <div className="flex items-center gap-3">
                      <Avatar name={b.name} src={b.avatar_url ?? undefined} size="xl" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1C043B] leading-tight truncate">{b.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{b.department ?? ""}</p>
                      </div>
                      <span className={cn(
                        "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                        label === "Today"    ? "bg-[#FFBC00] text-[#1C043B]" :
                        label === "Tomorrow" ? "bg-[#F3EEFF] text-[#7234BD]" :
                                               "bg-gray-100 text-gray-500"
                      )}>
                        {label}
                      </span>
                    </div>
                    {/* Send wishes — only for today's birthdays, not your own */}
                    {isToday && !isMine && (
                      <button
                        onClick={() => sendWishes(b.employee_id)}
                        disabled={sent || loading}
                        className={cn(
                          "w-full text-[10px] font-semibold py-1 rounded-lg transition-all",
                          sent
                            ? "bg-green-100 text-green-700 cursor-default"
                            : "bg-[#FFBC00]/20 text-[#B45309] hover:bg-[#FFBC00]/40"
                        )}
                      >
                        {loading ? "Sending…" : sent ? "Wishes sent ✓" : "🎂 Send wishes"}
                      </button>
                    )}
                    {/* Re-open birthday modal for yourself */}
                    {isToday && isMine && (
                      <button
                        onClick={() => setBirthdayModalOpen(true)}
                        className="w-full text-[10px] font-semibold py-1 rounded-lg bg-[#FFBC00]/20 text-[#B45309] hover:bg-[#FFBC00]/40 transition-all"
                      >
                        🎉 View your birthday surprise
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* View all — hidden on mobile (shown above), visible on sm+ */}
            <div className="hidden sm:flex items-center">
              <Link href="/people" className="text-xs text-[#7234BD] font-semibold hover:underline whitespace-nowrap">View all →</Link>
            </div>
          </div>
        </div>

        {/* ── News + Calendar/Events — side by side ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-stretch">

          {/* Left — News panel in white container */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 h-full flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-widest text-[#7234BD] mb-2 tracking-[0.15em]">From the Newsroom</p>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold text-[#1C043B]">Latest News</h2>
              <Link href="/news" className="text-xs text-[#7234BD] font-semibold hover:underline">View all →</Link>
            </div>

            {/* Tab pills */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-0.5 -mx-1 px-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150",
                    tab === t
                      ? "bg-[#1C043B] text-white shadow-sm"
                      : "bg-white text-gray-500 border border-gray-200 hover:text-[#7234BD] hover:border-[#7234BD]/30"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Scrollable content area — grows to fill card height */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {newsFeedLoading ? (
                <div className="animate-pulse space-y-4">
                  {/* Featured card skeleton */}
                  <div className="flex rounded-2xl overflow-hidden border border-gray-100 mb-4">
                    <div className="w-[240px] h-[200px] bg-gray-100 shrink-0" />
                    <div className="flex-1 p-5 space-y-3">
                      <div className="h-3 w-16 bg-gray-100 rounded-full" />
                      <div className="h-5 w-4/5 bg-gray-100 rounded" />
                      <div className="h-5 w-3/5 bg-gray-100 rounded" />
                      <div className="space-y-1.5 pt-1">
                        <div className="h-3 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-5/6 bg-gray-100 rounded" />
                      </div>
                    </div>
                  </div>
                  {/* List row skeletons */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-14 bg-gray-100 rounded-full" />
                          <div className="h-3 w-20 bg-gray-100 rounded" />
                        </div>
                        <div className="h-4 w-3/4 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : feed.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <Search size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{q ? <>No results for &ldquo;{q}&rdquo;</> : "No news articles published yet."}</p>
                </div>
              ) : (
                <div>
                  {/* Featured card — stacks on mobile, side-by-side on sm+ */}
                  {feed[0] && (
                    <Link
                      href={`/news/${feed[0].id}`}
                      className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-lg transition-all mb-4"
                    >
                      <div className="relative w-full h-52 sm:w-[240px] sm:h-auto sm:min-h-[200px] shrink-0">
                        <Image src={feed[0].img} alt={feed[0].title} fill sizes="(max-width:640px) 100vw, 240px" className="object-cover" />
                        <span className={`absolute bottom-3 left-3 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${feed[0].badge}`}>
                          {feed[0].category}
                        </span>
                      </div>
                      <div className="flex-1 p-5 flex flex-col justify-center min-w-0">
                        <h3 className="font-extrabold text-xl text-[#1C043B] leading-snug mb-2">
                          {feed[0].title}
                        </h3>
                        <div
                          className="rich-text-preview line-clamp-3 mb-4"
                          dangerouslySetInnerHTML={{ __html: feed[0].bodyHtml }}
                        />
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                          {feed[0].author} &nbsp;·&nbsp; {feed[0].date}
                        </p>
                      </div>
                    </Link>
                  )}

                  {/* List rows */}
                  <div className="divide-y divide-gray-100">
                    {feed.slice(1).map((item) => (
                      <Link key={item.id} href={`/news/${item.id}`} className="flex items-start gap-3 py-3.5 group">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${item.badge}`}>
                              {item.category}
                            </span>
                            <span className="text-[10px] text-gray-400">{item.author}</span>
                            <span className="text-[10px] text-gray-300 ml-auto shrink-0">{item.date}</span>
                          </div>
                          <p className="text-sm font-semibold text-[#1C043B] group-hover:text-[#7234BD] line-clamp-1 transition-colors">
                            {item.title}
                          </p>
                        </div>
                        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-[#7234BD] shrink-0 mt-1 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right — Calendar + Events fused into one white card */}
          <section className="bg-white rounded-2xl border border-gray-100 p-5 h-full flex flex-col">

            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#7234BD]" />
                <h3 className="text-base font-bold text-[#1C043B]">
                  {MONTH_NAMES[calMonth]} {calYear}
                </h3>
                {isCurrentMo && (
                  <span className="text-[9px] font-bold uppercase tracking-wide bg-[#7234BD] text-white px-2 py-0.5 rounded-full ml-1">
                    TODAY · {todayNum}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#7234BD] hover:text-[#7234BD] transition-all" aria-label="Previous month">
                  <ChevronLeft size={13} />
                </button>
                <button onClick={nextMonth} className="h-7 w-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-[#7234BD] hover:text-[#7234BD] transition-all" aria-label="Next month">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Day name headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[9px] font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 mb-4">
              {calCells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const dayEvs     = dayEventsMap[day] ?? [];
                const firstEv    = dayEvs[0];
                const hasEv      = dayEvs.length > 0;
                const multiEv    = dayEvs.length > 1;
                const isToday    = isCurrentMo && day === todayNum;
                const isSelected = day === selectedDay;

                return (
                  <button
                    key={day}
                    onClick={() => hasEv ? setSelectedDay(isSelected ? null : day) : undefined}
                    className={cn(
                      "relative h-9 w-full flex flex-col items-center justify-center text-xs rounded-xl transition-all duration-150",
                      isToday    ? "font-bold text-white shadow-sm" :
                      isSelected ? "font-bold ring-2 ring-offset-0" :
                      hasEv      ? "font-semibold" :
                                   "text-gray-600",
                      !isToday && !hasEv && "hover:bg-gray-100",
                      hasEv && !isToday && "cursor-pointer hover:opacity-80",
                    )}
                    style={
                      isToday    ? { backgroundColor: "#7234BD" } :
                      isSelected ? { backgroundColor: firstEv?.colorBg, color: firstEv?.color, outline: `2px solid ${firstEv?.color}`, outlineOffset: "0px" } :
                      hasEv      ? { backgroundColor: firstEv?.colorBg, color: firstEv?.color } :
                                   {}
                    }
                  >
                    {day}
                    {/* Dot(s) below the number */}
                    {hasEv && !isToday && (
                      <span className="absolute bottom-1 flex items-center gap-0.5">
                        {dayEvs.slice(0, 3).map((ev) => (
                          <span key={ev.id} className="h-1 w-1 rounded-full" style={{ backgroundColor: ev.color }} />
                        ))}
                      </span>
                    )}
                    {/* "+N" badge for 2+ events */}
                    {multiEv && (
                      <span className="absolute top-0.5 right-0.5 text-[8px] font-black leading-none" style={{ color: firstEv?.color }}>
                        +{dayEvs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            {monthEvents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-4 border-b border-gray-100">
                {monthEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedDay(selectedDay === ev.day ? null : ev.day)}
                    className={cn(
                      "flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full transition-all",
                      selectedDay === null || selectedDay === ev.day
                        ? "font-semibold"
                        : "opacity-40 bg-gray-50 hover:opacity-70"
                    )}
                    style={
                      selectedDay === null || selectedDay === ev.day
                        ? { backgroundColor: ev.colorBg, color: ev.color }
                        : {}
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                    {ev.day} · {ev.type}
                  </button>
                ))}
                {selectedDay && (
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#F3EEFF] text-[#7234BD] hover:bg-[#E9D5FF] transition-all ml-auto"
                  >
                    Show all <X size={9} />
                  </button>
                )}
              </div>
            )}

            {/* Upcoming events list — grows to fill remaining card height */}
            <div className="mt-4 flex-1 min-h-0 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3">Upcoming Events</p>

              {calLoading ? (
                <div className="space-y-2 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl">
                      <div className="w-11 h-12 rounded-xl bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-2.5 w-12 bg-gray-100 rounded" />
                        <div className="h-3.5 w-4/5 bg-gray-100 rounded" />
                        <div className="h-2.5 w-3/5 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingMonthEvents.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No upcoming events this month.</p>
              ) : (
                <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 min-h-0">
                  {upcomingMonthEvents.map((ev) => {
                    const isActive  = selectedDay === null || ev.day === selectedDay;
                    const isHighlit = selectedDay === ev.day;
                    return (
                      <Link
                        key={ev.id}
                        href={`/events/${ev.id}`}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl transition-all",
                          isHighlit ? "border-l-4" : "hover:bg-gray-50",
                          !isActive && "opacity-35 pointer-events-none"
                        )}
                        style={isHighlit ? { backgroundColor: ev.colorBg, borderLeftColor: ev.color } : {}}
                      >
                        {/* Date badge */}
                        <div
                          className="rounded-xl px-2.5 py-2 flex flex-col items-center shrink-0 min-w-[44px]"
                          style={{ backgroundColor: ev.colorBg }}
                        >
                          <span className="text-sm font-extrabold leading-none" style={{ color: ev.color }}>{ev.day}</span>
                          <span className="text-[9px] uppercase font-bold mt-0.5" style={{ color: ev.color }}>{ev.month}</span>
                        </div>
                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: ev.color }}>
                            {ev.type}
                          </p>
                          <p className="text-xs font-semibold text-[#1C043B] leading-snug mb-0.5">{ev.title}</p>
                          <div className="flex items-center gap-1">
                            <MapPin size={9} className="text-gray-400 shrink-0" />
                            <p className="text-[10px] text-gray-400 truncate">{ev.location}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ── Footer 3-card row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

          <Link href="/faq" className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-xl bg-[#F3EEFF] flex items-center justify-center shrink-0">
              <HelpCircle size={20} className="text-[#7234BD]" />
            </div>
            <div>
              <p className="font-bold text-sm text-[#1C043B]">Frequently Asked Questions</p>
              <p className="text-xs text-gray-400 mt-1">IT support, HR, HSE, procurement — all in one place.</p>
            </div>
          </Link>

          <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ backgroundColor: "#1C043B" }}>
            <div>
              <p className="text-[#FFBC00] text-[9px] font-extrabold uppercase tracking-widest mb-2">Portland Gas Podcast</p>
              {featuredPodcast ? (
                <>
                  <h3 className="text-white font-bold text-sm leading-snug mb-1 line-clamp-2">
                    &ldquo;{featuredPodcast.title}&rdquo;
                  </h3>
                  <p className="text-white/50 text-xs line-clamp-2">
                    {featuredPodcast.description
                      ? featuredPodcast.description
                      : featuredPodcast.guest_name
                        ? `with ${featuredPodcast.guest_name}${featuredPodcast.duration ? ` · ${featuredPodcast.duration}` : ""}`
                        : featuredPodcast.duration ?? ""}
                  </p>
                </>
              ) : (
                <p className="text-white/40 text-xs">No episodes published yet.</p>
              )}
            </div>
            {featuredPodcast ? (
              <Link href={`/podcast/${featuredPodcast.id}`} className="mt-4 flex items-center gap-3 group self-start">
                <div className="h-10 w-10 rounded-full bg-[#FFBC00] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play size={14} className="text-[#1C043B] ml-0.5 fill-[#1C043B]" />
                </div>
                <span className="text-white/60 text-xs group-hover:text-white transition-colors">
                  {featuredPodcast.is_featured ? "Play featured episode" : "Play episode"}
                </span>
              </Link>
            ) : (
              <Link href="/podcast" className="mt-4 flex items-center gap-3 group self-start">
                <div className="h-10 w-10 rounded-full bg-[#FFBC00]/30 flex items-center justify-center">
                  <Mic2 size={14} className="text-[#FFBC00]" />
                </div>
                <span className="text-white/40 text-xs">Browse episodes</span>
              </Link>
            )}
          </div>

          <div className="rounded-2xl p-6 flex flex-col gap-3" style={{ backgroundColor: "#7234BD" }}>
            <Mic2 size={22} className="text-white" />
            <div>
              <h3 className="text-white font-extrabold text-lg leading-tight">Your Voice Matters</h3>
              <p className="text-white/70 text-xs mt-1">
                Help us improve the intranet. Share feedback, suggest content, or report an issue.
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("open-feedback-modal"))}
              className="mt-auto self-start bg-[#FFBC00] text-[#1C043B] font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors"
            >
              Submit Feedback
            </button>
          </div>
        </div>

        <div className="h-4" />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Image
            src="https://portlandgasltd.com/wp-content/uploads/2024/06/Portland-gas-42.png"
            alt="Portland Gas"
            width={100}
            height={26}
            style={{ height: "24px", width: "auto" }}
            className="opacity-50"
          />
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
          <p className="text-xs text-gray-400">The Clean Energy Standard</p>
        </div>
      </footer>

      {/* ── Birthday Modal — only visible to the birthday person ─────────── */}
      {mounted && isMyBirthday && birthdayModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(28, 4, 59, 0.93)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setBirthdayModalOpen(false); }}
        >
          <style>{`
            @keyframes bday-float {
              0%, 100% { transform: translateY(0) rotate(-6deg); }
              50%       { transform: translateY(-18px) rotate(6deg); }
            }
            .bday-balloon { animation: bday-float 3.5s ease-in-out infinite; }
            @keyframes bday-confetti {
              0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
              100% { transform: translateY(60px) rotate(180deg); opacity: 0; }
            }
          `}</style>

          {/* Floating balloons */}
          <span className="bday-balloon pointer-events-none absolute top-16 left-[8%]  text-5xl" style={{ animationDelay: "0s" }}>🎈</span>
          <span className="bday-balloon pointer-events-none absolute top-24 right-[9%] text-4xl" style={{ animationDelay: "0.6s" }}>🎈</span>
          <span className="bday-balloon pointer-events-none absolute top-10 left-[22%] text-3xl" style={{ animationDelay: "1.1s" }}>🎈</span>
          <span className="bday-balloon pointer-events-none absolute top-32 right-[25%] text-4xl" style={{ animationDelay: "0.3s" }}>🎉</span>
          <span className="bday-balloon pointer-events-none absolute bottom-20 left-[15%] text-3xl" style={{ animationDelay: "0.8s" }}>🎊</span>
          <span className="bday-balloon pointer-events-none absolute bottom-16 right-[12%] text-4xl" style={{ animationDelay: "1.4s" }}>🎈</span>

          {/* Card */}
          <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <button
              onClick={() => setBirthdayModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="text-6xl mb-4 animate-bounce select-none">🎂</div>

            <h2 className="text-2xl font-extrabold text-[#1C043B] mb-2 leading-tight">
              Happy Birthday, {firstName}!
            </h2>
            <p className="text-gray-500 text-sm mb-5 leading-relaxed">
              Portland Gas wishes you a wonderful day filled with joy, laughter, and everything you love. 🎉
            </p>

            <div className="flex items-center justify-center gap-2 text-2xl mb-6 select-none">
              🎊&nbsp;🥳&nbsp;🎁&nbsp;🎀
            </div>

            <button
              onClick={() => setBirthdayModalOpen(false)}
              className="w-full bg-[#7234BD] text-white font-bold py-3 rounded-xl hover:bg-[#5b2699] transition-colors text-sm"
            >
              Thank you! 💜
            </button>

            <p className="text-[11px] text-gray-500 mt-4">
              From the entire Portland Gas family
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* ── Feedback Modal — portalled to body to escape animate-page-enter transform ── */}
      {mounted && createPortal(<ActionModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Submit Feedback"
        description="Share your thoughts, suggestions, or report an issue. Your voice helps us improve."
        variant="dialog"
        size="md"
        footer={
          <>
            <button
              onClick={() => setFeedbackOpen(false)}
              className="h-10 px-4 rounded-lg border border-brand-border text-sm font-medium text-brand-text-primary hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitFeedback}
              disabled={feedbackSubmitting}
              className="h-10 px-4 rounded-lg bg-brand-purple text-white text-sm font-medium hover:bg-brand-purple/90 disabled:opacity-60 transition-colors"
            >
              {feedbackSubmitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FEEDBACK_CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFeedbackCategory(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    feedbackCategory === opt.value
                      ? "bg-brand-purple text-white border-brand-purple"
                      : "bg-white text-brand-text-secondary border-brand-border hover:border-brand-purple/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={feedbackSubject}
              onChange={(e) => { setFeedbackSubject(e.target.value); setFeedbackErrors((p) => ({ ...p, subject: "" })); }}
              placeholder="Brief summary of your feedback"
              className={cn(
                "h-10 w-full rounded-lg border bg-white px-3 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple/30 transition-shadow",
                feedbackErrors.subject ? "border-red-400 focus:ring-red-400/20" : "border-brand-border"
              )}
            />
            {feedbackErrors.subject && <p className="text-xs text-red-600 mt-1">{feedbackErrors.subject}</p>}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-brand-text-primary mb-1.5">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={feedbackMessage}
              onChange={(e) => { setFeedbackMessage(e.target.value); setFeedbackErrors((p) => ({ ...p, message: "" })); }}
              placeholder="Provide details about your feedback, suggestion, or issue…"
              rows={4}
              className={cn(
                "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-brand-text-primary placeholder:text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-purple/30 resize-none transition-shadow",
                feedbackErrors.message ? "border-red-400 focus:ring-red-400/20" : "border-brand-border"
              )}
            />
            {feedbackErrors.message && <p className="text-xs text-red-600 mt-1">{feedbackErrors.message}</p>}
          </div>

          {/* Anonymous toggle */}
          <div className={cn(
            "flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
            feedbackAnonymous ? "bg-brand-purple/5 border-brand-purple/20" : "bg-gray-50 border-brand-border"
          )}
            onClick={() => setFeedbackAnonymous((v) => !v)}
          >
            <input
              type="checkbox"
              checked={feedbackAnonymous}
              onChange={(e) => setFeedbackAnonymous(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-brand-purple cursor-pointer shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
            <div>
              <p className="text-sm font-medium text-brand-text-primary">Submit anonymously</p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                {feedbackAnonymous
                  ? "Your name and department will not be attached to this feedback."
                  : `Submitting as ${user?.first_name ?? user?.name ?? "yourself"}. Uncheck to submit anonymously.`}
              </p>
            </div>
          </div>
        </div>
      </ActionModal>, document.body)}

    </IntranetLayout>
  );
}
