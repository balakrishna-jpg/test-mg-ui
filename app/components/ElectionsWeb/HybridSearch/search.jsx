import { useOutletContext } from "@remix-run/react";
import { useEffect, useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import {
  createNewChat,
  saveSearchHistory,
  getSearchHistory,
  getSearchHistoryMessage,
  deleteChat,
  deleteChatMessage,
  updateSearchHistoryFeedback,
} from "~/api";
import { AlertCircle, X, Trash2 } from "lucide-react";


const API_ENDPOINT = "https://election-ai-search.aadhan-apptest.workers.dev/search";

const SUGGESTED_QUESTIONS = [
  "In which constituencies does AIADMK need to focus to win in next elections",
  "Which seats had multi-cornered fights where top-2 share is less than 70%?",
  "Which Constituencies were decided by <2000 votes?",
  "How many voters are there by age groups constituency wise?",
];

/** Suggested question text -> message_id (GET /history/message/{message_id}) */
const SUGGESTED_QUESTION_IDS = {
  "In which constituencies does AIADMK need to focus to win in next elections": "69ba1265915501f8f9e516a0",
  "Which seats had multi-cornered fights where top-2 share is less than 70%?": "69b9300b915501f8f9e5167e",
  "Which Constituencies were decided by <2000 votes?": "69b938b0915501f8f9e51687",
  "How many voters are there by age groups constituency wise?": "69b92ee2915501f8f9e51677",
};

function getChatTitle(chat) {
  if (chat?.title && chat.title !== "New Chat") return chat.title;
  const messages = chat?.messages || [];
  if (messages.length > 0) {
    const first = messages[0];
    const q = first?.query || "";
    return q.length > 50 ? q.slice(0, 50) + "…" : q || "New chat";
  }
  return chat?.title || "New chat";
}

export default function HybridSearch() {
  const context = useOutletContext();
  const darkMode = context?.darkMode || false;
  const [isDark, setIsDark] = useState(darkMode);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingQuery, setLoadingQuery] = useState("");
  const [error, setError] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [chatIdToDelete, setChatIdToDelete] = useState(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    setIsDark(darkMode);
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [darkMode]);

  const loadChats = useCallback(async () => {
    try {
      const data = await getSearchHistory();
      const list = (data?.chats || []).map((chat) => ({
        ...chat,
        messages: (chat.messages || []).map((m) => ({
          ...m,
          voterAnalyticsRawData: m.raw_data ?? m.voterAnalyticsRawData,
        })),
        // Ensure title is present for headers
        title: chat.title || "New Chat"
      }));
      setChats(list);
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const handleNewChat = async () => {
    try {
      const { chat_id } = await createNewChat();
      setActiveChatId(chat_id);
      setMessages([]);
      setQuery("");
      setError("");
      setChats((prev) => [
        { chat_id, messages: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ...prev,
      ]);
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a question");
      return;
    }

    const currentQuery = query.trim();
    setLoadingQuery(currentQuery);
    setQuery("");
    setLoading(true);
    setError("");

    try {
      let chatId = activeChatId;

      // If no active chat, create one first
      if (!chatId) {
        const res = await createNewChat();
        chatId = res.chat_id;
        setActiveChatId(chatId);
        setChats((prev) => [
          { chat_id: chatId, messages: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ...prev,
        ]);
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery, topK: 5 }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error || `API error: ${response.status}`;
        const suggestion = data?.suggestion || data?.details || data?.message;
        throw new Error(suggestion ? `${errMsg} — ${suggestion}` : errMsg);
      }

      // Worker modes (aligned with worker intent + response shape):
      // - strategy -> strategy_analysis
      // - state_wide_strategy -> strategy_analysis (with fallback formatting)
      // - close_margin / lost_booths -> analysis
      // - winner_improvement -> improvement_strategy
      // - state_wide_wins / state_wide_rank_position / two_party_finish_pattern -> analysis (with fallbacks)
      // - constituency_stats / constituency_winner / constituency_party_total -> answer
      // - redirect_to_strategy -> message/suggestion
      // - voter_analytics -> answer (optional total_count, showing_first)
      // - voter_search -> answer (sources, matched_documents)
      // - Advanced analytics (all return analysis): seat_diagnosis_close, seat_diagnosis_multicornered,
      //   seat_diagnosis_vote_split, booth_action_top_close, booth_action_high_electors_close,
      //   booth_action_strongholds, booth_action_weak_convertible, resource_minimum_flip,
      //   resource_max_impact, efficiency_booth_flip_minimum_gain, constituency_competitiveness,
      //   constituency_fragmentation, constituency_turnout_comparison, booth_defend_attack,
      //   booth_strongholds, booth_weak_pockets, efficiency_votes_to_flip, efficiency_booth_flip,
      //   efficiency_uniform_gain, efficiency_turnout_impact, priority_swing_impact,
      //   opposition_vote_split_loss, opposition_transfer_inference, opposition_b_team,
      //   opposition_collapse_sensitivity
      // - Success with no data: many modes can return 200 with only message (e.g. "No constituencies found")
      // - else (RAG, etc.) -> answer
      let answerText = "No answer received";
      let voterAnalyticsRawData = null; // for voter_analytics: show raw_data table
      if (data.mode === "strategy") {
        answerText = data.strategy_analysis || "No strategy analysis received";
      } else if (data.mode === "state_wide_strategy") {
        // Handle state-wide strategy with fallback formatting
        if (data.strategy_analysis && data.strategy_analysis.trim()) {
          answerText = data.strategy_analysis;
        } else if (data.summary && data.detailed_data) {
          // Fallback: Format summary and detailed data if AI analysis is empty
          const summary = data.summary;
          const party = data.target_party || "Party";
          const topTargets = data.detailed_data?.top_target_constituencies || [];

          let formatted = `**Strategy Analysis for ${party}**\n\n`;
          formatted += `**Summary:**\n`;
          formatted += `- Total constituencies: ${summary.total_constituencies}\n`;
          formatted += `- Constituencies won: ${summary.constituencies_won}\n`;
          if (summary.runner_up_count !== undefined) {
            formatted += `- Runner-up finishes: ${summary.runner_up_count}\n`;
          }
          if (summary.third_place_count !== undefined) {
            formatted += `- Third place finishes: ${summary.third_place_count}\n`;
          }
          if (summary.party_summary) {
            formatted += `- Total votes: ${summary.party_summary.total_votes?.toLocaleString() || 'N/A'}\n`;
            formatted += `- Constituencies contested: ${summary.party_summary.constituencies_contested || 'N/A'}\n`;
          }

          if (topTargets.length > 0) {
            formatted += `\n**Top Target Constituencies (Smallest Gaps):**\n\n`;
            topTargets.slice(0, 15).forEach((c, idx) => {
              formatted += `${idx + 1}. **${c.constituency_name}** (ID: ${c.constituency_id})\n`;
              formatted += `   - ${party} votes: ${c.votes?.toLocaleString() || 'N/A'}\n`;
              formatted += `   - Winner: ${c.winner_party} (${c.winner_votes?.toLocaleString() || 'N/A'} votes)\n`;
              formatted += `   - Gap to close: ${c.gap_to_winner?.toLocaleString() || 'N/A'} votes`;
              if (c.gap_percentage !== undefined) {
                formatted += ` (${c.gap_percentage.toFixed(2)}%)\n`;
              } else {
                formatted += `\n`;
              }
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No state-wide strategy analysis received";
        }
      } else if (data.mode === "close_margin") {
        answerText =
          data.analysis || data.message || "No close margin analysis received";
      } else if (data.mode === "lost_booths") {
        answerText =
          data.analysis || data.message || "No lost booths analysis received";
      } else if (data.mode === "winner_improvement") {
        if (data.improvement_strategy && data.improvement_strategy.trim()) {
          answerText = data.improvement_strategy;
        } else if (data.summary && data.detailed_data) {
          const summary = data.summary;
          const party = data.target_party || "Party";
          const constituency = data.constituency || "Unknown";

          let formatted = `**Improvement Strategy for ${party} in ${constituency}**\n\n`;

          if (summary.overall_results && summary.overall_results.length > 0) {
            formatted += `**Current Performance:**\n`;
            summary.overall_results.slice(0, 3).forEach(r => {
              formatted += `- ${r.party}: ${r.total_votes} votes\n`;
            });
            formatted += `\n`;
          }

          if (summary.close_margin_summary && summary.close_margin_summary.count > 0) {
            formatted += `**Priority Targets - Close Margin Losses (< ${summary.close_margin_summary.threshold} votes):**\n`;
            formatted += `Found ${summary.close_margin_summary.count} booths needing only ${summary.close_margin_summary.total_votes_needed} total votes to flip.\n\n`;

            if (data.detailed_data.close_margin_booths) {
              data.detailed_data.close_margin_booths.slice(0, 5).forEach((b, idx) => {
                formatted += `${idx + 1}. Booth ${b.booth_id} - Lost to ${b.winner_party} by ${b.vote_gap} votes (${party}: ${b.party_votes}, Winner: ${b.winner_votes})\n`;
              });
              formatted += `\n`;
            }
          }

          if (data.detailed_data.strong_booths && data.detailed_data.strong_booths.length > 0) {
            formatted += `**Strong Booths to Protect:**\n`;
            data.detailed_data.strong_booths.slice(0, 5).forEach((b, idx) => {
              formatted += `${idx + 1}. Booth ${b.booth_id} - Leading ${b.second_party} by ${b.lead_margin} votes\n`;
            });
            formatted += `\n`;
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No winner improvement strategy received";
        }
      } else if (data.mode === "state_wide_wins") {
        // Handle state-wide wins with fallback formatting
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.summary && data.constituencies_won && data.constituencies_won.length > 0) {
          // Fallback: Format summary data if AI analysis is empty
          const summary = data.summary;
          const party = data.target_party || "Party";
          const constituencies = data.constituencies_won || [];

          let formatted = `**Summary:**\n${party} won in **${summary.constituencies_won} out of ${summary.total_constituencies}** assembly constituencies (${summary.win_percentage}).\n\n`;

          formatted += `**Complete List of Constituencies Won by ${party}:**\n\n`;
          constituencies.forEach((c, idx) => {
            const voteShare = c.total_votes > 0 ? ((c.votes / c.total_votes) * 100).toFixed(2) : "0.00";
            formatted += `${idx + 1}. ${c.constituency_name} (ID: ${c.constituency_id}) - ${party}: ${c.votes} votes (${voteShare}%)\n`;
          });

          if (constituencies.length >= 5) {
            formatted += `\n**Top 5 Strongest Wins (by vote count):**\n`;
            constituencies.slice(0, 5).forEach((c, idx) => {
              const voteShare = c.total_votes > 0 ? ((c.votes / c.total_votes) * 100).toFixed(2) : "0.00";
              formatted += `${idx + 1}. ${c.constituency_name} - ${c.votes} votes (${voteShare}%)\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No state-wide wins analysis received";
        }
      } else if (data.mode === "state_wide_rank_position") {
        // Handle state-wide rank position with fallback formatting
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.summary) {
          // Fallback: Format summary data if AI analysis is empty
          const summary = data.summary;
          const party = data.target_party || "Party";
          const rankLabel = data.rank_label || "this position";

          let formatted = `**Summary:**\n${party} finished in ${rankLabel} in **${summary.rank_finishes} out of ${summary.total_constituencies}** assembly constituencies (${summary.rank_percentage}).\n`;

          if (summary.first_place_finishes !== undefined) {
            formatted += `${party} won ${summary.first_place_finishes} constituencies.\n`;
          }

          if (summary.breakdown_by_winner) {
            formatted += `\n**Breakdown by Winner Party:**\n${party} finished ${rankLabel} to:\n`;
            Object.entries(summary.breakdown_by_winner).forEach(([winnerParty, count]) => {
              formatted += `- ${winnerParty} in ${count} constituencies\n`;
            });
          }

          if (data.top_10_closest && data.top_10_closest.length > 0) {
            formatted += `\n**Top 10 Closest ${rankLabel} Finishes:**\n`;
            data.top_10_closest.forEach((constituency, idx) => {
              formatted += `${idx + 1}. ${constituency.constituency_name} (ID: ${constituency.constituency_id}) - ${party}: ${constituency.votes} votes, Winner: ${constituency.winner_party} (${constituency.winner_votes} votes), Gap: ${constituency.gap_to_winner} votes\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No state-wide rank position analysis received";
        }
      } else if (data.mode === "two_party_finish_pattern") {
        // Handle two-party finish pattern with fallback formatting
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.summary) {
          // Fallback: Format summary data if AI analysis is empty
          const summary = data.summary;
          const winner = data.winner_party || "Winner";
          const runnerUp = data.runner_up_party || "Runner-up";
          const runnerUpLabel = data.runner_up_label || "2nd";

          let formatted = `**Summary:**\n${winner} won and ${runnerUp} finished ${runnerUpLabel} in **${summary.matching_constituencies} out of ${summary.total_constituencies}** assembly constituencies (${summary.match_percentage}).\n`;

          formatted += `\n**Statistics:**\n`;
          formatted += `- Average winning margin: ${summary.average_margin} votes\n`;
          formatted += `- Smallest margin: ${summary.smallest_margin} votes\n`;
          formatted += `- Largest margin: ${summary.largest_margin} votes\n`;

          if (data.top_5_closest && data.top_5_closest.length > 0) {
            formatted += `\n**Top 5 Closest Contests:**\n`;
            data.top_5_closest.forEach((constituency, idx) => {
              formatted += `${idx + 1}. ${constituency.constituency_name} (ID: ${constituency.constituency_id}) - ${winner}: ${constituency.winner_votes} votes, ${runnerUp}: ${constituency.runner_up_votes} votes, Margin: ${constituency.margin} votes\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No two-party finish pattern analysis received";
        }
      } else if (data.mode === "seat_diagnosis_vote_split") {
        // Handle vote split analysis with fallback formatting
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.data && data.data.split_benefit && data.data.split_benefit.length > 0) {
          // Fallback: Format data if AI analysis is empty
          const splitData = data.data;
          const constituencies = splitData.split_benefit || [];
          const totalCount = splitData.total_count || 0;

          let formatted = `**Vote Split Analysis**\n\n`;
          formatted += `**Summary:**\n`;
          formatted += `Found ${totalCount} constituencies where opposition vote split exceeded the winner's margin, meaning the winner benefited from divided opposition.\n\n`;

          formatted += `**Top ${Math.min(20, constituencies.length)} Cases Where Vote Split Helped Winner:**\n\n`;
          constituencies.slice(0, 20).forEach((c, idx) => {
            formatted += `${idx + 1}. **${c.constituency_name}** (ID: ${c.constituency_id})\n`;
            formatted += `   - Winner: ${c.winner} (${c.winner_votes} votes, ${c.winner_share}%)\n`;
            formatted += `   - Runner-up: ${c.runner_up} (${c.runner_up_votes} votes, ${c.runner_up_share}%)\n`;
            formatted += `   - Other parties combined: ${c.other_votes} votes (${c.other_share}%)\n`;
            formatted += `   - Winning margin: ${c.margin} votes\n`;
            formatted += `   - **Vote split (${c.other_votes} votes) > margin (${c.margin} votes)** ⭐\n\n`;
          });

          formatted += `**Strategic Implication:**\n`;
          formatted += `In these constituencies, if the opposition parties had consolidated their votes, they could have potentially defeated the winner. The winner benefited from vote fragmentation among opposition parties.\n`;

          answerText = formatted;
        } else {
          answerText = data.message || "No vote split analysis data received";
        }
      } else if (data.mode === "seat_diagnosis_close" || data.mode === "seat_diagnosis_multicornered") {
        // Handle seat diagnosis modes with fallback formatting
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.data) {
          // Fallback: Format data if AI analysis is empty
          const diagnosisData = data.data;
          const constituencies = diagnosisData.close_constituencies || diagnosisData.multi_cornered || [];
          const totalCount = diagnosisData.total_count || diagnosisData.count || 0;
          const threshold = diagnosisData.threshold_votes || diagnosisData.threshold_percent || "N/A";

          let formatted = `**${data.mode === "seat_diagnosis_close" ? "Close Constituencies" : "Multi-Cornered Fights"} Analysis**\n\n`;
          formatted += `**Summary:**\n`;
          formatted += `Found ${totalCount} constituencies matching the criteria.\n\n`;

          if (constituencies.length > 0) {
            formatted += `**Top ${Math.min(20, constituencies.length)} Constituencies:**\n\n`;
            constituencies.slice(0, 20).forEach((c, idx) => {
              formatted += `${idx + 1}. **${c.constituency_name}** (ID: ${c.constituency_id})\n`;
              if (c.winner && c.runner_up) {
                formatted += `   - Winner: ${c.winner} (${c.winner_votes} votes)\n`;
                formatted += `   - Runner-up: ${c.runner_up} (${c.runner_up_votes} votes)\n`;
                formatted += `   - Margin: ${c.margin} votes\n`;
              }
              if (c.margin_percent !== undefined) {
                formatted += `   - Margin: ${c.margin_percent}%\n`;
              }
              formatted += `\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || `No ${data.mode} analysis data received`;
        }
      } else if (data.mode === "redirect_to_strategy") {
        const base =
          data.message || "Use strategy analysis instead for this party.";
        const suggestion = data.suggestion
          ? `\n\nSuggestion: ${data.suggestion}`
          : "";
        answerText = base + suggestion;
      } else if (
        data.mode === "constituency_stats" ||
        data.mode === "constituency_winner" ||
        data.mode === "constituency_party_total"
      ) {
        answerText = data.answer || "No answer received";
      } else if (data.mode === "voter_analytics") {
        answerText = data.answer || "No voter analytics answer received";
        if (data.total_count != null && data.showing_first != null && data.showing_first < data.total_count) {
          answerText += `\n\n*Showing first ${data.showing_first} of ${data.total_count.toLocaleString()}.*`;
        }
        if (data.raw_data && Array.isArray(data.raw_data) && data.raw_data.length > 0) {
          voterAnalyticsRawData = data.raw_data;
        }
      } else if (data.mode === "voter_search") {
        answerText = data.answer || "No voter search result received";
      } else if (data.analysis && String(data.analysis).trim()) {
        // All advanced analytics modes return analysis (see comment block above)
        answerText = data.analysis;
      } else {
        // Default fallback for RAG, empty-result success responses, and other modes
        answerText = data.answer || data.message || data.error || "No answer received";
      }

      // Pick up structured table data — reuse the voterAnalyticsRawData table renderer.
      // Priority order: data.data (TOP_K/analytics), data.detailed_data (strategy),
      // top-level arrays (state_wide_wins / rank_position / two_party)
      if (!voterAnalyticsRawData) {
        const tableRows =
          // analytics direct results
          (data.data?.top_booths) ||
          (data.data?.bottom_booths) ||
          (data.data?.results) ||
          // strategy modes: top runner-up targets + 3rd place targets combined
          (data.detailed_data?.top_target_constituencies?.length
            ? [
              ...(data.detailed_data.top_target_constituencies || []),
              ...(data.detailed_data.third_place_constituencies || []),
            ]
            : null) ||
          // state_wide_wins
          (data.constituencies_won) ||
          // state_wide_rank_position
          (data.all_rank_constituencies) ||
          // two_party_finish_pattern
          (data.all_constituencies) ||
          null;
        if (Array.isArray(tableRows) && tableRows.length > 0) {
          voterAnalyticsRawData = tableRows;
        }
      }

      // Save to backend (include raw_data for voter_analytics so table persists after refresh)
      const saved = await saveSearchHistory({
        chat_id: chatId,
        query: currentQuery,
        answer: answerText,
        ...(voterAnalyticsRawData && voterAnalyticsRawData.length > 0 ? { raw_data: voterAnalyticsRawData } : {}),
      });

      const newMsg = {
        id: saved.message_id,
        query: saved.query,
        answer: saved.answer,
        created_at: saved.created_at,
        feedback: saved.feedback ?? null,
        ...(voterAnalyticsRawData && voterAnalyticsRawData.length > 0 ? { voterAnalyticsRawData } : {}),
      };

      setMessages((prev) => [...prev, newMsg]);
      setLoadingQuery("");

      // Update chat in list (so title reflects first message)
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.chat_id === chatId);
        if (idx === -1) return prev;
        const copy = [...prev];
        const chat = { ...copy[idx], messages: [...(copy[idx].messages || []), newMsg] };
        // If it was a new chat, update the title from the first message
        if (!chat.title || chat.title === "New Chat") {
          chat.title = getChatTitle(chat);
        }
        copy[idx] = chat;
        return copy;
      });
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Failed to get answer. Please try again.");
      setLoadingQuery("");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat) => {
    setActiveChatId(chat.chat_id);
    const msgs = chat?.messages || [];
    setMessages(msgs);
    setQuery("");
    setError("");

    // If chat has no messages in local state, fetch from API
    if (msgs.length === 0) {
      setIsHistoryLoading(true);
      try {
        const data = await getSearchHistory({ chat_id: chat.chat_id });
        const list = (data?.messages || []).map((m) => ({
          ...m,
          voterAnalyticsRawData: m.raw_data ?? m.voterAnalyticsRawData,
        }));
        setMessages(list);
        setChats((prev) =>
          prev.map((c) =>
            c.chat_id === chat.chat_id ? { ...c, messages: list } : c
          )
        );
      } catch (err) {
        console.error("Failed to load chat:", err);
      } finally {
        setIsHistoryLoading(false);
      }
    }
  };

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    setChatIdToDelete(chatId);
  };

  const confirmDeleteChat = async () => {
    if (!chatIdToDelete) return;
    try {
      await deleteChat(chatIdToDelete);
      setChats((prev) => prev.filter((c) => c.chat_id !== chatIdToDelete));
      if (activeChatId === chatIdToDelete) {
        setActiveChatId(null);
        setMessages([]);
        setQuery("");
      }
      setChatIdToDelete(null);
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleDeleteMessage = async (e, msgId) => {
    e.stopPropagation();
    if (!activeChatId) return;
    try {
      await deleteChatMessage(activeChatId, msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleFeedback = async (msgId, feedback) => {
    if (!activeChatId) return;
    try {
      await updateSearchHistoryFeedback(activeChatId, msgId, feedback);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedback } : m))
      );
      setChats((prev) =>
        prev.map((c) =>
          c.chat_id === activeChatId
            ? {
              ...c,
              messages: (c.messages || []).map((m) =>
                m.id === msgId ? { ...m, feedback } : m
              ),
            }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to save feedback:", err);
    }
  };

  const handleDownload = (data, queryText) => {
    if (!data || !data.length) return;

    // Build headers from the first object
    const headers = Object.keys(data[0]);

    // Build CSV content
    const csvRows = [
      headers.join(","), // header row
      ...data.map(row =>
        headers.map(header => {
          const val = row[header] ?? "";
          const escaped = String(val).replace(/"/g, '""'); // escape double quotes
          return `"${escaped}"`; // wrap in quotes to handle commas
        }).join(",")
      )
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create hidden link and trigger download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `${queryText?.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data.csv` || "election_data.csv";
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSuggestedQuestion = async (question) => {
    if (!question.trim() || loading) return;

    const currentQuery = question.trim();
    setLoadingQuery(currentQuery);
    setQuery("");
    setLoading(true);
    setError("");

    try {
      let chatId = activeChatId;

      if (!chatId) {
        const res = await createNewChat();
        chatId = res.chat_id;
        setActiveChatId(chatId);
        setChats((prev) => [
          { chat_id: chatId, messages: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          ...prev,
        ]);
      }

      const messageId = SUGGESTED_QUESTION_IDS[currentQuery];
      if (messageId) {
        const message = await getSearchHistoryMessage(messageId);
        const answerText = message?.answer ?? message?.content ?? "No answer received";
        const voterAnalyticsRawData = message?.raw_data != null && Array.isArray(message.raw_data) ? message.raw_data : null;
        const saved = await saveSearchHistory({
          chat_id: chatId,
          query: currentQuery,
          answer: answerText,
          ...(voterAnalyticsRawData && voterAnalyticsRawData.length > 0 ? { raw_data: voterAnalyticsRawData } : {}),
        });
        const newMsg = {
          id: saved.message_id,
          query: saved.query,
          answer: saved.answer,
          created_at: saved.created_at,
          feedback: saved.feedback ?? null,
          ...(voterAnalyticsRawData && voterAnalyticsRawData.length > 0 ? { voterAnalyticsRawData } : {}),
        };
        setMessages((prev) => [...prev, newMsg]);
        setLoadingQuery("");
        setChats((prev) => {
          const idx = prev.findIndex((c) => c.chat_id === chatId);
          if (idx === -1) return prev;
          const copy = [...prev];
          const chat = { ...copy[idx], messages: [...(copy[idx].messages || []), newMsg] };
          // If it was a new chat, update title
          if (!chat.title || chat.title === "New Chat") {
            chat.title = getChatTitle(chat);
          }
          copy[idx] = chat;
          return copy;
        });
        return;
      }

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery, topK: 5 }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = data?.error || `API error: ${response.status}`;
        const suggestion = data?.suggestion || data?.details || data?.message;
        throw new Error(suggestion ? `${errMsg} — ${suggestion}` : errMsg);
      }

      let answerText = "No answer received";
      let voterAnalyticsRawData = null;

      if (data.mode === "strategy") {
        answerText = data.strategy_analysis || "No strategy analysis received";
      } else if (data.mode === "state_wide_strategy") {
        if (data.strategy_analysis && data.strategy_analysis.trim()) {
          answerText = data.strategy_analysis;
        } else if (data.summary && data.detailed_data) {
          const summary = data.summary;
          const party = data.target_party || "Party";
          const topTargets = data.detailed_data?.top_target_constituencies || [];

          let formatted = `**Strategy Analysis for ${party}**\n\n`;
          formatted += `**Summary:**\n`;
          formatted += `- Total constituencies: ${summary.total_constituencies}\n`;
          formatted += `- Constituencies won: ${summary.constituencies_won}\n`;
          if (summary.runner_up_count !== undefined) {
            formatted += `- Runner-up finishes: ${summary.runner_up_count}\n`;
          }
          if (summary.third_place_count !== undefined) {
            formatted += `- Third place finishes: ${summary.third_place_count}\n`;
          }
          if (summary.party_summary) {
            formatted += `- Total votes: ${summary.party_summary.total_votes?.toLocaleString() || 'N/A'}\n`;
            formatted += `- Constituencies contested: ${summary.party_summary.constituencies_contested || 'N/A'}\n`;
          }

          if (topTargets.length > 0) {
            formatted += `\n**Top Target Constituencies (Smallest Gaps):**\n\n`;
            topTargets.slice(0, 15).forEach((c, idx) => {
              formatted += `${idx + 1}. **${c.constituency_name}** (ID: ${c.constituency_id})\n`;
              formatted += `   - ${party} votes: ${c.votes?.toLocaleString() || 'N/A'}\n`;
              formatted += `   - Winner: ${c.winner_party} (${c.winner_votes?.toLocaleString() || 'N/A'} votes)\n`;
              formatted += `   - Gap to close: ${c.gap_to_winner?.toLocaleString() || 'N/A'} votes`;
              if (c.gap_percentage !== undefined) {
                formatted += ` (${c.gap_percentage.toFixed(2)}%)\n`;
              } else {
                formatted += `\n`;
              }
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No state-wide strategy analysis received";
        }
      } else if (data.mode === "close_margin") {
        answerText = data.analysis || data.message || "No close margin analysis received";
      } else if (data.mode === "lost_booths") {
        answerText = data.analysis || data.message || "No lost booths analysis received";
      } else if (data.mode === "winner_improvement") {
        if (data.improvement_strategy && data.improvement_strategy.trim()) {
          answerText = data.improvement_strategy;
        } else if (data.summary && data.detailed_data) {
          const summary = data.summary;
          const party = data.target_party || "Party";
          const constituency = data.constituency || "Unknown";

          let formatted = `**Improvement Strategy for ${party} in ${constituency}**\n\n`;

          if (summary.overall_results && summary.overall_results.length > 0) {
            formatted += `**Current Performance:**\n`;
            summary.overall_results.slice(0, 3).forEach(r => {
              formatted += `- ${r.party}: ${r.total_votes} votes\n`;
            });
            formatted += `\n`;
          }

          if (summary.close_margin_summary && summary.close_margin_summary.count > 0) {
            formatted += `**Priority Targets - Close Margin Losses (< ${summary.close_margin_summary.threshold} votes):**\n`;
            formatted += `Found ${summary.close_margin_summary.count} booths needing only ${summary.close_margin_summary.total_votes_needed} total votes to flip.\n\n`;

            if (data.detailed_data.close_margin_booths) {
              data.detailed_data.close_margin_booths.slice(0, 5).forEach((b, idx) => {
                formatted += `${idx + 1}. Booth ${b.booth_id} - Lost to ${b.winner_party} by ${b.vote_gap} votes (${party}: ${b.party_votes}, Winner: ${b.winner_votes})\n`;
              });
              formatted += `\n`;
            }
          }

          if (data.detailed_data.strong_booths && data.detailed_data.strong_booths.length > 0) {
            formatted += `**Strong Booths to Protect:**\n`;
            data.detailed_data.strong_booths.slice(0, 5).forEach((b, idx) => {
              formatted += `${idx + 1}. Booth ${b.booth_id} - Leading ${b.second_party} by ${b.lead_margin} votes\n`;
            });
            formatted += `\n`;
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No winner improvement strategy received";
        }
      } else if (data.mode === "state_wide_wins") {
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.summary && data.constituencies_won && data.constituencies_won.length > 0) {
          const summary = data.summary;
          const party = data.target_party || "Party";
          const constituencies = data.constituencies_won || [];

          let formatted = `**Summary:**\n${party} won in **${summary.constituencies_won} out of ${summary.total_constituencies}** assembly constituencies (${summary.win_percentage}).\n\n`;

          formatted += `**Complete List of Constituencies Won by ${party}:**\n\n`;
          constituencies.forEach((c, idx) => {
            const voteShare = c.total_votes > 0 ? ((c.votes / c.total_votes) * 100).toFixed(2) : "0.00";
            formatted += `${idx + 1}. ${c.constituency_name} (ID: ${c.constituency_id}) - ${party}: ${c.votes} votes (${voteShare}%)\n`;
          });

          if (constituencies.length >= 5) {
            formatted += `\n**Top 5 Strongest Wins (by vote count):**\n`;
            constituencies.slice(0, 5).forEach((c, idx) => {
              const voteShare = c.total_votes > 0 ? ((c.votes / c.total_votes) * 100).toFixed(2) : "0.00";
              formatted += `${idx + 1}. ${c.constituency_name} - ${c.votes} votes (${voteShare}%)\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No state-wide wins analysis received";
        }
      } else if (data.mode === "state_wide_rank_position") {
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.summary) {
          const summary = data.summary;
          const party = data.target_party || "Party";
          const rankLabel = data.rank_label || "this position";

          let formatted = `**Summary:**\n${party} finished in ${rankLabel} in **${summary.rank_finishes} out of ${summary.total_constituencies}** assembly constituencies (${summary.rank_percentage}).\n`;

          if (summary.first_place_finishes !== undefined) {
            formatted += `${party} won ${summary.first_place_finishes} constituencies.\n`;
          }

          if (summary.breakdown_by_winner) {
            formatted += `\n**Breakdown by Winner Party:**\n${party} finished ${rankLabel} to:\n`;
            Object.entries(summary.breakdown_by_winner).forEach(([winnerParty, count]) => {
              formatted += `- ${winnerParty} in ${count} constituencies\n`;
            });
          }

          if (data.top_10_closest && data.top_10_closest.length > 0) {
            formatted += `\n**Top 10 Closest ${rankLabel} Finishes:**\n`;
            data.top_10_closest.forEach((constituency, idx) => {
              formatted += `${idx + 1}. ${constituency.constituency_name} (ID: ${constituency.constituency_id}) - ${party}: ${constituency.votes} votes, Winner: ${constituency.winner_party} (${constituency.winner_votes} votes), Gap: ${constituency.gap_to_winner} votes\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No state-wide rank position analysis received";
        }
      } else if (data.mode === "two_party_finish_pattern") {
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.summary) {
          const summary = data.summary;
          const winner = data.winner_party || "Winner";
          const runnerUp = data.runner_up_party || "Runner-up";
          const runnerUpLabel = data.runner_up_label || "2nd";

          let formatted = `**Summary:**\n${winner} won and ${runnerUp} finished ${runnerUpLabel} in **${summary.matching_constituencies} out of ${summary.total_constituencies}** assembly constituencies (${summary.match_percentage}).\n`;

          formatted += `\n**Statistics:**\n`;
          formatted += `- Average winning margin: ${summary.average_margin} votes\n`;
          formatted += `- Smallest margin: ${summary.smallest_margin} votes\n`;
          formatted += `- Largest margin: ${summary.largest_margin} votes\n`;

          if (data.top_5_closest && data.top_5_closest.length > 0) {
            formatted += `\n**Top 5 Closest Contests:**\n`;
            data.top_5_closest.forEach((constituency, idx) => {
              formatted += `${idx + 1}. ${constituency.constituency_name} (ID: ${constituency.constituency_id}) - ${winner}: ${constituency.winner_votes} votes, ${runnerUp}: ${constituency.runner_up_votes} votes, Margin: ${constituency.margin} votes\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || "No two-party finish pattern analysis received";
        }
      } else if (data.mode === "seat_diagnosis_vote_split") {
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.data && data.data.split_benefit && data.data.split_benefit.length > 0) {
          const splitData = data.data;
          const constituencies = splitData.split_benefit || [];
          const totalCount = splitData.total_count || 0;

          let formatted = `**Vote Split Analysis**\n\n`;
          formatted += `**Summary:**\n`;
          formatted += `Found ${totalCount} constituencies where opposition vote split exceeded the winner's margin, meaning the winner benefited from divided opposition.\n\n`;

          formatted += `**Top ${Math.min(20, constituencies.length)} Cases Where Vote Split Helped Winner:**\n\n`;
          constituencies.slice(0, 20).forEach((c, idx) => {
            formatted += `${idx + 1}. **${c.constituency_name}** (ID: ${c.constituency_id})\n`;
            formatted += `   - Winner: ${c.winner} (${c.winner_votes} votes, ${c.winner_share}%)\n`;
            formatted += `   - Runner-up: ${c.runner_up} (${c.runner_up_votes} votes, ${c.runner_up_share}%)\n`;
            formatted += `   - Other parties combined: ${c.other_votes} votes (${c.other_share}%)\n`;
            formatted += `   - Winning margin: ${c.margin} votes\n`;
            formatted += `   - **Vote split (${c.other_votes} votes) > margin (${c.margin} votes)** ⭐\n\n`;
          });

          formatted += `**Strategic Implication:**\n`;
          formatted += `In these constituencies, if the opposition parties had consolidated their votes, they could have potentially defeated the winner. The winner benefited from vote fragmentation among opposition parties.\n`;

          answerText = formatted;
        } else {
          answerText = data.message || "No vote split analysis data received";
        }
      } else if (data.mode === "seat_diagnosis_close" || data.mode === "seat_diagnosis_multicornered") {
        if (data.analysis && data.analysis.trim()) {
          answerText = data.analysis;
        } else if (data.data) {
          const diagnosisData = data.data;
          const constituencies = diagnosisData.close_constituencies || diagnosisData.multi_cornered || [];
          const totalCount = diagnosisData.total_count || diagnosisData.count || 0;

          let formatted = `**${data.mode === "seat_diagnosis_close" ? "Close Constituencies" : "Multi-Cornered Fights"} Analysis**\n\n`;
          formatted += `**Summary:**\n`;
          formatted += `Found ${totalCount} constituencies matching the criteria.\n\n`;

          if (constituencies.length > 0) {
            formatted += `**Top ${Math.min(20, constituencies.length)} Constituencies:**\n\n`;
            constituencies.slice(0, 20).forEach((c, idx) => {
              formatted += `${idx + 1}. **${c.constituency_name}** (ID: ${c.constituency_id})\n`;
              if (c.winner && c.runner_up) {
                formatted += `   - Winner: ${c.winner} (${c.winner_votes} votes)\n`;
                formatted += `   - Runner-up: ${c.runner_up} (${c.runner_up_votes} votes)\n`;
                formatted += `   - Margin: ${c.margin} votes\n`;
              }
              if (c.margin_percent !== undefined) {
                formatted += `   - Margin: ${c.margin_percent}%\n`;
              }
              formatted += `\n`;
            });
          }

          answerText = formatted;
        } else {
          answerText = data.message || `No ${data.mode} analysis data received`;
        }
      } else if (data.mode === "redirect_to_strategy") {
        const base = data.message || "Use strategy analysis instead for this party.";
        const suggestionText = data.suggestion ? `\n\nSuggestion: ${data.suggestion}` : "";
        answerText = base + suggestionText;
      } else if (
        data.mode === "constituency_stats" ||
        data.mode === "constituency_winner" ||
        data.mode === "constituency_party_total"
      ) {
        answerText = data.answer || "No answer received";
      } else if (data.mode === "voter_analytics") {
        answerText = data.answer || "No voter analytics answer received";
        if (data.total_count != null && data.showing_first != null && data.showing_first < data.total_count) {
          answerText += `\n\n*Showing first ${data.showing_first} of ${data.total_count.toLocaleString()}.*`;
        }
        if (data.raw_data && Array.isArray(data.raw_data) && data.raw_data.length > 0) {
          voterAnalyticsRawData = data.raw_data;
        }
      } else if (data.mode === "voter_search") {
        answerText = data.answer || "No voter search result received";
      } else if (data.analysis && String(data.analysis).trim()) {
        answerText = data.analysis;
      } else {
        answerText = data.answer || data.message || data.error || "No answer received";
      }

      // Pick up structured table data — reuse the voterAnalyticsRawData table renderer.
      if (!voterAnalyticsRawData) {
        const tableRows =
          (data.data?.top_booths) ||
          (data.data?.bottom_booths) ||
          (data.data?.results) ||
          (data.detailed_data?.top_target_constituencies?.length
            ? [
              ...(data.detailed_data.top_target_constituencies || []),
              ...(data.detailed_data.third_place_constituencies || []),
            ]
            : null) ||
          (data.constituencies_won) ||
          (data.all_rank_constituencies) ||
          (data.all_constituencies) ||
          null;
        if (Array.isArray(tableRows) && tableRows.length > 0) {
          voterAnalyticsRawData = tableRows;
        }
      }

      const saved = await saveSearchHistory({
        chat_id: chatId,
        query: currentQuery,
        answer: answerText,
        ...(voterAnalyticsRawData && voterAnalyticsRawData.length > 0 ? { raw_data: voterAnalyticsRawData } : {}),
      });

      const newMsg = {
        id: saved.message_id,
        query: saved.query,
        answer: saved.answer,
        created_at: saved.created_at,
        feedback: saved.feedback ?? null,
        ...(voterAnalyticsRawData && voterAnalyticsRawData.length > 0 ? { voterAnalyticsRawData } : {}),
      };

      setMessages((prev) => [...prev, newMsg]);
      setLoadingQuery("");

      setChats((prev) => {
        const idx = prev.findIndex((c) => c.chat_id === chatId);
        if (idx === -1) return prev;
        const copy = [...prev];
        const chat = { ...copy[idx], messages: [...(copy[idx].messages || []), newMsg] };
        // If it was a new chat, update the title from the first message
        if (!chat.title || chat.title === "New Chat") {
          chat.title = getChatTitle(chat);
        }
        copy[idx] = chat;
        return copy;
      });
    } catch (err) {
      console.error("Search error:", err);
      setError(err.message || "Failed to get answer. Please try again.");
      setLoadingQuery("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex h-[calc(100vh-49px)] w-full ${isDark ? "bg-[#111]" : "bg-gray-50"}`}
    >
      {/* Left sidebar - Chats */}
      <aside
        className={`flex w-72 shrink-0 flex-col border-r ${isDark ? "border-[#333] bg-[#1a1a1a]" : "border-gray-200 bg-white"
          }`}
      >
        <div
          className={`shrink-0 border-b px-4 py-3 ${isDark ? "border-[#2a2a2a]" : "border-gray-100"
            }`}
        >
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {historyLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : chats.length === 0 ? (
            <div
              className={`px-4 py-6 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"
                }`}
            >
              No chats yet.
              <br />

            </div>
          ) : (
            <div className="space-y-1 p-2">
              {chats.map((chat) => (
                <div
                  key={chat.chat_id}
                  onClick={() => handleSelectChat(chat)}
                  className={`group flex cursor-pointer items-start gap-2 rounded-md p-3 transition-colors ${activeChatId === chat.chat_id
                    ? isDark
                      ? "bg-[#222]"
                      : "bg-gray-100"
                    : isDark
                      ? "hover:bg-[#222]"
                      : "hover:bg-gray-50"
                    }`}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-2 text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"
                        }`}
                    >
                      {getChatTitle(chat)}
                    </p>
                    <p
                      className={`mt-0.5 text-xs ${isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      {chat.updated_at
                        ? new Date(chat.updated_at).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.chat_id)}
                    className={`shrink-0 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer ${isDark
                      ? "hover:bg-[#333] text-gray-400 hover:text-red-500"
                      : "hover:bg-gray-200 text-gray-400 hover:text-red-600"
                      }`}
                    aria-label="Delete chat"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Right - Main content */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {messages.length === 0 && !loading && !isHistoryLoading ? (
          /* New/empty chat: center search bar like ChatGPT */
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="w-full max-w-2xl mx-auto text-center space-y-8">
              <h1
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"
                  }`}
              >
                Ask a question about elections
              </h1>
              <form onSubmit={handleSearch} className="space-y-4">
                <div
                  className={`flex overflow-hidden rounded-md border shadow-sm transition-colors ${isDark
                    ? "border-[#333] bg-[#1a1a1a] focus-within:border-gray-500"
                    : "border-gray-300 bg-white focus-within:border-gray-400"
                    }`}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question about elections..."
                    className={`flex-1 min-w-0 px-4 py-3 bg-transparent text-sm focus:outline-none ${isDark
                      ? "text-gray-200 placeholder-gray-500"
                      : "text-gray-800 placeholder-gray-400"
                      }`}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className={`shrink-0 px-6 py-3 text-sm font-medium transition-colors border-l cursor-pointer ${isDark ? "border-[#333]" : "border-gray-200"
                      } ${loading || !query.trim()
                        ? isDark ? "bg-[#222] text-gray-500 cursor-not-allowed" : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : isDark ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                  >
                    Ask
                  </button>
                </div>
                {error && (
                  <div className={`p-4 rounded-md border text-sm text-left ${isDark ? "bg-red-900/20 border-red-900/50 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                    {error}
                  </div>
                )}
              </form>

              {/* Suggested Questions - ChatGPT style cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={loading}
                    className={`group flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${isDark
                      ? "border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#222] hover:border-[#444]"
                      : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isDark
                      ? "bg-[#2a2a2a] text-gray-400 group-hover:text-gray-300"
                      : "bg-gray-100 text-gray-500 group-hover:text-gray-700"
                      }`}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className={`text-sm leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {question}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Chat with messages: scrollable above, search bar at bottom like ChatGPT */
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl p-6 pb-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`group relative p-6 rounded-md border transition-all ${isDark
                      ? "bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a]"
                      : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center border ${isDark ? "bg-[#222] border-[#333] text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 mt-1">
                        <p
                          className={`font-medium text-sm ${isDark ? "text-gray-100" : "text-gray-800"
                            }`}
                        >
                          {msg.query}
                        </p>
                        <div className={`mt-2 text-sm leading-relaxed min-w-0 break-words ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {(() => {
                            const rawData = msg.voterAnalyticsRawData ?? msg.raw_data;
                            const hasRawData = rawData && Array.isArray(rawData) && rawData.length > 0;
                            const answerStr = msg.answer || "";
                            let answerToShow = answerStr;

                            if (hasRawData) {
                              // If we have raw data, strip out any markdown tables from the AI response to avoid redundancy/broken formatting
                              if (answerToShow.includes("|")) {
                                answerToShow = answerToShow.split(/\n\|/)[0].trim();
                              }
                              // Also handle cases with "Sample:" text (which we replace with actual data below)
                              if (answerToShow.includes("Sample:")) {
                                answerToShow = answerToShow.replace(/\n\nSample:[\s\S]*$/i, "").trim();
                              }
                            }
                            return (
                              <ReactMarkdown
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                  h1: ({ node, ...props }) => <h1 className={`text-xl font-bold mt-4 mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`} {...props} />,
                                  h2: ({ node, ...props }) => <h2 className={`text-lg font-bold mt-4 mb-2 ${isDark ? "text-gray-200" : "text-gray-800"}`} {...props} />,
                                  h3: ({ node, ...props }) => <h3 className={`text-base font-bold mt-3 mb-1 ${isDark ? "text-gray-200" : "text-gray-800"}`} {...props} />,
                                  p: ({ node, ...props }) => <p className="mt-2 whitespace-pre-wrap" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mt-2 space-y-1" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mt-2 space-y-1" {...props} />,
                                  li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                                  strong: ({ node, ...props }) => <strong className={`font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`} {...props} />,
                                  u: ({ node, ...props }) => <u className={`underline font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`} {...props} />,
                                  a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                                }}
                              >
                                {answerToShow}
                              </ReactMarkdown>
                            );
                          })()}
                          {(() => {
                            const rawData = msg.voterAnalyticsRawData ?? msg.raw_data;
                            if (!rawData || !Array.isArray(rawData) || rawData.length === 0) return null;
                            const columns = Object.keys(rawData[0] || {});
                            return (
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <p className={`text-xs font-medium ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                    Raw data ({rawData.length} rows)
                                  </p>
                                  <button
                                    onClick={() => handleDownload(rawData, msg.query)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${isDark
                                      ? "border-[#333] bg-[#222] text-gray-400 hover:border-gray-500 hover:text-white"
                                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                                      }`}
                                    title="Download as CSV"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    Download CSV
                                  </button>
                                </div>
                                <div className={`rounded-md border overflow-hidden ${isDark ? "border-[#333]" : "border-gray-200"}`}>
                                  <div className="overflow-x-auto max-h-[min(60vh,420px)] overflow-y-auto">
                                    <table className="w-full text-left text-sm border-collapse">
                                      <thead className={`sticky top-0 z-10 ${isDark ? "bg-[#222]" : "bg-gray-100"}`}>
                                        <tr>
                                          {columns.map((key) => (
                                            <th key={key} className={`px-3 py-2 font-semibold border-b whitespace-nowrap ${isDark ? "border-[#333] text-gray-300" : "border-gray-200 text-gray-700"}`}>
                                              {key.replace(/_/g, " ")}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {rawData.map((row, idx) => (
                                          <tr key={idx} className={isDark ? "border-b border-[#333]" : "border-b border-gray-100"}>
                                            {columns.map((col) => (
                                              <td key={col} className={`px-3 py-1.5 whitespace-nowrap ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {typeof row[col] === "number" ? row[col].toLocaleString() : (row[col] ?? "—")}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"
                              }`}
                          >
                            Was this helpful?
                          </span>
                          <button
                            onClick={() => handleFeedback(msg.id, "liked")}
                            className={`rounded border p-1.5 transition-colors cursor-pointer ${msg.feedback === "liked"
                              ? isDark
                                ? "border-gray-500 bg-[#222] text-white"
                                : "border-gray-400 bg-gray-100 text-gray-800"
                              : isDark
                                ? "border-[#333] bg-transparent text-gray-500 hover:bg-[#222] hover:text-gray-300"
                                : "border-gray-200 bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              }`}
                            aria-label="Like"
                            title="Like"
                          >
                            <ThumbsUp
                              className="h-4 w-4"
                              fill={msg.feedback === "liked" ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, "disliked")}
                            className={`rounded border p-1.5 transition-colors cursor-pointer ${msg.feedback === "disliked"
                              ? isDark
                                ? "border-gray-500 bg-[#222] text-white"
                                : "border-gray-400 bg-gray-100 text-gray-800"
                              : isDark
                                ? "border-[#333] bg-transparent text-gray-500 hover:bg-[#222] hover:text-gray-300"
                                : "border-gray-200 bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                              }`}
                            aria-label="Dislike"
                            title="Dislike"
                          >
                            <ThumbsDown
                              className="h-4 w-4"
                              fill={msg.feedback === "disliked" ? "currentColor" : "none"}
                            />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteMessage(e, msg.id)}
                        className={`absolute top-3 right-3 rounded p-1.5 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer ${isDark
                          ? "hover:bg-[#333] text-gray-500 hover:text-red-500"
                          : "hover:bg-gray-100 text-gray-400 hover:text-red-600"
                          }`}
                        aria-label="Delete message"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {/* Skeleton modal shown while loading */}
                {loading && loadingQuery && (
                  <div
                    className={`group relative p-6 rounded-md border ${isDark
                      ? "bg-[#1a1a1a] border-[#2a2a2a]"
                      : "bg-white border-gray-200"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center border ${isDark ? "bg-[#222] border-[#333] text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                        }`}>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 mt-1 space-y-3 text-left">
                        {/* Show actual question */}
                        <p
                          className={`font-medium text-sm text-left ${isDark ? "text-gray-100" : "text-gray-800"
                            }`}
                        >
                          {loadingQuery}
                        </p>
                        {/* Answer skeleton lines */}
                        <div className="space-y-2 mt-2">
                          <div
                            className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"
                              } animate-pulse`}
                            style={{ width: "100%" }}
                          />
                          <div
                            className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"
                              } animate-pulse`}
                            style={{ width: "95%" }}
                          />
                          <div
                            className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"
                              } animate-pulse`}
                            style={{ width: "85%" }}
                          />
                          <div
                            className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"
                              } animate-pulse`}
                            style={{ width: "90%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isHistoryLoading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`group relative p-6 rounded-md border animate-pulse ${isDark
                          ? "bg-[#1a1a1a] border-[#2a2a2a]"
                          : "bg-white border-gray-200"
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-md border ${isDark ? "bg-[#222] border-[#333]" : "bg-gray-50 border-gray-200"
                              }`}
                          />
                          <div className="flex-1 min-w-0 mt-1 space-y-3 text-left">
                            <div
                              className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"}`}
                              style={{ width: "40%" }}
                            />
                            <div className="space-y-2 mt-2">
                              <div
                                className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"}`}
                                style={{ width: "100%" }}
                              />
                              <div
                                className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"}`}
                                style={{ width: "95%" }}
                              />
                              <div
                                className={`h-3 rounded ${isDark ? "bg-[#333]" : "bg-gray-200"}`}
                                style={{ width: "85%" }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Search bar fixed at bottom */}
            <div
              className={`shrink-0 border-t px-6 py-4 ${isDark ? "border-[#2a2a2a] bg-[#111]" : "border-gray-200 bg-gray-50"
                }`}
            >
              <form onSubmit={handleSearch} className="mx-auto max-w-4xl">
                <div
                  className={`flex overflow-hidden rounded-md border shadow-sm transition-colors ${isDark
                    ? "border-[#333] bg-[#1a1a1a] focus-within:border-gray-500"
                    : "border-gray-300 bg-white focus-within:border-gray-400"
                    }`}
                >
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className={`flex-1 min-w-0 px-4 py-3 bg-transparent text-sm focus:outline-none ${isDark
                      ? "text-gray-200 placeholder-gray-500"
                      : "text-gray-800 placeholder-gray-400"
                      }`}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className={`shrink-0 px-6 py-3 text-sm font-medium transition-colors border-l cursor-pointer ${isDark ? "border-[#333]" : "border-gray-200"
                      } ${loading || !query.trim()
                        ? isDark ? "bg-[#222] text-gray-500 cursor-not-allowed" : "bg-gray-50 text-gray-400 cursor-not-allowed"
                        : isDark ? "bg-white text-gray-900 hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"
                      }`}
                  >
                    Ask
                  </button>
                </div>
                {error && (
                  <div className={`mt-2 p-3 rounded-md border text-sm ${isDark ? "bg-red-900/20 border-red-900/50 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                    {error}
                  </div>
                )}
              </form>
            </div>
          </>
        )}
      </main>

      {/* Delete Chat Confirmation Modal */}
      {chatIdToDelete && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setChatIdToDelete(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm transform overflow-hidden rounded-xl border p-6 shadow-2xl transition-all ${
              isDark ? "bg-[#1a1a1a] border-[#333]" : "bg-white border-gray-100"
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"
                }`}>
                  <AlertCircle className="h-5 w-5" />
                </div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  Delete Chat
                </h3>
              </div>
              
              <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Are you sure you want to delete this chat? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setChatIdToDelete(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isDark 
                      ? "text-gray-400 hover:bg-[#2a2a2a] border border-[#333]" 
                      : "text-gray-600 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteChat}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
                >
                  Delete Chat
                </button>
              </div>

              <button
                onClick={() => setChatIdToDelete(null)}
                className={`absolute top-4 right-4 p-1 rounded-md transition-colors ${
                  isDark ? "text-gray-500 hover:text-gray-300 hover:bg-[#2a2a2a]" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
