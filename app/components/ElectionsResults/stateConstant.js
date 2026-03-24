// State constant mapping for election results
// Maps state abbreviations to state data

export const stateConstant = {
  'AP': { state_name: 'Andhra Pradesh', state_id: 1, state_cd: 'S01' },
  'AR': { state_name: 'Arunachal Pradesh', state_id: 2, state_cd: 'S02' },
  'AS': { state_name: 'Assam', state_id: 3, state_cd: 'S03' },
  'BR': { state_name: 'Bihar', state_id: 4, state_cd: 'S04' },
  'CT': { state_name: 'Chhattisgarh', state_id: 5, state_cd: 'S05' },
  'GA': { state_name: 'Goa', state_id: 6, state_cd: 'S06' },
  'GJ': { state_name: 'Gujarat', state_id: 7, state_cd: 'S07' },
  'HR': { state_name: 'Haryana', state_id: 8, state_cd: 'S08' },
  'HP': { state_name: 'Himachal Pradesh', state_id: 9, state_cd: 'S09' },
  'JH': { state_name: 'Jharkhand', state_id: 10, state_cd: 'S10' },
  'KA': { state_name: 'Karnataka', state_id: 11, state_cd: 'S11' },
  'KL': { state_name: 'Kerala', state_id: 12, state_cd: 'S12' },
  'MH': { state_name: 'Maharashtra', state_id: 12, state_cd: 'S13' },
  'MP': { state_name: 'Madhya Pradesh', state_id: 13, state_cd: 'S14' },
  'MN': { state_name: 'Manipur', state_id: 14, state_cd: 'S15' },
  'ML': { state_name: 'Meghalaya', state_id: 15, state_cd: 'S16' },
  'MZ': { state_name: 'Mizoram', state_id: 16, state_cd: 'S17' },
  'NL': { state_name: 'Nagaland', state_id: 17, state_cd: 'S18' },
  'OR': { state_name: 'Odisha', state_id: 18, state_cd: 'S19' },
  'PB': { state_name: 'Punjab', state_id: 19, state_cd: 'S20' },
  'RJ': { state_name: 'Rajasthan', state_id: 20, state_cd: 'S21' },
  'SK': { state_name: 'Sikkim', state_id: 21, state_cd: 'S22' },
  'TN': { state_name: 'Tamil Nadu', state_id: 22, state_cd: 'S23' },
  'TG': { state_name: 'Telangana', state_id: 23, state_cd: 'S24' },
  'TR': { state_name: 'Tripura', state_id: 24, state_cd: 'S25' },
  'UP': { state_name: 'Uttar Pradesh', state_id: 25, state_cd: 'S26' },
  'UK': { state_name: 'Uttarakhand', state_id: 26, state_cd: 'S27' },
  'WB': { state_name: 'West Bengal', state_id: 27, state_cd: 'S28' },
  'DL': { state_name: 'Delhi', state_id: 9, state_cd: 'S09' },
  'IN': { state_name: 'India', state_id: -1, state_cd: -1 },
};

export const abbreviation = {
  'andhra-pradesh': 'AP',
  'arunachal-pradesh': 'AR',
  'assam': 'AS',
  'bihar': 'BR',
  'chhattisgarh': 'CT',
  'goa': 'GA',
  'gujarat': 'GJ',
  'haryana': 'HR',
  'himachal-pradesh': 'HP',
  'jharkhand': 'JH',
  'karnataka': 'KA',
  'kerala': 'KL',
  'maharashtra': 'MH',
  'madhya-pradesh': 'MP',
  'manipur': 'MN',
  'meghalaya': 'ML',
  'mizoram': 'MZ',
  'nagaland': 'NL',
  'odisha': 'OR',
  'punjab': 'PB',
  'rajasthan': 'RJ',
  'sikkim': 'SK',
  'tamil-nadu': 'TN',
  'telangana': 'TG',
  'tripura': 'TR',
  'uttar-pradesh': 'UP',
  'uttarakhand': 'UK',
  'west-bengal': 'WB',
  'delhi': 'DL',
  'in': 'IN',
};

export const validateRoute = (stateName, electionType) => {
  if (!stateName || !electionType) return false;
  const validElectionTypes = ['as', 'ls', 'all'];
  return validElectionTypes.includes(electionType);
};

