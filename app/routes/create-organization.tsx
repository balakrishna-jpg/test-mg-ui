/*
 * UNUSED FILE - COMMENTED OUT
 * 
 * This file is not being used anywhere in the codebase.
 * Registration functionality is now handled within LoginForm component
 * (app/components/Auth/LoginForm.tsx) which shows a registration modal
 * when a user enters an email that doesn't exist.
 * 
 * This route was likely an older implementation that has been replaced
 * by the integrated registration flow in the login page.
 */

// import * as React from "react";
// import { useNavigate, Link } from "@remix-run/react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "~/components/ui/select";
// import { Building2, ArrowRight, BadgeCheck ,UserCheck} from "lucide-react";
// import { createOrganization, getElectionStates } from "~/api";

// type FormState = {
//   name: string; // admin name
//   organization_name?: string; // optional
//   age: string;
//   gender: "male" | "female" | "other";
//   email: string;
//   password: string;
//   state_id: string; // backend expects string
//   state_name?: string; // added state_name
//   party_id?: string; // optional - stores party ID as string
// };

// const TAMIL_NADU_PARTIES = [
//   { value: "1", label: "BJP" },
//   { value: "2", label: "DMK" },
//   { value: "3", label: "AIDMK" },
//   { value: "4", label: "Congress" },
//   { value: "999999", label: "Guest" },
// ];

// export default function CreateOrganizationRoute() {
//   const navigate = useNavigate();
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;


//   const [form, setForm] = React.useState<FormState>({
//     name: "",
//     organization_name: "",
//     age: "",
//     gender: "male",
//     email: "",
//     password: "",
//     state_id: "",
//     state_name: "",
//     party_id: "",
//   });
//   const [submitting, setSubmitting] = React.useState(false);
//   const [states, setStates] = React.useState<{ id: string; name: string }[]>([]);
//   const [loadingStates, setLoadingStates] = React.useState(true);
//   const [showPartyDropdown, setShowPartyDropdown] = React.useState(false);
//   const [toast, setToast] = React.useState({ visible: false, message: "", type: "" });

//   // Fetch states on mount
//   React.useEffect(() => {
//     (async () => {
//       try {
//         const res = await getElectionStates();
//         if (Array.isArray(res)) {
//           setStates(
//             res.map((s: any) => ({
//               id: String(s.state_id),
//               name: s.state_name,
//             }))
//           );
//         } else {
//           setToast({ visible: false, message: "Failed to load states.", type: "error" });
//         }
//       } catch (err) {
//         setToast({ visible: false, message: "Failed to load states.", type: "error" });
//       } finally {
//         setLoadingStates(false);
//       }
//     })();
//   }, []);

//   // Toast auto-hide
//   React.useEffect(() => {
//     if (toast.visible) {
//       const timer = setTimeout(() => {
//         setToast({ visible: false, message: "", type: "" });
//       }, 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [toast]);

//   const setField = (key: keyof FormState, val: string) => {
//     setForm((f) => ({ ...f, [key]: val }));

//     // Check if Tamil Nadu is selected and set state_name
//     if (key === "state_id") {
//       const selectedState = states.find((s) => s.id === val);
//       setShowPartyDropdown(selectedState?.name === "Tamil Nadu");
//       // Set state_name when state_id is selected
//       setForm((f) => ({
//         ...f,
//         state_id: val,
//         state_name: selectedState?.name || "",
//         party_id: "" // Reset party if state changes
//       }));
//     }
//   };

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // required only for mandatory fields
//     const required: Array<[keyof FormState, string]> = [
//       ["name", "Admin Name"],
//       ["age", "Age"],
//       ["gender", "Gender"],
//       ["email", "Email"],
//       ["password", "Password"],
//       ["state_id", "State"],
//     ];
//     for (const [k, label] of required) {
//       if (!String(form[k]).trim()) {
//         setToast({ visible: true, message: `Please enter/select ${label}.`, type: "error" });
//         return;
//       }
//     }
//     // If a state is selected, party is mandatory
//     if (form.state_id && !form.party_id?.trim()) {
//       setToast({ visible: true, message: "Please select a Party.", type: "error" });
//       return;
//     }

//     try {
//       setSubmitting(true);
//       const payload = {
//         name: form.name,
//         organization_name: form.organization_name,
//         age: Number(form.age),
//         gender: form.gender,
//         email: form.email,
//         password: form.password,
//         state_id: form.state_id,
//         state_name: form.state_name || undefined,
//         party_id: form.party_id || undefined,
//       };

//       const res = await createOrganization(payload);
//       setToast({
//         visible: true,
//         message: res?.msg || "Organization created successfully.",
//         type: "success",
//       });
//       navigate("/login");
//     } catch (err: any) {
//       const errorMessage = err?.message || "Failed to create organization";
//       setToast({ visible: true, message: errorMessage, type: "error" });
     
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center p-6 create-org-bg">
//       <style>{`
//         .create-org-bg {
// background: linear-gradient(135deg, #002b5b 0%, #e0e7ff 100%);

//         }
//       `}</style>
//       {/* Toast Notification */}
//       {toast.visible && (
//         <div
//           className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
//             }`}
//         >
//           {toast.type === "success" ? (
//             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//             </svg>
//           ) : (
//             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           )}
//           <span className="font-medium">{toast.message}</span>
//         </div>
//       )}

//       <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6">
//         <div className="flex items-center justify-center mb-6">
//           <UserCheck className="h-6 w-6 mr-2 text-gray-600" />
//           <h1 className="text-xl font-semibold">Create Account</h1>
//         </div>

//         <form onSubmit={onSubmit} className="space-y-5">
//           {/* Admin Name */}
//           <div>
//             <span className="block mb-1 text-sm font-medium text-gray-700">Full Name</span>
//             <input
//               type="text"
//               value={form.name}
//               onChange={(e) => setField("name", e.target.value)}
//               placeholder="Your full name"
//               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//             />
//           </div>

//           {/* Organization Name (optional) */}
//           <div>
//             <div className="flex items-center justify-between-start">
//               <span className="mb-1 text-sm font-medium text-gray-700">Organization name</span>
//               <span className="text-gray-500 text-xs">( Optional)</span>
//             </div>
//             <input
//               type="text"
//               value={form.organization_name}
//               onChange={(e) => setField("organization_name", e.target.value)}
//               placeholder="Enter organization name"
//               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//             />
//           </div>

//           {/* Age */}
//           <div>
//             <span className="block mb-1 text-sm font-medium text-gray-700">Age</span>
//             <input
//               type="number"
//               min={18}
//               value={form.age}
//               onChange={(e) => setField("age", e.target.value)}
//               placeholder="e.g., 30"
//               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//             />
//           </div>

//           {/* Gender */}
//           <div>
//             <span className="block mb-1 text-sm font-medium text-gray-700">Gender</span>
//             <div className="relative">
//               <Select
//                 value={form.gender}
//                 onValueChange={(v) => setField("gender", v)}
//               >
//                 <SelectTrigger className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
//                   <SelectValue placeholder="Select gender" />
//                 </SelectTrigger>
//                 <SelectContent className="bg-white border-gray-300">
//                   <SelectItem value="male">Male</SelectItem>
//                   <SelectItem value="female">Female</SelectItem>
//                   <SelectItem value="other">Other</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           {/* Email */}
//           <div>
//             <span className="block mb-1 text-sm font-medium text-gray-700">Email</span>
//             <input
//               type="email"
//               value={form.email}
//               onChange={(e) => setField("email", e.target.value)}
//               placeholder="admin@example.com"
//               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//             />
//           </div>

//           {/* Password */}
//           <div>
//             <span className="block mb-1 text-sm font-medium text-gray-700">Password</span>
//             <input
//               type="password"
//               value={form.password}
//               onChange={(e) => setField("password", e.target.value)}
//               placeholder="Create a strong password"
//               className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
//             />
//           </div>

//           {/* State Dropdown */}
//           <div>
//             <span className="block mb-1 text-sm font-medium text-gray-700">Select State</span>
//             {loadingStates ? (
//               <svg
//                 className="animate-spin h-5 w-5 text-blue-600 mx-auto"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                 ></path>
//               </svg>
//             ) : (
//               <div className="relative">
//                 <Select
//                   value={form.state_id || undefined}
//                   onValueChange={(v) => setField("state_id", v)}
//                 >
//                   <SelectTrigger className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
//                     <SelectValue placeholder="Choose a state" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white border-gray-300">
//                     {states.map((s) => (
//                       <SelectItem key={s.id} value={s.id}>
//                         {s.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}
//           </div>

//           {/* Party (optional) - shows dropdown for Tamil Nadu */}
//           {showPartyDropdown && (
//             <div>
//               <span className="block mb-1 text-sm font-medium text-gray-700">
//                 Party
//               </span>
//               <div className="relative">
//                 <Select
//                   value={form.party_id || undefined}
//                   onValueChange={(v) => setField("party_id", v)}
//                 >
//                   <SelectTrigger className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
//                     <SelectValue placeholder="Select a party" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-white border-gray-300">
//                     {TAMIL_NADU_PARTIES.map((party) => {
//                       const isGuest = party.value === "999999";
//                       return (
//                         <SelectItem key={party.value} value={party.value}>
//                           <div
//                             className={`flex items-center gap-2 ${
//                               isGuest
//                                 ? "bg-slate-100 border border-dashed border-slate-300 rounded px-2 py-1"
//                                 : ""
//                             }`}
//                           >
//                             {isGuest && <BadgeCheck className="h-4 w-4 text-amber-600" />}
//                             <span className={isGuest ? "font-semibold text-slate-800" : ""}>
//                               {party.label}
//                             </span>
//                             {isGuest && (
//                               <span className="ml-auto text-xs text-slate-500">Guest access</span>
//                             )}
//                           </div>
//                         </SelectItem>
//                       );
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           )}

//           {/* Actions */}
//           <div className="flex items-center justify-center pt-2">
//             <button
//               type="submit"
//               disabled={submitting}
//               className={`w-[250px] px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${submitting ? "bg-[#0F172A] cursor-not-allowed" : "bg-[#0F172A] hover:bg-[#0F172A]"
//                 } text-white`}
//             >
//               {submitting ? (
//                 <svg
//                   className="animate-spin h-5 w-5 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                   ></circle>
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
//                   ></path>
//                 </svg>
//               ) : (
//                 <ArrowRight className="h-4 w-4" />
//               )}
//               Create Account
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// Export a minimal component to prevent route errors
export default function CreateOrganizationRoute() {
  return null;
}
