import {
  Users,
  UserCheck,
  ClipboardList,
  Contact,
  TrendingUp,
} from "lucide-react";

type Props = {
  totalCustomers: number;
  activeCustomers: number;
  pendingCustomers: number;
  totalContacts: number;
};

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white  bg-gradient-to-br from-white to-purple-50/60 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* Top Accent */}
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-brand-primary via-violet-500 to-fuchsia-500" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-text-secondary">
            {title}
          </p>

          <h2 className="mt-3 text-4xl font-bold tracking-tight text-brand-text">
            {value}
          </h2>

          {/* <div className="mt-4 flex items-center gap-2 text-xs font-medium text-brand-primary">
            <TrendingUp size={14} />
            CRM Overview
          </div> */}
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary to-violet-600 text-white shadow-md transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function CRMStatCards({
  totalCustomers,
  activeCustomers,
  pendingCustomers,
  totalContacts,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Customers"
        value={totalCustomers}
        icon={<Users size={24} />}
      />

      <StatCard
        title="Active Customers"
        value={activeCustomers}
        icon={<UserCheck size={24} />}
      />

      <StatCard
        title="Pending Onboarding"
        value={pendingCustomers}
        icon={<ClipboardList size={24} />}
      />

      <StatCard
        title="Total Contacts"
        value={totalContacts}
        icon={<Contact size={24} />}
      />
    </div>
  );
}
