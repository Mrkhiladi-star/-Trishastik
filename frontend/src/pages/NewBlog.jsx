import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ArrowLeft } from "lucide-react";

const NewBlog = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishedon, setPublishedon] = useState("");
  const [image, setImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/blognew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pisting: {
            title,
            description,
            publishedon,
            image
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        navigate("/blog");
      } else {
        setError(data.error || "Failed to create blog post.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 max-w-2xl mx-auto space-y-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center space-x-1.5 text-slate-400 hover:text-emerald-400 font-semibold mb-2 transition-colors text-xs"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>

        <div>
          <h2 className="text-2xl font-bold text-white">Write a New Blog Post</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full mt-2"></div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl font-semibold text-center text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blog Title</label>
            <input 
              type="text" 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Modern Soil Conservation Techniques"
              required 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content</label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none h-44 resize-none"
              placeholder="Type your blog content here..."
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="publishedon" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Publish Date</label>
              <input 
                type="text" 
                id="publishedon"
                value={publishedon}
                onChange={(e) => setPublishedon(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                placeholder="e.g. 24 May 2026"
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="image" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Banner Image URL</label>
              <input 
                type="text" 
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                placeholder="Paste banner image link"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-4"
          >
            <PlusCircle size={14} />
            <span>{submitting ? "Publishing Blog..." : "Publish Blog Post"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewBlog;
