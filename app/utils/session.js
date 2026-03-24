// app/utils/session.js

import * as jwt_decode from "jwt-decode";
const isBrowser = typeof window !== "undefined";

export const getUser = async (request) => {
  if (request) {
    // Server-side
    const token = request.headers.get("Authorization")?.split(" ")[1];

    if (!token) return null;

    try {
      const decodedToken = jwt_decode.default(token); // 👈 use .default
      return {
        user_id: decodedToken.user_id,
        name: decodedToken.name,
        role: decodedToken.role,
        party_id: decodedToken.party_id,
        assigned_product_skus: decodedToken.assigned_product_skus || [],
        product_permissions: decodedToken.product_permissions || {},
      };
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  } else if (isBrowser) {
    // Client-side
    const user = localStorage.getItem("user_info");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const hasAccessToProduct = (user, skuCode) => {
  if (!user) return false;

  if (user.assigned_product_skus && Array.isArray(user.assigned_product_skus)) {
    return user.assigned_product_skus.includes(skuCode);
  }

  // Check product_permissions keys
  if (user.product_permissions && typeof user.product_permissions === 'object') {
    return !!user.product_permissions[skuCode];
  }

  return false;
};

/**
 * Determines the default landing route for a user based on their assigned product SKUs.
 * Priority: Elections (SKU005) > Survey (SKU004) > Grievance (SKU003) > Communication (SKU002) > News (SKU001)
 */
export const getUserLandingRoute = (user) => {
  if (!user || (!user.user_id && isBrowser)) return "/login";
  if (!user.user_id) return null; // Can't determine route on server without user_id

  if (hasAccessToProduct(user, "SKU005")) {
    return `/elections/votersdb`;
  }
  if (hasAccessToProduct(user, "SKU004")) {
    return `/elections/surveys-list`;
  }
  if (hasAccessToProduct(user, "SKU003")) {
    return `/elections/tickets`;
  }
  if (hasAccessToProduct(user, "SKU002")) {
    return `/elections/whatsapp`;
  }
  if (hasAccessToProduct(user, "SKU001")) {
    return `/elections/news`;
  }

  // Fallback if no specific product SKU is found but user is logged in
  return `/elections/create-tasks`;
};
