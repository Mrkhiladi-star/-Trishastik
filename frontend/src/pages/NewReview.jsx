import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, ArrowLeft, Star } from "lucide-react";

const NewReview = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [post, setPost] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/newReview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          histing: {
            name,
            description,
            post,
            rating: Number(rating)
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        navigate("/");
      } else {
        setError(data.error || "Failed to submit review.");
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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create a New Review</h2>
          <div className="w-16 h-1 bg-blue-600 rounded-full mt-2"></div>
        </div>

        {error && (
          <div className="bg-red-55 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-3 rounded-xl font-bold text-center text-xs animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="name" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Amit Sharma"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="description" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none h-32 resize-none"
              placeholder="Share your experience with Trishastik Farms..."
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-sans">Rating (रेटिंग)</label>
            <div className="flex items-center space-x-1.5 pt-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform active:scale-125 hover:scale-110"
                >
                  <Star
                    size={22}
                    className={
                      star <= rating
                        ? "text-amber-500 fill-amber-500"
                        : "text-slate-300 dark:text-slate-700"
                    }
                  />
                </button>
              ))}
              <span className="text-xs font-extrabold text-slate-550 dark:text-slate-400 pl-3">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label htmlFor="post" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Your Title / Role</label>
            <input
              type="text"
              id="post"
              value={post}
              onChange={(e) => setPost(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
              placeholder="e.g. Farmer / Local Shopper / Organic Advocate"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-4"
          >
            <PlusCircle size={14} />
            <span>{submitting ? "Submitting Review..." : "Submit Review"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewReview;
