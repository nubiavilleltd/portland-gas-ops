// ── News & Announcements  (DB: intranet_announcements) ───────────────────────

export type NewsCategory =
  | "Company News"
  | "Announcement"
  | "Policy Update"
  | "Project Update"
  | "Safety"
  | "Events";

export interface NewsItem {
  id: number;
  title: string;
  body: string;              // DB: body TEXT
  category: NewsCategory;    // DB: category VARCHAR(60)
  cover_image_url: string;   // DB: cover_image FK → documents.id (URL denormalised from API)
  is_published: boolean;     // DB: is_published BOOLEAN
  published_at: string | null; // DB: published_at TIMESTAMPTZ
  author_name: string;       // denormalised from employees via created_by FK
  created_at: string;        // DB: created_at TIMESTAMPTZ
  updated_at: string;        // DB: updated_at TIMESTAMPTZ
}

// ── Events  (DB: intranet_events) ────────────────────────────────────────────

export type EventType =
  | "Town Hall"
  | "Training"
  | "Deadline"
  | "Workshop"
  | "Social";

export interface IntranetEvent {
  id: number;
  title: string;             // DB: title VARCHAR(255)
  description: string;       // DB: description TEXT
  event_type: EventType;     // DB: event_type VARCHAR(40)
  location: string;          // DB: location VARCHAR(200)
  virtual_link: string;      // DB: virtual_link VARCHAR(500) — meeting URL for virtual events
  event_date: string;        // DB: event_date DATE — ISO "YYYY-MM-DD"
  color: string;             // DB: color VARCHAR(10) — hex e.g. "#7234BD"
  is_published: boolean;     // DB: is_published BOOLEAN
  created_at: string;
  updated_at: string;
}

// ── FAQs  (DB: intranet_faq) ─────────────────────────────────────────────────

export type FAQCategoryLabel =
  | "IT Support"
  | "HR & Payroll"
  | "HSE"
  | "Procurement"
  | "General";

export interface FAQItem {
  id: number;
  question: string;          // DB: question TEXT
  answer: string;            // DB: answer TEXT
  category: FAQCategoryLabel; // DB: category VARCHAR(80)
  order_index: number;       // DB: order_index INT
  is_published: boolean;     // DB: is_published BOOLEAN
  created_at: string;
  updated_at: string;
}

// ── Spotlight  (DB: intranet_spotlight — covers both EOM and spotlight cards) ─

export type SpotlightCategory =
  | "employee_of_month"
  | "achievement"
  | "long_service"
  | "new_joiner";

export interface SpotlightEntry {
  id: number;
  employee_id: number;       // DB: employee_id FK → employees.id
  // Denormalised from employees table (API join)
  employee_name: string;
  employee_role: string;
  employee_dept: string;
  avatar_url: string;        // DB: photo_id FK → documents.id (URL denormalised)
  title: string;             // DB: title VARCHAR(150) e.g. "Employee of the Month — June 2026"
  message: string;           // DB: message TEXT
  category: SpotlightCategory; // DB: category VARCHAR(40)
  month: number | null;      // DB: month INT (1–12, for employee_of_month)
  year: number | null;       // DB: year INT
  // UI tag (not stored in DB — computed from category or manually set in CMS)
  tag: string;
  tag_color: string;
  tag_bg: string;
  is_published: boolean;     // DB: is_published BOOLEAN
  published_at: string | null;
  created_at: string;
}

// ── Leadership Messages  (DB: intranet_message_from) ─────────────────────────

export interface LeadershipMessage {
  id: number;
  author_id: number;         // DB: author_id FK → employees.id
  // Denormalised from employees table (API join)
  author_name: string;
  author_role: string;
  author_dept: string;
  avatar_url: string;        // DB: photo_id FK → documents.id (URL denormalised)
  title: string;             // DB: title VARCHAR(200)
  body: string;              // DB: body TEXT
  is_published: boolean;     // DB: is_published BOOLEAN
  published_at: string | null;
  order: number;             // UI ordering — maps to display position in carousel
  created_at: string;
  updated_at: string;
}

// ── Feedback  (DB: intranet_feedback) ────────────────────────────────────────

export type FeedbackCategory = "General" | "IT" | "HR" | "Suggestion" | "Complaint";
export type FeedbackStatus = "open" | "in_review" | "resolved" | "closed";

export interface FeedbackEntry {
  id: number;
  submitted_by_id: number | null; // DB: submitted_by FK → employees.id (null if anonymous)
  submitted_by_name: string | null; // denormalised — null if anonymous
  submitted_by_dept: string | null;
  category: FeedbackCategory;    // DB: category VARCHAR(80)
  subject: string;               // DB: subject VARCHAR(200)
  message: string;               // DB: message TEXT
  is_anonymous: boolean;         // DB: is_anonymous BOOLEAN
  status: FeedbackStatus;        // DB: status VARCHAR(20)
  resolved_by_id: number | null;
  resolved_at: string | null;
  created_at: string;            // DB: created_at TIMESTAMPTZ
}

// ── Podcast  (no DB table yet — planned addition) ─────────────────────────────

export type PodcastMediaType = "audio" | "video";

export interface PodcastEpisode {
  id: number;
  episode_number: number;
  title: string;
  guest_name: string;
  duration: string;          // e.g. "38 min"
  cover_image_url: string;
  audio_url: string;         // URL for audio or video media
  media_type: PodcastMediaType; // "audio" | "video"
  is_published: boolean;
  is_featured: boolean;      // Only one episode is featured on the intranet homepage
  created_at: string;
  updated_at: string;
}
