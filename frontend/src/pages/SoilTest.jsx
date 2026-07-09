import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  MapContainer, TileLayer, Marker, useMapEvents, useMap
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
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const reverseGeocode = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
          const parts = [];
          if (data.address) {
            if (data.address.village || data.address.suburb) parts.push(data.address.village || data.address.suburb);
            if (data.address.county || data.address.district) parts.push(data.address.county || data.address.district);
            if (data.address.state) parts.push(data.address.state);
          }
          if (parts.length > 0) {
            setStateDistrictVillage(parts.join(", "));
          }
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

  // Debounced auto-geocoding from manual address text input
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!address || address.trim() === "") return;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const firstResult = data[0];
            const lat = parseFloat(firstResult.lat);
            const lon = parseFloat(firstResult.lon);
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
        console.error("Auto geocoding address failed:", err);
      }
    }, 1200);
    
    return () => clearTimeout(delayDebounce);
  }, [address]);

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
          reverseGeocode(lat, lon);
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
          setAddress(firstResult.display_name);
          const parts = [];
          if (firstResult.address) {
            if (firstResult.address.village || firstResult.address.suburb) parts.push(firstResult.address.village || firstResult.address.suburb);
            if (firstResult.address.county || firstResult.address.district) parts.push(firstResult.address.county || firstResult.address.district);
            if (firstResult.address.state) parts.push(firstResult.address.state);
          } else {
            const names = firstResult.display_name.split(",");
            if (names.length > 0) parts.push(names[0]);
            if (names.length > 1) parts.push(names[1]);
          }
          if (parts.length > 0) {
            setStateDistrictVillage(parts.join(", "));
          }
        } else {
          alert("Location not found.");
        }
      }
    } catch (err) {
      console.error("Address search error:", err);
    }
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
      "Pending": "bg-amber-55/10 border-amber-200/50 text-amber-600 dark:text-amber-400",
      "Assigned": "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
      "Sample Collected": "bg-blue-50 dark:bg-blue-500/10 border-blue-105 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
      "Testing": "bg-blue-50 dark:bg-blue-505/10 border-blue-105 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
      "Report Ready": "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400",
      "Completed": "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider shadow-sm ${badges[status] || badges.Pending}`}>
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
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading Soil Registry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 rounded-3xl shadow-sm mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
            <Bookmark size={14} />
            <span>Soil Intelligence System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">
            Soil Testing & AI-Powered Crop Recommendation
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-404 leading-relaxed font-sans">
            Test soil macronutrients N-P-K, identify micronutrient deficiency levels, get direct diagnostic reports from agronomists, and explore Grok-AI custom crop rotation suggestions.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Request Form (Farmers only) */}
        {isFarmer && !isAdmin && (
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Clipboard className="text-blue-600 dark:text-blue-400" size={20} />
                  <span>Request Soil Test</span>
                </h2>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1 hover:border-blue-500/30 transition-all shadow-sm"
                >
                  <MapPin size={10} />
                  <span>Get GPS Coords</span>
                </button>
              </div>

              {formMessage.text && (
                <div className={`p-4 rounded-xl text-center text-xs font-bold border ${formMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                  : "bg-red-55 border-red-105 text-red-600"
                  }`}>
                  {formMessage.text}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Farmer Name</label>
                    <input
                      type="text"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Phone Number</label>
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
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Farm Area (in Acres)</label>
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

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gata Number (Plot / Survey No.)</label>
                    <input
                      type="text"
                      value={gataNumber}
                      onChange={(e) => setGataNumber(e.target.value)}
                      className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none text-blue-600 dark:text-blue-400 font-extrabold"
                      placeholder="e.g. 123/4"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Planned Crop Type</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Soil Type</label>
                    <select
                      value={soilType}
                      onChange={(e) => setSoilType(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none font-bold"
                      required
                    >
                      <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Soil Type</option>
                      <option value="Alluvial" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Alluvial</option>
                      <option value="Black Cotton" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Black Cotton</option>
                      <option value="Red/Yellow" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Red & Yellow</option>
                      <option value="Loamy" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Loamy</option>
                      <option value="Clayey" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Clayey</option>
                      <option value="Sandy/Arid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sandy / Arid</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Village / District / State</label>
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

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Full Address</label>
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
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Map Pinpoint location (Click map to expand and search)
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsMapExpanded(true)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold underline"
                    >
                      Expand Map
                    </button>
                  </div>

                  {/* Preview Map (Clicking opens expand modal) */}
                  <div 
                    onClick={() => setIsMapExpanded(true)}
                    className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer relative group shadow-sm bg-slate-50 dark:bg-slate-950"
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

                  <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-bold font-mono">
                    <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">Lat: <strong className="text-slate-800 dark:text-white font-mono font-bold">{latitude.toFixed(5)}</strong></span>
                    <span className="bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">Lng: <strong className="text-slate-800 dark:text-white font-mono font-bold">{longitude.toFixed(5)}</strong></span>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Additional Notes</label>
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
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-2"
                >
                  <Send size={14} />
                  <span>{formSubmitting ? "Submitting request..." : "Submit Soil Test Request"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN / MAIN PANEL (Farmers: Request History | Admins: Tests List & Management) */}
        <div className={`${isFarmer && !isAdmin ? "lg:col-span-7" : "lg:col-span-12"} space-y-6 text-left`}>

          {/* ADMIN SUB-TABS */}
          {isAdmin && (
            <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <button
                onClick={() => setActiveSubTab("requests")}
                className={`pb-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${activeSubTab === "requests" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                Soil Testing Requests
              </button>
              <button
                onClick={() => setActiveSubTab("users")}
                className={`pb-2 text-xs font-semibold tracking-wider uppercase border-b-2 transition-all ${activeSubTab === "users" ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
              >
                User & Farmer Manager
              </button>
            </div>
          )}

          {/* TABLE / LIST OF REQUESTS */}
          {(!isAdmin || activeSubTab === "requests") && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 text-left">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                  <span>{isAdmin ? "Soil Analysis Registry" : isAgent ? "My Collections Dashboard" : "Soil Test Request History"}</span>
                </h2>

                {/* Search & Filters (For Admins / Agents) */}
                {(isAdmin || isAgent) && (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2 text-slate-400 dark:text-slate-500" size={14} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Farmer..."
                        className="pl-9 pr-4 py-1.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg text-xs focus:outline-none w-40 sm:w-48"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-lg text-xs p-1.5 font-bold"
                    >
                      <option value="All" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Statuses</option>
                      <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pending</option>
                      <option value="Assigned" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Assigned</option>
                      <option value="Sample Collected" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Collected</option>
                      <option value="Testing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Testing</option>
                      <option value="Report Ready" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Report Ready</option>
                      <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Completed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Request List Items */}
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 text-slate-500 font-semibold font-sans">
                  No soil test requests found.
                </div>
              ) : (
                <div className="space-y-6 text-left">
                  {filteredRequests.map((test) => (
                    <div key={test._id} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-750 transition-all space-y-4 text-left">

                      {/* Request Header */}
                      <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="space-y-1 text-left">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">{test.farmerName}</h3>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">&bull;</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{test.cropPlanned} Planning</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-xs font-semibold font-sans">
                            <span className="flex items-center space-x-1 text-[11px]"><Phone size={11} className="text-blue-600 dark:text-blue-400" /> <span>{test.phone}</span></span>
                            <span className="text-slate-300 dark:text-slate-800">|</span>
                            <span className="flex items-center space-x-1 text-[11px]"><MapPin size={11} className="text-blue-600 dark:text-blue-400" /> <span className="truncate max-w-[200px] sm:max-w-xs">{test.address}</span></span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(test.status)}
                        </div>
                      </div>

                      {/* Request Specifications */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-xs font-semibold">
                        <div className="bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-400 dark:text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Area Size</span>
                          <span className="font-bold text-slate-800 dark:text-white">{test.farmArea} Acres</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-400 dark:text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Gata Number</span>
                          <span className="font-extrabold text-blue-600 dark:text-blue-400">{test.gataNumber || "N/A"}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-400 dark:text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Soil Class</span>
                          <span className="font-bold text-slate-800 dark:text-white">{test.soilType}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-400 dark:text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Village / Region</span>
                          <span className="font-bold text-slate-800 dark:text-white truncate block max-w-[120px]">{test.stateDistrictVillage}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                          <span className="text-slate-400 dark:text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider">Agent Assigned</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{test.agent?.fullName || test.agent?.username || "None"}</span>
                        </div>
                      </div>

                      {/* Notes block */}
                      {test.additionalNotes && (
                        <div className="text-xs bg-white dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 italic font-sans text-left">
                          Notes: {test.additionalNotes}
                        </div>
                      )}

                      {/* Progress Stage Flow Visual (Timeline) */}
                      <div className="pt-2">
                        <div className="flex justify-between items-center relative">
                          <div className="absolute left-2 right-2 h-0.5 bg-slate-200 dark:bg-slate-800 pointer-events-none -z-10"></div>
                          {["Pending", "Assigned", "Sample Collected", "Testing", "Report Ready", "Completed"].map((stage, i, arr) => {
                            const statuses = ["Pending", "Assigned", "Sample Collected", "Testing", "Report Ready", "Completed"];
                            const currentIdx = statuses.indexOf(test.status);
                            const stageIdx = statuses.indexOf(stage);

                            const isPast = stageIdx < currentIdx;
                            const isCurrent = stageIdx === currentIdx;

                            let circleBg = "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 shadow-sm";
                            if (isPast) circleBg = "bg-blue-600 border-blue-500 text-white shadow-sm";
                            if (isCurrent) circleBg = "bg-blue-500 border-blue-400 text-white animate-pulse shadow-sm";

                            return (
                              <div key={stage} className="flex flex-col items-center space-y-1 relative z-10">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-extrabold ${circleBg}`}>
                                  {isPast ? "✓" : i + 1}
                                </div>
                                <span className={`text-[8px] font-bold uppercase tracking-wider text-center max-w-[50px] truncate hidden sm:block ${isCurrent ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-400 dark:text-slate-500"}`}>
                                  {stage.replace("Sample ", "").replace("Report ", "")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Report Section */}
                      {((test.status === "Report Ready" || test.status === "Completed") &&
                        (isAdmin || isAgent || test.isPublished)) && (
                          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2 space-y-3 text-left">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                                <FileText className="text-blue-600 dark:text-blue-400" size={16} />
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
                                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm"
                                >
                                  <Download size={12} />
                                  <span>Download Lab Report</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left font-sans">
                              <div className="bg-white dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Macronutrient Summary</span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{test.reportContent || "Diagnostic testing in progress."}</p>
                              </div>
                              <div className="bg-white dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Recommended Inputs</span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{test.recommendedFertilizers || "Lab recommendations pending."}</p>
                              </div>
                            </div>

                            {/* Grok AI Analysis Results Block */}
                            {test.aiAnalysis && test.aiAnalysis.npkAnalysis && (
                              <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 p-5 rounded-xl space-y-4 text-left">
                                <div className="flex items-center space-x-2 border-b border-blue-100/25 pb-2">
                                  <Cpu className="text-blue-600 dark:text-blue-400 animate-pulse-glow" size={16} />
                                  <h5 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                    Grok-AI Cognitive Agronomy Recommendations
                                  </h5>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans text-left">
                                  <div className="space-y-3">
                                    <div>
                                      <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1 mb-0.5"><Award size={12} /> <span>NPK Assessment</span></span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.npkAnalysis}</p>
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1 mb-0.5"><AlertCircle size={12} /> <span>Deficiencies</span></span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.deficiencyExplanation}</p>
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1 mb-0.5"><SlidersHorizontal size={12} /> <span>Fertilizer Plan</span></span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.fertilizerRecommendation}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1 mb-0.5"><Sprout size={12} /> <span>Organic Carbon Upgrade</span></span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.organicImprovement}</p>
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1 mb-0.5"><Droplets size={12} /> <span>Hydration & Drainage</span></span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.waterManagement}</p>
                                    </div>
                                    <div>
                                      <span className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1 mb-0.5"><ArrowRight size={12} /> <span>Crop Rotations</span></span>
                                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.bestCrops}</p>
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
                                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
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
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex items-center space-x-3 text-xs text-amber-700 dark:text-amber-400 mt-2 text-left font-sans">
                          <AlertCircle size={16} className="shrink-0" />
                          <span>Your soil test report is currently under review by our agricultural administrator and will be published shortly.</span>
                        </div>
                      )}

                      {/* Admin/Agent Action Bars */}
                      {isAdmin && (
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                          {test.status !== "Completed" ? (
                            <>
                              {test.status !== "Completed" && test.status !== "Report Ready" && !test.labReportUrl && (
                                <button
                                  onClick={() => setAssigningTestId(test._id)}
                                  className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold py-1.5 px-3 rounded-lg text-xs border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 shadow-sm"
                                >
                                  <UserCheck size={12} className="text-blue-600" />
                                  <span>Assign Field Agent</span>
                                </button>
                              )}

                              {test.labReportUrl && !test.isPublished && (
                                <button
                                  onClick={() => handlePublishReport(test._id)}
                                  disabled={actionLoading}
                                  className="bg-blue-650 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1 shadow-sm active:scale-95"
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
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1 shadow-sm active:scale-95"
                              >
                                <FileText size={12} />
                                <span>Publish Report / Update Status</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center space-x-1">
                              <CheckCircle2 size={14} />
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Agent Action Bar */}
                      {isAgent && (
                        <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                          {test.status === "Assigned" && (
                            <button
                              onClick={() => handleAgentStatusUpdate(test._id, "Sample Collected")}
                              disabled={actionLoading}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1 shadow-sm active:scale-95"
                            >
                              <Truck size={12} />
                              <span>Mark Sample Collected</span>
                            </button>
                          )}
                          {test.status === "Sample Collected" && (
                            <button
                              onClick={() => handleAgentStatusUpdate(test._id, "Testing")}
                              disabled={actionLoading}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1 shadow-sm active:scale-95"
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
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center space-x-1 shadow-sm active:scale-95"
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 animate-fade-in text-left">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center space-x-2">
                <Users className="text-blue-600 dark:text-blue-400" size={20} />
                <span>User & Farm Registry</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-700 dark:text-slate-300 text-xs border-collapse font-sans font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
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
                      <tr key={u._id} className="border-b border-slate-100 dark:border-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">{u.username}</td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-sans">{u.email}</td>
                        <td className="py-3.5 px-4 font-sans">{u.fullName || "Not added"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase shadow-sm ${u.role === "admin" ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-650 dark:text-red-400" :
                            u.role === "farmer" ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                              u.role === "agent" ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                u.role === "transporter" ? "bg-blue-55 dark:bg-blue-505/10 border border-blue-105 dark:border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                  u.role === "fertilizer_seller" ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                    u.role === "instrument_seller" ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400" :
                                      "bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20 text-slate-600 dark:text-slate-400"
                            }`}>
                            {u.role?.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-450 font-sans">
                          {u.role === "farmer" && u.landDetails?.farmArea
                            ? `${u.landDetails.farmArea} ac | ${u.landDetails.soilType || ""}`
                            : "N/A"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleUserRoleUpdate(u._id, e.target.value)}
                            disabled={actionLoading}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-lg p-1.5 text-slate-800 dark:text-white"
                          >
                            <option value="customer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Customer</option>
                            <option value="farmer" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Farmer</option>
                            <option value="agent" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Field Agent</option>
                            <option value="fertilizer_seller" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Fertilizer Seller</option>
                            <option value="instrument_seller" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Ag Instruments Seller</option>
                            <option value="transporter" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Transporter</option>
                            <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Admin</option>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <UserCheck className="text-blue-600 dark:text-blue-400" size={16} />
                <span>Assign Field Agent & Lab Facility</span>
              </h3>
              <button
                onClick={() => { setAssigningTestId(null); setAssignAgentId(""); setAssignLabFacility(""); }}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <p className="text-slate-500 dark:text-slate-400 font-medium font-sans">Select a registered agronomist dispatcher and their nearest laboratory facility to run the soil sample test.</p>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nearest Lab Testing Facility</label>
                <select
                  value={assignLabFacility}
                  onChange={(e) => setAssignLabFacility(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-bold"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Nearest Lab...</option>
                  <option value="Sitapur Central Testing Lab" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sitapur Central Testing Lab</option>
                  <option value="Ludhiana Ag University Lab" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Ludhiana Ag University Lab</option>
                  <option value="Lucknow Soil Health Lab" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Lucknow Soil Health Lab</option>
                  <option value="Delhi Organic Testing Station" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Delhi Organic Testing Station</option>
                  <option value="Kanpur Agricultural Research Center" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Kanpur Agricultural Research Center</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Field Agents Available</label>
                <select
                  value={assignAgentId}
                  onChange={(e) => setAssignAgentId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white font-bold"
                >
                  <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Agent...</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{a.fullName || a.username} ({a.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => { setAssigningTestId(null); setAssignAgentId(""); setAssignLabFacility(""); }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignAgent(assigningTestId)}
                  disabled={actionLoading || !assignAgentId || !assignLabFacility}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 my-8 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5 text-left">
                <FileText className="text-blue-600 dark:text-blue-400" size={16} />
                <span>Publish Soil Diagnostics & Recommendations</span>
              </h3>
              <button
                onClick={() => setReportingTest(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportDetailsSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Testing Progress Status</label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white font-bold"
                >
                  <option value="Testing" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Testing (In Progress)</option>
                  <option value="Report Ready" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Report Ready (Diagnostics Filled)</option>
                  {isAdmin && <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Completed (AI suggestions active)</option>}
                </select>
              </div>

              {/* PDF/Image Lab Report File Upload */}
              {(!isAdmin || !reportingTest.labReportUrl) ? (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Lab Report File (PDF / Image)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-300 font-sans font-semibold"
                      accept="image/*,application/pdf"
                    />
                    <button
                      type="button"
                      onClick={() => handleReportFileUpload(reportingTest._id)}
                      disabled={actionLoading || !uploadFile}
                      className="bg-blue-600 hover:bg-blue-750 disabled:opacity-50 text-white p-2 rounded-xl"
                    >
                      <Upload size={16} />
                    </button>
                  </div>
                  {reportingTest.labReportUrl && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold mt-1">✓ Report loaded: {reportingTest.labReportUrl.split("/").pop()}</span>
                  )}
                  {!isAdmin && !reportingTest.labReportUrl && (
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-1">⚠️ Uploading the lab report file is required.</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Lab Report Document</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">✓ Uploaded by Agent</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(reportingTest.labReportUrl, `Soil_Report_${reportingTest._id}.pdf`)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-blue-600 dark:text-blue-400"
                  >
                    <Download size={12} />
                    <span>Download Report PDF</span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Soil Macronutrient Analysis Summary</label>
                <textarea
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="e.g. pH: 6.8. Nitrogen: 120 ppm (Low), Phosphorus: 30 ppm (Moderate), Potassium: 280 ppm (High)."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 h-24 focus:outline-none"
                  required={isAdmin && (reportStatus === "Report Ready" || reportStatus === "Completed")}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Recommended Soil Inputs & Additives</label>
                <textarea
                  value={recommendedFertilizers}
                  onChange={(e) => setRecommendedFertilizers(e.target.value)}
                  placeholder="e.g. Incorporate 50kg Urea per acre during primary tillage. Apply organic compost."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 h-24 focus:outline-none"
                  required={isAdmin && (reportStatus === "Report Ready" || reportStatus === "Completed")}
                />
              </div>

              {isAdmin && (
                <div className="flex items-center space-x-2 py-1 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <input
                    type="checkbox"
                    id="publishImmediately"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="publishImmediately" className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer select-none">
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
                    className="bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 font-bold py-2 px-4 rounded-xl flex items-center space-x-1.5 shadow-sm"
                  >
                    <Cpu size={14} />
                    <span>Generate AI Suggestions</span>
                  </button>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setReportingTest(null)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl shadow-sm"
                  >
                    Save Report Details
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPANDED MAP SELECTION MODAL */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Pinpoint Field Location</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Click anywhere on the map or drag the pin to set your coordinates.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Address Search Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                placeholder="Search village, city, or district name..."
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-sm"
              >
                <Search size={12} />
                <span>Search</span>
              </button>
            </div>

            {/* Map Frame */}
            <div className="h-[50vh] w-full relative bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
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
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold">
              <div className="text-left w-full sm:w-auto">
                <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Current Selected Coordinates</p>
                <p className="text-slate-900 dark:text-white font-mono mt-0.5">Lat: {latitude.toFixed(6)}, Lng: {longitude.toFixed(6)}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 truncate max-w-md">Address: {address || "Locating..."}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl transition-all shadow-sm active:scale-95 text-xs"
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

export default SoilTest;
