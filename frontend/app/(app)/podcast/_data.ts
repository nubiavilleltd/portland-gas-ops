// Shared podcast data for the public intranet podcast pages.
// When the backend is wired up, replace this with API calls.

// Picsum photos seeded by ID so they're consistent across renders
const PIC = (id: number) => `https://picsum.photos/seed/pg-pod-${id}/400/400`;

export const PODCAST_EPISODES = [
  {
    id: 1,
    episode_number: 12,
    title: "Nigeria's Gas-to-Power Opportunity — EP. 12",
    guest_name: "MD & Chief Engineer",
    duration: "38 min",
    cover_image_url: PIC(12),
    audio_url: "",
    media_type: "audio" as const,
    is_published: true,
    is_featured: true,
  },
  {
    id: 2,
    episode_number: 11,
    title: "Pipeline Safety & Inspection Standards",
    guest_name: "Chief Operating Officer",
    duration: "44 min",
    cover_image_url: PIC(11),
    audio_url: "",
    media_type: "audio" as const,
    is_published: true,
    is_featured: false,
  },
  {
    id: 3,
    episode_number: 10,
    title: "Building a Culture of HSE Excellence",
    guest_name: "Head of HSE",
    duration: "31 min",
    cover_image_url: PIC(10),
    audio_url: "",
    media_type: "audio" as const,
    is_published: true,
    is_featured: false,
  },
  {
    id: 4,
    episode_number: 9,
    title: "Procurement & Vendor Management in the Field",
    guest_name: "Procurement Director",
    duration: "27 min",
    cover_image_url: PIC(9),
    audio_url: "",
    media_type: "audio" as const,
    is_published: true,
    is_featured: false,
  },
];
