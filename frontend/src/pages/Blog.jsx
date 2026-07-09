import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, Calendar, Newspaper, ArrowRight, X } from "lucide-react";

const Blog = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
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

  const isAdmin = user && (user.role === "admin" || user.email === "sramu1090@gmail.com");

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
              <Newspaper size={14} />
              <span>Newspaper & Articles</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Our Agritech Blog</h1>
            <p className="text-sm text-slate-500 dark:text-slate-404 max-w-xl font-sans">
              Explore insightful articles and research guides written by agricultural scientists.
            </p>
          </div>

          {isAdmin && (
            <Link
              to="/blognew"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm flex items-center space-x-2 transition-all transform active:scale-95 text-xs self-start"
            >
              <PlusCircle size={16} />
              <span>Create New Blog</span>
            </Link>
          )}
        </div>

        {/* Blog Posts Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold font-sans">
            No blog posts available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedBlog(item)}
                className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:border-slate-350 dark:hover:border-slate-750 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-950 relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500"; }}
                    />
                    <div className="absolute bottom-3 left-3 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800/80 flex items-center space-x-1.5 shadow-sm font-sans">
                      <Calendar size={10} />
                      <span>{item.publishedon || "Recent"}</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-3 text-left">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-4 font-sans">{item.description}</p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-900/60 mt-4 flex justify-between items-center text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-semibold font-sans">Author: Admin</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 flex items-center space-x-1">
                    <span>Read Article</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Blog Detail Overlay Modal */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-lg relative flex flex-col max-h-[90vh] text-left">
            {/* Close button */}
            <button
              onClick={() => setSelectedBlog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 z-10 hover:scale-105 transition-all shadow-sm"
            >
              <X size={18} />
            </button>

            {/* Banner Image */}
            <div className="h-64 sm:h-72 w-full bg-slate-100 dark:bg-slate-950 relative shrink-0">
              <img
                src={selectedBlog.image}
                alt={selectedBlog.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500"; }}
              />
              <div className="absolute bottom-4 left-4 bg-white/85 dark:bg-slate-950/85 backdrop-blur-sm px-3.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 shadow-sm font-sans">
                <Calendar size={12} />
                <span>Published: {selectedBlog.publishedon || "Recent"}</span>
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 overflow-y-auto space-y-4 text-left flex-grow font-sans">
              <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider block">Author: Admin & Agronomist</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {selectedBlog.title}
              </h2>
              <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap pt-2">
                {selectedBlog.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Blog;
