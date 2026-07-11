import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingCart, Star, Video, PlusCircle, MessageSquare, Sprout,
  MapPin, CheckCircle, ChevronRight, Compass, ShieldAlert, Cpu, X, Search,
  Users, Map, Shield, ShoppingBag, Truck, BookOpen, ArrowLeft,
  FlaskConical,
  Tractor,
  Store,
  FileText,
  Package
} from "lucide-react";
import logo from "../assets/logo.png"

const Home = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Search and modal state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedTag, setSelectedTag] = useState("All");
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const getHomeTags = () => {
    if (user && user.role === "farmer") {
      return [
        { name: "All Inputs", value: "All" },
        { name: "Fertilizers & Medicines (खाद और दवा)", value: "fertilizer" },
        { name: "Equipment for Sale (बिक्री हेतु)", value: "sale" },
        { name: "Equipment for Rent (किराए हेतु)", value: "rent" }
      ];
    }
    if (user && user.role === "fertilizer_seller") {
      return [{ name: "All Fertilizers", value: "All" }];
    }
    if (user && user.role === "instrument_seller") {
      return [
        { name: "All Equipment", value: "All" },
        { name: "For Sale", value: "sale" },
        { name: "For Rent", value: "rent" }
      ];
    }
    // Guest or customer
    return [
      { name: "All Products", value: "All" },
      { name: "Wheat & Rice (गेहूं और चावल)", value: "grains" },
      { name: "Vegetables (सब्जियां)", value: "vegetables" },
      { name: "Sugarcane (गन्ना)", value: "sugarcane" },
      { name: "Other Crops (अन्य)", value: "other" }
    ];
  };

  // Hinglish to English translation map
  const hinglishMap = {
    tamatar: "tomato",
    aloo: "potato",
    pyaj: "onion",
    pyaaj: "onion",
    gehu: "wheat",
    gehun: "wheat",
    ganna: "sugarcane",
    chawal: "rice",
    dhan: "rice",
    khad: "fertilizer",
    gobar: "manure",
    dawa: "medicine",
    beej: "seed",
    paani: "water",
    mitti: "soil",
    khet: "farm",
    sabji: "vegetable"
  };

  const fetchHomeData = async () => {
    try {
      const response = await fetch("/api");
      const data = await response.json();
      setListings(data.allListings || []);
      setReviews(data.allReviews || []);
    } catch (err) {
      console.error("Error loading homepage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const handleAddToCart = async (id, e) => {
    if (e) e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`/api/addtocart/${id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ type: "success", text: "Added to cart successfully!" });
        await refreshUser();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.error || "Could not add to cart." });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      console.error("Cart error:", err);
      setMessage({ type: "error", text: "Network error. Please try again." });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const getSearchKeywords = (query) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return [];

    const keywords = [cleanQuery];

    if (hinglishMap[cleanQuery]) {
      keywords.push(hinglishMap[cleanQuery]);
    }

    Object.keys(hinglishMap).forEach(key => {
      if (cleanQuery.includes(key)) {
        keywords.push(hinglishMap[key]);
      }
    });

    return keywords;
  };

  const filteredListings = listings.filter((item) => {
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
    } else {
      if (item.category !== "organic_product") return false;
    }

    if (selectedTag !== "All") {
      const title = item.title.toLowerCase();
      const desc = item.description.toLowerCase();

      if (selectedTag === "grains") {
        const isGrain = ["wheat", "rice", "gehu", "chawal", "dhan", "wheet"].some(kw => title.includes(kw) || desc.includes(kw));
        if (!isGrain) return false;
      } else if (selectedTag === "vegetables") {
        const isVeg = ["vegetable", "sabji", "potato", "onion", "tomato", "aloo", "pyaj", "tamatar"].some(kw => title.includes(kw) || desc.includes(kw));
        if (!isVeg) return false;
      } else if (selectedTag === "sugarcane") {
        const isSugarcane = ["sugarcane", "ganna"].some(kw => title.includes(kw) || desc.includes(kw));
        if (!isSugarcane) return false;
      } else if (selectedTag === "other") {
        const isGrain = ["wheat", "rice", "gehu", "chawal", "dhan", "wheet"].some(kw => title.includes(kw) || desc.includes(kw));
        const isVeg = ["vegetable", "sabji", "potato", "onion", "tomato", "aloo", "pyaj", "tamatar"].some(kw => title.includes(kw) || desc.includes(kw));
        const isSugarcane = ["sugarcane", "ganna"].some(kw => title.includes(kw) || desc.includes(kw));
        if (isGrain || isVeg || isSugarcane) return false;
      } else if (selectedTag === "fertilizer") {
        if (item.category !== "medicine_fertilizer") return false;
      } else if (selectedTag === "sale") {
        if (item.category !== "instrument_sale") return false;
      } else if (selectedTag === "rent") {
        if (item.category !== "instrument_rent") return false;
      }
    }

    if (!searchQuery) return true;

    const title = item.title.toLowerCase();
    const desc = item.description.toLowerCase();
    const keywords = getSearchKeywords(searchQuery);

    return keywords.some(keyword => title.includes(keyword) || desc.includes(keyword));
  });

  const isFarmer = user && user.role === "farmer";
  const isSeller = user && (user.role === "farmer" || user.role === "fertilizer_seller" || user.role === "instrument_seller");
  const canBuy = user && user.role !== "admin" && user.role !== "transporter" && user.role !== "agent";

  const recentReviews = reviews.slice(-5).reverse();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 space-y-16 animate-fade-in-up text-left">
      {/* Toast alert banner */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-white font-bold flex items-center space-x-2 border ${message.type === "success" ? "bg-emerald-600 border-emerald-500 text-white" : "bg-red-650 border-red-500 text-white"
          }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Banner Grid */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 p-8 sm:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[500px]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Hero Text */}
        <div className="lg:col-span-7 space-y-6 text-left relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Sprout size={12} />
            <span>Sustainable AgriTech Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Trishastik Bharat <br />
            <span className="text-blue-600 dark:text-blue-400">Sustainable Farms</span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl font-sans">
            A complete digital platform for organic farming, bringing together soil testing, certified laboratory reports, equipment rental, fertilizer services, direct farmer marketplace, transportation, and crop education in one place.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {isSeller && (
              <Link
                to="/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm flex items-center space-x-2 transition-all transform active:scale-95 text-xs"
              >
                <PlusCircle size={14} />
                <span>List New Product</span>
              </Link>
            )}
            {isFarmer && (
              <Link
                to="/newreview"
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <MessageSquare size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Write Testimonial</span>
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm flex items-center space-x-2 transition-all transform active:scale-95 text-xs"
              >
                <span>Get Started Now</span>
                <ChevronRight size={14} />
              </Link>
            )}
            {isFarmer && (
              <Link
                to="/soil-test"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-sm flex items-center space-x-2 transition-all transform active:scale-95 text-xs"
              >
                <Sprout size={14} />
                <span>Request Soil Test</span>
              </Link>
            )}
            <Link
              to="/about"
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <span>Learn More</span>
            </Link>
          </div>
        </div>

        {/* Right Hero Image Panel */}
        <div className="lg:col-span-5 relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
          <img src={logo} alt="logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Bottom Hero Features Grid Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><Store size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Organic Marketplace</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Buy fresh organic products directly from farmers.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><FlaskConical size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Free Soil Testing</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Request laboratory soil testing with field agent support.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><ShoppingBag size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Fertilizer Store</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Purchase fertilizers and crop protection products.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><Tractor size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Equipment Rental</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Rent or purchase agricultural equipment as needed.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><BookOpen size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Crop Education</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Learn organic farming practices for different crops.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><Truck size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Smart Logistics</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Automated delivery through the nearest available transporter.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><FileText size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Soil Reports</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">View approved laboratory reports from your dashboard.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><Sprout size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Farmer Selling</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">List and sell organic farm products directly to customers.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><Package size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Equipment Store</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Buy agricultural tools and machinery from verified sellers.</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:border-blue-500/20 transition-all shadow-sm text-left">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 w-fit"><ShoppingCart size={18} /></div>
          <div className="mt-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider">Farmer Shopping</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-sans">Farmers can also purchase products from other farmers.</p>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-sm text-left animate-fade-in-up">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="text-left space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">
                {user && user.role === "farmer" ? "Recommended Farming Inputs" : "Featured Organic Marketplace"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">
                {user && user.role === "farmer"
                  ? "Top fertilizers, dynamic tool rents, and equipment listed by verified agronomists"
                  : "Fresh organic crops, grains, and vegetables directly from certified farms"}
              </p>
            </div>

            {/* Search Bar with Flipkart suggestion overlay */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search (e.g. ganna, tamatar, potato)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl text-xs focus:outline-none focus:border-blue-650"
              />
              {searchQuery && (
                <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredListings.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500 text-center font-semibold">No matches found</div>
                  ) : (
                    filteredListings.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => navigate(`/product/${item._id}`)}
                        className="p-3 flex items-center space-x-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <img src={item.image} alt={item.title} className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-950" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"; }} />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800 dark:text-white line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold">₹{item.price}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Flipkart Category Pills */}
          <div className="flex flex-wrap gap-2 pb-2 justify-start">
            {getHomeTags().map((tag) => (
              <button
                key={tag.value}
                onClick={() => {
                  setSelectedTag(tag.value);
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border shadow-sm ${selectedTag === tag.value
                  ? "bg-blue-600 text-white border-blue-500 font-extrabold scale-105"
                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
                  }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {filteredListings.length === 0 ? (
            <p className="text-center text-slate-500 py-12 font-semibold font-sans">No products match your filters.</p>
          ) : (
            <div className="space-y-8 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredListings.slice(0, 8).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => navigate(`/product/${item._id}`)}
                    className="cursor-pointer bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-950">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                        />
                      </div>
                      <div className="p-4 space-y-1.5 text-left">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          {item.category?.replace("_", " ")}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pt-1">{item.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[2rem] leading-relaxed font-sans">{item.description}</p>

                        {/* Star Rating Mockup */}
                        <div className="flex items-center space-x-1 text-amber-500 pt-0.5">
                          <div className="flex space-x-0.5">
                            {[...Array(4)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                            <Star size={11} className="text-slate-200 dark:text-slate-700" />
                          </div>
                          <span className="text-[9px] text-slate-500 font-bold font-sans">(15)</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0 space-y-3">
                      {/* Strikethrough Pricing Layout */}
                      <div className="space-y-0.5 text-left">
                        <div className="flex items-baseline space-x-1.5 font-sans">
                          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">₹{item.price}</span>
                          <span className="text-xs text-slate-400 line-through">₹{Math.round(item.price * 1.25)}</span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-450 font-extrabold bg-emerald-50 dark:bg-emerald-500/10 px-1 rounded-md">20% OFF</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold block font-sans">per {item.priceUnit || "kg"}</span>
                      </div>

                      {(canBuy || !user) && (
                        <button
                          onClick={(e) => handleAddToCart(item._id, e)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs shadow-sm"
                        >
                          <ShoppingCart size={14} />
                          <span>Add to Cart</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredListings.length > 8 && (
                <div className="text-center pt-6">
                  <Link
                    to="/shop"
                    className="inline-flex items-center space-x-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-6 py-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all text-xs shadow-sm font-sans"
                  >
                    <span>View All {filteredListings.length} Products in Shop</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-16 px-6 sm:px-8 rounded-3xl shadow-sm relative text-left">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 relative">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">Kisan Testimonials</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-sans">Real stories from farmers across Bharat implementing sustainable tech tools</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-500 mx-auto rounded-full mt-4"></div>

            {isFarmer && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <Link
                  to="/newreview"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm text-xs flex items-center space-x-1.5 transition-all transform active:scale-95"
                >
                  <PlusCircle size={14} />
                  <span>Share Your Story</span>
                </Link>
              </div>
            )}
          </div>

          {recentReviews.length === 0 ? (
            <p className="text-center text-slate-500 py-12 font-semibold">No testimonials yet. Be the first to leave one!</p>
          ) : (
            <div className="relative max-w-2xl mx-auto flex flex-col items-center">
              {/* Testimonial Card */}
              <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-sm text-center min-h-[180px] flex flex-col justify-between transition-all duration-300 transform scale-100">
                <div className="space-y-4">
                  <div className="flex justify-center space-x-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < (recentReviews[activeReviewIdx].rating || 5) ? "currentColor" : "none"}
                        className={i < (recentReviews[activeReviewIdx].rating || 5) ? "text-amber-500" : "text-slate-350 dark:text-slate-800"}
                      />
                    ))}
                  </div>
                  <p className="text-slate-650 dark:text-slate-300 italic leading-relaxed text-sm md:text-base font-sans px-4">
                    "{recentReviews[activeReviewIdx].description}"
                  </p>
                </div>
                <div className="mt-6 border-t border-slate-250/20 dark:border-slate-850 pt-4 flex flex-col items-center">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">{recentReviews[activeReviewIdx].name}</span>
                  <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                    {recentReviews[activeReviewIdx].post || recentReviews[activeReviewIdx].Post || "Verified Farmer"}
                  </span>
                </div>
              </div>

              {/* Slider Navigation Dots & Controls */}
              <div className="flex items-center space-x-4 mt-6">
                <button
                  onClick={() => setActiveReviewIdx((prev) => (prev === 0 ? recentReviews.length - 1 : prev - 1))}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all shadow-sm"
                  title="Previous testimonial"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex space-x-1.5">
                  {recentReviews.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReviewIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${idx === activeReviewIdx ? "bg-blue-600 w-4" : "bg-slate-300 dark:bg-slate-700"}`}
                    ></button>
                  ))}
                </div>
                <button
                  onClick={() => setActiveReviewIdx((prev) => (prev === recentReviews.length - 1 ? 0 : prev + 1))}
                  className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-90 transition-all shadow-sm"
                  title="Next testimonial"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* View All Testimonials */}
              <div className="text-center mt-8">
                <Link
                  to="/testimonials"
                  className="inline-flex items-center space-x-1.5 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-xs uppercase tracking-wider font-sans"
                >
                  <span>See All Testimonials</span>
                  <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* OVERLAY MODAL: Product details display */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row animate-fade-in-up">
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 z-10 hover:scale-105 transition-all shadow-sm"
            >
              <X size={18} />
            </button>

            {/* Product Image */}
            <div className="md:w-1/2 h-64 md:h-auto bg-slate-100 dark:bg-slate-950 relative">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
              />
              <span className="absolute top-4 left-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-105 dark:border-blue-500/20 text-blue-655 dark:text-blue-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {selectedProduct.category?.replace("_", " ")}
              </span>
            </div>

            {/* Details panel */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">{selectedProduct.title}</h3>
                <p className="text-slate-650 dark:text-slate-400 text-xs leading-relaxed max-h-[160px] overflow-y-auto pr-2 font-sans">
                  {selectedProduct.description}
                </p>
                {selectedProduct.location && (
                  <p className="text-slate-500 text-[10px] flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                    <MapPin size={12} className="text-blue-655" />
                    <span>Location: {selectedProduct.location}</span>
                  </p>
                )}
              </div>

              {/* Buying option inside modal */}
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col justify-end">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-505 font-bold uppercase tracking-wider font-sans">Price</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-450">₹{selectedProduct.price}</span>
                </div>

                {canBuy ? (
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct._id);
                      setSelectedProduct(null);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm text-xs transition-all transform active:scale-95"
                  >
                    <ShoppingCart size={14} />
                    <span>Add to Cart</span>
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-center text-xs shadow-sm"
                  >
                    Sign In to Purchase
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold uppercase text-center block bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    Sellers & Admins cannot purchase items
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
