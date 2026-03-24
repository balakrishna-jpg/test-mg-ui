
import axiosInstance from "./axios";

const LOCAL_CMS_URL = 'http://127.0.0.1:8000/'

// const domain = "https://stage-electionapi.aadhan.in/";

const domain = 'https://electionapi.aadhan.in/'


// Initializes the checkout session and generates a Razorpay Order ID
export const initializeOrganizationCheckout = async (payload) => {
  try {
    // payload should contain: { organization_details: {...}, products: [{ skuCode, planId }] }
    const url = `${domain}elections/subscriptions/checkout/initialize`;
    const response = await axiosInstance.post(url, payload);
    return response?.data;
  } catch (error) {
    console.error("Error initializing checkout:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Verifies the Razorpay payment signature and provisions the organization/subscriptions
export const verifyOrganizationCheckout = async (verifyData) => {
  try {
    // verifyData should contain: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    const url = `${domain}elections/subscriptions/checkout/verify`;
    const response = await axiosInstance.post(url, verifyData);
    return response?.data;
  } catch (error) {
    console.error("Error verifying payment checkout:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Fetch all available products and their pricing plans
export const getSubscriptionProductsDetails = async () => {
  try {
    const url = `${domain}elections/subscriptions/products`;
    const response = await axiosInstance.get(url);
    return response?.data;
  } catch (error) {
    console.error("Error fetching products:", error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
