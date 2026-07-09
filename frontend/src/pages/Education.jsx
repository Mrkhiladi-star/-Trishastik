import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PlusCircle, ExternalLink, BookOpen, Search, Video, FileText, Check, AlertCircle, X } from "lucide-react";

const Education = () => {
  const { user } = useAuth();
  const [education, setEducation] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Admin inline upload state
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [video, setVideo] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchEducation = async () => {
    try {
      const response = await fetch("/api/education");
      const data = await response.json();
      setEducation(data.allListings || []);
    } catch (err) {
      console.error("Error loading education posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, []);

  const isAdmin = user && (user.role === "admin" || user.email === "sramu1090@gmail.com");

  // Helper to extract YouTube ID and build embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // Regex to parse typical YouTube formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");
    setUploadSuccess("");

    // Word count check (enforcing approx 100-word limit as requested)
    const words = description.trim().split(/\s+/).filter(Boolean);
    if (words.length > 120) {
      setUploadError(`Description is too long (${words.length} words). Please keep it under 100 words.`);
      return;
    }

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
        setUploadSuccess("Module published successfully!");
        setTitle("");
        setDescription("");
        setVideo("");
        fetchEducation();
        setTimeout(() => setUploadSuccess(""), 4000);
      } else {
        setUploadError(data.error || "Failed to create education content.");
      }
    } catch (err) {
      console.error(err);
      setUploadError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter listings based on search query (crop name, titles, description)
  const filteredEducation = education.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-800 dark:text-white font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold tracking-wider font-sans">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Header Action Row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
              <BookOpen size={14} />
              <span>Agri-Academy</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Educational Modules & Guides</h1>
            <p className="text-sm text-slate-500 dark:text-slate-404 max-w-xl font-sans">
              Search crops, learn organic farming techniques, and view expert-guided video modules.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAdminForm(!showAdminForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm flex items-center space-x-2 transition-all transform active:scale-95 text-xs self-start"
            >
              <PlusCircle size={16} />
              <span>{showAdminForm ? "Close Creator Panel" : "Publish New Module"}</span>
            </button>
          )}
        </div>

        {/* Inline Admin Form */}
        {isAdmin && showAdminForm && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm max-w-3xl mx-auto space-y-6 relative overflow-hidden animate-fade-in text-left">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <PlusCircle className="text-blue-600 dark:text-blue-400" size={18} />
                <span>Create New Educational Module</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-404 mt-1 font-sans">Paste a video link and write a summary description (recommended under 100 words).</p>
            </div>

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 p-3 rounded-xl font-bold text-xs flex items-center space-x-2">
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-xl font-bold text-xs flex items-center space-x-2">
                <Check size={14} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="title" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Module / Crop Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  placeholder="e.g. Organic Tomato Farming Techniques"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left font-semibold">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="description" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Description Summary</label>
                  <span className={`text-[9px] font-bold font-sans ${getWordCount(description) > 100 ? "text-amber-600" : "text-slate-400"}`}>
                    {getWordCount(description)} / 100 words
                  </span>
                </div>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none h-24 resize-none"
                  placeholder="Summarize the core learnings and crop guidelines in about 100 words..."
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="video" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">YouTube Video / Resource Link</label>
                <input
                  type="text"
                  id="video"
                  value={video}
                  onChange={(e) => setVideo(e.target.value)}
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all transform active:scale-95 disabled:opacity-50 text-xs mt-2"
              >
                <PlusCircle size={14} />
                <span>{submitting ? "Publishing Module..." : "Publish Education Module"}</span>
              </button>
            </form>
          </div>
        )}

        {/* Search Bar / Filter Input */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm max-w-md text-left">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by crop, disease, or topic (e.g. Tomato)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl text-xs focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Modules Grid */}
        {filteredEducation.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 font-semibold font-sans">
            No educational content matches your search query.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEducation.map((item) => {
              const embedUrl = getYouTubeEmbedUrl(item.video);

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedModule(item)}
                  className="cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:border-slate-350 dark:hover:border-slate-800 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4 text-left">
                    {/* Header icon/title */}
                    <div className="flex items-center space-x-3 text-left">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <BookOpen size={16} />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">{item.title}</h3>
                    </div>

                    {/* YouTube Embed Frame */}
                    {embedUrl ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
                        {/* We use an overlay to capture click on the card rather than playing video inside catalog if user clicks the frame area */}
                        <div className="absolute inset-0 z-10" />
                        <iframe
                          src={embedUrl}
                          title={item.title}
                          className="w-full h-full relative z-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950/65 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 shadow-sm">
                        <Video size={32} className="mb-2" />
                        <span className="text-[10px] uppercase font-bold tracking-wider font-sans">No Video Player Available</span>
                      </div>
                    )}

                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-4 min-h-[4.5rem] font-sans">{item.description}</p>
                  </div>

                  <div className="mt-6 border-t border-slate-100 dark:border-slate-900/60 pt-4 flex space-x-2">
                    <a
                      href={item.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-105 dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center space-x-1.5 transition-all text-xs shadow-sm"
                    >
                      <span>Open Original Resource</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Education Detail Overlay Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-lg relative flex flex-col max-h-[90vh] text-left">
            {/* Close button */}
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 z-10 hover:scale-105 transition-all shadow-sm"
            >
              <X size={18} />
            </button>

            {/* Video embed frame */}
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
              {getYouTubeEmbedUrl(selectedModule.video) ? (
                <iframe
                  src={getYouTubeEmbedUrl(selectedModule.video)}
                  title={selectedModule.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                  <Video size={48} className="mb-2" />
                  <span className="text-xs uppercase font-bold tracking-wider font-sans">No Video Player Available</span>
                </div>
              )}
            </div>

            {/* Details panel */}
            <div className="p-6 overflow-y-auto space-y-4 text-left flex-grow font-sans">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-bold tracking-wider text-xs uppercase">
                <BookOpen size={14} />
                <span>Agri-Academy Guide</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {selectedModule.title}
              </h2>
              <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
              
              <div className="space-y-2 pt-2 text-left">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guide Summary & Instructions</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedModule.description}
                </p>
              </div>

              <div className="pt-4">
                <a
                  href={selectedModule.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-2.5 px-6 rounded-xl items-center space-x-1.5 transition-all text-xs shadow-sm"
                >
                  <span>Open Original Resource Link</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Education;
