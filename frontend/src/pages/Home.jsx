import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingCart, Star, Video, PlusCircle, MessageSquare, Sprout,
  MapPin, CheckCircle, ChevronRight, Compass, ShieldAlert, Cpu, X, Search
} from "lucide-react";

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
      const response = await fetch("/api/");
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
    if (e) e.stopPropagation(); // Avoid opening the product modal

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

    // Check direct translations
    if (hinglishMap[cleanQuery]) {
      keywords.push(hinglishMap[cleanQuery]);
    }

    // Check partial matches
    Object.keys(hinglishMap).forEach(key => {
      if (cleanQuery.includes(key)) {
        keywords.push(hinglishMap[key]);
      }
    });

    return keywords;
  };

  const filteredListings = listings.filter((item) => {
    // 1. If not logged in, show ONLY organic products
    if (!user) {
      if (item.category !== "organic_product") return false;
    } else {
      // 2. If logged in, filter based on role authorization
      if (user.role === "customer") {
        if (item.category !== "organic_product") return false;
      } else if (user.role === "farmer") {
        // Farmers buy fertilizers and tools, not organic crops
        if (item.category === "organic_product") return false;
      } else if (user.role === "fertilizer_seller") {
        // Fertilizer sellers see only fertilizers
        if (item.category !== "medicine_fertilizer") return false;
      } else if (user.role === "instrument_seller") {
        // Instrument sellers see only equipment
        if (item.category !== "instrument_sale" && item.category !== "instrument_rent") return false;
      }
    }

    // Tag-based filtering
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

  const isAdmin = user && (user.role === "admin" || user.email === "sramu1090@gmail.com");
  const isCustomer = user && user.role === "customer" && user.email !== "sramu1090@gmail.com";
  const isFarmer = user && user.role === "farmer";
  const isSeller = user && (user.role === "farmer" || user.role === "fertilizer_seller" || user.role === "instrument_seller");

  // Checking if user is allowed to purchase products
  const canBuy = user && user.role !== "admin" && user.role !== "transporter" && user.role !== "agent";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider">Starting Dev Server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 space-y-16 animate-fade-in-up">
      {/* Toast alert banner */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-white font-semibold flex items-center space-x-2 animate-bounce border ${message.type === "success" ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-red-500 border-red-400"
          }`}>
          <span>{message.text}</span>
        </div>
      )}

      {/* Hero Banner Grid */}
      <div className="relative glass-panel rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 p-8 sm:p-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[500px]">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        {/* Hero Text */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Sprout size={12} />
            <span>Sustainable AgriTech Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Trishastik Bharat <br />
            <span className="gradient-text-emerald">Sustainable Farms</span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
            Empowering rural India with scientific soil tests, automated NPK summaries, and certified organic marketplace products. Together we build sustainable food cycles.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {isSeller && (
              <Link
                to="/new"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 text-sm"
              >
                <PlusCircle size={18} />
                <span>List New Product</span>
              </Link>
            )}
            {isFarmer && (
              <Link
                to="/newreview"
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-semibold px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm"
              >
                <MessageSquare size={18} className="text-emerald-400" />
                <span>Write Testimonial</span>
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 text-sm"
              >
                <span>Get Started Now</span>
                <ChevronRight size={16} />
              </Link>
            )}
            {isFarmer && (
              <Link
                to="/soil-test"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 text-sm"
              >
                <Sprout size={18} />
                <span>Request Soil Test</span>
              </Link>
            )}
            <Link
              to="/about"
              className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-semibold px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm"
            >
              <span>Learn More</span>
            </Link>
          </div>
        </div>

        {/* Hero Features Card Panel */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          <div className="glass-panel-light p-5 rounded-2xl border border-slate-800/60 flex items-start space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5">
              <CheckCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Interactive Pin Mapping</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Pin your land on dynamic coordinates map to fetch exact weather and local soil composition.</p>
            </div>
          </div>

          <div className="glass-panel-light p-5 rounded-2xl border border-slate-800/60 flex items-start space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5">
              <Cpu size={20} className="animate-pulse-glow" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Grok AI Cognitive Engine</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Deep NPK analyses, nutrient deficiencies explanation, organic compost dosage rates per acre.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <section className="glass-panel py-16 px-6 sm:px-8 rounded-3xl border border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="text-left space-y-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight animate-fade-in">
                {user && user.role === "farmer" ? "Recommended Farming Inputs" : "Featured Organic Marketplace"}
              </h2>
              <p className="text-sm text-slate-400">
                {user && user.role === "farmer"
                  ? "Top fertilizers, dynamic tool rents, and equipment listed by verified agronomists"
                  : "Fresh organic crops, grains, and vegetables directly from certified farms"}
              </p>
            </div>

            {/* Search Bar with Hinglish capabilities */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search (e.g. ganna, tamatar, potato)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Flipkart Category Tag Pills */}
          <div className="flex flex-wrap gap-2 pb-2 justify-start">
            {getHomeTags().map((tag) => (
              <button
                key={tag.value}
                onClick={() => {
                  setSelectedTag(tag.value);
                  setSearchQuery("");
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  selectedTag === tag.value 
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/10 scale-105" 
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {filteredListings.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No products match your search query.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredListings.map((item) => (
                <div
                  key={item._id}
                  onClick={() => navigate(`/product/${item._id}`)}
                  className="cursor-pointer bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden shadow-lg hover:border-slate-800 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative h-48 overflow-hidden bg-slate-950">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                      />
                    </div>
                    <div className="p-4 space-y-1.5 text-left">
                      <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {item.category?.replace("_", " ")}
                      </span>
                      <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors pt-1">{item.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 min-h-[2rem] leading-relaxed">{item.description}</p>
                      
                      {/* Star Rating Mockup */}
                      <div className="flex items-center space-x-1 text-amber-400 pt-0.5">
                        <div className="flex space-x-0.5">
                          {[...Array(4)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                          <Star size={11} className="text-slate-700" />
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">(15)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 space-y-3">
                    {/* Strikethrough Pricing Layout */}
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-lg font-extrabold text-emerald-400">₹{item.price}</span>
                        <span className="text-xs text-slate-500 line-through">₹{Math.round(item.price * 1.25)}</span>
                        <span className="text-[9px] text-emerald-500 font-extrabold bg-emerald-500/10 px-1 rounded-md">20% OFF</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold block">per {item.priceUnit || "kg"}</span>
                    </div>

                    {(canBuy || !user) && (
                      <button
                        onClick={(e) => handleAddToCart(item._id, e)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs"
                      >
                        <ShoppingCart size={14} />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="glass-panel py-16 px-6 sm:px-8 rounded-3xl border border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2 relative">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Kisan Testimonials</h2>
            <p className="text-sm text-slate-400">Real stories from farmers across Bharat implementing sustainable tech tools</p>
            <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-600 mx-auto rounded-full mt-4"></div>
            
            {isFarmer && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <Link
                  to="/newreview"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-md text-xs flex items-center space-x-1.5 transition-all transform active:scale-95"
                >
                  <PlusCircle size={14} />
                  <span>Share Your Story</span>
                </Link>
              </div>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-center text-slate-500 py-12">No testimonials yet. Be the first to leave one!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reviews.map((rev) => (
                <div key={rev._id} className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex space-x-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-slate-300 italic leading-relaxed text-xs">
                      "{rev.description}"
                    </p>
                  </div>
                  <div className="mt-6 border-t border-slate-800/80 pt-4 flex flex-col">
                    <span className="font-bold text-white text-sm">{rev.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{rev.post || rev.Post || "Farmer / Customer"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>



      {/* OVERLAY MODAL: Product details display */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
            {/* Close button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950/80 border border-slate-800 z-10 hover:scale-105 transition-all"
            >
              <X size={18} />
            </button>

            {/* Product Image */}
            <div className="md:w-1/2 h-64 md:h-auto bg-slate-950 relative">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
              />
              <span className="absolute top-4 left-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {selectedProduct.category?.replace("_", " ")}
              </span>
            </div>

            {/* Details panel */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-6 text-left">
              <div className="space-y-4">
                <h3 className="text-xl font-extrabold text-white leading-tight">{selectedProduct.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed max-h-[160px] overflow-y-auto pr-2">
                  {selectedProduct.description}
                </p>
                {selectedProduct.location && (
                  <p className="text-slate-500 text-[10px] flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                    <MapPin size={12} className="text-emerald-400" />
                    <span>Location: {selectedProduct.location}</span>
                  </p>
                )}
              </div>

              {/* Buying option inside modal */}
              <div className="space-y-4 border-t border-slate-800/80 pt-4 flex flex-col justify-end">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Price</span>
                  <span className="text-2xl font-extrabold text-emerald-400">₹{selectedProduct.price}</span>
                </div>

                {canBuy ? (
                  <button
                    onClick={() => {
                      handleAddToCart(selectedProduct._id);
                      setSelectedProduct(null);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 text-xs"
                  >
                    <ShoppingCart size={14} />
                    <span>Add to Cart</span>
                  </button>
                ) : !user ? (
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl text-center text-xs"
                  >
                    Sign In to Purchase
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold uppercase text-center block bg-slate-950/40 p-2 rounded-lg border border-slate-850">
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
