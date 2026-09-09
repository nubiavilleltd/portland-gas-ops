// "use client";

// import { useState } from "react";
// import AppSidebar from "./AppSidebar";
// import AppHeader from "./AppHeader";
// import NotificationToaster from "./NotificationToaster";
// import PushManager from "./PushManager";

// interface Props {
//   children: React.ReactNode;
//   pageTitle?: string;
// }

// export default function AppLayout({ children, pageTitle }: Props) {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   return (
//     <div className="flex min-h-screen bg-brand-bg">
//       <NotificationToaster />
//       <PushManager />
//       <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

//       {/* Mobile backdrop */}
//       {sidebarOpen && (
//         <div
//           className="fixed inset-0 z-20 bg-black/50 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Main content — offset by sidebar width on desktop only */}
//       <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-64">
//         <AppHeader
//           pageTitle={pageTitle}
//           onMenuClick={() => setSidebarOpen(true)}
//         />
//         {/* No animate-page-enter here — that animation uses transform which changes the
//             containing block for fixed descendants (modals), breaking their positioning */}
//         <main className="min-w-0 flex-1 p-4 md:p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }






"use client";

import { useState } from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";
import NotificationToaster from "./NotificationToaster";
import PushManager from "./PushManager";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function AppLayout({ children, pageTitle }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen print:min-h-0 bg-brand-bg">
      <NotificationToaster />
      <PushManager />
      <div className="print:hidden">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content — offset by sidebar width on desktop only */}
      <div className="flex min-h-screen print:min-h-0 min-w-0 flex-1 flex-col lg:ml-64 print:ml-0">
        <div className="print:hidden">
          <AppHeader
            pageTitle={pageTitle}
            onMenuClick={() => setSidebarOpen(true)}
          />
        </div>
        {/* No animate-page-enter here — that animation uses transform which changes the
            containing block for fixed descendants (modals), breaking their positioning */}
        <main className="min-w-0 flex-1 p-4 md:p-6 print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
