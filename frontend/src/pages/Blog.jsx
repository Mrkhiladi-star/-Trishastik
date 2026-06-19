import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, Calendar, Newspaper, ArrowRight } from "lucide-react";

const Blog = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blog");
      const data = await response.json();
      setBlogs(data.allListings || []);
    } catch (err) {
      console.error("Error loading blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const isAdmin = user && (user.role === "admin" || user.email === "freeforfire15@gmail.com");

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-semibold tracking-wider">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold tracking-wider text-xs uppercase">
              <Newspaper size={14} />
              <span>Agronomy News</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Our Agritech Blog</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Explore insightful articles and research guides written by agricultural scientists.
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/blognew"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-6 rounded-xl shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 text-xs self-start"
            >
              <PlusCircle size={16} />
              <span>Create New Blog</span>
            </Link>
          )}
        </div>

        {/* Blog Posts Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-500 font-medium">
            No blog posts available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((item) => (
              <div key={item._id} className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden shadow-lg hover:border-slate-800 transition-all flex flex-col justify-between group">
                <div>
                  <div className="h-48 overflow-hidden bg-slate-950 relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500"; }}
                    />
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-bold border border-slate-800/80 flex items-center space-x-1.5">
                      <Calendar size={10} />
                      <span>{item.publishedon || "Recent"}</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-4">{item.description}</p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-900/60 mt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Author: Admin</span>
                  <Link to="#" className="text-emerald-400 font-bold hover:text-emerald-300 flex items-center space-x-1">
                    <span>Read Article</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
