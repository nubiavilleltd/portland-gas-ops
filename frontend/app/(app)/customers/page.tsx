// "use client";

// import Link from "next/link";
// import { customers } from "@/lib/mock/customers";
// import AppLayout from "@/components/layout/AppLayout";

// export default function CustomersPage() {
//   return (

//     <AppLayout pageTitle="Customers">
//          <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-xl font-bold">Customers</h1>

//         <Link
//           href="/customers/new"
//           className="px-4 py-2 bg-black text-white rounded"
//         >
//           + New Customer
//         </Link>
//       </div>

//       <div className="grid gap-4">
//         {customers.map((customer) => (
//           <div
//             key={customer.id}
//             className="border p-4 rounded flex justify-between"
//           >
//             <div>
//               <h2 className="font-semibold">{customer.name}</h2>
//               <p className="text-sm text-gray-600">{customer.type}</p>
//               <p className="text-sm">{customer.phone}</p>
//             </div>

//             <div className="text-sm text-gray-500">
//               {customer.address}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//     </AppLayout>
   
//   );
// }






"use client";

import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { customers } from "@/lib/modules/customers/mock/customers.mock";
// import { customers } from "@/lib/mock/customers";

type Customer = {
  id: string;
  name: string;
  type: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
};

const columns: Column<Customer>[] = [
  { key: "name", label: "Customer Name" },
  { key: "type", label: "Type" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
];

export default function CustomersPage() {
  return (
    <AppLayout pageTitle="Customers">
      <PageHeader
        title="Customers"
        description="Manage customer records and contact details"
        action={
          <Link
            href="/customers/new"
            className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
          >
            + New Customer
          </Link>
        }
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={customers}
        rowHref={(r) => `/customers/${r.id}`}
      />
    </AppLayout>
  );
}