import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
    label: string;
    href?: string;
    className?: string;
}

export function BackButton({
    label,
    href,
    className = "",
}: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => (href ? router.push(href) : router.back())}
            className={cn(
                "flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors mb-5",
                className
            )}
        >
            <ArrowLeft size={14} />
            {label}
        </button>
    );
}