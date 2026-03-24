import { useEffect, useMemo, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "~/components/ui/select";
import { Trophy } from "lucide-react";
import {
  getLokSabhaAnalysis,
  getStateWiseLokSabhas,
  getPartyWiseResultsLokabha,
} from "~/api";

/** ---------------- Loaders (copied style from AssemblyAnalysis) ---------------- */

const ColorfulLoader = ({ size = "default", message = "Loading..." }) => {
  const sizeClasses = {
    small: "w-6 h-6",
    default: "w-12 h-12",
    large: "w-16 h-16",
  };
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <style jsx>{`
        .color-spinner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 4px solid transparent;
          border-top-color: blue;
          animation: spin 1.2s linear infinite, colorChange 4.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes colorChange {
          0% { border-top-color: blue; }
          25% { border-top-color: green; }
          50% { border-top-color: blue; }
          75% { border-top-color: red; }
          100% { border-top-color: orange; }
        }
      `}</style>
      <div className="relative">
        <div className={`${sizeClasses[size]} relative`}>
          <div className="color-spinner"></div>
        </div>
      </div>
      {message ? <div className="text-sm text-gray-600 font-medium">{message}</div> : null}
    </div>
  );
};

const TabLoader = ({ message = "Loading data..." }) => (
  <div className="flex items-center justify-center py-12">
    <ColorfulLoader size="default" message={message} />
  </div>
);

/**
 * Props:
 * - stateId: number (required)
 * - variant?: "inline-select" | "stats-only" | "full" (default: "full")
 * - selectedLokSabhaNo?: number  // controlled selection from parent (header)
 * - onChange?: (lokSabhaNo: number) => void
 */
export default function Loksabha({
  stateId,
  variant = "full",
  selectedLokSabhaNo: controlledNo,
  onChange,
}) {
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;

  const isInline = variant === "inline-select";
  const isStatsOnly = variant === "stats-only";

  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingParty, setIsLoadingParty] = useState(false);
  const [error, setError] = useState("");

  const [lokSabhas, setLokSabhas] = useState([]); // [{ lok_sabha_no, lok_sabha_name }]
  const [uncontrolledNo, setUncontrolledNo] = useState(null);
  const selectedLokSabhaNo = controlledNo ?? uncontrolledNo;

  const [stats, setStats] = useState(null);        // from getLokSabhaAnalysis
  const [partyResults, setPartyResults] = useState(null); // from getPartyWiseResultsLokabha

  const [activeTab, setActiveTab] = useState("voting-pattern");

  // Search state for Lok Sabha dropdown
  const [lokSabhaSearch, setLokSabhaSearch] = useState("");
  const [isLokSabhaDropdownOpen, setIsLokSabhaDropdownOpen] = useState(false);

  const formatNumber = (n) =>
    typeof n === "number" && !Number.isNaN(n) ? n.toLocaleString() : n === 0 ? "0" : "-";

  /** ---------- 1) Fetch LS list on state change (match AssemblyAnalysis flow) ---------- */
  useEffect(() => {
    if (!stateId) return;

    setIsLoadingList(true);
    setError("");
    setLokSabhas([]);
    if (!controlledNo) {
      setUncontrolledNo(null);
      setStats(null);
      setPartyResults(null);
    }

    (async () => {
      try {
        const res = await getStateWiseLokSabhas({ state_id: stateId });

        let list = [];
        if (Array.isArray(res)) {
          if (res.length && Array.isArray(res[0]?.lok_sabhas)) list = res[0].lok_sabhas;
          else list = res;
        } else if (res && Array.isArray(res.lok_sabhas)) {
          list = res.lok_sabhas;
        }

        list = (list || [])
          .filter((it) => it?.lok_sabha_no != null)
          .sort((a, b) =>
            (a.lok_sabha_name || "").localeCompare(b.lok_sabha_name || "")
          );

        setLokSabhas(list);

        // auto-select first when uncontrolled
        if (!controlledNo && list.length) {
          const firstNo = Number(list[0].lok_sabha_no);
          setUncontrolledNo(firstNo);
          onChange?.(firstNo);
        }
      } catch (e) {
        console.error("getStateWiseLokSabhas failed", e);
        setError("Failed to load Lok Sabha list.");
      } finally {
        setIsLoadingList(false);
      }
    })();
  }, [stateId, controlledNo, onChange]);

  /** ---------- 2) Fetch LS analysis when a LS is selected (skip in inline-select) ---------- */
  useEffect(() => {
    if (!stateId || !selectedLokSabhaNo || isInline) return;

    setIsLoadingStats(true);
    setError("");
    setStats(null);

    (async () => {
      try {
        const res = await getLokSabhaAnalysis({
          election_id: "TNGELS2024",
          state_id: stateId,
          lok_sabha_no: Number(selectedLokSabhaNo),


        });
        const payload = Array.isArray(res) ? res[0] : res;
        setStats(payload || null);

      } catch (e) {
        console.error("getLokSabhaAnalysis failed", e);

      } finally {
        setIsLoadingStats(false);
      }
    })();
  }, [stateId, selectedLokSabhaNo, isInline]);

  /** ---------- 3) Fetch Party-wise results (drives tables) ---------- */
  useEffect(() => {
    if (!stateId || !selectedLokSabhaNo) return;

    setIsLoadingParty(true);
    setPartyResults(null);

    (async () => {
      try {
        const res = await getPartyWiseResultsLokabha({
          state_id: stateId,
          lok_sabha_no: Number(selectedLokSabhaNo),
          election_type: "loksabha_elections",
          election_year: 2024,
        });
        setPartyResults(res || null);

      } catch (e) {
        console.error("getPartyWiseResultsLokabha failed", e);

      } finally {
        setIsLoadingParty(false);
      }
    })();
  }, [stateId, selectedLokSabhaNo]);

  const sortedPartyRows = useMemo(() => {
    const arr = partyResults?.party_results || [];
    return [...arr].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [partyResults]);

  // Filter Lok Sabhas based on search
  const filteredLokSabhas = lokSabhas.filter((ls) => {
    const searchLower = lokSabhaSearch.toLowerCase();
    const name = ls.lok_sabha_name?.toLowerCase() || "";
    const number = ls.lok_sabha_no?.toString() || "";
    return name.includes(searchLower) || number.includes(searchLower);
  });

  // Close Lok Sabha dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.loksabha-dropdown-container')) {
        setIsLokSabhaDropdownOpen(false);
        setLokSabhaSearch("");
      }
    };

    if (isLokSabhaDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isLokSabhaDropdownOpen]);

  /** ---------- RENDER ---------- */

  // Header-only dropdown (no stats/tabs) — matches how you render Loksabha in header
  if (isInline) {
    const selectedLokSabha = lokSabhas.find(ls => ls.lok_sabha_no === selectedLokSabhaNo);

    return (
      <div className="relative loksabha-dropdown-container">
        <div className="relative">
          <input
            type="text"
            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder={selectedLokSabha ? selectedLokSabha.lok_sabha_name : (isLoadingList ? "Loading..." : "Search Lok Sabha...")}
            value={lokSabhaSearch}
            onChange={(e) => {
              setLokSabhaSearch(e.target.value);
              setIsLokSabhaDropdownOpen(true);
            }}
            onFocus={() => {
              setIsLokSabhaDropdownOpen(true);
              setLokSabhaSearch("");
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!isLokSabhaDropdownOpen) {
                  setLokSabhaSearch("");
                }
              }, 200);
            }}
            disabled={isLoadingList || (!lokSabhas.length && !controlledNo)}
          />

          {/* Clear button */}
          {lokSabhaSearch && !isLoadingList && (
            <button
              type="button"
              onClick={() => {
                setLokSabhaSearch("");
                setIsLokSabhaDropdownOpen(true);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {isLoadingList && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              Loading…
            </div>
          )}
        </div>

        {/* Dropdown list */}
        {isLokSabhaDropdownOpen && !isLoadingList && (
          <>
            {filteredLokSabhas.length > 0 ? (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredLokSabhas.map((ls) => (
                  <div
                    key={ls.lok_sabha_no}
                    className={`px-3 py-2 cursor-pointer hover:bg-cyan-50 ${selectedLokSabhaNo === ls.lok_sabha_no
                        ? "bg-cyan-100 font-semibold"
                        : ""
                      }`}
                    onClick={() => {
                      const num = Number(ls.lok_sabha_no);
                      if (controlledNo == null) setUncontrolledNo(num);
                      onChange?.(num);
                      setLokSabhaSearch("");
                      setIsLokSabhaDropdownOpen(false);
                    }}
                  >
                    <div className="text-sm text-gray-900">
                      {ls.lok_sabha_name}
                    </div>
                  </div>
                ))}
              </div>
            ) : lokSabhaSearch ? (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                <div className="text-sm text-gray-500 text-center">No Lok Sabha found</div>
              </div>
            ) : null}
          </>
        )}

        {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
      </div>
    );
  }

  return (
    <>
      {/* --- Stats Cards (exact visual rhythm as AssemblyAnalysis: blue border-left, grid) --- */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="text-md font-medium text-gray-600 text-center">Total Electors</div>
          <div className="text-2xl font-bold text-cyan-500  text-center pt-2">
            {formatNumber(stats?.total_electors)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="text-md font-medium text-gray-600 text-center">Total Polled Votes</div>
          <div className="text-2xl font-bold text-cyan-500  text-center pt-2">
            {formatNumber(stats?.total_votes)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="text-md font-medium text-gray-600 mb-2 text-center">Total Valid Votes</div>
          <div className="text-2xl font-bold text-cyan-500  text-center">
            {formatNumber(stats?.total_valid_votes)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="text-md font-medium text-gray-600 mb-2 text-center">Rejected Votes</div>
          <div className="text-2xl font-bold text-cyan-500 text-center">
            {formatNumber(stats?.rejected_votes)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-md">
          <div className="text-md font-medium text-gray-800  mb-2 text-center">NOTA Votes</div>
          <div className="text-2xl font-bold text-cyan-500 text-center">
            {formatNumber(stats?.nota_votes)}
          </div>
        </div>
      </div>

      {/* stop here if stats-only */}
      {isStatsOnly ? null : (
        <div className="bg-white rounded-sm shadow-sm overflow-hidden mb-6">
          {/* --- Tabs (same as Assembly) --- */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab("voting-pattern")}
                className={`flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${activeTab === "voting-pattern"
                  ? "text-cyan-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Loksabha Analysis
                {activeTab === "voting-pattern" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("winning-status")}
                className={`flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 relative ${activeTab === "winning-status"
                  ? " text-cyan-600"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Winning Status
                {activeTab === "winning-status" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600"></span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* --- Voting Pattern --- */}
            {activeTab === "voting-pattern" && (
              <>
                {(isLoadingParty && !partyResults) ? (
                  <TabLoader message="Loading party-wise results..." />
                ) : !partyResults?.party_results?.length ? (
                  <TabLoader message="No data available for this loksabha." />
                ) : (
                  <div className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] p-3 sm:p-4">
                    {/* Flex column so table scrolls and Victory Margin always visible */}
                    <div className="flex flex-col max-h-[calc(100vh-10rem)] min-h-[280px]">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex-shrink-0 mb-3">
                        {lokSabhas.find(ls => ls.lok_sabha_no === selectedLokSabhaNo)?.lok_sabha_name || "Lok Sabha"}
                      </h3>

                      {/* Table: scrollable when many rows; header sticky */}
                      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-t-lg border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d]">
                        <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0">
                          <table className="min-w-full">
                            <thead className="sticky top-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1f1f1f] dark:to-[#1a1a1a] border-b border-gray-200 dark:border-[#3d3d3d]">
                              <tr>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-[#8e8ea0] uppercase tracking-wider" style={{ minWidth: "44px" }}>Rank</th>
                                <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-[#8e8ea0] uppercase tracking-wider" style={{ minWidth: "90px" }}>Party</th>
                                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 dark:text-[#8e8ea0] uppercase tracking-wider" style={{ minWidth: "72px" }}>Votes</th>
                                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 dark:text-[#8e8ea0] uppercase tracking-wider" style={{ minWidth: "90px" }}>Share</th>
                                <th className="px-2 py-2 text-right text-xs font-semibold text-gray-600 dark:text-[#8e8ea0] uppercase tracking-wider" style={{ minWidth: "100px" }}>Diff</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                              {sortedPartyRows.map((p, index) => {
                                const isWinner = index === 0;
                                const voteShareDiff = p.vote_share_diff_pct;
                                const voteSharePct = typeof p.vote_share_pct === "number" ? p.vote_share_pct : parseFloat(p.vote_share_pct) || 0;

                                return (
                                  <tr
                                    key={`${p.party}-${index}`}
                                    className={isWinner
                                      ? "bg-cyan-500 dark:bg-[#0EA5E9] text-white"
                                      : "bg-white dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#353535] transition-colors duration-150"
                                    }
                                  >
                                    <td className={`px-2 py-1.5 whitespace-nowrap text-xs ${isWinner ? "text-white font-semibold" : "text-gray-900 dark:text-[#ececf1] font-semibold"}`} style={{ minWidth: "44px" }}>
                                      {index + 1}
                                    </td>
                                    <td className={`px-2 py-1.5 whitespace-nowrap text-xs ${isWinner ? "text-white font-semibold" : "text-gray-900 dark:text-[#ececf1] font-semibold"}`} style={{ minWidth: "90px" }}>
                                      <span className="flex items-center gap-1">
                                        {p.party}
                                        {isWinner && <Trophy size={14} className="text-yellow-300 flex-shrink-0" />}
                                      </span>
                                    </td>
                                    <td className={`px-2 py-1.5 whitespace-nowrap text-right text-xs font-semibold ${isWinner ? "text-white" : "text-gray-900 dark:text-[#ececf1]"}`} style={{ minWidth: "72px" }}>
                                      {formatNumber(p.votes)}
                                    </td>
                                    <td className={`px-2 py-1.5 whitespace-nowrap text-right text-xs ${isWinner ? "text-white" : "text-gray-900 dark:text-[#ececf1]"}`} style={{ minWidth: "90px" }}>
                                      <div className="flex items-center justify-end gap-1">
                                        <span className="font-semibold">{p.vote_share_pct ?? "-"}%</span>
                                        {voteSharePct && (
                                          <div className="w-10 bg-gray-200 dark:bg-[#3d3d3d] h-1.5 rounded-full overflow-hidden flex-shrink-0">
                                            <div
                                              className={`h-1.5 rounded-full ${isWinner ? "bg-white dark:bg-orange-500" : "bg-cyan-500 dark:bg-[#F2700D]"}`}
                                              style={{ width: `${Math.min(voteSharePct, 100)}%` }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className={`px-2 py-1.5 whitespace-nowrap text-right text-xs ${isWinner ? "text-white" : "text-gray-900 dark:text-[#ececf1]"}`} style={{ minWidth: "100px" }}>
                                      {voteShareDiff && voteShareDiff !== "-" ? (
                                        <div
                                          className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded ${parseFloat(voteShareDiff) > 0
                                            ? isWinner ? "bg-white/20 text-white" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                            : parseFloat(voteShareDiff) < 0
                                              ? isWinner ? "bg-red-200 text-red-800" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                              : isWinner ? "bg-white/10 text-white" : "bg-gray-100 text-gray-600 dark:bg-[#1f1f1f] dark:text-[#8e8ea0]"
                                            }`}
                                        >
                                          {parseFloat(voteShareDiff) > 0 ? "↑" : parseFloat(voteShareDiff) < 0 ? "↓" : "→"}
                                          {voteShareDiff}%
                                        </div>
                                      ) : (
                                        <span className="text-[10px] text-gray-400">-</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Victory Margin bar - always visible below table, never scrolled away */}
                      <div className="flex-shrink-0 bg-cyan-500 dark:bg-[#F2700D] px-3 py-2 rounded-b-lg border border-t-0 border-gray-200 dark:border-[#3d3d3d]">
                        <div className="flex items-center justify-between text-white">
                          <span className="text-xs font-semibold">Victory Margin</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] text-white/80">Votes</div>
                              <div className="text-sm font-bold leading-tight">
                                {formatNumber(partyResults?.margin_votes)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-white/80">%</div>
                              <div className="text-sm font-bold leading-tight">
                                {partyResults?.margin_pct ?? "-"}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* --- Winning Status --- */}
            {activeTab === "winning-status" && (
              <>
                {(isLoadingParty && !partyResults) ? (
                  <TabLoader message="Loading winning status..." />
                ) : !partyResults ? (
                  <TabLoader message="No data available for this loksabha." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Winner
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Runner
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            3rd Place
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            4th Place
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            5th Place
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                            {partyResults?.election_year ?? "-"}
                          </td>

                          {/* winner */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center bg-green-100 font-semibold">
                            {partyResults?.winner?.party ? (
                              <div>
                                <div className="font-semibold">{partyResults.winner.party}</div>
                                <div className="text-xs text-blue-600 mt-4 flex flex-col">
                                  <span>VOTES: {formatNumber(partyResults.winner.votes)}</span>
                                  <span className="mt-2">VOTE SHARE: {partyResults.winner.vote_share_pct ?? "-"}%</span>
                                </div>
                              </div>
                            ) : ("-")}
                          </td>

                          {/* runner up */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {partyResults?.runner_up?.party ? (
                              <div>
                                <div className="font-semibold">{partyResults.runner_up.party}</div>
                                <div className="text-xs text-blue-600 mt-4 flex flex-col">
                                  <span>VOTES: {formatNumber(partyResults.runner_up.votes)}</span>
                                  <span className="mt-2">VOTE SHARE: {partyResults.runner_up.vote_share_pct ?? "-"}%</span>
                                </div>
                              </div>
                            ) : ("-")}
                          </td>

                          {/* third */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {partyResults?.third?.party ? (
                              <div>
                                <div className="font-semibold">{partyResults.third.party}</div>
                                <div className="text-xs text-blue-600 mt-4 flex flex-col">
                                  <span>VOTES: {formatNumber(partyResults.third.votes)}</span>
                                  <span className="mt-2">VOTE SHARE: {partyResults.third.vote_share_pct ?? "-"}%</span>
                                </div>
                              </div>
                            ) : ("-")}
                          </td>

                          {/* fourth */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {partyResults?.fourth?.party ? (
                              <div>
                                <div className="font-semibold">{partyResults.fourth.party}</div>
                                <div className="text-xs text-blue-600 mt-4 flex flex-col">
                                  <span>VOTES: {formatNumber(partyResults.fourth.votes)}</span>
                                  <span className="mt-2">VOTESHARE: {partyResults.fourth.vote_share_pct ?? "-"}%</span>
                                </div>
                              </div>
                            ) : ("-")}
                          </td>

                          {/* fifth */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {partyResults?.fifth?.party ? (
                              <div>
                                <div className="font-semibold">{partyResults.fifth.party}</div>
                                <div className="text-xs text-blue-600 mt-4 flex flex-col">
                                  <span>VOTES: {formatNumber(partyResults.fifth.votes)}</span>
                                  <span className="mt-2">VOTESHARE: {partyResults.fifth.vote_share_pct ?? "-"}%</span>
                                </div>
                              </div>
                            ) : ("-")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {error ? <div className="mt-1 text-sm text-red-600">{error}</div> : null}
    </>
  );
}
