import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Users, AlertTriangle, Star, CheckCircle } from "lucide-react";

const Customers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCustomerData = async () => {
    try {
      const response = await fetch("/api/customer");
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate("/");
          return;
        }
        throw new Error("Failed to load customer list");
      }
      const data = await response.json();
      setCustomers(data.allListings || []);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve customer logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email !== "sramu1090@gmail.com" && user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchCustomerData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 space-y-8 animate-fade-in-up text-left">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center space-x-2">
            <Users className="text-blue-600 dark:text-blue-400" />
            <span>Admin Customer Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Total processed checkout and purchase transactions registry</p>
        </div>

        {error && (
          <div className="bg-red-55 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-4 rounded-xl text-center text-xs font-semibold flex items-center justify-center space-x-1.5 animate-pulse">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        {customers.length === 0 ? (
          <p className="text-center text-slate-500 py-12 text-sm font-semibold font-sans">No customer purchase records in the database.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((c) => (
              <div key={c._id} className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-800 transition-all space-y-3 text-left">
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 text-left">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{c.name}</h3>
                  <span className="text-[9px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/20 uppercase tracking-wider shadow-sm">
                    Paid
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-sans font-semibold text-left">
                  <p><span className="font-extrabold text-slate-400 dark:text-slate-500">Address:</span> {c.address}</p>
                  <p><span className="font-extrabold text-slate-400 dark:text-slate-500">Contact:</span> +91 {c.phone}</p>
                  <p><span className="font-extrabold text-slate-400 dark:text-slate-500">Purchased:</span> {c.products}</p>

                  <div className="border-t border-slate-100 dark:border-slate-900/60 pt-3 mt-3 flex justify-between items-center text-sm">
                    <span className="font-extrabold text-slate-450 dark:text-slate-500">Amount Paid:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-450 text-base">₹{c.totalamount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Static Testimonials for style compatibility */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm max-w-5xl mx-auto space-y-8 text-left">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center tracking-tight">Kisan Success Stories</h2>
        <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-sans font-semibold text-left">
              <div className="flex space-x-1 text-amber-400"><Star size={14} fill="currentColor" /></div>
              <p className="italic">
                "The organic tomatoes I bought from Trishastik Bharat were so fresh and flavorful. I could taste the difference compared to regular store-bought ones!"
              </p>
            </div>
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex flex-col text-left">
              <span className="font-bold text-slate-800 dark:text-white text-xs">Amit Sharma</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Farmer & Regular Customer</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-sans font-semibold text-left">
              <div className="flex space-x-1 text-amber-400"><Star size={14} fill="currentColor" /></div>
              <p className="italic">
                "I’ve been using their organic honey for months now, and it’s absolutely the best I’ve ever tasted. Truly natural!"
              </p>
            </div>
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex flex-col text-left">
              <span className="font-bold text-slate-800 dark:text-white text-xs">Priya Verma</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Health Enthusiast</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-sans font-semibold text-left">
              <div className="flex space-x-1 text-amber-400"><Star size={14} fill="currentColor" /></div>
              <p className="italic">
                "Trishastik Bharat’s handmade soaps are incredibly gentle on the skin. I love how they use all-natural ingredients!"
              </p>
            </div>
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-2 flex flex-col text-left">
              <span className="font-bold text-slate-800 dark:text-white text-xs">Rita Das</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Customer & Eco Shopper</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
