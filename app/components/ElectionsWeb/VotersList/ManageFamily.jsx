// app/components/ElectionsWeb/VotersList/ManageFamily.jsx
// Family-wise voters UI: dropdown toggle and family list table content (extracted from VotersDB).

import { Fragment } from "react";
import {
  TableRow,
  TableCell,
} from "~/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Toggle shown inside the booth dropdown to enable/disable family-wise view.
 */
export function FamilyWiseToggle({
  showFamilyWise,
  setShowFamilyWise,
  selectedBooth,
  darkMode,
  isConstituencySearchActive,
  clearConstituencySearch,
}) {
  return (
    <div className={`px-3 py-2 border-b sticky top-0 z-10 ${darkMode ? "bg-[#1a1a1a] border-[#333]" : "bg-gray-50 border-gray-200"}`}>
      <label className="flex items-center gap-2 cursor-pointer w-full" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="rounded text-[#a8e6cf] focus:ring-[#a8e6cf]"
          checked={showFamilyWise}
          onChange={(e) => {
            setShowFamilyWise(e.target.checked);
            if (!e.target.checked && isConstituencySearchActive) {
              clearConstituencySearch();
            }
          }}
          disabled={!selectedBooth}
        />
        <span className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} ${!selectedBooth ? "opacity-50" : ""}`}>
          Show Family Wise
        </span>
      </label>
    </div>
  );
}

/**
 * Renders table rows for family-wise view: one expandable row per family and member rows when expanded.
 * Used inside TableBody when showFamilyWise is true.
 */
export function FamilyWiseTableBody({
  familyData,
  expandedFamilies,
  toggleFamily,
  renderVoterRow,
  darkMode,
}) {
  if (!familyData || familyData.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={100} className="text-center py-8 text-sm text-gray-500">
          No families found for this booth.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {familyData.map((family) => {
        const isExpanded = expandedFamilies.has(family.family_id);
        return (
          <Fragment key={family.family_id}>
            <TableRow
              className={`cursor-pointer transition-colors ${darkMode ? "bg-[#2a2a2a]/50 hover:bg-[#333]/50" : "bg-gray-50/80 hover:bg-gray-100"}`}
              onClick={() => toggleFamily(family.family_id)}
            >
              <TableCell colSpan={100} className="py-2 px-4 border-y border-gray-200 dark:border-[#333]">
                <div className="flex items-center w-full relative">
                  <div className="flex items-center gap-2" style={{ minWidth: "192px", width: "192px" }}>
                    {isExpanded ? (
                      <ChevronDown className={`w-4 h-4 shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    ) : (
                      <ChevronRight className={`w-4 h-4 shrink-0 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                    )}
                    <span className={`font-semibold truncate ${darkMode ? "text-[#a8e6cf]" : "text-emerald-700"}`}>
                      Family of {family.Family_of || "Unknown"}
                    </span>
                  </div>
                  <div style={{ minWidth: "160px", width: "160px" }} className="ml-8">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? "bg-[#333] text-gray-300" : "bg-gray-200 text-gray-700"}`}>
                      {family.total_members} Member{family.total_members !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </TableCell>
            </TableRow>
            {isExpanded && family.members && family.members.map((member) => renderVoterRow(member))}
          </Fragment>
        );
      })}
    </>
  );
}
