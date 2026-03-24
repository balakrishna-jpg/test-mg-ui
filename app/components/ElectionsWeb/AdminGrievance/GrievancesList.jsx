// app/components/ElectionsWeb/Grievance/GrievancesList.jsx
// Internal list of all grievance tickets

import { useState, useEffect } from "react";
import { listSupportTickets } from "~/utils/GrievanceService";
import { Paperclip, Image, FileText, Video } from "lucide-react";

const STATUS_COLORS = {
    open: { bg: "#dbeafe", color: "#1d4ed8" },
    in_progress: { bg: "#fef9c3", color: "#92400e" },
    pending: { bg: "#fef3c7", color: "#92400e" },
    resolved: { bg: "#dcfce7", color: "#15803d" },
    closed: { bg: "#f1f5f9", color: "#475569" },
};

export default function GrievancesList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
        const orgId = userData?.organization_id || userData?.org_id;
        listSupportTickets({ org_id: orgId, limit: 50 })
            .then((res) => {
                // Safely extract an array from any response shape the API might return
                const raw =
                    res?.data?.tickets ??
                    res?.data?.items ??
                    res?.data?.results ??
                    (Array.isArray(res?.data) ? res.data : null) ??
                    res?.tickets ??
                    res?.items ??
                    res?.results ??
                    (Array.isArray(res) ? res : []);
                setTickets(Array.isArray(raw) ? raw : []);
            })
            .catch(() => setError("Failed to load tickets."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <p style={{ color: "#64748b" }}>Loading grievances…</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Grievances</h1>
                <span style={{ fontSize: 13, color: "#64748b" }}>{tickets.length} total</span>
            </div>

            {error && (
                <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#dc2626", borderRadius: 10, marginBottom: 20, fontSize: 14 }}>
                    {error}
                </div>
            )}

            {tickets.length === 0 && !error ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p>No grievances found.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {tickets.map((t, i) => {
                        const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
                        const attachments = t.attachments || [];
                        return (
                            <div
                                key={t.ticket_id || t._id || i}
                                style={{
                                    background: "#fff",
                                    borderRadius: 12,
                                    border: "1px solid #e2e8f0",
                                    padding: "16px 20px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                    cursor: "pointer",
                                    transition: "box-shadow 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
                                        {t.subject || "Untitled Grievance"}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 8 }}>
                                        <span>{t.ticket_number || t.ticket_id} · {t.category || "General"}</span>
                                        {attachments.length > 0 && (
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6366f1" }}>
                                                <Paperclip size={12} />
                                                <span>{attachments.length}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {attachments.length > 0 && (
                                    <div style={{ display: "flex", gap: 4 }}>
                                        {attachments.slice(0, 3).map((att, attIdx) => {
                                            const isImage = att.type === "image" || att.content_type?.startsWith("image/");
                                            const isVideo = att.type === "video" || att.content_type?.startsWith("video/");
                                            return (
                                                <a
                                                    key={attIdx}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: 6,
                                                        background: "#f1f5f9",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                    title={att.filename || "Attachment"}
                                                >
                                                    {isImage ? (
                                                        <Image size={14} color="#3b82f6" />
                                                    ) : isVideo ? (
                                                        <Video size={14} color="#8b5cf6" />
                                                    ) : (
                                                        <FileText size={14} color="#f97316" />
                                                    )}
                                                </a>
                                            );
                                        })}
                                        {attachments.length > 3 && (
                                            <span style={{ fontSize: 11, color: "#64748b", alignSelf: "center" }}>
                                                +{attachments.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div style={{ background: sc.bg, color: sc.color, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, textTransform: "capitalize", whiteSpace: "nowrap" }}>
                                    {t.status?.replace("_", " ") || "Open"}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
