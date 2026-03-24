import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import { ArrowLeft, X } from "lucide-react";
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
  getAssemblyConstituencies,
  getPartyWiseResults,
  getPartyWiseResultsLoksabha,
  getBoothVoteRangeAssembly,
  getBoothVoteRangeLoksabha,
  getParties,
} from "~/api";

/** ---------------- Loaders ---------------- */
const ColorfulLoader = ({ size = "default", message = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    default: "w-12 h-12",
    large: "w-16 h-16",
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} flex items-center justify-center`}>
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-black dark:border-t-white animate-spin" />
        </div>
      </div>

      {message ? (
        <div className="text-sm text-gray-600 dark:text-[#8e8ea0] font-medium">
          {message}
        </div>
      ) : null}
    </div>
  );
};

const TabLoader = ({ message = "Loading data..." }) => (
  <div className="flex items-center justify-center py-12">
    <ColorfulLoader size="default" message={message} />
  </div>
);

/** ---------------- Skeletons ---------------- */
const ElectionTableSkeleton = () => (
  <div className="flex flex-col space-y-6">
    <div className="flex-shrink-0 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="h-6 w-32 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
      </div>
      <div className="h-7 w-48 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
    </div>

    <div
      className="flex flex-col bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow"
      style={{ height: "500px" }}
    >
      <div className="flex-shrink-0 overflow-x-auto border-b border-gray-100 dark:border-[#2a2a2a]">
        <div className="h-10 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y divide-gray-200 dark:divide-[#3d3d3d]">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-4 gap-4 px-4 py-4 bg-white dark:bg-[#1a1a1a] animate-pulse"
            >
              <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded col-span-1" />
              <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded col-span-1 justify-self-end" />
              <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded col-span-1 justify-self-end" />
              <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded col-span-1 justify-self-end" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 px-4 py-4 bg-gray-100 dark:bg-[#1f1f1f]">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
          <div className="flex space-x-6">
            <div className="h-5 w-16 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const VoteRangeTableSkeleton = () => (
  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center space-x-3 mb-4">
      <div className="h-6 w-32 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
      <div className="h-6 w-20 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
    </div>
    <div className="overflow-x-auto">
      <div className="min-w-full border border-gray-300 dark:border-[#3d3d3d]">
        <div className="h-10 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
        <div className="divide-y divide-gray-200 dark:divide-[#3d3d3d]">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-4 px-4 py-3 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded col-span-2" />
              {Array.from({ length: 4 }).map((__, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded col-span-1"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const PartyVsBoothSkeleton = () => (
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
    {Array.from({ length: 2 }).map((_, idx) => (
      <div
        key={idx}
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-6 w-40 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 dark:bg-[#262626] rounded animate-pulse" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full border border-gray-300 dark:border-[#3d3d3d]">
            <div className="h-10 bg-gray-100 dark:bg-[#1f1f1f] animate-pulse" />
            <div className="divide-y divide-gray-200 dark:divide-[#3d3d3d]">
              {Array.from({ length: 5 }).map((__, rowIdx) => (
                <div
                  key={rowIdx}
                  className="grid grid-cols-2 gap-4 px-4 py-3 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded" />
                  <div className="h-4 bg-gray-200 dark:bg-[#3d3d3d] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function CompareElections() {
  const navigate = useNavigate();
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;

  

  // State selection
  const [states] = useState([{ id: 21, name: "Tamil Nadu" }]);
  const [selectedState, setSelectedState] = useState(21);

  // Election years
  const [electionYears] = useState([
    { type: "assembly_elections", year: 2021 },
    { type: "loksabha_elections", year: 2024 },
  ]);

  // Shared constituency selection
  const [constituencies, setConstituencies] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [constituenciesLoading, setConstituenciesLoading] = useState(false);

  // Search state for constituency dropdown
  const [constituencySearch, setConstituencySearch] = useState("");
  const [isConstituencyDropdownOpen, setIsConstituencyDropdownOpen] = useState(false);

  // Left side (Election 1)
  const [leftElection, setLeftElection] = useState({
    type: "assembly_elections",
    year: 2021
  });
  const [rightElection, setRightElection] = useState({
    type: "loksabha_elections",
    year: 2024
  });
  const [leftResults, setLeftResults] = useState(null);
  const [leftLoading, setLeftLoading] = useState(false);

  // Right side (Election 2)

  const [rightResults, setRightResults] = useState(null);
  const [rightLoading, setRightLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("assembly-analysis");

  // Vote ranges state
  const [selectedRange, setSelectedRange] = useState("0-10");
  const [leftAccumulatedRanges, setLeftAccumulatedRanges] = useState([]);
  const [leftRangeData, setLeftRangeData] = useState({});
  const [rightAccumulatedRanges, setRightAccumulatedRanges] = useState([]);
  const [rightRangeData, setRightRangeData] = useState({});
  const [isLeftRangeLoading, setIsLeftRangeLoading] = useState(false);
  const [isRightRangeLoading, setIsRightRangeLoading] = useState(false);

  // Assembly vs Loksabha tab state
  const [assemblyVsLokData, setAssemblyVsLokData] = useState({
    assemblyParties: [],
    loksabhaParties: [],
    assemblyRangeData: {},
    loksabhaRangeData: {},
    accumulatedRanges: [],
  });
  const [isAssemblyVsLokLoading, setIsAssemblyVsLokLoading] = useState(false);
  const [assemblyVsLokElections, setAssemblyVsLokElections] = useState({
    assembly: null,
    loksabha: null,
  });

  const [selectedParty, setSelectedParty] = useState(null);

  /** ---------- Utility Functions ---------- */
  const formatElectionType = (type) => {
    if (type === "assembly_elections") return "Assembly Elections";
    if (type === "loksabha_elections") return "Lok Sabha Elections";
    return "Unknown Election";
  };

  const formatNumber = (n) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toLocaleString()
      : n === 0
        ? "0"
        : "-";

  const generateVoteRanges = (intervals) => {
    const ranges = [];
    let start = 0;
    for (const step of intervals) {
      const end = start + step;
      ranges.push(`${start}-${end}`);
      start = end + 1;
    }
    return ranges;
  };

  const normalizePartiesResponse = (resp) => {
    // Handles either { parties: [...] } OR [ { parties: [...] } ]
    if (!resp) return [];
    if (Array.isArray(resp)) {
      return resp[0]?.parties || [];
    }
    return resp.parties || [];
  };

  // Filter constituencies based on search
  const filteredConstituencies = constituencies.filter((c) => {
    const searchLower = constituencySearch.toLowerCase();
    const name = c.assembly_constituency_name?.toLowerCase() || "";
    const number = c.assembly_constituency_no?.toString() || "";
    return name.includes(searchLower) || number.includes(searchLower);
  });



  // Modify the constituencies loading useEffect to auto-select first constituency
  useEffect(() => {
    if (!selectedState) {
      setConstituencies([]);
      setSelectedConstituency(null);
      return;
    }

    setConstituenciesLoading(true);

    const fetchConstituencies = async () => {
      try {
        const data = await getAssemblyConstituencies(selectedState);
        const constituenciesList = data.constituencies || [];
        setConstituencies(constituenciesList);

        // Auto-select first constituency if none is selected and constituencies are available
        if (constituenciesList.length > 0 && !selectedConstituency) {
          setSelectedConstituency(constituenciesList[0]);
        }
      } catch (error) {
        console.error("Error fetching constituencies:", error);
        setConstituencies([]);
      } finally {
        setConstituenciesLoading(false);
      }
    };

    fetchConstituencies();
  }, [selectedState]);

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

  /** ---------- Reset vote ranges when constituency changes ---------- */
  useEffect(() => {
    setLeftAccumulatedRanges([]);
    setLeftRangeData({});
    setRightAccumulatedRanges([]);
    setRightRangeData({});
    setSelectedRange("0-10");

    // Reset Assembly vs Loksabha data
    setAssemblyVsLokData({
      assemblyParties: [],
      loksabhaParties: [],
      assemblyRangeData: {},
      loksabhaRangeData: {},
      accumulatedRanges: [],
    });
    setAssemblyVsLokElections({
      assembly: null,
      loksabha: null,
    });
    setSelectedParty(null);
  }, [selectedConstituency]);

  /** ---------- Preload first vote range when tab opens ---------- */
  useEffect(() => {
    if (
      activeTab === "vote-ranges" &&
      selectedConstituency &&
      leftElection &&
      rightElection
    ) {
      if (leftAccumulatedRanges.length === 0) {
        handleAddLeftRange("0-10");
      }
      if (rightAccumulatedRanges.length === 0) {
        handleAddRightRange("0-10");
      }
    }

    // Initialize Assembly vs Loksabha data when tab opens
    if (
      activeTab === "assembly-vs-loksabha" &&
      selectedConstituency &&
      selectedState
    ) {
      initializeAssemblyVsLoksabhaData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    selectedConstituency,
    leftElection,
    rightElection,
    selectedState,
  ]);

  /** ---------- Load Election Results ---------- */
  // Left side results
  useEffect(() => {
    if (!leftElection || !selectedConstituency || !selectedState) {
      setLeftResults(null);
      return;
    }

    setLeftLoading(true);

    const fetchResults = async () => {
      try {
        let data;
        if (leftElection.type === "assembly_elections") {
          data = await getPartyWiseResults({
            state_id: selectedState,
            constituency_id: selectedConstituency.assembly_constituency_no,
            election_type: "assembly_elections",
            election_year: leftElection.year,
          });
        } else if (leftElection.type === "loksabha_elections") {
          data = await getPartyWiseResultsLoksabha({
            state_id: selectedState,
            lok_sabha_no: Number(selectedConstituency.assembly_constituency_no),
            election_type: "loksabha_elections",
            election_year: leftElection.year,
          });
        }
        setLeftResults(data || null);
      } catch (error) {
        console.error("Error fetching left results:", error);
        setLeftResults(null);
      } finally {
        setLeftLoading(false);
      }
    };

    fetchResults();
  }, [leftElection, selectedConstituency, selectedState]);

  // Right side results
  useEffect(() => {
    if (!rightElection || !selectedConstituency || !selectedState) {
      setRightResults(null);
      return;
    }

    setRightLoading(true);

    const fetchResults = async () => {
      try {
        let data;
        if (rightElection.type === "assembly_elections") {
          data = await getPartyWiseResults({
            state_id: selectedState,
            constituency_id: selectedConstituency.assembly_constituency_no,
            election_type: "assembly_elections",
            election_year: rightElection.year,
          });
        } else if (rightElection.type === "loksabha_elections") {
          data = await getPartyWiseResultsLoksabha({
            state_id: selectedState,
            constituency_id: selectedConstituency.assembly_constituency_no,
            election_type: "loksabha_elections",
            election_year: rightElection.year,
          });
        }
        setRightResults(data || null);
      } catch (error) {
        console.error("Error fetching right results:", error);
        setRightResults(null);
      } finally {
        setRightLoading(false);
      }
    };

    fetchResults();
  }, [rightElection, selectedConstituency, selectedState]);

  /** ---------- Assembly vs Loksabha Handlers ---------- */
  const initializeAssemblyVsLoksabhaData = async () => {
    if (!selectedConstituency || !selectedState) return;

    try {
      // Set default elections (most recent available by order)
      const assemblyElection = electionYears.find(
        (e) => e.type === "assembly_elections"
      );
      const loksabhaElection = electionYears.find(
        (e) => e.type === "loksabha_elections"
      );

      if (assemblyElection && loksabhaElection) {
        setAssemblyVsLokElections({
          assembly: assemblyElection,
          loksabha: loksabhaElection,
        });

        // Fetch parties for both elections (constituency-wise)
        const [assemblyPartiesData, loksabhaPartiesData] = await Promise.all([
          getParties({
            state_id: selectedState,
            constituency_id: selectedConstituency.assembly_constituency_no,
            election_type: "assembly_elections",
            election_year: assemblyElection.year,
          }),
          getParties({
            state_id: selectedState,
            constituency_id: selectedConstituency.assembly_constituency_no,
            election_type: "loksabha_elections",
            election_year: loksabhaElection.year,
          }),
        ]);

        setAssemblyVsLokData((prev) => ({
          ...prev,
          assemblyParties: normalizePartiesResponse(assemblyPartiesData),
          loksabhaParties: normalizePartiesResponse(loksabhaPartiesData),
        }));
      }
    } catch (error) {
      console.error("Error initializing Assembly vs Loksabha data:", error);
    }
  };

  const handleAddAssemblyVsLokRange = async (rangeStr = selectedRange) => {
    if (
      !selectedConstituency ||
      !rangeStr ||
      !assemblyVsLokElections.assembly ||
      !assemblyVsLokElections.loksabha ||
      assemblyVsLokData.accumulatedRanges.includes(rangeStr)
    ) {
      return;
    }

    setIsAssemblyVsLokLoading(true);
    try {
      const [assemblyData, loksabhaData] = await Promise.all([
        getBoothVoteRangeAssembly({
          constituency_id: selectedConstituency.assembly_constituency_no,
          election_type: "assembly_elections",
          election_year: assemblyVsLokElections.assembly.year,
          range: rangeStr,
        }),
        getBoothVoteRangeLoksabha({
          constituency_id: selectedConstituency.assembly_constituency_no,
          election_type: "loksabha_elections",
          election_year: assemblyVsLokElections.loksabha.year,
          range: rangeStr,
        }),
      ]);

      const assemblyCountsForRange = {};
      Object.entries(assemblyData?.counts || {}).forEach(([party, bins]) => {
        assemblyCountsForRange[party] = bins?.[rangeStr] ?? 0;
      });

      const loksabhaCountsForRange = {};
      Object.entries(loksabhaData?.counts || {}).forEach(([party, bins]) => {
        loksabhaCountsForRange[party] = bins?.[rangeStr] ?? 0;
      });

      setAssemblyVsLokData((prev) => ({
        ...prev,
        assemblyRangeData: {
          ...prev.assemblyRangeData,
          [rangeStr]: assemblyCountsForRange,
        },
        loksabhaRangeData: {
          ...prev.loksabhaRangeData,
          [rangeStr]: loksabhaCountsForRange,
        },
        accumulatedRanges: [...prev.accumulatedRanges, rangeStr].sort((a, b) => {
          const [aStart] = a.split("-").map(Number);
          const [bStart] = b.split("-").map(Number);
          return aStart - bStart;
        }),
      }));
    } catch (error) {
      console.error("Failed to fetch Assembly vs Loksabha booth vote range", error);
    } finally {
      setIsAssemblyVsLokLoading(false);
    }
  };

  /** ---------- Vote Range Handlers ---------- */
  const handleAddLeftRange = async (rangeStr = selectedRange) => {
    if (!selectedConstituency || !rangeStr || !leftElection) return;
    if (leftAccumulatedRanges.includes(rangeStr)) return;

    setIsLeftRangeLoading(true);
    try {
      let data;
      if (leftElection.type === "assembly_elections") {
        data = await getBoothVoteRangeAssembly({
          constituency_id: selectedConstituency.assembly_constituency_no,
          range: rangeStr,
        });
      } else if (leftElection.type === "loksabha_elections") {
        data = await getBoothVoteRangeLoksabha({
          constituency_id: selectedConstituency.assembly_constituency_no,
          election_type: "loksabha_elections",
          election_year: leftElection.year,
          range: rangeStr,
        });
      }

      const countsForRange = {};
      Object.entries(data?.counts || {}).forEach(([party, bins]) => {
        countsForRange[party] = bins?.[rangeStr] ?? 0;
      });

      setLeftRangeData((prev) => ({ ...prev, [rangeStr]: countsForRange }));
      setLeftAccumulatedRanges((prev) => [...prev, rangeStr]);
    } catch (e) {
      console.error("Failed to fetch left booth vote range", e);
    } finally {
      setIsLeftRangeLoading(false);
    }
  };

  const handleAddRightRange = async (rangeStr = selectedRange) => {
    if (!selectedConstituency || !rangeStr || !rightElection) return;
    if (rightAccumulatedRanges.includes(rangeStr)) return;

    setIsRightRangeLoading(true);
    try {
      let data;
      if (rightElection.type === "assembly_elections") {
        data = await getBoothVoteRangeAssembly({
          constituency_id: selectedConstituency.assembly_constituency_no,
          range: rangeStr,
        });
      } else if (rightElection.type === "loksabha_elections") {
        data = await getBoothVoteRangeLoksabha({
          constituency_id: selectedConstituency.assembly_constituency_no,
          election_type: "loksabha_elections",
          election_year: rightElection.year,
          range: rangeStr,
        });
      }

      const countsForRange = {};
      Object.entries(data?.counts || {}).forEach(([party, bins]) => {
        countsForRange[party] = bins?.[rangeStr] ?? 0;
      });

      setRightRangeData((prev) => ({ ...prev, [rangeStr]: countsForRange }));
      setRightAccumulatedRanges((prev) => [...prev, rangeStr]);
    } catch (e) {
      console.error("Failed to fetch right booth vote range", e);
    } finally {
      setIsRightRangeLoading(false);
    }
  };

  /** ---------- Render Helper Functions ---------- */
  const renderElectionTable = (
    results,
    loading,
    electionInfo,
    isAssembly = false
  ) => {
    if (loading && !results) {
      return <ElectionTableSkeleton />;
    }

    if (!results?.party_results?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="w-16 h-16 bg-gray-200  flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Try selecting a different combination</p>
        </div>
      );
    }

    const sortedResults = [...results.party_results].sort(
      (a, b) => (b.votes || 0) - (a.votes || 0)
    );
    // Solid bar color (no gradient in dark mode)
    const electionTypeColor = isAssembly
      ? "bg-[#0EA5E9] dark:bg-[#F2700D]"
      : "bg-[#0EA5E9] dark:bg-[#F2700D]";

    const electionBadgeColor = isAssembly
      ? "bg-[#0EA5E9]/20 text-[#0EA5E9] dark:bg-[#F2700D]/20 dark:text-[#F2700D]"
      : "bg-purple-100 text-purple-800";

    return (
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex-shrink-0 space-y-3">
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center px-3 py-1  text-xs font-medium ${electionBadgeColor}`}
            >
              {formatElectionType(electionInfo.type)}
            </span>
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800">
              {electionInfo.year}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {results.constituency_name ||
              results.lok_sabha_name ||
              "Constituency"}
          </h3>
        </div>

        {/* Results Table */}
        <div className="flex flex-col bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow" style={{ height: '500px' }}>
          <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-100 dark:border-[#2a2a2a]">
                <TableRow className="hover:bg-gray-50/80">
                  <TableHead className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Party</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Votes</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vote Share</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vote Share Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((p, index) => {
                  const isWinner = index === 0;
                  const voteShareDiff = p.vote_share_diff_pct;

                  return (
                    <TableRow
                      key={p.party}
                      className={`transition-colors border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 ${isWinner
                        ? "bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20"
                        : "bg-white dark:bg-[#1a1a1a] hover:bg-gray-50/80 dark:hover:bg-[#222]"
                        }`}
                    >
                      <TableCell className={`text-sm ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-800 dark:text-[#ececf1] font-medium"}`}>
                        {p.party}
                      </TableCell>
                      <TableCell className={`text-right text-sm ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-800 dark:text-[#ececf1] font-medium"}`}>
                        {formatNumber(p.votes)}
                      </TableCell>
                      <TableCell className={`text-right text-sm ${isWinner ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-[#ececf1]"}`}>
                        <div className="flex items-center justify-end gap-2">
                          <span className={isWinner ? "font-bold" : "font-medium"}>
                            {p.vote_share_pct ?? "-"}%
                          </span>
                          {p.vote_share_pct && (
                            <div className="w-16 bg-gray-200 dark:bg-[#3d3d3d] h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${isWinner
                                  ? "bg-[#0EA5E9] dark:bg-[#38bdf8]"
                                  : "bg-[#0EA5E9] dark:bg-[#F2700D]"
                                  }`}
                                style={{
                                  width: `${Math.min(p.vote_share_pct, 100)}%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right ${isWinner ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-[#ececf1]"}`}>
                        {voteShareDiff && voteShareDiff !== "-" ? (
                          <div
                            className={`inline-flex items-center px-2 py-1 text-[10px] font-bold tracking-widest rounded ${parseFloat(voteShareDiff) > 0
                              ? isWinner
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : parseFloat(voteShareDiff) < 0
                                ? isWinner
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : isWinner
                                  ? "bg-gray-100 text-gray-700 dark:bg-[#333] dark:text-gray-300"
                                  : "bg-gray-100 text-gray-600 dark:bg-[#1f1f1f] dark:text-[#8e8ea0]"
                              }`}
                          >
                            {parseFloat(voteShareDiff) > 0
                              ? "↑"
                              : parseFloat(voteShareDiff) < 0
                                ? "↓"
                                : "→"}
                            {voteShareDiff}%
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-[#8e8ea0]">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Victory Margin Footer */}
          <div className="flex-shrink-0 bg-gray-50/50 dark:bg-[#111]/50 border-t border-gray-100 dark:border-[#2a2a2a] px-5 py-4">
            <div className="flex items-center justify-between text-gray-900 dark:text-white">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Victory Margin</span>
              </div>
              <div className="flex items-center space-x-8">
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Votes
                  </div>
                  <div className="text-lg font-bold text-[#0EA5E9] dark:text-[#38bdf8] leading-none">
                    {formatNumber(results.margin_votes)}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                    Percentage
                  </div>
                  <div className="text-lg font-bold text-[#0EA5E9] dark:text-[#38bdf8] leading-none">
                    {results.margin_pct ?? "-"}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderVoteRangeTable = (
    accumulatedRanges,
    rangeData,
    electionInfo,
    isLoading
  ) => {
    const electionBadgeColor =
      electionInfo.type === "assembly_elections"
        ? "bg-[#0EA5E9]/20 text-[#0EA5E9] dark:bg-[#F2700D]/20 dark:text-[#F2700D]"
        : "bg-purple-100 text-purple-800";

    if (isLoading) {
      return <VoteRangeTableSkeleton />;
    }

    if (accumulatedRanges.length === 0) {
      return (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <span
              className={`inline-flex items-center px-3 py-1 text-xs font-medium ${electionBadgeColor}`}
            >
              {formatElectionType(electionInfo.type)}
            </span>
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#1f2933] dark:text-[#e5e7eb]">
              {electionInfo.year}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-[#8e8ea0]">
            <div className="w-16 h-16 bg-gray-200 dark:bg-[#3d3d3d] flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400 dark:text-[#9ca3af]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">No vote ranges selected</p>
            <p className="text-sm">Select a range and click Add to populate the table.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-medium ${electionBadgeColor}`}
          >
            {formatElectionType(electionInfo.type)}
          </span>
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#1f2933] dark:text-[#e5e7eb]">
            {electionInfo.year}
          </span>
        </div>

        <div className="border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-[#111]/50 hover:bg-gray-50/80 border-b border-gray-100 dark:border-[#2a2a2a]">
                <TableHead className="border-r border-gray-200 dark:border-[#333] text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vote Range</TableHead>
                {Array.from(
                  new Set(
                    Object.values(rangeData).flatMap((row) =>
                      Object.keys(row || {})
                    )
                  )
                )
                  .sort()
                  .map((p) => (
                    <TableHead
                      key={p}
                      className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                    >
                      <span className="text-[#801ec7] dark:text-[#F2700D] font-bold">{p}</span>
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accumulatedRanges.map((rng) => (
                <TableRow key={rng} className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition-colors">
                  <TableCell className="font-medium border-r border-gray-200 dark:border-[#333]">
                    {rng}
                  </TableCell>
                  {Array.from(
                    new Set(
                      Object.values(rangeData).flatMap((row) =>
                        Object.keys(row || {})
                      )
                    )
                  )
                    .sort()
                    .map((p) => (
                      <TableCell
                        key={`${rng}-${p}`}
                        className="text-center"
                      >
                        {rangeData?.[rng]?.[p] ?? 0}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderAssemblyAndLoksabhaTables = () => {
    const { assemblyRangeData, loksabhaRangeData, accumulatedRanges } =
      assemblyVsLokData;

    const EmptyState = ({ title }) => (
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
            {title}
          </span>
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#1f2933] dark:text-[#e5e7eb]">
            Booth Count by Party
          </span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-[#8e8ea0]">
          <div className="w-16 h-16 bg-gray-200 dark:bg-[#3d3d3d] flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-[#9ca3af]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">
            {selectedParty ? "No vote ranges selected" : "No party selected"}
          </p>
          <p className="text-sm">
            {selectedParty
              ? "Select a range and click Add to populate the table."
              : "Select a party to view data."}
          </p>
        </div>
      </div>
    );

    const renderOneTable = (title, rangeData, electionType) => {
      if (!selectedParty || accumulatedRanges.length === 0) {
        return <EmptyState title={title} />;
      }

      return (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800">
              {title}
            </span>
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#1f2933] dark:text-[#e5e7eb]">
              {selectedParty}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-collapse border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden shadow-sm">
              <colgroup>
                <col style={{ width: "50%" }} />
                <col style={{ width: "50%" }} />
              </colgroup>
              <thead className="bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-100 dark:border-[#2a2a2a]">
                <tr className="hover:bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-r border-gray-200 dark:border-[#333]">
                    Vote Range
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest">
                    <span className="text-[#801ec7] font-bold">{selectedParty}</span>{" "}
                    Booths
                  </th>
                </tr>
              </thead>
              <tbody>
                {accumulatedRanges.map((range) => (
                  <tr key={range} className="border-t border-gray-100 dark:border-[#2a2a2a] hover:bg-gray-50/80 dark:hover:bg-[#222] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-[#ececf1] border-r border-gray-200 dark:border-[#333]">
                      {range}
                    </td>
                    <td className="px-3 py-3 text-center text-sm text-gray-900 dark:text-[#ececf1]">
                      {rangeData?.[range]?.[selectedParty] ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {renderOneTable(
          `Assembly ${assemblyVsLokElections.assembly?.year ?? ""}`,
          assemblyRangeData,
          "assembly_elections"
        )}
        {renderOneTable(
          `Lok Sabha ${assemblyVsLokElections.loksabha?.year ?? ""}`,
          loksabhaRangeData,
          "loksabha_elections"
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0b0b] text-gray-900 dark:text-[#ececf1]">


      {/* Header */}
      <div className="bg-white dark:bg-[#0f0f10] border-b border-gray-200 dark:border-[#333]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            {/* Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* State Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-[#ececf1]">
                  Select State
                </Label>
                <Select
                  value={selectedState?.toString() || ""}
                  onValueChange={(value) => setSelectedState(Number(value))}
                >
                  <SelectTrigger className="w-full h-11 bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#3d3d3d] text-gray-900 dark:text-[#ececf1] transition-colors">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#3d3d3d]">
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assembly Constituency */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-[#ececf1]">
                  Constituency
                </Label>
                <div className="relative constituency-dropdown-container">
                  <div className="relative">
                    <Input
                      type="text"
                      className="w-full h-11 pr-10"
                      placeholder={selectedConstituency ? selectedConstituency.assembly_constituency_name : (constituenciesLoading ? "Loading..." : "Search Constituency...")}
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
                      disabled={!constituencies.length || constituenciesLoading}
                    />

                    {/* Clear button */}
                    {constituencySearch && !constituenciesLoading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => {
                          setConstituencySearch("");
                          setIsConstituencyDropdownOpen(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}

                    {constituenciesLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Loading…
                      </div>
                    )}
                  </div>

                  {/* Dropdown list */}
                  {isConstituencyDropdownOpen && !constituenciesLoading && (
                    <>
                      {filteredConstituencies.length > 0 ? (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1f1f1f] border border-gray-300 dark:border-[#3d3d3d] rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredConstituencies.map((c) => (
                            <div
                              key={c.assembly_constituency_no}
                              className={`px-3 py-2 cursor-pointer transition-colors duration-150 ${selectedConstituency?.assembly_constituency_no === c.assembly_constituency_no
                                ? 'bg-[#E0F2FE] dark:bg-[#F2700D]/20 font-semibold'
                                : 'hover:bg-[#F0F9FF] dark:hover:bg-[#262626]'
                                }`}
                              onClick={() => {
                                setSelectedConstituency(c);
                                setConstituencySearch("");
                                setIsConstituencyDropdownOpen(false);
                              }}
                            >
                              <div className="text-sm text-gray-900">
                                {c.assembly_constituency_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : constituencySearch ? (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1f1f1f] border border-gray-300 dark:border-[#3d3d3d] rounded-md shadow-lg p-3">
                          <div className="text-sm text-gray-500 dark:text-[#8e8ea0] text-center">
                            No constituencies found
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              {/* First Election */}
              {/* First Election: Assembly */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-[#ececf1]">
                  Compare Election one
                </Label>
                <Select
                  value={
                    leftElection
                      ? `${leftElection.type}|${leftElection.year}`
                      : ""
                  }
                  onValueChange={(value) => {
                    const [type, year] = value.split("|");
                    setLeftElection({ type, year: Number(year) });
                  }}
                >
                  <SelectTrigger className="w-full h-11 bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#3d3d3d] text-gray-900 dark:text-[#ececf1] transition-colors">
                    <SelectValue placeholder="Select First Election" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#3d3d3d]">
                    {electionYears
                      .filter((ev) => ev.type === "assembly_elections") // Filter for assembly elections only
                      .map((ev, idx) => (
                        <SelectItem key={idx} value={`${ev.type}|${ev.year}`}>
                          {formatElectionType(ev.type)} ({ev.year})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Second Election: Lok Sabha */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-[#ececf1]">
                  Compare Election two
                </Label>
                <Select
                  value={
                    rightElection
                      ? `${rightElection.type}|${rightElection.year}`
                      : ""
                  }
                  onValueChange={(value) => {
                    const [type, year] = value.split("|");
                    setRightElection({ type, year: Number(year) });
                  }}
                >
                  <SelectTrigger className="w-full h-11 bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#3d3d3d] text-gray-900 dark:text-[#ececf1] transition-colors">
                    <SelectValue placeholder="Select Second Election" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#3d3d3d]">
                    {electionYears
                      .filter((ev) => ev.type === "loksabha_elections") // Filter for loksabha elections only
                      .map((ev, idx) => (
                        <SelectItem key={idx} value={`${ev.type}|${ev.year}`}>
                          {formatElectionType(ev.type)} ({ev.year})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 sm:px-6 lg:px-6 py-2">
        {leftElection && rightElection && selectedConstituency ? (
          <div className="space-y-8">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-2 rounded-xl">
              <nav className="flex border-b border-gray-200 dark:border-[#333]">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("assembly-analysis")}
                  className={`flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 relative rounded-none ${activeTab === "assembly-analysis"
                    ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  Election Analysis Comparison
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("vote-ranges")}
                  className={`flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 relative rounded-none ${activeTab === "vote-ranges"
                    ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  Booths Comparison
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab("assembly-vs-loksabha")}
                  className={`flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 relative rounded-none ${activeTab === "assembly-vs-loksabha"
                    ? "border-b-2 border-gray-900 dark:border-white text-gray-900 dark:text-white"
                    : "border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  Party vs Booths
                </Button>
              </nav>


              {/* Tab Content */}
              {activeTab === "assembly-analysis" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2" style={{ gridAutoRows: '1fr' }}>
                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-none p-6 flex flex-col rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    {renderElectionTable(
                      leftResults,
                      leftLoading,
                      leftElection,
                      leftElection?.type === "assembly_elections"
                    )}
                  </div>
                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 flex flex-col rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    {renderElectionTable(
                      rightResults,
                      rightLoading,
                      rightElection,
                      rightElection?.type === "assembly_elections"
                    )}
                  </div>
                </div>
              )}

              {activeTab === "vote-ranges" && (
                <div className="space-y-0">
                  {/* Controls */}
                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Range picker */}
                      <div>
                        <Label className="block text-xs font-medium text-gray-600 dark:text-[#8e8ea0] mb-1">
                          Add vote range
                        </Label>
                        <Select
                          value={selectedRange}
                          onValueChange={(value) => {
                            setSelectedRange(value);
                            handleAddLeftRange(value);
                            handleAddRightRange(value);
                          }}
                        >
                          <SelectTrigger className="w-full h-10 bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#3d3d3d] text-gray-900 dark:text-[#ececf1]">
                            <SelectValue placeholder="Select a range to add" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#3d3d3d] max-h-64">
                            {[
                              ...generateVoteRanges([10, 10, 20, 20, 20]),
                              ...generateVoteRanges([50, 50, 50, 50, 50, 50]),
                              ...generateVoteRanges([100, 100, 100, 100, 100]),
                            ].map((r) => (
                              <SelectItem
                                key={r}
                                value={r}
                                disabled={leftAccumulatedRanges.includes(r) || rightAccumulatedRanges.includes(r)}
                              >
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setLeftAccumulatedRanges([]);
                            setLeftRangeData({});
                            setRightAccumulatedRanges([]);
                            setRightRangeData({});
                            setSelectedRange("0-10");
                          }}
                          className="mt-5"
                        >
                          Clear All
                        </Button>
                      </div>

                    </div>


                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          handleAddLeftRange();
                          handleAddRightRange();
                        }}
                        disabled={
                          !selectedConstituency ||
                          isLeftRangeLoading ||
                          isRightRangeLoading ||
                          leftAccumulatedRanges.includes(selectedRange) ||
                          rightAccumulatedRanges.includes(selectedRange)
                        }
                      >
                        {isLeftRangeLoading || isRightRangeLoading ? "Adding..." : "Add Range"}
                      </Button>
                    </div>
                  </div>

                  {/* Vote Range Tables */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {renderVoteRangeTable(
                      leftAccumulatedRanges,
                      leftRangeData,
                      leftElection,
                      isLeftRangeLoading
                    )}
                    {renderVoteRangeTable(
                      rightAccumulatedRanges,
                      rightRangeData,
                      rightElection,
                      isRightRangeLoading
                    )}
                  </div>
                </div>
              )}
              {activeTab === "assembly-vs-loksabha" && (
                <div className="space-y-0">
                  {/* Controls */}
                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Range picker */}
                      <div>
                        <Label className="block text-xs font-medium text-gray-600 dark:text-[#8e8ea0] mb-1">
                          Add vote range
                        </Label>
                        <Select
                          value={selectedRange}
                          onValueChange={(value) => {
                            setSelectedRange(value);
                            handleAddAssemblyVsLokRange(value);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a range to add" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#3d3d3d] max-h-64">
                            {[
                              ...generateVoteRanges([10, 10, 20, 20, 20]),
                              ...generateVoteRanges([50, 50, 50, 50, 50, 50]),
                              ...generateVoteRanges([100, 100, 100, 100, 100]),
                            ].map((r) => (
                              <SelectItem
                                key={r}
                                value={r}
                                disabled={assemblyVsLokData.accumulatedRanges.includes(r)}
                              >
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Party dropdown */}
                      <div className="lg:col-span-2">
                        <Label className="block text-xs font-medium text-gray-600 dark:text-[#8e8ea0] mb-1">
                          Party (Assembly & Lok Sabha)
                        </Label>
                        <Select
                          value={selectedParty || undefined}
                          onValueChange={(v) => setSelectedParty(v || null)}
                        >
                          <SelectTrigger className="w-full h-10 bg-white dark:bg-[#111111] border-2 border-gray-200 dark:border-[#3d3d3d] text-gray-900 dark:text-[#ececf1]">
                            <SelectValue placeholder="Select Party" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {Array.from(
                              new Set([
                                ...(assemblyVsLokData.assemblyParties || []),
                                ...(assemblyVsLokData.loksabhaParties || []),
                              ])
                            )
                              .filter(Boolean)
                              .sort()
                              .map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleAddAssemblyVsLokRange()}
                        disabled={
                          !selectedConstituency ||
                          isAssemblyVsLokLoading ||
                          assemblyVsLokData.accumulatedRanges.includes(selectedRange)
                        }
                      >
                        {isAssemblyVsLokLoading ? "Adding..." : "Add Range"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setAssemblyVsLokData((prev) => ({
                            ...prev,
                            assemblyRangeData: {},
                            loksabhaRangeData: {},
                            accumulatedRanges: [],
                          }));
                          setSelectedRange("0-10");
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Two separate tables */}
                  {isAssemblyVsLokLoading ? (
                    <PartyVsBoothSkeleton />
                  ) : (
                    renderAssemblyAndLoksabhaTables()
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] p-12 max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Ready to Compare Elections?
              </h2>
              <p className="text-gray-600 mb-6">
                Select a constituency and two different elections from the
                dropdowns above to start your analysis.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <span>Step 1: Choose State</span>
                <span>→</span>
                <span>Step 2: Select Constituency</span>
                <span>→</span>
                <span>Step 3: Pick Elections</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
