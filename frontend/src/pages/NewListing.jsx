import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, ArrowLeft } from "lucide-react";

const NewListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("organic_product");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(27.56);
  const [longitude, setLongitude] = useState(80.68);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: {
            title,
            description,
            price: Number(price),
            image,
            category,
            location,
            latitude: Number(latitude),
            longitude: Number(longitude)
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        navigate("/");
      } else {
        setError(data.error || "Failed to create listing.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 max-w-2xl mx-auto space-y-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center space-x-1.5 text-slate-400 hover:text-emerald-400 font-semibold mb-2 transition-colors text-xs"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>

        <div>
          <h2 className="text-2xl font-bold text-white">Create a New Product Listing</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mt-2"></div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl font-semibold text-center text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Title</label>
            <input 
              type="text" 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Organic Vermicompost"
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none h-24 resize-none"
              placeholder="Describe the product and its benefits..."
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Category</label>
            <select 
              id="category"
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none dark:bg-slate-900 bg-white text-slate-900 dark:text-white"
            >
              <option value="organic_product">Organic Farm Product (Crops/Vegetables/Grains)</option>
              <option value="medicine_fertilizer">Medicines & Fertilizers</option>
              <option value="instrument_sale">Agricultural Instruments (For Sale)</option>
              <option value="instrument_rent">Agricultural Instruments (For Rent)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
              <input 
                type="number" 
                id="price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                placeholder="e.g. 450"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="image" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Image URL</label>
              <input 
                type="text" 
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                placeholder="Paste product image link"
                required 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="location" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller Warehouse / Pickup Address</label>
            <input 
              type="text" 
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Warehouse 1, Sitapur Road, UP"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="latitude" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
              <input 
                type="number" 
                step="0.0001"
                id="latitude"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="longitude" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
              <input 
                type="number" 
                step="0.0001"
                id="longitude"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-4"
          >
            <PlusCircle size={14} />
            <span>{submitting ? "Publishing Product..." : "Publish Product Listing"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewListing;
