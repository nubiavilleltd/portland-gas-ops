// app/(app)/error.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { parseError } from "@/lib/errors";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  const router = useRouter();

  useEffect(() => {
    // FUTURE: log to Sentry / Datadog here
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <div>
        <p className="font-semibold text-brand-text-primary mb-1">
          Something went wrong
        </p>
        <p className="text-sm text-brand-text-secondary max-w-sm">
          {parseError(error)}
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/")}>
          Go home
        </Button>
        <Button onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}