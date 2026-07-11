import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  PlusCircle, ShoppingBag, DollarSign, Store, Tag, Clock,
  CheckCircle, Truck, Package, X, MapPin, User, Navigation, Trash2
} from "lucide-react";

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Tab state: "listings" | "orders"
  const [dashboardTab, setDashboardTab] = useState("listings");

  const [myListings, setMyListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Transit Dispatch modal state
  const [transitOrderId, setTransitOrderId] = useState(null);
  const [vehicleType, setVehicleType] = useState("two-wheeler");
  const [transitSubmitting, setTransitSubmitting] = useState(false);

  const fetchSellerData = async () => {
    try {
      const response = await fetch("/api/seller/listings");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate("/");
          return;
        }
        throw new Error("Failed to load inventory");
      }
      const data = await response.json();
      setMyListings(data.myListings || []);

      // Fetch customer orders placed on seller's products
      const ordersResponse = await fetch("/api/seller/orders");
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load seller catalogue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if the user has any of the seller roles or is admin
    if (user &&
      user.role !== "farmer" &&
      user.role !== "fertilizer_seller" &&
      user.role !== "instrument_seller" &&
      user.role !== "admin" &&
      user.email !== "sramu1090@gmail.com") {
      navigate("/");
      return;
    }
    fetchSellerData();
  }, [user]);

  const handleAcceptOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/accept`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Order accepted successfully!");
        setTimeout(() => setMessage(""), 3000);
        await fetchSellerData();
      } else {
        alert(data.error || "Failed to accept order.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReturn = async (orderId) => {
    if (!window.confirm("Confirm receipt of the equipment? The system will check the return due date and automatically assess late charges of 1.5x daily rate if overdue.")) {
      return;
    }
    try {
      const response = await fetch(`/api/orders/${orderId}/confirm-return`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        let returnMsg = "Return confirmed successfully!";
        if (data.lateDays > 0) {
          returnMsg += ` Assessed Late Fees: ₹${data.overdueCharges} for ${data.lateDays} overdue days.`;
        }
        alert(returnMsg);
        await fetchSellerData();
      } else {
        alert(data.error || "Failed to confirm return.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  const handleRequestTransit = async (e) => {
    e.preventDefault();
    if (!transitOrderId) return;
    setTransitSubmitting(true);
    try {
      const response = await fetch(`/api/orders/${transitOrderId}/request-transit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleType })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Transit request sent to transporters!");
        setTimeout(() => setMessage(""), 3000);
        setTransitOrderId(null);
        setVehicleType("motorcycle");
        await fetchSellerData();
      } else {
        alert(data.error || "Failed to dispatch transit request.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTransitSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Syncing Seller Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up space-y-8 text-left">
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg font-bold text-xs">
          {message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
              <Store size={14} />
              <span>Seller Management Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Seller Inventory Hub
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-404 leading-relaxed font-sans">
              Register stock items, manage your listings, accept inbound customer purchases, and request transit shipping dispatches.
            </p>
          </div>
          <Link
            to="/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm flex items-center space-x-2 transition-all transform active:scale-95 text-xs self-start"
          >
            <PlusCircle size={16} />
            <span>List New Product</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-blue-600 dark:text-blue-400">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Total Products Listed</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white font-sans">{myListings.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl text-emerald-600 dark:text-emerald-450">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Estimated Inventory Value</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
              ₹{myListings.reduce((sum, item) => sum + (item.price || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setDashboardTab("listings")}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${dashboardTab === "listings" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
        >
          My Listed Products
        </button>
        <button
          onClick={() => setDashboardTab("orders")}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${dashboardTab === "orders" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
        >
          Shopper Orders ({orders.length})
        </button>
      </div>

      {/* Tab: Products List */}
      {dashboardTab === "listings" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Store className="text-blue-600 dark:text-blue-400" size={20} />
            <span>Store Inventory Catalogue</span>
          </h2>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-4 rounded-xl font-bold text-center text-xs">
              {error}
            </div>
          )}

          {myListings.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold font-sans">You haven't listed any products yet.</p>
              <Link to="/new" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold mt-2 inline-block text-xs">Create your first product listing</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {myListings.map((item) => (
                <div key={item._id} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between group">
                  <div>
                    <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-slate-950">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/25 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md flex items-center space-x-1 shadow uppercase tracking-wider">
                          <Tag size={10} />
                          <span>Active</span>
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-1 text-left">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed min-h-[3rem] font-sans">{item.description}</p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 mt-4 border-t border-slate-100 dark:border-slate-900/60 pt-3 flex justify-between items-center">
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-450 font-sans">₹{item.price} / {item.priceUnit || "kg"}</span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm("Are you sure you want to delete this listing?")) {
                          try {
                            const res = await fetch(`/api/listings/${item._id}`, { method: "DELETE" });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setMessage("Listing deleted successfully!");
                              await fetchSellerData();
                              setTimeout(() => setMessage(""), 3000);
                            } else {
                              alert(data.error || "Failed to delete listing.");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Failed to delete listing.");
                          }
                        }
                      }}
                      className="text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-all"
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Customer Orders */}
      {dashboardTab === "orders" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Clock className="text-blue-600 dark:text-blue-400" size={20} />
            <span>Shopper Order Requests</span>
          </h2>

          {orders.length === 0 ? (
            <p className="text-center text-slate-500 py-16 font-semibold font-sans">No customer orders received yet.</p>
          ) : (
            <div className="space-y-6 text-left">
              {orders.map((order) => (
                <div key={order._id} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-800 transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    {/* Order Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="text-left">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{order.product?.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold flex items-center space-x-1 font-sans">
                          <Clock size={10} />
                          <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${order.status === "Delivered" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400" :
                        order.status === "Cancelled" ? "bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 text-red-650 dark:text-red-400" :
                          order.status === "Transit Requested" || order.status === "In Transit" ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/25 text-blue-600 dark:text-blue-400 animate-pulse animate-duration-1000" :
                            "bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/25 text-amber-600 dark:text-amber-400"
                        }`}>
                        {order.status}
                      </span>
                    </div>

                    {order.isRental && (
                      <div className="bg-white dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800/50 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex justify-between items-center mt-2 font-sans font-semibold">
                        <span>📅 Rental Period: <strong className="text-slate-800 dark:text-slate-200">{order.rentalStartDate ? new Date(order.rentalStartDate).toLocaleDateString() : "TBD"} - {order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString() : "TBD"}</strong></span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                          order.rentalReturnStatus === "None" ? "bg-amber-50 border-amber-100 text-amber-600" :
                          order.rentalReturnStatus === "Return Pending" ? "bg-blue-50 border-blue-100 text-blue-600 animate-pulse" :
                          "bg-emerald-50 border-emerald-100 text-emerald-650"
                        }`}>
                          Return: {order.rentalReturnStatus}
                        </span>
                      </div>
                    )}
                    {/* Order Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-4 font-semibold">
                      <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-left">
                        <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400">Shopper Details</span>
                        <p className="font-extrabold text-slate-800 dark:text-slate-300 font-sans">{order.buyer?.fullName || order.buyer?.username}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-sans font-bold">{order.phone}</p>
                      </div>

                      <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-left">
                        <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400">Shipping Address</span>
                        <p className="text-slate-500 dark:text-slate-400 italic line-clamp-2 font-sans font-bold">{order.shippingAddress}</p>
                      </div>

                      <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-left font-sans">
                        <span className="text-[9px] uppercase font-bold text-blue-650 dark:text-blue-400">Price Breakup</span>
                        {order.isRental ? (
                          <>
                            <p className="text-slate-600 dark:text-slate-350">Daily Rent: <strong>₹{(order.price / order.rentalDurationDays).toFixed(0)}/day</strong></p>
                            <p className="text-slate-600 dark:text-slate-350">Duration: <strong>{order.rentalDurationDays} Days</strong></p>
                            <p className="text-emerald-600 dark:text-emerald-450 font-extrabold">Total: ₹{order.price}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-slate-600 dark:text-slate-350">Quantity: <strong>{order.quantity}</strong></p>
                            <p className="text-emerald-600 dark:text-emerald-450 font-extrabold">Total: ₹{order.price * order.quantity}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions depending on status */}
                  <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-900/60 mt-4">
                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleAcceptOrder(order._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center space-x-1.5 text-xs shadow-sm active:scale-95"
                      >
                        <CheckCircle size={12} />
                        <span>Accept Order</span>
                      </button>
                    )}

                    {order.status === "Accepted" && (
                      <button
                        onClick={() => setTransitOrderId(order._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center space-x-1.5 text-xs shadow-sm active:scale-95"
                      >
                        <Truck size={12} />
                        <span>Request Transit Logistics</span>
                      </button>
                    )}

                    {order.status === "Transit Requested" && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center space-x-1.5 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm font-sans">
                        <Clock className="text-amber-500 dark:text-amber-400 animate-pulse" size={12} />
                        <span>Awaiting transporter assignment for <strong>{order.vehicleType}</strong>...</span>
                      </div>
                    )}

                    {order.status === "In Transit" && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center space-x-1.5 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-sm font-sans">
                        <Navigation className="text-blue-600 dark:text-blue-400 animate-spin" size={12} />
                        <span>Shipment is In Transit ({order.currentLocation?.name || "Picked Up"})</span>
                      </div>
                    )}

                    {order.status === "Delivered" && order.isRental && order.rentalReturnStatus === "Return Pending" && (
                      <button
                        onClick={() => handleConfirmReturn(order._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center space-x-1.5 text-xs shadow-sm active:scale-95"
                      >
                        <CheckCircle size={12} />
                        <span>Confirm Return Received</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERLAY LOGISTICS DISPATCH MODAL */}
      {transitOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg relative text-left">
            <button
              onClick={() => setTransitOrderId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Truck className="text-blue-600 dark:text-blue-400" size={16} />
                <span>Select Transport Vehicle Size</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium font-sans">Pick a logistics transport size based on the item payload dimensions.</p>
            </div>

            <form onSubmit={handleRequestTransit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5 text-left">
                <label htmlFor="vehicleType" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Category</label>
                <select
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 focus:outline-none font-bold"
                >
                  <option value="two-wheeler" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Two-Wheeler (Motorcycle / Scooter)</option>
                  <option value="three-wheeler" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Three-Wheeler (Auto-Rickshaw / Loader)</option>
                  <option value="pickup" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pickup Truck (Mini Utility payload)</option>
                  <option value="tata-ace" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tata Ace (Chota Hathi / Medium utility)</option>
                  <option value="mini-truck" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mini-Truck (Commercial delivery transport)</option>
                  <option value="large-truck" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Large Cargo Truck (Multi-axle container)</option>
                  <option value="refrigerated-truck" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Refrigerated Cold-Chain Truck</option>
                  <option value="container" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Closed container transport</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransitOrderId(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl shadow-sm"
                >
                  {transitSubmitting ? "Requesting..." : "Request Transit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
