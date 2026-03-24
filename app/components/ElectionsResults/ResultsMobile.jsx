import React, { useEffect, useRef, useState, useMemo } from "react";
import { getElectionResultsStates, fetchResults } from "~/api";
import ResultCards from "./ResultCards";
import { useLocation, useNavigate, useParams } from "@remix-run/react";
import { Loader2, ArrowLeft } from "lucide-react";
import { stateConstant } from "./stateConstant";
import AadhanLogo from "~/assets/logo.svg";
import { SimpleSelect } from "~/components/ui/SimpleSelect";

const Results = () => {

  const [WebSocketData, setWebSocketData] = useState(null);
  const [combinedState, setCombinedState] = useState([]);
  const [allState, setAllState] = useState([]);
  const [activeTab, setActiveTab] = useState("Assembly");
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedStateKey, setSelectedStateKey] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [magicFigure, setMagicFigure] = useState(273);
  const location = useLocation();
  const navigate = useNavigate();
  const party = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user_info") || "{}")?.party_id : undefined;

  const [isRoute, setIsRoute] = useState(true);
  const ws = useRef(null);
  const fetchInterval = useRef(null);

  useEffect(() => {
    // Extract year from URL query params
    const searchParams = new URLSearchParams(location.search);
    const yearFromUrl = searchParams.get("year");
    if (yearFromUrl) {
      setSelectedYear(yearFromUrl);
    }

    // default selection mode (Assembly) when no params are provided
    if (!selectedType) {
      setSelectedType("as");
      setActiveTab("Assembly");
    } else if (selectedType === "ls") {
      setActiveTab("Loksabha");
    } else {
      setActiveTab("Assembly");
    }
  }, [location.pathname, location.search, selectedType]);

  const fetchExitPollsData = async () => {
    try {
      const polls = await fetchResults();
      setCombinedState(polls || []);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  useEffect(() => {
    const initializeWebSocket = () => {
      ws.current = new WebSocket(
        "wss://election-worker.aadhan.workers.dev/subscribe/electionresults"
      );
      ws.current.onopen = () => {
        console.log("ws connection opened");
      };
      ws.current.onmessage = (event) => {
        const wsdata = event.data;
        const wsData = JSON.parse(wsdata);
        setWebSocketData(wsData?.data);
      };
      ws.current.onclose = (event) => {
        if (event.wasClean) {
          console.log(
            `WebSocket connection closed cleanly, code=${event.code}, reason=${event.reason}`
          );
        } else {
          console.error(`WebSocket connection abruptly closed`);
        }
      };
      ws.current.onerror = (error) => {
        console.error(`WebSocket error:`, error);
      };
    };

    initializeWebSocket();

    fetchInterval.current = setInterval(() => {
      if (!WebSocketData) {
        fetchExitPollsData();
      }
    }, 60000);

    return () => {
      clearInterval(fetchInterval.current);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [WebSocketData]);

  useEffect(() => {
    if (WebSocketData) {
      setCombinedState(WebSocketData);
    } else {
      fetchExitPollsData();
    }
  }, [WebSocketData]);

  useEffect(() => {
    // derive key to use from local selection
    const key = selectedStateKey;
    if (allState.length > 0 && key && isRoute) {
      if (key === "in") {
        setSelectedOption({ state_name: "India", state_id: -1, state_cd: -1 });
      } else {
        const stateKey = key.toUpperCase();
        let foundState = allState.find((e) => {
          const stateAbbrev = Object.keys(stateConstant).find(
            (k) => stateConstant[k].state_name === e.state_name
          );
          return stateAbbrev?.toLowerCase() === key.toLowerCase();
        });
        if (!foundState && stateConstant[stateKey]) {
          foundState = allState.find(
            (e) => e.state_id === stateConstant[stateKey]?.state_id
          );
        }
        if (!foundState) {
          foundState = allState.find(
            (e) =>
              e.state_name.toLowerCase().replace(/\s+/g, "-") ===
              key.toLowerCase() ||
              e.state_name.toLowerCase() === key.toLowerCase()
          );
        }
        if (foundState) {
          setSelectedOption(foundState);
        }
      }
    }
  }, [allState, selectedStateKey, isRoute]);

  async function getStateData() {
    try {
      const data = await getElectionResultsStates();
      const updatedData = data?.data?.map((e) => ({
        ...e,
        label: e.state_name,
      }));
      setAllState(updatedData || []);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  }

  useEffect(() => {
    getStateData();
  }, []);

  // Get state display name
  const getStateDisplayName = () => {
    const effectiveState = selectedStateKey;
    if (effectiveState === "in") return "India";
    if (selectedOption?.state_name) return selectedOption.state_name;
    if (effectiveState && stateConstant[effectiveState.toUpperCase()]?.state_name) {
      return stateConstant[effectiveState.toUpperCase()].state_name;
    }
    return "Election Results";
  };

  const electionTypes = useMemo(
    () => [
      { value: "ls", label: "Loksabha Election" },
      { value: "as", label: "Assembly Election" },
    ],
    []
  );

  const electionYears = useMemo(
    () => [
      { value: "2025", label: "2025" },
      { value: "2026", label: "2026" },
    ],
    []
  );

  const getStateAbbreviation = (name) => {
    const entry = Object.entries(stateConstant).find(
      ([, value]) =>
        value.state_name.toLowerCase() === name.toLowerCase() ||
        value.state_name === name
    );
    return entry ? entry[0].toLowerCase() : name.toLowerCase().replace(/\s+/g, "-");
  };

  const stateOptions = useMemo(
    () =>
      allState?.map((s) => ({
        value: getStateAbbreviation(s.state_name),
        label: s.state_name,
      })) || [],
    [allState]
  );

  const handleStateChange = (value) => {
    setSelectedStateKey(value);
    // if we already loaded states, set selected option immediately
    const found = stateOptions.find((s) => s.value === value);
    if (found) {
      const match = allState.find(
        (e) => e.state_name.toLowerCase() === found.label.toLowerCase()
      );
      if (match) setSelectedOption(match);
    }
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    if (value === "ls") setActiveTab("Loksabha");
    else setActiveTab("Assembly");
  };

  const handleYearChange = (value) => {
    setSelectedYear(value);
    // Update URL with year query parameter
    const searchParams = new URLSearchParams(location.search);
    if (value) {
      searchParams.set("year", value);
    } else {
      searchParams.delete("year");
    }
    const newSearch = searchParams.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ""}`, { replace: true });
  };

  // Show selection UI when no selection yet
  const effectiveState = selectedStateKey;
  const effectiveType = selectedType;
  const effectiveYear = selectedYear;

  if (!effectiveState || !effectiveType || !effectiveYear || !isRoute) {
    return (
      <div
        className="w-full px-4 py-6 sm:px-6 space-y-6 h-screen"
        style={{
          background: "linear-gradient(to right, #36003A, #001251)",
          overflowX: "hidden",
        }}
      >
        {/* Back Button */}
        {party && (
          <div className="mb-4">
            <button
              onClick={() => navigate(`/elections/reports`)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Reports</span>
            </button>
          </div>
        )}
        {/* Top-left dropdowns - horizontal layout */}
        <div className="flex flex-row gap-3 ">
          {/* <SimpleSelect
            value={effectiveState || ""}
            onValueChange={handleStateChange}
            placeholder="Select state"
            options={stateOptions}
            triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E] min-w-[180px]"
            contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
            itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
          /> */}
          {/* <SimpleSelect
            value={effectiveType || ""}
            onValueChange={handleTypeChange}
            placeholder="Select election type"
            options={electionTypes}
            triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E] min-w-[150px]"
            contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
            itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
          /> */}
          {/* <SimpleSelect
            value={effectiveYear || ""}
            onValueChange={handleYearChange}
            placeholder="Select year"
            options={electionYears}
            triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E] min-w-[120px]"
            contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
            itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
          /> */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* LIVE Badge */}
            {/* <svg
              width="96"
              height="32"
              viewBox="0 0 96 32"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-3"
            >
              <rect width="96" height="32" rx="16" fill="#E10600" />
              <circle cx="18" cy="16" r="4" fill="#FFFFFF">
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              </circle>
              <text
                x="30"
                y="21"
                fill="#FFFFFF"
                fontSize="14"
                fontWeight="600"
                fontFamily="Arial, Helvetica, sans-serif"
                letterSpacing="0.6"
              >
                LIVE
              </text>
            </svg> */}


          </div>

        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "7.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              opacity: 0.9,
              justifyContent: "center",
              width: "100%",
              marginBottom: 2
            }}
          >
            {/* <img
              src={AadhanLogo}
              alt="logo"
              style={{
                width: "8rem",
              }}
            /> */}
          </div>


          {/* Text */}
          <div className="font_proximanova text-[24px] font-[500] text-[#FFFFFF]">
            Stay Tuned — Live Election Results Will Appear Here
          </div>



          {/* <div className="text-[18px] text-center text-[#FFFFFF] mt-10 opacity-70">
            Please select a state, election type, and year to view results
          </div> */}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full px-4 py-6 sm:px-6 space-y-6 h-screen"
      style={{
        background: "linear-gradient(to right, #36003A, #001251)",
        overflowX: "hidden",
      }}
    >
      {/* Back Button */}
      {party && (
        <div className="mb-4">
          <button
            onClick={() => navigate(`/elections/reports`)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </button>
        </div>
      )}
      {/* Top-left dropdowns - horizontal layout */}
      <div className="flex flex-row gap-3">
        <SimpleSelect
          value={effectiveState || ""}
          onValueChange={handleStateChange}
          placeholder="Select state"
          options={stateOptions}
          triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E] min-w-[180px]"
          contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
          itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
        />
        <SimpleSelect
          value={effectiveType || ""}
          onValueChange={handleTypeChange}
          placeholder="Select election type"
          options={electionTypes}
          triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E] min-w-[150px]"
          contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
          itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
        />
        <SimpleSelect
          value={effectiveYear || ""}
          onValueChange={handleYearChange}
          placeholder="Select year"
          options={electionYears}
          triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E] min-w-[120px]"
          contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
          itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: "7.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            opacity: 0.9,
            justifyContent: "center",
            width: "100%",
            marginBottom: 2,
          }}
        >
          <img
            src={AadhanLogo}
            alt="logo"
            style={{
              width: "8rem",
            }}
          />
        </div>
        <div className="font_proximanova text-center text-[24px] font-[500] mt-4 mb-4 text-[#FFFFFF]">
          {getStateDisplayName()} Election Results
        </div>

        {combinedState.length === 0 ? (
          <div className="text-[18px] text-center text-[#FFFFFF] mt-10 opacity-70">
            Loading results...
          </div>
        ) : (
          <div style={{ width: "100%" }}>
            <ResultCards
              magicFigure={magicFigure}
              setMagicFigure={setMagicFigure}
              type={activeTab}
              data={combinedState}
              selectedState={selectedOption}
              selectedYear={selectedYear}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
