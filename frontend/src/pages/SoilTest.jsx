import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  MapContainer, TileLayer, Marker, useMapEvents
} from "react-leaflet";
import L from "leaflet";
import {
  Sprout, Phone, MapPin, Clipboard, CheckCircle2, Clock, Truck,
  FileText, Send, UserCheck, RefreshCw, Upload, Download, Search,
  Map, UserPlus, ListFilter, SlidersHorizontal, AlertCircle, Cpu,
  Bookmark, Award, Droplets, ArrowRight, Activity, Users, X
} from "lucide-react";

// Fix Leaflet marker asset imports
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SoilTest = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState("requests"); // For Admin panel: "requests" | "users"

  // Admin filter & search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Farmer creation state
  const [farmerName, setFarmerName] = useState(user?.fullName || user?.username || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [farmArea, setFarmArea] = useState("");
  const [cropPlanned, setCropPlanned] = useState("");
  const [soilType, setSoilType] = useState("");
  const [address, setAddress] = useState("");
  const [stateDistrictVillage, setStateDistrictVillage] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [latitude, setLatitude] = useState(27.56); // Default Sitapur India Lat
  const [longitude, setLongitude] = useState(80.68); // Default Sitapur India Lon
  const [gataNumber, setGataNumber] = useState("");
  const [assignLabFacility, setAssignLabFacility] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: "", type: "" });

  // Map view positioning
  const [mapCenter, setMapCenter] = useState([27.56, 80.68]);

  // Admin Assignment & Report state
  const [agents, setAgents] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [assigningTestId, setAssigningTestId] = useState(null);
  const [assignAgentId, setAssignAgentId] = useState("");
  const [reportingTest, setReportingTest] = useState(null);
  const [reportStatus, setReportStatus] = useState("Testing");
  const [reportContent, setReportContent] = useState("");
  const [recommendedFertilizers, setRecommendedFertilizers] = useState("");

  // File upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);

  const handleDownloadPDF = (url, filename) => {
    if (url && url.includes("res.cloudinary.com")) {
      // Force attachment download using Cloudinary parameter
      const downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
      window.open(downloadUrl, '_blank');
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  const isAdmin = user && (user.role === "admin" || user.email === "sramu1090@gmail.com");
  const isFarmer = user && (user.role === "farmer" || user.role === "customer" || user.email === "sramu1090@gmail.com");
  const isAgent = user && user.role === "agent";

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? "/api/admin/soil-tests" : "/api/soil-tests";
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setTests(data.soilTests || []);
      }

      if (isAdmin) {
        // Fetch agents list
        const agentsRes = await fetch("/api/admin/agents");
        if (agentsRes.ok) {
          const agentsData = await agentsRes.json();
          setAgents(agentsData.agents || []);
        }

        // Fetch users registry
        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(usersData.users || []);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Geolocation trigger
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setMapCenter([lat, lon]);
        },
        (err) => {
          console.error("Geolocation failed:", err);
        }
      );
    }
  };

  // Farmer creates a soil test request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/soil-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soilTest: {
            farmerName,
            phone,
            farmArea: Number(farmArea),
            gataNumber,
            cropPlanned,
            soilType,
            address,
            stateDistrictVillage,
            additionalNotes,
            latitude,
            longitude
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setFormMessage({ text: "Soil collection request submitted successfully! A field agent will be assigned shortly.", type: "success" });
        setPhone("");
        setFarmArea("");
        setGataNumber("");
        setCropPlanned("");
        setSoilType("");
        setAddress("");
        setStateDistrictVillage("");
        setAdditionalNotes("");
        await fetchData();
      } else {
        setFormMessage({ text: data.error || "Failed to submit request.", type: "error" });
      }
    } catch (err) {
      setFormMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Map Click Handler Component
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setLatitude(e.latlng.lat);
        setLongitude(e.latlng.lng);
      }
    });
    return null;
  };

  // Admin assigns agent
  const handleAssignAgent = async (testId) => {
    if (!assignAgentId || !assignLabFacility) {
      alert("Please select both a field agent and a lab testing facility.");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/soil-tests/${testId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: assignAgentId, labFacility: assignLabFacility })
      });
      if (response.ok) {
        setAssigningTestId(null);
        setAssignAgentId("");
        setAssignLabFacility("");
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to assign agent.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Agent updates status
  const handleAgentStatusUpdate = async (testId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/agent/soil-tests/${testId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin/Agent uploads lab report file
  const handleReportFileUpload = async (testId) => {
    if (!uploadFile) return;
    setActionLoading(true);
    const formData = new FormData();
    formData.append("report", uploadFile);

    try {
      const response = await fetch(`/api/admin/soil-tests/${testId}/report-upload`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUploadFile(null);
        if (reportingTest) {
          setReportingTest({ ...reportingTest, labReportUrl: data.labReportUrl, status: data.status });
        }
        await fetchData();
      } else {
        let errMsg = "File upload failed.";
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (e) {
          errMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin/Agent updates report contents
  const handleReportDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin && !reportingTest.labReportUrl) {
      alert("Please upload the lab report PDF/Image file using the upload icon before saving details.");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/soil-tests/${reportingTest._id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reportStatus,
          reportContent,
          recommendedFertilizers,
          isPublished: isAdmin ? publishImmediately : false
        })
      });
      if (response.ok) {
        setReportingTest(null);
        setReportContent("");
        setRecommendedFertilizers("");
        setPublishImmediately(false);
        await fetchData();
      } else {
        let errMsg = "Failed to update report details.";
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (e) {
          errMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving report details: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin approves & publishes report
  const handlePublishReport = async (testId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/soil-tests/${testId}/publish`, {
        method: "POST"
      });
      if (response.ok) {
        await fetchData();
      } else {
        let errMsg = "Failed to publish report.";
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (e) {
          errMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Error publishing report: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Grok AI Analysis
  const handleTriggerGrokAI = async (testId) => {
    setActionLoading(true);
    try {
      const isCurrentModal = reportingTest && reportingTest._id === testId;
      const bodyPayload = isCurrentModal ? {
        reportContent,
        recommendedFertilizers
      } : {};

      const response = await fetch(`/api/soil-tests/${testId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      const data = await response.json();
      if (response.ok && data.success) {
        if (reportingTest) setReportingTest(null);
        await fetchData();
      } else {
        let errMsg = "Failed to generate AI analysis. Make sure Report Summary is filled.";
        try {
          const data = await response.json();
          errMsg = data.error || errMsg;
        } catch (e) {
          errMsg = `Server error (${response.status}): ${response.statusText}`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert("Error generating AI suggestions: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Admin changes user role
  const handleUserRoleUpdate = async (userId, newRole) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update user role.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper: Status badge
  const getStatusBadge = (status) => {
    const badges = {
      "Pending": "bg-amber-500/10 border-amber-500/20 text-amber-400",
      "Assigned": "bg-sky-500/10 border-sky-500/20 text-sky-400",
      "Sample Collected": "bg-teal-500/10 border-teal-500/20 text-teal-400",
      "Testing": "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      "Report Ready": "bg-purple-500/10 border-purple-500/20 text-purple-400",
      "Completed": "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badges[status] || badges.Pending}`}>
        {status}
      </span>
    );
  };

  // Filter requests
  const filteredRequests = tests.filter(test => {
    const matchesSearch =
      test.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.cropPlanned.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider">Loading Soil Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

      {/* Header Banner */}
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800 mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold tracking-wider text-xs uppercase">
            <Bookmark size={14} />
            <span>Soil Intelligence System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Soil Testing & AI-Powered Crop Recommendation
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Test soil macronutrients N-P-K, identify micronutrient deficiency levels, get direct diagnostic reports from agronomists, and explore Grok-AI custom crop rotation suggestions.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Request Form (Farmers only) */}
        {isFarmer && !isAdmin && (
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Clipboard className="text-emerald-400" size={20} />
                  <span>Request Soil Test</span>
                </h2>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-emerald-400 flex items-center space-x-1 hover:border-emerald-500/30 transition-all"
                >
                  <MapPin size={10} />
                  <span>Get GPS Coords</span>
                </button>
              </div>

              {formMessage.text && (
                <div className={`p-4 rounded-xl text-center text-xs font-semibold border ${formMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
                  }`}>
                  {formMessage.text}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Farmer Name</label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Farm Area (in Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={farmArea}
                      onChange={(e) => setFarmArea(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      placeholder="e.g. 4.5"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gata Number (Plot / Survey No.)</label>
                    <input
                      type="text"
                      value={gataNumber}
                      onChange={(e) => setGataNumber(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      placeholder="e.g. 123/4"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planned Crop Type</label>
                    <input
                      type="text"
                      value={cropPlanned}
                      onChange={(e) => setCropPlanned(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      placeholder="e.g. Wheat / Rice"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Soil Type</label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-semibold"
                      required
                    >
                      <option value="">Select Soil Type</option>
                      <option value="Alluvial">Alluvial</option>
                      <option value="Black Cotton">Black Cotton</option>
                      <option value="Red/Yellow">Red & Yellow</option>
                      <option value="Loamy">Loamy</option>
                      <option value="Clayey">Clayey</option>
                      <option value="Sandy/Arid">Sandy / Arid</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Village / District / State</label>
                    <input
                      type="text"
                      value={stateDistrictVillage}
                      onChange={(e) => setStateDistrictVillage(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      placeholder="e.g. Sitapur, UP"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                    placeholder="Enter manual address details"
                    required
                  />
                </div>

                {/* Map Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Map Pinpoint location (Click map to drag/re-pin)
                  </label>

                  {/* Leaflet map implementation */}
                  <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-800">
                    <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false} className="h-full w-full">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[latitude, longitude]} />
                      <MapClickHandler />
                    </MapContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 mt-2">
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">Latitude: <strong className="text-white">{latitude.toFixed(5)}</strong></span>
                    <span className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850">Longitude: <strong className="text-white">{longitude.toFixed(5)}</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Notes</label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none h-16 resize-none"
                    placeholder="Any specific requests or observations..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-2"
                >
                  <Send size={14} />
                  <span>{formSubmitting ? "Submitting request..." : "Submit Soil Test Request"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN / MAIN PANEL (Farmers: Request History | Admins: Tests List & Management) */}
        <div className={`${isFarmer && !isAdmin ? "lg:col-span-7" : "lg:col-span-12"} space-y-6`}>

          {/* ADMIN SUB-TABS */}
          {isAdmin && (
            <div className="flex space-x-4 border-b border-slate-800 pb-4">
              <button
                onClick={() => setActiveSubTab("requests")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all ${activeSubTab === "requests" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                Soil Testing Requests
              </button>
              <button
                onClick={() => setActiveSubTab("users")}
                className={`pb-2 text-sm font-bold border-b-2 transition-all ${activeSubTab === "users" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`}
              >
                User & Farmer Manager
              </button>
            </div>
          )}

          {/* TABLE / LIST OF REQUESTS */}
          {(!isAdmin || activeSubTab === "requests") && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <FileText className="text-emerald-400" size={20} />
                  <span>{isAdmin ? "Soil Analysis Registry" : isAgent ? "My Collections Dashboard" : "Soil Test Request History"}</span>
                </h2>

                {/* Search & Filters (For Admins / Agents) */}
                {(isAdmin || isAgent) && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Farmer..."
                        className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-lg text-xs focus:outline-none w-40 sm:w-48"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-white rounded-lg text-xs p-2 font-semibold"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Sample Collected">Collected</option>
                      <option value="Testing">Testing</option>
                      <option value="Report Ready">Report Ready</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Request List Items */}
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-medium">
                  No soil test requests found.
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredRequests.map((test) => (
                    <div key={test._id} className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-4">

                      {/* Request Header */}
                      <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-800/50 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-base text-white">{test.farmerName}</h3>
                            <span className="text-[10px] text-slate-500">&bull;</span>
                            <span className="text-xs text-slate-400 font-semibold">{test.cropPlanned} Planning</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-400 text-xs font-semibold">
                            <span className="flex items-center space-x-1 text-[11px]"><Phone size={11} className="text-slate-500" /> <span>{test.phone}</span></span>
                            <span className="text-slate-600">|</span>
                            <span className="flex items-center space-x-1 text-[11px]"><MapPin size={11} className="text-slate-500" /> <span>{test.address}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(test.status)}
                        </div>
                      </div>

                      {/* Request Specifications */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs">
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Area Size</span>
                          <span className="font-bold text-white">{test.farmArea} Acres</span>
                        </div>
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Gata Number</span>
                          <span className="font-bold text-emerald-400">{test.gataNumber || "N/A"}</span>
                        </div>
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Soil Class</span>
                          <span className="font-bold text-white">{test.soilType}</span>
                        </div>
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Village / Region</span>
                          <span className="font-bold text-white truncate block max-w-[120px]">{test.stateDistrictVillage}</span>
                        </div>
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                          <span className="text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Agent Assigned</span>
                          <span className="font-bold text-emerald-400">{test.agent?.fullName || test.agent?.username || "None"}</span>
                        </div>
                      </div>

                      {/* Notes block */}
                      {test.additionalNotes && (
                        <div className="text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 text-slate-400 italic">
                          Notes: {test.additionalNotes}
                        </div>
                      )}

                      {/* Progress Stage Flow Visual (Timeline) */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center relative">
                          <div className="absolute left-2 right-2 h-0.5 bg-slate-800 pointer-events-none -z-10"></div>
                          {["Pending", "Assigned", "Sample Collected", "Testing", "Report Ready", "Completed"].map((stage, i, arr) => {
                            const statuses = ["Pending", "Assigned", "Sample Collected", "Testing", "Report Ready", "Completed"];
                            const currentIdx = statuses.indexOf(test.status);
                            const stageIdx = statuses.indexOf(stage);

                            const isPast = stageIdx < currentIdx;
                            const isCurrent = stageIdx === currentIdx;

                            let circleBg = "bg-slate-950 border-slate-800 text-slate-500";
                            if (isPast) circleBg = "bg-emerald-500 border-emerald-400 text-slate-950";
                            if (isCurrent) circleBg = "bg-emerald-400 border-emerald-300 text-slate-950 animate-pulse";

                            return (
                              <div key={stage} className="flex flex-col items-center space-y-1 relative z-10">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold ${circleBg}`}>
                                  {isPast ? "✓" : i + 1}
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-wider text-center max-w-[50px] truncate hidden sm:block ${isCurrent ? "text-emerald-400" : "text-slate-500"}`}>
                                  {stage}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Report Section */}
                      {((test.status === "Report Ready" || test.status === "Completed") &&
                        (isAdmin || isAgent || test.isPublished)) && (
                          <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                                <FileText className="text-emerald-400" size={16} />
                                <span>Soil Diagnostic Report Available</span>
                              </h4>

                              {test.labReportUrl && (
                                <button
                                  onClick={() =>
                                    handleDownloadPDF(
                                      test.labReportUrl,
                                      `Soil_Report_${test._id}.pdf`
                                    )
                                  }
                                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/20 text-xs font-semibold text-emerald-400 hover:text-white"
                                >
                                  <Download size={12} />
                                  <span>Download Lab Report</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Macronutrient Summary</span>
                                <p className="text-slate-300 text-xs whitespace-pre-wrap">{test.reportContent || "Diagnostic testing in progress."}</p>
                              </div>
                              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Recommended Inputs</span>
                                <p className="text-slate-300 text-xs whitespace-pre-wrap">{test.recommendedFertilizers || "Lab recommendations pending."}</p>
                              </div>
                            </div>

                            {/* Grok AI Analysis Results Block */}
                            {test.aiAnalysis && test.aiAnalysis.npkAnalysis && (
                              <div className="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-xl space-y-4">
                                <div className="flex items-center space-x-2 border-b border-emerald-500/10 pb-2">
                                  <Cpu className="text-emerald-400 animate-pulse-glow" size={16} />
                                  <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                    Grok-AI Cognitive Agronomy Recommendations
                                  </h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                  <div className="space-y-3">
                                    <div>
                                      <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-0.5"><Award size={12} /> <span>NPK Assessment</span></span>
                                      <p className="text-slate-300">{test.aiAnalysis.npkAnalysis}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-0.5"><AlertCircle size={12} /> <span>Deficiencies</span></span>
                                      <p className="text-slate-300">{test.aiAnalysis.deficiencyExplanation}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-0.5"><SlidersHorizontal size={12} /> <span>Fertilizer Plan</span></span>
                                      <p className="text-slate-300">{test.aiAnalysis.fertilizerRecommendation}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-0.5"><Sprout size={12} /> <span>Organic Carbon Upgrade</span></span>
                                      <p className="text-slate-300">{test.aiAnalysis.organicImprovement}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-0.5"><Droplets size={12} /> <span>Hydration & Drainage</span></span>
                                      <p className="text-slate-300">{test.aiAnalysis.waterManagement}</p>
                                    </div>
                                    <div>
                                      <span className="font-bold text-emerald-400 flex items-center space-x-1 mb-0.5"><ArrowRight size={12} /> <span>Crop Rotations</span></span>
                                      <p className="text-slate-300">{test.aiAnalysis.bestCrops}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Grok AI analysis trigger (Admin only) */}
                            {isAdmin && (!test.aiAnalysis || !test.aiAnalysis.npkAnalysis) && (
                              <div className="flex justify-end pt-2">
                                <button
                                  onClick={() => handleTriggerGrokAI(test._id)}
                                  disabled={actionLoading}
                                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-500/5 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                  <Cpu size={14} />
                                  <span>{actionLoading ? "Generating Suggestions..." : "Generate AI Suggestions with Grok"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Report Pending Admin Approval Notification */}
                      {isFarmer && !isAdmin && !isAgent && (test.status === "Report Ready" || test.status === "Completed") && !test.isPublished && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center space-x-3 text-xs text-amber-400 mt-2">
                          <AlertCircle size={16} className="shrink-0" />
                          <span>Your soil test report is currently under review by our agricultural administrator and will be published shortly.</span>
                        </div>
                      )}

                      {/* Admin/Agent Action Bars */}
                      {isAdmin && (
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800/60 mt-2">
                          {test.status !== "Completed" ? (
                            <>
                              <button
                                onClick={() => setAssigningTestId(test._id)}
                                className="bg-slate-900 hover:bg-slate-850 text-white font-semibold py-1.5 px-3 rounded-lg text-xs border border-slate-800 flex items-center space-x-1.5"
                              >
                                <UserCheck size={12} />
                                <span>Assign Field Agent</span>
                              </button>

                              {test.labReportUrl && !test.isPublished && (
                                <button
                                  onClick={() => handlePublishReport(test._id)}
                                  disabled={actionLoading}
                                  className="bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1"
                                >
                                  <CheckCircle2 size={12} />
                                  <span>Approve & Publish</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setReportingTest(test);
                                  setReportStatus(test.status);
                                  setReportContent(test.reportContent || "");
                                  setRecommendedFertilizers(test.recommendedFertilizers || "");
                                  setPublishImmediately(test.isPublished || false);
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1"
                              >
                                <FileText size={12} />
                                <span>Publish Report / Update Status</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-emerald-400 font-bold text-xs flex items-center space-x-1">
                              <CheckCircle2 size={14} />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Agent Action Bar */}
                      {isAgent && (
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-800/60 mt-2">
                          {test.status === "Assigned" && (
                            <button
                              onClick={() => handleAgentStatusUpdate(test._id, "Sample Collected")}
                              disabled={actionLoading}
                              className="bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1"
                            >
                              <Truck size={12} />
                              <span>Mark Sample Collected</span>
                            </button>
                          )}
                          {test.status === "Sample Collected" && (
                            <button
                              onClick={() => handleAgentStatusUpdate(test._id, "Testing")}
                              disabled={actionLoading}
                              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1"
                            >
                              <Activity size={12} />
                              <span>Mark Testing In Progress</span>
                            </button>
                          )}
                          {(test.status === "Testing" || test.status === "Report Ready") && (
                            <button
                              onClick={() => {
                                setReportingTest(test);
                                setReportStatus(test.status);
                                setReportContent(test.reportContent || "");
                                setRecommendedFertilizers(test.recommendedFertilizers || "");
                                setPublishImmediately(false);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1"
                            >
                              <FileText size={12} />
                              <span>Update Lab Results</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADMIN USER MANAGER TAB */}
          {isAdmin && activeSubTab === "users" && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-4 flex items-center space-x-2">
                <Users className="text-emerald-400" size={20} />
                <span>User & Farm Registry</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300 text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-bold">
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Full Name</th>
                      <th className="py-3 px-4">Current Role</th>
                      <th className="py-3 px-4">Farming Info</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u._id} className="border-b border-slate-900/60 hover:bg-slate-900/40">
                        <td className="py-3.5 px-4 font-bold text-white">{u.username}</td>
                        <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                        <td className="py-3.5 px-4">{u.fullName || "Not added"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${u.role === "admin" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                            u.role === "farmer" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                              u.role === "agent" ? "bg-sky-500/10 border-sky-500/20 text-sky-400" :
                                u.role === "transporter" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                                  u.role === "fertilizer_seller" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                    u.role === "instrument_seller" ? "bg-teal-500/10 border-teal-500/20 text-teal-400" :
                                      "bg-slate-500/10 border-slate-500/20 text-slate-400"
                            }`}>
                            {u.role?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {u.role === "farmer" && u.landDetails?.farmArea
                            ? `${u.landDetails.farmArea} ac | ${u.landDetails.soilType || ""}`
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleUserRoleUpdate(u._id, e.target.value)}
                            disabled={actionLoading}
                            className="bg-slate-950 border border-slate-800 text-[10px] font-bold rounded-lg p-1.5 text-white focus:outline-none"
                          >
                            <option value="customer">Customer</option>
                            <option value="farmer">Farmer</option>
                            <option value="agent">Field Agent</option>
                            <option value="fertilizer_seller">Fertilizer Seller</option>
                            <option value="instrument_seller">Ag Instruments Seller</option>
                            <option value="transporter">Transporter</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
      </div>

      {/* OVERLAY MODAL: Assign Agent */}
      {assigningTestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                <UserCheck className="text-emerald-400" size={16} />
                <span>Assign Field Agent & Lab Facility</span>
              </h3>
              <button
                onClick={() => { setAssigningTestId(null); setAssignAgentId(""); setAssignLabFacility(""); }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">Select a registered agronomist dispatcher and their nearest laboratory facility to run the soil sample test.</p>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nearest Lab Testing Facility</label>
                <select
                  value={assignLabFacility}
                  onChange={(e) => setAssignLabFacility(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white dark:bg-slate-950 bg-white text-slate-900 dark:text-white"
                >
                  <option value="">Select Nearest Lab...</option>
                  <option value="Sitapur Central Testing Lab">Sitapur Central Testing Lab</option>
                  <option value="Ludhiana Ag University Lab">Ludhiana Ag University Lab</option>
                  <option value="Lucknow Soil Health Lab">Lucknow Soil Health Lab</option>
                  <option value="Delhi Organic Testing Station">Delhi Organic Testing Station</option>
                  <option value="Kanpur Agricultural Research Center">Kanpur Agricultural Research Center</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Field Agents Available</label>
                <select
                  value={assignAgentId}
                  onChange={(e) => setAssignAgentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white dark:bg-slate-950 bg-white text-slate-900 dark:text-white"
                >
                  <option value="">Select Agent...</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.fullName || a.username} ({a.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => { setAssigningTestId(null); setAssignAgentId(""); setAssignLabFacility(""); }}
                  className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignAgent(assigningTestId)}
                  disabled={actionLoading || !assignAgentId || !assignLabFacility}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs"
                >
                  Assign Agent & Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY MODAL: Update Report & Status */}
      {reportingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 my-8 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                <FileText className="text-emerald-400" size={16} />
                <span>Publish Soil Diagnostics & Recommendations</span>
              </h3>
              <button
                onClick={() => setReportingTest(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportDetailsSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Testing Progress Status</label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                >
                  <option value="Testing">Testing (In Progress)</option>
                  <option value="Report Ready">Report Ready (Diagnostics Filled)</option>
                  {isAdmin && <option value="Completed">Completed (AI suggestions active)</option>}
                </select>
              </div>

              {/* PDF/Image Lab Report File Upload */}
              {(!isAdmin || !reportingTest.labReportUrl) ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lab Report File (PDF / Image)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-300"
                      accept="image/*,application/pdf"
                    />
                    <button
                      type="button"
                      onClick={() => handleReportFileUpload(reportingTest._id)}
                      disabled={actionLoading || !uploadFile}
                      className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 p-2 rounded-xl"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  {reportingTest.labReportUrl && (
                    <span className="text-[10px] text-emerald-400 block font-semibold">✓ Report loaded: {reportingTest.labReportUrl}</span>
                  )}
                  {!isAdmin && !reportingTest.labReportUrl && (
                    <p className="text-[10px] text-red-400 font-semibold mt-1">⚠️ Uploading the lab report file is required.</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Lab Report Document</span>
                    <span className="text-[10px] text-emerald-400 font-semibold block">✓ Uploaded by Agent</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(reportingTest.labReportUrl, `Soil_Report_${reportingTest._id}.pdf`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/20 text-[10px] font-semibold text-emerald-400 hover:text-white"
                  >
                    <Download size={12} />
                    <span>Download Report PDF</span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Soil Macronutrient Analysis Summary</label>
                <textarea
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="e.g. pH: 6.8. Nitrogen: 120 ppm (Low), Phosphorus: 30 ppm (Moderate), Potassium: 280 ppm (High)."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 h-24 focus:outline-none"
                  required={isAdmin && (reportStatus === "Report Ready" || reportStatus === "Completed")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommended Soil Inputs & Additives</label>
                <textarea
                  value={recommendedFertilizers}
                  onChange={(e) => setRecommendedFertilizers(e.target.value)}
                  placeholder="e.g. Incorporate 50kg Urea per acre during primary tillage. Apply organic compost."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 h-24 focus:outline-none"
                  required={isAdmin && (reportStatus === "Report Ready" || reportStatus === "Completed")}
                />
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-2 py-1 bg-slate-950/40 p-3 rounded-xl border border-slate-850/80">
                  <input
                    type="checkbox"
                    id="publishImmediately"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="publishImmediately" className="text-[10px] font-bold text-slate-300 uppercase tracking-wider cursor-pointer select-none">
                    Publish Report Immediately to Farmer
                  </label>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleTriggerGrokAI(reportingTest._id)}
                    disabled={actionLoading || !reportContent}
                    className="bg-slate-950 hover:bg-slate-900 border border-emerald-500/20 text-emerald-400 font-bold py-2 px-4 rounded-xl flex items-center space-x-1.5 shadow"
                  >
                    <Cpu size={14} />
                    <span>Generate AI Suggestions</span>
                  </button>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setReportingTest(null)}
                    className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl"
                  >
                    Save Report Details
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SoilTest;
