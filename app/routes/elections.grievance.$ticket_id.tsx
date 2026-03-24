// app/routes/$party.elections.grievance.$ticket_id.tsx

import GrievanceThread from "~/components/ElectionsWeb/AdminGrievance/GrievanceThread";

export default function GrievanceThreadRoute() {
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;

  return <GrievanceThread />;
}
