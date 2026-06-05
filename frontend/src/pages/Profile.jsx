import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  User as UserIcon, Mail, Phone, MapPin, Sprout, Shield, Lock, 
  Settings, Save, Upload, Calendar, ChevronRight, Activity, 
  TrendingUp, Award, Droplets, HardHat, FileText, CheckCircle2,
  AlertTriangle, Hourglass, ShoppingBag, Store, Tag, Truck, Navigation
} from "lucide-react";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [soilTests, setSoilTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(user?.role === "farmer" || user?.role === "agent");
  const [activeTab, setActiveTab] = useState("personal");
  
  // Role-specific stats states
  const [ordersCount, setOrdersCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  // Personal/Contact state
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [street, setStreet] = useState(user?.address?.street || "");
  const [city, setCity] = useState(user?.address?.city || "");
  const [state, setState] = useState(user?.address?.state || "");
  const [pincode, setPincode] = useState(user?.address?.pincode || "");

  // Farming/Land state
  const [farmArea, setFarmArea] = useState(user?.landDetails?.farmArea || 0);
  const [soilType, setSoilType] = useState(user?.landDetails?.soilType || "");
  const [locationName, setLocationName] = useState(user?.landDetails?.location || "");
  const [cropTypes, setCropTypes] = useState(user?.farmingInfo?.cropTypes?.join(", ") || "");
  const [experienceYears, setExperienceYears] = useState(user?.farmingInfo?.experienceYears || 0);

  // Security state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Messaging & loaders
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [photoUploading, setPhotoUploading] = useState(false);

  // Sync state with user context on load
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setStreet(user.address?.street || "");
      setCity(user.address?.city || "");
      setState(user.address?.state || "");
      setPincode(user.address?.pincode || "");
      setFarmArea(user.landDetails?.farmArea || 0);
      setSoilType(user.landDetails?.soilType || "");
      setLocationName(user.landDetails?.location || "");
      setCropTypes(user.farmingInfo?.cropTypes?.join(", ") || "");
      setExperienceYears(user.farmingInfo?.experienceYears || 0);
    }
  }, [user]);

  // Fetch soil test history
  const fetchSoilTests = async () => {
    try {
      setLoadingTests(true);
      const response = await fetch("/api/soil-tests");
      if (response.ok) {
        const data = await response.json();
        setSoilTests(data.soilTests || []);
      }
    } catch (err) {
      console.error("Failed to fetch soil tests:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    if (user.role === "farmer" || user.role === "agent") {
      fetchSoilTests();
    }
    
    if (user.role === "customer") {
      fetch("/api/orders")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setOrdersCount(data.orders?.length || 0); })
        .catch(err => console.error(err));
    }
    
    if (user.role === "fertilizer_seller" || user.role === "instrument_seller") {
      fetch("/api/seller/listings")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setListingsCount(data.myListings?.length || 0); })
        .catch(err => console.error(err));
    }
    
    if (user.role === "transporter") {
      fetch("/api/transporter/active")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            const activeJobs = data.orders?.filter(o => o.status === "In Transit") || [];
            setActiveJobsCount(activeJobs.length);
          }
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleDownloadPDF = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename || 'soil_report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab:", error);
      window.open(url, '_blank');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          address: { street, city, state, pincode },
          farmingInfo: { 
            cropTypes: cropTypes.split(",").map(c => c.trim()).filter(Boolean),
            experienceYears: Number(experienceYears) 
          },
          landDetails: { 
            farmArea: Number(farmArea), 
            soilType, 
            location: locationName 
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ text: "Profile details updated successfully!", type: "success" });
        await refreshUser();
      } else {
        setMessage({ text: data.error || "Failed to update profile.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "File size exceeds 5MB limit.", type: "error" });
      return;
    }

    setPhotoUploading(true);
    setMessage({ text: "", type: "" });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64data = reader.result;
        const response = await fetch("/api/profile/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo: base64data })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setMessage({ text: "Profile photo uploaded successfully!", type: "success" });
          await refreshUser();
        } else {
          setMessage({ text: data.error || "Photo upload failed.", type: "error" });
        }
      } catch (err) {
        setMessage({ text: "Failed to upload photo.", type: "error" });
      } finally {
        setPhotoUploading(false);
      }
    };
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ text: "Password changed successfully!", type: "success" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ text: data.error || "Failed to update password.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Hourglass className="text-amber-400" size={16} />;
      case "Assigned":
        return <HardHat className="text-sky-400" size={16} />;
      case "Sample Collected":
        return <Droplets className="text-teal-400" size={16} />;
      case "Testing":
        return <Activity className="text-indigo-400" size={16} />;
      case "Report Ready":
        return <FileText className="text-purple-400" size={16} />;
      case "Completed":
        return <CheckCircle2 className="text-emerald-400" size={16} />;
      default:
        return <Hourglass className="text-slate-400" size={16} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-300">
        <div className="text-center space-y-4">
          <AlertTriangle className="text-amber-500 mx-auto" size={48} />
          <p className="text-xl font-semibold">Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
      
      {/* Toast Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-2xl mb-6 text-center font-semibold border flex items-center justify-center space-x-2 max-w-2xl mx-auto ${
          message.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600"></div>

            {/* Profile Photo */}
            <div className="relative group mt-4 mb-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-900 flex items-center justify-center shadow-inner">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="text-slate-500 w-12 h-12" />
                )}
              </div>
              <label className="absolute bottom-1.5 right-1.5 p-2 rounded-xl bg-emerald-500 text-slate-950 cursor-pointer hover:bg-emerald-600 shadow-md transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
                <Upload size={14} />
              </label>
              {photoUploading && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex items-center justify-center text-[10px] font-bold text-emerald-400">
                  Uploading...
                </div>
              )}
            </div>

            {/* Basic Info */}
            <h3 className="text-xl font-bold text-white leading-tight">{user.fullName || user.username}</h3>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mt-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {user.role}
            </p>
            <p className="text-xs text-slate-400 mt-2 truncate w-full">{user.email}</p>

            {/* Statistics Quick-Look */}
            <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-800/80">
              {user.role === "farmer" && (
                <>
                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Sprout size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Farm Area</span>
                    </div>
                    <span className="text-sm font-bold text-white">{farmArea ? `${farmArea} Acres` : "Not Added"}</span>
                  </div>

                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Activity size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Soil Tests</span>
                    </div>
                    <span className="text-sm font-bold text-white">{soilTests.length} Total</span>
                  </div>
                </>
              )}

              {user.role === "customer" && (
                <>
                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <ShoppingBag size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Purchases</span>
                    </div>
                    <span className="text-sm font-bold text-white">{ordersCount} Orders</span>
                  </div>

                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <UserIcon size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Account Type</span>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Customer</span>
                  </div>
                </>
              )}

              {(user.role === "fertilizer_seller" || user.role === "instrument_seller") && (
                <>
                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Store size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Listed Items</span>
                    </div>
                    <span className="text-sm font-bold text-white">{listingsCount} Products</span>
                  </div>

                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Tag size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Shop Profile</span>
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate block">
                      {user.role === "fertilizer_seller" ? "Fertilizers" : "Ag Instruments"}
                    </span>
                  </div>
                </>
              )}

              {user.role === "transporter" && (
                <>
                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Truck size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Active Jobs</span>
                    </div>
                    <span className="text-sm font-bold text-white">{activeJobsCount} Active</span>
                  </div>

                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Navigation size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Role</span>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">Transporter</span>
                  </div>
                </>
              )}

              {user.role === "agent" && (
                <>
                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Activity size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Assigned Tests</span>
                    </div>
                    <span className="text-sm font-bold text-white">{soilTests.length} Assigned</span>
                  </div>

                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <HardHat size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Role</span>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">Field Agent</span>
                  </div>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <Shield size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">System Admin</span>
                    </div>
                    <span className="text-xs font-bold text-white">Full Access</span>
                  </div>

                  <div className="text-left bg-slate-900/60 p-3 rounded-2xl border border-slate-850">
                    <div className="flex items-center space-x-1 text-slate-400 mb-1">
                      <UserIcon size={12} className="text-amber-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Role</span>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">Administrator</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation Tabs</h4>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setActiveTab("personal")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === "personal" ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500" : "hover:bg-slate-900 text-slate-300"}`}
              >
                <div className="flex items-center space-x-3">
                  <UserIcon size={16} />
                  <span>Personal Details</span>
                </div>
                <ChevronRight size={14} />
              </button>

              {user.role === "farmer" && (
                <button 
                  onClick={() => setActiveTab("farming")}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === "farming" ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500" : "hover:bg-slate-900 text-slate-300"}`}
                >
                  <div className="flex items-center space-x-3">
                    <Sprout size={16} />
                    <span>Farming & Land Info</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              )}

              {user.role === "farmer" && (
                <button 
                  onClick={() => setActiveTab("history")}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === "history" ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500" : "hover:bg-slate-900 text-slate-300"}`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText size={16} />
                    <span>Soil Testing History</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              )}

              <button 
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-all ${activeTab === "security" ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500" : "hover:bg-slate-900 text-slate-300"}`}
              >
                <div className="flex items-center space-x-3">
                  <Lock size={16} />
                  <span>Password & Security</span>
                </div>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Tab View */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 min-h-[500px]">
            
            {/* Tab: Personal Details */}
            {activeTab === "personal" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800/80 pb-4">Personal & Contact Details</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="Contact number"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Address Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Street / Locality</label>
                        <input 
                          type="text" 
                          value={street} 
                          onChange={(e) => setStreet(e.target.value)} 
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                          placeholder="e.g. Near Sitapur Junction"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Postal Pincode</label>
                        <input 
                          type="text" 
                          value={pincode} 
                          onChange={(e) => setPincode(e.target.value)} 
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                          placeholder="e.g. 261001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">District / City</label>
                        <input 
                          type="text" 
                          value={city} 
                          onChange={(e) => setCity(e.target.value)} 
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                          placeholder="District name"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">State</label>
                        <input 
                          type="text" 
                          value={state} 
                          onChange={(e) => setState(e.target.value)} 
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                          placeholder="State name"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{saveLoading ? "Saving Details..." : "Save Profile Details"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Farming & Land Details */}
            {activeTab === "farming" && user.role === "farmer" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800/80 pb-4">Farming & Land Information</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Farm Land Area (in Acres)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={farmArea} 
                        onChange={(e) => setFarmArea(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="e.g. 5.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Soil Type</label>
                      <select 
                        value={soilType} 
                        onChange={(e) => setSoilType(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="">Select Soil Type</option>
                        <option value="Alluvial Soil">Alluvial Soil</option>
                        <option value="Black Cotton Soil">Black Cotton Soil</option>
                        <option value="Red/Yellow Soil">Red & Yellow Soil</option>
                        <option value="Laterite Soil">Laterite Soil</option>
                        <option value="Sandy/Arid Soil">Sandy / Arid Soil</option>
                        <option value="Loamy Soil">Loamy Soil</option>
                        <option value="Clayey Soil">Clayey Soil</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Typical Crops Planned (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={cropTypes} 
                        onChange={(e) => setCropTypes(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="e.g. Wheat, Rice, Sugarcane"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Farming Experience (in Years)</label>
                      <input 
                        type="number" 
                        value={experienceYears} 
                        onChange={(e) => setExperienceYears(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="e.g. 12"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Farm Geographical Coordinates / Location</label>
                    <input 
                      type="text" 
                      value={locationName} 
                      onChange={(e) => setLocationName(e.target.value)} 
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                      placeholder="e.g. Lat: 27.56, Lon: 80.68 | Sitapur Rural"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{saveLoading ? "Saving Details..." : "Save Land Details"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Soil Testing History */}
            {activeTab === "history" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800/80 pb-4">Soil Testing Registry</h3>
                
                {loadingTests ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : soilTests.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800/80 text-slate-400">
                    <Sprout size={32} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-sm font-semibold">No requested soil test records found.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {soilTests.map((test) => (
                      <div key={test._id} className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/60 space-y-4">
                        
                        {/* Test Meta Header */}
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800/60 pb-3">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-sm text-white">
                              {test.cropPlanned} Planning Test
                            </h4>
                            <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                              <Calendar size={12} />
                              <span>Requested: {new Date(test.requestedAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-950 border border-slate-850 rounded-full text-xs font-bold text-white">
                            {getStatusIcon(test.status)}
                            <span className="text-[10px]">{test.status}</span>
                          </div>
                        </div>

                        {/* Summary details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 block mb-0.5">Soil Type</span>
                            <span className="font-semibold text-white">{test.soilType || "Not Stated"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Farm Area</span>
                            <span className="font-semibold text-white">{test.farmArea} Acres</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Address</span>
                            <span className="font-semibold text-white truncate max-w-[120px] block">{test.address}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block mb-0.5">Agent Assigned</span>
                            <span className="font-semibold text-white">{test.agent?.fullName || test.agent?.username || "Not Assigned"}</span>
                          </div>
                        </div>

                        {/* Published Report & AI details */}
                        {test.isPublished && (
                          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850/80 space-y-3 mt-2 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/60 pb-2">
                              <h5 className="font-bold text-emerald-400 flex items-center space-x-1.5">
                                <FileText size={14} />
                                <span>Report Approved & Published</span>
                              </h5>
                              {test.labReportUrl && (
                                <button 
                                  onClick={() => handleDownloadPDF(test.labReportUrl, `Soil_Report_${test._id}.pdf`)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-emerald-500/20 text-[10px] font-bold text-emerald-400 hover:text-white"
                                >
                                  <Download size={10} />
                                  <span>Download Report</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Macronutrients Summary</span>
                                <p className="text-slate-300 text-xs whitespace-pre-wrap">{test.reportContent || "No details provided."}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Recommended Inputs</span>
                                <p className="text-slate-300 text-xs whitespace-pre-wrap">{test.recommendedFertilizers || "No inputs recommended."}</p>
                              </div>
                            </div>

                            {test.aiAnalysis && test.aiAnalysis.fertilizerRecommendation && (
                              <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/10 space-y-2 mt-1">
                                <h6 className="font-bold text-emerald-400 flex items-center space-x-1">
                                  <Award size={12} />
                                  <span>Grok-AI Recommendations</span>
                                </h6>
                                <p className="text-slate-300">{test.aiAnalysis.fertilizerRecommendation}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Unpublished Notice */}
                        {!test.isPublished && (test.status === "Report Ready" || test.status === "Completed") && (
                          <div className="bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-xl flex items-center space-x-2 text-[11px] text-amber-400 mt-2">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>Report is undergoing final administrative approval review.</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Security & Password */}
            {activeTab === "security" && (
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800/80 pb-4">Security & Password Management</h3>
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
                    <input 
                      type="password" 
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50"
                  >
                    <Lock size={16} />
                    <span>{saveLoading ? "Updating Password..." : "Update Security Credentials"}</span>
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
