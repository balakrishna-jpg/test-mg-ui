// app/components/ElectionsWeb/AdminGrievance/TicketsDashboard.jsx
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
    Loader2,
    MessageSquare,
    CheckCircle,
    Clock,
    AlertCircle,
    X,
    User,
    Send,
    Inbox,
    Paperclip,
    Image,
    FileText,
    Video,
} from "lucide-react";
import {
    listSupportTickets,
    getTicketStats,
    updateTicketStatus,
    addSupportTeamReply,
    getSupportTicketThread,
} from "~/utils/GrievanceService";

const STATUS_CONFIG = {
    open: { label: "Open", cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
    pending: { label: "Pending", cls: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
    in_progress: { label: "In Progress", cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
    on_hold: { label: "On Hold", cls: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
    work_order_issued: { label: "Work Order Issued", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400" },
    work_in_progress: { label: "Work In Progress", cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
    work_completed: { label: "Work Completed", cls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
    resolved: { label: "Resolved", cls: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
    closed: { label: "Closed", cls: "bg-gray-100 text-gray-600 dark:bg-[#2a2a2a] dark:text-gray-400" },
};

const TABS = [
    "all", "open", "pending", "in_progress", "on_hold",
    "work_order_issued", "work_in_progress", "work_completed",
    "resolved", "closed"
];

function StatCard({ label, value, sub, icon, accent }) {
    return (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded p-4 flex items-start justify-between">
            <div>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">{value ?? "—"}</p>
                <p className="text-xs text-gray-400 mt-1">{sub}</p>
            </div>
            <div className={`w-9 h-9 rounded flex items-center justify-center ${accent}`}>
                {icon}
            </div>
        </div>
    );
}

function ClipboardList({ className }) {
    return (
        <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
    );
}

export default function TicketsDashboard() {
    const [stats, setStats] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [activeTab, setActiveTab] = useState("all");
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);
    const [thread, setThread] = useState(null);
    const [threadLoading, setThreadLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
        const orgId = userData?.organization_id || userData?.org_id;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, ticketsRes] = await Promise.all([
                    getTicketStats(orgId),
                    listSupportTickets({ org_id: orgId, limit: 100 }),
                ]);
                setStats(statsRes?.data?.organization?.counts || statsRes?.data?.overall || {});
                const raw = ticketsRes?.data?.tickets || ticketsRes?.tickets || [];
                setTickets(raw);
            } catch (err) {
                console.error("Dashboard load error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refreshTrigger]);

    useEffect(() => {
        if (!selectedId) { setThread(null); return; }
        const fetch = async () => {
            setThreadLoading(true);
            try {
                const res = await getSupportTicketThread(selectedId);
                setThread(res?.data);
            } catch (err) {
                console.error("Thread load error:", err);
            } finally {
                setThreadLoading(false);
            }
        };
        fetch();
    }, [selectedId]);

    const handleReply = async () => {
        if (!replyText.trim() || !selectedId) return;
        setSendingReply(true);
        try {
            await addSupportTeamReply(selectedId, { description: replyText });
            setReplyText("");
            const res = await getSupportTicketThread(selectedId);
            setThread(res?.data);
        } catch {
            alert("Failed to send reply");
        } finally {
            setSendingReply(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedId) return;
        try {
            await updateTicketStatus(selectedId, newStatus);
            setRefreshTrigger(p => p + 1);
            const res = await getSupportTicketThread(selectedId);
            setThread(res?.data);
        } catch {
            alert("Failed to update status");
        }
    };

    const displayed = tickets.filter(t => activeTab === "all" || t.status === activeTab);

    return (
        <div className="flex h-[calc(100vh-49px)] bg-gray-50 dark:bg-[#0d0d0d] overflow-hidden">

            {/* ── Main list ── */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${selectedId ? "mr-[420px]" : ""}`}>

                {/* Stat cards */}
                <div className="px-6 pt-5 pb-4 grid grid-cols-4 gap-3">
                    <StatCard
                        label="Total Tickets"
                        value={stats?.total ?? 0}
                        sub="All tickets"
                        icon={<ClipboardList className="text-blue-500" />}
                        accent="bg-blue-50 dark:bg-blue-900/20"
                    />
                    <StatCard
                        label="Needs Attention"
                        value={(stats?.open ?? 0) + (stats?.in_progress ?? 0)}
                        sub="Open + In Progress"
                        icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                        accent="bg-red-50 dark:bg-red-900/20"
                    />
                    <StatCard
                        label="Resolved"
                        value={stats?.resolved ?? 0}
                        sub="Last 30 days"
                        icon={<CheckCircle className="w-5 h-5 text-green-500" />}
                        accent="bg-green-50 dark:bg-green-900/20"
                    />
                    <StatCard
                        label="Pending"
                        value={stats?.pending ?? 0}
                        sub="Awaiting info"
                        icon={<Clock className="w-5 h-5 text-purple-500" />}
                        accent="bg-purple-50 dark:bg-purple-900/20"
                    />
                </div>

                {/* Table container */}
                <div className="flex-1 mx-6 mb-6 overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded">

                    {/* Toolbar */}
                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#222] flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                            <select
                                value={activeTab}
                                onChange={(e) => setActiveTab(e.target.value)}
                                className="px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-[#333] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white capitalize focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {TABS.map(tab => (
                                    <option key={tab} value={tab}>
                                        {tab === "all" ? "All Tickets" : (STATUS_CONFIG[tab]?.label || tab.replace(/_/g, " "))}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">
                            {displayed.length} ticket{displayed.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            </div>
                        ) : displayed.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48">
                                <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                                <p className="text-sm text-gray-400">No tickets in this view</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-[#222] bg-gray-50/60 dark:bg-[#161616]">
                                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">Ticket #</th>
                                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">Subject</th>
                                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">Status</th>
                                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">Type</th>
                                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">Attachments</th>
                                        <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayed.map((ticket, idx) => {
                                        const id = ticket.ticket_id || ticket._id;
                                        const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
                                        const isSelected = selectedId === id;
                                        return (
                                            <tr
                                                key={id || idx}
                                                onClick={() => setSelectedId(isSelected ? null : id)}
                                                className={`border-b border-gray-50 dark:border-[#1e1e1e] cursor-pointer transition-colors ${isSelected
                                                    ? "bg-blue-50/60 dark:bg-blue-900/10"
                                                    : "hover:bg-gray-50 dark:hover:bg-[#161616]"
                                                    }`}
                                            >
                                                <td className="px-5 py-3 text-sm font-mono text-blue-600 dark:text-blue-400">
                                                    {ticket.ticket_number || "—"}
                                                </td>
                                                <td className="px-5 py-3 max-w-[240px]">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {ticket.subject || "No subject"}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sc.cls}`}>
                                                        {sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {ticket.category || ticket.ticket_type || "—"}
                                                </td>
                                                <td className="px-5 py-3">
                                                    {ticket.attachments && ticket.attachments.length > 0 ? (
                                                        <div className="flex items-center gap-1">
                                                            {ticket.attachments.slice(0, 3).map((att, attIdx) => {
                                                                const isImage = att.type === "image" || att.content_type?.startsWith("image/");
                                                                const isVideo = att.type === "video" || att.content_type?.startsWith("video/");
                                                                return (
                                                                    <a
                                                                        key={attIdx}
                                                                        href={att.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-7 h-7 rounded bg-gray-100 dark:bg-[#2a2a2a] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                                                        title={att.filename || "Attachment"}
                                                                    >
                                                                        {isImage ? (
                                                                            <Image className="w-3.5 h-3.5 text-blue-500" />
                                                                        ) : isVideo ? (
                                                                            <Video className="w-3.5 h-3.5 text-purple-500" />
                                                                        ) : (
                                                                            <FileText className="w-3.5 h-3.5 text-orange-500" />
                                                                        )}
                                                                    </a>
                                                                );
                                                            })}
                                                            {ticket.attachments.length > 3 && (
                                                                <span className="text-xs text-gray-400 ml-1">
                                                                    +{ticket.attachments.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-400 tabular-nums">
                                                    {ticket.created_at
                                                        ? dayjs(ticket.created_at).format("MMM D, YYYY")
                                                        : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Slide-over detail panel ── */}
            <div className={`fixed inset-y-0 right-0 w-[420px] bg-white dark:bg-[#1a1a1a] border-l border-gray-200 dark:border-[#2a2a2a] transform transition-transform duration-200 z-50 flex flex-col ${selectedId ? "translate-x-0" : "translate-x-full"}`}>
                {selectedId && (
                    <>
                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222] flex items-start justify-between flex-shrink-0">
                            <div className="flex-1 min-w-0 pr-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-gray-400">
                                        {thread?.ticket_number}
                                    </span>
                                    {thread?.status && (
                                        <span className={`text-xs px-2 py-0.5 rounded ${STATUS_CONFIG[thread.status]?.cls || ""}`}>
                                            {STATUS_CONFIG[thread.status]?.label || thread.status}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate">
                                    {thread?.subject || "Loading…"}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedId(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick actions */}
                        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-[#222] flex items-center gap-3 flex-shrink-0 overflow-x-auto">
                            <button
                                onClick={() => document.getElementById("reply-box")?.focus()}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#333] rounded hover:bg-gray-50 dark:hover:bg-[#2a2a2a] transition-colors whitespace-nowrap"
                            >
                                Reply
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">Update Status:</span>
                                <select
                                    value={thread?.status || "open"}
                                    onChange={(e) => handleStatusUpdate(e.target.value)}
                                    className="px-2 py-1 text-xs font-medium border border-gray-200 dark:border-[#333] rounded bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                                >
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Thread */}
                        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#111] p-4 space-y-3">
                            {threadLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <>
                                    {/* Attachments Section */}
                                    {thread?.attachments && thread.attachments.length > 0 && (
                                        <div className="mb-4 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                    Attachments ({thread.attachments.length})
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {thread.attachments.map((att, attIdx) => {
                                                    const isImage = att.type === "image" || att.content_type?.startsWith("image/");
                                                    const isVideo = att.type === "video" || att.content_type?.startsWith("video/");
                                                    return (
                                                        <a
                                                            key={attIdx}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] border border-gray-200 dark:border-[#333] rounded text-xs text-gray-600 dark:text-gray-400 transition-colors"
                                                            title={att.filename}
                                                        >
                                                            {isImage ? (
                                                                <Image className="w-3.5 h-3.5 text-blue-500" />
                                                            ) : isVideo ? (
                                                                <Video className="w-3.5 h-3.5 text-purple-500" />
                                                            ) : (
                                                                <FileText className="w-3.5 h-3.5 text-orange-500" />
                                                            )}
                                                            <span className="max-w-[120px] truncate">{att.filename || "File"}</span>
                                                            {att.size_bytes && (
                                                                <span className="text-gray-400">
                                                                    ({(att.size_bytes / 1024).toFixed(0)}KB)
                                                                </span>
                                                            )}
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Messages */}
                                    {(thread?.thread || []).map((msg, idx) => {
                                        const isSupport = msg.author_type === "support_team";
                                        return (
                                            <div key={idx} className={`flex gap-2.5 ${isSupport ? "flex-row-reverse" : ""}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isSupport
                                                    ? "bg-gray-900 dark:bg-white"
                                                    : "bg-gray-200 dark:bg-[#2a2a2a]"
                                                    }`}>
                                                    <User className={`w-3.5 h-3.5 ${isSupport ? "text-white dark:text-gray-900" : "text-gray-500"}`} />
                                                </div>
                                                <div className={`max-w-[80%] rounded px-3.5 py-2.5 text-sm ${isSupport
                                                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                                    : "bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-700 dark:text-gray-300"
                                                    }`}>
                                                    <p className="leading-relaxed">{msg.description}</p>
                                                    <p className={`text-[10px] mt-1 ${isSupport ? "text-gray-400 dark:text-gray-500" : "text-gray-400"}`}>
                                                        {dayjs(msg.created_at).format("MMM D, h:mm A")}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>

                        {/* Reply box */}
                        <div className="p-4 border-t border-gray-100 dark:border-[#222] bg-white dark:bg-[#1a1a1a] flex-shrink-0">
                            <div className="relative">
                                <textarea
                                    id="reply-box"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type a reply…"
                                    rows={3}
                                    className="w-full pr-10 pl-3 py-2.5 text-sm border border-gray-200 dark:border-[#333] rounded bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none transition-colors"
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={sendingReply || !replyText.trim()}
                                    className="absolute bottom-2.5 right-2.5 p-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {sendingReply
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Send className="w-3.5 h-3.5" />
                                    }
                                </button>
                            </div>
                            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                                <span>Visible to citizen</span>
                                <button className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                    Switch to Internal Note
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
