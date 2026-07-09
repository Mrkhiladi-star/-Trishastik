import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ArrowLeft } from "lucide-react";

const NewEducation = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/educationnew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          histing: {
            title,
            description,
            video
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        navigate("/education");
      } else {
        setError(data.error || "Failed to create education content.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up text-left">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm max-w-2xl mx-auto space-y-6 text-left">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-blue-650 font-semibold mb-2 transition-colors text-xs"
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Publish New Education Module</h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mt-2"></div>
        </div>

        {error && (
          <div className="bg-red-55 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-3 rounded-xl font-bold text-center text-xs animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="title" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Module Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Smart Drip Irrigation Setup"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="description" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Abstract Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none h-32 resize-none"
              placeholder="Provide a detailed abstract of the module goals and parameters..."
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="video" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Material / Video Resource Link</label>
            <input
              type="text"
              id="video"
              value={video}
              onChange={(e) => setVideo(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="Paste article URL or YouTube video link"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-4"
          >
            <PlusCircle size={14} />
            <span>{submitting ? "Publishing Module..." : "Publish Education Module"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewEducation;
