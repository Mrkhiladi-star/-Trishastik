import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { CreditCard, ShoppingBag, Truck, AlertTriangle } from "lucide-react";

const Checkout = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartTitles, setCartTitles] = useState("");
  const [loading, setLoading] = useState(true);

  // Form fields
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [address, setAddress] = useState(
    user?.address
      ? `${user.address.street || ""}, ${user.address.city || ""}, ${user.address.state || ""} - ${user.address.pincode || ""}`.replace(/^,\s*/, "")
      : ""
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [calculatingLogistics, setCalculatingLogistics] = useState(false);

  const fetchLogisticsPreview = async (currentCart, currentAddress) => {
    if (!currentCart || currentCart.length === 0) {
      setPreviewData(null);
      return;
    }
    setCalculatingLogistics(true);
    try {
      const response = await fetch("/api/checkout/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: currentAddress })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPreviewData(data);
          setTotalAmount(data.grandTotal);
        }
      }
    } catch (err) {
      console.error("Logistics preview failed:", err);
    } finally {
      setCalculatingLogistics(false);
    }
  };

  const fetchCheckoutData = async () => {
    try {
      const response = await fetch("/api/checkout");
      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch checkout details");
      }
      const data = await response.json();
      const loadedCart = data.user?.cart || [];
      setCart(loadedCart);
      setCartTitles(data.cartTitles || "");
      await fetchLogisticsPreview(loadedCart, address);
    } catch (err) {
      console.error(err);
      setError("Error loading checkout details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckoutData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      fetchLogisticsPreview(cart, address);
    }, 800);
    return () => clearTimeout(timer);
  }, [address]);

  const handleIncrementQuantity = async (id) => {
    try {
      const response = await fetch(`/api/addtocart/${id}`);
      if (response.ok) {
        await refreshUser();
        const checkoutRes = await fetch("/api/checkout");
        if (checkoutRes.ok) {
          const data = await checkoutRes.json();
          const loadedCart = data.user?.cart || [];
          setCart(loadedCart);
          setCartTitles(data.cartTitles || "");
          await fetchLogisticsPreview(loadedCart, address);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecrementQuantity = async (id) => {
    try {
      const response = await fetch(`/api/remove-one-from-cart/${id}`);
      if (response.ok) {
        await refreshUser();
        const checkoutRes = await fetch("/api/checkout");
        if (checkoutRes.ok) {
          const data = await checkoutRes.json();
          const loadedCart = data.user?.cart || [];
          setCart(loadedCart);
          setCartTitles(data.cartTitles || "");
          await fetchLogisticsPreview(loadedCart, address);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (cart.length === 0) {
      setError("Your cart is empty.");
      setSubmitting(false);
      return;
    }

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Failed to load payment gateway. Please check your internet connection.");
        setSubmitting(false);
        return;
      }

      const body = {
        fullName,
        address,
        phone
      };

      const initiateRes = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const initiateData = await initiateRes.json();
      if (!initiateRes.ok || !initiateData.success) {
        setError(initiateData.error || "Payment initiation failed.");
        setSubmitting(false);
        return;
      }

      const { key_id, razorpayOrder, metadata } = initiateData;

      const options = {
        key: key_id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "Trishastik AgriTech",
        description: "Secure Order Payment",
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            setSubmitting(true);
            const verifyRes = await fetch("/api/checkout/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                metadata
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              await refreshUser();
              navigate("/shop");
            } else {
              setError(verifyData.error || "Payment verification failed.");
            }
          } catch (err) {
            console.error("Verification failed:", err);
            setError("Signature verification failed. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        prefill: {
          name: fullName,
          contact: phone,
          email: user?.email || ""
        },
        notes: {
          address: address
        },
        theme: {
          color: "#2563EB"
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment flow interrupted:", err);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up text-left">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm max-w-5xl mx-auto space-y-8 text-left">

        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center space-x-2">
            <CreditCard className="text-blue-600 dark:text-blue-400" />
            <span>Secure Checkout</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Complete your transaction safely using encrypted channels</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-4 rounded-xl text-center text-xs font-semibold flex items-center justify-center space-x-1.5 animate-pulse">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Cart Summary Panel */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center space-x-2">
              <ShoppingBag className="text-blue-600 dark:text-blue-400" size={16} />
              <span>Cart Summary</span>
            </h3>

             <div className="space-y-4 text-xs font-semibold">
              {/* Grouped items review list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {(() => {
                  const groupedCart = [];
                  cart.forEach(item => {
                    if (!item) return;
                    const existing = groupedCart.find(g => g._id === item._id);
                    if (existing) {
                      existing.quantity += 1;
                    } else {
                      groupedCart.push({ ...item, quantity: 1 });
                    }
                  });
                  return groupedCart.map((item) => {
                    const previewItem = previewData?.items?.find(p => p.listingId === item._id);
                    const unitPrice = previewItem ? previewItem.customerPrice : item.price;
                    const itemTotal = previewItem ? previewItem.itemTotal : (item.price * item.quantity);
                    
                    return (
                      <div key={item._id} className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex flex-col gap-2 text-xs shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 truncate">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 shadow-sm"
                              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                            />
                            <div className="truncate text-left">
                              <p className="font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-sans font-bold">₹{unitPrice.toFixed(2)} each</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {/* Quantity Selector */}
                            <div className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-0.5 shadow-sm">
                              <button
                                type="button"
                                onClick={() => handleDecrementQuantity(item._id)}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all font-bold text-[10px]"
                              >
                                -
                              </button>
                              <span className="w-4 text-center font-bold text-slate-800 dark:text-white text-[10px]">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleIncrementQuantity(item._id)}
                                className="w-5 h-5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all font-bold text-[10px]"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 min-w-[50px] text-right font-sans">₹{itemTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        {previewItem && (
                          <div className="bg-slate-100/50 dark:bg-slate-900/60 p-2 rounded-lg text-[9px] text-slate-550 dark:text-slate-400 flex flex-wrap gap-x-2 gap-y-1 font-bold font-sans justify-between">
                            <span>Weight: {previewItem.totalWeight} kg</span>
                            <span>Vehicle: {previewItem.vehicleDisplayName}</span>
                            <span>Distance: {previewItem.distance} km</span>
                            <span>Delivery: ₹{previewItem.deliveryPrice}</span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
 
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-3"></div>

              {previewData && (
                <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold font-sans">
                  <div className="flex justify-between">
                    <span>Products Subtotal (incl. taxes & fees):</span>
                    <span>₹{previewData.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Delivery Charge:</span>
                    <span>₹{previewData.deliveryTotal.toFixed(2)}</span>
                  </div>
                  {calculatingLogistics && (
                    <div className="text-blue-500 text-[9px] text-center animate-pulse mt-1">
                      Recalculating delivery charges...
                    </div>
                  )}
                </div>
              )}
 
              <div className="border-t border-slate-100 dark:border-slate-800/80 my-3"></div>
 
              <div className="flex justify-between items-center text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                <span>Grand Total:</span>
                <span className="text-lg font-extrabold">₹{totalAmount.toFixed(2)}</span>
              </div></div>
            </div>

          {/* Shipping Form Panel */}
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-6 text-left">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-105 dark:border-slate-800/80 pb-3 flex items-center space-x-2">
              <Truck className="text-blue-600 dark:text-blue-400" size={16} />
              <span>Shipping Details</span>
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Recipient Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Delivery Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  placeholder="Street address, city, state, pincode"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  placeholder="Recipient telephone"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-6"
              >
                <CreditCard size={14} />
                <span>{submitting ? "Processing secure order..." : "Place Secured Order"}</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;
