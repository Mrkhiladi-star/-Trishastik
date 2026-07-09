import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Truck, MapPin, Phone, User, ShoppingBag, DollarSign,
  Map, CheckCircle, Navigation, ChevronRight, Activity, Calendar, X
} from "lucide-react";

// Fix Leaflet marker asset imports
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TransporterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("jobs"); // "jobs" | "active"
  const [jobs, setJobs] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Tracking Location State
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [trackingLocationName, setTrackingLocationName] = useState("");
  const [trackingLat, setTrackingLat] = useState(27.56);
  const [trackingLon, setTrackingLon] = useState(80.68);
  const [mapCenter, setMapCenter] = useState([27.56, 80.68]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const jobsRes = await fetch("/api/transporter/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.orders || []);
      }

      const activeRes = await fetch("/api/transporter/active");
      if (activeRes.ok) {
        const activeData = await activeRes.json();
        setActiveDeliveries(activeData.orders || []);
      }
    } catch (err) {
      console.error(err);
      setMessage("Error fetching transportation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== "transporter" && user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user]);

  const handleAcceptJob = async (orderId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/accept-delivery`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Job accepted successfully!");
        setTimeout(() => setMessage(""), 3000);
        await fetchData();
      } else {
        alert(data.error || "Failed to accept job.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectJob = async (orderId) => {
    if (!window.confirm("Are you sure you want to reject this job offer? It will automatically go to the next transporter.")) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/reject-delivery`, {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Job rejected successfully. Reassigning next candidate...");
        setTimeout(() => setMessage(""), 3000);
        await fetchData();
      } else {
        alert(data.error || "Failed to reject job.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!trackingOrderId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/api/orders/${trackingOrderId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationName: trackingLocationName,
          latitude: Number(trackingLat),
          longitude: Number(trackingLon)
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Tracking location updated!");
        setTimeout(() => setMessage(""), 3000);
        setTrackingOrderId(null);
        setTrackingLocationName("");
        await fetchData();
      } else {
        alert(data.error || "Failed to update tracking.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverOrder = async (orderId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Delivered",
          locationName: "Delivered at Destination"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage("Shipment marked as Delivered!");
        setTimeout(() => setMessage(""), 3000);
        await fetchData();
      } else {
        alert(data.error || "Failed to update delivery status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Map Click Handler for Tracking
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        setTrackingLat(lat);
        setTrackingLon(lon);
        setMapCenter([lat, lon]);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              setTrackingLocationName(data.display_name);
            }
          })
          .catch(err => console.error("Reverse geocoding error:", err));
      }
    });
    return null;
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

  // Debounced auto-geocoding from trackingLocationName text input
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!trackingLocationName || trackingLocationName.trim() === "") return;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trackingLocationName)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            // Check if coordinates are significantly different to prevent overriding exact map clicks
            const diffLat = Math.abs(lat - trackingLat);
            const diffLon = Math.abs(lon - trackingLon);
            if (diffLat > 0.005 || diffLon > 0.005) {
              setTrackingLat(lat);
              setTrackingLon(lon);
              setMapCenter([lat, lon]);
            }
          }
        }
      } catch (err) {
        console.error("Auto geocoding tracking location failed:", err);
      }
    }, 1200);
    
    return () => clearTimeout(delayDebounce);
  }, [trackingLocationName]);

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Syncing Dispatch Jobs...</p>
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
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
            <Truck size={14} />
            <span>Dispatcher Logistics Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transporter Dispatch Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-404 leading-relaxed font-sans">
            Find pending transportation notifications from farmers and agricultural sellers. Select active dispatches, set your GPS coordinates, and deliver equipment or crops smoothly.
          </p>
        </div>
      </div>

      {/* Warning Banner for default coordinates */}
      {user && (user.latitude === 27.56 || user.longitude === 80.68) && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-700 dark:text-amber-400 font-semibold shadow-sm">
          <div className="flex items-start space-x-3 text-xs leading-relaxed">
            <MapPin className="mt-0.5 shrink-0 text-blue-600" size={16} />
            <div className="text-left">
              <p className="font-bold uppercase tracking-wider text-[10px]">Location Coordinate Action Required</p>
              <p className="text-slate-600 dark:text-slate-350">Your profile coordinates are currently set to default locations. Update your GPS geolocations in your profile to accurately see orders in your area.</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="bg-amber-600 hover:bg-amber-750 text-white font-bold px-4 py-1.5 rounded-xl text-[10px] uppercase tracking-wider self-start sm:self-center transition-all shadow-sm"
          >
            Update Profile
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => { setActiveTab("jobs"); setTrackingOrderId(null); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${activeTab === "jobs" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Navigation size={16} />
          <span>Available Jobs ({jobs.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab("active"); setTrackingOrderId(null); }}
          className={`pb-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 ${activeTab === "active" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
        >
          <Activity size={16} />
          <span>My Active Shipments ({activeDeliveries.filter(d => d.status === "In Transit").length})</span>
        </button>
      </div>

      {/* Available Jobs list */}
      {activeTab === "jobs" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Navigation className="text-blue-600 dark:text-blue-400" size={20} />
            <span>Available Transportation Contracts</span>
          </h2>

          {jobs.length === 0 ? (
            <p className="text-center text-slate-500 py-16 font-semibold font-sans">No pending transit requests available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {jobs.map((job) => (
                <div key={job._id} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between space-y-6 shadow-sm">

                  {/* Job Header */}
                  <div className="flex justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{job.product?.title}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold flex items-center space-x-1 font-sans">
                        <Calendar size={10} />
                        <span>Ordered: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/25 text-blue-600 dark:text-blue-400 font-extrabold rounded-full text-[10px] uppercase tracking-wider shadow-sm">
                      {job.vehicleType} needed
                    </span>
                  </div>

                  {/* Shipment Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-left">
                      <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400">Origin / Pickup (Seller)</span>
                      <p className="font-bold text-slate-800 dark:text-slate-300 font-sans">{job.seller?.fullName || job.seller?.username}</p>
                      <p className="text-slate-500 dark:text-slate-400 truncate font-sans">{job.seller?.phone}</p>
                      <p className="text-slate-500 dark:text-slate-400 italic text-[11px] truncate font-sans">{job.seller?.location || "No coordinate name"}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-left">
                      <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400">Destination (Buyer)</span>
                      <p className="font-bold text-slate-800 dark:text-slate-300 font-sans">{job.buyer?.fullName || job.buyer?.username}</p>
                      <p className="text-slate-500 dark:text-slate-400 truncate font-sans">{job.phone}</p>
                      <p className="text-slate-500 dark:text-slate-450 italic text-[11px] truncate font-sans">{job.shippingAddress}</p>
                    </div>
                  </div>

                  {/* Delivery Price & Distance Breakup */}
                  <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-xl border border-blue-100 dark:border-blue-500/10 space-y-2 text-xs font-semibold font-sans text-left">
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Distance to Pickup (Seller):</span>
                      <span className="font-bold text-slate-800 dark:text-white">{job.distanceToSeller !== undefined ? `${job.distanceToSeller} KM` : 'Calculating...'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>Delivery Distance (Seller to Buyer):</span>
                      <span className="font-bold text-slate-800 dark:text-white">{job.distanceBuyerSeller !== undefined ? `${job.distanceBuyerSeller} KM` : 'Calculating...'}</span>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>
                    <div className="flex justify-between text-sm font-extrabold text-emerald-600 dark:text-emerald-450">
                      <span>Your Guaranteed Earnings:</span>
                      <span>₹{job.deliveryPrice || '0.00'}</span>
                    </div>
                  </div>

                  {/* Accept & Reject action buttons */}
                  <div className="flex space-x-3 mt-4 text-xs font-semibold">
                    <button
                      onClick={() => handleRejectJob(job._id)}
                      disabled={actionLoading}
                      className="flex-1 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-650 dark:text-red-400 border border-red-200 dark:border-red-500/25 font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-sm"
                    >
                      Reject Job
                    </button>
                    <button
                      onClick={() => handleAcceptJob(job._id)}
                      disabled={actionLoading}
                      className="flex-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 text-xs shadow-sm transition-all active:scale-95"
                    >
                      <Truck size={14} />
                      <span>Accept Contract</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Shipments tab */}
      {activeTab === "active" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Truck className="text-blue-600 dark:text-blue-400" size={20} />
            <span>Active Shipments Registry</span>
          </h2>

          {activeDeliveries.length === 0 ? (
            <p className="text-center text-slate-500 py-16 font-semibold font-sans">You don't have any active shipments.</p>
          ) : (
            <div className="space-y-6 text-left">
              {activeDeliveries.map((delivery) => (
                <div key={delivery._id} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm text-left">

                  {/* Row Header */}
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{delivery.product?.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 font-sans font-semibold">
                        <User size={12} className="text-blue-600" />
                        <span>Buyer: {delivery.buyer?.fullName || delivery.buyer?.username} | Phone: {delivery.phone}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${delivery.status === "Delivered"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                          : "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/25 text-blue-600 dark:text-blue-400 animate-pulse animate-duration-1000"
                        }`}>
                        {delivery.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                    <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Pickup Warehouse</span>
                      <p className="font-bold text-slate-800 dark:text-slate-300 font-sans">{delivery.seller?.fullName || delivery.seller?.username}</p>
                      <p className="text-slate-500 dark:text-slate-400 truncate font-sans">{delivery.seller?.location}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Destination Address</span>
                      <p className="font-bold text-slate-800 dark:text-slate-300 font-sans">{delivery.shippingAddress}</p>
                      <p className="text-slate-500 dark:text-slate-400 truncate font-sans">{delivery.phone}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm text-left">
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Last Tracking Coordinates</span>
                      <p className="font-bold text-blue-600 dark:text-blue-400">{delivery.currentLocation?.name || "No location updates"}</p>
                      <p className="text-slate-550 dark:text-slate-400 text-[10px] font-mono">Lat: {delivery.currentLocation?.latitude.toFixed(4)} | Lng: {delivery.currentLocation?.longitude.toFixed(4)}</p>
                    </div>
                  </div>

                  {/* Actions row */}
                  {delivery.status !== "Delivered" && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-900/60 mt-2">
                      <button
                        onClick={() => {
                          setTrackingOrderId(delivery._id);
                          setTrackingLocationName(delivery.currentLocation?.name || "");
                          setTrackingLat(delivery.currentLocation?.latitude || 27.56);
                          setTrackingLon(delivery.currentLocation?.longitude || 80.68);
                          setMapCenter([delivery.currentLocation?.latitude || 27.56, delivery.currentLocation?.longitude || 80.68]);
                        }}
                        className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center space-x-1.5 shadow-sm"
                      >
                        <MapPin size={12} />
                        <span>Update Tracking Location</span>
                      </button>

                      <button
                        onClick={() => handleDeliverOrder(delivery._id)}
                        disabled={actionLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95"
                      >
                        <CheckCircle size={12} />
                        <span>Mark as Delivered</span>
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OVERLAY MODAL: Update Tracking Coordinates & Name */}
      {trackingOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 my-8 shadow-lg text-left">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <MapPin className="text-blue-600" size={16} />
                <span>Update Active Tracking Coordinates</span>
              </h3>
              <button
                onClick={() => setTrackingOrderId(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5 text-left">
                <label htmlFor="trackLoc" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Location Description</label>
                <input
                  type="text"
                  id="trackLoc"
                  value={trackingLocationName}
                  onChange={(e) => setTrackingLocationName(e.target.value)}
                  placeholder="e.g. Near Sitapur Toll Booth"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  required
                />
              </div>

              {/* Leaflet map to pinpoint current position */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pinpoint position on Map</label>
                <div className="h-48 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-sm">
                  <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[trackingLat, trackingLon]} />
                    <MapClickHandler />
                    <ChangeMapCenter center={mapCenter} />
                  </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                  <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">Lat: <strong className="text-slate-800 dark:text-white font-mono">{trackingLat.toFixed(5)}</strong></span>
                  <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">Lng: <strong className="text-slate-800 dark:text-white font-mono">{trackingLon.toFixed(5)}</strong></span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTrackingOrderId(null)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl shadow-sm"
                >
                  Save Coordinates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransporterDashboard;
