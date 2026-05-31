// // "use client";

// // import AppLayout from "@/components/layout/AppLayout";
// // import PageHeader from "@/components/ui/PageHeader";
// // import Button from "@/components/ui/Button";
// // import ApprovalBadge from "@/components/ui/ApprovalBadge";

// // import {
// //   getDrivers,
// // } from "@/lib/modules/fleet/selectors/drivers.selectors";

// // export default function DriversPage() {
// //   const drivers = getDrivers();

// //   return (
// //     <AppLayout pageTitle="Drivers">

// //       <PageHeader
// //         title="Drivers"
// //         description="Manage fleet drivers and assignments"
// //         action={
// //           <Button href="/fleet/drivers/new">
// //             Add Driver
// //           </Button>
// //         }
// //       />

// //       <div className="bg-white border border-brand-border rounded-2xl p-6">

// //         {drivers.length === 0 ? (
// //           <p className="text-sm text-brand-text-secondary">
// //             No drivers found.
// //           </p>
// //         ) : (
// //           <div className="overflow-x-auto">

// //             <table className="w-full text-sm">

// //               <thead>
// //                 <tr className="border-b border-brand-border text-left">

// //                   <th className="pb-3">Driver</th>
// //                   <th className="pb-3">Phone</th>
// //                   <th className="pb-3">License</th>
// //                   <th className="pb-3">Status</th>
// //                   <th className="pb-3 text-right">Actions</th>

// //                 </tr>
// //               </thead>

// //               <tbody>

// //                 {drivers.map((driver) => (
// //                   <tr
// //                     key={driver.id}
// //                     className="border-b border-brand-border"
// //                   >

// //                     <td className="py-4">
// //                       <p className="font-medium">
// //                         {driver.full_name}
// //                       </p>

// //                       <p className="text-xs text-brand-text-secondary">
// //                         {driver.email}
// //                       </p>
// //                     </td>

// //                     <td>
// //                       {driver.phone_number}
// //                     </td>

// //                     <td>
// //                       {driver.license_number}
// //                     </td>

// //                     <td>
// //                       <DriverStatusBadge status={driver.status} />
// //                     </td>

// //                     <td className="text-right">
// //                       <Button
// //                         size="sm"
// //                         variant="outline"
// //                         href={`/fleet/drivers/${driver.id}`}
// //                       >
// //                         View
// //                       </Button>
// //                     </td>

// //                   </tr>
// //                 ))}

// //               </tbody>

// //             </table>

// //           </div>
// //         )}

// //       </div>

// //     </AppLayout>
// //   );
// // }

// // /* --------------------------------------------
// //    STATUS BADGE
// // ---------------------------------------------*/

// // function DriverStatusBadge({
// //   status,
// // }: {
// //   status: string;
// // }) {
// //   if (status === "active") {
// //     return <ApprovalBadge status="approved" />;
// //   }

// //   if (status === "on_trip") {
// //     return <ApprovalBadge status="in_progress" />;
// //   }

// //   return <ApprovalBadge status="rejected" />;
// // }






// "use client";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";
// import ApprovalBadge from "@/components/ui/ApprovalBadge";

// import {
//   getDrivers,
// } from "@/lib/modules/fleet/selectors/drivers.selectors";

// export default function DriversPage() {
//   const drivers = getDrivers();

//   return (
//     <AppLayout pageTitle="Drivers">
//       <PageHeader
//         title="Drivers"
//         description="Manage fleet drivers and assignments"
//         action={
//           <Button href="/fleet/drivers/new">
//             Add Driver
//           </Button>
//         }
//       />

//       <div className="bg-white border border-brand-border rounded-2xl p-6">
//         {drivers.length === 0 ? (
//           <p className="text-sm text-brand-text-secondary">
//             No drivers found.
//           </p>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-brand-border text-left">
//                   <th className="pb-3">Driver</th>
//                   <th className="pb-3">Phone</th>
//                   <th className="pb-3">License</th>
//                   <th className="pb-3">Status</th>
//                   <th className="pb-3 text-right">Actions</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {drivers.map((driver) => (
//                   <tr
//                     key={driver.id}
//                     className="border-b border-brand-border"
//                   >
//                     <td className="py-4">
//                       <p className="font-medium">
//                         {driver.full_name}
//                       </p>
//                       <p className="text-xs text-brand-text-secondary">
//                         {driver.email}
//                       </p>
//                     </td>

//                     <td>{driver.phone_number}</td>

//                     <td>{driver.license_number}</td>

//                     <td>
//                       <DriverStatusBadge status={driver.status} />
//                     </td>

//                     <td className="text-right">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         href={`/fleet/drivers/${driver.id}`}
//                       >
//                         View
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </AppLayout>
//   );
// }

// /* ------------------------------------------------
//    FLEET DRIVER STATUS BADGE (FIXED DOMAIN LOGIC)
// -------------------------------------------------*/

// function DriverStatusBadge({ status }: { status: string }) {
//   const map: Record<string, string> = {
//     active: "available",
//     on_trip: "in_use",
//     inactive: "retired",
//     suspended: "maintenance",
//   };

//   const mappedStatus = map[status] || "retired";

//   return <ApprovalBadge status={mappedStatus} />;
// }






"use client";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";


import { FleetStatusBadge } from "@/lib/modules/fleet/badges/FleetStatusBadge";







import DataTable, { type Column } from "@/components/ui/DataTable";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";
import { useDrivers } from "@/lib/modules/fleet/hooks/useDrivers";

const columns: Column<Driver>[] = [
  {
    key: "full_name",
    label: "Driver",
    render: (_value, driver) => (
      <div>
        <p className="font-medium">{driver.full_name}</p>
        <p className="text-xs text-brand-text-secondary">{driver.email}</p>
      </div>
    ),
  },
  {
    key: "phone_number",
    label: "Phone",
  },
  {
    key: "license_number",
    label: "License",
  },
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <FleetStatusBadge status={value as Driver["status"]} />
    ),
  },
  // {
  //   key: "id",
  //   label: "Actions",
  //   render: (_value, driver) => (
  //     <div className="flex justify-end">
  //       <Button size="sm" variant="outline" href={`/fleet/drivers/${driver.id}`}>
  //         View
  //       </Button>
  //     </div>
  //   ),
  // },
];

// Replace the entire <div className="bg-white border ..."> block with:


export default function DriversPage() {
  const {drivers} = useDrivers();

  return (
    <AppLayout pageTitle="Drivers">
      <PageHeader
        title="Drivers"
        description="Manage fleet drivers and assignments"
        action={
          <Button href="/fleet/drivers/new">
            Add Driver
          </Button>
        }
      />

      <DataTable<Driver>
  columns={columns}
  data={drivers}
  rowHref={(driver) => `/fleet/drivers/${driver.id}`}
  emptyMessage="No drivers found."
/>
    </AppLayout>
  );
}

/* --------------------------------------------
   DRIVER STATUS LABEL (FIXED DOMAIN VERSION)
---------------------------------------------*/

