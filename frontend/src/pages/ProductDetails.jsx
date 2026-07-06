import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShoppingCart, CreditCard, ArrowLeft, Star, MapPin,
  User, Mail, Tag, ShieldCheck, MessageSquare, AlertCircle, Trash2, Video
} from "lucide-react";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [buying, setBuying] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeImage, setActiveImage] = useState("");

  const fetchProductDetails = async () => {
    try {
      const response = await fetch(`/api/listings/${id}`);
      if (!response.ok) {
        throw new Error("Product not found or failed to load");
      }
      const data = await response.json();
      setProduct(data.listing);
      setReviews(data.reviews || []);
      setActiveImage(data.listing.image || "");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const showToast = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setAddingToCart(true);
    try {
      const response = await fetch(`/api/addtocart/${id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("success", "Added to cart successfully!");
        await refreshUser();
      } else {
        showToast("error", data.error || "Could not add to cart.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network error. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setBuying(true);
    try {
      const response = await fetch(`/api/addtocart/${id}`);
      const data = await response.json();
      if (response.ok && data.success) {
        await refreshUser();
        navigate("/checkout");
      } else {
        showToast("error", data.error || "Failed to process Buy Now.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network error. Please try again.");
    } finally {
      setBuying(false);
    }
  };

  const handleDeleteListing = async () => {
    if (window.confirm("Are you sure you want to delete this listing permanently from the portal?")) {
      setDeleting(true);
      try {
        const response = await fetch(`/api/listings/${id}`, {
          method: "DELETE"
        });
        const data = await response.json();
        if (response.ok && data.success) {
          showToast("success", "Listing deleted successfully!");
          setTimeout(() => {
            navigate("/shop");
          }, 2000);
        } else {
          showToast("error", data.error || "Failed to delete listing.");
          setDeleting(false);
        }
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to delete listing.");
        setDeleting(false);
      }
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-4 max-w-md w-full">
          <AlertCircle className="text-red-500 mx-auto" size={40} />
          <h2 className="text-lg font-bold text-white">Error Occurred</h2>
          <p className="text-xs text-slate-400">{error || "Product could not be loaded."}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const categoryName = product.category
    ? product.category.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "Organic Input";

  const isOwnListing = user && product.owner && (
    (product.owner._id || product.owner || "").toString() === (user._id || "").toString()
  );
  const isAdmin = user && (user.role === "admin" || user.email === "sramu1090@gmail.com");
  
  let canBuy = false;
  if (user && !isOwnListing && user.role !== "admin" && user.role !== "transporter" && user.role !== "agent" && user.email !== "sramu1090@gmail.com") {
    canBuy = true;
    if (user.role === "customer" && product.category !== "organic_product") {
      canBuy = false;
    } else if (user.role === "fertilizer_seller" && (product.category === "instrument_sale" || product.category === "instrument_rent")) {
      canBuy = false;
    } else if (user.role === "instrument_seller" && product.category === "medicine_fertilizer") {
      canBuy = false;
    }
  }

  // Create unique list of all images for gallery (including legacy main image field)
  const galleryImages = [
    product.image,
    ...(product.images || [])
  ].filter((img, idx, arr) => img && img.trim() !== "" && arr.indexOf(img) === idx);

  return (
    <div className="min-h-[85vh] py-8 animate-fade-in-up relative">
      {/* Toast Alert */}
      {message.text && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl text-white font-semibold flex items-center space-x-2 animate-bounce border ${
          message.type === "success" ? "bg-emerald-500 border-emerald-400 text-slate-950" : "bg-red-500 border-red-400"
        }`}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-emerald-400 font-semibold mb-2 transition-colors text-xs"
        >
          <ArrowLeft size={14} />
          <span>Back to marketplace</span>
        </button>

        {/* Product Details Grid */}
        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

          {/* Left Column: Interactive Multi-Image Gallery */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
              <img
                src={activeImage || product.image}
                alt={product.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
              />
              <span className="absolute top-4 left-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {categoryName}
              </span>
            </div>

            {/* Thumbnails Row */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(imgUrl)}
                    onMouseEnter={() => setActiveImage(imgUrl)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-950 transition-all shrink-0 ${
                      (activeImage || product.image) === imgUrl ? "border-emerald-500 scale-105" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.title} preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"; }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Metadata & Buy actions */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-6 text-left">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  {product.title}
                </h1>
                
                {reviews.length > 0 ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg flex items-center space-x-1 text-emerald-400 text-xs font-bold">
                      <span>{avgRating}</span>
                      <Star size={12} fill="currentColor" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">({reviews.length} customer reviews)</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2 font-medium">No reviews yet for this product</p>
                )}
              </div>

              {/* Price section */}
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Special Price</span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <span className="text-3xl font-extrabold text-emerald-400">₹{product.price}</span>
                  <span className="text-xs text-slate-400 font-bold">/ {product.priceUnit || "kg"}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Product Highlights</h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>

              {/* Location & Seller info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {product.location && (
                  <div className="flex items-start space-x-2 text-xs">
                    <MapPin size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Pickup Address</span>
                      <span className="text-slate-300 font-medium">{product.location}</span>
                    </div>
                  </div>
                )}
                {product.owner && (
                  <div className="flex items-start space-x-2 text-xs">
                    <User size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Seller Profile</span>
                      <span className="text-slate-300 font-medium">{product.owner.fullName || product.owner.username}</span>
                      <span className="text-slate-500 text-[10px] block mt-0.5 truncate">{product.owner.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* E-Commerce & Management Buttons */}
            <div className="border-t border-slate-800/80 pt-6 space-y-4">
              {/* If owner or admin, show Delete button */}
              {(isOwnListing || isAdmin) && (
                <button
                  onClick={handleDeleteListing}
                  disabled={deleting}
                  className="w-full bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50 text-xs shadow-md mb-2"
                >
                  <Trash2 size={14} />
                  <span>{deleting ? "Deleting Product..." : "Delete Product Listing"}</span>
                </button>
              )}

              {isOwnListing ? (
                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-center text-xs text-slate-500 font-semibold">
                  This is your own product listing.
                </div>
              ) : !user ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-6 rounded-xl text-center text-xs shadow-lg transition-all"
                  >
                    Sign In to Purchase
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-semibold py-3.5 px-6 rounded-xl text-center text-xs transition-all"
                  >
                    Keep Browsing
                  </button>
                </div>
              ) : canBuy ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50 text-xs shadow-md"
                  >
                    <ShoppingCart size={14} />
                    <span>{addingToCart ? "Adding..." : "Add to Cart"}</span>
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={buying}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all transform active:scale-95 disabled:opacity-50 text-xs shadow-lg hover:shadow-emerald-500/10"
                  >
                    <CreditCard size={14} />
                    <span>{buying ? "Ordering..." : "Buy Now"}</span>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl text-center text-xs text-slate-500 font-semibold flex items-center justify-center space-x-2">
                  <ShieldCheck size={14} className="text-slate-600" />
                  <span>Purchases are restricted based on your current user account role.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional Video demonstration player */}
        {product.video && product.video.trim() !== "" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 text-left space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Video size={16} />
              </div>
              <span>Product Demonstration Video</span>
            </h2>
            <div className="relative aspect-video max-w-2xl mx-auto rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
              {getYouTubeEmbedUrl(product.video) ? (
                <iframe
                  src={getYouTubeEmbedUrl(product.video)}
                  title={product.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video
                  src={product.video}
                  controls
                  className="w-full h-full"
                  onError={(e) => { console.error("Direct video source loading error."); }}
                />
              )}
            </div>
          </div>
        )}

        {/* Rental Policies Section (if category is instrument_rent) */}
        {product.category === "instrument_rent" && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 text-left space-y-6">
            <div className="flex items-center space-x-2.5 border-b border-slate-850 pb-4">
              <ShieldCheck className="text-emerald-400" size={20} />
              <h2 className="text-lg font-bold text-white tracking-tight">Rental Policies & Terms</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">1. Security Deposit</span>
                <p className="text-slate-300 leading-relaxed">
                  A refundable security deposit may be collected before vehicle/equipment transit begins. This will be fully returned once the tool is returned damage-free.
                </p>
              </div>

              <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">2. Rental Duration & Late Fees</span>
                <p className="text-slate-300 leading-relaxed">
                  The rental period starts when the equipment is picked up or delivered. A late return fee equal to 1.5x the daily rental rate applies for delays exceeding 24 hours.
                </p>
              </div>

              <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">3. Usage & Mechanical Breakage</span>
                <p className="text-slate-300 leading-relaxed">
                  Renters are expected to operate tools responsibly. The renter is responsible for physical damage or parts failure caused by improper usage or neglect.
                </p>
              </div>

              <div className="bg-slate-950/30 p-4 border border-slate-850 rounded-2xl space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">4. Cancellation Policy</span>
                <p className="text-slate-300 leading-relaxed">
                  You can cancel your rental booking up to 24 hours prior to the scheduled delivery time for a full refund of any reservation fees paid.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 text-left space-y-6">
          <div className="flex items-center space-x-2.5 border-b border-slate-850 pb-4">
            <MessageSquare className="text-emerald-400" size={20} />
            <h2 className="text-lg font-bold text-white tracking-tight">Verified Buyer Reviews</h2>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs font-semibold">
              No buyer reviews recorded for this product yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-slate-950/30 p-5 rounded-2xl border border-slate-850/80 flex flex-col justify-between space-y-4 hover:border-slate-850 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-0.5 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                             key={i}
                             size={12}
                             fill={i < rev.rating ? "currentColor" : "none"}
                             className="text-amber-400"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs italic leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 border-t border-slate-900/60 pt-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <User size={10} className="text-emerald-400" />
                    <span>{rev.reviewer}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
