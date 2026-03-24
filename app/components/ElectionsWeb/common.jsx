import { useEffect, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "~/components/ui/select";
import AssemblyAnalysis from "./Assembly";
import Loksabha from "./Loksabha";

export default function ElectionsDashboard() {
  const [states] = useState([{ id: 21, name: "Tamil Nadu" }]);
  const [selectedState, setSelectedState] = useState(21);

  const [elections] = useState([
    { type: "assembly_elections", year: 2021 },
    { type: "loksabha_elections", year: 2024 },
  ]);
  const [selectedElection, setSelectedElection] = useState(null);

  const formatElectionType = (type) =>
    type === "assembly_elections" ? "Assembly Elections"
      : type === "loksabha_elections" ? "Lok Sabha Elections"
        : "Unknown Election";

  return (
    <div className="min-h-screen bg-gray-200">
      <div className="bg-white shadow-sm border-b p-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* State */}
            <Select
              value={selectedState?.toString() || ""}
              onValueChange={(v) => setSelectedState(Number(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* (Optional) reserved spot — e.g., constituency for AssemblyPanel will live inside AssemblyPanel itself */}

            {/* Election */}
            <Select
              value={
                selectedElection ? `${selectedElection.type}|${selectedElection.year}` : ""
              }
              onValueChange={(value) => {
                const [type, year] = value.split("|");
                setSelectedElection({ type, year: Number(year) });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Election" />
              </SelectTrigger>
              <SelectContent>
                {elections.map((ev, idx) => (
                  <SelectItem key={idx} value={`${ev.type}|${ev.year}`}>
                    {formatElectionType(ev.type)} ({ev.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-2">
        {!selectedElection ? null : selectedElection.type === "assembly_elections" ? (
          <AssemblyAnalysis stateId={selectedState} electionYear={selectedElection.year} />
        ) : (
          <Loksabha stateId={selectedState} electionYear={selectedElection.year} />
        )}
      </div>
    </div>
  );
}
