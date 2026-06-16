"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import IntranetLayout from "@/components/layout/IntranetLayout";
import { NEWS } from "../page";

const PG = "https://portlandgasltd.com/wp-content/uploads/2026/03";

const BODY: Record<number, string[]> = {
  1: [
    "Portland Gas Limited has officially commissioned its 14th Compressed Natural Gas (CNG) refuelling station in the Lekki axis of Lagos State, marking another significant milestone in the company's drive to make clean energy accessible across Nigeria.",
    "The new station, located along the Lekki–Epe Expressway, is strategically positioned to serve the rapidly growing fleet of CNG-converted vehicles and the increasing number of factory-fitted CNG vehicles entering the Nigerian market. It boasts a daily dispensing capacity of over 50,000 standard cubic feet of gas.",
    "Speaking at the commissioning ceremony, the Managing Director, Mrs. Adeola Ogunleye, expressed pride in the team: \"Every station we open is a statement — clean energy is not a future ambition for Portland Gas, it is today's reality. This is the 14th proof of that commitment.\"",
    "The station complements Portland Gas's existing network across Lagos, Ogun, and Oyo states, and forms part of the company's broader infrastructure expansion plan targeting 20 operational stations by end of 2026. The Lekki facility is also the first in the network to feature a dedicated heavy-vehicle dispensing bay.",
    "Staff and contractors are encouraged to share feedback on the new facility through the intranet feedback portal.",
  ],
  2: [
    "The Q2 2026 All-Staff Town Hall has been scheduled for Thursday, 12 June at 10:00 AM WAT. The session will be held in the Main Auditorium at Portland Gas Head Office, with a live stream available for staff at branch locations.",
    "The Managing Director will open proceedings with a review of Q2 2026 business performance, followed by an outlook on strategic priorities for the second half of the year. Departmental heads will also provide brief updates on their respective areas.",
    "All staff are expected to attend in person or via the designated video link. Branch managers are responsible for ensuring that all field staff have access to the stream on the day. The agenda has been shared via email.",
    "A Q&A session will be held from 11:30 AM. Staff are invited to submit questions in advance through the intranet Town Hall submission form. Anonymous submissions are accepted.",
    "Lunch will be provided for staff attending in person. RSVP via the Events section of the intranet by Wednesday, 11 June.",
  ],
  3: [
    "Human Resources has published the revised Hybrid Work and Flexible Hours Policy, effective 1 July 2026. All permanent staff are required to read and formally acknowledge the policy before 30 June 2026.",
    "The updated policy introduces a structured hybrid schedule: staff in eligible roles may work remotely up to two days per week, subject to line manager approval. Core in-office days are Tuesday and Thursday for all departments, unless operational requirements dictate otherwise.",
    "Key changes from the previous policy include: a formal request process for remote work days (minimum 48 hours notice), updated expectations for response times during remote working hours, and new provisions for staff in field-based or client-facing roles who are not eligible for hybrid arrangements.",
    "The policy document is available on the HR portal under Policies & Procedures. Staff in roles not covered by the hybrid framework will receive separate guidance from their line managers.",
    "Questions should be directed to hr@portlandgas.com or raised with your HR Business Partner.",
  ],
  4: [
    "Phase 2 of the Sagamu–Ibadan LNG Pipeline project officially commenced this week, with engineering and construction teams mobilising to the first section of the new corridor in Sagamu, Ogun State.",
    "The second phase covers a 34-kilometre extension, bringing the total pipeline length to over 80 kilometres upon completion. It is designed to significantly increase gas delivery capacity to industrial and commercial offtakers along the Sagamu–Ibadan corridor.",
    "The project is on schedule for Q4 2026 completion, in line with the commitments made to regulators and off-take partners. Key construction milestones over the next 90 days include right-of-way clearance, pipe stringing, and the first welding inspections.",
    "The Chief Operating Officer, Mrs. Amaka Eze, noted: \"Phase 2 is a project our customers and communities have been waiting for. Our teams are executing with precision and I am confident we will deliver on time.\"",
    "Project updates will be shared fortnightly on the intranet. Staff with HSE or site access queries should contact the Projects & Engineering department directly.",
  ],
  5: [
    "The Health, Safety & Environment (HSE) department has announced mandatory refresher training sessions for all field staff. All participants must complete the training before 30 June 2026.",
    "The training covers updates to Portland Gas's emergency response procedures, changes to the Personal Protective Equipment (PPE) requirements at CNG stations, and new protocols for handling gas leak incidents.",
    "Sessions will be held at each field location on a rotating schedule. The full timetable has been distributed to all field supervisors. Supervisors are responsible for 100% participation within their teams.",
    "Staff who miss their scheduled session must contact HSE@portlandgas.com within 48 hours to arrange an alternative date. Failure to complete the training by the deadline may result in temporary suspension of field access credentials.",
    "The HSE department thanks staff in advance for their cooperation in maintaining Portland Gas's strong safety record.",
  ],
  6: [
    "Portland Gas is proud to announce the Annual Family Fun Day 2026, taking place on Saturday, 28 June at the Landmark Event Centre, Victoria Island, Lagos.",
    "The event is open to all staff and their immediate families. Activities include a live band, children's entertainment zone, food stations representing cuisines from across Nigeria, a staff awards segment, and a charity raffle in support of the Portland Gas Education Fund.",
    "Registration is now open and closes on Friday, 20 June. Staff must register via the intranet Events portal to secure their wristbands. Walk-ins will not be accommodated due to venue capacity limits.",
    "Shuttle buses will operate from the Head Office and two other collection points across Lagos Island and the Mainland. Details of departure times and pick-up locations will be shared after the registration deadline.",
    "For enquiries, contact the Corporate Services team at events@portlandgas.com.",
  ],
};

export default function NewsDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const item    = NEWS.find((n) => n.id === Number(id));

  if (!item) {
    return (
      <IntranetLayout>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-20 text-center">
          <p className="text-gray-400 text-sm">Article not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-[#7234BD] text-sm hover:underline">Go back</button>
        </div>
      </IntranetLayout>
    );
  }

  const paragraphs = BODY[item.id] ?? [item.excerpt];
  const related    = NEWS.filter((n) => n.id !== item.id).slice(0, 3);

  return (
    <IntranetLayout>

      {/* ── Hero image ───────────────────────────────────────────────────── */}
      <div className="relative h-64 sm:h-80 bg-gray-200 overflow-hidden">
        <Image src={item.img} alt={item.title} fill sizes="100vw" className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C043B]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 lg:px-8 pb-6">
          <div className="max-w-[860px] mx-auto">
            <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3 ${item.badge}`}>
              {item.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              {item.title}
            </h1>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[860px] mx-auto px-4 lg:px-8 py-8">

        {/* Back */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#7234BD] transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to News
        </Link>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-8 pb-6 border-b border-gray-100">
          <span className="flex items-center gap-1.5"><User size={12} /> {item.author}</span>
          <span className="flex items-center gap-1.5"><Calendar size={12} /> {item.date}</span>
          <span className="flex items-center gap-1.5"><Tag size={12} /> {item.category}</span>
        </div>

        {/* Content */}
        <div className="space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 text-base leading-relaxed">{p}</p>
          ))}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-base font-bold text-[#1C043B] mb-5" style={{ fontFamily: "var(--font-mulish, sans-serif)" }}>
              More from Portland Gas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link key={r.id} href={`/news/${r.id}`} className="group flex flex-col gap-3">
                  <div className="relative h-32 rounded-xl overflow-hidden bg-gray-100">
                    <Image src={r.img} alt={r.title} fill sizes="300px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-semibold text-[#1C043B] group-hover:text-[#7234BD] transition-colors line-clamp-2 leading-snug">
                    {r.title}
                  </p>
                  <p className="text-[11px] text-gray-400">{r.date}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-100 bg-white py-5 px-4 lg:px-8 mt-4">
        <div className="max-w-[1400px] mx-auto">
          <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Portland Gas Limited · Internal use only</p>
        </div>
      </footer>
    </IntranetLayout>
  );
}
