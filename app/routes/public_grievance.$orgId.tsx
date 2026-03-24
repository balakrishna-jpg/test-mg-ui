// app/routes/public_grievance.$orgId.tsx
// Public-facing citizen grievance portal
// URL: /public_grievance/:orgId  (no auth required)

import { useParams } from "@remix-run/react";
import ManagePublicGrievance from "~/components/ElectionsWeb/PublicGrievance/managePublicGrievance";

export default function PublicGrievanceUiRoute() {
    const { orgId } = useParams();

    return <ManagePublicGrievance orgId={orgId} />;
}
