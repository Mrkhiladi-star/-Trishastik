import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
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

      const jobsRes = await fetch("/transporter/jobs");
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData.orders || []);
      }

      const activeRes = await fetch("/transporter/active");
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
      const response = await fetch(`/orders/${orderId}/accept-delivery`, {
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

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!trackingOrderId) return;
    setActionLoading(true);
    try {
      const response = await fetch(`/orders/${trackingOrderId}/track`, {
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
      const response = await fetch(`/orders/${orderId}/track`, {
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
        setTrackingLat(e.latlng.lat);
        setTrackingLon(e.latlng.lng);
      }
    });
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider font-sans">Syncing Dispatch Jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up space-y-8">
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-6 py-3 rounded-2xl shadow-2xl font-bold">
          {message}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold tracking-wider text-xs uppercase">
            <Truck size={14} />
            <span>Dispatcher Logistics Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Transporter Dispatch Dashboard
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Find pending transportation notifications from farmers and agricultural sellers. Select active dispatches, set your GPS coordinates, and deliver equipment or crops smoothly.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => { setActiveTab("jobs"); setTrackingOrderId(null); }}
          className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${activeTab === "jobs" ? "border-emerald-500 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          <Navigation size={16} />
          <span>Available Jobs ({jobs.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab("active"); setTrackingOrderId(null); }}
          className={`pb-2 text-sm font-bold border-b-2 transition-all flex items-center space-x-2 ${activeTab === "active" ? "border-emerald-500 text-emerald-400 font-bold" : "border-transparent text-slate-400 hover:text-white"}`}
        >
          <Activity size={16} />
          <span>My Active Shipments ({activeDeliveries.filter(d => d.status === "In Transit").length})</span>
        </button>
      </div>

      {/* Available Jobs list */}
      {activeTab === "jobs" && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-4">
            <Navigation className="text-emerald-400" size={20} />
            <span>Available Transportation Contracts</span>
          </h2>

          {jobs.length === 0 ? (
            <p className="text-center text-slate-500 py-16 font-semibold">No pending transit requests available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jobs.map((job) => (
                <div key={job._id} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between space-y-6">

                  {/* Job Header */}
                  <div className="flex justify-between items-start gap-4 border-b border-slate-850 pb-3">
                    <div>
                      <h4 className="font-extrabold text-white text-base">{job.product?.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold flex items-center space-x-1">
                        <Calendar size={10} />
                        <span>Ordered: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 text-amber-400 font-extrabold rounded-full text-[10px] uppercase tracking-wider">
                      {job.vehicleType} needed
                    </span>
                  </div>

                  {/* Shipment Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-emerald-400">Origin / Pickup (Seller)</span>
                      <p className="font-bold text-slate-300">{job.seller?.fullName || job.seller?.username}</p>
                      <p className="text-slate-400 truncate">{job.seller?.phone}</p>
                      <p className="text-slate-400 italic text-[11px] truncate">{job.seller?.location || "No coordinate name"}</p>
                    </div>

                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-sky-400">Destination (Buyer)</span>
                      <p className="font-bold text-slate-300">{job.buyer?.fullName || job.buyer?.username}</p>
                      <p className="text-slate-400 truncate">{job.phone}</p>
                      <p className="text-slate-400 italic text-[11px] truncate">{job.shippingAddress}</p>
                    </div>
                  </div>

                  {/* Accept action button */}
                  <button
                    onClick={() => handleAcceptJob(job._id)}
                    disabled={actionLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 text-xs shadow-lg"
                  >
                    <Truck size={14} />
                    <span>Accept Delivery Contract</span>
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Shipments tab */}
      {activeTab === "active" && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2 border-b border-slate-850 pb-4">
            <Truck className="text-emerald-400" size={20} />
            <span>Active Shipments Registry</span>
          </h2>

          {activeDeliveries.length === 0 ? (
            <p className="text-center text-slate-500 py-16 font-semibold">You don't have any active shipments.</p>
          ) : (
            <div className="space-y-6">
              {activeDeliveries.map((delivery) => (
                <div key={delivery._id} className="bg-slate-900/40 p-6 rounded-2xl border border-slate-850 space-y-4">

                  {/* Row Header */}
                  <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-850 pb-3">
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-white text-base">{delivery.product?.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center space-x-1">
                        <User size={12} className="text-slate-500" />
                        <span>Buyer: {delivery.buyer?.fullName || delivery.buyer?.username} | Phone: {delivery.phone}</span>
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${delivery.status === "Delivered"
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                          : "bg-sky-500/10 border-sky-500/25 text-sky-400 animate-pulse"
                        }`}>
                        {delivery.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/80">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Pickup Warehouse</span>
                      <p className="font-bold text-slate-300">{delivery.seller?.fullName || delivery.seller?.username}</p>
                      <p className="text-slate-400 truncate">{delivery.seller?.location}</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/80">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Destination Address</span>
                      <p className="font-bold text-slate-300">{delivery.shippingAddress}</p>
                      <p className="text-slate-400 truncate">{delivery.phone}</p>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/80">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Last Tracking Coordinates</span>
                      <p className="font-bold text-amber-400">{delivery.currentLocation?.name || "No location updates"}</p>
                      <p className="text-slate-400 text-[10px]">Lat: {delivery.currentLocation?.latitude.toFixed(4)} | Lng: {delivery.currentLocation?.longitude.toFixed(4)}</p>
                    </div>
                  </div>

                  {/* Actions row */}
                  {delivery.status !== "Delivered" && (
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-900/60 mt-2">
                      <button
                        onClick={() => {
                          setTrackingOrderId(delivery._id);
                          setTrackingLocationName(delivery.currentLocation?.name || "");
                          setTrackingLat(delivery.currentLocation?.latitude || 27.56);
                          setTrackingLon(delivery.currentLocation?.longitude || 80.68);
                          setMapCenter([delivery.currentLocation?.latitude || 27.56, delivery.currentLocation?.longitude || 80.68]);
                        }}
                        className="bg-slate-950 hover:bg-slate-900 text-emerald-400 font-bold py-2 px-4 rounded-xl border border-slate-850 text-xs flex items-center space-x-1.5"
                      >
                        <MapPin size={12} />
                        <span>Update Tracking Location</span>
                      </button>

                      <button
                        onClick={() => handleDeliverOrder(delivery._id)}
                        disabled={actionLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-2 px-5 rounded-xl text-xs flex items-center space-x-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 my-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                <MapPin className="text-emerald-400" size={16} />
                <span>Update Active Tracking Coordinates</span>
              </h3>
              <button
                onClick={() => setTrackingOrderId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-4 text-xs">
              <div className="space-y-1.5">
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pinpoint position on Map</label>
                <div className="h-48 w-full rounded-2xl overflow-hidden border border-slate-800">
                  <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker position={[trackingLat, trackingLon]} />
                    <MapClickHandler />
                  </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 mt-2">
                  <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">Latitude: <strong className="text-white">{trackingLat.toFixed(5)}</strong></span>
                  <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">Longitude: <strong className="text-white">{trackingLon.toFixed(5)}</strong></span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTrackingOrderId(null)}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl"
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
