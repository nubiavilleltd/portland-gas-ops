"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column, type DataTableAction } from "@/components/ui/DataTable";
import ActionModal from "@/components/ui/ActionModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import FormInput from "@/components/forms/FormInput";
import FormTextarea from "@/components/forms/FormTextarea";
import FormSelect from "@/components/forms/FormSelect";
import FormDatePicker from "@/components/forms/FormDatePicker";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { BackButton } from "@/components/ui/BackButton";
import Tip from "@/components/ui/Tip";
import { useIntranetEventsAdmin } from "@/lib/modules/intranet/queries";
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useToggleEventPublished,
} from "@/lib/modules/intranet/mutations";
import { useToast } from "@/hooks/useToast";
import type { IntranetEvent, EventType } from "@/lib/modules/intranet/types/intranet.types";

// DataTable requires id: string
type EventRow = Omit<IntranetEvent, "id"> & { id: string; _numId: number };

const TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "Town Hall", label: "Town Hall" },
  { value: "Training",  label: "Training" },
  { value: "Deadline",  label: "Deadline" },
  { value: "Workshop",  label: "Workshop" },
  { value: "Social",    label: "Social" },
];

const COLOR_PRESETS = [
  { label: "Purple", value: "#7234BD" },
  { label: "Green",  value: "#166534" },
  { label: "Red",    value: "#C2410C" },
  { label: "Blue",   value: "#1E40AF" },
  { label: "Amber",  value: "#B45309" },
];

const TYPE_BADGE: Record<EventType, "purple" | "info" | "danger" | "warning" | "success"> = {
  "Town Hall": "purple",
  "Training":  "info",
  "Deadline":  "danger",
  "Workshop":  "warning",
  "Social":    "success",
};

const LOCATION_OPTIONS = [
  { value: "physical", label: "Physical" },
  { value: "virtual",  label: "Virtual" },
];

const columns: Column<EventRow>[] = [
  {
    key: "title",
    label: "Title",
    render: (_, row) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
        <div className="min-w-0">
          <p className="font-medium text-brand-text-primary truncate max-w-xs">{row.title}</p>
          <p className="text-xs text-brand-text-secondary mt-0.5 truncate max-w-xs">{row.location ?? "Online"}</p>
        </div>
      </div>
    ),
  },
  {
    key: "event_type",
    label: "Type",
    render: (_, row) => <Badge variant={TYPE_BADGE[row.event_type]} label={row.event_type} />,
  },
  {
    key: "event_date",
    label: "Date",
    render: (_, row) => (
      <span className="text-sm text-brand-text-secondary">
        {new Date(row.event_date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    ),
  },
  {
    key: "is_published",
    label: "Status",
    render: (_, row) => (
      <Badge variant={row.is_published ? "success" : "neutral"} label={row.is_published ? "Published" : "Draft"} />
    ),
  },
];

const EMPTY_FORM = {
  title:         "",
  description:   "",
  event_type:    "Town Hall" as EventType,
  location_type: "physical" as "physical" | "virtual",
  location:      "",
  virtual_link:  "",
  event_date:    "",
  color:         "#7234BD",
  is_published:  false,
};
type FormState = typeof EMPTY_FORM;

function isPast(dateStr: string) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr + "T00:00:00") < today;
}

export default function IntranetEventsPage() {
  const { data: events = [], isLoading, isFetching } = useIntranetEventsAdmin();
  const createMutation = useCreateEvent();
  const deleteMutation = useDeleteEvent();
  const toggleMutation = useToggleEventPublished();
  const toast = useToast();

  const [modalOpen,           setModalOpen]           = useState(false);
  const [deleteId,            setDeleteId]            = useState<number | null>(null);
  const [editTarget,          setEditTarget]          = useState<IntranetEvent | null>(null);
  const [form,                setForm]                = useState<FormState>(EMPTY_FORM);
  const [toggleTarget,        setToggleTarget]        = useState<number | null>(null);
  const [toggleConfirmTarget, setToggleConfirmTarget] = useState<EventRow | null>(null);

  // Per-edit-target update mutation (id changes per row)
  const updateMutation = useUpdateEvent(editTarget?.id ?? 0);

  const rows: EventRow[] = events.map((e) => ({ ...e, id: String(e.id), _numId: e.id }));

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(row: EventRow) {
    const item = events.find((e) => e.id === row._numId)!;
    setEditTarget(item);
    setForm({
      title:         item.title,
      description:   item.description ?? "",
      event_type:    item.event_type,
      location_type: item.virtual_link ? "virtual" : "physical",
      location:      item.location ?? "",
      virtual_link:  item.virtual_link ?? "",
      event_date:    item.event_date,
      color:         item.color,
      is_published:  item.is_published,
    });
    setModalOpen(true);
  }

  function handleClose() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Event title is required."); return; }
    if (!form.event_date)   { toast.error("Event date is required."); return; }
    const payload = {
      title:        form.title,
      description:  form.description || null,
      event_type:   form.event_type,
      location:     form.location_type === "physical" ? (form.location || null) : null,
      virtual_link: form.location_type === "virtual"  ? (form.virtual_link || null) : null,
      event_date:   form.event_date,
      color:        form.color,
      is_published: form.is_published,
    };
    try {
      if (editTarget) {
        await updateMutation.mutateAsync(payload);
        toast.success("Event updated.");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Event created.");
      }
      handleClose();
    } catch {
      toast.error("Failed to save event.");
    }
  }

  async function handleToggle() {
    if (!toggleConfirmTarget) return;
    const row = toggleConfirmTarget;
    setToggleConfirmTarget(null);
    setToggleTarget(row._numId);
    try {
      await toggleMutation.mutateAsync(row._numId);
      toast.success(row.is_published ? "Event unpublished." : "Event published.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setToggleTarget(null);
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Event deleted.");
    } catch {
      toast.error("Failed to delete event.");
    }
    setDeleteId(null);
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  const tableActions: DataTableAction<EventRow>[] = [
    {
      key: "toggle",
      label: "",
      icon: (row) =>
        toggleMutation.isPending && toggleTarget === row._numId
          ? <Loader2 size={14} className="animate-spin" />
          : <Tip label={row.is_published ? "Unpublish Event" : "Publish Event"}>{row.is_published ? <EyeOff size={14} /> : <Eye size={14} />}</Tip>,
      variant: "ghost",
      onClick: (row) => setToggleConfirmTarget(row),
    },
    {
      key: "edit",
      label: "",
      icon: <Tip label="Edit Event"><Pencil size={14} /></Tip>,
      variant: "ghost",
      hidden: (row) => isPast(row.event_date),
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      label: "",
      icon: <Tip label="Delete Event"><Trash2 size={14} /></Tip>,
      variant: "ghost",
      className: "hover:bg-red-50 hover:text-red-600",
      onClick: (row) => setDeleteId(row._numId),
    },
  ];

  return (
    <AppLayout pageTitle="Events">
      <BackButton href="/admin" label="Back to Admin" />
      <PageHeader
        title="Events"
        description="Manage upcoming events displayed on the intranet calendar and events page"
        className="mb-6"
        action={
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
            New Event
          </Button>
        }
      />

      <DataTable<EventRow>
        columns={columns}
        data={rows}
        isLoading={isLoading || isFetching}
        showActions
        actions={tableActions}
        actionsLabel="Actions"
        searchable
        searchPlaceholder="Search events…"
        emptyMessage="No events yet."
        emptyDescription="Click 'New Event' to add one."
      />

      {/* Create / Edit panel */}
      <ActionModal
        open={modalOpen}
        onClose={handleClose}
        title={editTarget ? "Edit Event" : "New Event"}
        variant="panel"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={handleClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} loadingText="Saving…">Save</Button>
          </>
        }
      >
        <div className="space-y-5">
          <FormInput
            label="Title"
            required
            placeholder="Event name"
            value={form.title}
            onChange={(e) => field("title", e.target.value)}
          />
          <FormSelect
            label="Type"
            required
            options={TYPE_OPTIONS}
            value={form.event_type}
            onValueChange={(v) => field("event_type", v as EventType)}
          />
          <FormDatePicker
            label="Date"
            required
            min={new Date().toISOString().split("T")[0]}
            value={form.event_date}
            onValueChange={(v) => field("event_date", v)}
          />
          <div className="space-y-3">
            <SegmentedControl
              label="Location Type"
              options={LOCATION_OPTIONS}
              value={form.location_type}
              onChange={(v) => field("location_type", v as "physical" | "virtual")}
            />
            {form.location_type === "physical" ? (
              <FormInput
                label="Venue"
                placeholder="e.g. Board Room, Head Office"
                value={form.location}
                onChange={(e) => field("location", e.target.value)}
              />
            ) : (
              <FormInput
                label="Meeting Link"
                placeholder="https://meet.google.com/…"
                value={form.virtual_link}
                onChange={(e) => field("virtual_link", e.target.value)}
              />
            )}
          </div>
          <FormTextarea
            label="Description"
            placeholder="Optional details about the event…"
            value={form.description}
            onChange={(e) => field("description", e.target.value)}
            rows={3}
          />
          <div>
            <p className="text-sm font-medium text-brand-text-primary mb-2">Colour Theme</p>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  title={p.label}
                  onClick={() => field("color", p.value)}
                  className="h-7 w-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: p.value,
                    borderColor: form.color === p.value ? "#111" : "transparent",
                    outline: form.color === p.value ? "2px solid #fff" : "none",
                    outlineOffset: "-3px",
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => field("color", e.target.value)}
                className="h-7 w-7 rounded-full border border-brand-border cursor-pointer"
                title="Custom colour"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => field("is_published", e.target.checked)}
              className="w-4 h-4 accent-brand-purple"
            />
            <span className="text-sm text-brand-text-primary">Publish immediately</span>
          </label>
        </div>
      </ActionModal>

      <ConfirmDialog
        open={toggleConfirmTarget !== null}
        title={toggleConfirmTarget?.is_published ? "Unpublish Event" : "Publish Event"}
        message={
          toggleConfirmTarget?.is_published
            ? "This event will be hidden from the intranet calendar and events page."
            : "This event will become visible to all staff on the intranet."
        }
        confirmLabel={toggleConfirmTarget?.is_published ? "Unpublish" : "Publish"}
        destructive={toggleConfirmTarget?.is_published ?? false}
        onConfirm={handleToggle}
        onCancel={() => setToggleConfirmTarget(null)}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Event"
        message="This will remove the event from the intranet calendar. This action cannot be undone."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </AppLayout>
  );
}
