import React, { useState } from 'react';
import { json } from '@remix-run/cloudflare';
import { useLoaderData, useNavigate } from '@remix-run/react';
import type { LoaderFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare';
import { getElectionResultsStates } from '~/api';
import { SimpleSelect } from '~/components/ui/SimpleSelect';
import { stateConstant } from '~/components/ElectionsResults/stateConstant';
import AadhanLogo from '~/assets/logo.svg';

export const loader: LoaderFunction = async ({ request, context }: LoaderFunctionArgs) => {
  const { env } = context;
  try {
    const statesData = await getElectionResultsStates();
    return json({ url: request?.url, env, states: statesData?.data || [] });
  } catch (error) {
    console.error('Error fetching states:', error);
    return json({ url: request?.url, env, states: [] });
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "Aadhan | Elections Results" },
    { name: "description", content: "Aadhan Election Results" },
    {
      property: "og:image",
      content: 'https://static.aadhan.in/mainImages/haryana_election_results.jpg',
      itemsprop: 'image',
    },
    {
      property: "og:title",
      content: 'Election Results'
    },
    {
      property: "og:description",
      content: 'Catch the most Anticipated Election results updates on Aadhan!'
    },
    {
      property: "og:type",
      content: 'website'
    },
    {
      property: "og:url",
      content: 'https://elections.aadhan.in',
    },
  ];
};

const ElectionResultsIndex = () => {
  const { states }: any = useLoaderData();
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedElectionType, setSelectedElectionType] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Only Lok Sabha and Assembly as requested
  const electionTypes = [
    { value: 'ls', label: 'Loksabha Election' },
    { value: 'as', label: 'Assembly Election' },
  ];

  const electionYears = [
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ];

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    if (selectedElectionType && selectedYear && value) {
      navigate(`/m/electionResults/${value.toLowerCase()}/${selectedElectionType}?year=${selectedYear}`);
    }
  };

  const handleElectionTypeChange = (value: string) => {
    setSelectedElectionType(value);
    if (selectedState && selectedYear && value) {
      navigate(`/m/electionResults/${selectedState.toLowerCase()}/${value}?year=${selectedYear}`);
    }
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    if (selectedState && selectedElectionType && value) {
      navigate(`/m/electionResults/${selectedState.toLowerCase()}/${selectedElectionType}?year=${value}`);
    }
  };

  // Get state abbreviation from state name using stateConstant
  const getStateAbbreviation = (stateName: string) => {
    // Find the state in stateConstant by matching state_name (case-insensitive)
    const stateEntry = Object.entries(stateConstant).find(
      ([key, value]: [string, any]) =>
        value.state_name.toLowerCase() === stateName.toLowerCase() ||
        value.state_name === stateName
    );
    if (stateEntry) {
      return stateEntry[0].toLowerCase(); // Return the key (abbreviation) in lowercase
    }
    // Fallback: convert state name to lowercase and replace spaces with hyphens
    return stateName.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div>
      <div style={{
        background: "linear-gradient(to right,#36003A,#001251)",
        overflowX: "hidden",
        minHeight: "100vh",
      }}>
        {/* Main Content */}
        <div className="w-full overflow-y-auto">
          <div className="w-full flex flex-col items-center justify-center min-h-screen px-4">
            <div
              style={{
                display: "flex",
                opacity: 0.9,
                justifyContent: "center",
                width: "100%",
                marginBottom: "2rem",
                marginTop: "2rem",
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

            <div className="font_proximanova text-center text-[24px] font-[500] mb-8 text-[#FFFFFF]">
              Election Results
            </div>

            <div className="w-full space-y-6">
              {/* State Dropdown */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Select State
                </label>
                <SimpleSelect
                  value={selectedState}
                  onValueChange={handleStateChange}
                  placeholder="Select a state"
                  options={
                    states && states.length > 0
                      ? states.map((state: any) => ({
                        value: getStateAbbreviation(state.state_name),
                        label: state.state_name,
                      }))
                      : [{ value: '', label: 'No states available' }]
                  }
                  triggerClassName="bg-[#2D053A] text-white border-[#2D053A] hover:bg-[#2D053A]"
                  contentClassName="bg-[#2D053A] text-white border-[#2D053A]"
                  itemClassName="hover:bg-[#2D053A] hover:bg-opacity-30 text-white"
                />
              </div>

              {/* Election Type Dropdown */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Select Election Type
                </label>
                <SimpleSelect
                  value={selectedElectionType}
                  onValueChange={handleElectionTypeChange}
                  placeholder="Select election type"
                  options={electionTypes}
                  triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E]"
                  contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
                  itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
                />
              </div>

              {/* Election Year Dropdown */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Select Election Year
                </label>
                <SimpleSelect
                  value={selectedYear}
                  onValueChange={handleYearChange}
                  placeholder="Select year"
                  options={electionYears}
                  triggerClassName="bg-[#0011326E] text-white border-[#0891B2] hover:bg-[#0011329E]"
                  contentClassName="bg-[#0F172A] text-white border-[#0891B2]"
                  itemClassName="hover:bg-[#0891B2] hover:bg-opacity-30 text-white"
                />
              </div>

              {selectedState && selectedElectionType && selectedYear && (
                <div className="text-center text-white text-sm opacity-70 mt-4">
                  All options selected. Navigating to results...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionResultsIndex;

