import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, ArrowLeft, Trash2, Plus } from "lucide-react";

const NewListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("kg");
  const [images, setImages] = useState([""]); // array of image URLs (initially 1 empty string)
  const [video, setVideo] = useState("");
  const [category, setCategory] = useState("organic_product");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(27.56);
  const [longitude, setLongitude] = useState(80.68);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (index, value) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const addImageField = () => {
    if (images.length < 5) {
      setImages([...images, ""]);
    }
  };

  const removeImageField = (index) => {
    if (images.length > 1) {
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const filteredImages = images.filter(img => img.trim() !== "");
    if (filteredImages.length === 0) {
      setError("At least one product image URL is required.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: {
            title,
            description,
            price: Number(price),
            image: filteredImages[0], // primary image
            images: filteredImages, // list of all images
            video,
            category,
            location,
            latitude: Number(latitude),
            longitude: Number(longitude),
            priceUnit
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
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 max-w-2xl mx-auto space-y-6 text-left">
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
              <label htmlFor="priceUnit" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Per Unit</label>
              <select
                id="priceUnit"
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none bg-white text-slate-900 dark:bg-slate-900 dark:text-white"
              >
                <option value="kg">Per Kilogram (kg)</option>
                <option value="quintal">Per Quintal</option>
                <option value="gram">Per Gram</option>
                <option value="piece">Per Piece</option>
                <option value="hour">Per Hour (Rent)</option>
                <option value="day">Per Day (Rent)</option>
              </select>
            </div>
          </div>

          {/* Product Media Section */}
          <div className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-2xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Product Media</h3>
            
            {/* Multiple Image Inputs */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Image URLs (Max 5)</label>
              {images.map((imgUrl, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={imgUrl}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                    placeholder={`Paste image URL ${index + 1}`}
                    required={index === 0}
                  />
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-xl transition-all shrink-0"
                      title="Remove field"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              
              {images.length < 5 && (
                <button
                  type="button"
                  onClick={addImageField}
                  className="mt-1 flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors"
                >
                  <Plus size={14} />
                  <span>Add another image URL</span>
                </button>
              )}
            </div>

            {/* Optional Video Link */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="video" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Product Video URL (Optional)</label>
              <input
                type="text"
                id="video"
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                placeholder="e.g. YouTube video link or direct MP4 URL"
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
