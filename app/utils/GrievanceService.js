// app/utils/GrievanceService.js
// Grievance / Support Ticket API service
// Backend base: https://stage-electionapi.aadhan.in/elections/

import axiosInstance from "./axios";

const LOCAL_CMS_URL = 'http://127.0.0.1:8000/'

const domain = 'https://electionapi.aadhan.in/'

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL / SUPPORT TEAM ENDPOINTS (Authenticated)
// ═══════════════════════════════════════════════════════════════════════════════

// 1. List Tickets (with org, status, category, source filters)
export const listSupportTickets = async ({
    org_id,
    user_id,
    status,
    ticket_type,
    category,
    source,
    limit = 20,
    offset = 0,
} = {}) => {
    try {
        let url = `${domain}elections/help-support/tickets?limit=${limit}&offset=${offset}`;
        if (org_id) url += `&org_id=${org_id}`;
        if (user_id) url += `&user_id=${user_id}`;
        if (status) url += `&status=${status}`;
        if (ticket_type) url += `&ticket_type=${ticket_type}`;
        if (category) url += `&category=${category}`;
        if (source) url += `&source=${source}`; // "public" | "internal"

        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error listing support tickets:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 2. Get Ticket Thread (Support View — full details)
export const getSupportTicketThread = async (ticketId) => {
    try {
        const url = `${domain}elections/help-support/tickets/${ticketId}`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching ticket thread:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 3. Create Internal Ticket (Support/Admin side)
// payload: { user_id, organization_id, ticket_type, subject, description, attachments }
export const createSupportTicket = async (ticketPayload) => {
    try {
        const url = `${domain}elections/help-support/tickets`;
        const response = await axiosInstance.post(url, ticketPayload);
        return response?.data;
    } catch (error) {
        console.error("Error creating support ticket:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 4. Support Team Reply to a Ticket
// payload: { author_type: "support_team", description, attachments }
export const addSupportTeamReply = async (ticketId, replyPayload) => {
    try {
        const url = `${domain}elections/help-support/tickets/${ticketId}/support-reply`;
        const response = await axiosInstance.post(url, {
            ...replyPayload,
            author_type: "support_team", // always forced to support_team
        });
        return response?.data;
    } catch (error) {
        console.error("Error adding support team reply:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 5. Update Ticket Status (Support Team)
// status: "open" | "pending" | "in_progress" | "resolved" | "closed"
export const updateTicketStatus = async (ticketId, status) => {
    try {
        const url = `${domain}elections/help-support/tickets/${ticketId}/status?status=${status}`;
        const response = await axiosInstance.patch(url);
        return response?.data;
    } catch (error) {
        console.error("Error updating ticket status:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 6. Share Ticket — Generate Legacy Public Link
export const shareSupportTicket = async (ticketId) => {
    try {
        const url = `${domain}elections/help-support/tickets/${ticketId}/share`;
        const response = await axiosInstance.post(url);
        return response?.data;
    } catch (error) {
        console.error("Error sharing ticket:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 7. Get Ticket Stats (Overall + Per-Org Breakdown)
// Pass org_id to get stats for a single org only
export const getTicketStats = async (org_id = null) => {
    try {
        let url = `${domain}elections/help-support/tickets/stats`;
        if (org_id) url += `?org_id=${org_id}`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching ticket stats:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 8. Get Single Org Ticket Stats
export const getOrgTicketStats = async (orgId) => {
    try {
        const url = `${domain}elections/help-support/organizations/${orgId}/stats`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching org ticket stats:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 9. Get Org Public Submission Link
// Returns: { organization_id, organization_name, public_url, api_endpoint }
export const getOrgPublicLink = async (orgId) => {
    try {
        const url = `${domain}elections/help-support/organizations/${orgId}/public-link`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching org public link:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (No Auth — use plain axios or axiosInstance without token)
// ═══════════════════════════════════════════════════════════════════════════════

// 10. Get Org Info for Public Form (name, categories)
// Called when citizen opens the campaign link: /grievance/{orgId}
export const getOrgPublicInfo = async (orgId) => {
    try {
        const url = `${domain}elections/public/grievance/org/${orgId}`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching org public info:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 11. Create Public Ticket (Citizen raises a ticket via org campaign link)
// ticketData: {
//   category: "roads" | "water_supply" | "electricity" | "infrastructure" | "sanitation" | "health" | "education" | "other",
//   subject: string,
//   description: string,
//   location_address?: string,
//   name?: string,
//   email?: string,
//   phone_number?: string,
//   is_anonymous?: boolean
// }
// files: Array of File objects (optional) - accepts jpg, png, webp, pdf (max 5MB each)
// Returns: { ticket_number: "TKT-20240218-0001", ticket_id, status, message }
export const createPublicTicket = async (orgId, ticketData, files = []) => {
    try {
        const url = `${domain}elections/public/grievance/${orgId}/tickets`;
        
        const formData = new FormData();
        
        formData.append('category', ticketData.category);
        formData.append('subject', ticketData.subject);
        formData.append('description', ticketData.description);
        
        if (ticketData.location_address) {
            formData.append('location_address', ticketData.location_address);
        }
        if (ticketData.name) {
            formData.append('name', ticketData.name);
        }
        if (ticketData.email) {
            formData.append('email', ticketData.email);
        }
        if (ticketData.phone_number) {
            formData.append('phone_number', ticketData.phone_number);
        }
        formData.append('is_anonymous', ticketData.is_anonymous || false);
        
        if (files && files.length > 0) {
            files.forEach((file) => {
                formData.append('files', file);
            });
        }
        
        const response = await axiosInstance.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response?.data;
    } catch (error) {
        console.error("Error creating public ticket:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 12. Track Public Ticket by Ticket Number
// ticketNumber: e.g. "TKT-20240218-0001"
export const trackPublicTicket = async (ticketNumber) => {
    try {
        const url = `${domain}elections/public/grievance/track/${ticketNumber}`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error tracking public ticket:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 13. Get Public Ticket Thread (Legacy — via public_token share link)
export const getPublicTicketThread = async (publicToken) => {
    try {
        const url = `${domain}elections/public/grievance/${publicToken}`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching public ticket:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};

// 14. Add Public Reply via Tracking Link
export const addPublicTicketReply = async (ticketNumber, replyData) => {
    try {
        const url = `${domain}elections/public/grievance/track/${ticketNumber}/replies`;
        const response = await axiosInstance.post(url, {
            description: replyData.description,
            name: replyData.name || "Anonymous",
            attachments: replyData.attachments || []
        });
        return response?.data;
    } catch (error) {
        console.error("Error adding public reply:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


export const createCustomCategory = async (org_id, payload) => {
    try {
        const url = `${domain}elections/help-support/organizations/${org_id}/categories`;
        const response = await axiosInstance.post(url, payload);
        return response?.data;
    } catch (error) {
        console.error("Error creating custom category:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


export const getCustomCategories = async (org_id) => {
    try {
        const url = `${domain}elections/help-support/organizations/${org_id}/categories`;
        const response = await axiosInstance.get(url);
        return response?.data;
    } catch (error) {
        console.error("Error fetching custom categories:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};


export const deleteCustomCategory = async (org_id, category_id) => {
    try {
        const url = `${domain}elections/help-support/organizations/${org_id}/categories/${category_id}`;
        const response = await axiosInstance.delete(url);
        return response?.data;
    } catch (error) {
        console.error("Error deleting custom category:", error.response?.data || error.message);
        throw error.response?.data || error;
    }
};



// export const addPublicTicketReplys = async (ticketNumber, replyData) => {
//     try {
//         const response = await axiosInstance.post(
//             `${LOCAL_CMS_URL}elections/public/grievance/track/${ticketNumber}/replies`,
//             {
//                 description: replyData.description,
//                 name: replyData.name || "Anonymous",
//                 attachments: replyData.attachments || []
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error adding public reply:", error);
//         throw error;
//     }
// };
