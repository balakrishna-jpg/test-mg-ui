// import { useEffect, useRef, useState } from "react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "~/components/ui/select";
// import { Button } from "~/components/ui/button";
// import { Input } from "~/components/ui/input";
// import { Label } from "~/components/ui/label";
// import {
//   Plus,
//   Loader2,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   Upload,
//   Send,
// } from "lucide-react";
// import { message } from "antd";
// import {
//   getAssemblyConstituencies,
//   getInvitationStats,
//   getCandidates,
//   sendBulkInvitations,
//   getUsersByConstituency,
//   createUsersBulkFile,
// } from "~/api";

// export default function Whatsapp() {
//   const [stateId, setStateId] = useState("21"); // Default: Tamil Nadu
//   const [constituencies, setConstituencies] = useState([]);
//   const [selectedConstituency, setSelectedConstituency] = useState("");
//   const [candidates, setCandidates] = useState([]);
//   const [selectedCandidate, setSelectedCandidate] = useState("");
//   const [users, setUsers] = useState([]);
//   const [filteredUsers, setFilteredUsers] = useState([]);
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [file, setFile] = useState(null);
//   const [uploadLoading, setUploadLoading] = useState(false);
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [isUploaded, setIsUploaded] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const wsRef = useRef(null); // WebSocket reference

//   useEffect(() => {
//     fetchConstituencies();
//     fetchCandidates();
//   }, [stateId]);


//   useEffect(() => {
//     if (!selectedConstituency) {
//       setStats(null);
//       setUsers([]);
//       setFilteredUsers([]);
//       return;
//     }

//     const fetchData = async () => {
//       await Promise.all([
//         fetchStats(selectedConstituency, selectedCandidate || null),
//         fetchUsers(selectedConstituency, selectedCandidate || null),
//       ]);
//     };

//     // Initial fetch
//     fetchData();

//     // Poll every 30 seconds
//     const interval = setInterval(fetchData, 30000);

//     return () => clearInterval(interval);
//   }, [selectedConstituency, selectedCandidate]);


//   useEffect(() => {
//     let tempUsers = users.slice();
//     if (fromDate) {
//       const from = new Date(fromDate);
//       tempUsers = tempUsers.filter(
//         (user) =>
//           user.invitation_sent_at &&
//           new Date(user.invitation_sent_at) >= from
//       );
//     }
//     if (toDate) {
//       const to = new Date(toDate);
//       to.setHours(23, 59, 59, 999);
//       tempUsers = tempUsers.filter(
//         (user) =>
//           user.invitation_sent_at &&
//           new Date(user.invitation_sent_at) <= to
//       );
//     }
//     setFilteredUsers(tempUsers);
//     setCurrentPage(1);
//   }, [users, fromDate, toDate]);




//   const fetchConstituencies = async () => {
//     setLoading(true);
//     try {
//       const data = await getAssemblyConstituencies(stateId);
//       setConstituencies(data.constituencies || []);
//     } catch (err) {
//       console.error("fetchConstituencies error:", err);
//       message.error("Failed to fetch constituencies");
//     } finally {
//       setLoading(false);
//     }
//   };


//   const fetchCandidates = async () => {
//     try {
//       const data = await getCandidates();
//       setCandidates(data.data || []);
//     } catch (err) {
//       console.error("fetchCandidates error:", err);
//       message.error("Failed to fetch candidates");
//     }
//   };

//   const fetchUsers = async (constituencyId, candidateId = null) => {
//     setLoading(true);
//     try {
//       const data = await getUsersByConstituency(constituencyId, candidateId);
//       const rawUsers = data.data || [];

//       const usersWithInvitations = rawUsers.map((user) => ({
//         ...user,
//         status: user.status || user.whatsapp_status || "PENDING",
//         user_response: user.opt_in_status ?? user.user_response ?? null,
//         invitation_sent_at: user.invitation_sent_at || null,
//         response_received_at: user.response_received_at || null,
//         failed_reason: user.failed_reason || null,
//       }));

//       setUsers(usersWithInvitations);
//       setFilteredUsers(usersWithInvitations);
//     } catch (err) {
//       console.error("fetchUsers error:", err);
//       message.error("Failed to fetch users");
//     } finally {
//       setLoading(false);
//     }
//   };


//   const fetchStats = async (constituencyId, candidateId = null) => {
//     setLoading(true);
//     try {
//       const params = {};
//       if (fromDate) params.from_date = fromDate;
//       if (toDate) params.to_date = toDate;
//       if (candidateId) params.candidate_id = candidateId;

//       const data = await getInvitationStats(constituencyId, params);
//       setStats(data?.data || null);
//     } catch (err) {
//       console.error("fetchStats error:", err);

//       // Check if it's a "Candidate not found" error
//       const errorDetail = err?.response?.data?.detail || err?.detail || err?.message || "";

//       if (errorDetail.includes("Candidate not found")) {
//         message.warning("No candidate found for this constituency");
//         setStats(null); // Reset stats to show zeros
//       } else {
//         message.error("Failed to fetch invitation stats");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };


//   const handleConstituencyChange = (value) => {
//     setSelectedConstituency(value);
//     setSelectedCandidate("");
//     setCurrentPage(1);
//     setIsUploaded(false);
//   };

//   const handleCandidateChange = (value) => {
//     setSelectedCandidate(value === "all" ? "" : value);
//     setCurrentPage(1);
//   };

//   const handleSendBulk = async () => {
//     if (!selectedConstituency) return message.error("Select a constituency first");
//     setLoading(true);
//     try {
//       const response = await sendBulkInvitations({
//         assembly_constituency_id: selectedConstituency,
//       });
//       message.success(response.message || "Bulk send initiated");
//       await fetchStats(selectedConstituency, selectedCandidate || null);
//       await fetchUsers(selectedConstituency, selectedCandidate || null);
//     } catch (err) {
//       console.error("handleSendBulk error:", err);
//       message.error("Failed to send bulk invitations");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleFileChange = (e) => {
//     setFile(e.target.files?.[0] ?? null);
//   };

//   const handleUpload = async () => {
//     if (!file || !selectedConstituency) {
//       return message.error("Please select a file and constituency");
//     }
//     const selectedConst = constituencies.find(
//       (c) => c.assembly_constituency_no.toString() === selectedConstituency
//     );
//     if (!selectedConst) {
//       return message.error("Invalid constituency selected");
//     }
//     setUploadLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       formData.append("assembly_constituency_id", selectedConstituency);
//       formData.append(
//         "assembly_constituency_name",
//         selectedConst.assembly_constituency_name
//       );
//       formData.append("state_id", stateId);
//       if (selectedCandidate) {
//         formData.append("candidate_id", selectedCandidate);
//       }

//       const response = await createUsersBulkFile(formData);
//       message.success(response.message || "File uploaded");
//       setIsUploaded(true);
//       await fetchUsers(selectedConstituency, selectedCandidate || null);
//     } catch (err) {
//       console.error("handleUpload error:", err);
//       if (err?.message === "No valid users found in file" && err?.skipped_rows) {
//         const skippedRows = err.skipped_rows.map(row => row.row).join(", ");
//         message.warning(`No valid users found in file. Skipped rows due to existing users: ${skippedRows}`, 5);
//       } else {
//         message.error(err?.message || "Failed to upload file");
//       }
//     } finally {
//       setUploadLoading(false);
//       setFile(null);
//       const f = document.getElementById("file-upload");
//       if (f) f.value = null;
//     }
//   };

//   const filteredCandidates = candidates.filter(
//     (c) => c.assembly_constituency_id?.toString() === selectedConstituency
//   );

//   const paginatedUsers = filteredUsers.slice(
//     (currentPage - 1) * itemsPerPage,
//     currentPage * itemsPerPage
//   );

//   const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

//   const maskPhoneNumber = (phone = "") => {
//     const digits = phone.replace(/\D/g, "");
//     if (!digits) return "-";
//     if (digits.length <= 4) return `${digits.slice(0, 1)}***${digits.slice(-1)}`;
//     const core = digits.slice(-10);
//     if (core.length < 3) return "-";
//     if (core.length === 3) return `${core[2]}***`;
//     return `${core[2]}***${core.slice(-3)}`;
//   };

//   const getStatusColor = (status) => {
//     const key = (status || "").toString().toUpperCase();
//     const colors = {
//       SENT: "bg-[#25D366] text-white",
//       DELIVERED: "bg-[#25D366] text-white",
//       READ: "bg-[#34B7F1] text-white",
//       FAILED: "bg-[#FF5733] text-white",
//       PENDING: "text-yellow-600",
//       YES: "text-gray-600",
//       NO: "text-gray-600",
//     };
//     return colors[key] || "bg-gray-100 text-gray-800";
//   };

//   const formatDate = (date) => {
//     try {
//       if (!date) return "-";
//       const dateObj = new Date(date);
//       const dateStr = dateObj.toLocaleDateString();
//       const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//       return (
//         <div className="flex flex-col">
//           <span className="text-sm">{dateStr}</span>
//           <span className="text-xs text-gray-600">({timeStr})</span>
//         </div>
//       );
//     } catch {
//       return "-";
//     }
//   };

//   const zeroSummary = {
//     invitations_sent: 0,
//     pending: 0,
//     sent: 0,
//     delivered: 0,
//     read: 0,
//     failed: 0,
//     yes: 0,
//     no: 0,
//   };

//   const displaySummary = stats?.totals
//     ? {
//       invitations_sent: stats.totals.total_invitations_sent || 0,
//       pending: stats.totals.total_status_counts?.pending || 0,
//       sent: stats.totals.total_status_counts?.sent || 0,
//       delivered: stats.totals.total_status_counts?.delivered || 0,
//       read: stats.totals.total_status_counts?.read || 0,
//       failed: stats.totals.total_status_counts?.failed || 0,
//       yes: stats.totals.total_user_responses?.yes || 0,
//       no: stats.totals.total_user_responses?.no || 0,
//     }
//     : zeroSummary;

//   return (
//     <div className="container mx-auto p-2 bg-[#FAFAFA]">
//       {/* Dropdowns Card */}
//       <div className="bg-white mb-4">
//         <div className="flex flex-col md:flex-row gap-4 items-end">
//           <div className="w-full md:w-1/3">
//             <Label className="text-xs mb-1">State</Label>
//             <Select
//               onValueChange={(value) => setStateId(value)}
//               value={stateId}
//               className="w-full"
//             >
//               <SelectTrigger className="w-full border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300">
//                 <SelectValue placeholder="Select State" />
//               </SelectTrigger>
//               <SelectContent className="bg-white">
//                 <SelectItem value="21">Tamil Nadu</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="w-full md:w-1/3">
//             <Label className="text-xs mb-1">Constituency</Label>
//             <Select
//               onValueChange={handleConstituencyChange}
//               value={selectedConstituency}
//               disabled={!constituencies.length}
//             >
//               <SelectTrigger className="w-full border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300">
//                 <SelectValue placeholder="Select Constituency" />
//               </SelectTrigger>
//               <SelectContent className="bg-white max-h-60 overflow-auto">
//                 {constituencies.map((c) => (
//                   <SelectItem
//                     key={c.assembly_constituency_no}
//                     value={c.assembly_constituency_no.toString()}
//                   >
//                     {c.assembly_constituency_name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="w-full md:w-1/3">
//             <Label className="text-xs mb-1">Candidate (Optional Filter)</Label>
//             <Select
//               onValueChange={handleCandidateChange}
//               value={selectedCandidate || "all"}
//               disabled={!filteredCandidates.length}
//               className="w-full"
//             >
//               <SelectTrigger className="w-full border border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300">
//                 <SelectValue placeholder="All Candidates" />
//               </SelectTrigger>
//               <SelectContent className="bg-white">
//                 <SelectItem value="all">All Candidates</SelectItem>
//                 {filteredCandidates.map((c) => (
//                   <SelectItem key={c._id} value={c._id}>
//                     {c.mla_name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//       </div>

//       {/* Actions Card */}
//       <div className="bg-white p-4 mb-4">
//         <div className="p-4 rounded">
//           <div className="flex flex-col lg:flex-row items-center gap-4">
//             <div className="flex items-center gap-2">
//               <input
//                 id="file-upload"
//                 type="file"
//                 accept=".csv,.xlsx,.xls,.json,.txt"
//                 onChange={handleFileChange}
//                 className="hidden"
//               />
//               <Button
//                 onClick={() => document.getElementById("file-upload").click()}
//                 disabled={!selectedConstituency}
//                 className="bg-green-600 hover:bg-green-600 text-white flex items-center justify-center space-x-2 whitespace-nowrap"
//               >
//                 <Upload className="w-4 h-4" />
//                 <span>Upload CSV</span>
//               </Button>

//               {file && (
//                 <Button
//                   onClick={handleUpload}
//                   disabled={uploadLoading}
//                   className="bg-green-600 hover:bg-green-600 text-white flex items-center justify-center space-x-2 whitespace-nowrap"
//                 >
//                   {uploadLoading ? (
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                   ) : (
//                     <Plus className="w-4 h-4" />
//                   )}
//                   <span>Add Users</span>
//                 </Button>
//               )}
//             </div>

//             {isUploaded && (
//               <Button
//                 onClick={handleSendBulk}
//                 disabled={loading || !selectedConstituency}
//                 className="bg-green-600 hover:bg-green-600 text-white flex items-center justify-center space-x-2 whitespace-nowrap"
//               >
//                 {loading ? (
//                   <Loader2 className="animate-spin" size={18} />
//                 ) : (
//                   <Send className="w-4 h-4" />
//                 )}
//                 <span>Send Invitations</span>
//               </Button>
//             )}

//             <div className="flex-1" />
//           </div>

//           {file && (
//             <div className="mt-3 text-md text-gray-600">
//               Selected file: <span className="font-medium text-gray-600">{file.name}</span>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="bg-white shadow p-6">
//         {/* Analytics Cards */}
//         <div className="mb-6">
//           <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
//             <div className="bg-white shadow p-3">
//               <div className="text-sm text-gray-500">Total Sent</div>
//               <div className="text-2xl font-bold text-[#128C7E]">
//                 {displaySummary.invitations_sent}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-sm text-gray-500">Pending</div>
//               <div className="text-2xl font-bold text-gray-500">
//                 {displaySummary.pending}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-sm text-gray-500">Sent</div>
//               <div className="text-2xl font-bold text-[#128C7E]">
//                 {displaySummary.sent}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-sm text-gray-500">Delivered</div>
//               <div className="text-2xl font-bold text-[#128C7E]">
//                 {displaySummary.delivered}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-sm text-gray-500">Read</div>
//               <div className="text-2xl font-bold text-[#34B7F1]">
//                 {displaySummary.read}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-sm text-gray-500">Failed</div>
//               <div className="text-2xl font-bold text-[#FF5733]">
//                 {displaySummary.failed}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-[12px] text-gray-500">Option1</div>
//               <span className="text-xs">(సమాచారం కావాలి)</span>
//               <div className="text-2xl font-bold text-green-600">
//                 {displaySummary.yes}
//               </div>
//             </div>
//             <div className="bg-white shadow p-3">
//               <div className="text-[12px] text-gray-500">Option2</div>
//               <span className="text-xs">(వద్దు, అక్కరలేదు)</span>
//               <div className="text-2xl font-bold text-[#FF5733]">
//                 {displaySummary.no}
//               </div>
//             </div>
//           </div>
//           {stats?.candidate_id && (
//             <div className="mt-4 text-sm text-gray-600">
//               Showing stats for candidate: <span className="font-medium">{stats.mla_name}</span>
//             </div>
//           )}
//         </div>

//         {/* User Table */}
//         <div className="overflow-x-auto max-h-[500px] min-h-[400px] overflow-y-auto border border-gray-200 rounded">
//           <table className="min-w-full border-collapse">
//             <thead className="bg-gray-200 text-black sticky top-0 z-10">
//               <tr className="border-b">
//                 <th className="text-left px-4 py-2 text-sm">Phone Number</th>
//                 <th className="text-left px-4 py-2 text-sm">Invitation Status</th>
//                 <th className="text-left px-4 py-2 text-sm">User Response</th>
//                 <th className="text-left px-4 py-2 text-sm">Sent At</th>
//                 <th className="text-left px-4 py-2 text-sm">Responded At</th>
//                 <th className="text-left px-4 py-2 text-sm">Failed Reason</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={6} className="text-center py-8">
//                     <Loader2 className="mx-auto animate-spin text-[#25D366]" />
//                   </td>
//                 </tr>
//               ) : paginatedUsers.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="text-center py-4 text-gray-500">
//                     No users
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedUsers.map((user) => (
//                   <tr key={user._id || user.phone_no} className="border-b hover:bg-[#EDEDED]">
//                     <td className="px-4 py-2">{maskPhoneNumber(user.phone_no)}</td>
//                     <td className="px-4 py-2 text-sm">
//                       {user.invitation_sent ?? Boolean(user.invitation_sent_at) ? (
//                         <span className="text-gray-600 font-medium">Yes ✓</span>
//                       ) : (
//                         <span className="text-gray-600">No ✗</span>
//                       )}
//                     </td>
//                     <td className="px-4 py-2">
//                       <span
//                         className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(
//                           user.user_response
//                         )}`}
//                         title={user.user_response ?? "-"}
//                       >
//                         {user.user_response ?? "-"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-2 text-sm">{formatDate(user.invitation_sent_at)}</td>
//                     <td className="px-4 py-2 text-sm">{formatDate(user.response_received_at)}</td>
//                     <td className="px-4 py-2 text-sm">{user.failed_reason || "-"}</td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Pagination */}
//         <div className="flex flex-col sm:flex-row justify-between mt-4 text-black items-center gap-2">
//           <div className="text-sm">
//             Showing{" "}
//             {filteredUsers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{" "}
//             {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
//             {filteredUsers.length} users
//           </div>
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1 || totalPages === 0}
//               className="text-white bg-green-600 hover:bg-green-700"
//             >
//               <ChevronsLeft size={16} />
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//               disabled={currentPage === 1 || totalPages === 0}
//               className="text-white bg-green-600 hover:bg-green-700"
//             >
//               <ChevronLeft size={16} />
//             </Button>
//             <div className="flex items-center px-3">
//               {currentPage} / {totalPages}
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//               disabled={currentPage === totalPages || totalPages === 0}
//               className="text-white bg-green-600 hover:bg-green-700"
//             >
//               <ChevronRight size={16} />
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setCurrentPage(totalPages)}
//               disabled={currentPage === totalPages || totalPages === 0}
//               className="text-white bg-green-600 hover:bg-green-700"
//             >
//               <ChevronsRight size={16} />
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }