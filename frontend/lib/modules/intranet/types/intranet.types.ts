// ── News Categories  (DB: intranet_news_categories) ──────────────────────────

// Stored as hex in DB (e.g. "#7234BD"). Legacy label values like "purple" are
// mapped to hex on display. The type is string to support any valid color.
export type NewsCategoryColor = string;

export interface NewsCategory {
  id:         number;
  name:       string;
  color:      NewsCategoryColor;
  created_at: string;
}

// ── Spotlight Tags  (DB: intranet_spotlight_tags) ─────────────────────────────

export interface SpotlightTag {
  id:         number;
  label:      string;
  color:      string;  // hex text colour
  bg:         string;  // hex background colour
  created_at: string;
}

// ── News & Announcements  (DB: intranet_news) ────────────────────────────────

export interface NewsItem {
  id:              string;
  title:           string;
  body:            string;
  category:        string;        // free text — must match a name in intranet_news_categories
  cover_image_id:  number | null; // FK → documents.id
  cover_image_url: string | null; // resolved from documents join (Cloudinary URL)
  is_published:    boolean;
  published_at:    string | null;
  author_name:     string;
  created_at:      string;
  updated_at:      string;
}

// ── Events  (DB: intranet_events) ────────────────────────────────────────────

export type EventType =
  | "Town Hall"
  | "Training"
  | "Deadline"
  | "Workshop"
  | "Social";

export interface IntranetEvent {
  id:           number;
  title:        string;
  description:  string | null;
  event_type:   EventType;
  location:     string | null;
  virtual_link: string | null;
  event_date:   string;        // ISO "YYYY-MM-DD"
  color:        string;
  is_published: boolean;
  created_at:   string;
  updated_at:   string;
}

// ── FAQs  (DB: intranet_faq + intranet_faq_categories) ───────────────────────

// Categories are now DB-driven — keep as string so new categories created via admin work without type changes
export type FAQCategoryLabel = string;

export interface FAQCategory {
  id:         number;
  label:      FAQCategoryLabel;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

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
  id:            number;
  employee_id:   string | null;
  employee_name: string;
  employee_role: string | null;
  employee_dept: string | null;
  avatar_url:    string | null;
  title:         string;
  message:       string;
  category:      SpotlightCategory;
  month:         number | null;
  year:          number | null;
  tag:           string | null;
  tag_color:     string | null;
  tag_bg:        string | null;
  is_published:  boolean;
  published_at:  string | null;
  created_at:    string;
}

// ── Leadership Messages  (DB: intranet_message_from) ─────────────────────────

export interface LeadershipMessage {
  id:           number;
  author_id:    string | null;
  author_name:  string;
  author_role:  string | null;
  author_dept:  string | null;
  avatar_url:   string | null;
  title:        string;
  body:         string;
  is_published: boolean;
  published_at: string | null;
  sort_order:   number;
  created_at:   string;
  updated_at:   string;
}

// ── Feedback  (DB: intranet_feedback) ────────────────────────────────────────

export type FeedbackCategory = "General" | "IT" | "HR" | "Suggestion" | "Complaint";
export type FeedbackStatus = "open" | "in_review" | "resolved" | "closed";

export interface FeedbackEntry {
  id: number;
  submitted_by_id: string | null; // DB: submitted_by FK → employees.id (null if anonymous)
  submitted_by_name: string | null; // denormalised — null if anonymous
  submitted_by_dept: string | null;
  category: FeedbackCategory;    // DB: category VARCHAR(80)
  subject: string;               // DB: subject VARCHAR(200)
  message: string;               // DB: message TEXT
  is_anonymous: boolean;         // DB: is_anonymous BOOLEAN
  status: FeedbackStatus;        // DB: status VARCHAR(20)
  resolved_by_id: string | null;
  resolved_at: string | null;
  created_at: string;            // DB: created_at TIMESTAMPTZ
}

// ── Podcast  (DB: intranet_podcast) ───────────────────────────────────────────

export type PodcastMediaType = "audio" | "video";

export interface PodcastEpisode {
  id:                number;
  episode_number:    number;
  title:             string;
  description:       string | null;
  guest_name:        string | null;
  duration:          string | null;          // e.g. "38 min"
  cover_image_id:    number | null;          // FK → documents.id
  cover_image_url:   string | null;          // resolved from documents join (Cloudinary URL)
  audio_document_id: number | null;          // FK → documents.id (uploaded audio/video file)
  audio_file_url:    string | null;          // resolved from documents join
  embed_url:         string | null;          // YouTube / Vimeo embed URL
  audio_url:         string | null;          // External streaming link (Spotify, Anchor, direct MP3 etc.)
  media_type:        PodcastMediaType;
  is_published:      boolean;
  is_featured:       boolean;
  created_at:        string;
  updated_at:        string;
}
