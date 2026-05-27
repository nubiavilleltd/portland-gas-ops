// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";

// import FormInput from "@/components/forms/FormInput";
// import ProfilePicUpload from "@/components/forms/ProfilePicUpload";

// import { drivers } from "@/lib/modules/fleet/mock/drivers.mock";
// import type { Driver } from "@/lib/modules/fleet/types/driver.types";
// import FormSection from "@/components/ui/FormSection";

// export default function AddDriverPage() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     license_number: "",
//     experience_years: "",
//     address: "",
//   });

//   const [profilePic, setProfilePic] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);

//   function handleChange(
//     e: React.ChangeEvent<HTMLInputElement>
//   ) {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   }

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);

//     const newDriver: Driver = {
//       id: `drv-${Date.now()}`,

//       full_name: form.full_name,
//       email: form.email,
//       phone_number: form.phone_number,
//       license_number: form.license_number,
//       experience_years: Number(form.experience_years),

//       status: "available",

//       created_at:
//         new Date().toISOString().split("T")[0],

//       // optional future field (safe to ignore backend for now)
//       profile_image: profilePic
//         ? URL.createObjectURL(profilePic)
//         : undefined,

//       address: form.address,
//     } as Driver;

//     drivers.push(newDriver);

//     console.log("Driver created:", newDriver);

//     setLoading(false);
//     router.push("/fleet/drivers");
//   }

//   return (
//     <AppLayout pageTitle="Add Driver">
//       <PageHeader
//         title="Add Driver"
//         description="Register a new fleet driver for dispatch operations"
//       />

//       <div className="bg-white border border-brand-border rounded-2xl p-6">
//         <form
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 md:grid-cols-2 gap-5"
//         >
//       <FormSection
//   title="Driver Profile"
//   description="Personal and professional information of the driver"
// >
//   {/* PROFILE PIC */}
//   <div className="md:col-span-2">
//     <ProfilePicUpload
//       value={profilePic}
//       onChange={setProfilePic}
//       shape="circle"
//       size={110}
//       fallback={form.full_name?.[0] ?? "D"}
//       label="Driver Profile Picture"
//     />
//   </div>

//   <FormInput
//     label="Full Name"
//     name="full_name"
//     value={form.full_name}
//     onChange={handleChange}
//   />

//   <FormInput
//     label="Email"
//     name="email"
//     value={form.email}
//     onChange={handleChange}
//   />

//   <FormInput
//     label="Phone Number"
//     name="phone_number"
//     value={form.phone_number}
//     onChange={handleChange}
//   />

//   <FormInput
//     label="License Number"
//     name="license_number"
//     value={form.license_number}
//     onChange={handleChange}
//   />

//   <FormInput
//     label="Experience (Years)"
//     name="experience_years"
//     type="number"
//     value={form.experience_years}
//     onChange={handleChange}
//   />

//   {/* NEW FIELD */}
//   <FormInput
//     label="Home Address"
//     name="address"
//     value={form.address}
//     onChange={handleChange}
//   />
// </FormSection>

//           <div className="md:col-span-2 flex justify-end gap-3 mt-4">
//             {/* <Button
//               type="button"
//               variant="outline"
//               onClick={() => router.back()}
//             >
//               Cancel
//             </Button> */}

//             <Button type="submit" disabled={loading}>
//               {loading ? "Saving..." : "Create Driver"}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </AppLayout>
//   );
// }








// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";

// import AppLayout from "@/components/layout/AppLayout";
// import PageHeader from "@/components/ui/PageHeader";
// import Button from "@/components/ui/Button";

// import FormInput from "@/components/forms/FormInput";
// import ProfilePicUpload from "@/components/forms/ProfilePicUpload";
// import FormSection from "@/components/ui/FormSection";

// import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
// import type { Driver } from "@/lib/modules/fleet/types/driver.types";

// export default function AddDriverPage() {
//   const router = useRouter();

//   const [form, setForm] = useState({
//     full_name: "",
//     email: "",
//     phone_number: "",
//     license_number: "",
//     experience_years: "",
//     address: "",
//   });

//   const [profilePic, setProfilePic] = useState<File | null>(null);
//   const [loading, setLoading] = useState(false);

//   function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       const payload: Omit<Driver, "id" | "created_at"> = {
//         full_name: form.full_name,
//         email: form.email,
//         phone_number: form.phone_number,
//         license_number: form.license_number,
//         experience_years: Number(form.experience_years),
//         status: "available",
//         address: form.address,
//         profile_image: URL.createObjectURL(profilePic)
//       };

//       const newDriver = await DriversService.createDriver(payload);

//       console.log("Driver created:", newDriver);

//       router.push("/fleet/drivers");
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <AppLayout pageTitle="Add Driver">
//       <PageHeader
//         title="Add Driver"
//         description="Register a new fleet driver for dispatch operations"
//       />

//       <div className="bg-white border border-brand-border rounded-2xl p-6">
//         <form
//           onSubmit={handleSubmit}
//           className="grid grid-cols-1 md:grid-cols-2 gap-5"
//         >
//           <FormSection
//             title="Driver Profile"
//             description="Personal and professional information of the driver"
//           >
//             <div className="md:col-span-2">
//               <ProfilePicUpload
//                 value={profilePic}
//                 onChange={setProfilePic}
//                 shape="circle"
//                 size={110}
//                 fallback={form.full_name?.[0] ?? "D"}
//                 label="Driver Profile Picture"
//               />
//             </div>

//             <FormInput
//               label="Full Name"
//               name="full_name"
//               value={form.full_name}
//               onChange={handleChange}
//             />

//             <FormInput
//               label="Email"
//               name="email"
//               value={form.email}
//               onChange={handleChange}
//             />

//             <FormInput
//               label="Phone Number"
//               name="phone_number"
//               value={form.phone_number}
//               onChange={handleChange}
//             />

//             <FormInput
//               label="License Number"
//               name="license_number"
//               value={form.license_number}
//               onChange={handleChange}
//             />

//             <FormInput
//               label="Experience (Years)"
//               name="experience_years"
//               type="number"
//               value={form.experience_years}
//               onChange={handleChange}
//             />

//             <FormInput
//               label="Home Address"
//               name="address"
//               value={form.address}
//               onChange={handleChange}
//             />
//           </FormSection>

//           <div className="md:col-span-2 flex justify-end gap-3 mt-4">
//             <Button type="submit" disabled={loading}>
//               {loading ? "Saving..." : "Create Driver"}
//             </Button>
//           </div>
//         </form>
//       </div>
//     </AppLayout>
//   );
// }





"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import FormInput from "@/components/forms/FormInput";
import ProfilePicUpload from "@/components/forms/ProfilePicUpload";
import FormSection from "@/components/ui/FormSection";

import { DriversService } from "@/lib/modules/fleet/services/drivers.service";
import { UploadService } from "@/lib/services/upload.service";
import type { Driver } from "@/lib/modules/fleet/types/driver.types";

export default function AddDriverPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    license_number: "",
    experience_years: "",
    address: "",
  });

  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Upload image FIRST (if exists)
      let profileImageUrl: string | undefined = undefined;

      if (profilePic) {
        profileImageUrl = await UploadService.uploadImage(profilePic);
      }

      // 2. Build clean domain payload (NO File, NO object URL)
      const payload: Omit<Driver, "id" | "created_at"> = {
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        license_number: form.license_number,
        experience_years: Number(form.experience_years),
        status: "available",
        address: form.address,
        profile_image: profileImageUrl as string,
      };

      // 3. Persist via service
      const newDriver = await DriversService.createDriver(payload);

      console.log("Driver created:", newDriver);

      router.push("/fleet/drivers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout pageTitle="Add Driver">
      <PageHeader
        title="Add Driver"
        description="Register a new fleet driver for dispatch operations"
      />

      <div className="bg-white border border-brand-border rounded-2xl p-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <FormSection
            title="Driver Profile"
            description="Personal and professional information of the driver"
          >
            <div className="md:col-span-2">
              <ProfilePicUpload
                value={profilePic}
                onChange={setProfilePic}
                shape="circle"
                size={110}
                fallback={form.full_name?.[0] ?? "D"}
                label="Driver Profile Picture"
              />
            </div>

            <FormInput
              label="Full Name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
            />

            <FormInput
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />

            <FormInput
              label="Phone Number"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
            />

            <FormInput
              label="License Number"
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
            />

            <FormInput
              label="Experience (Years)"
              name="experience_years"
              type="number"
              value={form.experience_years}
              onChange={handleChange}
            />

            <FormInput
              label="Home Address"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </FormSection>

          <div className="md:col-span-2 flex justify-end gap-3 mt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Driver"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}