import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User as UserIcon, Mail, Phone, MapPin, Sprout, Shield, Lock,
  Settings, Save, Upload, Calendar, ChevronRight, Activity,
  TrendingUp, Award, Droplets, HardHat, FileText, CheckCircle2,
  AlertTriangle, Hourglass, ShoppingBag, Store, Tag, Truck, Navigation
} from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker asset imports
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
  const [latitude, setLatitude] = useState(user?.latitude || 27.56);
  const [longitude, setLongitude] = useState(user?.longitude || 80.68);
  const [mapCenter, setMapCenter] = useState([user?.latitude || 27.56, user?.longitude || 80.68]);

  // Synchronize map center when coordinates change
  useEffect(() => {
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Debounced auto-geocoding from manual text fields
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      const addressParts = [];
      if (street) addressParts.push(street);
      if (city) addressParts.push(city);
      if (state) addressParts.push(state);
      if (pincode) addressParts.push(pincode);
      
      const query = addressParts.join(", ");
      if (!query || query.trim() === "") return;
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setLatitude(lat);
            setLongitude(lon);
            setMapCenter([lat, lon]);
          }
        }
      } catch (err) {
        console.error("Auto geocoding address failed:", err);
      }
    }, 1200);
    
    return () => clearTimeout(delayDebounce);
  }, [street, city, state, pincode]);

  const ChangeMapCenter = ({ center }) => {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.setView(center, map.getZoom());
      }
    }, [center, map]);
    return null;
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;
        setLatitude(lat);
        setLongitude(lon);
        setMapCenter([lat, lon]);
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.address) {
              const addr = data.address;
              const streetVal = [addr.road, addr.suburb, addr.neighbourhood, addr.village].filter(Boolean).join(", ") || data.display_name || "";
              const cityVal = addr.city || addr.town || addr.village || addr.county || "";
              const stateVal = addr.state || "";
              const pincodeVal = addr.postcode || "";
              
              setStreet(streetVal);
              setCity(cityVal);
              setState(stateVal);
              setPincode(pincodeVal);
            }
          })
          .catch(err => console.error("Reverse geocoding error:", err));
      }
    });
    return null;
  };

  // Transporter custom logistics settings
  const [vehicle, setVehicle] = useState(null);
  const [vehicleType, setVehicleType] = useState("two-wheeler");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [capacityKg, setCapacityKg] = useState(500);
  const [isAvailable, setIsAvailable] = useState(true);
  const [pricePerKm, setPricePerKm] = useState(15);
  const [minCharge, setMinCharge] = useState(50);
  const [loadingCharge, setLoadingCharge] = useState(100);
  const [waitingCharge, setWaitingCharge] = useState(50);
  const [nightSurcharge, setNightSurcharge] = useState(0);
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverLicense, setDriverLicense] = useState("");

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
      setLatitude(user.latitude || 27.56);
      setLongitude(user.longitude || 80.68);
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
      fetchVehicleDetails();
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
          latitude,
          longitude,
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

  const fetchVehicleDetails = async () => {
    try {
      const response = await fetch("/api/profile/vehicle");
      if (response.ok) {
        const data = await response.json();
        if (data.vehicle) {
          const veh = data.vehicle;
          setVehicle(veh);
          setVehicleType(veh.vehicleType || "two-wheeler");
          setRegistrationNumber(veh.registrationNumber || "");
          setCapacityKg(veh.capacityKg || 500);
          setIsAvailable(veh.isAvailable !== undefined ? veh.isAvailable : true);
          setPricePerKm(veh.pricePerKm || 15);
          setMinCharge(veh.minCharge || 50);
          setLoadingCharge(veh.loadingCharge || 100);
          setWaitingCharge(veh.waitingCharge || 50);
          setNightSurcharge(veh.nightSurcharge || 0);
          setDriverName(veh.driverDetails?.name || "");
          setDriverPhone(veh.driverDetails?.phone || "");
          setDriverLicense(veh.driverDetails?.licenseNumber || "");
        }
      }
    } catch (err) {
      console.error("Failed to load vehicle details:", err);
    }
  };

  const handleVehicleUpdate = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const response = await fetch("/api/profile/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleType,
          registrationNumber,
          capacityKg: Number(capacityKg),
          isAvailable,
          pricePerKm: Number(pricePerKm),
          minCharge: Number(minCharge),
          loadingCharge: Number(loadingCharge),
          waitingCharge: Number(waitingCharge),
          nightSurcharge: Number(nightSurcharge),
          driverName,
          driverPhone,
          driverLicense
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMessage({ text: "Vehicle and logistics settings updated successfully!", type: "success" });
        setVehicle(data.vehicle);
        await refreshUser();
      } else {
        setMessage({ text: data.error || "Failed to update vehicle details.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error occurred.", type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFetchGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    
    setMessage({ text: "Requesting GPS coordinates...", type: "success" });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        
        setMessage({ text: "Coordinates fetched! Fetching address details...", type: "success" });
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              const streetVal = [addr.road, addr.suburb, addr.neighbourhood, addr.village].filter(Boolean).join(", ") || data.display_name || "";
              const cityVal = addr.city || addr.town || addr.village || addr.county || "";
              const stateVal = addr.state || "";
              const pincodeVal = addr.postcode || "";
              
              setStreet(streetVal);
              setCity(cityVal);
              setState(stateVal);
              setPincode(pincodeVal);
              setMessage({ text: "Address auto-filled successfully!", type: "success" });
              setTimeout(() => setMessage({ text: "", type: "" }), 3000);
            } else {
              setMessage({ text: "GPS location fetched, but address lookup failed. Please fill manually.", type: "error" });
            }
          } else {
            setMessage({ text: "GPS location fetched, but address service failed. Please fill manually.", type: "error" });
          }
        } catch (err) {
          console.error("Nominatim reverse geocode failed:", err);
          setMessage({ text: "Error lookup. Please input fields manually.", type: "error" });
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setMessage({ text: "GPS access denied or failed: " + err.message, type: "error" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData
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
        return <Hourglass className="text-amber-500 dark:text-amber-400" size={16} />;
      case "Assigned":
        return <HardHat className="text-blue-600 dark:text-blue-400" size={16} />;
      case "Sample Collected":
        return <Droplets className="text-blue-600 dark:text-blue-400" size={16} />;
      case "Testing":
        return <Activity className="text-blue-600 dark:text-blue-400" size={16} />;
      case "Report Ready":
        return <FileText className="text-blue-650 dark:text-blue-400" size={16} />;
      case "Completed":
        return <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={16} />;
      default:
        return <Hourglass className="text-slate-400" size={16} />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white">
        <div className="text-center space-y-4">
          <AlertTriangle className="text-amber-550 mx-auto" size={48} />
          <p className="text-xl font-bold font-sans">Please sign in to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up text-left">

      {/* Toast Alert Banner */}
      {message.text && (
        <div className={`p-4 rounded-2xl mb-6 text-center font-bold border flex items-center justify-center space-x-2 max-w-2xl mx-auto text-xs ${message.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
            : "bg-red-50 border-red-200 text-red-650"
          }`}>
          {message.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600"></div>

            {/* Profile Photo */}
            <div className="relative group mt-4 mb-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center shadow-inner">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="text-slate-400 w-12 h-12" />
                )}
              </div>
              <label className="absolute bottom-1.5 right-1.5 p-2 rounded-xl bg-blue-600 text-white cursor-pointer hover:bg-blue-700 shadow-sm transition-all">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={photoUploading} />
                <Upload size={14} />
              </label>
              {photoUploading && (
                <div className="absolute inset-0 bg-slate-950/80 rounded-2xl flex items-center justify-center text-[10px] font-bold text-blue-400">
                  Uploading...
                </div>
              )}
            </div>

            {/* Basic Info */}
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{user.fullName || user.username}</h3>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mt-1 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20">
              {user.role}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate w-full font-sans font-semibold">{user.email}</p>

            {/* Statistics Quick-Look */}
            <div className="grid grid-cols-2 gap-4 w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 font-sans">
              {user.role === "farmer" && (
                <>
                  <div className="text-left bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Sprout size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Farm Area</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{farmArea ? `${farmArea} Acres` : "Not Added"}</span>
                  </div>

                  <div className="text-left bg-slate-55 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Activity size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Soil Tests</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{soilTests.length} Total</span>
                  </div>
                </>
              )}

              {user.role === "customer" && (
                <>
                  <div className="text-left bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <ShoppingBag size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Purchases</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{ordersCount} Orders</span>
                  </div>

                  <div className="text-left bg-slate-55 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <UserIcon size={12} className="text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Account Type</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">Customer</span>
                  </div>
                </>
              )}

              {(user.role === "fertilizer_seller" || user.role === "instrument_seller") && (
                <>
                  <div className="text-left bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Store size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Listed Items</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{listingsCount} Products</span>
                  </div>

                  <div className="text-left bg-slate-55 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Tag size={12} className="text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Shop Profile</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider truncate block">
                      {user.role === "fertilizer_seller" ? "Fertilizers" : "Ag Instruments"}
                    </span>
                  </div>
                </>
              )}

              {user.role === "transporter" && (
                <>
                  <div className="text-left bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Truck size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Active Jobs</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{activeJobsCount} Active</span>
                  </div>

                  <div className="text-left bg-slate-55 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Navigation size={12} className="text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Role</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">Transporter</span>
                  </div>
                </>
              )}

              {user.role === "agent" && (
                <>
                  <div className="text-left bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Activity size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Assigned Tests</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{soilTests.length} Assigned</span>
                  </div>

                  <div className="text-left bg-slate-55 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <HardHat size={12} className="text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Role</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">Field Agent</span>
                  </div>
                </>
              )}

              {user.role === "admin" && (
                <>
                  <div className="text-left bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <Shield size={12} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">System Admin</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-white">Full Access</span>
                  </div>

                  <div className="text-left bg-slate-55 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                      <UserIcon size={12} className="text-blue-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Role</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">Admin</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation Tabs</h4>
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setActiveTab("personal")}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${activeTab === "personal" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400"}`}
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
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${activeTab === "farming" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400"}`}
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
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${activeTab === "history" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400"}`}
                >
                  <div className="flex items-center space-x-3">
                    <FileText size={16} />
                    <span>Soil Testing History</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              )}

              {user.role === "transporter" && (
                <button
                  onClick={() => setActiveTab("vehicle")}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${activeTab === "vehicle" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400"}`}
                >
                  <div className="flex items-center space-x-3">
                    <Truck size={16} />
                    <span>Vehicle & Logistics Settings</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              )}

              <button
                onClick={() => setActiveTab("security")}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${activeTab === "security" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 font-extrabold" : "hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400"}`}
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm min-h-[500px]">

            {/* Tab: Personal Details */}
            {activeTab === "personal" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Personal & Contact Details</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                        placeholder="Contact number"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 text-left">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Address Details</h4>
                      <button
                        type="button"
                        onClick={handleFetchGPSLocation}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[9px] flex items-center space-x-1 uppercase transition-all self-start shadow-sm"
                      >
                        <MapPin size={10} />
                        <span>Autofill GPS Address</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Street / Locality</label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs"
                          placeholder="e.g. Near Sitapur Junction"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Postal Pincode</label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs"
                          placeholder="e.g. 261001"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">District / City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs"
                          placeholder="District name"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">State</label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs"
                          placeholder="State name"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-2 font-sans font-semibold">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Latitude</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{latitude ? Number(latitude).toFixed(5) : "Not Set"}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Longitude</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{longitude ? Number(longitude).toFixed(5) : "Not Set"}</span>
                      </div>
                    </div>

                    {/* Profile map component */}
                    <div className="space-y-1.5 mt-2 text-left">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Confirm Pinpoint on Map</label>
                      <div className="h-48 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shadow-sm">
                        <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} className="h-full w-full">
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker position={[latitude || 27.56, longitude || 80.68]} />
                          <MapClickHandler />
                          <ChangeMapCenter center={mapCenter} />
                        </MapContainer>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs"
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Farming & Land Information</h3>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Farm Land Area (in Acres)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={farmArea}
                        onChange={(e) => setFarmArea(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                        placeholder="e.g. 5.5"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Current Soil Type</label>
                      <select
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs focus:outline-none font-bold"
                      >
                        <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Select Soil Type</option>
                        <option value="Alluvial Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Alluvial Soil</option>
                        <option value="Black Cotton Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Black Cotton Soil</option>
                        <option value="Red/Yellow Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Red & Yellow Soil</option>
                        <option value="Laterite Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Laterite Soil</option>
                        <option value="Sandy/Arid Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Sandy / Arid Soil</option>
                        <option value="Loamy Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Loamy Soil</option>
                        <option value="Clayey Soil" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Clayey Soil</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Typical Crops Planned (Comma Separated)</label>
                      <input
                        type="text"
                        value={cropTypes}
                        onChange={(e) => setCropTypes(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                        placeholder="e.g. Wheat, Rice, Sugarcane"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Farming Experience (in Years)</label>
                      <input
                        type="number"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                        placeholder="e.g. 12"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Farm Geographical Coordinates / Location</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                      placeholder="e.g. Lat: 27.56, Lon: 80.68 | Sitapur Rural"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs"
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Soil Testing Registry</h3>

                {loadingTests ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : soilTests.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-450 font-semibold font-sans">
                    <Sprout size={32} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-sm">No requested soil test records found.</p>
                  </div>
                ) : (
                  <div className="space-y-6 text-left">
                    {soilTests.map((test) => (
                      <div key={test._id} className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm text-left">

                        {/* Test Meta Header */}
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="space-y-0.5 text-left">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {test.cropPlanned} Planning Test
                            </h4>
                            <p className="text-[10px] text-slate-500 flex items-center space-x-1 font-sans">
                              <Calendar size={12} />
                              <span>Requested: {new Date(test.requestedAt).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <div className="flex items-center space-x-1.5 px-3 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold text-slate-800 dark:text-white shadow-sm">
                            {getStatusIcon(test.status)}
                            <span className="text-[10px] uppercase font-extrabold tracking-wider">{test.status}</span>
                          </div>
                        </div>

                        {/* Summary details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                          <div>
                            <span className="text-slate-400 dark:text-slate-550 block mb-0.5 text-[9px] uppercase">Soil Type</span>
                            <span className="font-bold text-slate-800 dark:text-white">{test.soilType || "Not Stated"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-550 block mb-0.5 text-[9px] uppercase">Farm Area</span>
                            <span className="font-bold text-slate-800 dark:text-white">{test.farmArea} Acres</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-550 block mb-0.5 text-[9px] uppercase">Address</span>
                            <span className="font-bold text-slate-800 dark:text-white truncate max-w-[120px] block">{test.address}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-slate-550 block mb-0.5 text-[9px] uppercase">Agent Assigned</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{test.agent?.fullName || test.agent?.username || "Not Assigned"}</span>
                          </div>
                        </div>

                        {/* Published Report & AI details */}
                        {test.isPublished && (
                          <div className="bg-white dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 mt-2 text-xs font-sans text-left shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                              <h5 className="font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                                <FileText size={14} />
                                <span>Report Approved & Published</span>
                              </h5>
                              {test.labReportUrl && (
                                <button
                                  onClick={() => handleDownloadPDF(test.labReportUrl, `Soil_Report_${test._id}.pdf`)}
                                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-blue-600 dark:text-blue-400 shadow-sm"
                                >
                                  <Download size={10} />
                                  <span>Download Report</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Macronutrients Summary</span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{test.reportContent || "No details provided."}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Recommended Inputs</span>
                                <p className="text-slate-700 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{test.recommendedFertilizers || "No inputs recommended."}</p>
                              </div>
                            </div>

                            {test.aiAnalysis && test.aiAnalysis.fertilizerRecommendation && (
                              <div className="bg-blue-50 dark:bg-blue-500/5 p-3 rounded-lg border border-blue-100 dark:border-blue-500/10 space-y-2 mt-1 text-left">
                                <h6 className="font-extrabold text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                                  <Award size={12} />
                                  <span>Grok-AI Recommendations</span>
                                </h6>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{test.aiAnalysis.fertilizerRecommendation}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Unpublished Notice */}
                        {!test.isPublished && (test.status === "Report Ready" || test.status === "Completed") && (
                          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 p-3.5 rounded-xl flex items-center space-x-2 text-[11px] text-amber-700 dark:text-amber-400 mt-2 font-sans font-semibold">
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

            {/* Tab: Vehicle & Logistics Settings */}
            {activeTab === "vehicle" && user.role === "transporter" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Vehicle & Logistics Settings</h3>
                <form onSubmit={handleVehicleUpdate} className="space-y-6">
                  
                  {/* Vehicle Details Section */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Vehicle Specifications</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Vehicle Category Type</label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs focus:outline-none font-bold"
                          required
                        >
                          <option value="two-wheeler" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Two-Wheeler (Motorcycle / Scooter)</option>
                          <option value="three-wheeler" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Three-Wheeler (Auto-Rickshaw / Loader)</option>
                          <option value="pickup" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Pickup Truck (Mini Utility payload)</option>
                          <option value="tata-ace" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tata Ace (Chota Hathi / Medium utility)</option>
                          <option value="mini-truck" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Mini-Truck (Commercial delivery transport)</option>
                          <option value="large-truck" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Large Cargo Truck (Multi-axle container)</option>
                          <option value="refrigerated-truck" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Refrigerated Cold-Chain Truck</option>
                          <option value="container" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Closed container transport</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Registration Number</label>
                        <input
                          type="text"
                          value={registrationNumber}
                          onChange={(e) => setRegistrationNumber(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. MH-12-AB-1234"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Payload Capacity (in Kg)</label>
                        <input
                          type="number"
                          value={capacityKg}
                          onChange={(e) => setCapacityKg(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. 500"
                          min="1"
                          required
                        />
                      </div>

                      <div className="flex items-center space-x-3 pt-6 text-left font-sans">
                        <input
                          type="checkbox"
                          id="isAvailableCheck"
                          checked={isAvailable}
                          onChange={(e) => setIsAvailable(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-blue-600 bg-white dark:bg-slate-950 focus:ring-blue-500"
                        />
                        <label htmlFor="isAvailableCheck" className="text-xs font-bold text-slate-600 dark:text-slate-350 select-none">
                          Mark Vehicle as Available for Orders
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Details Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-left">
                    <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Fare & Pricing Structure (in ₹)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Fare per KM</label>
                        <input
                          type="number"
                          value={pricePerKm}
                          onChange={(e) => setPricePerKm(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none text-emerald-600 dark:text-emerald-400 font-bold"
                          placeholder="e.g. 15"
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Minimum Charge</label>
                        <input
                          type="number"
                          value={minCharge}
                          onChange={(e) => setMinCharge(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. 50"
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Loading/Unloading Charge</label>
                        <input
                          type="number"
                          value={loadingCharge}
                          onChange={(e) => setLoadingCharge(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. 100"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Driver details section */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-left">
                    <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Driver & License Information</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Driver's Name</label>
                        <input
                          type="text"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. Ramesh Kumar"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Driver's Mobile (Phone)</label>
                        <input
                          type="tel"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. 9876543210"
                          required
                        />
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Driving License Number</label>
                        <input
                          type="text"
                          value={driverLicense}
                          onChange={(e) => setDriverLicense(e.target.value)}
                          className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                          placeholder="e.g. DL-1420110012345"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs"
                  >
                    <Save size={16} />
                    <span>{saveLoading ? "Saving Logistics Settings..." : "Save Vehicle & Driver Details"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Security & Password */}
            {activeTab === "security" && (
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Security & Password Management</h3>
                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs focus:outline-none"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs"
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
