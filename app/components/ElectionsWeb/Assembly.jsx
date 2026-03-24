// app/components/ElectionsWeb/Assembly.jsx

import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Trophy, Download, Ban, XCircle, BadgeCheck, Landmark, Vote, X } from "lucide-react";
import { message } from "antd";

import {
  getAssemblyConstituencies,
  getPartyWiseResults,
  getPartyCandidates,
  BoothAnalysis,
  getPartyRanks,
  getDifficultBoothsBetween,
  getBoothVoteRange,
  BoothForm20,
  generateCombinedElectionPDF,
  logPDFDownload,
} from "~/api";

import Loksabha from "./loksabha";

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
          <div
            className="w-full h-full rounded-full border-4 border-transparent border-t-black dark:border-t-white animate-spin"
          ></div>
        </div>
      </div>

      {message ? (
        <div className="text-sm text-gray-500 dark:text-[#8e8ea0] font-medium">
          {message}
        </div>
      ) : null}
    </div>
  );
};

// Skeleton loader for main Assembly dashboard content
const AssemblySkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-md p-6 shadow-sm animate-pulse"
          >
            <div className="h-4 w-2/3 mx-auto mb-4 rounded bg-gray-200 dark:bg-[#222]" />
            <div className="h-7 w-1/2 mx-auto rounded bg-gray-300 dark:bg-[#4b4b4b]" />
          </div>
        ))}
      </div>

      {/* Tabs bar skeleton */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-sm">
        <div className="flex border-b border-gray-200 dark:border-[#333] px-4 py-3 space-x-6">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="h-5 w-28 rounded bg-gray-200 dark:bg-[#222]"
            />
          ))}
        </div>

        {/* Main table/card skeleton */}
        <div className="p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-gray-200 dark:bg-[#222]" />
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-[#222]" />

          <div className="mt-4 border border-gray-200 dark:border-[#333] rounded-sm overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-6 bg-gray-50 dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-[#333]">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-4 my-4 mx-4 rounded bg-gray-200 dark:bg-[#222]"
                />
              ))}
            </div>
            {/* Body rows */}
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-6 border-t border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]"
              >
                {Array.from({ length: 6 }).map((_, colIdx) => (
                  <div
                    key={colIdx}
                    className="h-4 my-4 mx-4 rounded bg-gray-200 dark:bg-[#222]"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const FullScreenLoader = () => (
  <div className="min-h-screen bg-gray-100 dark:bg-[#0b0b0b] flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div className="w-full max-w-6xl">
      <AssemblySkeleton />
    </div>
  </div>
);

const TabLoader = ({ message = "Loading data..." }) => (
  <div className="flex items-center justify-center py-12">
    <ColorfulLoader size="default" message={message} />
  </div>
);

/** ---------------- Component ---------------- */

export default function AssemblyAnalysis() {
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;


  const [pdfProgress, setPdfProgress] = useState(0);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);


  /** Top-level selectors */
  const [states] = useState([{ id: 21, name: "Tamil Nadu" }]);
  const [selectedState, setSelectedState] = useState(21);

  const [elections] = useState([
    { type: "assembly_elections", year: 2021 },
    { type: "loksabha_elections", year: 2024 },
  ]);
  const [selectedElection, setSelectedElection] = useState({
    type: "assembly_elections",
    year: 2021,
  })

  // Lok Sabha selection controlled in parent so we can render the select in header
  const [selectedLokSabhaNo, setSelectedLokSabhaNo] = useState(null);

  /** Assembly-only state */
  const [constituencies, setConstituencies] = useState([]);
  const [selectedConstituency, setSelectedConstituency] = useState(null);

  const [results, setResults] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [boothStrengths, setBoothStrengths] = useState([]);

  const [pollingBoothCount, setPollingBoothCount] = useState();
  const [pollingStationCount, setPollingStationCount] = useState();

  const [activeTab, setActiveTab] = useState("voting-pattern");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isConstituenciesLoading, setIsConstituenciesLoading] = useState(false);

  // Search state for constituency dropdown
  const [constituencySearch, setConstituencySearch] = useState("");
  const [isConstituencyDropdownOpen, setIsConstituencyDropdownOpen] = useState(false);

  // Difficult booths
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [difficultData, setDifficultData] = useState(null);
  const [isDifficultLoading, setIsDifficultLoading] = useState(false);

  // Ranks
  const [ranks, setRanks] = useState(null);
  const [isRanksLoading, setIsRanksLoading] = useState(false);

  // Vote ranges
  const [selectedRange, setSelectedRange] = useState("0-10");
  const [accumulatedRanges, setAccumulatedRanges] = useState([]);
  const [rangeData, setRangeData] = useState({});
  const [isRangeLoading, setIsRangeLoading] = useState(false);

  // PDF configuration modal state
  const [showPdfConfigModal, setShowPdfConfigModal] = useState(false);
  const [pdfSafePct, setPdfSafePct] = useState(20);
  const [pdfFavorablePct, setPdfFavorablePct] = useState(10);
  const [pdfDifficultPct, setPdfDifficultPct] = useState(10);







  /** ---------- Utils ---------- */

  const formatElectionType = (type) => {
    if (type === "assembly_elections") return "Assembly Elections";
    if (type === "loksabha_elections") return "Lok Sabha Elections";
    return "Unknown Election";
  };

  const positionLabel = (pos) => {
    switch (String(pos).toLowerCase()) {
      case "first":
        return "No of First Positions";
      case "second":
        return "No of second Positions";
      case "third":
        return "No of third Positions";
      case "fourth":
        return "No of fourth Positions";
      default:
        return pos;
    }
  };

  const normalizeRanks = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    const positions =
      Array.isArray(payload.positions) && payload.positions.length
        ? payload.positions.map((p) => String(p).toLowerCase())
        : ["first", "second", "third", "fourth"];
    const counts = payload.counts || {};
    const parties = Object.keys(counts);
    return {
      constituency_id: payload.constituency_id ?? null,
      total_booths: Number(payload.total_booths ?? 0),
      positions,
      parties,
      counts,
    };
  };

  const getCandidateName = (party) => {
    const candidate = candidates.find((c) => c.party === party);
    return candidate ? candidate.candidate : "-";
  };

  const getResultsWithCandidates = () => {
    if (!results?.party_results || !candidates.length) {
      return results?.party_results || [];
    }
    return results.party_results.map((partyResult) => ({
      ...partyResult,
      candidate: getCandidateName(partyResult.party),
    }));
  };

  // Normalize booth strengths payload into the shape expected by PDF/analysis views
  const normalizeBoothStrengths = (boothData) => {
    let parsed = [];
    if (Array.isArray(boothData)) parsed = boothData;
    else if (boothData && Array.isArray(boothData.data)) parsed = boothData.data;
    else if (boothData && Array.isArray(boothData.booths)) parsed = boothData.booths;
    else if (boothData && typeof boothData === "object") {
      const arrInside = Object.values(boothData).find((v) => Array.isArray(v));
      parsed = arrInside || (boothData.party !== undefined ? [boothData] : []);
    } else {
      parsed = [];
    }

    return parsed.map((it) => ({
      constituency_id: it.constituency_id ?? null,
      party: it.party ?? "-",
      strong_count: it.strong_count ?? 0,
      favorable_count: it.favorable_count ?? 0,
      weak_count: it.weak_count ?? 0,
      neutral_count: it.neutral_count ?? 0,
      booths: Array.isArray(it.booths) ? it.booths : [],
      ...it,
    }));
  };

  const normalize = (s) =>
    typeof s === "string" ? s.trim().toLowerCase() : "";

  const filterBooths = (booths = [], filterType) => {
    if (!Array.isArray(booths)) return [];
    if (filterType === "strong") {
      return booths.filter((b) => normalize(b.status).includes("safe"));
    } else if (filterType === "favorable") {
      return booths.filter((b) => normalize(b.status).includes("favorable"));
    } else if (filterType === "battle") {
      return booths.filter((b) => normalize(b.status).includes("battle"));
    } else if (filterType === "weak") {
      return booths.filter((b) => {
        const st = normalize(b.status);
        return !st.includes("safe") && !st.includes("battle") && !st.includes("favorable");
      });
    }
    return booths;
  };

  function generateVoteRanges(intervals) {
    const ranges = [];
    let start = 0;
    for (const step of intervals) {
      const end = start + step;
      ranges.push(`${start}-${end}`);
      start = end + 1;
    }
    return ranges;
  }

  /** ---------- Lifecycle ---------- */

  // Only for UI polish
  useEffect(() => {
    const t = setTimeout(() => setIsInitialLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Load assembly constituencies when Assembly mode is selected
  // Load assembly constituencies when Assembly mode is selected
  useEffect(() => {
    if (selectedElection?.type !== "assembly_elections") return; // <-- gate
    if (!selectedState) return;

    setIsConstituenciesLoading(true);
    getAssemblyConstituencies(selectedState)
      .then((data) => {
        const constituenciesList = data.constituencies || [];
        setConstituencies(constituenciesList);

        // Auto-select first constituency if none is selected and constituencies are available
        if (constituenciesList.length > 0 && !selectedConstituency) {
          setSelectedConstituency(constituenciesList[0]);
        }
      })
      .catch(() => setConstituencies([]))
      .finally(() => setIsConstituenciesLoading(false));
  }, [selectedState, selectedElection?.type]);
  // Reset assembly-specific data whenever constituency changes
  useEffect(() => {
    setAccumulatedRanges([]);
    setRangeData({});
    setSelectedRange("0-10");
  }, [selectedConstituency]);

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

  // Preload first vote range table row when tab opens (assembly only)
  useEffect(() => {
    if (selectedElection?.type !== "assembly_elections") return;
    if (
      activeTab === "vote-ranges" &&
      selectedConstituency &&
      accumulatedRanges.length === 0
    ) {
      handleAddRange("0-10");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedConstituency, selectedElection?.type]);




  // *** MAIN assembly data fetch — RUNS ONLY IN ASSEMBLY MODE ***
  useEffect(() => {
    if (selectedElection?.type !== "assembly_elections") return; // <-- key gate
    if (!selectedState || !selectedConstituency || !selectedElection) {
      setResults(null);
      setCandidates([]);
      setBoothStrengths([]);
      setPollingBoothCount(0);
      setPollingStationCount(0);
      setRanks(null);
      setPartyA(""); // Reset partyA
      setPartyB(""); // Reset partyB
      return;
    }

    setIsDataLoading(true);
    setIsRanksLoading(true);

    Promise.all([
      getPartyWiseResults({
        state_id: selectedState,
        constituency_id: selectedConstituency.assembly_constituency_no,
        election_type: "assembly_elections",
        election_year: selectedElection.year,
      }),
      getPartyCandidates(
        selectedState,
        selectedConstituency.assembly_constituency_no,
        "assembly_elections",
        selectedElection.year
      ),
      BoothAnalysis({
        constituency_id: selectedConstituency.assembly_constituency_no,
      }),
      BoothForm20({
        state_id: selectedState,
        assembly_constituency_no: selectedConstituency.assembly_constituency_no,
      }),
      getPartyRanks({
        constituency_id: selectedConstituency.assembly_constituency_no,
      }),
    ])
      .then(
        ([
          resultsData,
          candidatesData,
          boothData,
          boothForm20Data,
          ranksData,
        ]) => {
          setResults(resultsData || null);
          setCandidates(candidatesData?.candidates || []);

          // Normalize booth strengths for on-screen analysis
          const normalizedBooths = normalizeBoothStrengths(boothData);
          setBoothStrengths(normalizedBooths);


          // BoothForm20 parse
          let booth = 0,
            station = 0;
          try {
            if (Array.isArray(boothForm20Data) && boothForm20Data.length > 0) {
              const match = boothForm20Data.find(
                (x) =>
                  Number(x.assembly_constituency_no) ===
                  Number(selectedConstituency.assembly_constituency_no)
              );
              const entry = match || boothForm20Data[0];
              booth = Number(entry.polling_booth_count ?? 0);
              station = Number(entry.polling_station_count ?? 0);
            } else if (boothForm20Data && typeof boothForm20Data === "object") {
              booth = Number(boothForm20Data.polling_booth_count ?? 0);
              station = Number(boothForm20Data.polling_station_count ?? 0);
            }
          } catch { }
          setPollingBoothCount(booth);
          setPollingStationCount(station);

          setRanks(normalizeRanks(ranksData));
          setIsRanksLoading(false);

          // Seed Party A/B
          if (resultsData?.party_results?.length) {
            const sorted = [...resultsData.party_results].sort(
              (a, b) => (b.votes || 0) - (a.votes || 0)
            );

          } else {
            setPartyA("");
            setPartyB("");
          }
          setDifficultData(null);
        }
      )
      .catch(() => {
        setResults(null);
        setCandidates([]);
        setBoothStrengths([]);
        setPollingBoothCount(0);
        setPollingStationCount(0);
        setRanks(null);
        setPartyA(""); // Reset partyA on error
        setPartyB(""); // Reset partyB on error
        setIsRanksLoading(false);
      })
      .finally(() => setIsDataLoading(false));
  }, [selectedState, selectedConstituency, selectedElection]);

  // Difficult booths (assembly only)
  useEffect(() => {
    if (selectedElection?.type !== "assembly_elections") return; // <-- gate
    if (!selectedConstituency || !partyA || !partyB || partyA === partyB) {
      setDifficultData(null);
      return;
    }
    setIsDifficultLoading(true);
    getDifficultBoothsBetween({
      constituency_id: selectedConstituency.assembly_constituency_no,
      party_a: partyA,
      party_b: partyB,
    })
      .then((data) => setDifficultData(data || null))
      .catch(() => setDifficultData(null))
      .finally(() => setIsDifficultLoading(false));
  }, [selectedConstituency, partyA, partyB, selectedElection?.type]);

  /** ---------- Handlers ---------- */

  const handleAddRange = async (rangeStr = selectedRange) => {
    if (selectedElection?.type !== "assembly_elections") return; // safety
    if (!selectedConstituency || !rangeStr) return;
    if (accumulatedRanges.includes(rangeStr)) return;

    setIsRangeLoading(true);
    try {
      const data = await getBoothVoteRange({
        constituency_id: selectedConstituency.assembly_constituency_no,
        range: rangeStr,
      });

      const countsForRange = {};
      Object.entries(data?.counts || {}).forEach(([party, bins]) => {
        countsForRange[party] = bins?.[rangeStr] ?? 0;
      });

      setRangeData((prev) => ({ ...prev, [rangeStr]: countsForRange }));
      setAccumulatedRanges((prev) => [...prev, rangeStr]);
    } catch (e) {
      console.error("Failed to fetch booth vote range", e);
    } finally {
      setIsRangeLoading(false);
    }
  };

  const percentageOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const handleOpenPdfConfig = () => {
    if (isPdfGenerating || !results) return;
    setShowPdfConfigModal(true);
  };

  const handleCancelPdfConfig = () => {
    setShowPdfConfigModal(false);
  };

  const handleConfirmPdfConfig = async () => {
    if (!results || !selectedConstituency) {
      setShowPdfConfigModal(false);
      return;
    }

    try {
      setIsPdfGenerating(true);
      setShowPdfConfigModal(false);
      setPdfProgress(0);

      // Call backend combined PDF generation API
      const pdfBlob = await generateCombinedElectionPDF({
        state_id: selectedState,
        constituency_id: selectedConstituency.assembly_constituency_no,
        safe_min_pct: Number(pdfSafePct),
        favorable_min_pct: Number(pdfFavorablePct),
        difficult_min_behind_pct: Number(pdfDifficultPct),
      });

      // Log PDF download
      const userInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      try {
        await logPDFDownload({
          user_id: userInfo.user_id,
          name: userInfo.name,
          email: userInfo.email,
          role: userInfo.role,
          state_id: userInfo.state_id,
          constituency_id: selectedConstituency.assembly_constituency_no,
          organization_id: userInfo.organization_id,
        });
      } catch (logError) {
        console.warn("Failed to log PDF download", logError);
      }

      // Create download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename
      const constituencyName = results?.constituency_name ||
        selectedConstituency?.name ||
        `Constituency_${selectedConstituency?.assembly_constituency_no || 'unknown'}`;
      const sanitizedName = constituencyName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${sanitizedName}_election_report_${selectedElection?.year || '2021'}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setPdfProgress(100);

      // Show success message
      message.success("PDF generated and downloaded successfully!");
    } catch (error) {
      console.error("Failed to generate PDF", error);
      const errorMessage = error.response?.data?.detail ||
        error.message ||
        "Unknown error occurred";
      message.error(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsPdfGenerating(false);
      setPdfProgress(0);
    }
  };

  const openBoothDetails = (party, filterType) => {
    const partyObj = boothStrengths.find((p) => p.party === party);
    const boothsForParty = partyObj?.booths || [];
    const filtered = filterBooths(boothsForParty, filterType);
    setDetailParty(party);
    setDetailFilter(filterType);
    setDetailBooths(filtered);
    setShowBoothDetails(true);
    setActiveTab("analysis");
  };

  const [showBoothDetails, setShowBoothDetails] = useState(false);
  const [detailParty, setDetailParty] = useState(null);
  const [detailFilter, setDetailFilter] = useState(null);
  const [detailBooths, setDetailBooths] = useState([]);

  const closeBoothDetails = () => {
    setShowBoothDetails(false);
    setDetailParty(null);
    setDetailFilter(null);
    setDetailBooths([]);
  };

  const filterLabel = (f) => {
    if (f === "strong") return "Strong (Safe)";
    if (f === "favorable") return "Favorable";
    if (f === "weak") return "Weak (Default)";
    if (f === "battle") return "Battle Ground";
    return f;
  };

  // Filter constituencies based on search
  const filteredConstituencies = constituencies.filter((c) => {
    const searchLower = constituencySearch.toLowerCase();
    const name = c.assembly_constituency_name?.toLowerCase() || "";
    const number = c.assembly_constituency_no?.toString() || "";
    return name.includes(searchLower) || number.includes(searchLower);
  });

  /** ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-white dark:from-[#0b0b0b] dark:to-[#111111] text-gray-900 dark:text-white">




      {/* Header: selectors */}
      <div className="bg-white dark:bg-[#0f0f10] shadow-sm border-b border-gray-200 dark:border-[#333] p-1">


        <Dialog open={isPdfGenerating} onOpenChange={() => { }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generating PDF Report</DialogTitle>
              <DialogDescription>
                Please wait while we prepare your election report...
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-4">
              <ColorfulLoader size="large" message="" />

              {/* Progress Bar */}
              {pdfProgress > 0 && (
                <div className="mt-6 w-full">
                  <div className="w-full bg-gray-200 dark:bg-[#222] rounded-full h-2.5">
                    <div
                      className="bg-[#0EA5E9] dark:bg-[#F2700D] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${pdfProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-[#8e8ea0] mt-2 text-center">
                    {pdfProgress}% Complete
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-[#8e8ea0] mt-4">
                Optimized for fast generation...
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showPdfConfigModal} onOpenChange={setShowPdfConfigModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure Booth Categories for PDF</DialogTitle>
              <DialogDescription>
                Choose the percentage thresholds used to classify polling areas in the PDF report.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="favorable-pct">Favorable (min lead %)</Label>
                <Select
                  value={pdfFavorablePct.toString()}
                  onValueChange={(value) => setPdfFavorablePct(Number(value))}
                >
                  <SelectTrigger id="favorable-pct">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {percentageOptions.map((v) => (
                      <SelectItem key={`fav-${v}`} value={v.toString()}>
                        {v}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficult-pct">Difficult (min behind %)</Label>
                <Select
                  value={pdfDifficultPct.toString()}
                  onValueChange={(value) => setPdfDifficultPct(Number(value))}
                >
                  <SelectTrigger id="difficult-pct">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {percentageOptions.map((v) => (
                      <SelectItem key={`diff-${v}`} value={v.toString()}>
                        {v}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="safe-pct">Safe (min lead %)</Label>
                <Select
                  value={pdfSafePct.toString()}
                  onValueChange={(value) => setPdfSafePct(Number(value))}
                >
                  <SelectTrigger id="safe-pct">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {percentageOptions.map((v) => (
                      <SelectItem key={`safe-${v}`} value={v.toString()}>
                        {v}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelPdfConfig}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPdfConfig}
                disabled={isPdfGenerating || !results}
              >
                Generate PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* State */}
            <Select
              value={selectedState?.toString() || ""}
              onValueChange={(value) => setSelectedState(Number(value))}
            >
              <SelectTrigger className="w-full border-gray-300 dark:border-[#333]">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333]">
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Election */}
            <Select
              value={
                selectedElection
                  ? `${selectedElection.type}|${selectedElection.year}`
                  : ""
              }
              onValueChange={(value) => {
                const [type, year] = value.split("|");
                setSelectedElection({ type, year: Number(year) });

                if (type === "loksabha_elections" || type === "loksabha_election") {
                  // When switching to Lok Sabha view, keep the last loaded Assembly data
                  // so that the PDF download button can still use it.
                  setSelectedConstituency(null);
                } else {
                  // leaving lok sabha mode
                  setSelectedLokSabhaNo(null);
                }
              }}
            >
              <SelectTrigger className="w-full border-gray-300 dark:border-[#333]">
                <SelectValue placeholder="Select Election" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333]">
                {elections.map((ev, idx) => (
                  <SelectItem key={idx} value={`${ev.type}|${ev.year}`}>
                    {ev.type === "assembly_elections"
                      ? "Assembly Elections"
                      : "Lok Sabha Elections"}{" "}
                    ({ev.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Third column: render ONLY when an election is chosen */}
            {selectedElection?.type === "assembly_elections" ? (
              <div className="flex items-center space-x-4 relative">
                {/* Assembly Constituency searchable dropdown */}
                <div className="flex-1 relative constituency-dropdown-container">
                  <div className="relative">
                    <Input
                      type="text"
                      className="w-full pr-10"
                      placeholder={selectedConstituency ? selectedConstituency.assembly_constituency_name : "Search Assembly Constituency..."}
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
                        // Clear search when losing focus if dropdown is closed
                        setTimeout(() => {
                          if (!isConstituencyDropdownOpen) {
                            setConstituencySearch("");
                          }
                        }, 200);
                      }}
                      disabled={!constituencies.length || isConstituenciesLoading}
                    />

                    {/* Clear button */}
                    {constituencySearch && !isConstituenciesLoading && (
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

                    {isConstituenciesLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        Loading…
                      </div>
                    )}
                  </div>

                  {/* Dropdown list */}
                  {isConstituencyDropdownOpen && !isConstituenciesLoading && (
                    <>
                      {filteredConstituencies.length > 0 ? (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1f1f1f] border border-gray-300 dark:border-[#333] rounded-md shadow-sm max-h-60 overflow-y-auto">
                          {filteredConstituencies.map((c) => (
                            <div
                              key={c.assembly_constituency_no}
                              className={`px-3 py-2 cursor-pointer hover:bg-[#0EA5E9]/10 dark:hover:bg-[#F2700D]/10 text-gray-900 dark:text-white ${selectedConstituency?.assembly_constituency_no === c.assembly_constituency_no
                                ? "bg-[#0EA5E9]/20 dark:bg-[#F2700D]/15 font-semibold"
                                : ""
                                }`}
                              onClick={() => {
                                setSelectedConstituency(c);
                                setConstituencySearch("");
                                setIsConstituencyDropdownOpen(false);
                              }}
                            >
                              <div className="text-sm text-gray-900 dark:text-white">
                                {c.assembly_constituency_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : constituencySearch ? (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1f1f1f] border border-gray-300 dark:border-[#333] rounded-md shadow-sm p-3">
                          <div className="text-sm text-gray-500 dark:text-[#8e8ea0] text-center">
                            No constituencies found
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                <Button
                  onClick={handleOpenPdfConfig}
                  disabled={isDataLoading || !results || isPdfGenerating}
                  className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {isPdfGenerating ? (
                    "Generating..."
                  ) : (
                    <>
                      <Download className="mr-2" size={18} />
                      Download PDF
                    </>
                  )}
                </Button>

              </div>
            ) : selectedElection?.type === "loksabha_elections" ||
              selectedElection?.type === "loksabha_election" ? (
              <div className="flex items-center space-x-4 relative">
                {/* Lok Sabha searchable dropdown */}
                <div className="flex-1">
                  <Loksabha
                    stateId={selectedState}
                    variant="inline-select"
                    selectedLokSabhaNo={selectedLokSabhaNo}
                    onChange={setSelectedLokSabhaNo}
                  />
                </div>
                {/* Reuse the same PDF download button so it's also visible in Lok Sabha mode.
                    It will generate the Assembly-based PDF for the last loaded constituency. */}
                <Button
                  onClick={handleOpenPdfConfig}
                  disabled={isDataLoading || !results || isPdfGenerating}
                  className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {isPdfGenerating ? (
                    "Generating..."
                  ) : (
                    <>
                      <Download className="mr-2" size={18} />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>

      </div>

      <div className="w-full px-4 sm:px-6 lg:px-6 py-2">
        {/* If Lok Sabha is selected, render ONLY the Loksabha component. No assembly API calls happen. */}
        {selectedElection?.type === "loksabha_elections" ||
          selectedElection?.type === "loksabha_election" ? (
          <Loksabha
            stateId={selectedState}
            variant="full"
            selectedLokSabhaNo={selectedLokSabhaNo}
            onChange={setSelectedLokSabhaNo}
          />
        ) : (
          <>
            {/* Assembly mode UI */}
            {isInitialLoading || isDataLoading ? (
              <div className="py-6">
                <AssemblySkeleton />
              </div>
            ) : (
              <>
                {/* Stats Cards */}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">

                      <span>Total Polled Votes</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                      {results?.total_votes != null
                        ? results.total_votes.toLocaleString()
                        : "-"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    {/* <div className="flex items-center justify-center gap-2 mb-3">
      <Landmark className="w-5 h-5 text-gray-500" />

    </div> */}
                    <div className="flex justify-between text-center">
                      <div className="flex-1 border-r border-gray-200 dark:border-[#333] pr-2">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 font-semibold">Booths</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {pollingBoothCount || "-"}
                        </div>
                      </div>
                      <div className="flex-1 pl-2">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 font-semibold">Stations</div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                          {pollingStationCount || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">

                      <span>Total Valid Votes</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                      {results?.total_valid_votes?.toLocaleString() || "-"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">

                      <span>Rejected Votes</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                      {results?.rejected_votes?.toLocaleString() || "-"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">

                      <span>NOTA Votes</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
                      {results?.nota_votes?.toLocaleString() || "-"}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                {results && (
                  <div className="space-y-8">
                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333]">
                      <nav className="flex border-b border-gray-200 dark:border-[#333]">
                        <button
                          onClick={() => setActiveTab("voting-pattern")}
                          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "voting-pattern"
                            ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                          Assembly Analysis
                          {activeTab === "voting-pattern" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] dark:bg-[#F2700D]"></span>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab("winning-status")}
                          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "winning-status"
                            ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                          Winning Status
                          {activeTab === "winning-status" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] dark:bg-[#F2700D]"></span>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab("analysis")}
                          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "analysis"
                            ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                          Booth Level Analysis
                          {activeTab === "analysis" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] dark:bg-[#F2700D]"></span>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab("ranks")}
                          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "ranks"
                            ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                          Ranks
                          {activeTab === "ranks" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] dark:bg-[#F2700D]"></span>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab("difficult-booths")}
                          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "difficult-booths"
                            ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                          Party comparison
                          {activeTab === "difficult-booths" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] dark:bg-[#F2700D]"></span>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveTab("vote-ranges")}
                          className={`px-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "vote-ranges"
                            ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            }`}
                        >
                          Vote Ranges
                          {activeTab === "vote-ranges" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0EA5E9] dark:bg-[#F2700D]"></span>
                          )}
                        </button>




                      </nav>

                      <div className="space-y-6">
                        {/* --- Voting Pattern --- */}
                        {activeTab === "voting-pattern" && (
                          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] p-3 sm:p-4">
                            {/* Table only: header + scrollable party rows */}
                            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-t-xl flex flex-col overflow-hidden max-h-[60vh] min-h-[240px]">
                              {/* Fixed Header - stays visible */}
                              <div className="flex-shrink-0 bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-100 dark:border-[#2a2a2a]">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest py-2 px-2" style={{ minWidth: "44px" }}>Rank</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest py-2 px-2" style={{ minWidth: "90px" }}>Party</TableHead>
                                        <TableHead className="text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest py-2 px-2" style={{ minWidth: "120px" }}>Candidate</TableHead>
                                        <TableHead className="text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest py-2 px-2" style={{ minWidth: "72px" }}>Votes</TableHead>
                                        <TableHead className="text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest py-2 px-2" style={{ minWidth: "90px" }}>Share</TableHead>
                                        <TableHead className="text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest py-2 px-2" style={{ minWidth: "100px" }}>Diff</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                  </Table>
                                </div>
                              </div>

                              {/* Scrollable Party Rows - vertical scroll only here */}
                              <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
                                <Table>
                                  <TableBody>
                                    {getResultsWithCandidates().map((p, index) => {
                                      const isWinner = index === 0;
                                      const voteShareDiff = p.vote_share_diff_pct;

                                      return (
                                        <TableRow
                                          key={p.party}
                                          className={`border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 transition-colors ${isWinner
                                            ? "bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20"
                                            : "bg-white dark:bg-[#1a1a1a] hover:bg-gray-50/80 dark:hover:bg-[#222]"
                                            }`}
                                        >
                                          <TableCell className={`text-sm py-1.5 px-2 ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-800 dark:text-white font-medium"}`} style={{ minWidth: "44px" }}>
                                            {index + 1}
                                          </TableCell>
                                          <TableCell className={`text-sm py-1.5 px-2 ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-800 dark:text-white font-medium"}`} style={{ minWidth: "90px" }}>
                                            {p.party}
                                          </TableCell>
                                          <TableCell className={`text-xs py-1.5 px-2 ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-600 dark:text-[#d1d5db]"}`} style={{ minWidth: "120px" }}>
                                            <span className="flex items-center gap-1">
                                              {p.candidate}
                                              {isWinner && <Trophy size={14} className="text-[#0EA5E9] dark:text-[#38bdf8] flex-shrink-0" />}
                                            </span>
                                          </TableCell>
                                          <TableCell className={`text-right text-sm py-1.5 px-2 ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-800 dark:text-white font-medium"}`} style={{ minWidth: "72px" }}>
                                            {p.votes?.toLocaleString()}
                                          </TableCell>
                                          <TableCell className={`text-right text-sm py-1.5 px-2 ${isWinner ? "text-gray-900 dark:text-white font-bold" : "text-gray-800 dark:text-white"}`} style={{ minWidth: "90px" }}>
                                            <div className="flex items-center justify-end gap-1">
                                              <span className="font-semibold">
                                                {p.vote_share_pct}%
                                              </span>
                                              {p.vote_share_pct && (
                                                <div className="w-10 bg-gray-200 dark:bg-[#222] h-1.5 rounded-full overflow-hidden flex-shrink-0">
                                                  <div
                                                    className={`h-1.5 ${isWinner
                                                      ? "bg-[#0EA5E9] dark:bg-[#38bdf8]"
                                                      : "bg-[#0EA5E9] dark:bg-[#F2700D]"
                                                      } rounded-full transition-all`}
                                                    style={{
                                                      width: `${Math.min(p.vote_share_pct, 100)}%`,
                                                    }}
                                                  ></div>
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className={`text-right text-sm py-1.5 px-2 ${isWinner ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-white"}`} style={{ minWidth: "100px" }}>
                                            {voteShareDiff && voteShareDiff !== "-" ? (
                                              <div
                                                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold tracking-widest rounded ${parseFloat(voteShareDiff) > 0
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
                                              <span className="text-[10px] text-gray-400">-</span>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                            {/* Victory Margin bar - directly below table, always visible */}
                            <div className="bg-gray-50/50 dark:bg-[#111]/50 px-4 py-3 rounded-b-xl border-x border-b border-gray-200 dark:border-[#333]">
                              <div className="flex items-center justify-between text-gray-900 dark:text-white">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Victory Margin</span>
                                <div className="flex items-center gap-6">
                                  <div className="text-right flex flex-col items-end">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Votes</div>
                                    <div className="text-base font-bold text-[#0EA5E9] dark:text-[#38bdf8] leading-tight">
                                      {results.margin_votes?.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="text-right flex flex-col items-end">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">%</div>
                                    <div className="text-base font-bold text-[#0EA5E9] dark:text-[#38bdf8] leading-tight">
                                      {results.margin_pct}%
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* --- Ranks --- */}
                        {activeTab === "ranks" && (
                          <div>
                            <h3 className="text-lg font-semibold mb-4 text-black dark:text-white ml-3 mt-2">
                              {results?.constituency_name ?? "-"} Assembly
                              Constituency
                            </h3>

                            {!ranks && (isRanksLoading || isDataLoading) && (
                              <TabLoader message="Loading ranks..." />
                            )}

                            {ranks && ranks.parties.length > 0 ? (
                              <div className="border border-gray-200 dark:border-[#333] rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-50/50 dark:bg-[#111]/50 hover:bg-transparent border-b border-gray-100 dark:border-[#2a2a2a]">
                                      <TableHead className="border-r border-gray-200 dark:border-[#333]">
                                        Booth wise position status (2021)
                                      </TableHead>
                                      {[...ranks.parties]
                                        .sort(
                                          (a, b) =>
                                            (ranks.counts[b]?.first || 0) -
                                            (ranks.counts[a]?.first || 0) ||
                                            a.localeCompare(b)
                                        )
                                        .map((party) => (
                                          <TableHead
                                            key={party}
                                            className="text-center text-orange-600 dark:text-orange-500"
                                          >
                                            {party}
                                          </TableHead>
                                        ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {[...ranks.positions].map((pos) => (
                                      <TableRow key={pos}>
                                        <TableCell className="border-r border-gray-200 dark:border-[#333] font-medium">
                                          {positionLabel(pos)}
                                        </TableCell>
                                        {[...ranks.parties]
                                          .sort(
                                            (a, b) =>
                                              (ranks.counts[b]?.first || 0) -
                                              (ranks.counts[a]?.first || 0) ||
                                              a.localeCompare(b)
                                          )
                                          .map((party) => (
                                            <TableCell
                                              key={`${party}-${pos}`}
                                              className="text-center"
                                            >
                                              {Number(
                                                ranks.counts?.[party]?.[pos] ?? 0
                                              ).toLocaleString()}
                                            </TableCell>
                                          ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              !isRanksLoading && (
                                <TabLoader message="No ranks available for this selection." />
                              )
                            )}
                          </div>
                        )}

                        {/* --- Difficult Booths --- */}
                        {/* --- Difficult Booths --- */}
                        {activeTab === "difficult-booths" && (
                          <div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 mt-3 ml-3">
                              <Select
                                value={partyA || undefined}
                                onValueChange={(value) => setPartyA(value || "")}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select party" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {(results?.party_results || []).map((p) => (
                                    <SelectItem key={p.party} value={p.party}>
                                      {p.party}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={partyB || undefined}
                                onValueChange={(value) => setPartyB(value || "")}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select party" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                  {(results?.party_results || []).map((p) => (
                                    <SelectItem key={p.party} value={p.party}>
                                      {p.party}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {partyA && partyB && partyA === partyB ? (
                              <div className="text-center text-gray-600 dark:text-[#8e8ea0]">
                                Please choose two different parties.
                              </div>
                            ) : isDifficultLoading ? (
                              <TabLoader message="Calculating difficult booths..." />
                            ) : partyA && partyB && difficultData ? (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {(() => {
                                  const thresholds = difficultData.thresholds?.length
                                    ? difficultData.thresholds
                                    : [20, 30, 40, 50, 60];
                                  const makeKey = (t) => `gt_${t}`;

                                  const Table = ({ title, leadName, trailName, counts }) => (
                                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-gray-200 dark:border-[#333]">
                                      <div className="text-center font-semibold text-gray-900 dark:text-white mb-3">
                                        {title}
                                      </div>
                                      <div className="overflow-x-auto">
                                        <table className="min-w-full table-fixed border-collapse border border-gray-300 dark:border-[#333]">
                                          <colgroup>
                                            <col style={{ width: "8%" }} />
                                            <col style={{ width: "72%" }} />
                                            <col style={{ width: "20%" }} />
                                          </colgroup>
                                          <tbody>
                                            {thresholds.map((t, i) => (
                                              <tr
                                                key={t}
                                                className="border-b border-gray-300 dark:border-[#333]"
                                              >
                                                <td className="px-4 py-3 text-center font-semibold text-gray-800 dark:text-white border-r border-gray-300 dark:border-[#333]">
                                                  {i + 1}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                  Number of Booths{" "}
                                                  <span className="text-green-600 dark:text-green-400 font-bold">
                                                    {leadName}
                                                  </span>{" "}
                                                  having more than {t}% Vote Margin than{" "}
                                                  <span className="text-blue-800 dark:text-blue-400 font-bold">
                                                    {trailName}
                                                  </span>
                                                </td>
                                                <td className="px-4 py-3 text-center text-gray-900 dark:text-white font-semibold border-l border-gray-300 dark:border-[#333]">
                                                  {counts?.[makeKey(t)] ?? 0}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  );

                                  return (
                                    <>
                                      <Table
                                        title={`${partyA} over ${partyB}`}
                                        leadName={partyA}
                                        trailName={partyB}
                                        counts={difficultData.counts?.a_over_b}
                                      />
                                      <Table
                                        title={`${partyB} over ${partyA}`}
                                        leadName={partyB}
                                        trailName={partyA}
                                        counts={difficultData.counts?.b_over_a}
                                      />
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="text-center text-gray-600 dark:text-[#8e8ea0]">
                                Select two different parties to view difficult booths.
                              </div>
                            )}
                          </div>
                        )}
                        {/* --- Vote Ranges --- */}
                        {activeTab === "vote-ranges" && (
                          <div>
                            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6">
                              <div className="md:w-64 ml-3 mt-3">
                                {/* <label className="block text-xs font-medium text-gray-600 mb-1 ml-3">
                                  Add vote range
                                </label> */}
                                <Select
                                  value={selectedRange}
                                  onValueChange={(value) => {
                                    setSelectedRange(value);
                                    handleAddRange(value);
                                  }}
                                >
                                  <SelectTrigger className="w-full border-gray-300 dark:border-[#333]">
                                    <SelectValue placeholder="Select a range to add" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#333] max-h-64">
                                    {[
                                      ...generateVoteRanges([10, 10, 20, 20, 20]),
                                      ...generateVoteRanges([50, 50, 50, 50, 50, 50]),
                                      ...generateVoteRanges([100, 100, 100, 100, 100]),
                                    ].map((r) => (
                                      <SelectItem
                                        key={r}
                                        value={r}
                                        disabled={accumulatedRanges.includes(r)}
                                      >
                                        {r}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    setAccumulatedRanges([]);
                                    setRangeData({});
                                  }}
                                >
                                  Clear All
                                </Button>
                              </div>
                            </div>

                            {isRangeLoading ? (
                              <TabLoader message="Loading data..." />
                            ) : accumulatedRanges.length === 0 ? (
                              <div className="text-center text-gray-600 dark:text-[#8e8ea0]">
                                Select a range to populate the table.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full table-fixed border-collapse border border-gray-300 dark:border-[#333]">
                                  <colgroup>
                                    <col style={{ width: "16%" }} />
                                    {Array.from(
                                      new Set(Object.values(rangeData).flatMap((row) => Object.keys(row || {})))
                                    )
                                      .sort()
                                      .map((p) => (
                                        <col key={p} />
                                      ))}
                                  </colgroup>

                                  <thead className="bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-100 dark:border-[#2a2a2a]">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest border-r border-gray-200">
                                        No. of Votes
                                      </th>
                                      {Array.from(
                                        new Set(Object.values(rangeData).flatMap((row) => Object.keys(row || {})))
                                      )
                                        .sort()
                                        .map((p) => (
                                          <th
                                            key={p}
                                            className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                                          >
                                            {" "}
                                            <span className="text-[#0EA5E9] dark:text-[#F2700D] font-bold"> {p}</span>
                                          </th>
                                        ))}
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {accumulatedRanges.map((rng) => (
                                      <tr key={rng} className="border-t border-gray-300">
                                        <td className="px-4 py-3 text-sm font-medium text-black dark:text-white border-r border-gray-300">
                                          <div className="flex items-center justify-between">
                                            <span>{rng}</span>
                                          </div>
                                        </td>
                                        {Array.from(
                                          new Set(Object.values(rangeData).flatMap((row) => Object.keys(row || {})))
                                        )
                                          .sort()
                                          .map((p) => (
                                            <td
                                              key={`${rng}-${p}`}
                                              className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white"
                                            >
                                              {rangeData?.[rng]?.[p] ?? 0}
                                            </td>
                                          ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}

                        {/* --- Winning Status --- */}
                        {activeTab === "winning-status" && (
                          <div>
                            {/* <h3 className="text-lg font-semibold mb-4 text-gray-900 pl-4 mt-4">
                              Winning Status
                            </h3> */}
                            <div className="border border-gray-200 dark:border-[#333] rounded-md overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-gray-50/50 dark:bg-[#111]/50 hover:bg-transparent border-b border-gray-100 dark:border-[#2a2a2a]">
                                    <TableHead className="text-center">Year</TableHead>
                                    <TableHead className="text-center">Winner</TableHead>
                                    <TableHead className="text-center">Runner</TableHead>
                                    <TableHead className="text-center">3rd Place</TableHead>
                                    <TableHead className="text-center">4th Place</TableHead>
                                    <TableHead className="text-center">5th Place</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell className="text-center font-medium">
                                      {selectedElection?.year}
                                    </TableCell>
                                    <TableCell className="text-center bg-green-100 dark:bg-orange-300 font-semibold">
                                      {results?.winner?.party ? (
                                        <div>
                                          <div className="font-semibold text-black  dark:text-black">
                                            {results.winner.party}
                                          </div>
                                          <div className="text-xs text-black dark:text-black">
                                            {getCandidateName(
                                              results.winner.party
                                            )}
                                          </div>
                                          <div className="text-xs text-blue-600 mt-4 flex flex-col dark:text-black">
                                            <span>
                                              VOTES:{" "}
                                              {results.winner.votes?.toLocaleString()}
                                            </span>
                                            <span className="mt-2">
                                              VOTE SHARE:{" "}
                                              {results.winner.vote_share_pct}%
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {results?.runner_up?.party ? (
                                        <div>
                                          <div className="font-semibold">
                                            {results.runner_up.party}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                                            {getCandidateName(
                                              results.runner_up.party
                                            )}
                                          </div>
                                          <div className="text-xs text-blue-600 dark:text-[#0F766E] mt-4 flex flex-col">
                                            <span>
                                              VOTES:{" "}
                                              {results.runner_up.votes?.toLocaleString()}
                                            </span>
                                            <span className="mt-2">
                                              VOTE SHARE:{" "}
                                              {results.runner_up.vote_share_pct}%
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {results?.third?.party ? (
                                        <div>
                                          <div className="font-semibold">
                                            {results.third.party}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                                            {getCandidateName(
                                              results.third.party
                                            )}
                                          </div>
                                          <div className="text-xs text-blue-600 dark:text-[#0F766E] mt-4 flex flex-col">
                                            <span>
                                              VOTES:{" "}
                                              {results.third.votes?.toLocaleString()}
                                            </span>
                                            <span className="mt-2">
                                              VOTE SHARE:{" "}
                                              {results.third.vote_share_pct}%
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {results?.fourth?.party ? (
                                        <div>
                                          <div className="font-semibold">
                                            {results.fourth.party}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                                            {getCandidateName(
                                              results.fourth.party
                                            )}
                                          </div>
                                          <div className="text-xs text-[#801ec7] dark:text-[#0F766E] mt-4 flex flex-col">
                                            <span>
                                              VOTES:{" "}
                                              {results.fourth.votes?.toLocaleString()}
                                            </span>
                                            <span className="mt-2">
                                              VOTESHARE:{" "}
                                              {results.fourth.vote_share_pct}%
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {results?.fifth?.party ? (
                                        <div>
                                          <div className="font-semibold">
                                            {results.fifth.party}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-[#8e8ea0]">
                                            {getCandidateName(
                                              results.fifth.party
                                            )}
                                          </div>
                                          <div className="text-xs text-[#801ec7] dark:text-[#0F766E] mt-4 flex flex-col">
                                            <span>
                                              VOTES:{" "}
                                              {results.fifth.votes?.toLocaleString()}
                                            </span>
                                            <span className="mt-2">
                                              VOTESHARE:{" "}
                                              {results.fifth.vote_share_pct}%
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}

                        {/* --- Booth Level Analysis --- */}
                        {activeTab === "analysis" && (
                          <div>
                            {showBoothDetails ? (
                              <div>
                                <div className="flex items-center justify-between mb-4 relative">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={closeBoothDetails}
                                  >
                                    Back
                                  </Button>

                                  <div className="absolute left-1/2 transform -translate-x-1/2 px-4 py-2 text-black-800 rounded-sm text-sm font-semibold">
                                    {filterLabel(detailFilter)} booths for{" "}
                                    {detailParty}
                                  </div>
                                </div>

                                {detailBooths.length > 0 ? (
                                  <div className="border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-sm">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                                      <table className="min-w-full table-fixed border-collapse border border-gray-200 dark:border-[#333]">
                                        <colgroup>
                                          <col style={{ width: "12%" }} />
                                          <col style={{ width: "66%" }} />
                                          <col style={{ width: "12%" }} />
                                          <col style={{ width: "10%" }} />
                                        </colgroup>

                                        <thead className="bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-100 dark:border-[#2a2a2a] text-gray-800 dark:text-white sticky top-0 z-10">
                                          <tr>
                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-r border-gray-200 dark:border-[#333]">
                                              Polling Station No.
                                            </th>
                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest">
                                              Polling Areas
                                            </th>
                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-l border-gray-200 dark:border-[#333]">
                                              STATUS
                                            </th>
                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-l border-gray-200 dark:border-[#333]">
                                              PERCENTAGE
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-[#333]">
                                          {[...detailBooths].sort((a, b) => {
                                            // Sort by booth_id numerically
                                            const aNum = parseInt(String(a.booth_id).replace(/\D/g, '')) || 0;
                                            const bNum = parseInt(String(b.booth_id).replace(/\D/g, '')) || 0;
                                            return aNum - bNum;
                                          }).map((b, idx) => (
                                            <tr
                                              key={`${b.booth_id}-${idx}`}
                                              className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition-colors"
                                            >
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white border-r border-gray-200 dark:border-[#333]">
                                                {b.booth_id}
                                              </td>
                                              <td className="px-6 py-4 text-sm text-gray-700 dark:text-[#e5e5e5] whitespace-normal break-words max-w-full">
                                                {b.polling_areas || "-"}
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white border-l border-gray-200 dark:border-[#333]">
                                                {b.status || "-"}
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white border-l border-gray-200 dark:border-[#333]">
                                                {b.percentage || "-"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <TabLoader message="No booths match this filter." />
                                )}
                              </div>
                            ) : (
                              <>
                                {boothStrengths.length > 0 ? (
                                  <div className="border border-gray-200 dark:border-[#333] rounded-xl overflow-hidden bg-white dark:bg-[#1a1a1a] flex flex-col shadow-sm">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh] flex-1">
                                      <table className="min-w-full table-fixed border-collapse border border-gray-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a]">
                                        <colgroup>
                                          <col style={{ width: "30%" }} />
                                          <col style={{ width: "17.5%" }} />
                                          <col style={{ width: "17.5%" }} />
                                          <col style={{ width: "17.5%" }} />
                                          <col style={{ width: "17.5%" }} />
                                        </colgroup>

                                        <thead className="bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-100 dark:border-[#2a2a2a] sticky top-0 z-10">
                                          <tr>
                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-r border-gray-200 dark:border-[#333]">
                                              Party
                                            </th>
                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-r border-gray-200 dark:border-[#333]">
                                              Strong Count
                                            </th>
                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-r border-gray-200 dark:border-[#333]">
                                              Favorable Count
                                            </th>
                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest border-r border-gray-200 dark:border-[#333]">
                                              Weak Count
                                            </th>
                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-500 dark:text-[#8e8ea0] uppercase tracking-widest">
                                              Battle Ground
                                            </th>
                                          </tr>
                                        </thead>

                                        <tbody className="bg-white dark:bg-[#1a1a1a] divide-y divide-gray-200 dark:divide-[#333]">
                                          {boothStrengths.map((strength, index) => (
                                            <tr
                                              key={`${strength.party}-${index}`}
                                              className="hover:bg-gray-50/80 dark:hover:bg-[#222] transition-colors"
                                            >
                                              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                {strength.party}
                                              </td>

                                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center border-l border-gray-200 dark:border-[#333]">
                                                <button
                                                  onClick={() =>
                                                    openBoothDetails(
                                                      strength.party,
                                                      "strong"
                                                    )
                                                  }
                                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium text-green-800 hover:bg-gray-100"
                                                >
                                                  {strength.strong_count}
                                                </button>
                                              </td>

                                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center border-l border-gray-200 dark:border-[#333]">
                                                <button
                                                  onClick={() =>
                                                    openBoothDetails(
                                                      strength.party,
                                                      "favorable"
                                                    )
                                                  }
                                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium text-blue-600 hover:bg-gray-100"
                                                >
                                                  {strength.favorable_count}
                                                </button>
                                              </td>

                                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center border-l border-gray-200 dark:border-[#333]">
                                                <button
                                                  onClick={() =>
                                                    openBoothDetails(
                                                      strength.party,
                                                      "weak"
                                                    )
                                                  }
                                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium text-red-500 hover:bg-gray-100"
                                                >
                                                  {strength.weak_count}
                                                </button>
                                              </td>

                                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white text-center border-l border-gray-200 dark:border-[#333]">
                                                <button
                                                  onClick={() =>
                                                    openBoothDetails(
                                                      strength.party,
                                                      "battle"
                                                    )
                                                  }
                                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium text-orange-600 dark:text-[#F2700D] hover:bg-gray-100 dark:hover:bg-[#353535]"
                                                >
                                                  {strength.neutral_count}
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : (
                                  <TabLoader message="No booth strength data available for this selection" />
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
