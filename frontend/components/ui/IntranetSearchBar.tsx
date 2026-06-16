import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function IntranetSearchBar({ value, onChange, placeholder = "Search…", className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white rounded-full pl-12 pr-14 py-3.5 text-gray-700 placeholder:text-gray-400 text-sm outline-none shadow-xl transition-all duration-150"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 h-6 px-2 bg-gray-100 rounded text-gray-400 text-xs font-mono flex items-center pointer-events-none">
        /
      </div>
    </div>
  );
}
