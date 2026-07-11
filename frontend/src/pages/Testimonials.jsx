import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, MessageSquare, PlusCircle, ArrowLeft, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Testimonials = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        setReviews(data.allReviews || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalReviews = reviews.length;
  
  // Calculate average rating
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : "5.0";

  // Count ratings distribution
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.round(r.rating || 5);
    if (distribution[star] !== undefined) {
      distribution[star]++;
    }
  });

  const isFarmer = user && user.role === "farmer";

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 space-y-8 animate-fade-in-up text-left">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate("/")}
              className="flex items-center space-x-1.5 text-slate-400 hover:text-blue-650 font-semibold transition-colors text-xs mb-1"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </button>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
              <MessageSquare className="text-blue-600 dark:text-blue-400" />
              <span>Kisan Stories & Feedback</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">Genuine feedback and platform reviews shared by our organic farming community</p>
          </div>

          {isFarmer && (
            <Link
              to="/newreview"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl shadow-sm text-xs flex items-center space-x-2 transition-all transform active:scale-95"
            >
              <PlusCircle size={14} />
              <span>Share Your Story</span>
            </Link>
          )}
        </div>

        {/* Rating Summary Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm">
          {/* Average Box */}
          <div className="md:col-span-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 pb-6 md:pb-0 md:pr-8 text-center space-y-2">
            <span className="text-5xl font-extrabold text-slate-900 dark:text-white leading-none">{averageRating}</span>
            <div className="flex space-x-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"}
                  className={i < Math.round(Number(averageRating)) ? "text-amber-500" : "text-slate-300 dark:text-slate-700"}
                />
              ))}
            </div>
            <p className="text-xs text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider">
              Based on {totalReviews} Reviews
            </p>
          </div>

          {/* Distribution Bars */}
          <div className="md:col-span-8 flex flex-col justify-center space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center space-x-3 text-xs text-slate-500 font-semibold font-sans">
                  <span className="w-3 text-right">{stars}</span>
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-950/60 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-850">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right text-slate-400">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials List Grid */}
        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-550 dark:text-slate-450 font-bold text-sm font-sans">No reviews or testimonials have been posted yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => {
              const rVal = rev.rating || 5;
              return (
                <div
                  key={rev._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-sm hover:border-slate-300 dark:hover:border-slate-850 transition-all text-left"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < rVal ? "currentColor" : "none"}
                            className={i < rVal ? "text-amber-500" : "text-slate-200 dark:text-slate-800"}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-extrabold flex items-center space-x-1 uppercase tracking-wider font-sans">
                        <Heart size={10} className="text-red-500 fill-red-500 animate-pulse" />
                        <span>Verified Kisan</span>
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed text-xs font-sans">
                      "{rev.description}"
                    </p>
                  </div>
                  <div className="mt-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col">
                    <span className="font-extrabold text-slate-850 dark:text-slate-200 text-xs sm:text-sm">{rev.name}</span>
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">
                      {rev.post || rev.Post || "Farmer / Platform Shopper"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonials;
