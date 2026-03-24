import axiosInstance from "~/utils/axios";
import axios from 'axios';
// app/api.js


export { getPublicTicketThread, addPublicTicketReply } from './utils/GrievanceService.js';

const LOCAL_CMS_URL = 'http://127.0.0.1:8000/'

const domain = 'https://electionapi.aadhan.in/'
// const domain = 'http://0.0.0.0:8080/'




const Cms_domain = 'https://stage-cmsapis.aadhan.in/';

const cms_live = "cmsapis.aadhan.in"









export const enableNotification = async (aadhanId) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const url = `https://${cms_live}/enable-notification?aadhan_id=${aadhanId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data; // Return the original response data
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to enable notification');
    }
  } catch (error) {
    console.error('Error enabling notification:', error.message);
    throw error;
  }
};

export async function checkNotificationStatus(aadhanId) {
  try {
    const response = await fetch(`https://${cms_live}/notification/check?aadhan_id=${aadhanId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // Process the response according to the format you provided
    return {
      enabled: data.status === 'registered_for_today' || data.notification_enabled === true,
      status: data.status,
      registration_date: data.registration_date || null,
      message: data.message || null,
      needs_renewal: data.status === 'expired' || false
    };
  } catch (error) {
    console.error('Error checking notification status:', error);
    throw error;
  }
}


export const enableResultsNotification = async (aadhanId) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const url = `https://${cms_live}/enable-results?aadhan_id=${aadhanId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data; // success response
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to enable notification');
    }
  } catch (error) {
    console.error('Error enabling notification:', error.message);
    throw error;
  }
};



// In your Testapi.js file or wherever your API functions are defined
export async function checkResultsNotificationStatus(aadhanId) {
  try {
    const response = await fetch(`https://${cms_live}/result/check?aadhan_id=${aadhanId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return {
      enabled: data.status === 'enabled' || data.status === 'already_registered',
    };
  } catch (error) {
    console.error('Error checking notification status:', error);
    throw error;
  }
}


export const getBoothWiseVoters = async (

  assemblyConstituencyNo,
  pollingBoothNo,
  name = null
) => {
  try {
    const params = {
      assembly_constituency_no: assemblyConstituencyNo,
      polling_booth_no: pollingBoothNo,
    };
    if (name) params.name = name;

    const response = await axiosInstance.get(
      `${domain}elections/election-website/voters`,
      {
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        params,
      }
    );

    // Returns array of Voter objects
    return response.data;
  } catch (error) {
    console.error(
      'Error fetching booth-wise voters:',
      error.response?.data || error.message
    );
    return [];
  }
};




export const getPollingBoothCounts = async () => {
  try {
    const response = await axiosInstance.get(`${domain}elections/election-portal/booth-counts`, {
      headers: {
        // 'Authorization': `Bearer YOUR_API_KEY` if needed
      }
    });


    return response.data;
  } catch (error) {
    console.error('Error fetching booth counts:', error);
    throw error;
  }
};





// In your API file
export const getPartyeditedVoters = async (constituencyNo, boothNo, party) => {


  const response = await axiosInstance.get(`${domain}elections/election-website/voters/by-booth`, {
    params: {
      constituency_no: constituencyNo,
      booth_no: boothNo,
      party: party  // This ensures party-specific edits are applied
    },
  });


  return response.data;
};


export const getFamilyList = async (stateId, constituencyNo, boothNo) => {
  const response = await axiosInstance.get(`${domain}elections/election-portal/voters/by-family`, {
    params: {
      state_id: stateId,
      constituency_no: constituencyNo,
      booth_no: boothNo,
    },
  });
  return response.data;
};



// app/api.js
export const updateVoterByParty = async (voterId, updateData) => {
  try {
    const response = await axiosInstance.put(
      `/elections/election-portal/voter/${voterId}`,
      updateData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message;

    if (status === 403) {
      throw new Error("You do not have permission to edit voters.");
    } else if (status === 404) {
      throw new Error("Voter not found.");
    } else if (status === 400) {
      throw new Error(detail || "Invalid update data provided.");
    } else {
      console.error("Error updating voter:", status, detail);
      throw new Error(detail || "Failed to update voter.");
    }
  }
};






export const getFovoriteVotersEdited = async ({
  page = 1,
  limit = 10,
  constituency_no = null,
  booth_no = null,
  search = "",
  gender = null,
  age_range = null,
}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    if (constituency_no !== null && constituency_no !== undefined) {
      params.append("constituency_no", constituency_no.toString());
    }
    if (booth_no !== null && booth_no !== undefined) {
      params.append("booth_no", booth_no.toString());
    }
    if (search) {
      params.append("search", search);
    }
    if (gender) {
      params.append("gender", gender);
    }
    if (age_range) {
      params.append("age_range", age_range);
    }

    const response = await axiosInstance.get(
      `/elections/election-portal/favorite-voters/my-edits?${params.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || error.message;

    if (status === 400) {
      throw new Error(detail || "Invalid request parameters.");
    } else if (status === 401) {
      throw new Error("User ID not found. Please ensure you are authenticated.");
    } else {
      console.error("Error fetching edited voters:", status, detail);
      throw new Error(detail || "Failed to fetch edited voters.");
    }
  }
};

export const getBoothWiseVotersByParty = async (
  constituencyNo,
  boothNo,
  page = '',
  limit = 750,
  search = '',
  gender = '',
  ageRange = ''
) => {
  try {
    // 👇 fetch the token (assumes you stored it at login)
    const token = localStorage.getItem("token");

    const response = await axiosInstance.get(
      `${domain}elections/election-portal/voters/by-booth`,
      {
        params: {
          constituency_no: constituencyNo,
          booth_no: boothNo,
          page,
          limit,
          search,
          ...(gender && { gender }),
          ...(ageRange && { age_range: ageRange }),
        },
        headers: {
          Authorization: `Bearer ${token}`, // 👈 REQUIRED
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching booth-wise voters:", error);
    throw error;
  }
};








export const getVotersByEntireAssemblyConstituency = async (
  assemblyConstituencyNo,
  page = 1,
  limit = 100,
  search = '',
  gender = '',
  ageRange = ''
) => {
  try {


    const params = {
      assembly_constituency_no: assemblyConstituencyNo,
      page,
      limit,
    };
    if (search) params.search = search;
    if (gender) params.gender = gender;
    if (ageRange) params.age_range = ageRange;

    const response = await axiosInstance.get(
      `${domain}elections/election-portal/voters/by-assembly`,
      {
        params

      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching voters by assembly:", error);
    throw error;
  }
};


export const getStates = async () => {
  try {
    const response = await axiosInstance.get(`${domain}elections/election-website/states`, {
      headers: {
        // 'Authorization': `Bearer YOUR_API_KEY` if needed
      }
    });


    return response.data;
  } catch (error) {
    console.error('Error fetching states:', error);
    throw error;
  }
};



export const getElectionStates = async () => {
  try {
    const response = await axiosInstance.get(`${domain}elections/election-portal/states`, {
      headers: {
        // 'Authorization': `Bearer YOUR_API_KEY` if needed
      }
    });


    return response.data;
  } catch (error) {
    console.error('Error fetching states:', error);
    throw error;
  }
};






// export async function createCustomField({
//   party_id,
//   field_name,
//   question_type = "text", // default fallback
//   choices = null,
// }) {
//   const response = await axiosInstance.post(
//     `${domain}elections/election-portal`,
//     {
//       party_id: Number(party_id), // ensure backend gets an int
//       field_name,
//       question_type,
//       choices,
//     }

//   );
//   return response.data; // { id, field_name, party_id, question_type, choices }
// }

// ✅ Get all custom fields for a party
export async function getCustomFieldsByParty(partyId) {
  const response = await axiosInstance.get(
    `${domain}elections/election-portal/${partyId}`
  );
  return response.data; // Array of { id, field_name, party_id, question_type, choices }
}




export const getAssemblyConstituencies = async (stateId) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/`,
      {
        params: { state_id: stateId },
        headers: {
          // 'Authorization': `Bearer YOUR_API_KEY` if required
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching assembly constituencies:", error);
    throw error;
  }
};


export const getPartyWiseResults = async ({ state_id, constituency_id, election_type, election_year }) => {
  try {
    const res = await axiosInstance.get(`${domain}elections/assembly-analysis`, {
      params: {
        state_id,
        constituency_id,
        election_type,
        election_year,
      },
    });

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching party-wise results:", status, detail);
    throw error;
  }
};


export const getPartyCandidates = async (stateId, constituencyId, electionType, electionYear) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/election-portal/`,
      {
        params: {
          state_id: stateId,
          constituency_id: constituencyId,
          election_type: electionType,
          election_year: electionYear,
        },
      }
    );

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching party candidates:", status, detail);
    throw error;
  }
};


export const getBoothStrengths = async (electionId = "TNAC2021", constituencyId = 1) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/party-wise-resultsbooth-strengths`,
      {
        params: {
          election_id: electionId,       // e.g. "TNAC2021"
          constituency_id: constituencyId, // e.g. 1
        },
      }
    );

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching booth strengths:", status, detail);
    throw error;
  }
};




export const BoothAnalysis = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/booth-analysis`,
      {
        params: {
          election_id: params.election_id || "TNAC2021",
          constituency_id: params.constituency_id || 1,
        },
      }
    );


    return response.data;
  } catch (error) {
    console.error("Error fetching booth analysis:", error);
    throw error;
  }
};




export const BoothAnalysisLoksabha = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/booth-analysis-loksabha`,
      {
        params: {
          election_id: params.election_id || "TNGELS2024",
          constituency_id: params.constituency_id || 1,
        },
      }
    );


    return response.data;
  } catch (error) {
    console.error("Error fetching booth analysis:", error);
    throw error;
  }
};



export const BoothCounts = async ({ state_id = null, constituency_id = null } = {}) => {
  try {
    const params = {};
    if (state_id !== null) params.state_id = state_id;
    if (constituency_id !== null) params.constituency_id = constituency_id;

    const response = await axiosInstance.get(
      `${domain}elections/party-wise-results/booth-counts`,
      { params }
    );


    return response.data;
  } catch (error) {
    console.error("Error fetching booth counts:", error);
    throw error;
  }
};


export const BoothForm20 = async ({ state_id = null, constituency_id = null } = {}) => {
  try {
    const params = {};
    if (state_id !== null) params.state_id = state_id;
    if (constituency_id !== null) params.constituency_id = constituency_id;

    const response = await axiosInstance.get(
      `${domain}elections/election-portal/form20`, // Updated endpoint name
      { params }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching booth counts:", error);
    throw error;
  }
};



// 1. Booth Vote Range API
export const getBoothVoteRange = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/${params.constituency_id || 1}/booth-vote-range-assembly`,
      {
        params: {
          range: params.range || "100-200",
          parties: params.parties, // optional array
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching booth vote range:", error);
    throw error;
  }
};

// 2. Party Ranks API
export const getPartyRanks = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/${params.constituency_id || 1}/party-ranks`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching party ranks:", error);
    throw error;
  }
};

// 3. Difficult Booths Between Parties API
export const getDifficultBoothsBetween = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/${params.constituency_id}/difficult-booths-between`,
      {
        params: {
          party_a: params.party_a || "AIADMK",
          party_b: params.party_b || "DMK",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching difficult booths analysis:", error);
    throw error;
  }
};



// 1. State-wise Lok Sabhas API
export const getStateWiseLokSabhas = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/lok_sabha_analysis/state-wise-lok-sabhas`,
      { params } // passes { state_id: 21 } etc.
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching state-wise Lok Sabhas:", error);
    throw error;
  }
};




// 1. State-wise Lok Sabhas API
export const getLokSabhaswiseAssemblies = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/lok_sabha_analysis/state-wise-lok-sabhas`,
      { params } // passes { state_id: 21 } etc.
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching state-wise Lok Sabhas:", error);
    throw error;
  }
};




// 1. Lok Sabha-wise Aggregated Totals API
export const getLokSabhaAnalysis = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/lok_sabha_analysis/lok-sabha-wise`,
      { params } // Pass params like { state_id: 21, lok_sabha_no: 1 }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching Lok Sabha-wise aggregates:", error);
    throw error;
  }
};





export const getPartyWiseResultsLokabha = async ({ state_id, lok_sabha_no, election_type, election_year }) => {
  try {
    const res = await axiosInstance.get(`${domain}elections/lok_sabha_analysis/state-loksabha-aggregation`, {
      params: {
        state_id,
        lok_sabha_no,
        election_type,
        election_year,
      },
    });

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching party-wise results:", status, detail);
    throw error;
  }
};




export const getPartyWiseResultsLoksabha = async ({ state_id, constituency_id, election_type, election_year }) => {
  try {
    const res = await axiosInstance.get(`${domain}elections/lok_sabha_analysis`, {
      params: {
        state_id,
        constituency_id,
        election_type,
        election_year,
      },
    });

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching party-wise results:", status, detail);
    throw error;
  }
};



// app/api.js



export const loginUser = async (email, password) => {
  const url = `${domain}auth/login`;

  try {
    const response = await axiosInstance.post(url, { email, password });
    if (response.status === 200) {
      // Store JWT token in localStorage
      const { access_token, user_info } = response?.data;
      localStorage.setItem('token', access_token);
      return { success: true, data: user_info, token: access_token };
    } else {
      return { success: false, detail: 'Login failed' };
    }
  } catch (error) {
    console.error('Login failed:', error);

    // Extract the error detail from the API response
    let errorDetail = 'An error occurred';

    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      // Handle array of validation errors (FastAPI/Pydantic format)
      if (Array.isArray(detail)) {
        // Extract the first error message
        errorDetail = detail[0]?.msg || 'Invalid input provided';
      }
      // Handle single error object
      else if (typeof detail === 'object' && detail !== null && detail.msg) {
        errorDetail = detail.msg;
      }
      // Handle string error
      else if (typeof detail === 'string') {
        errorDetail = detail;
      }
    } else if (error.message) {
      errorDetail = error.message;
    }

    return {
      success: false,
      detail: errorDetail
    };
  }
};

export const loginUserV2 = async (email, password) => {
  const url = `${domain}auth/login-v2`;

  try {
    const response = await axiosInstance.post(url, { email, password });
    if (response.status === 200) {
      // Store JWT token in localStorage
      const { access_token, user_info } = response?.data;
      localStorage.setItem('token', access_token);
      return { success: true, data: user_info, token: access_token };
    } else {
      return { success: false, detail: 'Login failed' };
    }
  } catch (error) {
    console.error('Login failed:', error);

    // Extract the error detail from the API response
    let errorDetail = 'An error occurred';

    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;

      // Handle array of validation errors (FastAPI/Pydantic format)
      if (Array.isArray(detail)) {
        // Extract the first error message
        errorDetail = detail[0]?.msg || 'Invalid input provided';
      }
      // Handle single error object
      else if (typeof detail === 'object' && detail !== null && detail.msg) {
        errorDetail = detail.msg;
      }
      // Handle string error
      else if (typeof detail === 'string') {
        errorDetail = detail;
      }
    } else if (error.message) {
      errorDetail = error.message;
    }

    return {
      success: false,
      detail: errorDetail
    };
  }
};

// Forgot Password API
export const forgotPassword = async (emailData) => {
  try {
    const response = await axiosInstance.post(
      `${domain}auth/forgot-password`,
      emailData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error sending forgot password request:",
      error.response?.data || error.message
    );
    throw error;
  }
};


// Reset Password API
export const resetPassword = async (resetData) => {
  try {
    const response = await axiosInstance.post(
      `${domain}auth/reset-password`,
      resetData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error resetting password:",
      error.response?.data || error.message
    );
    throw error;
  }
};




// 2. Fetch User's Dashboard Data
export const fetchUserData = async () => {
  const url = `${domain}auth/me`;  // You can create an API that fetches the current user data based on the JWT

  try {
    const response = await axiosInstance.get(url);
    return response?.data;  // This will include the user's role, assigned constituencies, etc.
  } catch (error) {
    console.error('Failed to fetch user data:', error.message);
    throw error;
  }
};



export const updateUserProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put(
      `${domain}auth/update-profile`,
      profileData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error updating user profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};




export const updateUserProfilePicture = async (userId, file) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.put(
      `${domain}auth/users/${userId}/profile-picture`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error updating user profile picture:",
      error.response?.data || error.message
    );
    throw error;
  }
};


export const getUserProfilePicture = async (userId) => {
  try {
    const response = await axiosInstance.get(
      `${domain}auth/users/${userId}/get-picture`
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user profile picture:",
      error.response?.data || error.message
    );
    throw error;
  }
};




// 3. Fetch Assigned Constituencies for the Logged-in Agent
export const fetchAssignedConstituencies = async () => {
  const url = `${domain}elections/assigned-constituencies`;  // You can define this API to return assigned constituencies for the agent

  try {
    const response = await axiosInstance.get(url);
    return response?.data;  // List of constituencies assigned to the logged-in agent
  } catch (error) {
    console.error('Error fetching assigned constituencies:', error.message);
    throw error;
  }
};








export const getBoothVoteRangeLoksabha = async ({
  constituency_id,
  election_type = "loksabha_elections",
  election_year,
  range,
  parties, // array or string
}) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/lok_sabha_analysis/${constituency_id}/booth-vote-range-loksabha`,
      {
        params: {
          election_type,
          election_year,
          range,
          parties: Array.isArray(parties) ? parties.join(",") : parties,
        },
      }
    );

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching booth vote range:", status, detail);
    throw error;
  }
};







export const getBoothVoteRangeAssembly = async ({
  constituency_id,
  election_type = "assembly_elections",
  election_year,
  range,
  parties, // array or string
}) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/assembly-analysis/${constituency_id}/booth-vote-range-assembly`,
      {
        params: {
          election_type,
          election_year,
          range,
          parties: Array.isArray(parties) ? parties.join(",") : parties,
        },
      }
    );

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching booth vote range:", status, detail);
    throw error;
  }
};




export const getParties = async ({ state_id, constituency_id }) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/assembly-analysis/parties`,
      {
        params: {
          state_id,
          constituency_id,
        },
      }
    );

    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching state constituency parties:", status, detail);
    throw error;
  }
};




export const createOrganization = async ({
  name,
  organization_name,
  age,
  gender,
  email,
  password,
  state_id,
  state_name,
  party_id,
}) => {
  const payload = {
    name,
    organization_name,
    age: Number(age),
    gender,
    email,
    password,
    state_id: String(state_id),
    state_name: state_name || "",
    party_id: String(party_id),
  };

  try {
    const res = await axiosInstance.post("/auth/register", payload);
    return res.data; // { msg, organization_id }
  } catch (error) {
    console.error("Create organization failed:", error);

    let errorMessage = "Failed to create organization";

    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;

      // Handle array of validation errors
      if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail[0]?.msg || "Invalid input provided";
      }
      // Handle single error object
      else if (typeof detail === "object" && detail !== null && detail.msg) {
        errorMessage = detail.msg;
      }
      // Handle string error
      else if (typeof detail === "string") {
        errorMessage = detail;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    const errorWithMessage = new Error(errorMessage);
    errorWithMessage.response = error.response;
    throw errorWithMessage;
  }
};




export const inviteAgent = async (data) => {
  try {
    const response = await axiosInstance.post(
      `${domain}auth/invite-agent`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Invite agent error:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const listInvites = async () => {
  const response = await axiosInstance.get(`/auth/invites`);
  return response.data // unchanged shape
};

// Revoke invite (also uses axiosInstance)
export const revokeInvite = async (jti) => {
  const response = await axiosInstance.post(`/auth/revoke-invite/${jti}`, {});
  return response.data;
};


// Accept invite (public; Authorization not required)
export const acceptInvite = async ({ name, age, gender, password, token }) => {
  const res = await axiosInstance.post('/auth/accept-invite', {
    name,
    age: Number(age),
    gender,
    password,
    token,
  });
  return res.data; // { msg: "..."} on success
};





// 1. Create a custom field for organization
export const createCustomField = async (fieldData) => {
  try {
    const response = await axiosInstance.post(
      `${domain}elections/election-portal`,
      fieldData
    );
    return response.data
  } catch (error) {
    console.error("Error creating custom field:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// 2. Get all custom fields for current user's organization (with optional party filter)
export const getOrganizationCustomFields = async (partyId = null) => {
  try {
    const params = {};
    if (partyId !== null) {
      params.party_id = partyId;
    }

    const response = await axiosInstance.get(
      `${domain}elections/election-portal`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching organization custom fields:", error.response?.data || error.message);
    throw error;
  }
};

// 3. Get custom fields for a specific organization by ID
export const getCustomFieldsByOrganizationId = async (organizationId) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/election-portal/organization/${organizationId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching custom fields by organization ID:", error.response?.data || error.message);
    throw error;
  }
};






export const getInvitationStats = async (assemblyConstituencyId, params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/voters-invitations/invitations/stats/${assemblyConstituencyId}`,
      { params }
    );
    return response?.data;
  } catch (error) {
    console.error("Error fetching invitation stats:", error);
    throw error;
  }
};

export const getCandidates = async () => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/voters-invitations/candidates/`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};

// You can add more API functions as needed, e.g., for sending invitations
export const sendBulkInvitations = async (data) => {
  try {
    const response = await axiosInstance.post(
      `${domain}elections/voters-invitations/invitations/send-bulk`,
      data
    );
    return response.data;
  } catch (error) {
    console.error("Error sending bulk invitations:", error);
    throw error;
  }
};


export const getUsersByConstituency = async (assemblyConstituencyId, candidateId = null) => {
  try {
    // Build URL with optional candidate_id query parameter
    let url = `${domain}elections/voters-invitations/users/constituency/${assemblyConstituencyId}`;

    if (candidateId) {
      url += `?candidate_id=${candidateId}`;
    }

    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching users for constituency ${assemblyConstituencyId}:`, error);
    throw error;
  }
};


export const createUsersBulkFile = async (formData) => {
  try {
    const response = await axiosInstance.post(
      `${domain}elections/voters-invitations/users/bulk-file`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error uploading bulk file:", error);
    throw error.response?.data?.detail || error.message;
  }
};

//download pdf log api

export const logPDFDownload = async (downloadData) => {
  try {
    const response = await fetch(`${domain}elections/pdf/pdf-downloads/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(downloadData),
    });

    if (!response.ok) {
      throw new Error("Failed to log PDF download");
    }

    return await response.json();
  } catch (error) {
    console.error("Error logging PDF download:", error);
    throw error;
  }
};



// 2. Booth Vote Range (Default Bins) API
export const getBoothVoteRangeDefaultBins = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/${params.constituency_id || 1}/booth-vote-range-assembly/default-bins`,
      {
        params: {
          parties: params.parties, // optional array of party names
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching default bin booth vote range:", error);
    throw error;
  }
};



export const getBoothVoteRangeDefaultBinsLoksabha = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/assembly-analysis/${params.constituency_id || 1}/booth-vote-range-loksabha/default-bins-loksabha`,
      {
        params: {
          parties: params.parties, // optional array of party names
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching default bin booth vote range:", error);
    throw error;
  }
};






export const createWhatsAppTemplate = async (params = {}) => {
  try {
    const response = await axiosInstance.post(
      `${domain}elections/msg91-whatsapp-template/create-template`,
      {
        integrated_number: params.integrated_number || "917997993374",
        template_name: params.template_name || "",
        language: params.language || "en",
        category: params.category || "MARKETING",
        button_url: params.button_url || false,
        components: params.components || [],
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error creating WhatsApp template:", error);
    throw error;
  }
};




export const updateWhatsAppTemplate = async (templateId, params = {}) => {
  try {
    const response = await axiosInstance.put(
      `${domain}elections/msg91-whatsapp-template/update-template/${templateId}`,
      {
        integrated_number: params.integrated_number || "917997993374",
        components: params.components || [],
        button_url: params.button_url || false,
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error updating WhatsApp template:", error);
    throw error;
  }
};


// ~/api/whatsappTemplates.js   (or wherever your API file lives)

export const getWhatsAppTemplates = async (params = {}) => {
  try {
    // ----> number is part of the URL path, not a query param
    const url = `${domain}elections/msg91-whatsapp-template/templates/${params.integrated_number || "917997993374"}`;

    const response = await axiosInstance.get(url, {
      params: {
        template_name: params.template_name || "",
        template_status: params.template_status || "",
        template_language: params.template_language || "",
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error);
    throw error;
  }
};

export const deleteWhatsAppTemplate = async (params = {}) => {
  try {
    const response = await axiosInstance.delete(
      `${domain}elections/msg91-whatsapp-template/delete-template`,
      {
        params: {
          integrated_number: params.integrated_number || "917997993374",
          template_name: params.template_name || "",
        },
      }
    );
    return response?.data;
  } catch (error) {
    console.error("Error deleting WhatsApp template:", error);
    throw error;
  }
};

export const getTemplatesByMobile = async (mobileNumber = "917997993374") => {
  try {
    const url = `${domain}elections/msg91-whatsapp-template/templates-by-mobile/${mobileNumber}`;

    const response = await axiosInstance.get(url);

    return response?.data;
  } catch (error) {
    console.error("Error fetching templates by mobile:", error);
    throw error;
  }
};



export const createCampaign = async (campaignData) => {
  try {
    const url = `${domain}elections/msg91/campaigns/`;
    const response = await axiosInstance.post(url, campaignData);
    return response?.data;
  } catch (error) {
    console.error("Error creating campaign:", error);
    throw error;
  }
};


export const getCampaigns = async (params = {}) => {
  try {
    const url = `${domain}elections/msg91/campaigns/`;
    const response = await axiosInstance.get(url, {
      params: {
        page: params.page || undefined,
        page_size: params.page_size || undefined,
        // ✅ Only include status if it's a valid string
        status: params.status ? params.status : undefined,
        // ✅ Same for search
        search: params.search ? params.search : undefined,
      },
    });
    return response?.data;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    throw error;
  }
};




export const getCampaignById = async (campaignId) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching campaign:", error);
    throw error;
  }
};


export const deleteCampaign = async (campaignId) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}`;
    const response = await axiosInstance.delete(url);
    return response?.data;
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
};


export const selectCampaignTemplate = async (campaignId, templateConfig) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/template`;
    const response = await axiosInstance.put(url, templateConfig);
    return response?.data;
  } catch (error) {
    console.error("Error selecting template:", error);
    throw error;
  }
};



export const uploadCampaignAudience = async (campaignId, file, mobileColumn) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/audience`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mobile_column', mobileColumn);

    const response = await axiosInstance.put(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response?.data;
  } catch (error) {
    console.error("Error uploading audience:", error);
    throw error;
  }
};



export const uploadCampaignAudienceGroup = async (campaignId, groupId) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/audience-group`;

    const response = await axiosInstance.put(url, {
      group_id: groupId
    });

    return response?.data;
  } catch (error) {
    console.error("Error uploading group audience:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

//whatsapp campaign launch, test, analytics , launch requirements, test requirements




// Launch requirements (body parameter hints before launch)
export const getCampaignLaunchRequirements = async (campaignId) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/launch-requirements`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching campaign launch requirements:", error);
    throw error;
  }
};

// Test-message requirements (body parameter hints before sending a test)
export const getCampaignTestRequirements = async (campaignId) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/test-requirements`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching campaign test requirements:", error);
    throw error;
  }
};

export const launchCampaign = async (campaignId, launchConfig) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/launch`;
    const response = await axiosInstance.post(url, launchConfig);
    return response?.data;
  } catch (error) {
    console.error("Error launching campaign:", error);
    throw error;
  }
};





export const testCampaign = async (campaignId, testConfig) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/test`;
    const response = await axiosInstance.post(url, testConfig);
    return response?.data;
  } catch (error) {
    console.error("Error testing campaign:", error);
    throw error;
  }
};


export const getCampaignAnalyticsDetailed = async (
  campaignId,
  { period = "day", fromDate, toDate } = {}
) => {
  try {
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    if (fromDate) params.append("from_date", fromDate); // YYYY-MM-DD
    if (toDate) params.append("to_date", toDate);       // YYYY-MM-DD

    const url = `${domain}elections/msg91/campaigns/${campaignId}/analytics${params.toString() ? `?${params.toString()}` : ""
      }`;

    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    throw error;
  }
};


// Campaign logs (paged with optional status filter)

export const getCampaignLogs = async (
  campaignId,
  { page = 1, pageSize = 50, status, fromDate, toDate } = {}
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);

    if (status) params.append("status_filter", status);
    if (fromDate) params.append("from_date", fromDate); // expects YYYY-MM-DD
    if (toDate) params.append("to_date", toDate);       // expects YYYY-MM-DD

    const queryString = params.toString();
    const url = `${domain}elections/msg91/campaigns/${campaignId}/logs${queryString ? `?${queryString}` : ""
      }`;

    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching campaign logs:", error);
    throw error;
  }
};


// Get campaign audience (contacts with mobile numbers, campaign_id, created_at, last_delivery_status)


export const getCampaignAudience = async (
  campaignId,
  { page = 1, pageSize = 50, search = "" } = {}
) => {
  try {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("page_size", pageSize);
    if (search) params.append("search", search);

    const url = `${domain}elections/msg91/campaigns/${campaignId}/audience?${params.toString()}`;
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching campaign audience:", error);
    throw error;
  }
};



export const deleteCampaignAudience = async (campaignId, mobileNumbers) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/audience`;

    const response = await axiosInstance.delete(url, {
      data: { mobile_numbers: mobileNumbers },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting campaign audience:", error);
    throw error;
  }
};













export const getConstituencyRankingPdfAssembly = async (constituency_id) => {
  try {
    const url = `${domain}elections/pdf?constituency_id=${constituency_id}`;

    const response = await axiosInstance.get(url);

    return response?.data;
  } catch (error) {
    console.error("Error fetching constituency ranking:", error);
    throw error;
  }
};



export const getConstituencyRankingPdfLoksabha = async (constituency_id) => {
  try {
    const url = `${domain}elections/pdf/loksabha?constituency_id=${constituency_id}`;

    const response = await axiosInstance.get(url);

    return response?.data;
  } catch (error) {
    console.error("Error fetching constituency ranking:", error);
    throw error;
  }
};



export const getBoothVoteDifferencesforPDF = async (constituency_id, election_id = "TNAC2021") => {
  try {
    const url = `${domain}elections/assembly-analysis/${constituency_id}/booth-vote-differences?election_id=${election_id}`;

    const response = await axiosInstance.get(url);

    return response?.data;
  } catch (error) {
    console.error("Error fetching booth vote differences:", error);
    throw error;
  }
};



export const getBoothVoteDifferencesforLoksabhaPDF = async (constituency_id, election_id = "TNGELS2024") => {
  try {
    const url = `${domain}elections/assembly-analysis/${constituency_id}/booth-vote-differences-loksabha?election_id=${election_id}`;

    const response = await axiosInstance.get(url);

    return response?.data;
  } catch (error) {
    console.error("Error fetching booth vote differences:", error);
    throw error;
  }
};

export const getTopBoothVoteDifferencesTopFiftyforPDF = async (
  constituencyId,
  { electionId = "TNAC2021", limit = 50 } = {}
) => {
  const url = `${domain}elections/assembly-analysis/${constituencyId}/booth-vote-differences-top-fifty`;
  const params = new URLSearchParams({ election_id: electionId, limit });

  try {
    const response = await axiosInstance.get(`${url}?${params.toString()}`);
    return response?.data;
  } catch (error) {
    console.error("Error fetching top booth vote differences:", error);
    throw error;
  }
};






export const getBoothVoteDifferencesTopFifty = async (
  constituencyId,
  { electionId = "TNAC2021" } = {}
) => {
  try {
    const url = `${domain}elections/assembly-analysis/${constituencyId}/booth-vote-differences-top-fifty`;
    const params = new URLSearchParams({ election_id: electionId });

    const response = await axiosInstance.get(`${url}?${params.toString()}`);

    return response?.data;
  } catch (error) {
    console.error("Error fetching booth vote differences top fifty:", error);
    throw error;
  }
};






export const getBoothVoteDifferencesTopFiftyforLoksabhaPDF = async (
  constituencyId,
  { electionId = "TNAC2021" } = {}
) => {
  try {
    const url = `${domain}elections/assembly-analysis/${constituencyId}/loksabha-booth-vote-differences-top-fifty`;
    const params = new URLSearchParams({ election_id: electionId });

    const response = await axiosInstance.get(`${url}?${params.toString()}`);

    return response?.data;
  } catch (error) {
    console.error("Error fetching booth vote differences top fifty:", error);
    throw error;
  }
};

// Send messages to selected mobile numbers from campaign audience
export const sendSelectedCampaign = async (campaignId, sendConfig) => {
  try {
    const url = `${domain}elections/msg91/campaigns/${campaignId}/send-selected`;
    const response = await axiosInstance.post(url, sendConfig);
    return response?.data;
  } catch (error) {
    console.error("Error sending to selected contacts:", error);
    throw error;
  }
};




// Get local templates from MongoDB
export const getLocalTemplates = async ({
  integratedNumber,
  templateName,
  skip = 0,
  limit = 100
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (integratedNumber) params.append("integrated_number", integratedNumber);
    if (templateName) params.append("template_name", templateName);
    params.append("skip", skip);
    params.append("limit", limit);

    const url = `${domain}elections/msg91-whatsapp-template/local-templates${params.toString() ? `?${params.toString()}` : ""
      }`;

    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching local templates:", error);
    throw error;
  }
};



export const createContactGroup = async ({
  group_name,
  caste,
  custom_caste
} = {}) => {
  try {
    const url = `${domain}elections/contacts/create-contact-group`;

    const payload = {
      group_name,
      caste,
      custom_caste
    };

    const response = await axiosInstance.post(url, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating contact group:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};




export const createContactsFromCSV = async ({
  file,
  name_column,
  phone_number_column,
  group_id
} = {}) => {
  try {
    const url = `${domain}elections/contacts/create-contacts-from-csv`;

    const formData = new FormData();
    if (file) formData.append("file", file);
    if (name_column) formData.append("name_column", name_column);
    if (phone_number_column) formData.append("phone_number_column", phone_number_column);
    if (group_id) formData.append("group_id", group_id);

    const response = await axiosInstance.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error creating contacts from CSV:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};



export const getGroupContacts = async ({
  groupId,
  page = 1,
  page_size = 50
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (page_size) params.append("page_size", page_size);

    const url = `${domain}elections/contacts/groups/${groupId}/contacts${params.toString() ? `?${params.toString()}` : ""
      }`;

    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching group contacts:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


// Get all contact groups for the logged-in user's organization
export const getContactGroups = async () => {
  try {
    const url = `${domain}elections/contacts/groups`;

    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching contact groups:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};



// Create a contact manually
export const createContactManually = async ({
  group_id,
  name,
  mobile_number,
  caste,
  custom_caste,
  is_group
} = {}) => {
  try {
    const url = `${domain}elections/contacts/create-contacts-manually`;

    const payload = {
      group_id,
      name,
      mobile_number,
      is_group,
      ...(caste && { caste }),
      ...(custom_caste && { custom_caste }),

    };

    const response = await axiosInstance.post(url, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating contact manually:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};





export const deleteGroupContacts = async (groupId, mobileNumbers) => {
  try {
    const url = `${domain}elections/contacts/groups/${groupId}/contacts`;

    const response = await axiosInstance.delete(url, {
      data: { mobile_numbers: mobileNumbers },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting group contacts:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteGroupAudience = async (groupId, mobileNumbers) => {
  try {
    const url = `${domain}elections/contacts/groups/${groupId}/audience`;

    const response = await axiosInstance.delete(url, {
      data: { mobile_numbers: mobileNumbers },
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting group audience:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};



export const getStateAndConstituencyWiseBooths = async (stateId, constituencyId) => {
  const response = await axiosInstance.get(
    `${domain}elections/election-portal/booths`,
    {
      params: {
        state_id: stateId,
        assembly_constituency_no: constituencyId, // ✅ correct key
      },
    }
  );

  return response.data;
};


//Agents persmissions

export const getAgents = async (token) => {
  try {
    const response = await axiosInstance.get(`${domain}auth/agents`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // { agents: [...] }
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
};

/** Fetch current scope for an agent (constituencies, booths, permissions, products). Use when opening Edit modal so product selection is correct. */
export const getAgentScope = async (token, agentUserId) => {
  try {
    const response = await axiosInstance.get(
      `${domain}auth/agents/${agentUserId}/scope`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching agent scope:', error);
    throw error;
  }
};

export const updateAgentScope = async (token, agentUserId, payload) => {
  // payload (same shape as invite for consistency):
  // {
  //   assigned_constituencies: [101, 102],
  //   assigned_booths: [{ state_id?, assembly_constituency_no, polling_station_no }],
  //   permissions: { view, edit, add, delete, edit_survey },
  //   assigned_product_skus: ["SKU005", ...],
  //   product_permissions: { "SKU005": { view, edit, add, delete }, ... }
  // }

  try {
    const response = await axiosInstance.put(
      `${domain}auth/agents/${agentUserId}/scope`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // { msg, user_id, updated }
  } catch (error) {
    console.error('Error updating agent scope:', error);
    throw error;
  }
};


export const promoteAgentToAdmin = async (agentUserId) => {
  try {
    const response = await axiosInstance.put(
      `${domain}auth/agents/${agentUserId}/promote-to-admin`
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        status: error.response?.status,
        message: error.response?.data?.detail || error.message,
        data: error.response?.data,
      },
    };
  }
};




export const getAdminByOrganizationwise = async () => {
  try {
    const response = await axiosInstance.get(`${domain}auth/admins`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin by organizationwise:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


export const uploadTemplateMedia = async (file, integratedNumber) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('integrated_number', integratedNumber);

    const response = await axiosInstance.post(
      `${domain}elections/msg91-whatsapp-template/upload-media`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

export const uploadCampaignMedia = async (file, integratedNumber) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('integrated_number', integratedNumber);
  formData.append('contentType', file.type); // Add this line - file.type contains "image/jpeg", "video/mp4", etc.

  const response = await axiosInstance.post(
    `${domain}elections/msg91/campaigns/upload-media`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );

  return response.data;
};


//Elections Results API

export const fetchResults = async () => {
  const headers = {
    'Content-Type': 'application/json',
    // Authorization: `Bearer ${token}`,
  };
  const url = `https://election-api.aadhan.workers.dev/electionresults`;


  try {
    const response = await fetch(`${url}`, {
      method: 'GET',
      headers: headers,
    });

    // Check if the response status is OK (2xx)
    if (response.ok) {
      const data = await response.json();
      return data.data;
    } else {
      throw new Error('Failed to fetch data');
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
};




export const getElectionResultsStates = async () => {
  const url =
    `https://election-api.aadhan.workers.dev/states`;
  const headers = {
    "Content-Type": "application/json",
    // Authorization: `Bearer ${token}`,
  };
  try {
    const response = await fetch(`${url}`, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error("Failed to fetch state data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    throw error;
  }
};

//Razorpay Apis


export const createRazorpayCustomer = async (customerPayload) => {
  try {
    const url = `${domain}elections/razorpay/customers`;
    const response = await axiosInstance.post(url, customerPayload);
    return response?.data; // CustomerResponse
  } catch (error) {
    console.error("Error creating Razorpay customer:", error);
    throw error;
  }
};


export const createRazorpayOrder = async (orderPayload) => {
  try {
    const url = `${domain}elections/razorpay/orders`;
    const response = await axiosInstance.post(url, orderPayload);
    return response?.data; // OrderResponse
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  try {
    const url = `${domain}elections/razorpay/verify-payment`;
    const payload = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    };
    const response = await axiosInstance.post(url, payload);
    return response?.data; // PaymentVerifyResponse
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    throw error;
  }
};


export const getRazorpayPaymentStatus = async (paymentId) => {
  try {
    const url = `${domain}elections/razorpay/payments/${paymentId}`;
    const response = await axiosInstance.get(url);
    return response?.data; // PaymentStatusResponse
  } catch (error) {
    console.error("Error fetching Razorpay payment status:", error);
    throw error;
  }
};


export const createRazorpayRefund = async (refundPayload) => {
  try {
    const url = `${domain}elections/razorpay/refunds`;
    const response = await axiosInstance.post(url, refundPayload);
    return response?.data; // RefundResponse
  } catch (error) {
    console.error("Error creating Razorpay refund:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


export const getOrganizationBill = async () => {
  try {
    const url = `${domain}elections/razorpay/payment-history-organization-wise`;
    const response = await axiosInstance.get(url);
    return response?.data; // BillResponse
  } catch (error) {
    console.error("Error fetching organization bill:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};



export const getBalanceUsageHistory = async (
  page = 1,
  pageSize = 50,
  transactionType = "deduction"
) => {
  try {
    const url = `${domain}elections/razorpay/usage-history`;
    const response = await axiosInstance.get(url, {
      params: {
        page,
        page_size: pageSize,
        transaction_type: transactionType,
      },
    });
    return response?.data; // BalanceUsageHistoryResponse
  } catch (error) {
    console.error(
      "Error fetching balance usage history:",
      error.response?.data || error.message
    );
    throw error.response?.data || error;
  }
};





export const checkEmailExists = async (email) => {
  const url = `${domain}auth/check-email`;

  try {
    const response = await axiosInstance.post(url, {
      email: email,
    });

    if (response.status === 200) {
      const { exists, email: checkedEmail } = response?.data;

      return {
        success: true,
        exists: exists,
        email: checkedEmail,
      };
    } else {
      return { success: false, detail: "Email check failed" };
    }
  } catch (error) {
    console.error("Email check failed:", error);

    let errorDetail = "Email check failed";

    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;

      if (Array.isArray(detail)) {
        errorDetail = detail[0]?.msg || errorDetail;
      } else if (typeof detail === "string") {
        errorDetail = detail;
      }
    }

    return {
      success: false,
      detail: errorDetail,
    };
  }
};

export const deleteMyEditedVoter = async (voterId, partyId = null) => {
  try {
    let url = `${domain}elections/election-portal/voter/${voterId}`;

    // Add party_id as query parameter if provided
    if (partyId !== null) {
      url += `?party_id=${partyId}`;
    }

    const response = await axiosInstance.delete(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting voter edit:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const deleteMyEditedVotersBulk = async (voterIds, partyId = null) => {
  try {
    if (!voterIds || voterIds.length === 0) {
      throw new Error("At least one voter_id is required");
    }

    let url = `${domain}elections/election-portal/voters`;

    // Add party_id as query parameter if provided
    if (partyId !== null) {
      url += `?party_id=${partyId}`;
    }

    const response = await axiosInstance.delete(url, {
      data: voterIds, // Send voter_ids array in request body
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error deleting voter edits:",
      error.response?.data || error.message
    );
    throw error;
  }
};



// Get custom-field question-wise analytics for current user's organization
export const getCustomFieldAnalytics = async (questionId = null) => {
  try {
    const params = {};
    if (questionId !== null) {
      params.question_id = questionId; // must match backend query param name
    }

    const response = await axiosInstance.get(
      `${domain}elections/election-portal/custom-fields/analytics`,
      { params }
    );

    // response.data is the CustomFieldAnalyticsSummary object
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching custom field analytics:",
      error.response?.data || error.message
    );
    throw error;
  }
};





// 1) Create survey (no questions)
export const createSurvey = async (payload) => {
  // payload: { survey_name, survey_description?, survey_type?, start_date, end_date?, status? }
  try {
    const res = await axiosInstance.post(`${domain}elections/surveys`, payload);
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error creating survey:", status, detail);
    throw error;
  }
};

// 2) List surveys
export const listSurveys = async ({ organization_id, state_id, status, skip = 0, limit = 50 } = {}) => {
  try {
    const res = await axiosInstance.get(`${domain}elections/surveys`, {
      params: {
        organization_id,
        state_id,
        status,
        skip,
        limit,
      },
    });
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error listing surveys:", status, detail);
    throw error;
  }
};

// 3) Get single survey by ID
export const getSurveyById = async (survey_id) => {
  try {
    const res = await axiosInstance.get(`${domain}elections/surveys/${survey_id}`);
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error fetching survey ${survey_id}:`, status, detail);
    throw error;
  }
};

// 4) Update survey (metadata, status, dates, etc.)
export const updateSurvey = async (survey_id, updates) => {
  try {
    const res = await axiosInstance.put(`${domain}elections/surveys/${survey_id}`, updates);
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error updating survey ${survey_id}:`, status, detail);
    throw error;
  }
};

// 5) Delete survey (and all its responses)
export const deleteSurvey = async (survey_id) => {
  try {
    const res = await axiosInstance.delete(`${domain}elections/surveys/${survey_id}`);
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error deleting survey ${survey_id}:`, status, detail);
    throw error;
  }
};

// 6) Add questions to a survey
export const addQuestionsToSurvey = async (survey_id, payload) => {
  try {
    const res = await axiosInstance.post(
      `${domain}elections/surveys/${survey_id}/questions`,
      payload
    );
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error adding questions to survey ${survey_id}:`, status, detail);
    throw error;
  }
};

// 7) Submit survey response
export const submitSurveyResponse = async (survey_id, payload) => {
  try {
    const res = await axiosInstance.post(
      `${domain}elections/surveys/${survey_id}/responses`,
      payload
    );
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error submitting response for survey ${survey_id}:`, status, detail);
    throw error;
  }
};

// 8) Get survey responses (with filters)
export const getSurveyResponses = async (survey_id, { skip = 0, limit = 100, voter_id, surveyor_id } = {}) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/surveys/${survey_id}/responses`,
      {
        params: {
          skip,
          limit,
          voter_id,
          surveyor_id,
        },
      }
    );
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error fetching responses for survey ${survey_id}:`, status, detail);
    throw error;
  }
};

// 9) Get survey analytics
export const getSurveyAnalytics = async (survey_id) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/surveys/${survey_id}/analytics`
    );
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error fetching analytics for survey ${survey_id}:`, status, detail);
    throw error;
  }
};


export const getOrganizationSurveys = async ({
  status,          // "draft" | "active" | "closed" (optional)
  include_closed,  // boolean (optional)
} = {}) => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/surveys/organization`,
      {
        params: {
          status,
          include_closed,
        },
      }
    );

    return res.data; // { success, message, data: [ { survey_id, survey_name, questions, ... } ] }
  } catch (error) {
    const statusCode = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error fetching organization surveys:", statusCode, detail);
    throw error;
  }
};


//get all available surveys for the organization
export const getOrganizationWiseSurveys = async () => {
  try {
    const res = await axiosInstance.get(
      `${domain}elections/surveys/organization/surveys`
    );
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error(`Error fetching organization surveys:`, status, detail);
    throw error;
  }
};








export const generateCombinedElectionPDF = async ({
  state_id,
  constituency_id,
  election_id_assembly = "TNAC2021",
  election_id_loksabha = "TNGELS2024",
  safe_min_pct = 20.0,
  favorable_min_pct = 10.0,
  difficult_min_behind_pct = 10.0
}) => {
  try {
    const res = await axiosInstance.get(`${domain}elections/pdf/generate/combined`, {
      params: {
        state_id,
        constituency_id,
        election_id_assembly,
        election_id_loksabha,
        safe_min_pct,
        favorable_min_pct,
        difficult_min_behind_pct,
      },
      responseType: 'blob', // Required for PDF binary response
    });

    return res.data; // Returns Blob object
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data || error.message;
    console.error("Error generating combined PDF:", status, detail);
    throw error;
  }
};


// ============ AI Search Chat APIs (chat-based) ============

export const createNewChat = async () => {
  const response = await axiosInstance.post(
    `${domain}elections/search/new-chat`
  );
  return response.data;
};


export const saveSearchHistory = async (data) => {
  const payload = {
    chat_id: data.chat_id,
    query: data.query,
    answer: data.answer ?? null,
  };
  if (data.raw_data != null && Array.isArray(data.raw_data) && data.raw_data.length > 0) {
    payload.raw_data = data.raw_data;
  }
  const response = await axiosInstance.post(
    `${domain}elections/search/save-search-history`,
    payload
  );
  return response.data;
};

export const getSearchHistory = async ({ limit = 50, skip = 0, chat_id } = {}) => {
  const params = new URLSearchParams();
  if (limit != null) params.append("limit", limit);
  if (skip != null) params.append("skip", skip);
  if (chat_id) params.append("chat_id", chat_id);

  const url = `${domain}elections/search/history${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await axiosInstance.get(url);
  return response.data;
};

/** Get a single message by message_id only (no chat_id). Backend finds it across user's chats. */
export const getSearchHistoryMessage = async (messageId) => {
  const response = await axiosInstance.get(
    `${domain}elections/search/history/message/${messageId}`
  );
  return response.data;
};

export const deleteChat = async (chatId) => {
  const response = await axiosInstance.delete(
    `${domain}elections/search/history/${chatId}`
  );
  return response.data;
};

export const deleteChatMessage = async (chatId, messageId) => {
  const response = await axiosInstance.delete(
    `${domain}elections/search/history/${chatId}/messages/${messageId}`
  );
  return response.data;
};

export const updateSearchHistoryFeedback = async (chatId, messageId, feedback) => {
  const response = await axiosInstance.patch(
    `${domain}elections/search/history/${chatId}/messages/${messageId}/feedback`,
    { feedback }
  );
  return response.data;
};



//Survey apis

// 1. Create Survey (from scratch)
export const createMargadarshSurvey = async (payload) => {
  // payload: { survey_name, survey_category }
  // survey_category: "events" | "marketing" | "govt_political" | "ecommerce" | "business_survey" | "other"
  try {
    const url = `${domain}elections/surveys`;
    const response = await axiosInstance.post(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error creating survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 2. List Surveys
export const listMargadarshSurveys = async (params = {}) => {
  // params: { status?, survey_category?, limit?, offset? }
  // status: "draft" | "active" | "paused" | "closed"
  try {
    const url = `${domain}elections/surveys`;
    const response = await axiosInstance.get(url, { params });
    return response?.data;
  } catch (error) {
    console.error("Error listing surveys:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 3. Get Survey (full editor with pages + questions)
export const getMargadarshSurvey = async (surveyId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/** Fetch public survey (no auth required) - for respondents via shared links */
export const getPublicMargadarshSurvey = async (surveyId) => {
  try {
    const url = `${domain}elections/public/surveys/${surveyId}`;
    const response = await axios.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching public survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// 4. Update Survey (name / category / status / editor — PATCH)
export const updateMargadarshSurvey = async (surveyId, payload) => {
  // payload: { survey_name?, survey_category?, status?, editor?, tags?, metadata? }
  try {
    const url = `${domain}elections/surveys/${surveyId}`;
    const response = await axiosInstance.patch(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error updating survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 5. Delete Survey
export const deleteMargadarshSurvey = async (surveyId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}`;
    const response = await axiosInstance.delete(url);
    return response?.data;
  } catch (error) {
    console.error("Error deleting survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 6. Publish Survey (status → active, generates public link)
export const publishMargadarshSurvey = async (surveyId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/publish`;
    const response = await axiosInstance.post(url);
    return response?.data;
  } catch (error) {
    console.error("Error publishing survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 7. Unpublish Survey (status → closed)
export const unpublishMargadarshSurvey = async (surveyId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/unpublish`;
    const response = await axiosInstance.post(url);
    return response?.data;
  } catch (error) {
    console.error("Error unpublishing survey:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// ── Pages ──────────────────────────────────────────────────
// 8. Add Page
export const addMargadarshSurveyPage = async (surveyId, payload) => {
  // payload: { title?, description? }
  try {
    const url = `${domain}elections/surveys/${surveyId}/pages`;
    const response = await axiosInstance.post(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error adding page:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 9. Update Page
export const updateMargadarshSurveyPage = async (surveyId, pageId, payload) => {
  // payload: { title?, description? }
  try {
    const url = `${domain}elections/surveys/${surveyId}/pages/${pageId}`;
    const response = await axiosInstance.patch(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error updating page:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 10. Delete Page
export const deleteMargadarshSurveyPage = async (surveyId, pageId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/pages/${pageId}`;
    const response = await axiosInstance.delete(url);
    return response?.data;
  } catch (error) {
    console.error("Error deleting page:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// ── Questions ──────────────────────────────────────────────
// 11. Add Question to a Page
export const addMargadarshSurveyQuestion = async (surveyId, pageId, payload) => {
  /*
    payload: {
      question_type: "multiple_choice_one" | "multiple_choice_many" | "dropdown_one" |
                     "dropdown_many" | "image_selection" | "rating_scale" |
                     "star_rating" | "ranking" | "boolean",
      title: string,
      description?: string,
      required?: boolean,
      options?: [{ option_id, label, value?, image_url?, is_other?, is_exclusive?, order? }],
      rating_scale?: { min_value?, max_value?, min_label?, max_label? },
      star_rating?: { max_stars?, allow_half_stars? },
      boolean?: { true_label?, false_label? },
      randomize_options?: boolean,
      allow_comment?: boolean,
      comment_label?: string,
    }
  */
  try {
    const url = `${domain}elections/surveys/${surveyId}/pages/${pageId}/questions`;
    const response = await axiosInstance.post(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error adding question:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 12. Update Question (PATCH — only send fields you want to change)
export const updateMargadarshSurveyQuestion = async (surveyId, pageId, questionId, payload) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/pages/${pageId}/questions/${questionId}`;
    const response = await axiosInstance.patch(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error updating question:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 13. Delete Question
export const deleteMargadarshSurveyQuestion = async (surveyId, pageId, questionId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/pages/${pageId}/questions/${questionId}`;
    const response = await axiosInstance.delete(url);
    return response?.data;
  } catch (error) {
    console.error("Error deleting question:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// ============================================================
// SCREEN 2: SUMMARY
// ============================================================
// 14. Get Survey Summary (KPIs, chart, structure, public link)
export const getMargadarshSurveySummary = async (surveyId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/summary`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching survey summary:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// ============================================================
// SCREEN 3: RESPONSES
// ============================================================
// 15. Submit a Response (public — no auth needed)
export const submitMargadarshSurveyResponse = async (surveyId, payload) => {
  /*
    payload: {
      respondent_name?: string,
      respondent_email?: string,
      answers: { [question_id]: answer_value },
      metadata?: {}
    }
  */
  try {
    const url = `${domain}elections/surveys/${surveyId}/responses`;
    const response = await axiosInstance.post(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error submitting response:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 16. List Responses (table with column defs + paginated rows)
export const listMargadarshSurveyResponses = async (surveyId, params = {}) => {
  /*
    params: {
      response_status?: "completed" | "partial" | "disqualified" | "spam" | "deleted",
      from_date?: "YYYY-MM-DD",
      to_date?: "YYYY-MM-DD",
      page?: number,       // default 1
      page_size?: number,  // default 50
    }
  */
  try {
    const url = `${domain}elections/surveys/${surveyId}/responses`;
    const response = await axiosInstance.get(url, { params });
    return response?.data;
  } catch (error) {
    console.error("Error listing responses:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 17. Get Single Response Detail
export const getMargadarshSurveyResponse = async (surveyId, responseId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/responses/${responseId}`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching response:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 18. Delete Response
export const deleteMargadarshSurveyResponse = async (surveyId, responseId) => {
  try {
    const url = `${domain}elections/surveys/${surveyId}/responses/${responseId}`;
    const response = await axiosInstance.delete(url);
    return response?.data;
  } catch (error) {
    console.error("Error deleting response:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// ============================================================
// SCREEN 4: AUDIT LOGS
// ============================================================
// 19. Get Audit Logs (grouped by day, with filters)
export const getMargadarshSurveyAuditLogs = async (surveyId, params = {}) => {
  /*
    params: {
      event_types?: "survey_created,question_updated,...",  // comma-separated
      actor_user_id?: string,
      entity_type?: "survey" | "page" | "question" | "response",
      from_time?: "YYYY-MM-DDTHH:MM:SS",
      to_time?: "YYYY-MM-DDTHH:MM:SS",
      limit?: number,  // default 100
    }
  */
  try {
    const url = `${domain}elections/surveys/${surveyId}/audit-logs`;
    const response = await axiosInstance.get(url, { params });
    return response?.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
// 20. Export Audit Logs (CSV / XLSX / PDF)
export const exportMargadarshSurveyAuditLogs = async (surveyId, payload) => {
  /*
    payload: {
      format: "csv" | "xlsx" | "pdf",
      filters?: {
        event_types?: [...],
        actor_user_id?: string,
        entity_type?: string,
        from_time?: string,
        to_time?: string,
      }
    }
  */
  try {
    const url = `${domain}elections/surveys/${surveyId}/audit-logs/export`;
    const response = await axiosInstance.post(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error exporting audit logs:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};



export const uploadSurveyImage = async (surveyId, file) => {
  try {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(
      `${domain}elections/surveys/${surveyId}/upload-image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error uploading survey image:",
      error.response?.data || error.message
    );
    throw error;
  }
};



// 21. Get Survey Summary & Reports Data
export const getMargadarshSurveySummaryReport = async (surveyId) => {
  /*
    Returns: {
      success: boolean,
      data: {
        survey_id: string,
        kpis: { responses_total, visits_total, todays_responses, active_for_days, latest_response_at },
        questions: [
            {
               question_id, question_title, question_type, answered_count, skipped_count,
               choices_data: [{ label, response_count, response_percent }],
               customization: { show_chart, chart_type, data_in_chart, chart_fit_screen, chart_labels, legend_position, show_data_table, show_percentage_bar, show_stats_table, hide_unselected_options }
               allowed_chart_types: []
            }
        ]
      }
    }
  */
  try {
    const url = `${domain}elections/surveys/${surveyId}/reports/summary`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching survey summary report:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};


// ─── News Feature ─────────────────────────────────────────────────────

export const createNewsTopic = async ({ source, keywords, state, max_results = 10, topic_id = null, channels = null, search_mode = "keywords" }) => {
  try {
    const payload = {
      source,
      keywords,
      state: state || null,
      max_results,
      search_mode,
    };
    if (topic_id) {
      payload.topic_id = topic_id;
    }
    if (channels && channels.length > 0) {
      payload.channels = channels;
    }
    const response = await axiosInstance.post(`${domain}elections/news/create-topic`, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating news topic:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getNewsTopics = async (source = null) => {
  try {
    const params = {};
    if (source) params.source = source;
    const response = await axiosInstance.get(`${domain}elections/news/topics`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching news topics:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getNewsTopic = async (topicId, source = null) => {
  try {
    const params = {};
    if (source) params.source = source;
    const response = await axiosInstance.get(`${domain}elections/news/topics/${topicId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching news topic:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const deleteNewsTopic = async (topicId, source) => {
  try {
    const response = await axiosInstance.delete(`${domain}elections/news/topics/${topicId}`, {
      params: { source },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting news topic:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const loadMoreNewsPosts = async (topicId, source, maxResults = 10) => {
  try {
    const response = await axiosInstance.post(
      `${domain}elections/news/topics/${topicId}/load-more`,
      { max_results: maxResults },
      { params: { source } }
    );
    return response.data;
  } catch (error) {
    console.error("Error loading more posts:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// ─── Channel Search / Autocomplete ───────────────────────────────────

export const searchTwitterChannels = async (query, source = "Twitter") => {
  try {
    const params = { q: query, source };
    const response = await axiosInstance.get(`${domain}elections/editor-breaking/twitter/channels/search`, { params });
    return response.data;
  } catch (error) {
    console.error("Error searching twitter channels:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const searchInstagramProfiles = async (query) => {
  try {
    const params = { q: query };
    const response = await axiosInstance.get(`${domain}elections/editor-breaking/instagram/profiles/search`, { params });
    return response.data;
  } catch (error) {
    console.error("Error searching instagram profiles:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const scrapeTwitterUser = async (username, maxResults = 10) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/social-media-scraper/twitter/user/${encodeURIComponent(username)}`,
      { params: { max_results: maxResults } }
    );
    return response.data;
  } catch (error) {
    console.error("Error scraping twitter user:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const scrapeInstagramUser = async (username, maxResults = 10) => {
  try {
    const response = await axiosInstance.get(
      `${domain}elections/social-media-scraper/instagram/user/${encodeURIComponent(username)}`,
      { params: { max_results: maxResults } }
    );
    return response.data;
  } catch (error) {
    console.error("Error scraping instagram user:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// ─── Task Management (elections/tasks) ─────────────────────────────────────

export const createTask = async (payload) => {
  const response = await axiosInstance.post(`${domain}elections/tasks`, payload);
  return response?.data;
};

export const listTasks = async (params = {}) => {
  const { organization_id, status, assigned_to_user_id, created_by_user_id, limit = 20, offset = 0 } = params;
  const q = new URLSearchParams();
  if (organization_id) q.set("organization_id", organization_id);
  if (status) q.set("status", status);
  if (assigned_to_user_id) q.set("assigned_to_user_id", assigned_to_user_id);
  if (created_by_user_id) q.set("created_by_user_id", created_by_user_id);
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  const response = await axiosInstance.get(`${domain}elections/tasks?${q}`);
  return response?.data;
};

export const getMyTasks = async (params = {}) => {
  const { status, include_created_by_me = false, limit = 20, offset = 0 } = params;
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  q.set("include_created_by_me", String(include_created_by_me));
  q.set("limit", String(limit));
  q.set("offset", String(offset));
  const response = await axiosInstance.get(`${domain}elections/tasks/my-tasks?${q}`);
  return response?.data;
};

export const getTask = async (taskId) => {
  const response = await axiosInstance.get(`${domain}elections/tasks/${taskId}`);
  return response?.data;
};

export const updateTask = async (taskId, payload) => {
  const response = await axiosInstance.patch(`${domain}elections/tasks/${taskId}`, payload);
  return response?.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await axiosInstance.patch(`${domain}elections/tasks/${taskId}/status`, { status });
  return response?.data;
};

export const assignTask = async (taskId, assigned_to_user_id) => {
  const response = await axiosInstance.put(`${domain}elections/tasks/${taskId}/assign`, {
    assigned_to_user_id: assigned_to_user_id ?? null,
  });
  return response?.data;
};

export const getOrgTaskStats = async (orgId) => {
  const response = await axiosInstance.get(`${domain}elections/tasks/stats/organizations/${orgId}`);
  return response?.data;
};


export const getOrganizationAgents = async (orgId) => {
  const response = await axiosInstance.get(
    `${domain}elections/tasks/organizations/${orgId}/agents`
  );
  return response?.data;
};

// ─── Trending Videos (elections API; same data as CMS dashboard-rules/trending-videos, elections auth only) ───

export const getTrendingVideos = async (params = {}) => {
  const { languageId = null, channelName = null, sortBy = "smart", page = 1, pageSize = 12 } = params;
  const searchParams = new URLSearchParams();
  if (languageId) searchParams.set("language_id", languageId);
  if (channelName) searchParams.set("channel_name", channelName);
  if (sortBy) searchParams.set("sort_by", sortBy);
  if (page) searchParams.set("page", page);
  if (pageSize) searchParams.set("page_size", pageSize);
  const response = await axiosInstance.get(
    `${domain}elections/trending-videos?${searchParams.toString()}`
  );
  return response?.data;
};

export const updateTrendingVideoStatus = async (videoId, userAction) => {
  const response = await axiosInstance.put(
    `${domain}elections/trending-videos/status`,
    { video_id: videoId, user_action: userAction }
  );
  return response?.data;
};

// ─── Subscription News (Popular Media) ─────────────────────────────────────

export const getSubscriptionNewsChannels = async () => {
  const response = await axiosInstance.get(`${domain}elections/subscription-news/channels`);
  return response?.data;
};

export const getSubscriptionNews = async (params = {}) => {
  const { channel = null, languageId = null, page = 1, pageSize = 20 } = params;
  const searchParams = new URLSearchParams();
  if (channel) searchParams.set("channel", channel);
  if (languageId) searchParams.set("language_id", languageId);
  searchParams.set("page", page);
  searchParams.set("page_size", pageSize);
  const response = await axiosInstance.get(
    `${domain}elections/subscription-news?${searchParams.toString()}`
  );
  return response?.data;
};

// ─── Editor Breaking: X / Threads / Instagram (CMS collections, elections auth) ───

export const getEditorBreakingTwitterChannels = async (source = "Twitter") => {
  const response = await axiosInstance.get(
    `${domain}elections/editor-breaking/twitter/channels?source=${encodeURIComponent(source)}`
  );
  return response?.data;
};

export const getEditorBreakingTwitter = async (params = {}) => {
  const {
    source = "Twitter",
    channel = null,
    languageId = null,
    page = 1,
    pageSize = 50,
    sortBy = "recent",
  } = params;
  const sp = new URLSearchParams();
  sp.set("source", source);
  sp.set("page", page);
  sp.set("page_size", pageSize);
  sp.set("sort_by", sortBy);
  if (channel) sp.set("channel", channel);
  if (languageId != null) sp.set("language_id", languageId);
  const response = await axiosInstance.get(
    `${domain}elections/editor-breaking/twitter?${sp.toString()}`
  );
  return response?.data;
};

export const getEditorBreakingInstagramProfiles = async () => {
  const response = await axiosInstance.get(`${domain}elections/editor-breaking/instagram/profiles`);
  return response?.data;
};

export const getEditorBreakingInstagram = async (params = {}) => {
  const {
    profile = null,
    languageId = null,
    page = 1,
    pageSize = 50,
    sortBy = "recent",
  } = params;
  const sp = new URLSearchParams();
  sp.set("page", page);
  sp.set("page_size", pageSize);
  sp.set("sort_by", sortBy);
  if (profile) sp.set("profile", profile);
  if (languageId != null) sp.set("language_id", languageId);
  const response = await axiosInstance.get(
    `${domain}elections/editor-breaking/instagram?${sp.toString()}`
  );
  return response?.data;
};

// ─── Search / Add Channels to Editor Breaking ─────────────────────

export const searchEditorBreakingTwitterChannels = async (query, source = "Twitter") => {
  const response = await axiosInstance.get(`${domain}elections/editor-breaking/twitter/channels/search`, {
    params: { q: query, source }
  });
  return response?.data;
};

export const searchEditorBreakingInstagramProfiles = async (query) => {
  const response = await axiosInstance.get(`${domain}elections/editor-breaking/instagram/profiles/search`, {
    params: { q: query }
  });
  return response?.data;
};

export const addTwitterChannelToTrending = async (channel, source = "Twitter") => {
  const response = await axiosInstance.post(`${domain}elections/editor-breaking/twitter/channel`, {
    channel,
    source,
  });
  return response?.data;
};

export const addInstagramProfileToTrending = async (profile) => {
  const response = await axiosInstance.post(`${domain}elections/editor-breaking/instagram/profile`, {
    profile,
  });
  return response?.data;
};