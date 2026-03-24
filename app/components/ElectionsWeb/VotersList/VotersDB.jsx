// app/components/ElectionsWeb/VotersDB.jsx

import { useParams, useNavigate } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, Fragment } from "react";
import { useOutletContext } from "@remix-run/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";


import dayjs from "dayjs";

import {
  Eye,
  EyeOff,
  SlidersHorizontal,
  Edit3,
  X,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Edit
} from "lucide-react";


import {
  getBoothWiseVotersByParty,
  getPollingBoothCounts,
  updateVoterByParty,
  getOrganizationCustomFields,
  createCustomField,
  getStateAndConstituencyWiseBooths,
  getElectionStates,
  getAssemblyConstituencies,
  getVotersByEntireAssemblyConstituency,
  getFamilyList,
} from "~/api";
import { message } from "antd";



const { Option } = Select;

// Skeleton Loading Component
const SkeletonLoader = ({ darkMode }) => (
  <div className="flex-1 flex flex-col min-h-0">
    <div className="flex-1 overflow-auto relative">
      <table className="min-w-full divide-y divide-gray-200 border-collapse">
        <thead className={`sticky top-0 z-20 ${darkMode ? "bg-[#1a1a1a] border-b border-[#333]" : "bg-gray-50/50 border-b border-gray-100"}`}>
          <tr>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              Name
            </th>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              Relation
            </th>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              Age
            </th>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              Gender
            </th>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              Voter ID
            </th>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              House Number
            </th>
            <th className={`px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={`divide-y ${darkMode ? "bg-[#1a1a1a] divide-[#333]" : "bg-white divide-gray-100"}`}>
          {[...Array(8)].map((_, index) => (
            <tr key={index} className={`transition-all duration-200 ${darkMode ? "bg-[#1a1a1a]" : "bg-white"}`}>
              <td className="px-6 py-4">
                <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "60%" }}></div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className={`h-3 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "70%" }}></div>
                  <div className={`h-3 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "40%" }}></div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "30px" }}></div>
              </td>
              <td className="px-6 py-4">
                <div className={`h-6 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "50px" }}></div>
              </td>
              <td className="px-6 py-4">
                <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "80px" }}></div>
              </td>
              <td className="px-6 py-4">
                <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`} style={{ width: "50%" }}></div>
              </td>
              <td className="px-6 py-4">
                <div className={`h-6 w-6 rounded animate-pulse ${darkMode ? "bg-[#222]" : "bg-gray-100"}`}></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Update Loader Component
const UpdateLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-200">
    <div className="bg-white dark:bg-[#1a1a1a] rounded-md p-6 flex flex-col items-center space-y-4 border border-gray-200 dark:border-[#333] shadow-md transition-all duration-200">
      <Loader2
        size={32}
        style={{
          animation: "spin 1s linear infinite",
          color: "#a8e6cf",
        }}
      />
      <span className="text-gray-900 dark:text-white font-medium">Updating voter...</span>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  </div>
);

// Function to get party display information
const getPartyInfo = (partyId) => {
  const id = String(partyId);
  switch (id) {
    case "46":
      return {
        name: "AIADMK",
        color: "#1bcc2b",
        textColor: "#000000",
      };
    case "44":
      return {
        name: "DMK",
        color: "#c30e21",
        textColor: "#FFFFFF",
      };

    case "2":
      return {
        name: "BJP",
        color: "#eb6d16",
        textColor: "#FFFFFF",
      };
    case "3":
      return {
        name: "INC",
        color: "#04730d",
        textColor: "#FFFFFF",
      };
    default:
      return {
        name: `Party ${partyId}`,
        color: "#F3F4F6", // gray
        textColor: "#374151", // dark gray for text
        borderColor: "#9CA3AF", // gray border
      };
  }
};

export default function VotersDB() {
  
  const navigate = useNavigate();
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;


  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");

  const [constituencies, setConstituencies] = useState([]);
  const [Assignedconstituencies, setAssignedConstituencies] = useState([]);
  const [AssignedBooths, setAssignedBooths] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [selectedBooth, setSelectedBooth] = useState("");
  // Constituency-wide search (getVotersByEntireAssemblyConstituency)
  const [constituencySearchTerm, setConstituencySearchTerm] = useState("");
  const [constituencySearchSubmitted, setConstituencySearchSubmitted] = useState(null); // null = not in constituency search mode
  const [constituencySearchResults, setConstituencySearchResults] = useState([]);
  const [constituencySearchLoading, setConstituencySearchLoading] = useState(false);
  const [constituencySearchTotal, setConstituencySearchTotal] = useState(0);
  const [constituencySearchTotalPages, setConstituencySearchTotalPages] = useState(1);
  const [constituencySearchCurrentPage, setConstituencySearchCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false); // New state for update loading
  // const [showToast, setShowToast] = useState(false);
  // const [darkMode, setDarkMode] = useState(false);

  // Search state for constituency dropdown
  const [constituencySearch, setConstituencySearch] = useState("");
  const [isConstituencyDropdownOpen, setIsConstituencyDropdownOpen] = useState(false);

  // Search state for booth dropdown
  const [boothSearch, setBoothSearch] = useState("");
  const [isBoothDropdownOpen, setIsBoothDropdownOpen] = useState(false);

  const [newCustomFieldType, setNewCustomFieldType] = useState("text");
  const [newCustomFieldChoices, setNewCustomFieldChoices] = useState([""]);

  // Schemes state
  const [schemes, setSchemes] = useState([]);
  const [selectedSchemes, setSelectedSchemes] = useState([]);
  const [schemesLoading, setSchemesLoading] = useState(false);
  const [schemeDetails, setSchemeDetails] = useState({});

  // Custom fields state
  const [customFields, setCustomFields] = useState([]);
  const [editingFieldId, setEditingFieldId] = useState(null);
  const [editingFieldName, setEditingFieldName] = useState("");
  const [originalCustomFields, setOriginalCustomFields] = useState([]);

  const [editingVoter, setEditingVoter] = useState(null);

  const [allVoters, setAllVoters] = useState([]); // Store ALL voters from backend
  const [voters, setVoters] = useState([]); // Store current page voters
  const [filteredVoters, setFilteredVoters] = useState([]); // Store filtered voters
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [votersPerPage, setVotersPerPage] = useState(750); // Fixed 750 per page

  const outletContext = useOutletContext() || {};

  const { darkMode = false } = outletContext;

  const [userStateId, setUserStateId] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [constituenciesLoading, setConstituenciesLoading] = useState(false);
  const [booths, setBooths] = useState([]);
  const [boothsLoading, setBoothsLoading] = useState(false);

  const [showFamilyWise, setShowFamilyWise] = useState(false);
  const [familyData, setFamilyData] = useState([]);
  const [familyDataLoading, setFamilyDataLoading] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState(new Set());

  const toggleFamily = (familyId) => {
    setExpandedFamilies((prev) => {
      const next = new Set(prev);
      if (next.has(familyId)) {
        next.delete(familyId);
      } else {
        next.add(familyId);
      }
      return next;
    });
  };

  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    relation: true,
    age: true,
    gender: true,
    voterId: true,
    houseNumber: true,
    actions: true,
  });

  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [globalCustomFields, setGlobalCustomFields] = useState([]); // start empty!
  const [editForm, setEditForm] = useState({
    Name: "",
    custom_fields_values: {}, // { [fieldId]: value }
    // ...any other fields
  });

  const [permissions, setPermissions] = useState({
    view: false,
    edit: false,
    add: false,
    delete: false,
  });
  const [userRole, setUserRole] = useState(null);



  // Extract user permissions and check role-based access
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user_info") || "{}");

    // New API: product_permissions keyed by SKU (Elections = SKU005)
    if (userData?.product_permissions?.SKU005) {
      setPermissions(userData.product_permissions.SKU005);
    } else if (userData?.permissions) {
      // Fallback to old flat permissions structure
      setPermissions(userData.permissions);
    }

    if (userData?.state_id) {
      setUserStateId(Number(userData.state_id));
    }

    if (Array.isArray(userData?.assigned_booths)) {
      setAssignedBooths(userData.assigned_booths);
    } else {
      setAssignedBooths([]);
    }

    if (userData?.role) {
      setUserRole(userData.role);
    }

    // Deny access to non-agent and non-admin users
    if (!["agent", "admin"].includes(userData.role)) {
      setConstituencies([]);
      setAssignedConstituencies([]);
      setSelectedConstituency("");
      setSelectedBooth("");
      message.error("Access denied: Only agents and admins can access this module.");
    }
  }, []);

  // Fetch states for admin (only show user's state)
  useEffect(() => {
    async function fetchStates() {
      const userData = JSON.parse(localStorage.getItem("user_info") || "{}");

      if (userData.role === "admin" && userData.state_id) {
        try {
          setStatesLoading(true);
          const allStates = await getElectionStates();
          const userStateId = Number(userData.state_id);

          // Filter to show only user's state
          const userState = Array.isArray(allStates)
            ? allStates.find((s) => Number(s.state_id) === userStateId)
            : null;

          if (userState) {
            setStates([userState]);
            setSelectedState(userStateId);
          } else {
            // Fallback: create state object from user_info
            setStates([{
              state_id: userStateId,
              state_name: userData.state_name || "Unknown State"
            }]);
            setSelectedState(userStateId);
          }
        } catch (err) {
          console.error("Error fetching states:", err);
          // Fallback: use state from user_info
          setStates([{
            state_id: Number(userData.state_id),
            state_name: userData.state_name || "Unknown State"
          }]);
          setSelectedState(Number(userData.state_id));
        } finally {
          setStatesLoading(false);
        }
      }
    }

    fetchStates();
  }, []);

  // Fetch constituencies based on role
  useEffect(() => {
    async function fetchConstituencies() {
      const userData = JSON.parse(localStorage.getItem("user_info") || "{}");

      if (userData.role === "agent" && Array.isArray(userData.assigned_constituencies) && userData.assigned_constituencies.length > 0) {
        // For agents: Use getPollingBoothCounts and filter by assigned_constituencies
        try {
          const data = await getPollingBoothCounts();
          const filteredData = data?.filter((constituency) =>
            userData.assigned_constituencies.includes(
              constituency.assembly_constituency_no
            )
          ) || [];

          setConstituencies(filteredData);
          setAssignedConstituencies(filteredData);

          // Auto-select the first constituency if available
          if (filteredData.length > 0) {
            const firstConstituency = filteredData[0].assembly_constituency_no;
            setSelectedConstituency(firstConstituency);
          } else {
            setSelectedConstituency("");
          }
        } catch (err) {
          console.error("Error fetching constituencies for agent:", err);
          setConstituencies([]);
          setAssignedConstituencies([]);
          setSelectedConstituency("");
        }
      } else if (userData.role === "admin" && selectedState) {
        // For admins: Use getAssemblyConstituencies with selected state
        try {
          setConstituenciesLoading(true);
          const data = await getAssemblyConstituencies(selectedState);
          const constituenciesList = Array.isArray(data?.constituencies)
            ? data.constituencies
            : Array.isArray(data)
              ? data
              : [];

          setConstituencies(constituenciesList);
          setAssignedConstituencies(constituenciesList);

          // Auto-select the first constituency if available
          if (constituenciesList.length > 0) {
            const firstConstituency = constituenciesList[0].assembly_constituency_no || constituenciesList[0].assembly_constituency_id;
            setSelectedConstituency(String(firstConstituency));
          } else {
            setSelectedConstituency("");
          }
        } catch (err) {
          console.error("Error fetching constituencies for admin:", err);
          setConstituencies([]);
          setAssignedConstituencies([]);
          setSelectedConstituency("");
        } finally {
          setConstituenciesLoading(false);
        }
      } else {
        setConstituencies([]);
        setAssignedConstituencies([]);
        setSelectedConstituency("");
      }
    }

    fetchConstituencies();
  }, [selectedState]);

  // Add this separate useEffect for debugging (temporary - remove after fixing)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
    if (userData) {
      // This should show in browser console
      // alert(`User: ${userData.name}, Role: ${userData.role}, Assigned: ${JSON.stringify(userData.assigned_constituencies)}`);
    }
  }, []);



  useEffect(() => {
    async function fetchPartyCustomFields() {
      if (!party) return;
      try {
        const fields = await getOrganizationCustomFields();

        setGlobalCustomFields(
          fields.map((f) => ({
            id: f.id,
            question_id: f.question_id || f.id, // Use question_id if available, fallback to id
            name: f.field_name,
            party_id: f.party_id,
            question_type: f.question_type || "text", // Default to text if undefined
            choices: Array.isArray(f.choices) ? f.choices : [], // Ensure choices is an array
          }))
        );
      } catch (err) {
        setGlobalCustomFields([]);
        console.error("Error fetching custom fields:", err);
      }
    }
    fetchPartyCustomFields();
  }, [party]);
  const toggleColumnVisibility = (columnKey) => {
    // Prevent hiding mandatory columns
    if (columnKey === "name" || columnKey === "actions") {
      return;
    }

    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Get party display info
  const partyInfo = getPartyInfo(party);

  const handleAddCustomField = async () => {
    if (!newCustomFieldName.trim()) return;

    if (
      globalCustomFields.some(
        (f) => f.name.trim().toLowerCase() === newCustomFieldName.trim().toLowerCase()
      )
    ) {
      message.warning("Custom field already exists!");
      return;
    }

    try {
      let choices = null;
      if (newCustomFieldType === "multiple_choice" || newCustomFieldType === "prediction") {
        choices = newCustomFieldChoices
          .filter((choice) => choice.trim())
          .map((choice) => choice.trim());
        if (choices.length === 0) {
          message.warning("Please add at least one choice for this field type!");
          return;
        }
      }

      await createCustomField({
        party_id: parseInt(party),
        field_name: newCustomFieldName.trim(),
        question_type: newCustomFieldType, // Send question_type
        choices: choices, // Send choices
      });

      const fields = await getOrganizationCustomFields();
      const updatedFields = fields.map((f) => ({
        id: f.id,
        question_id: f.question_id || f.id, // Use question_id if available, fallback to id
        name: f.field_name,
        party_id: f.party_id,
        question_type: f.question_type || "text",
        choices: Array.isArray(f.choices) ? f.choices : [],
      }));

      setGlobalCustomFields(updatedFields);

      const newField = updatedFields.find(
        (f) => f.name.trim().toLowerCase() === newCustomFieldName.trim().toLowerCase()
      );

      if (newField) {
        setVisibleColumns((prev) => ({
          ...prev,
          [`custom_${newField.id}`]: true,
        }));
      }

      setNewCustomFieldName("");
      setNewCustomFieldType("text");
      setNewCustomFieldChoices([""]);
      setShowAddCustomField(false);
    } catch (err) {
      message.error(err?.response?.data?.detail || "Could not create field!");
    }
  };

  // Fetch family data when family wise view is enabled
  useEffect(() => {
    async function fetchFamilyData() {
      if (!showFamilyWise || !selectedConstituency || !selectedBooth) {
        setFamilyData([]);
        return;
      }

      const currentStateId = userRole === "admin" ? selectedState : userStateId;

      try {
        setFamilyDataLoading(true);
        const data = await getFamilyList(currentStateId, selectedConstituency, selectedBooth);
        if (data && Array.isArray(data.families)) {
          setFamilyData(data.families);
        } else {
          setFamilyData([]);
        }
      } catch (err) {
        console.error("Error fetching family data:", err);
        message.warning("Failed to fetch family data or no families available");
        setFamilyData([]);
      } finally {
        setFamilyDataLoading(false);
      }
    }

    fetchFamilyData();
  }, [showFamilyWise, selectedConstituency, selectedBooth, selectedState, userStateId, userRole]);

  // Fetch booths for selected constituency using getStateAndConstituencyWiseBooths
  useEffect(() => {
    async function fetchBooths() {
      const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
      const currentStateId = userRole === "admin" ? selectedState : userStateId;

      if (!selectedConstituency || !currentStateId) {
        setBooths([]);
        setSelectedBooth("");
        return;
      }

      try {
        setBoothsLoading(true);
        const data = await getStateAndConstituencyWiseBooths(
          currentStateId,
          selectedConstituency
        );
        const allBooths = Array.isArray(data) ? data : [];

        let finalBooths = allBooths;

        // For agents, filter booths based on assigned_booths from response
        if (userRole === "agent" && AssignedBooths.length > 0) {
          const allowedBoothNos = AssignedBooths
            .filter(
              (b) =>
                Number(b.state_id) === Number(currentStateId) &&
                Number(b.assembly_constituency_no) === Number(selectedConstituency)
            )
            .map((b) => Number(b.polling_station_no));

          finalBooths = allBooths.filter((booth) =>
            allowedBoothNos.includes(Number(booth.polling_station_no))
          );
        } else if (userRole === "admin") {
          // Admins see all booths for selected state and constituency
          finalBooths = allBooths;
        }

        setBooths(finalBooths);

        // Auto-select first booth if available
        if (finalBooths.length > 0) {
          setSelectedBooth(String(finalBooths[0].polling_station_no));
        } else {
          setSelectedBooth("");
        }
      } catch (err) {
        console.error("Error fetching booths:", err);
        setBooths([]);
        setSelectedBooth("");
      } finally {
        setBoothsLoading(false);
      }
    }

    fetchBooths();
  }, [selectedConstituency, selectedState, userStateId, userRole, AssignedBooths]);



  // Updated useEffect to use getBoothWiseVotersByParty API
  useEffect(() => {
    async function fetchVoters() {
      if (!selectedConstituency || !selectedBooth || !party) {
        setAllVoters([]);
        setFilteredVoters([]);
        setVoters([]);
        setTotalVoters(0);
        setTotalPages(1);
        return;
      }

      setLoading(true);
      try {
        const data = await getBoothWiseVotersByParty(
          selectedConstituency,
          selectedBooth,
          currentPage,
          750, // Fixed 750 items per page
          ""
        );

        if (data && typeof data === "object") {
          const votersArray = Array.isArray(data.voters)
            ? data.voters
            : Array.isArray(data.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : [];

          setAllVoters(votersArray);
          setFilteredVoters(votersArray);
          setVoters(votersArray);

          // Get total from backend if provided in different formats
          const backendTotal = data.total_count ?? data.total ?? data.total_voters ?? data.count;

          let totalCount;
          let totalPagesCalc;

          if (backendTotal !== undefined && backendTotal !== null) {
            totalCount = backendTotal;
            totalPagesCalc = data.total_pages ?? (Math.ceil(totalCount / 750) || 1);
          } else {
            // Fallback if backend doesn't provide total: just allow NEXT page if we received exactly 750 items
            totalCount = votersArray.length === 750 ? (currentPage * 750) + 1 : ((currentPage - 1) * 750) + votersArray.length;
            totalPagesCalc = votersArray.length === 750 ? currentPage + 1 : currentPage;
          }

          setTotalVoters(totalCount);
          setTotalPages(totalPagesCalc);
        } else {
          setAllVoters([]);
          setFilteredVoters([]);
          setVoters([]);
          setTotalVoters(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error("Error fetching voters:", err);
        setAllVoters([]);
        setFilteredVoters([]);
        setVoters([]);
        setTotalVoters(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }

    fetchVoters();
  }, [selectedConstituency, selectedBooth, party, currentPage]);

  useEffect(() => {
    setFilteredVoters(allVoters);

    const pages = Math.ceil(totalVoters / 750) || 1;
    setTotalPages(pages);

    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [allVoters, totalVoters, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedConstituency, selectedBooth, party]);

  // Clear constituency search when constituency is deselected
  useEffect(() => {
    if (!selectedConstituency) {
      setConstituencySearchSubmitted(null);
      setConstituencySearchTerm("");
      setConstituencySearchResults([]);
      setConstituencySearchTotal(0);
      setConstituencySearchTotalPages(1);
      setConstituencySearchCurrentPage(1);
    }
  }, [selectedConstituency]);

  const isConstituencySearchActive = constituencySearchSubmitted !== null;

  // Fetch voters by entire assembly constituency when constituency search is active
  useEffect(() => {
    if (!isConstituencySearchActive || !selectedConstituency || !party) {
      if (!isConstituencySearchActive) {
        setConstituencySearchResults([]);
        setConstituencySearchTotal(0);
        setConstituencySearchTotalPages(1);
        setConstituencySearchCurrentPage(1);
      }
      return;
    }

    let cancelled = false;
    setConstituencySearchLoading(true);
    getVotersByEntireAssemblyConstituency(
      Number(selectedConstituency),
      constituencySearchCurrentPage,
      100,
      constituencySearchSubmitted === "" ? "" : constituencySearchSubmitted,
      "",
      ""
    )
      .then((data) => {
        if (cancelled) return;
        const votersArray = Array.isArray(data?.voters) ? data.voters : [];
        setConstituencySearchResults(votersArray);
        setConstituencySearchTotal(data?.total_count ?? 0);
        setConstituencySearchTotalPages(data?.total_pages ?? 1);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Error fetching voters by constituency:", err);
          message.error("Failed to load constituency search results.");
          setConstituencySearchResults([]);
          setConstituencySearchTotal(0);
          setConstituencySearchTotalPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setConstituencySearchLoading(false);
      });

    return () => { cancelled = true; };
  }, [isConstituencySearchActive, selectedConstituency, party, constituencySearchSubmitted, constituencySearchCurrentPage]);

  const runConstituencySearch = () => {
    if (!selectedConstituency) {
      message.warning("Please select a constituency first.");
      return;
    }
    setConstituencySearchSubmitted(constituencySearchTerm.trim());
    setConstituencySearchCurrentPage(1);
  };

  const clearConstituencySearch = () => {
    setConstituencySearchSubmitted(null);
    setConstituencySearchTerm("");
    setConstituencySearchCurrentPage(1);
    setConstituencySearchResults([]);
    setConstituencySearchTotal(0);
    setConstituencySearchTotalPages(1);
  };

  // useEffect(() => {
  //   if (showToast) {
  //     const timer = setTimeout(() => {
  //       setShowToast(false);
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [showToast]);

  const handleEditVoter = (voter) => {
    setEditingVoter(voter);

    // Initialize customFieldsValues with empty values for all globalCustomFields
    let customFieldsValues = {};
    globalCustomFields.forEach((field) => {
      // Initialize based on field type
      if (field.question_type === "multiple_choice") {
        customFieldsValues[field.id] = []; // Array for multiple_choice
      } else {
        customFieldsValues[field.id] = ""; // String for text, yes_no, prediction
      }
    });

    // Map voter.custom_fields to customFieldsValues
    // Backend returns CustomFieldAnswer objects with question_id, question_type, choice_id, choice_ids, or value
    if (voter.custom_fields && Array.isArray(voter.custom_fields)) {
      voter.custom_fields.forEach((customFieldAnswer) => {
        // Match by question_id (preferred) or fallback to name matching for backward compatibility
        const matched = globalCustomFields.find(
          (gf) =>
            (customFieldAnswer.question_id && (gf.question_id === customFieldAnswer.question_id || gf.id === customFieldAnswer.question_id)) ||
            (customFieldAnswer.name && gf.name.trim().toLowerCase() === customFieldAnswer.name.trim().toLowerCase())
        );

        if (matched) {
          // Handle different field types based on CustomFieldAnswer structure
          if (matched.question_type === "multiple_choice") {
            // For multiple_choice, use choice_ids array
            if (customFieldAnswer.choice_ids && Array.isArray(customFieldAnswer.choice_ids) && customFieldAnswer.choice_ids.length > 0) {
              customFieldsValues[matched.id] = customFieldAnswer.choice_ids;
            } else {
              // Fallback: check if value exists (for backward compatibility)
              if (Array.isArray(customFieldAnswer.value)) {
                customFieldsValues[matched.id] = customFieldAnswer.value;
              } else if (typeof customFieldAnswer.value === "string" && customFieldAnswer.value) {
                customFieldsValues[matched.id] = customFieldAnswer.value.split(",").map(v => v.trim()).filter(Boolean);
              } else {
                customFieldsValues[matched.id] = [];
              }
            }
          } else if (matched.question_type === "prediction") {
            // For prediction, use choice_id (single choice)
            if (customFieldAnswer.choice_id) {
              customFieldsValues[matched.id] = customFieldAnswer.choice_id;
            } else if (customFieldAnswer.value) {
              // Fallback: use value if choice_id not available
              customFieldsValues[matched.id] = customFieldAnswer.value;
            } else {
              customFieldsValues[matched.id] = "";
            }
          } else {
            // For text and yes_no, use value string
            customFieldsValues[matched.id] = customFieldAnswer.value || "";
          }
        }
      });
    }

    setEditForm({
      Name: voter.Name || "",
      custom_fields_values: customFieldsValues,
    });

    // Schemes logic remains unchanged
    if (voter.schemes && Array.isArray(voter.schemes)) {
      const voterSchemeIds = voter.schemes
        .map((s) => s.scheme_id || s.schema_id)
        .filter(Boolean);
      setSelectedSchemes(voterSchemeIds);
      const details = {};
      voter.schemes.forEach((s) => {
        const id = s.scheme_id || s.schema_id;
        if (!id) return;
        details[id] = {
          applied_on: s.applied_on ? dayjs(s.applied_on) : null,
          received_on: s.received_on ? dayjs(s.received_on) : null,
          amount_received:
            typeof s.amount_received === "number" ? s.amount_received : null,
        };
      });
      setSchemeDetails(details);
    } else {
      setSelectedSchemes([]);
      setSchemeDetails({});
    }
  };

  const closeEditModal = () => {
    setEditingVoter(null);
    setEditForm({
      Name: "",
      custom_fields_values: {},
    });
    setCustomFields([]);
    setOriginalCustomFields([]);
    setSelectedSchemes([]);
    setSchemeDetails({});
    setEditingFieldId(null);
    setEditingFieldName("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Updated handleUpdateVoter with loading state

  const handleUpdateVoter = async () => {
    if (!editingVoter) return;

    try {
      setUpdating(true);

      // Build the formatted custom fields for the API according to CustomFieldAnswer schema
      const formattedCustomFields = globalCustomFields
        .map((field) => {
          const fieldValue = editForm.custom_fields_values && editForm.custom_fields_values[field.id];

          // Skip if no value
          if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
            return null;
          }

          // Build CustomFieldAnswer object based on question_type
          const customFieldAnswer = {
            question_id: field.question_id || field.id,
            question_type: field.question_type || "text",
          };

          if (field.question_type === "multiple_choice") {
            // For multiple_choice, use choice_ids array
            if (Array.isArray(fieldValue) && fieldValue.length > 0) {
              customFieldAnswer.choice_ids = fieldValue; // Array of choice_ids
              customFieldAnswer.choice_id = null;
              customFieldAnswer.value = null;
            } else {
              return null; // Skip empty multiple_choice fields
            }
          } else if (field.question_type === "prediction") {
            // For prediction, use choice_id (single choice)
            if (typeof fieldValue === "string" && fieldValue.trim()) {
              customFieldAnswer.choice_id = fieldValue.trim();
              customFieldAnswer.choice_ids = null;
              customFieldAnswer.value = null;
            } else {
              return null; // Skip empty prediction fields
            }
          } else {
            // For text and yes_no, use value string
            if (typeof fieldValue === "string" && fieldValue.trim()) {
              customFieldAnswer.value = fieldValue.trim();
              customFieldAnswer.choice_id = null;
              customFieldAnswer.choice_ids = null;
            } else {
              return null; // Skip empty text/yes_no fields
            }
          }

          return customFieldAnswer;
        })
        .filter((field) => field !== null); // Remove null entries

      // Prepare schemes for API
      const schemesForApi = selectedSchemes.map((id) => {
        const det = schemeDetails[id] || {};
        return {
          scheme_id: id,
          applied_on: det.applied_on ? det.applied_on.format("YYYY-MM-DD") : null,
          received_on: det.received_on ? det.received_on.format("YYYY-MM-DD") : null,
          amount_received: det.amount_received ?? null,
        };
      });

      // Build update data (only include editable fields)
      const updateData = {
        Name: editForm.Name,
        custom_fields: formattedCustomFields,
        schemes: schemesForApi,
        // Add other fields if needed (e.g., Age, Gender, House_Number, etc.)
        // Ensure only fields allowed by backend schema are included
      };

      // Call the API to update voter
      await updateVoterByParty(editingVoter.voter_id, updateData);
      message.success("Voter updated successfully!");

      // Show success toast


      // Refresh voters data after update (booth-wise or constituency search)
      try {
        if (showFamilyWise) {
          const currentStateId = userRole === "admin" ? selectedState : userStateId;
          const familyDataResult = await getFamilyList(currentStateId, selectedConstituency, selectedBooth);
          if (familyDataResult && Array.isArray(familyDataResult.families)) {
            setFamilyData(familyDataResult.families);
          } else {
            setFamilyData([]);
          }
        }

        if (isConstituencySearchActive) {
          const data = await getVotersByEntireAssemblyConstituency(
            Number(selectedConstituency),
            constituencySearchCurrentPage,
            100,
            constituencySearchSubmitted === "" ? "" : constituencySearchSubmitted,
            "",
            ""
          );
          if (data && Array.isArray(data.voters)) {
            setConstituencySearchResults(data.voters);
            setConstituencySearchTotal(data.total_count ?? 0);
            setConstituencySearchTotalPages(data.total_pages ?? 1);
          }
        } else {
          const data = await getBoothWiseVotersByParty(
            selectedConstituency,
            selectedBooth,
            currentPage,
            750,
            ""
          );
          if (data && Array.isArray(data.voters)) {
            setAllVoters(data.voters);
            setFilteredVoters(data.voters);
            setVoters(data.voters);
          } else {
            setAllVoters([]);
            setFilteredVoters([]);
            setVoters([]);
          }
        }
      } catch (fetchError) {
        console.error("Error reloading voters after update:", fetchError);
        message.error("Voter updated, but failed to refresh voter list.");
      }

      // Close the modal
      closeEditModal();
    } catch (updateError) {
      console.error("Error updating voter:", updateError);
      message.error(
        `Error updating voter: ${updateError.response?.data?.detail || updateError.message}`
      );

    } finally {
      setUpdating(false);
    }
  };

  const currentVoters = isConstituencySearchActive ? constituencySearchResults : voters; // Booth-wise or constituency search
  const startIndex = isConstituencySearchActive
    ? (constituencySearchCurrentPage - 1) * 100
    : (currentPage - 1) * 750;
  const effectiveTotalVoters = isConstituencySearchActive ? constituencySearchTotal : totalVoters;
  const effectiveTotalPages = isConstituencySearchActive ? constituencySearchTotalPages : totalPages;
  const effectiveCurrentPage = isConstituencySearchActive ? constituencySearchCurrentPage : currentPage;
  const endIndex = Math.min(startIndex + currentVoters.length, effectiveTotalVoters);

  // Pagination handlers (booth-wise)
  const goToFirstPage = () => (isConstituencySearchActive ? setConstituencySearchCurrentPage(1) : setCurrentPage(1));
  const goToPreviousPage = () => {
    if (isConstituencySearchActive) {
      setConstituencySearchCurrentPage((prev) => Math.max(1, prev - 1));
    } else {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };
  const goToNextPage = () => {
    if (isConstituencySearchActive) {
      setConstituencySearchCurrentPage((prev) => Math.min(constituencySearchTotalPages, prev + 1));
    } else {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    }
  };
  const goToLastPage = () => (isConstituencySearchActive ? setConstituencySearchCurrentPage(constituencySearchTotalPages) : setCurrentPage(totalPages));
  const goToPage = (page) => (isConstituencySearchActive ? setConstituencySearchCurrentPage(page) : setCurrentPage(page));

  const handleVotersPerPageChange = (newPerPage) => {
    setVotersPerPage(newPerPage);
    setCurrentPage(1); // Reset to first page (booth-wise only; constituency search uses API limit 100)
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const totalP = isConstituencySearchActive ? constituencySearchTotalPages : totalPages;
    const currP = isConstituencySearchActive ? constituencySearchCurrentPage : currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currP - delta);
      i <= Math.min(totalP - 1, currP + delta);
      i++
    ) {
      range.push(i);
    }

    if (currP - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currP + delta < totalP - 1) {
      rangeWithDots.push("...", totalP);
    } else if (totalP > 1) {
      rangeWithDots.push(totalP);
    }

    return rangeWithDots;
  };

  // 3. Helper function to add/remove choices
  const addChoice = () => {
    setNewCustomFieldChoices([...newCustomFieldChoices, ""]);
  };

  const removeChoice = (index) => {
    if (newCustomFieldChoices.length > 1) {
      setNewCustomFieldChoices(
        newCustomFieldChoices.filter((_, i) => i !== index)
      );
    }
  };

  const updateChoice = (index, value) => {
    const updated = [...newCustomFieldChoices];
    updated[index] = value;
    setNewCustomFieldChoices(updated);
  };

  // Filter constituencies based on search
  const filteredConstituencies = Assignedconstituencies.filter((c) => {
    const searchLower = constituencySearch.toLowerCase();
    const name = c.assembly_constituency_name?.toLowerCase() || "";
    const number = c.assembly_constituency_no?.toString() || "";
    return name.includes(searchLower) || number.includes(searchLower);
  });

  // Filter booths based on search
  const filteredBooths = booths.filter((booth) => {
    const searchLower = boothSearch.toLowerCase();
    const area = (booth.polling_areas || "").toLowerCase();
    const number = booth.polling_station_no?.toString() || "";
    return area.includes(searchLower) || number.includes(searchLower);
  });

  // Close constituency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.constituency-dropdown-container')) {
        setIsConstituencyDropdownOpen(false);
        setConstituencySearch("");
      }
    };

    if (isConstituencyDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isConstituencyDropdownOpen]);

  // Close booth dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.booth-dropdown-container')) {
        setIsBoothDropdownOpen(false);
        setBoothSearch("");
      }
    };

    if (isBoothDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isBoothDropdownOpen]);

  const renderVoterRow = (voter, defaultIndexKey = null) => (
    <TableRow
      key={defaultIndexKey ? `${voter.voter_id}-${defaultIndexKey}` : voter.voter_id || Math.random().toString(36).substring(7)}
      className={`group transition-colors border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 ${darkMode
        ? "bg-[#1a1a1a] hover:bg-[#222]"
        : "bg-white hover:bg-gray-50/80"
        } ${voter.edited_by_current_party
          ? darkMode ? "bg-[#a8e6cf]/5 border-l-4 border-l-[#a8e6cf]" : "bg-[#a8e6cf]/5 border-l-4 border-l-[#a8e6cf]"
          : ""
        }`}
    >
      {visibleColumns.name && (
        <TableCell
          className={`align-top text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"
            }`}
          style={{ minWidth: "192px", width: "192px" }}
        >
          <div className="truncate font-sans font-medium not-italic" title={voter.Name}>
            {voter.Name}
          </div>
        </TableCell>
      )}

      {visibleColumns.relation && (
        <TableCell
          className="align-top"
          style={{ minWidth: "160px", width: "160px" }}
        >
          {(() => {
            const relationName =
              voter.Father_Name ||
              voter.Mother_Name ||
              voter.Husband_Name ||
              voter.Others;

            const relationType = voter.Father_Name
              ? "Father"
              : voter.Mother_Name
                ? "Mother"
                : voter.Husband_Name
                  ? "Husband"
                  : voter.Others
                    ? "Other"
                    : "";

            return relationName ? (
              <div className="flex flex-col gap-0.5">
                {/* Relation Name */}
                <span
                  className={`truncate font-medium text-sm ${darkMode ? "text-white" : "text-gray-900"
                    }`}
                  title={relationName}
                >
                  {relationName}
                </span>

                {/* Relation Type */}
                <span
                  className={`text-xs font-semibold ${darkMode ? "text-white" : "text-gray-500"
                    }`}
                >
                  {relationType}
                </span>
              </div>
            ) : (
              <span className={`text-sm ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>—</span>
            );
          })()}
        </TableCell>
      )}


      {visibleColumns.age && (
        <TableCell
          className={`align-middle whitespace-nowrap text-sm ${darkMode ? "text-white" : "text-gray-900"
            }`}
          style={{ minWidth: "80px", width: "80px" }}
        >
          {voter.Age || "—"}
        </TableCell>
      )}

      {visibleColumns.gender && (
        <TableCell
          className="align-middle whitespace-nowrap"
          style={{ minWidth: "96px", width: "96px" }}
        >
          <span
            className="inline-flex items-center justify-center w-20 px-3 py-1 text-[13px] font-medium rounded
    transition-all duration-200 text-center text-black dark:text-white"
          >
            {voter.Gender || "—"}
          </span>
        </TableCell>
      )}

      {visibleColumns.voterId && (
        <TableCell
          className="align-middle whitespace-nowrap"
          style={{ minWidth: "128px", width: "128px" }}
        >
          <span
            className={`font-mono text-sm tracking-wide ${darkMode ? "text-white" : "text-gray-900"
              }`}
          >
            {voter.voter_id || "—"}
          </span>
        </TableCell>
      )}

      {visibleColumns.houseNumber && (
        <TableCell
          className={`align-top text-sm ${darkMode ? "text-white" : "text-gray-900"
            }`}
          style={{ minWidth: "160px", width: "160px" }}
        >
          <div className="truncate" title={voter.House_Number}>
            {voter.House_Number || "—"}
          </div>
        </TableCell>
      )}

      {globalCustomFields.map(
        (field) =>
          visibleColumns[`custom_${field.id}`] && (
            <TableCell
              key={field.id}
              className={`align-top text-sm ${darkMode ? "text-white" : "text-gray-900"
                }`}
              style={{ minWidth: "128px", width: "128px" }}
            >
              {(() => {
                // Match by question_id (preferred) or fallback to name matching
                const customField = voter.custom_fields?.find(
                  (cf) =>
                    (cf.question_id && (field.question_id === cf.question_id || field.id === cf.question_id)) ||
                    (cf.name && field.name.trim().toLowerCase() === cf.name.trim().toLowerCase())
                );

                let displayValue = "—";
                let titleValue = "-";

                if (customField) {
                  // Handle CustomFieldAnswer format: choice_ids, choice_id, or value
                  if (field.question_type === "multiple_choice") {
                    // For multiple_choice, use choice_ids array
                    const choiceIds = customField.choice_ids || (Array.isArray(customField.value) ? customField.value : []);
                    if (Array.isArray(choiceIds) && choiceIds.length > 0) {
                      // Map choice_ids to labels
                      if (field.choices && Array.isArray(field.choices)) {
                        const labels = choiceIds
                          .map((choiceId) => {
                            const choice = field.choices.find(
                              (c) => String(c.choice_id) === String(choiceId) || String(c) === String(choiceId)
                            );
                            return choice?.label || choice || choiceId;
                          })
                          .filter(Boolean);
                        displayValue = labels.join(", ");
                        titleValue = labels.join(", ");
                      } else {
                        displayValue = choiceIds.join(", ");
                        titleValue = choiceIds.join(", ");
                      }
                    }
                  } else if (field.question_type === "prediction") {
                    // For prediction, use choice_id
                    const choiceId = customField.choice_id || customField.value;
                    if (choiceId) {
                      // Try to find label from field.choices
                      if (field.choices && Array.isArray(field.choices)) {
                        const choice = field.choices.find(
                          (c) => String(c.choice_id) === String(choiceId) || String(c) === String(choiceId)
                        );
                        displayValue = choice?.label || choice || String(choiceId);
                        titleValue = displayValue;
                      } else {
                        displayValue = String(choiceId);
                        titleValue = String(choiceId);
                      }
                    }
                  } else {
                    // For text and yes_no, use value string
                    if (customField.value !== undefined && customField.value !== null) {
                      displayValue = String(customField.value);
                      titleValue = String(customField.value);
                    }
                  }
                }

                return (
                  <div className="truncate" title={titleValue}>
                    {displayValue}
                  </div>
                );
              })()}
            </TableCell>
          )
      )}

      {visibleColumns.actions && (
        <TableCell
          className={`px-6 py-4 align-middle whitespace-nowrap text-sm ${darkMode ? "text-white" : "text-gray-900"
            }`}
          style={{ minWidth: "96px", width: "96px" }}
        >
          {/* Conditionally render Edit button or "No Access" message */}
          {permissions.edit ? (
            <>
              <button
                onClick={() => handleEditVoter(voter)}
                className={`inline-flex items-center justify-center rounded-md border-none px-2 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105 ${darkMode
                  ? "text-gray-100 hover:bg-[#ff6b9d]/10"
                  : "text-gray-900 hover:bg-[#ff6b9d]/10"
                  }`}
              >
                <Edit className="h-4 w-4" />
              </button>

              {/* <button
              onClick={() => handleOpenSurveyModal(voter)}
              className="inline-flex items-center justify-center rounded-md border-none px-2 py-1.5 text-xs font-medium transition-all duration-200 hover:scale-105  bg-green-600 text-white
"
              title="Fill Survey"
            >
              Survey
            </button> */}
            </>









          ) : (
            <span className={`flex items-center group relative ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"}`}>
              <span className="text-xs">🔒 NO Access</span>
              {/* Hover tooltip */}
              <span className={`absolute left-0 bottom-full mb-1 hidden group-hover:block text-white text-xs px-2 py-1 rounded shadow-sm z-20 ${darkMode ? "bg-gray-600" : "bg-black"
                }`}>
                Contact to your admin
              </span>
            </span>
          )}
        </TableCell>
      )}
    </TableRow>
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnSelector && !event.target.closest(".relative")) {
        setShowColumnSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnSelector]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-[#262626]">

      {/* Update Loader */}
      {updating && <UpdateLoader />}

      {/* Toast Notification */}
      {/* {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-md shadow-sm flex items-center space-x-2">
          <CheckCircle size={20} />
          <span className="font-medium">Voter updated successfully!</span>
        </div>
      )} */}

      {/* Fixed Top Filter Card */}
      <div className="flex-shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333]">
        <div className="px-6 py-4">
          {/* <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Party -
              </h3>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                style={{
                  backgroundColor: partyInfo.color,
                  color: partyInfo.textColor,
                  borderColor: partyInfo.borderColor,
                }}
              >
                {partyInfo.name}
              </span>
            </div>
          </div> */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* State Dropdown - Only for admins */}
            {userRole === "admin" && (
              <div className="relative flex-none w-1/5">
                <Select
                  value={selectedState ? String(selectedState) : ""}
                  onValueChange={(value) => {
                    setSelectedState(Number(value));
                    setSelectedConstituency("");
                    setSelectedBooth("");
                  }}
                  disabled={statesLoading || states.length === 0}
                >
                  <SelectTrigger
                    className={`w-full appearance-none border rounded-md px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] dark:focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                      ? "bg-[#1a1a1a] border-[#333] text-white hover:border-[#4d4d4d]"
                      : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-gray-300"
                      }`}
                  >
                    <SelectValue
                      placeholder={
                        statesLoading
                          ? "Loading states..."
                          : states.length === 0
                            ? "No states found"
                            : "Select State"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 ${darkMode ? "bg-[#1a1a1a] border-[#333] text-white" : "bg-white border-gray-200"
                      }`}
                  >
                    {states.map((state) => (
                      <SelectItem
                        key={state.state_id}
                        value={String(state.state_id)}
                      >
                        {state.state_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* For agents, show state as disabled (read-only) */}
            {userRole === "agent" && (
              <div className="relative flex-none w-1/5">
                <Select value={userStateId ? String(userStateId) : ""} disabled>
                  <SelectTrigger
                    className={`w-full appearance-none border rounded-md px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] dark:focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                      ? "bg-[#1a1a1a] border-[#333] text-white"
                      : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-gray-300"
                      }`}
                  >
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent
                    className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow duration-200 ${darkMode ? "bg-[#1a1a1a] border-[#333] text-white" : "bg-white border-gray-200"
                      }`}
                  >
                    <SelectItem value={userStateId ? String(userStateId) : ""}>
                      {(() => {
                        const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
                        return userData.state_name || "State";
                      })()}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="relative flex-none w-1/5 constituency-dropdown-container">
              <div className="relative">
                <Input
                  type="text"
                  className={`w-full pr-10 ${darkMode
                    ? "bg-[#1a1a1a] border-[#333] text-white hover:border-[#4d4d4d]"
                    : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-gray-300"
                    }`}
                  placeholder={
                    !selectedConstituency
                      ? constituenciesLoading
                        ? "Loading constituencies..."
                        : "Search Constituency..."
                      : "Search Constituency..."
                  }
                  value={
                    constituencySearch ||
                    (selectedConstituency && !isConstituencyDropdownOpen
                      ? Assignedconstituencies.find(c =>
                        String(c.assembly_constituency_no) === String(selectedConstituency) ||
                        String(c.assembly_constituency_id) === String(selectedConstituency)
                      )?.assembly_constituency_name || ""
                      : "")
                  }
                  onChange={(e) => {
                    setConstituencySearch(e.target.value);
                    setIsConstituencyDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsConstituencyDropdownOpen(true);
                    setConstituencySearch("");
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!isConstituencyDropdownOpen) {
                        setConstituencySearch("");
                      }
                    }, 200);
                  }}
                  disabled={!Assignedconstituencies.length || constituenciesLoading}
                />

                {/* Clear button */}
                {constituencySearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setConstituencySearch("");
                      setIsConstituencyDropdownOpen(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Dropdown list */}
              {isConstituencyDropdownOpen && (
                <>
                  {filteredConstituencies.length > 0 ? (
                    <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-sm hover:shadow-md max-h-60 overflow-y-auto transition-shadow duration-200 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-200"
                      }`}>
                      {filteredConstituencies
                        .sort((a, b) =>
                          a.assembly_constituency_name.localeCompare(
                            b.assembly_constituency_name
                          )
                        )
                        .map((c) => (
                          <div
                            key={c.assembly_constituency_no}
                            className={`px-3 py-2 cursor-pointer transition-all duration-200 ${selectedConstituency === String(c.assembly_constituency_no || c.assembly_constituency_id)
                              ? darkMode ? "bg-[#a8e6cf]/20 text-white font-semibold border-l-2 border-[#a8e6cf]" : "bg-[#a8e6cf]/10 text-gray-900 font-semibold border-l-2 border-[#a8e6cf]"
                              : ""
                              } ${darkMode && selectedConstituency !== String(c.assembly_constituency_no || c.assembly_constituency_id) ? "hover:bg-[#1a1a1a] text-white" : "hover:bg-[#a8e6cf]/5"}`}
                            onClick={() => {
                              const constituencyNo = c.assembly_constituency_no || c.assembly_constituency_id;
                              setSelectedConstituency(String(constituencyNo));
                              setConstituencySearch("");
                              setIsConstituencyDropdownOpen(false);
                            }}
                          >
                            <div className="text-sm">
                              {c.assembly_constituency_name}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : constituencySearch ? (
                    <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-sm p-3 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-300"
                      }`}>
                      <div className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No constituencies found
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Booth Dropdown */}
            <div className="relative flex-none w-1/5 booth-dropdown-container">
              <div className="relative">
                <Input
                  type="text"
                  className={`w-full pr-10 ${darkMode
                    ? "bg-[#1a1a1a] border-[#333] text-white hover:border-[#4d4d4d]"
                    : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-gray-300"
                    }`}
                  placeholder={
                    !selectedBooth
                      ? !selectedConstituency
                        ? "Select Constituency first"
                        : boothsLoading
                          ? "Loading booths..."
                          : booths.length === 0
                            ? "No booths found"
                            : "Search Booth..."
                      : "Search Booth..."
                  }
                  value={
                    boothSearch ||
                    (selectedBooth && !isBoothDropdownOpen
                      ? booths.find(b => String(b.polling_station_no) === String(selectedBooth))
                        ? `${(booths.find(b => String(b.polling_station_no) === String(selectedBooth)).polling_areas || "Polling area").slice(0, 30)} (Booth ${selectedBooth})`
                        : ""
                      : "")
                  }
                  onChange={(e) => {
                    setBoothSearch(e.target.value);
                    setIsBoothDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setIsBoothDropdownOpen(true);
                    setBoothSearch("");
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      if (!isBoothDropdownOpen) {
                        setBoothSearch("");
                      }
                    }, 200);
                  }}
                  disabled={!selectedConstituency || boothsLoading || booths.length === 0}
                />

                {/* Clear button */}
                {boothSearch && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setBoothSearch("");
                      setIsBoothDropdownOpen(true);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Dropdown list */}
              {isBoothDropdownOpen && selectedConstituency && (
                <>
                  {filteredBooths.length > 0 ? (
                    <div className={`absolute z-50 w-full mt-1 border rounded-xl shadow-sm hover:shadow-md max-h-60 overflow-y-auto transition-shadow duration-200 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-200"
                      }`}>
                      {/* Family Wise Toggle in Dropdown */}
                      <div className={`px-3 py-2 border-b sticky top-0 z-10 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-gray-50 border-gray-200"}`}>
                        <label className="flex items-center gap-2 cursor-pointer w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded text-[#a8e6cf] focus:ring-[#a8e6cf]"
                            checked={showFamilyWise}
                            onChange={(e) => {
                              setShowFamilyWise(e.target.checked);
                              if (!e.target.checked && isConstituencySearchActive) {
                                clearConstituencySearch();
                              }
                            }}
                            disabled={!selectedBooth}
                          />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} ${!selectedBooth ? "opacity-50" : ""}`}>
                            Show Family Wise
                          </span>
                        </label>
                      </div>

                      {filteredBooths
                        .sort((a, b) => {
                          // Sort by booth number
                          return Number(a.polling_station_no) - Number(b.polling_station_no);
                        })
                        .map((booth) => (
                          <div
                            key={booth.polling_station_no}
                            className={`px-3 py-2 cursor-pointer transition-all duration-200 ${selectedBooth === String(booth.polling_station_no)
                              ? darkMode ? "bg-[#a8e6cf]/20 text-white font-semibold border-l-2 border-[#a8e6cf]" : "bg-[#a8e6cf]/10 text-gray-900 font-semibold border-l-2 border-[#a8e6cf]"
                              : ""
                              } ${darkMode && selectedBooth !== String(booth.polling_station_no) ? "hover:bg-[#1a1a1a] text-white" : "hover:bg-[#a8e6cf]/5"}`}
                            onClick={() => {
                              setSelectedBooth(String(booth.polling_station_no));
                              setBoothSearch("");
                              setIsBoothDropdownOpen(false);
                            }}
                          >
                            <div className="text-sm">
                              <span className="font-medium">
                                {(booth.polling_areas || "Polling area").slice(0, 30)}
                              </span>
                              <span className={`text-xs ml-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                (Booth {booth.polling_station_no})
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : boothSearch ? (
                    <div className={`absolute z-50 w-full mt-1 border rounded-md shadow-sm p-3 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-300"
                      }`}>
                      <div className={`text-sm text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No booths found
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Constituency-wide search (getVotersByEntireAssemblyConstituency) */}
            <div className="flex items-center gap-2 flex-none">
              <Input
                type="text"
                placeholder="Search in constituency..."
                value={constituencySearchTerm}
                onChange={(e) => setConstituencySearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runConstituencySearch()}
                disabled={!selectedConstituency}
                className={`min-w-[220px] max-w-[320px] w-full ${darkMode
                  ? "bg-[#1a1a1a] border-[#333] text-white hover:border-[#4d4d4d]"
                  : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-gray-300"
                  }`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runConstituencySearch}
                disabled={!selectedConstituency || constituencySearchLoading}
                className={`shrink-0 ${darkMode ? "border-[#333]" : "border-gray-200"}`}
              >
                {constituencySearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
              </Button>
              {isConstituencySearchActive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearConstituencySearch}
                  disabled={constituencySearchLoading}
                  className="shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* NEW: Column Visibility Toggle */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className={`${darkMode
                  ? "border-[#333] hover:border-[#a8e6cf]/30"
                  : "bg-white border-gray-200 text-gray-900 shadow-sm hover:shadow-md hover:border-gray-300"
                  }`}
                title="Show/Hide Columns"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>

              {/* Column Selector Dropdown */}
              {showColumnSelector && (
                <div
                  className={`absolute right-0 top-full mt-1 w-80 rounded-md border shadow-md z-50 max-h-96 overflow-y-auto transition-all duration-200 ${darkMode
                    ? "bg-[#1a1a1a] border-[#333]"
                    : "bg-white border-gray-200"
                    }`}
                >
                  <div className="p-3">
                    {/* Header with Add Button */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`text-xs font-medium ${darkMode ? "text-white" : "text-gray-500"
                          }`}
                      >
                        Show/Hide Columns
                      </div>
                      {/* Show Add Field button only for admin or agent with add permission */}
                      {(userRole === "admin" || (userRole === "agent" && permissions.add)) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-800"
                          onClick={() =>
                            setShowAddCustomField(!showAddCustomField)
                          }
                        >
                          <Plus size={14} />
                          <span className="ml-1">Add Field</span>
                        </Button>
                      )}
                    </div>

                    {/* Add Custom Field Input - Fixed positioning */}
                    {showAddCustomField && (
                      <div
                        className={`mb-3 p-3 border rounded-md ${darkMode
                          ? "border-[#333] bg-[#1a1a1a]"
                          : "border-gray-200 bg-gray-50"
                          }`}
                      >
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs font-medium mb-1">
                              Field Name
                            </Label>
                            <Input
                              type="text"
                              placeholder="Enter field name..."
                              value={newCustomFieldName}
                              onChange={(e) =>
                                setNewCustomFieldName(e.target.value)
                              }
                              className={`text-sm ${darkMode
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300"
                                }`}
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-medium mb-1">
                              Field Type
                            </Label>
                            <Select
                              value={newCustomFieldType}
                              onValueChange={(value) => {
                                setNewCustomFieldType(value);
                                if (
                                  value === "text" ||
                                  value === "yes_no"
                                ) {
                                  setNewCustomFieldChoices([""]);
                                }
                              }}
                            >
                              <SelectTrigger className={`text-sm ${darkMode
                                ? "bg-gray-600 border-gray-500 text-white"
                                : "bg-white border-gray-300"
                                }`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="text">Text Input</SelectItem>
                                <SelectItem value="multiple_choice">
                                  Multiple Choice
                                </SelectItem>
                                <SelectItem value="yes_no">Yes/No</SelectItem>
                                <SelectItem value="prediction">Options</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Choices Input (for multiple_choice and prediction) */}
                          {(newCustomFieldType === "multiple_choice" ||
                            newCustomFieldType === "prediction") && (
                              <div>
                                <Label className="text-xs font-medium mb-1">
                                  Options
                                </Label>
                                <div className="space-y-2">
                                  {newCustomFieldChoices.map((choice, index) => (
                                    <div key={index} className="flex gap-2">
                                      <Input
                                        type="text"
                                        placeholder={`Option ${index + 1}`}
                                        value={choice}
                                        onChange={(e) =>
                                          updateChoice(index, e.target.value)
                                        }
                                        className={`flex-1 text-sm ${darkMode
                                          ? "bg-gray-600 border-gray-500 text-white"
                                          : "bg-white border-gray-300"
                                          }`}
                                      />
                                      {newCustomFieldChoices.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeChoice(index)}
                                          className="h-8 w-8 text-red-600 hover:text-red-800"
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={addChoice}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Plus size={12} />
                                    <span className="ml-1">Add Option</span>
                                  </Button>
                                </div>
                              </div>
                            )}
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={handleAddCustomField}
                              disabled={
                                !newCustomFieldName.trim() ||
                                ((newCustomFieldType === "multiple_choice" ||
                                  newCustomFieldType === "prediction") &&
                                  newCustomFieldChoices.filter((c) => c.trim())
                                    .length === 0)
                              }
                              className="flex-1 bg-[#a8e6cf] text-gray-900 hover:bg-[#a8e6cf]/80"
                            >
                              Create Field
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowAddCustomField(false);
                                setNewCustomFieldName("");
                                setNewCustomFieldType("text");
                                setNewCustomFieldChoices([""]);
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* All Columns in One Section */}
                    <div className="space-y-1">
                      {/* Standard Columns */}
                      {[
                        { key: "relation", label: "Relation" },
                        { key: "age", label: "Age" },
                        { key: "gender", label: "Gender" },
                        { key: "voterId", label: "Voter ID" },
                        { key: "houseNumber", label: "House Number" },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 rounded px-1 transition-all duration-200"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[key]}
                            onChange={() => toggleColumnVisibility(key)}
                            className="rounded text-[#a8e6cf] focus:ring-[#a8e6cf] transition-all duration-200"
                          />
                          <span
                            className={`text-sm flex-1 ${darkMode ? "text-white" : "text-gray-500"
                              }`}
                          >
                            {label}
                          </span>
                          {visibleColumns[key] ? (
                            <Eye className="w-3 h-3 text-[#a8e6cf] transition-colors duration-200" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-[#8e8ea0] transition-colors duration-200" />
                          )}
                        </label>
                      ))}
                      <h2>Custom Fields</h2>

                      {/* Custom Fields - Integrated in the same list */}
                      {globalCustomFields.length > 0 && (
                        <>
                          {/* Optional separator */}
                          <div
                            className={`my-2 border-t ${darkMode ? "border-[#333]" : "border-gray-200"
                              }`}
                          />
                          {globalCustomFields.map((field) => (
                            <label
                              key={field.id}
                              className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 rounded px-1 transition-all duration-200"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  visibleColumns[`custom_${field.id}`] || false
                                }
                                onChange={() =>
                                  toggleColumnVisibility(`custom_${field.id}`)
                                }
                                className="rounded text-[#a8e6cf] focus:ring-[#a8e6cf] transition-all duration-200"
                              />

                              <span
                                className={`text-sm flex-1 truncate ${darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                title={field.name}
                              >
                                {field.name}
                                {/* <span className="ml-1 text-xs text-blue-500">
                                  (Custom)
                                </span> */}
                              </span>
                              {visibleColumns[`custom_${field.id}`] ? (
                                <Eye className="w-3 h-3 text-green-500" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-gray-400" />
                              )}
                            </label>
                          ))}
                        </>
                      )}

                      {/* Show message when no custom fields */}
                      {globalCustomFields.length === 0 && (
                        <div
                          className={`text-xs text-center py-2 italic ${darkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                        >
                          No custom fields yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table and Pagination Container */}
      <div
        className={`flex-1 mx-0 mb-6 border overflow-hidden rounded-xl shadow-sm hover:shadow-md flex flex-col transition-all duration-200 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-200"
          }`}
      >
        {(loading || (isConstituencySearchActive && constituencySearchLoading) || (showFamilyWise && familyDataLoading)) ? (
          <SkeletonLoader darkMode={darkMode} />
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Table Container with Horizontal Scroll */}
            <div className="flex-1 overflow-auto relative pb-4">
              <Table>
                <TableHeader className={`sticky top-0 z-20 ${darkMode ? "bg-[#1a1a1a] border-b border-[#333]" : "bg-gray-50/50 border-b border-gray-100"}`}>
                  <TableRow className="hover:bg-transparent">
                    {visibleColumns.name && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "192px", width: "192px" }}
                      >
                        Name
                      </TableHead>
                    )}
                    {visibleColumns.relation && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "160px", width: "160px" }}
                      >
                        Relation
                      </TableHead>
                    )}
                    {visibleColumns.age && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "80px", width: "80px" }}
                      >
                        Age
                      </TableHead>
                    )}
                    {visibleColumns.gender && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "96px", width: "96px" }}
                      >
                        Gender
                      </TableHead>
                    )}
                    {visibleColumns.voterId && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "128px", width: "128px" }}
                      >
                        Voter ID
                      </TableHead>
                    )}
                    {visibleColumns.houseNumber && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "160px", width: "160px" }}
                      >
                        House Number
                      </TableHead>
                    )}
                    {/* Custom Field Headers */}
                    {globalCustomFields.map(
                      (field) =>
                        visibleColumns[`custom_${field.id}`] && (
                          <TableHead
                            key={field.id}
                            className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                              }`}
                            style={{ minWidth: "128px", width: "128px" }}
                          >
                            {field.name}
                          </TableHead>
                        )
                    )}
                    {visibleColumns.actions && (
                      <TableHead
                        className={`text-left text-[10px] font-bold tracking-widest uppercase ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                          }`}
                        style={{ minWidth: "96px", width: "96px" }}
                      >
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody
                  className={darkMode
                    ? "bg-[#1a1a1a]"
                    : "bg-white"
                  }
                >
                  {showFamilyWise ? (
                    familyData.length > 0 ? (
                      familyData.map((family) => {
                        const isExpanded = expandedFamilies.has(family.family_id);
                        return (
                          <Fragment key={family.family_id}>
                            <TableRow
                              className={`cursor-pointer transition-colors ${darkMode ? "bg-[#2a2a2a]/50 hover:bg-[#333]/50" : "bg-gray-50/80 hover:bg-gray-100"}`}
                              onClick={() => toggleFamily(family.family_id)}
                            >
                              <TableCell colSpan={100} className="py-2 px-4 border-y border-gray-200 dark:border-[#333]">
                                <div className="flex items-center w-full relative">
                                  {/* Container meant to align with 'Name' column (approx 192px + padding left) */}
                                  <div className="flex items-center gap-2" style={{ minWidth: "192px", width: "192px" }}>
                                    {isExpanded ? (
                                      <ChevronDown className={`w-4 h-4 shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                                    ) : (
                                      <ChevronRight className={`w-4 h-4 shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                                    )}
                                    <span className={`font-semibold truncate ${darkMode ? "text-[#a8e6cf]" : "text-emerald-700"}`}>
                                      Family of {family.Family_of || "Unknown"}
                                    </span>
                                  </div>

                                  {/* Container meant to align with 'Relation' column (approx 160px + gap) */}
                                  <div style={{ minWidth: "160px", width: "160px" }} className="ml-8">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-[#333] text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                                      {family.total_members} Member{family.total_members !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                            {isExpanded && family.members && family.members.map((member, index) => renderVoterRow(member, `family-${family.family_id}-${index}`))}
                          </Fragment>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={100} className="text-center py-8 text-sm text-gray-500">
                          No families found for this booth.
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    currentVoters.map((voter, index) => renderVoterRow(voter, index))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Fixed Bottom Pagination */}
        {effectiveTotalPages > 1 && (
          <div
            className={`flex-shrink-0 border-t p-4 mt-2 transition-all duration-200 ${darkMode
              ? "border-[#333] bg-[#1a1a1a]"
              : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs ${darkMode ? "text-[#8e8ea0]" : "text-gray-500"
                  }`}
              >
                Showing {startIndex + 1} to {Math.min(endIndex, effectiveTotalVoters)} of{" "}
                {effectiveTotalVoters} voters
                {isConstituencySearchActive && (
                  <span className="ml-1 opacity-80">(constituency search)</span>
                )}
              </span>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToFirstPage}
                    disabled={effectiveCurrentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronsLeft size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousPage}
                    disabled={effectiveCurrentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft size={12} />
                  </Button>

                  {getPageNumbers().map((page, index) => (
                    <Button
                      key={index}
                      variant={page === effectiveCurrentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => typeof page === "number" && goToPage(page)}
                      disabled={page === "..."}
                      className={page === effectiveCurrentPage
                        ? "bg-[#a8e6cf] text-gray-900 border-[#a8e6cf] font-semibold"
                        : page === "..."
                          ? "cursor-default"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextPage}
                    disabled={effectiveCurrentPage === effectiveTotalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight size={12} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToLastPage}
                    disabled={effectiveCurrentPage === effectiveTotalPages}
                    className="h-8 w-8"
                  >
                    <ChevronsRight size={12} />
                  </Button>
                </div>

                {/* Page size selector removed as requested (fixed to 750) */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingVoter} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Voter</DialogTitle>
            <DialogDescription>
              Update voter information and custom fields
            </DialogDescription>
          </DialogHeader>

          {/* <div className="flex items-center gap-3 mb-6">
              <h3
                className={`text-lg font-semibold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Edit Voter -
              </h3>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border"
                style={{
                  backgroundColor: partyInfo.color,
                  color: partyInfo.textColor,
                  borderColor: partyInfo.borderColor,
                }}
              >
                {partyInfo.name}
              </span>
            </div> */}

          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                type="text"
                name="Name"
                disabled
                value={editForm.Name}
                onChange={handleEditChange}
              />
            </div>

            {/* Custom Fields Section */}
            <div className="pt-4">
              <h4
                className={`mb-3 text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                <span className="underline">Custom Fields</span>
              </h4>
              {globalCustomFields.length === 0 && (
                <div
                  className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                  No custom fields added. Use the column selector to add
                  fields.
                </div>
              )}
              {globalCustomFields.map((field) => {
                return (
                  <div key={field.id} className="mb-4">
                    <Label>{field.name}</Label>

                    {(!field.question_type || field.question_type === "text") && (
                      <Input
                        type="text"
                        value={editForm.custom_fields_values[field.id] || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            custom_fields_values: {
                              ...prev.custom_fields_values,
                              [field.id]: e.target.value,
                            },
                          }))
                        }
                        className={darkMode ? "bg-[#1a1a1a] border-[#333] text-white" : ""}
                      />
                    )}

                    {field.question_type === "yes_no" && (
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`field_${field.id}`}
                            value="Yes"
                            checked={editForm.custom_fields_values[field.id] === "Yes"}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                custom_fields_values: {
                                  ...prev.custom_fields_values,
                                  [field.id]: e.target.value,
                                },
                              }))
                            }
                            className="text-blue-600"
                          />
                          <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`field_${field.id}`}
                            value="No"
                            checked={editForm.custom_fields_values[field.id] === "No"}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                custom_fields_values: {
                                  ...prev.custom_fields_values,
                                  [field.id]: e.target.value,
                                },
                              }))
                            }
                            className="text-blue-600"
                          />
                          <span className={darkMode ? "text-gray-300" : "text-gray-700"}>No</span>
                        </label>
                      </div>
                    )}

                    {field.question_type === "multiple_choice" && field.choices?.length > 0 && (
                      <div className="space-y-2">
                        {field.choices.map((choice, index) => {
                          // choice is now an object with {choice_id, label}
                          const choiceId = choice.choice_id;
                          const choiceLabel = choice.label || String(choice);

                          const currentValues = editForm.custom_fields_values[field.id]
                            ? Array.isArray(editForm.custom_fields_values[field.id])
                              ? editForm.custom_fields_values[field.id]
                              : []
                            : [];

                          return (
                            <label key={`${field.id}-${index}-${choiceId}`} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentValues.includes(choiceId)}
                                onChange={(e) => {
                                  const currentArray = editForm.custom_fields_values[field.id]
                                    ? Array.isArray(editForm.custom_fields_values[field.id])
                                      ? [...editForm.custom_fields_values[field.id]]
                                      : []
                                    : [];

                                  let updatedArray;
                                  if (e.target.checked) {
                                    updatedArray = [...currentArray, choiceId];
                                  } else {
                                    updatedArray = currentArray.filter((item) => item !== choiceId);
                                  }

                                  setEditForm((prev) => ({
                                    ...prev,
                                    custom_fields_values: {
                                      ...prev.custom_fields_values,
                                      [field.id]: updatedArray,
                                    },
                                  }));
                                }}
                                className="text-blue-600 rounded"
                              />
                              <span
                                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                              >
                                {choiceLabel}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {field.question_type === "prediction" && field.choices?.length > 0 && (
                      <div className="space-y-2">
                        {field.choices.map((choice, index) => {
                          // choice is now an object with {choice_id, label}
                          const choiceId = choice.choice_id;
                          const choiceLabel = choice.label || String(choice);

                          return (
                            <label key={`${field.id}-${index}-${choiceId}`} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`field_${field.id}`}
                                value={choiceId}
                                checked={editForm.custom_fields_values[field.id] === choiceId}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    custom_fields_values: {
                                      ...prev.custom_fields_values,
                                      [field.id]: e.target.value,
                                    },
                                  }))
                                }
                                className="text-blue-600"
                              />
                              <span
                                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                              >
                                {choiceLabel}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <hr className="border-t border-gray-300 dark:border-[#333] mt-4" />
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEditModal}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVoter}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin mr-2"
                  />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div >
  );
}
