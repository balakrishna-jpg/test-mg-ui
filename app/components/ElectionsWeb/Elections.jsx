
// app/components/ElectionsWeb/Elections.jsx
import { useState } from 'react';
import { Search, Filter } from 'lucide-react';

export default function Elections() {
  // const [selectedState, setSelectedState] = useState('Tamil Nadu');
  // const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState('All Status');

  // const elections = [
  //   { id: 1, name: '2024 Lok Sabha Elections', type: 'General', status: 'Completed', date: '19 Apr 2024', constituencies: 39 },
  //   { id: 2, name: '2021 Assembly Elections', type: 'Assembly', status: 'Completed', date: '6 Apr 2021', constituencies: 234 },
  //   { id: 3, name: '2026 Assembly Elections', type: 'Assembly', status: 'Upcoming', date: '15 Apr 2026', constituencies: 234 },
  //   { id: 4, name: '2029 Lok Sabha Elections', type: 'General', status: 'Upcoming', date: '20 Apr 2029', constituencies: 39 }
  // ];

  // const getStatusBadge = (status) => {
  //   const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  //   if (status === 'Completed') return `${baseClasses} bg-green-100 text-green-800`;
  //   if (status === 'Upcoming') return `${baseClasses} bg-yellow-100 text-yellow-800`;
  //   return `${baseClasses} bg-gray-100 text-gray-800`;
  // };

  // const getTypeBadge = (type) => {
  //   const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  //   if (type === 'General') return `${baseClasses} bg-blue-100 text-blue-800`;
  //   if (type === 'Assembly') return `${baseClasses} bg-purple-100 text-purple-800`;
  //   return `${baseClasses} bg-gray-100 text-gray-800`;
  // };

  // return (
  //   <div className="p-6">
  //     <div className="flex justify-between items-center mb-6">
  //       <h1 className="text-2xl font-bold text-gray-900">Elections Management</h1>
  //       <div className="flex items-center gap-2">
  //         <span className="text-sm text-gray-600">Select State:</span>
  //         <select 
  //           value={selectedState}
  //           onChange={(e) => setSelectedState(e.target.value)}
  //           className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  //         >
  //           <option value="Tamil Nadu">Tamil Nadu</option>
  //           <option value="Karnataka">Karnataka</option>
  //           <option value="Kerala">Kerala</option>
  //         </select>
  //       </div>
  //     </div>

  //     <div className="bg-white rounded-lg shadow-sm border">
  //       <div className="p-4 border-b">
  //         <div className="flex justify-between items-center mb-4">
  //           <h2 className="text-lg font-semibold">Elections in {selectedState}</h2>
  //           <span className="text-sm text-gray-500">{elections.length} elections found</span>
  //         </div>
          
  //         <div className="flex gap-4">
  //           <div className="relative flex-1">
  //             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
  //             <input
  //               type="text"
  //               placeholder="Search elections..."
  //               value={searchTerm}
  //               onChange={(e) => setSearchTerm(e.target.value)}
  //               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  //             />
  //           </div>
  //           <div className="flex items-center gap-2">
  //             <Filter size={16} className="text-gray-400" />
  //             <select 
  //               value={statusFilter}
  //               onChange={(e) => setStatusFilter(e.target.value)}
  //               className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  //             >
  //               <option value="All Status">All Status</option>
  //               <option value="Completed">Completed</option>
  //               <option value="Upcoming">Upcoming</option>
  //             </select>
  //           </div>
  //         </div>
  //       </div>

  //       <div className="overflow-x-auto">
  //         <table className="w-full">
  //           <thead className="bg-gray-50">
  //             <tr>
  //               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Election Name</th>
  //               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
  //               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
  //               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
  //               <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Constituencies</th>
  //             </tr>
  //           </thead>
  //           <tbody className="bg-white divide-y divide-gray-200">
  //             {elections.map((election) => (
  //               <tr key={election.id} className="hover:bg-gray-50">
  //                 <td className="px-4 py-3">
  //                   <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
  //                     {election.name}
  //                   </button>
  //                 </td>
  //                 <td className="px-4 py-3">
  //                   <span className={getTypeBadge(election.type)}>{election.type}</span>
  //                 </td>
  //                 <td className="px-4 py-3">
  //                   <span className={getStatusBadge(election.status)}>{election.status}</span>
  //                 </td>
  //                 <td className="px-4 py-3 text-sm text-gray-900">{election.date}</td>
  //                 <td className="px-4 py-3 text-sm text-gray-900">{election.constituencies}</td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </div>
  //     </div>
  //   </div>
  // );


  return(
     <div>
      <h1 style={{textAlign:"center" , marginTop:'90px'}}>Coming soon...</h1>
    </div>
  )
}