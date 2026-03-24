import React, { useEffect, useState } from "react";
import Box from "./Box";
import { useLocation } from "@remix-run/react";

const ResultCards = ({
  data,
  type,
  selectedState,
  setMagicFigure,
  magicFigure,
  selectedYear,
}) => {
  const location = useLocation();
  const [polls, setPolls] = useState([]);
  const [total, setTotal] = useState(500);
  const [allianceWiseResult, setAllianceWiseResult] = useState([]);

  const allianceWiseResults = (data) => {
    if (!data || data.length === 0 || !data[0]?.results) return;
    
    const allianceMap = {};

    data[0]?.results?.forEach(({ leading, won, total  }) => {
      const alliance = party.alliance
        ? party.alliance.display_name
        : party.display_name;
      const partyFlagImg = party.alliance ? "none" : party.party_flag_img;

      if (!allianceMap[alliance]) {
        allianceMap[alliance] = {
          party: {
            party_flag_img: partyFlagImg,
            display_name: alliance,
          },
          leading: 0,
          won: 0,
          total: 0,
        };
      }

      allianceMap[alliance].leading += leading || 0;
      allianceMap[alliance].won += won || 0;
      allianceMap[alliance].total += total || 0;
    });

    setAllianceWiseResult(Object.values(allianceMap));
  };

  useEffect(() => {
    if (!data || data.length === 0) {
      setPolls([]);
      return;
    }

    let filteredPolls = [];
    
    if (type === "Loksabha") {
      filteredPolls = data?.filter((e) => {
        const matchesElectionType = e.election_type === "loksabha_elections";
        if (selectedState?.state_id && selectedState.state_id !== -1) {
          return matchesElectionType && e?.state?.state_id === selectedState?.state_id;
        } else if (selectedState?.state_name === "India") {
          return matchesElectionType;
        }
        return matchesElectionType;
      });
      setMagicFigure(273);
      setTotal(543);
    } else if (type === "Assembly") {
      filteredPolls = data?.filter((e) => {
        const matchesElectionType = e.election_type === "assembly_elections";
        if (selectedState?.state_id && selectedState.state_id !== -1) {
          return matchesElectionType && e?.state?.state_id === selectedState?.state_id;
        }
        return matchesElectionType;
      });
      setTotal(selectedState?.mla_seats || 288);
      setMagicFigure(Math.floor((selectedState?.mla_seats || 288) / 2) + 1);
    } else if (type === "All") {
      // Handle "all" election type - show both assembly and loksabha
      filteredPolls = data?.filter((e) => {
        if (selectedState?.state_id && selectedState.state_id !== -1) {
          return e?.state?.state_id === selectedState?.state_id;
        } else if (selectedState?.state_name === "India") {
          return true; // Show all for India
        }
        return true;
      });
      // For "all", use assembly seats if available
      setTotal(selectedState?.mla_seats || 288);
      setMagicFigure(Math.floor((selectedState?.mla_seats || 288) / 2) + 1);
    } else {
      // Default to assembly
      filteredPolls = data?.filter((e) => {
        const matchesElectionType = e.election_type === "assembly_elections";
        if (selectedState?.state_id && selectedState.state_id !== -1) {
          return matchesElectionType && e?.state?.state_id === selectedState?.state_id;
        }
        return matchesElectionType;
      });
      setTotal(selectedState?.mla_seats || 288);
      setMagicFigure(Math.floor((selectedState?.mla_seats || 288) / 2) + 1);
    }
    
      allianceWiseResults(filteredPolls);
    setPolls(filteredPolls || []);
  }, [data, type, selectedState]);

  return (
    <div className="mt-2">
      {polls && polls.length !== 0 && polls[0]?.results?.length !== 0 ? (
        <div className="flex-col">
          {polls?.map((tvName, index) => {
            const tvTitle = tvName?.media_source?.display_name;
            const mediaSources = tvName.results || [];

            // Separate "Others" from other media sources
            const others = mediaSources.filter(
              (media) => media.party.display_name === "Others"
            );
            const nonOthers = mediaSources.filter(
              (media) => media.party.display_name !== "Others"
            );
            // Concatenate the lists, putting "Others" at the end
            const finalMediaSources = nonOthers.concat(others);

            return (
              <div
                key={tvName?.result_id || index}
                className="relative rounded-lg overflow-hidden bg-[#8C8C8C4D] shadow-md transform mb-4"
              >
                <div className="">
                  <div className="mb-1 flex">
                    <div className="roboto_regular flex w-full justify-between text-[14px] bg-[#0011326E] text-[#FFFFFF] font-[600] py-3 px-2">
                      <div className="flex-[2] text-center">Party</div>
                      <div className="flex-1 text-center">Leads</div>
                      <div className="flex-1 text-center">Won</div>
                      <div className="flex-1 text-center">Total</div>
                    </div>
                  </div>

                  <div className="roboto_regular cursor-pointer pe-2 pb-1">
                    {finalMediaSources?.length !== 0 ? (
                  <div>
                        {finalMediaSources.map((result, idx) => (
                          <Box key={result?.party?.party_id || idx} result={result} selectedState={selectedState} />
                    ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: "200px", opacity: 0.7 }} className="text-[#FFFFFF] text-center text-[18px]">
                        No Data To Display
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div> 
      ) : (
        <div style={{ marginTop: "200px", opacity: 0.7 }} className="text-[#FFFFFF] mt-10 text-center text-[18px]">
          No Data To Display
        </div>
      )}
      {polls.length !== 0 && !location.pathname.includes('ar-sk') && (
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {polls.length !== 0 && type !== 'Loksabha' && (
            <div className="flex-col ms-4 justify-start items-center">
              <div className="flex items-center font_proximanova text-[18px] mb-1 font-[600] text-[#FFFFFF]">
                <span>Total Seats</span>{" "}
                <span className="text-[yellow] text-[22px] ms-[1rem]">
                  {selectedState?.state_name === "India"
                    ? 543
                    : selectedState?.mla_seats || total}
                </span>
              </div>
              <div className="font_proximanova flex items-center text-[18px] font-[600] text-[#FFFFFF]">
                <span>Magic Figure</span>{" "}
                <span className="text-[yellow] text-[22px] ms-[1rem]">
                  {selectedState?.state_name === "India"
                    ? 272
                    : Math.floor((selectedState?.mla_seats || total) / 2) + 1}
                </span>
              </div>
            </div>
          )}
          {polls.length !== 0 && location.pathname.includes('in') && location.pathname.includes('ls') && selectedState?.state_name === 'India' && (
            <div className="flex-col ms-4 justify-start items-center">
              <div className="flex items-center font_proximanova text-[18px] mb-1 font-[600] text-[#FFFFFF]">
                <span>Total Seats</span>{" "}
                <span className="text-[yellow] text-[22px] ms-[1rem]">543</span>
              </div>
              <div className="font_proximanova flex items-center text-[18px] font-[600] text-[#FFFFFF]">
                <span>Magic Figure</span>{" "}
                <span className="text-[yellow] text-[22px] ms-[1rem]">272</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultCards;
