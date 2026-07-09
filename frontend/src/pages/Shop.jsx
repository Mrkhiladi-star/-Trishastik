import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import {
  Trash2, ShoppingBag, CreditCard, ChevronRight, CheckCircle2,
  ArrowRight, Search, Clock, ShieldAlert, Star, Cpu, MapPin, X, Calendar
} from "lucide-react";

const ChangeMapCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const Shop = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab selection: "catalog" | "cart" | "orders"
  const [shopTab, setShopTab] = useState("catalog");

  // Catalog Category filter: "all" | "organic_product" | "medicine_fertilizer" | "instrument_sale" | "instrument_rent"
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [listings, setListings] = useState([]);
  const [cart, setCart] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [cartTitles, setCartTitles] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Tracking details
  const [trackingOrder, setTrackingOrder] = useState(null);

  // Review state
  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const fetchShopData = async () => {
    try {
      const response = await fetch("/api/shop");
      if (!response.ok) {
        if (response.status === 401) {
          navigate("/login");
          return;
        }
        throw new Error("Failed to load shop data");
      }
      const data = await response.json();
      setCart(data.user?.cart || []);
      setTotalAmount(data.totalAmount || 0);
      setCartTitles(data.cartTitles || "");
      setListings(data.allListings || []);

      // Fetch user's orders from detailed order model
      const ordersResponse = await fetch("/api/orders");
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setMyOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error loading shop data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["catalog", "cart", "orders"].includes(tabParam)) {
      setShopTab(tabParam);
    } else if (location.state && location.state.activeTab) {
      setShopTab(location.state.activeTab);
    } else {
      setShopTab("catalog");
    }
  }, [location.search, location.state]);

  const handleAddToCart = async (id) => {
    try {
      const response = await fetch(`/api/addtocart/${id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Product added to cart!");
        await refreshUser();
        await fetchShopData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Could not add to cart.");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleRemoveFromCart = async (id) => {
    try {
      const response = await fetch(`/api/remove-from-cart/${id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        await refreshUser();
        await fetchShopData();
        setMessage("Item removed from cart.");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Could not remove item.");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDecrementQuantity = async (id) => {
    try {
      const response = await fetch(`/api/remove-one-from-cart/${id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        await refreshUser();
        await fetchShopData();
        setMessage("Quantity updated.");
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage(data.error || "Could not update quantity.");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Order cancelled successfully.");
        await fetchShopData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.error || "Failed to cancel order.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitiateReturn = async (orderId) => {
    if (!window.confirm("Confirm that you have returned the equipment to the owner? This will notify the owner to verify and confirm receipt.")) {
      return;
    }
    try {
      const response = await fetch(`/api/orders/${orderId}/initiate-return`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Return request initiated successfully!");
        await fetchShopData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.error || "Failed to initiate return.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/orders/${reviewOrderId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Thank you for your feedback!");
        setReviewOrderId(null);
        setReviewComment("");
        setReviewRating(5);
        await fetchShopData();
        setTimeout(() => setMessage(""), 3000);
      } else {
        alert(data.error || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Catalog based on search, category, and user role
  const filteredListings = listings.filter(item => {
    // 1. Matches Search
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Matches Category
    let matchesCategory = false;
    if (activeCategory === "all") {
      matchesCategory = true;
    } else {
      matchesCategory = item.category === activeCategory;
    }

    // 3. User Role Restrictions (Hide items they cannot buy)
    if (user) {
      const ownerId = item.owner?._id || item.owner;
      if (ownerId && user._id && ownerId.toString() === user._id.toString()) {
        return false;
      }
      if (user.role === "customer" && item.category !== "organic_product") {
        return false;
      }
      if (user.role === "fertilizer_seller" && (item.category === "instrument_sale" || item.category === "instrument_rent")) {
        return false;
      }
      if (user.role === "instrument_seller" && item.category === "medicine_fertilizer") {
        return false;
      }
    }

    return matchesSearch && matchesCategory;
  });

  const getCanBuy = (item) => {
    if (!user) return false;
    if (user.role === "admin" || user.role === "transporter" || user.role === "agent" || user.email === "sramu1090@gmail.com") return false;
    if (user.role === "customer" && item.category !== "organic_product") return false;
    if (user.role === "fertilizer_seller" && (item.category === "instrument_sale" || item.category === "instrument_rent")) return false;
    if (user.role === "instrument_seller" && item.category === "medicine_fertilizer") return false;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-slate-800 dark:text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Connecting to shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 space-y-8 animate-fade-in-up text-left">
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 border border-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg font-bold">
          {message}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden text-left shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
            <ShoppingBag size={14} />
            <span>Trishastik Hub Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Agricultural Products & Inputs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Order organic farm fresh crops directly from farmers, or procure lab-prescribed fertilizers, additives, and high-performance equipment (for purchase or hire).
          </p>
        </div>
      </div>

      {/* Sub tabs - hidden for standard customers */}
      {user && user.role !== "customer" && (
        <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setShopTab("catalog")}
            className={`pb-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${shopTab === "catalog" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
          >
            Explore Catalog
          </button>
          <button
            onClick={() => setShopTab("cart")}
            className={`pb-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${shopTab === "cart" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
          >
            My Cart ({cart.length})
          </button>
          <button
            onClick={() => setShopTab("orders")}
            className={`pb-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${shopTab === "orders" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
          >
            My Purchases & Tracking ({myOrders.length})
          </button>
        </div>
      )}

      {/* EXPLORE CATALOG TAB */}
      {shopTab === "catalog" && (
        <div className="space-y-6">
          {/* Filters Row */}
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center">

            {/* Search Bar */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Items" },
                { id: "organic_product", label: "Organic crops" },
                { id: "medicine_fertilizer", label: "Fertilizers & Medicines" },
                { id: "instrument_sale", label: "Equipment (Buy)" },
                { id: "instrument_rent", label: "Equipment (Rent)" }
              ].filter((c) => {
                if (!user) return true;
                if (user.role === "customer") {
                  return c.id === "all" || c.id === "organic_product";
                }
                if (user.role === "fertilizer_seller") {
                  return c.id === "all" || c.id === "organic_product" || c.id === "medicine_fertilizer";
                }
                if (user.role === "instrument_seller") {
                  return c.id === "all" || c.id === "organic_product" || c.id === "instrument_sale" || c.id === "instrument_rent";
                }
                return true;
              }).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm ${activeCategory === c.id
                    ? "bg-blue-600 border-blue-500 text-white font-extrabold scale-105"
                    : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog grid */}
          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/20 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
              No products found under this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredListings.map((item) => {
                const isOwnItem = user && item.owner?._id === user._id;

                return (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/product/${item._id}`)}
                    className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm hover:border-slate-350 dark:hover:border-slate-750 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-44 overflow-hidden bg-slate-105 dark:bg-slate-950">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                        />
                        <span className={`absolute top-2 right-2 text-[8px] font-extrabold px-2 py-0.5 rounded-md border uppercase shadow-sm ${item.category === "organic_product" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                          item.category === "medicine_fertilizer" ? "bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20 text-purple-600 dark:text-purple-400" :
                            item.category === "instrument_sale" ? "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400" :
                              "bg-sky-50 dark:bg-sky-500/10 border-sky-100 dark:border-sky-500/20 text-sky-600 dark:text-sky-400"
                          }`}>
                          {item.category?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="p-4 space-y-1.5 text-left">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem] leading-relaxed font-sans">{item.description}</p>
                        {item.location && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center space-x-1 font-sans">
                            <MapPin size={10} className="text-blue-600 dark:text-blue-400" />
                            <span className="truncate">{item.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 space-y-3 mt-2 text-left">
                      <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-sans">
                        ₹{item.price} <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">/ {item.priceUnit || "kg"}</span>
                      </p>

                      {getCanBuy(item) && (
                        isOwnItem ? (
                          <button
                            disabled
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed font-bold py-2 rounded-xl text-xs"
                          >
                            My Product Listing
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item._id);
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs active:scale-95 shadow-sm"
                          >
                            <ShoppingBag size={14} />
                            <span>Add to Cart</span>
                          </button>
                        )
                      )}

                      {user && (user.role === "admin" || user.email === "sramu1090@gmail.com") && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this listing from the portal?")) {
                              try {
                                const res = await fetch(`/api/listings/${item._id}`, { method: "DELETE" });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  setMessage("Listing deleted successfully!");
                                  await fetchShopData();
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
                          className="w-full bg-red-50 dark:bg-red-500/10 hover:bg-red-100/50 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold py-2 rounded-xl text-xs transition-all active:scale-95 flex items-center justify-center space-x-1.5"
                        >
                          <Trash2 size={14} />
                          <span>Delete Listing</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SHOPPING CART TAB */}
      {shopTab === "cart" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <ShoppingBag className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Active Items Cart</h2>
          </div>

          {cart.length > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Receipt Summary</p>
                <p className="text-2xl font-extrabold text-white font-sans">Total Invoice: ₹{totalAmount.toFixed(2)}</p>
                <p className="text-xs font-medium text-blue-50 truncate max-w-lg">Products: {cartTitles}</p>
              </div>
              <Link
                to="/checkout"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-md transition-all transform active:scale-95 text-xs shrink-0"
              >
                <CreditCard size={14} />
                <span>Confirm order checkout</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          )}

          <div>
            {cart.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-3">
                <p className="text-sm font-semibold">Your shopping cart is empty.</p>
                <button
                  onClick={() => setShopTab("catalog")}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center justify-center space-x-1 text-xs mx-auto"
                >
                  <span>Explore catalog items</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div key={item._id} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group">
                      <div>
                        <div className="h-44 overflow-hidden bg-slate-100 dark:bg-slate-950">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                          />
                        </div>
                        <div className="p-4 space-y-2 text-left">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{item.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-sans">{item.description}</p>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider font-sans">
                            Unit Price: ₹{item.price} / {item.priceUnit || "kg"}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-900/60 pt-3 space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Quantity:</span>
                          <div className="flex items-center space-x-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-sm">
                            <button
                              type="button"
                              onClick={() => handleDecrementQuantity(item._id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-slate-800 dark:text-white text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleAddToCart(item._id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <div className="flex flex-col text-left">
                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">Subtotal</span>
                            <span className="text-base font-extrabold text-emerald-605 dark:text-emerald-450 font-sans">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item._id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 p-2 rounded-xl transition-all"
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MY PURCHASES TAB (Flipkart-style Order Tracker) */}
      {shopTab === "orders" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Inbound Deliveries & Purchases</h2>
          </div>

          {myOrders.length === 0 ? (
            <p className="text-center text-slate-500 py-12 text-xs font-semibold">No orders recorded yet.</p>
          ) : (
            <div className="space-y-6">
              {myOrders.map((order) => {
                const canCancel = order.status === "Pending" || order.status === "Accepted";

                return (
                  <div key={order._id} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-800 transition-all text-left">

                    {/* Header */}
                    <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="text-left">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{order.product?.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-1">
                          Seller: {order.seller?.fullName || order.seller?.username} | Price: ₹{order.price}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold border uppercase tracking-wider shadow-sm ${order.status === "Delivered" ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                          order.status === "Cancelled" ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-650 dark:text-red-400" :
                            "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse"
                          }`}>
                          {order.status}
                        </span>

                        {canCancel && (
                          <button
                            onClick={() => handleCancelOrder(order._id)}
                            className="bg-red-55 dark:bg-red-500/10 hover:bg-red-100/50 dark:hover:bg-red-500/25 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold px-3 py-1 rounded-lg text-[9px] transition-all"
                          >
                            Cancel Order
                          </button>
                        )}

                        {order.status === "Delivered" && !order.review?.rating && (
                          <button
                            onClick={() => setReviewOrderId(order._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] transition-all shadow-sm active:scale-95"
                          >
                            Leave Review
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Details & Logistics Status Timeline */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center relative">
                        <div className="absolute left-2 right-2 h-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none -z-10"></div>
                        {["Pending", "Accepted", "Transit Requested", "In Transit", "Delivered"].map((stage, idx) => {
                          const stages = ["Pending", "Accepted", "Transit Requested", "In Transit", "Delivered"];
                          const currentIdx = stages.indexOf(order.status);
                          const isPast = idx < currentIdx;
                          const isCurrent = idx === currentIdx;

                          let circleBg = "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600";
                          if (isPast) circleBg = "bg-blue-600 border-blue-500 text-white shadow-sm";
                          if (isCurrent) circleBg = "bg-blue-500 border-blue-400 text-white animate-pulse shadow-sm";
                          if (order.status === "Cancelled") {
                            circleBg = "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/25 text-red-400";
                          }

                          return (
                            <div key={stage} className="flex flex-col items-center space-y-1 relative z-10">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${circleBg}`}>
                                {isPast ? "✓" : idx + 1}
                              </div>
                              <span className={`text-[8px] font-bold uppercase tracking-wider text-center hidden sm:block ${isCurrent ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-400 dark:text-slate-500"}`}>
                                {stage.replace("Transit Requested", "Transit").replace("Requested", "")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tracking Location Description & Tracking Map Link */}
                    {order.status !== "Cancelled" && (
                      <div className="bg-white dark:bg-slate-950/30 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs font-semibold">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider block">Shipment Tracking Update</span>
                          <p className="font-bold text-slate-800 dark:text-slate-300 font-sans">
                            Current Location: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{order.currentLocation?.name || "Seller Warehouse"}</span>
                          </p>
                          {order.transporter && (
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-sans">Transporter: {order.transporter?.fullName || order.transporter?.username} ({order.transporter?.phone})</p>
                          )}
                        </div>

                        {order.status !== "Pending" && (
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white px-4 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                          >
                            <MapPin size={12} className="text-blue-600 dark:text-blue-400" />
                            <span>Live Track Dispatch Map</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Rental Details Section */}
                    {order.isRental && (
                      <div className="bg-white dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-900">
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-500/20 flex items-center space-x-1 shadow-sm">
                            <Calendar size={10} />
                            <span>Rental Order</span>
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-semibold font-sans">
                            Duration: {order.rentalDurationDays} Days
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-600 dark:text-slate-300 text-left font-sans">
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Rental Start</span>
                            <span className="font-semibold">{order.rentalStartDate ? new Date(order.rentalStartDate).toLocaleDateString() : "Pending Delivery"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Return Due Date</span>
                            <span className="font-semibold">{order.rentalEndDate ? new Date(order.rentalEndDate).toLocaleDateString() : "Pending Delivery"}</span>
                          </div>
                        </div>

                        {/* Return Actions and Badges */}
                        <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-900/60 mt-1">
                          <div className="text-left">
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Return Status</span>
                            {order.rentalReturnStatus === "None" ? (
                              <span className="text-amber-600 dark:text-amber-400 font-extrabold uppercase text-[10px]">Active / Held by Farmer</span>
                            ) : order.rentalReturnStatus === "Return Pending" ? (
                              <span className="text-amber-500 font-extrabold uppercase text-[10px] animate-pulse">Return Awaiting Confirmation</span>
                            ) : order.rentalReturnStatus === "Returned" ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[10px]">Returned Successfully</span>
                            ) : (
                              <span className="text-red-655 dark:text-red-405 font-extrabold uppercase text-[10px]">Overdue</span>
                            )}
                          </div>

                          {/* Initiate Return Action Button */}
                          {order.status === "Delivered" && order.rentalReturnStatus === "None" && (
                            <button
                              onClick={() => handleInitiateReturn(order._id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                            >
                              <Calendar size={12} />
                              <span>Initiate Return (वापसी शुरू करें)</span>
                            </button>
                          )}

                          {order.rentalReturnStatus === "Returned" && order.rentalOverdueCharges > 0 && (
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Late Overdue Fees</span>
                              <span className="text-red-500 dark:text-red-400 font-extrabold">₹{order.rentalOverdueCharges}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Review Display */}
                    {order.review?.rating > 0 && (
                      <div className="bg-white dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1 text-left">
                        <div className="flex space-x-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={11} fill={i < order.review.rating ? "currentColor" : "none"} className="text-amber-500" />
                          ))}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 italic">"{order.review.comment}"</p>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OVERLAY MODAL: Live Track Dispatch Map */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-lg text-left">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5 text-left">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <MapPin className="text-blue-600 dark:text-blue-400 animate-bounce" size={16} />
                  <span>Shipment Dispatch Tracking Map</span>
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Tracking coordinates from {trackingOrder.seller?.fullName} to Destination Address</p>
              </div>
              <button
                onClick={() => setTrackingOrder(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 relative">
              <MapContainer
                center={[
                  trackingOrder.currentLocation?.latitude || 27.56,
                  trackingOrder.currentLocation?.longitude || 80.68
                ]}
                zoom={10}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Marker for Origin */}
                <Marker
                  position={[
                    trackingOrder.product?.latitude || 27.56,
                    trackingOrder.product?.longitude || 80.68
                  ]}
                />

                {/* Marker for current transport location */}
                <Marker
                  position={[
                    trackingOrder.currentLocation?.latitude || 27.56,
                    trackingOrder.currentLocation?.longitude || 80.68
                  ]}
                />

                <ChangeMapCenter
                  center={[
                    trackingOrder.currentLocation?.latitude || 27.56,
                    trackingOrder.currentLocation?.longitude || 80.68
                  ]}
                />
              </MapContainer>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="text-left space-y-1 font-semibold">
                <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400">Current Progress</span>
                <p className="font-bold text-slate-900 dark:text-white">{trackingOrder.currentLocation?.name || "Seller Warehouse"}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">Transporter: {trackingOrder.transporter?.fullName || trackingOrder.transporter?.username} ({trackingOrder.transporter?.phone})</p>
              </div>
              <div className="text-right space-y-0.5 font-bold">
                <p className="text-[10px]">Invoice: ₹{trackingOrder.price}</p>
                <p className="text-[10px]">Status: {trackingOrder.status}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: Leave Review */}
      {reviewOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg text-left">
            <div className="flex justify-between items-center border-b border-slate-105 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Star className="text-blue-600 dark:text-blue-400" size={16} />
                <span>Rate & Review Product</span>
              </h3>
              <button
                onClick={() => setReviewOrderId(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rating Star Scale</label>
                <div className="flex space-x-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setReviewRating(val)}
                      className="p-1 rounded text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Star size={24} fill={val <= reviewRating ? "#eab308" : "none"} className={val <= reviewRating ? "text-amber-500" : "text-slate-300 dark:text-slate-600"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="revCom" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Review Comments</label>
                <textarea
                  id="revCom"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience using this product..."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 h-20 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOrderId(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Shop;
