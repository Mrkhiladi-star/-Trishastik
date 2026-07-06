import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, ArrowLeft, Trash2, Plus, Search, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker asset imports
if (L && L.Icon) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

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

  const [mapCenter, setMapCenter] = useState([27.56, 80.68]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setLocation(data.display_name);
        }
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  const ChangeMapCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.setView(center, map.getZoom());
      }
    }, [center, map]);
    return null;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setMapCenter([lat, lon]);
          reverseGeocode(lat, lon);
        },
        (err) => {
          console.warn("Auto-geolocation access denied or failed:", err.message);
        }
      );
    }
  }, []);

  // Debounced auto-geocoding from manual location text input
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!location || location.trim() === "") return;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            // Check if coordinates are significantly different to prevent overriding exact map pin clicks/drags
            const diffLat = Math.abs(lat - latitude);
            const diffLon = Math.abs(lon - longitude);
            if (diffLat > 0.005 || diffLon > 0.005) {
              setLatitude(lat);
              setLongitude(lon);
              setMapCenter([lat, lon]);
            }
          }
        }
      } catch (err) {
        console.error("Auto geocoding location failed:", err);
      }
    }, 1200);
    
    return () => clearTimeout(delayDebounce);
  }, [location]);

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        setLatitude(lat);
        setLongitude(lon);
        setMapCenter([lat, lon]);
        reverseGeocode(lat, lon);
      }
    });
    return null;
  };

  const handleAddressSearch = async () => {
    if (!searchVal) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchVal)}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const firstResult = data[0];
          const lat = parseFloat(firstResult.lat);
          const lon = parseFloat(firstResult.lon);
          setLatitude(lat);
          setLongitude(lon);
          setMapCenter([lat, lon]);
          setLocation(firstResult.display_name);
        } else {
          alert("Location not found.");
        }
      }
    } catch (err) {
      console.error("Address search error:", err);
    }
  };

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

          {/* Map Selector */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Map Pinpoint location (Click map to expand and search)
              </label>
              <button
                type="button"
                onClick={() => setIsMapExpanded(true)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline"
              >
                Expand Map
              </button>
            </div>

            {/* Preview Map (Clicking opens expand modal) */}
            <div 
              onClick={() => setIsMapExpanded(true)}
              className="h-32 w-full rounded-2xl overflow-hidden border border-slate-800 cursor-pointer relative group"
            >
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors z-[10] flex items-center justify-center">
                <span className="bg-slate-900/90 text-white border border-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to Expand & Point Location
                </span>
              </div>
              <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false} zoomControl={false} dragging={false} doubleClickZoom={false} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[latitude, longitude]} />
                <ChangeMapCenter center={mapCenter} />
              </MapContainer>
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

      {/* EXPANDED MAP SELECTION MODAL */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div>
                <h3 className="font-bold text-white text-sm">Pinpoint Product Location</h3>
                <p className="text-[10px] text-slate-400">Click anywhere on the map or drag the pin to set your coordinates.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Address Search Bar */}
            <div className="p-3 bg-slate-950/20 border-b border-slate-850 flex gap-2">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="Search location, warehouse, village name..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center space-x-1"
              >
                <Search size={12} />
                <span>Search</span>
              </button>
            </div>

            {/* Map Frame */}
            <div className="h-[50vh] w-full relative bg-slate-950">
              <MapContainer center={mapCenter} zoom={13} scrollWheelZoom={true} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker 
                  position={[latitude, longitude]} 
                  draggable={true}
                  eventHandlers={{
                    dragend(e) {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      setLatitude(position.lat);
                      setLongitude(position.lng);
                      reverseGeocode(position.lat, position.lng);
                    }
                  }}
                />
                <MapClickHandler />
                <ChangeMapCenter center={mapCenter} />
              </MapContainer>
            </div>

            {/* Details Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
              <div className="text-left w-full sm:w-auto">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Selected Coordinates</p>
                <p className="text-white font-mono mt-0.5">Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</p>
                <p className="text-[10px] text-emerald-400 mt-1 truncate max-w-md">Address: {location || "Locating..."}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2 rounded-xl transition-all shadow-md active:scale-95"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewListing;
