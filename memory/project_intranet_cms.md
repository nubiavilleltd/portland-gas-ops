---
name: Intranet CMS Admin Section — Full Plan
description: Complete build plan for the intranet CMS inside the workflow portal /admin section — ready to execute on user's go-ahead
type: project
---

Admin CMS for the intranet portal, living under `/admin/intranet/` in the workflow portal. All 8 sections have been planned and approved by the user.

**Why:** The intranet homepage currently uses hardcoded mock data arrays in page.tsx. This CMS lets admins update all content without touching code.

**How to apply:** When user says "let's go back to the intranet CMS plan", load this memory and start at Step 1 of the build order below. Wire up API endpoints that the intranet page.tsx calls instead of the hardcoded constants.

---

## Module Group to Add (`config/module-groups-admin.ts`)

New group title: **"Intranet CMS"**

| Card | Route | Icon |
|---|---|---|
| News & Announcements | `/admin/intranet/news` | `Newspaper` |
| Events | `/admin/intranet/events` | `CalendarDays` |
| FAQs | `/admin/intranet/faqs` | `HelpCircle` |
| Podcast | `/admin/intranet/podcast` | `Mic2` |
| Feedback Inbox | `/admin/intranet/feedback` | `MessageSquare` |
| Employee of the Month | `/admin/intranet/employee-of-month` | `Star` |
| Employee Spotlight | `/admin/intranet/spotlight` | `Users` |
| Leadership Messages | `/admin/intranet/leadership` | `Quote` |

---

## Pages

### `/admin/intranet/news`
- Table: title, category, date, author, published status
- Create/Edit form: title, category (Company News, Announcement, Policy Update, Project Update, Safety, Events), excerpt, date, author, image URL, published toggle
- Delete with confirm dialog

### `/admin/intranet/events`
- Table: title, type, date, location
- Create/Edit form: title, type (Town Hall, Training, Deadline, Workshop, Social), date (day/month/year), location, colour theme picker
- Feeds home page calendar + events list and /events page

### `/admin/intranet/faqs`
- Left panel: category list (IT Support, HR & Payroll, HSE, Procurement, General) with visibility toggle per category
- Right panel: Q&A list for selected category — add, edit, delete, reorder (up/down arrows)
- Feeds /faq page

### `/admin/intranet/podcast`
- Single-record form: title, guest name, duration, episode number, cover image URL, audio/embed URL, published toggle
- One episode shown at a time on homepage

### `/admin/intranet/employee-of-month`
- Single-record form: employee name, role, department, month/year, nomination message, avatar URL
- One active record at a time — saving replaces the current one
- Preview card showing exactly how it appears on the homepage

### `/admin/intranet/spotlight`
- List of up to 3 spotlight cards (homepage shows exactly 3)
- Each card: employee name, role, department, highlight text, avatar URL, tag label, tag colour picker
- Enforces max 3 active at a time
- Preview of the three cards as they appear on homepage

### `/admin/intranet/leadership`
- Table: from name, role/dept, date, message preview, active toggle
- Create/Edit form: from name, role, department, date, full message, avatar URL, active toggle
- Multiple messages — homepage carousel cycles through all active ones
- Reorder with up/down arrows (controls carousel order)

### `/admin/intranet/feedback`
- Read-only inbox: timestamp, message, name (or "Anonymous"), department
- Filter: All / Anonymous only
- Status toggle per row: New → Reviewed

---

## Feedback Widget on Intranet Homepage (`/`)
Button on homepage opens a modal:
- Textarea: "Share your thoughts…"
- Toggle: "Submit anonymously" — if off, name auto-fills from useCurrentUser()
- On submit → POST to API (mocked for now) → thank-you message → auto-close after 2s

---

## Data Layer
Mock-first pattern — same data currently hardcoded in page.tsx moves into hooks:

```
/lib/modules/intranet/
  types/intranet.types.ts
  hooks/useIntranetNews.ts
  hooks/useIntranetEvents.ts
  hooks/useIntranetFAQs.ts
  hooks/useIntranetPodcast.ts
  hooks/useIntranetFeedback.ts
  hooks/useEmployeeOfMonth.ts
  hooks/useEmployeeSpotlight.ts
  hooks/useLeadershipMessages.ts
```

## File Structure
```
frontend/app/(app)/admin/intranet/
  news/page.tsx
  events/page.tsx
  faqs/page.tsx
  podcast/page.tsx
  feedback/page.tsx
  employee-of-month/page.tsx
  spotlight/page.tsx
  leadership/page.tsx
```

## Build Order (execute in this sequence)
1. `config/module-groups-admin.ts` — add the 8 cards to /admin immediately
2. `lib/modules/intranet/types/intranet.types.ts`
3. All 8 mock hooks
4. `/admin/intranet/news`
5. `/admin/intranet/events`
6. `/admin/intranet/faqs`
7. `/admin/intranet/podcast`
8. `/admin/intranet/employee-of-month`
9. `/admin/intranet/spotlight`
10. `/admin/intranet/leadership`
11. `/admin/intranet/feedback`
12. Feedback submit modal on intranet homepage (/)
