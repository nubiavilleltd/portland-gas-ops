import fs from "fs";
import path from "path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

const DOCS_DIR = path.join(process.cwd(), "..", "docs");

function slugToFilename(slug: string): string | null {
  try {
    const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
    return (
      files.find(
        (f) => f.replace(/\.md$/i, "").toLowerCase().replace(/_/g, "-") === slug
      ) ?? null
    );
  } catch {
    return null;
  }
}

function fileToTitle(filename: string): string {
  return filename
    .replace(/\.md$/i, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Next.js 15+ — params is a Promise and must be awaited
export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const filename = slugToFilename(slug);
  if (!filename) notFound();

  let content = "";
  try {
    content = fs.readFileSync(path.join(DOCS_DIR, filename!), "utf-8");
  } catch {
    notFound();
  }

  const title = fileToTitle(filename!);

  return (
    <AppLayout pageTitle={title}>
      <div className="mb-6">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Documentation
        </Link>
      </div>

      <div className="bg-white border border-brand-border rounded-2xl px-8 py-8">
        <MarkdownRenderer content={content} />
      </div>
    </AppLayout>
  );
}
