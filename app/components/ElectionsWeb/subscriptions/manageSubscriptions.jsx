import React, { useState, useEffect } from "react";
import { Loader2, ArrowRight, IndianRupee } from "lucide-react";
import { initializeOrganizationCheckout, verifyOrganizationCheckout, getSubscriptionProductsDetails } from "~/utils/subscriptions";

export default function ManageSubscriptions({ registrationData, onSuccess, onBack }) {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({});
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch products on mount
        const fetchProducts = async () => {
            try {
                const response = await getSubscriptionProductsDetails();
                if (response?.success && response?.products) {
                    setProducts(response.products);

                    // Initialize selection state
                    const initialSelection = response.products.reduce((acc, p) => ({
                        ...acc,
                        [p.skuCode]: {
                            selected: false,
                            planId: p.plans.find(plan => plan.type === "monthly" && plan.currency === "INR")?.planId || "PLN_INR_MONTHLY"
                        }
                    }), {});

                    setSelectedProducts(initialSelection);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (err) {
                console.error("Failed to load products", err);
                setError("Failed to load subscription products. Please refresh and try again.");
            } finally {
                setLoadingProducts(false);
            }
        };

        fetchProducts();
        const scriptId = "razorpay-checkout-js";
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const toggleProduct = (skuCode) => {
        setSelectedProducts(prev => ({
            ...prev,
            [skuCode]: { ...prev[skuCode], selected: !prev[skuCode].selected }
        }));
    };

    const handlePlanChange = (skuCode, planId) => {
        setSelectedProducts(prev => ({
            ...prev,
            [skuCode]: { ...prev[skuCode], planId }
        }));
    };

    const handleProceedToPayment = async () => {
        setError(null);

        const productsToPurchase = Object.entries(selectedProducts)
            .filter(([_, data]) => data.selected)
            .map(([skuCode, data]) => ({ skuCode, planId: data.planId }));

        if (productsToPurchase.length === 0) {
            setError("Please select at least one product to continue.");
            return;
        }

        setLoading(true);

        try {
            const parsedAge = parseInt(registrationData.age);
            const parsedPartyId = parseInt(registrationData.party_id);
            const payload = {
                organization_details: {
                    ...registrationData,
                    age: isNaN(parsedAge) ? 0 : parsedAge,
                    party_id: isNaN(parsedPartyId) ? null : parsedPartyId,
                    organization_name: registrationData.organization_name?.trim() || registrationData.name?.trim() || "Organization",
                },
                products: productsToPurchase
            };

            const checkoutResponse = await initializeOrganizationCheckout(payload);

            if (!checkoutResponse || !checkoutResponse.order_id) {
                // Check if error is inside checkoutResponse.error
                const apiMsg = checkoutResponse?.detail || checkoutResponse?.message || checkoutResponse?.msg || checkoutResponse?.error || "Unable to create order. Please try again.";
                throw new Error(apiMsg);
            }

            const keyId = (window.ENV && window.ENV.RAZORPAY_KEY_ID) || "rzp_test_RsAVPL1MxCXzoE";

            const options = {
                key: keyId,
                amount: checkoutResponse.amount * 100, // Amount in paise
                currency: "INR",
                name: "Margadarsh",
                description: "Organization Subscription",
                order_id: checkoutResponse.order_id,
                handler: async function (response) {
                    try {
                        setLoading(true);
                        const verifyData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        };

                        const verification = await verifyOrganizationCheckout(verifyData);
                        if (verification?.success || verification?.msg) {
                            if (onSuccess) onSuccess("Organization created successfully! Please log in.");
                        } else {
                            throw new Error(verification?.detail || verification?.message || "Payment verification failed on the server.");
                        }
                    } catch (err) {
                        alert(err.message || "Payment verification failed. Please contact support.");
                        setError(err.message || "Payment verification failed.");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: registrationData.name,
                    email: registrationData.email,
                },
                theme: {
                    color: "#3399cc"
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setError("Payment failed: " + response.error.description);
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            setError(err.message || "Failed to initialize payment.");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 w-full">
                    <span className="text-red-400 text-base mt-0.5">⚠</span>
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-white/50 text-sm">Loading available modules...</p>
                </div>
            ) : (
                <div className="space-y-3 w-full">
                    {products.map((p) => {
                        const isSelected = selectedProducts[p.skuCode]?.selected || false;
                        const currentPlanId = selectedProducts[p.skuCode]?.planId;
                        const selectedPlan = p.plans.find(plan => plan.planId === currentPlanId);

                        return (
                            <div key={p.skuCode} className={`w-full p-4 rounded-xl border transition-all \${isSelected ? 'bg-blue-600/10 border-blue-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleProduct(p.skuCode)}
                                            className="w-4 h-4 rounded text-blue-600 bg-gray-900 border-gray-600 focus:ring-blue-500/60 focus:ring-offset-gray-950"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-white block">{p.name}</span>
                                            <span className="text-xs text-white/50 block mt-0.5">{p.description}</span>
                                        </div>
                                    </label>

                                    {p.plans && p.plans.length > 0 && (
                                        <div className="flex flex-col items-end gap-1.5 ml-4">
                                            <select
                                                value={currentPlanId}
                                                onChange={(e) => handlePlanChange(p.skuCode, e.target.value)}
                                                className="bg-gray-900 border border-white/20 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 w-32"
                                            >
                                                {p.plans.filter(plan => plan.currency === 'INR').map(plan => (
                                                    <option key={plan.planId} value={plan.planId}>
                                                        {plan.type === 'monthly' ? 'Monthly' : 'Yearly'} ({plan.currency})
                                                    </option>
                                                ))}
                                            </select>

                                            {selectedPlan && (
                                                <div className="flex items-center text-sm font-bold text-white bg-blue-500/20 px-2.5 py-1 rounded-md">
                                                    {selectedPlan.currency === 'INR' ? <IndianRupee className="w-3.5 h-3.5 mr-0.5" /> : '$'}
                                                    {selectedPlan.price}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            <div className="flex gap-3 pt-2 w-full">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all border border-white/10 disabled:opacity-50"
                >
                    Back
                </button>
                <button
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-60"
                >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <>Proceed to Payment <ArrowRight className="w-4 h-4" /></>}
                </button>
            </div>
        </div>
    );
}
