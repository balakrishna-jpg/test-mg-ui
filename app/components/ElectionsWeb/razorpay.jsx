// app/components/ElectionsWeb/razorpay.js
import React, { useState, useEffect } from "react";

import {
  createRazorpayCustomer,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayPaymentStatus,
  // createRazorpayRefund, // optional, not used below
} from "~/api";

import { IndianRupee } from "lucide-react";

export default function Razorpay({ fetchOrganizationBill }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [lastPaymentId, setLastPaymentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Load Razorpay script
  useEffect(() => {
    const scriptId = "razorpay-checkout-js";
    if (document.getElementById(scriptId)) {
      // Script already exists, verify it's loaded
      if (window.Razorpay) {
        console.log("Razorpay script already loaded");
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      console.log("Razorpay script loaded successfully");
      if (window.Razorpay) {
        console.log("Razorpay object is available");
      } else {
        console.error("Razorpay object not found after script load");
      }
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay script");
      setError("Failed to load Razorpay payment gateway. Please refresh the page.");
    };

    document.body.appendChild(script);

    return () => {
      // optional cleanup
      // document.body.removeChild(script);
    };
  }, []);

  const handlePay = async () => {
    setError("");
    setMessage("");
    setPaymentStatus(null);
    setLoading(true);

    try {
      // Wait for Razorpay to be available (with timeout)
      if (!window.Razorpay) {
        // Try waiting for async script to load (max 3 seconds)
        let attempts = 0;
        const maxAttempts = 30; // 30 * 100ms = 3 seconds
        while (!window.Razorpay && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }
        if (!window.Razorpay) {
          throw new Error("Razorpay script not loaded yet. Please refresh the page and try again.");
        }
      }

      // Verify Razorpay constructor exists
      if (typeof window.Razorpay !== "function") {
        throw new Error("Razorpay is not a constructor. Please check the script URL.");
      }

      // 1. Create customer in your backend
      const customerRes = await createRazorpayCustomer({
        name,
        email,
        contact,
      });
      const customerId = customerRes?.id;
      if (!customerId) {
        throw new Error("Failed to create Razorpay customer.");
      }

      // 2. Create order in your backend

      const receipt = `receipt#${Date.now()}`;
      const orderRes = await createRazorpayOrder({
        amount: Number(amount),
        currency: "INR",
        receipt,
        customer_id: customerId,
        customer_details: {
          name,
          email,
          contact,
        },
        notes: {
          source: "",
        },
      });

      const orderId = orderRes?.id;
      if (!orderId) {
        throw new Error("Failed to create Razorpay order.");
      }

      // 3. Instantiate Razorpay
      const keyId =
        (window.ENV && window.ENV.RAZORPAY_KEY_ID) ||
        "rzp_test_RsAVPL1MxCXzoE"; // replace this placeholder

      // 4. Prepare payment options for Razorpay Checkout
      const options = {
        key: keyId,
        amount: Number(amount), // in paise
        currency: "INR",
        name: "Campaign Payment",
        description: "Payment for Campaigns",
        image: "https://i.imgur.com/n5tjHFD.jpg",
        order_id: orderId,
        customer_id: customerId,
        prefill: {
          name,
          email,
          contact,
        },
        handler: async (response) => {
          try {
            // response contains:
            // response.razorpay_payment_id
            // response.razorpay_order_id
            // response.razorpay_signature
            setLastPaymentId(response.razorpay_payment_id);

            // 5. Call your backend verify-payment endpoint
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyRes = await verifyRazorpayPayment(verifyPayload);

            if (verifyRes?.success) {
              setMessage("Payment verified successfully!");
              fetchOrganizationBill();
            } else {
              setError(
                verifyRes?.message ||
                "Payment completed but verification failed on server."
              );
            }
          } catch (e) {
            console.error(e);
            setError(e.message || "Error verifying payment.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setError("Payment cancelled by user.");
            setLoading(false);
          },
        },
        theme: {
          color: "#3399cc",
        },
      };

      // 5. Create Razorpay instance and open checkout
      const razorpay = new window.Razorpay(options);

      // Verify that the open method exists
      if (typeof razorpay.open !== "function") {
        throw new Error("Razorpay open method not available. Please ensure the correct Razorpay Checkout script is loaded.");
      }

      razorpay.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response);
        setError(
          response.error?.description ||
          response.error?.reason ||
          "Payment failed. Please try again."
        );
        setLoading(false);
      });

      razorpay.open();
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong.");
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setError("");
    setMessage("");

    if (!lastPaymentId) {
      setError("No payment id available. Make a payment first.");
      return;
    }

    try {
      const statusRes = await getRazorpayPaymentStatus(lastPaymentId);
      setPaymentStatus(statusRes);
      setMessage(`Fetched status for payment ${lastPaymentId}.`);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to fetch payment status.");
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-md space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={name}
              placeholder="Enter your name"
              onChange={(e) => setName(e.target.value)}
            />
            {name.length > 0 && name.length < 5 && (
              <p className="text-xs text-red-600">
                Name must be at least 5 characters
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Contact</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={contact}
              placeholder="Mobile 91**********"
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Amount (₹)
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="number"
              value={amount}
              placeholder="Enter amount"
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full h-11 px-4 rounded-lg
             flex items-center justify-center gap-2
             bg-blue-600 text-sm font-semibold text-white
             shadow-sm transition hover:bg-blue-700
             disabled:cursor-not-allowed disabled:opacity-70
             whitespace-nowrap leading-none"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <IndianRupee className="w-4 h-4 shrink-0" />
              Pay with Razorpay
            </>
          )}
        </button>


        {lastPaymentId && (
          <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
            <div className="mb-1 break-all">
              Last Payment ID: <span className="font-mono">{lastPaymentId}</span>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
              onClick={handleCheckStatus}
            >
              Check payment status
            </button>
          </div>
        )}

        {message && (
          <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            <strong>{message}</strong>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <strong>{error}</strong>
          </div>
        )}

        {paymentStatus && (
          <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-gray-50 p-3 text-[11px] leading-snug text-gray-800">
            {JSON.stringify(paymentStatus, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}