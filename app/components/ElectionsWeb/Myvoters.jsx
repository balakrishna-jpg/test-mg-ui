import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate, useParams } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
  Edit3,
  X,
  Edit,
  Trash2
} from "lucide-react";

import {
  getFovoriteVotersEdited,
  updateVoterByParty,
  getPollingBoothCounts,
  getStateAndConstituencyWiseBooths,
  getElectionStates,
  getAssemblyConstituencies,
  deleteMyEditedVoter,
  deleteMyEditedVotersBulk,
} from "~/api";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

import { message } from "antd";

// Skeleton Loading Component
const SkeletonLoader = ({ darkMode }) => (
  <div className="flex flex-col">
    <div
      className={`border overflow-hidden ${darkMode ? "border-[#3d3d3d] bg-[#2d2d2d]" : "border-[#e5e5e6] bg-white"
        }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-sm ${darkMode ? "border-[#3d3d3d] text-[#ececf1]" : "border-[#e5e5e6] text-[#202123]"
          }`}
      >
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]">
        <table className="min-w-full border-collapse">
          <thead className={`sticky top-0 z-20 ${darkMode ? "bg-[#2d2d2d] border-b border-[#3d3d3d]" : "bg-white border-b border-[#e5e5e6]"}`}>
            <tr>
              <th className={`px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"
                }`}>
                <div className={`h-4 w-4 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`}></div>
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                Name
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                Relation
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                Age
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                Gender
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                Voter ID
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                House Number
              </th>
              <th className={`px-4 py-3 text-left text-md font-medium tracking-wider ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode
            ? "bg-[#2d2d2d] divide-[#3d3d3d]"
            : "bg-white divide-[#e5e5e6]"
            }`}>
            {[...Array(8)].map((_, index) => (
              <tr key={index} className={`transition-all duration-200 ${darkMode ? "bg-[#2d2d2d] hover:bg-[#2d2d2d]/80" : "bg-white hover:bg-[#f7f7f8]"
                }`}>
                <td className="px-4 py-3">
                  <div className={`h-4 w-4 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`}></div>
                </td>
                <td className={`px-4 py-3`}>
                  <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "60%" }}></div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-2">
                    <div className={`h-3 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "70%" }}></div>
                    <div className={`h-3 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "40%" }}></div>
                  </div>
                </td>
                <td className={`px-4 py-3`}>
                  <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "30px" }}></div>
                </td>
                <td className="px-4 py-3">
                  <div className={`h-6 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "50px" }}></div>
                </td>
                <td className={`px-4 py-3`}>
                  <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "80px" }}></div>
                </td>
                <td className={`px-4 py-3`}>
                  <div className={`h-4 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`} style={{ width: "50%" }}></div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`}></div>
                    <div className={`h-6 w-6 rounded animate-pulse ${darkMode ? "bg-[#3d3d3d]" : "bg-[#e5e5e6]"}`}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const EmptyState = ({ darkMode }) => (
  <div
    className={`flex flex-col items-center justify-center border px-4 py-16 ${darkMode ? "border-[#3d3d3d] bg-[#2d2d2d]" : "border-[#e5e5e6] bg-white"
      }`}
  >
    <p className={`text-base font-medium ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>
      No edited voters found
    </p>
    <p className={`mt-2 text-sm ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
      Favorites will show up here once voters are edited.
    </p>
  </div>
);

const getRelationDetails = (voter) => {
  const relationName =
    voter?.Father_Name ||
    voter?.Mother_Name ||
    voter?.Husband_Name ||
    voter?.Others ||
    "";

  const relationType = voter?.Father_Name
    ? "Father"
    : voter?.Mother_Name
      ? "Mother"
      : voter?.Husband_Name
        ? "Husband"
        : voter?.Others
          ? "Other"
          : "";

  return { relationName, relationType };
};

export default function Myvoters() {
  const outletContext = useOutletContext() || {};
  const { darkMode = false } = outletContext;
  const navigate = useNavigate();
  

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Edited voters
  const [editedVoters, setEditedVoters] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit modal state
  const [editingVoter, setEditingVoter] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    Name: "",
    custom_fields_values: {}, // { [fieldName]: value }
  });

  // Delete state
  const [selectedVoters, setSelectedVoters] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletingVoterId, setDeletingVoterId] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [voterToDelete, setVoterToDelete] = useState(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Location filters (state -> constituency -> booth)
  const [userStateId, setUserStateId] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [assignedBooths, setAssignedBooths] = useState([]);

  const [constituencies, setConstituencies] = useState([]);
  const [assignedConstituencies, setAssignedConstituencies] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [selectedBooth, setSelectedBooth] = useState("");
  const [constituenciesLoading, setConstituenciesLoading] = useState(false);

  const [booths, setBooths] = useState([]);
  const [boothsLoading, setBoothsLoading] = useState(false);

  // Constituency search dropdown (same UX as VotersDB)
  const [constituencySearch, setConstituencySearch] = useState("");
  const [isConstituencyDropdownOpen, setIsConstituencyDropdownOpen] =
    useState(false);

  useEffect(() => {
    // Load user info (state, role, assignments) from localStorage – same pattern as VotersDB
    const userData = JSON.parse(localStorage.getItem("user_info") || "{}");

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

      if (
        userData.role === "agent" &&
        Array.isArray(userData.assigned_constituencies) &&
        userData.assigned_constituencies.length > 0
      ) {
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

          if (filteredData.length > 0) {
            const firstConstituency = filteredData[0].assembly_constituency_no;
            setSelectedConstituency(String(firstConstituency));
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

  // Fetch booths when constituency or state changes (same pattern as VotersDB)
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
        if (userRole === "agent" && assignedBooths.length > 0) {
          const allowedBoothNos = assignedBooths
            .filter(
              (b) =>
                Number(b.state_id) === Number(currentStateId) &&
                Number(b.assembly_constituency_no) ===
                Number(selectedConstituency)
            )
            .map((b) => Number(b.polling_station_no));

          const filteredBooths = allBooths.filter((booth) =>
            allowedBoothNos.includes(Number(booth.polling_station_no))
          );
          finalBooths = filteredBooths;
        } else if (userRole === "admin") {
          // Admins see all booths for selected state and constituency
          finalBooths = allBooths;
        }

        setBooths(finalBooths);

        // Auto-select first available booth for this constituency if none selected
        if (!selectedBooth && finalBooths.length > 0) {
          setSelectedBooth(String(finalBooths[0].polling_station_no));
        }
      } catch (err) {
        console.error("Error fetching booths for favorites:", err);
        setBooths([]);
      } finally {
        setBoothsLoading(false);
      }
    }

    fetchBooths();
  }, [selectedConstituency, selectedState, userStateId, userRole, assignedBooths]);

  // Close constituency dropdown when clicking outside (same as VotersDB)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".constituency-dropdown-container")) {
        setIsConstituencyDropdownOpen(false);
        setConstituencySearch("");
      }
    };

    if (isConstituencyDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isConstituencyDropdownOpen]);

  useEffect(() => {
    let isMounted = true;

    const fetchEditedVoters = async () => {
      setLoading(true);
      setError("");

      try {
        if (!selectedConstituency || !selectedBooth) {
          setEditedVoters([]);
          setTotalPages(1);
          setTotalCount(0);
          return;
        }

        const response = await getFovoriteVotersEdited({
          page,
          limit,
          constituency_no: selectedConstituency,
          booth_no: selectedBooth,
        });

        if (!isMounted) {
          return;
        }

        setEditedVoters(response?.edited_voters || []);
        setTotalPages(response?.total_pages || 1);
        setTotalCount(response?.total_count || 0);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setEditedVoters([]);
        setError(err?.message || "Unable to load edited voters.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEditedVoters();

    return () => {
      isMounted = false;
    };
  }, [page, limit, selectedConstituency, selectedBooth]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setSelectedVoters(new Set()); // Clear selections when filters change
  }, [selectedConstituency, selectedBooth]);

  // Filter constituencies for search textbox
  const filteredConstituencies = assignedConstituencies.filter((c) => {
    const searchLower = constituencySearch.toLowerCase();
    const name = c.assembly_constituency_name?.toLowerCase() || "";
    const number = c.assembly_constituency_no?.toString() || "";
    return name.includes(searchLower) || number.includes(searchLower);
  });

  // Custom fields: API may return question_id + value (no "name"). Use question_id as key, show name or "Custom field" as label.
  const customFieldList = useMemo(() => {
    const seen = new Set();
    const list = [];
    editedVoters.forEach((voter) => {
      voter?.custom_fields?.forEach((field) => {
        const key = field?.question_id ?? field?.name?.trim?.();
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push({
            key: String(key),
            label: field?.name?.trim() || "Custom field",
          });
        }
      });
    });
    return list;
  }, [editedVoters]);

  const groupedVoters = useMemo(() => {
    const stateMap = new Map();

    editedVoters.forEach((voter) => {
      const stateKey =
        voter?.state_id !== null && voter?.state_id !== undefined
          ? voter.state_id
          : "Unassigned";
      const constituencyKey =
        voter?.assembly_constituency_no !== null &&
          voter?.assembly_constituency_no !== undefined
          ? voter.assembly_constituency_no
          : "Unassigned";
      const boothKey =
        voter?.polling_booth_no !== null && voter?.polling_booth_no !== undefined
          ? voter.polling_booth_no
          : "Unassigned";

      if (!stateMap.has(stateKey)) {
        stateMap.set(stateKey, {
          stateId: stateKey,
          constituencies: new Map(),
        });
      }

      const stateEntry = stateMap.get(stateKey);

      if (!stateEntry.constituencies.has(constituencyKey)) {
        stateEntry.constituencies.set(constituencyKey, {
          constituencyNo: constituencyKey,
          booths: new Map(),
        });
      }

      const constituencyEntry = stateEntry.constituencies.get(constituencyKey);

      if (!constituencyEntry.booths.has(boothKey)) {
        constituencyEntry.booths.set(boothKey, {
          boothNo: boothKey,
          voters: [],
        });
      }

      constituencyEntry.booths.get(boothKey).voters.push(voter);
    });

    return Array.from(stateMap.values()).map((stateEntry) => ({
      stateId: stateEntry.stateId,
      constituencies: Array.from(stateEntry.constituencies.values()).map(
        (constituencyEntry) => ({
          constituencyNo: constituencyEntry.constituencyNo,
          booths: Array.from(constituencyEntry.booths.values()).sort((a, b) =>
            String(a.boothNo).localeCompare(String(b.boothNo))
          ),
        })
      ),
    }));
  }, [editedVoters]);

  const tableHeaders = [
    { key: "Name", label: "Name" },
    { key: "Relation", label: "Relation" },
    { key: "Age", label: "Age" },
    { key: "Gender", label: "Gender" },
    { key: "voter_id", label: "Voter ID" },
    { key: "House_Number", label: "House Number" },
  ];

  // Open edit modal for a voter (custom_fields keyed by question_id or name)
  const handleEditVoter = (voter) => {
    const customValues = {};
    voter?.custom_fields?.forEach((field) => {
      const key = field?.question_id ?? field?.name?.trim?.();
      if (key) {
        customValues[String(key)] =
          typeof field.value === "string" ? field.value : field.value ?? "";
      }
    });

    setEditForm({
      Name: voter?.Name || "",
      custom_fields_values: customValues,
    });
    setEditingVoter(voter);
  };

  const closeEditModal = () => {
    setEditingVoter(null);
    setEditForm({
      Name: "",
      custom_fields_values: {},
    });
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setEditForm((prev) => ({
      ...prev,
      custom_fields_values: {
        ...prev.custom_fields_values,
        [fieldName]: value,
      },
    }));
  };

  const handleUpdateVoter = async () => {
    if (!editingVoter) return;

    try {
      setUpdating(true);

      // Format custom fields for API: backend expects question_id, question_type, value
      const formattedCustomFields = Object.entries(
        editForm.custom_fields_values || {}
      )
        .map(([question_id, value]) => {
          const existing = editingVoter?.custom_fields?.find(
            (f) => String(f?.question_id) === question_id
          );
          return {
            question_id,
            question_type: existing?.question_type ?? "text",
            choice_id: existing?.choice_id ?? null,
            choice_ids: existing?.choice_ids ?? null,
            value:
              typeof value === "string"
                ? value.trim()
                : value !== undefined && value !== null
                  ? String(value)
                  : "",
          };
        })
        .filter((field) => field.question_id);

      const updateData = {
        Name: editForm.Name,
        custom_fields: formattedCustomFields,
      };

      await updateVoterByParty(
        editingVoter.voter_id,
        editingVoter.party_id,
        updateData
      );

      message.success("Voter updated successfully!");

      // Refresh current favorites list for the same filters
      try {
        const refreshed = await getFovoriteVotersEdited({
          page,
          limit,
          constituency_no: selectedConstituency,
          booth_no: selectedBooth,
        });

        setEditedVoters(refreshed?.edited_voters || []);
        setTotalPages(refreshed?.total_pages || 1);
        setTotalCount(refreshed?.total_count || 0);
      } catch (refreshError) {
        console.error("Error refreshing edited voters after update:", refreshError);
        message.error("Voter updated, but failed to refresh favorites list.");
      }

      closeEditModal();
    } catch (err) {
      console.error("Error updating voter from favorites:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to update voter. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  // Refresh edited voters list
  const refreshEditedVoters = async () => {
    if (!selectedConstituency || !selectedBooth) {
      return;
    }

    try {
      setLoading(true);
      const response = await getFovoriteVotersEdited({
        page,
        limit,
        constituency_no: selectedConstituency,
        booth_no: selectedBooth,
      });

      setEditedVoters(response?.edited_voters || []);
      setTotalPages(response?.total_pages || 1);
      setTotalCount(response?.total_count || 0);
      setSelectedVoters(new Set()); // Clear selections after refresh
    } catch (err) {
      console.error("Error refreshing edited voters:", err);
      message.error("Failed to refresh voters list.");
    } finally {
      setLoading(false);
    }
  };

  // Open delete modal for single voter
  const openDeleteModal = (voter) => {
    if (!voter?.voter_id) {
      message.error("Invalid voter data");
      return;
    }
    setVoterToDelete(voter);
    setDeleteModalOpen(true);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setVoterToDelete(null);
  };

  // Handle single voter delete confirmation
  const handleDeleteVoter = async () => {
    if (!voterToDelete?.voter_id) {
      return;
    }

    try {
      setDeletingVoterId(voterToDelete.voter_id);
      await deleteMyEditedVoter(voterToDelete.voter_id, voterToDelete.party_id || null);
      message.success("Voter  deleted successfully!");
      closeDeleteModal();
      await refreshEditedVoters();
    } catch (err) {
      console.error("Error deleting voter:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to delete voter edit. Please try again."
      );
    } finally {
      setDeletingVoterId(null);
    }
  };

  // Open bulk delete modal
  const openBulkDeleteModal = () => {
    if (selectedVoters.size === 0) {
      message.warning("Please select at least one voter to delete.");
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  // Close bulk delete modal
  const closeBulkDeleteModal = () => {
    setBulkDeleteModalOpen(false);
  };

  // Handle bulk delete confirmation
  const handleBulkDelete = async () => {
    if (selectedVoters.size === 0) {
      return;
    }

    try {
      setDeleting(true);
      const voterIds = Array.from(selectedVoters);

      // Get party_id from first selected voter (assuming all have same party_id)
      const firstVoter = editedVoters.find((v) => voterIds.includes(v.voter_id));
      const partyId = firstVoter?.party_id || null;

      const result = await deleteMyEditedVotersBulk(voterIds, partyId);

      message.success(
        result?.message || `Successfully deleted ${result?.deleted_count || selectedVoters.size} voter edit(s).`
      );

      closeBulkDeleteModal();
      await refreshEditedVoters();
    } catch (err) {
      console.error("Error bulk deleting voters:", err);
      message.error(
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to delete voter edits. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Toggle voter selection
  const toggleVoterSelection = (voterId) => {
    setSelectedVoters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(voterId)) {
        newSet.delete(voterId);
      } else {
        newSet.add(voterId);
      }
      return newSet;
    });
  };

  // Toggle select all voters in a specific booth
  const toggleSelectAllForBooth = (boothVoters) => {
    const boothVoterIds = new Set(boothVoters.map((v) => v.voter_id));
    const allSelected = boothVoterIds.size > 0 && Array.from(boothVoterIds).every((id) => selectedVoters.has(id));

    setSelectedVoters((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all voters in this booth
        boothVoterIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all voters in this booth
        boothVoterIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  // Pagination helper functions
  const goToFirstPage = () => setPage(1);
  const goToPreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setPage((prev) => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setPage(totalPages);
  const goToPage = (pageNum) => setPage(pageNum);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // Calculate pagination display values
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + editedVoters.length;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#262626]">

      {/* Fixed Top Filter Card */}
      <div className="flex-shrink-0 bg-white dark:bg-[#2d2d2d] border-b border-[#e5e5e6] dark:border-[#3d3d3d]">
        <div className="px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <p
                className={`text-base font-semibold text-lg ${darkMode ? "text-[#ececf1]" : "text-gray-900"
                  }`}
              >
                Voters<span className="text-md text-[#f59e0b]">({totalCount})</span>
              </p>

              {/* Bulk delete button */}
              {selectedVoters.size > 0 && (
                <button
                  type="button"
                  onClick={openBulkDeleteModal}
                  disabled={deleting}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-105 ${deleting
                    ? "cursor-not-allowed bg-red-500/50 text-white"
                    : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                >
                  <Trash2 className="h-4 w-4 " />
                  Delete Selected ({selectedVoters.size})
                </button>
              )}
            </div>

            {/* Filters: State / Constituency / Booth – same UX as VotersDB */}
            <div className="flex flex-wrap items-center gap-3">
              {/* State Dropdown - Only for admins */}
              {userRole === "admin" && (
                <div className="relative flex-none w-40">
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
                      className={`w-full appearance-none border rounded-lg px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] dark:focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                        ? "bg-[#2d2d2d] border-[#3d3d3d] text-white hover:border-[#4d4d4d]"
                        : "bg-white border-[#e5e5e6] text-[#202123] hover:border-[#c5c5c7]"
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
                      className={`rounded-lg border shadow-xl transition-all duration-200 ${darkMode
                        ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                        : "bg-white border-[#e5e5e6]"
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
                <div className="relative flex-none w-40">
                  <Select value={userStateId ? String(userStateId) : ""} disabled>
                    <SelectTrigger
                      className={`w-full appearance-none border rounded-lg px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] dark:focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                        ? "bg-[#2d2d2d] border-[#3d3d3d] text-white hover:border-[#4d4d4d]"
                        : "bg-white border-[#e5e5e6] text-[#202123] hover:border-[#c5c5c7]"
                        }`}
                    >
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent
                      className={`rounded-lg border shadow-xl transition-all duration-200 ${darkMode
                        ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                        : "bg-white border-[#e5e5e6]"
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

              {/* Constituency search dropdown – copied pattern from VotersDB */}
              <div className="relative flex-none w-56 constituency-dropdown-container">
                <div className="relative">
                  <input
                    type="text"
                    className={`w-full appearance-none border rounded-lg px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] dark:focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                      ? "bg-[#2d2d2d] border-[#3d3d3d] text-white hover:border-[#4d4d4d]"
                      : "bg-white border-[#e5e5e6] text-[#202123] hover:border-[#c5c5c7]"
                      }`}
                    placeholder={
                      selectedConstituency
                        ? assignedConstituencies.find(
                          (c) =>
                            String(c.assembly_constituency_no) === String(selectedConstituency) ||
                            String(c.assembly_constituency_id) === String(selectedConstituency)
                        )?.assembly_constituency_name || "Search Constituency..."
                        : constituenciesLoading
                          ? "Loading constituencies..."
                          : "Search Constituency..."
                    }
                    value={constituencySearch}
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
                    disabled={!assignedConstituencies.length || constituenciesLoading}
                  />

                  {/* Clear button */}
                  {constituencySearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setConstituencySearch("");
                        setIsConstituencyDropdownOpen(true);
                      }}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dropdown list */}
                {isConstituencyDropdownOpen && (
                  <>
                    {filteredConstituencies.length > 0 ? (
                      <div
                        className={`absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border shadow-xl transition-all duration-200 ${darkMode
                          ? "bg-[#2d2d2d] border-[#3d3d3d]"
                          : "bg-white border-[#e5e5e6]"
                          }`}
                      >
                        {filteredConstituencies
                          .sort((a, b) =>
                            a.assembly_constituency_name.localeCompare(
                              b.assembly_constituency_name
                            )
                          )
                          .map((c) => (
                            <div
                              key={c.assembly_constituency_no}
                              className={`cursor-pointer px-3 py-2 text-sm transition-all duration-200 ${selectedConstituency === String(c.assembly_constituency_no || c.assembly_constituency_id)
                                ? darkMode ? "bg-[#a8e6cf]/20 text-white font-semibold border-l-2 border-[#a8e6cf]" : "bg-[#a8e6cf]/10 text-[#202123] font-semibold border-l-2 border-[#a8e6cf]"
                                : ""
                                } ${darkMode && selectedConstituency !== String(c.assembly_constituency_no || c.assembly_constituency_id) ? "hover:bg-[#2d2d2d] text-white" : "hover:bg-[#a8e6cf]/5"}`}
                              onClick={() => {
                                const constituencyNo = c.assembly_constituency_no || c.assembly_constituency_id;
                                setSelectedConstituency(String(constituencyNo));
                                setSelectedBooth("");
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
                      <div
                        className={`absolute z-50 mt-1 w-full rounded-md border p-3 shadow-lg ${darkMode
                          ? "bg-[#2d2d2d] border-[#3d3d3d]"
                          : "bg-white border-[#e5e5e6]"
                          }`}
                      >
                        <div
                          className={`text-center text-sm ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"
                            }`}
                        >
                          No constituencies found
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Booth dropdown – same behavior as VotersDB */}
              <div className="relative flex-none w-56">
                <Select
                  value={selectedBooth}
                  onValueChange={(value) => setSelectedBooth(value)}
                  disabled={
                    !selectedConstituency || boothsLoading || booths.length === 0
                  }
                >
                  <SelectTrigger
                    className={`w-full appearance-none border rounded-lg px-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] dark:focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                      ? "bg-[#2d2d2d] border-[#3d3d3d] text-white hover:border-[#4d4d4d]"
                      : "bg-white border-[#e5e5e6] text-[#202123] hover:border-[#c5c5c7]"
                      }`}
                  >
                    <SelectValue
                      placeholder={
                        !selectedConstituency
                          ? "Select Constituency first"
                          : boothsLoading
                            ? "Loading booths..."
                            : booths.length === 0
                              ? "No booths found"
                              : "Select Booth"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent
                    className={`rounded-lg border shadow-xl transition-all duration-200 ${darkMode
                      ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                      : "bg-white border-[#e5e5e6]"
                      }`}
                  >
                    {selectedConstituency &&
                      booths.map((booth) => (
                        <SelectItem
                          key={booth.polling_station_no}
                          value={`${booth.polling_station_no}`}
                        >
                          {(booth.polling_areas || "Polling area").slice(0, 15)}{" "}
                          <span className="text-xs text-gray-400">
                            (Booth {booth.polling_station_no})
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${darkMode
            ? "border-red-500/40 bg-red-500/10 text-red-200"
            : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
          {error}
        </div>
      )}

      {/* Require constituency & booth before showing data */}
      <div className="mt-4 flex-1 flex flex-col min-h-0">
        {!selectedConstituency || !selectedBooth ? (
          <div
            className={`border px-4 py-10 text-center text-sm ${darkMode
              ? "border-[#3d3d3d] bg-[#2d2d2d] text-[#ececf1]"
              : "border-[#e5e5e6] bg-white text-[#202123]"
              }`}
          >
            Please select a constituency and booth to view your edited voters.
          </div>
        ) : loading ? (
          <SkeletonLoader darkMode={darkMode} />
        ) : groupedVoters.length === 0 ? (
          <EmptyState darkMode={darkMode} />
        ) : (
          <div className="flex flex-1 flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto">
              {groupedVoters.map((state) => (
                <div key={`state-${state.stateId}`} className="space-y-4">


                  {state.constituencies.map((constituency) => (
                    <div key={`const-${state.stateId}-${constituency.constituencyNo}`} className="space-y-3">


                      {constituency.booths.map((booth) => (
                        <div
                          key={`booth-${state.stateId}-${constituency.constituencyNo}-${booth.boothNo}`}
                          className={`border overflow-hidden ${darkMode ? "border-[#3d3d3d] bg-[#2d2d2d]" : "border-[#e5e5e6] bg-white"
                            }`}
                        >
                          <div
                            className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 text-sm ${darkMode ? "border-[#3d3d3d] text-[#ececf1]" : "border-[#e5e5e6] text-[#202123]"
                              }`}
                          >


                          </div>

                          <div className="overflow-x-auto overflow-y-auto">
                            <table className="min-w-full border-collapse">
                              <thead className={`sticky top-0 z-20 ${darkMode ? "bg-[#2d2d2d] border-b border-[#3d3d3d]" : "bg-white border-b border-[#e5e5e6]"}`}>
                                <tr>
                                  <th className={`px-4 py-3 text-left text-xs font-medium tracking-wider whitespace-nowrap ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"
                                    }`}>
                                    <input
                                      type="checkbox"
                                      checked={
                                        booth.voters.length > 0 &&
                                        booth.voters.every((v) => selectedVoters.has(v.voter_id))
                                      }
                                      onChange={() => toggleSelectAllForBooth(booth.voters)}
                                      className={`h-4 w-4 cursor-pointer rounded ${darkMode ? "border-[#3d3d3d] bg-[#2d2d2d]" : "border-[#e5e5e6] bg-white"
                                        }`}
                                    />
                                  </th>
                                  {tableHeaders.map((column) => (
                                    <th key={column.key} className="px-4 py-3 text-left text-md font-medium  tracking-wider">
                                      {column.label}
                                    </th>
                                  ))}
                                  {customFieldList.map((field) => (
                                    <th
                                      key={`${booth.boothNo}-${field.key}`}
                                      className="px-4 py-3 text-left text-md font-medium  tracking-wider"
                                    >
                                      {field.label}
                                    </th>
                                  ))}
                                  <th className="px-4 py-3 text-left text-md font-medium  tracking-wider">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y ${darkMode
                                ? "bg-[#2d2d2d] divide-[#3d3d3d]"
                                : "bg-white divide-[#e5e5e6]"
                                }`}>
                                {booth.voters.map((voter) => {
                                  const { relationName, relationType } = getRelationDetails(voter);
                                  const isSelected = selectedVoters.has(voter.voter_id);
                                  const isDeleting = deletingVoterId === voter.voter_id;

                                  return (
                                    <tr key={`${voter.state_id}-${voter.assembly_constituency_no}-${voter.polling_booth_no}-${voter.voter_id || voter.Name}`} className={`transition-all duration-200 ${darkMode ? "bg-[#2d2d2d] hover:bg-[#2d2d2d]/80" : "bg-white hover:bg-[#f7f7f8]"
                                      }`}>
                                      <td className="px-4 py-3">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleVoterSelection(voter.voter_id)}
                                          disabled={isDeleting}
                                          className={`h-4 w-4 cursor-pointer rounded ${darkMode ? "border-[#3d3d3d] bg-[#2d2d2d]" : "border-[#e5e5e6] bg-white"
                                            }`}
                                        />
                                      </td>
                                      <td className={`px-4 py-3 text-sm font-medium ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>{voter?.Name || "-"}</td>
                                      <td className="px-4 py-3">
                                        {relationName ? (
                                          <div className="flex flex-col gap-0.5">
                                            <span className={`text-sm font-medium ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>{relationName}</span>
                                            <span className={`text-xs font-semibold ${darkMode ? "text-[#4ade80]" : "text-[#10b981]"}`}>{relationType}</span>
                                          </div>
                                        ) : (
                                          <span className={`text-sm ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>-</span>
                                        )}
                                      </td>
                                      <td className={`px-4 py-3 text-sm ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>{voter?.Age || "-"}</td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"}`}>
                                          {voter?.Gender || "-"}
                                        </span>
                                      </td>
                                      <td className={`px-4 py-3 font-mono text-sm tracking-wide ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>{voter?.voter_id || "-"}</td>
                                      <td className={`px-4 py-3 text-sm ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>{voter?.House_Number || "-"}</td>
                                      {customFieldList.map((field) => {
                                        const fieldValue = voter?.custom_fields?.find(
                                          (f) => String(f?.question_id ?? f?.name ?? "") === field.key
                                        );

                                        return (
                                          <td key={`${voter.voter_id}-${field.key}`} className={`px-4 py-3 text-sm ${darkMode ? "text-[#ececf1]" : "text-[#202123]"}`}>
                                            {fieldValue?.value != null && fieldValue?.value !== "" ? String(fieldValue.value) : "-"}
                                          </td>
                                        );
                                      })}
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => handleEditVoter(voter)}
                                            disabled={isDeleting}
                                            className={`inline-flex items-center rounded-md border-none px-2 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 ${isDeleting
                                              ? "cursor-not-allowed text-[#8e8ea0]"
                                              : "text-[#ff6b9d] hover:bg-[#ff6b9d]/10"
                                              }`}
                                          >
                                            <Edit className="mr-1 h-4 w-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => openDeleteModal(voter)}
                                            disabled={isDeleting}
                                            className={`inline-flex items-center rounded-md border-none px-2 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 ${isDeleting
                                              ? "cursor-not-allowed text-[#8e8ea0]"
                                              : "text-red-500 hover:bg-red-500/10"
                                              }`}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Pagination Controls - fixed at bottom of content area */}
            {totalPages > 1 && (
              <div
                className={`mt-4 flex-shrink-0 border-t p-3 transition-all duration-200 ${darkMode
                  ? "border-[#3d3d3d] bg-[#2d2d2d]"
                  : "border-[#e5e5e6] bg-white"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"
                      }`}
                  >
                    Showing {totalCount > 0 ? startIndex + 1 : 0} to {endIndex} of{" "}
                    {totalCount} voters
                  </span>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={goToFirstPage}
                        disabled={page === 1 || loading}
                        className={`p-1 border rounded-md hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${darkMode
                          ? "border-[#3d3d3d] hover:border-[#a8e6cf]"
                          : "border-[#e5e5e6] hover:border-[#a8e6cf]"
                          }`}
                        aria-label="First page"
                      >
                        <ChevronsLeft size={16} />
                      </button>
                      <button
                        onClick={goToPreviousPage}
                        disabled={page === 1 || loading}
                        className={`p-1 border rounded-md hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${darkMode
                          ? "border-[#3d3d3d] hover:border-[#a8e6cf]"
                          : "border-[#e5e5e6] hover:border-[#a8e6cf]"
                          }`}
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {getPageNumbers().map((pageNum, index) => (
                        <button
                          key={index}
                          onClick={() => typeof pageNum === "number" && goToPage(pageNum)}
                          disabled={pageNum === "..." || loading}
                          className={`px-2 py-1 border rounded-md text-xs transition-all duration-200 ${pageNum === page
                            ? "bg-[#a8e6cf] text-[#202123] border-[#a8e6cf] font-semibold"
                            : pageNum === "..."
                              ? `border-[#e5e5e6] dark:border-[#3d3d3d] cursor-default`
                              : `border-[#e5e5e6] dark:border-[#3d3d3d] hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 hover:border-[#a8e6cf] dark:hover:border-[#a8e6cf] ${darkMode ? "text-[#d1d5db]" : "text-[#202123]"
                              }`
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button
                        onClick={goToNextPage}
                        disabled={page === totalPages || loading}
                        className={`p-1 border rounded-md hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${darkMode
                          ? "border-[#3d3d3d] hover:border-[#a8e6cf]"
                          : "border-[#e5e5e6] hover:border-[#a8e6cf]"
                          }`}
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={goToLastPage}
                        disabled={page === totalPages || loading}
                        className={`p-1 border rounded-md hover:bg-[#a8e6cf]/10 dark:hover:bg-[#a8e6cf]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${darkMode
                          ? "border-[#3d3d3d] hover:border-[#a8e6cf]"
                          : "border-[#e5e5e6] hover:border-[#a8e6cf]"
                          }`}
                        aria-label="Last page"
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>

                    {/* Items per page selector */}
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Per page:
                      </span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1);
                        }}
                        disabled={loading}
                        className={`px-1 py-0.5 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-[#a8e6cf] transition-all duration-200 ${darkMode
                          ? "bg-[#2d2d2d] border-[#3d3d3d] text-white"
                          : "bg-white border-[#e5e5e6] text-[#202123]"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingVoter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg p-6 shadow-xl border ${darkMode ? "bg-[#2d2d2d] border-[#3d3d3d]" : "bg-white border-[#e5e5e6]"
              }`}
          >
            <button
              type="button"
              onClick={closeEditModal}
              className={`absolute right-4 top-4 ${darkMode ? "text-[#8e8ea0] hover:text-[#ececf1]" : "text-[#565869] hover:text-[#202123]"
                }`}
            >
              <X size={20} />
            </button>

            <h3
              className={`mb-4 text-lg font-semibold ${darkMode ? "text-[#ececf1]" : "text-gray-900"
                }`}
            >
              Edit Favorite Voter
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className={`mb-1 block text-sm font-medium ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"
                    }`}
                >
                  Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editForm.Name}
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${darkMode
                    ? "border-[#3d3d3d] bg-[#2d2d2d] text-[#ececf1]"
                    : "border-[#e5e5e6] text-[#202123]"
                    }`}
                />
              </div>

              {customFieldList.length > 0 && (
                <div className="space-y-3">
                  <p
                    className={`text-sm font-medium ${darkMode ? "text-[#ececf1]" : "text-[#202123]"
                      }`}
                  >
                    Custom Fields
                  </p>
                  {customFieldList.map((field) => (
                    <div key={field.key}>
                      <label
                        className={`mb-1 block text-xs font-medium ${darkMode ? "text-[#8e8ea0]" : "text-[#565869]"
                          }`}
                      >
                        {field.label}
                      </label>
                      <input
                        type="text"
                        value={
                          editForm.custom_fields_values[field.key] ?? ""
                        }
                        onChange={(e) =>
                          handleCustomFieldChange(field.key, e.target.value)
                        }
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${darkMode
                          ? "border-[#3d3d3d] bg-[#2d2d2d] text-[#ececf1]"
                          : "border-[#e5e5e6] text-[#202123]"
                          }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeEditModal}
                className={`rounded-lg border px-4 py-2 text-sm ${darkMode
                  ? "border-[#3d3d3d] text-[#8e8ea0] hover:bg-[#353535]"
                  : "border-[#e5e5e6] text-[#565869] hover:bg-[#f7f7f8]"
                  }`}
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateVoter}
                disabled={updating}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white ${updating
                  ? "cursor-not-allowed bg-cyan-500"
                  : "bg-cyan-600 hover:bg-cyan-700"
                  }`}
              >
                {updating && (
                  <Loader2 className="mr-2 h-10 w-10 animate-spin text-[#2162B0]" />
                )}
                {updating ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteModalOpen && voterToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-md rounded-lg p-6 shadow-xl border ${darkMode ? "bg-[#2d2d2d] border-[#3d3d3d]" : "bg-white border-[#e5e5e6]"
              }`}
          >
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deletingVoterId === voterToDelete.voter_id}
              className={`absolute right-4 top-4 ${darkMode ? "text-[#8e8ea0] hover:text-[#ececf1]" : "text-[#565869] hover:text-[#202123]"
                }`}
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <div className={`mb-2 flex items-center gap-3 ${darkMode ? "text-red-400" : "text-red-600"
                }`}>

                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-[#ececf1]" : "text-gray-900"
                    }`}
                >
                  Delete Voter Edit
                </h3>
              </div>
              <p
                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                Are you sure you want to delete the edit for this voter? This action cannot be undone.
              </p>
            </div>

            <div
              className={`mb-4 rounded-lg border px-4 py-3  items-center justify-center${darkMode
                ? "border-[#3d3d3d] bg-[#2d2d2d]/50"
                : "border-[#e5e5e6] bg-[#f7f7f8]"
                }`}
            >
              <p
                className={`text-sm font-medium underline ${darkMode ? "text-gray-200" : "text-gray-700"
                  }`}
              >
                Voter Details:
              </p>
              <div className="mt-2 space-y-1">

                <p
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <span className="font-medium">Voter ID:</span> {voterToDelete.voter_id || "-"}
                </p>
                <p
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <span className="font-medium">Name:</span> {voterToDelete.Name || "-"}
                </p>
                <p
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <span className="font-medium">Age:</span> {voterToDelete.Age || "-"}
                </p>
                <p
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <span className="font-medium">Gender:</span> {voterToDelete.Gender || "-"}
                </p>
                <p
                  className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                >
                  <span className="font-medium">House Number:</span> {voterToDelete.House_Number || "-"}
                </p>

              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deletingVoterId === voterToDelete.voter_id}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${darkMode
                  ? "border-[#3d3d3d] text-[#8e8ea0] hover:bg-[#353535]"
                  : "border-[#e5e5e6] text-[#565869] hover:bg-[#f7f7f8]"
                  }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVoter}
                disabled={deletingVoterId === voterToDelete.voter_id}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white ${deletingVoterId === voterToDelete.voter_id
                  ? "cursor-not-allowed bg-red-400"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {deletingVoterId === voterToDelete.voter_id && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {deletingVoterId === voterToDelete.voter_id
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className={`relative w-full max-w-md rounded-lg p-6 shadow-xl border ${darkMode ? "bg-[#2d2d2d] border-[#3d3d3d]" : "bg-white border-[#e5e5e6]"
              }`}
          >
            <button
              type="button"
              onClick={closeBulkDeleteModal}
              disabled={deleting}
              className={`absolute right-4 top-4 ${darkMode ? "text-[#8e8ea0] hover:text-[#ececf1]" : "text-[#565869] hover:text-[#202123]"
                }`}
            >
              <X size={20} />
            </button>

            <div className="mb-4">
              <div className={`mb-2 flex items-center gap-3 ${darkMode ? "text-red-400" : "text-red-600"
                }`}>

                <h3
                  className={`text-lg font-semibold ${darkMode ? "text-[#ececf1]" : "text-gray-900"
                    }`}
                >
                  Delete Multiple Voter Edits
                </h3>
              </div>
              <p
                className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
              >
                Are you sure you want to delete <span className="font-semibold">{selectedVoters.size}</span> voter edit(s)? This action cannot be undone.
              </p>
            </div>

            <div
              className={`mb-4 rounded-lg border px-4 py-3 ${darkMode
                ? "border-[#3d3d3d] bg-[#2d2d2d]/50"
                : "border-[#e5e5e6] bg-[#f7f7f8]"
                }`}
            >
              <p
                className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"
                  }`}
              >
                Selected Voters: {selectedVoters.size}
              </p>
              <p
                className={`mt-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"
                  }`}
              >
                All selected voter edits will be permanently deleted.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeBulkDeleteModal}
                disabled={deleting}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${darkMode
                  ? "border-[#3d3d3d] text-[#8e8ea0] hover:bg-[#353535]"
                  : "border-[#e5e5e6] text-[#565869] hover:bg-[#f7f7f8]"
                  }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={deleting}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white ${deleting
                  ? "cursor-not-allowed bg-red-400"
                  : "bg-red-600 hover:bg-red-700"
                  }`}
              >
                {deleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {deleting ? "Deleting..." : `Delete ${selectedVoters.size} Voter(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}