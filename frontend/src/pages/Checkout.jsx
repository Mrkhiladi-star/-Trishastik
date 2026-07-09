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
      setCart(data.user?.cart || []);
      setTotalAmount(data.totalAmount || 0);
      setCartTitles(data.cartTitles || "");
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

  const handleIncrementQuantity = async (id) => {
    try {
      const response = await fetch(`/api/addtocart/${id}`);
      if (response.ok) {
        await refreshUser();
        await fetchCheckoutData();
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
        await fetchCheckoutData();
      }
    } catch (err) {
      console.error(err);
    }
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
      const body = {
        listing: {
          name: fullName,
          address: address,
          phone: Number(phone.replace(/\D/g, "")), // clean number
          totalamount: totalAmount,
          products: cartTitles
        },
        productIds: cart.map(item => item._id)
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshUser();
        navigate("/shop");
      } else {
        setError(data.error || "Order placement failed.");
      }
    } catch (err) {
      console.error("Order submit failed:", err);
      setError("Network error. Please try again.");
    } finally {
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
                  return groupedCart.map((item) => (
                    <div key={item._id} className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3 text-xs shadow-sm">
                      <div className="flex items-center space-x-3 truncate">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-900 shadow-sm"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                        />
                        <div className="truncate text-left">
                          <p className="font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-sans font-bold">₹{item.price} each</p>
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
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 min-w-[50px] text-right font-sans">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800/80 my-3"></div>

              <div className="flex justify-between items-center text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                <span>Grand Total:</span>
                <span className="text-lg font-extrabold">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
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
