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
    if (user && user.email !== "freeforfire15@gmail.com") {
      navigate("/");
      return;
    }
    fetchCustomerData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider">Loading ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 space-y-8 animate-fade-in-up">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center space-x-2">
            <Users className="text-emerald-400" />
            <span>Admin Customer Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">Total processed checkout and purchase transactions registry</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center text-xs font-semibold flex items-center justify-center space-x-1.5">
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        {customers.length === 0 ? (
          <p className="text-center text-slate-500 py-12 text-sm font-semibold">No customer purchase records in the database.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((c) => (
              <div key={c._id} className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-lg hover:border-slate-800 transition-all space-y-3">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">{c.name}</h3>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                    Paid
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                  <p><span className="font-semibold text-slate-500">Address:</span> {c.address}</p>
                  <p><span className="font-semibold text-slate-500">Contact:</span> +91 {c.phone}</p>
                  <p><span className="font-semibold text-slate-500">Purchased:</span> {c.products}</p>

                  <div className="border-t border-slate-900/60 pt-3 mt-3 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Amount Paid:</span>
                    <span className="font-extrabold text-emerald-400 text-base">₹{c.totalamount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Static Testimonials for style compatibility */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 max-w-5xl mx-auto space-y-8">
        <h2 className="text-2xl font-bold text-white text-center tracking-tight">Kisan Success Stories</h2>
        <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-600 mx-auto rounded-full"></div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex space-x-1 text-amber-400"><Star size={14} fill="currentColor" /></div>
              <p className="italic">
                "The organic tomatoes I bought from Trishastik Bharat were so fresh and flavorful. I could taste the difference compared to regular store-bought ones!"
              </p>
            </div>
            <div className="mt-4 border-t border-slate-800/80 pt-2 flex flex-col">
              <span className="font-bold text-white text-xs">Amit Sharma</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Farmer & Regular Customer</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex space-x-1 text-amber-400"><Star size={14} fill="currentColor" /></div>
              <p className="italic">
                "I’ve been using their organic honey for months now, and it’s absolutely the best I’ve ever tasted. Truly natural!"
              </p>
            </div>
            <div className="mt-4 border-t border-slate-800/80 pt-2 flex flex-col">
              <span className="font-bold text-white text-xs">Priya Verma</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Health Enthusiast</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex space-x-1 text-amber-400"><Star size={14} fill="currentColor" /></div>
              <p className="italic">
                "Trishastik Bharat’s handmade soaps are incredibly gentle on the skin. I love how they use all-natural ingredients!"
              </p>
            </div>
            <div className="mt-4 border-t border-slate-800/80 pt-2 flex flex-col">
              <span className="font-bold text-white text-xs">Rita Das</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Customer & Eco Shopper</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
