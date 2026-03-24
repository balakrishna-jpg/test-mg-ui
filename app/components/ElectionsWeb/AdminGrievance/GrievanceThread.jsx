// app/components/ElectionsWeb/Grievance/GrievanceThread.jsx
// Internal ticket thread view (support team)

import { useState, useEffect } from "react";
import { useParams } from "@remix-run/react";
import { getSupportTicketThread } from "~/utils/GrievanceService";

export default function GrievanceThread() {
    const { ticket_id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!ticket_id) return;
        setLoading(true);
        getSupportTicketThread(ticket_id)
            .then((res) => setTicket(res?.data || res))
            .catch(() => setError("Failed to load ticket."))
            .finally(() => setLoading(false));
    }, [ticket_id]);

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <p style={{ color: "#64748b" }}>Loading ticket…</p>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
                    <p style={{ color: "#dc2626" }}>{error || "Ticket not found."}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                {ticket.subject || "Grievance Ticket"}
            </h1>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
                Ticket ID: <strong>{ticket.ticket_number || ticket_id}</strong> · Status:{" "}
                <strong style={{ textTransform: "capitalize" }}>{ticket.status || "open"}</strong>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24 }}>
                <p style={{ color: "#374151", lineHeight: 1.7 }}>{ticket.description || "No description."}</p>
            </div>
        </div>
    );
}
