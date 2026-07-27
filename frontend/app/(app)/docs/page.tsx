import fs from "fs";
import path from "path";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import { FileText } from "lucide-react";

// Docs live at project-root/docs/ — one level above the Next.js frontend
const DOCS_DIR = path.join(process.cwd(), "..", "docs");

interface DocMeta {
  slug:  string;
  title: string;
  file:  string;
}

function getDocMeta(filename: string): DocMeta {
  const slug  = filename.replace(/\.md$/i, "").toLowerCase().replace(/_/g, "-");
  const title = filename
    .replace(/\.md$/i, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { slug, title, file: filename };
}

function listDocs(): DocMeta[] {
  try {
    return fs
      .readdirSync(DOCS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map(getDocMeta)
      .sort((a, b) => a.title.localeCompare(b.title));
  } catch {
    return [];
  }
}

export default function DocsIndexPage() {
  const docs = listDocs();

  return (
    <AppLayout pageTitle="Documentation">
      <PageHeader
        title="Documentation"
        description="Developer guides and integration references for the Portland Gas platform."
        className="mb-8"
      />

      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-secondary gap-3">
          <FileText size={36} />
          <p className="text-sm">No documentation files found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={`/docs/${doc.slug}`}
              className="group bg-white border border-brand-border rounded-2xl p-6 hover:border-brand-purple hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-brand-purple/10 transition-colors">
                  <FileText size={18} className="text-brand-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-text-primary text-sm group-hover:text-brand-purple transition-colors">
                    {doc.title}
                  </p>
                  <p className="text-xs text-brand-text-secondary mt-0.5 font-mono">
                    {doc.file}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
