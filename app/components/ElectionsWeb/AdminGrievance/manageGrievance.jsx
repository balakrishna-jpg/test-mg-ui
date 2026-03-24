// app/components/ElectionsWeb/Grievance/manageGrievance.jsx
// Internal grievance management component (admin/support view)
// Wraps the public grievance UI for internal preview / org-specific use

import ManagePublicGrievance from "~/components/ElectionsWeb/PublicGrievance/managePublicGrievance";
import { useState, useEffect } from "react";

export default function ManageGrievance() {
    const [orgId, setOrgId] = useState(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
        setOrgId(userData?.organization_id || userData?.org_id || "default");
    }, []);

    if (!orgId) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    <p style={{ color: "#64748b" }}>Loading grievance portal…</p>
                </div>
            </div>
        );
    }

    return <ManagePublicGrievance orgId={orgId} />;
}
