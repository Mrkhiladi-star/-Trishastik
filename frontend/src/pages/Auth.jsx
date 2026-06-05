import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sprout, Leaf, ArrowRight, LogIn, UserPlus, FileText, Smartphone } from "lucide-react";

const Auth = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Tab state: "login" or "signup"
  const [activeTab, setActiveTab] = useState("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("customer");
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    if (!loginUsername || !loginPassword) {
      setLoginError("Please enter your username and password.");
      setLoginLoading(false);
      return;
    }

    const res = await login(loginUsername, loginPassword);
    setLoginLoading(false);
    if (res.success) {
      navigate("/profile");
    } else {
      setLoginError(res.error || "Invalid username or password");
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    if (!signupUsername || !signupEmail || !signupPassword) {
      setSignupError("Please fill out all fields.");
      setSignupLoading(false);
      return;
    }

    const res = await register(signupUsername, signupEmail, signupPassword, signupRole);
    setSignupLoading(false);
    if (res.success) {
      navigate("/profile");
    } else {
      setSignupError(res.error || "Registration failed. Try again.");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl w-full glass-panel rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12 min-h-[600px] border border-slate-800">
        
        {/* Left Side: Welcome Panel (AgriTech Branding & Highlights) */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 p-8 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
          {/* Backdrop Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-8">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Sprout className="text-emerald-400" size={20} />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">Trishastik</span>
            </div>
            
            <div className="space-y-6 mt-12">
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                Empowering Bharat's <br />
                <span className="gradient-text-emerald">Sustainable Farms</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Join our integrated ecosystem for smart soil testing requests, secure marketplace transactions, and custom Grok-AI powered agronomy advice.
              </p>
            </div>
          </div>

          {/* Key Value Cards */}
          <div className="space-y-4 mt-8 relative z-10">
            <div className="flex items-start space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-850">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Lab Certified Soil Reports</h4>
                <p className="text-[11px] text-slate-400">Accurate testing by verified field agronomists.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-slate-900/60 rounded-xl border border-slate-850">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                <Leaf size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Grok-AI Analytics</h4>
                <p className="text-[11px] text-slate-400">Custom NPK analyses, fertilizer rates & water advice.</p>
              </div>
            </div>
          </div>

          {/* Footer inside Left Panel */}
          <div className="text-[10px] text-slate-500 mt-8 relative z-10">
            &copy; {new Date().getFullYear()} Trishastik Bharat. Sustainable Agriculture Tools.
          </div>
        </div>

        {/* Right Side: Tabbed Form Panel */}
        <div className="md:col-span-7 bg-slate-950 p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Tab Selection */}
          <div className="flex bg-slate-900 p-1.5 rounded-2xl mb-8 border border-slate-800 max-w-sm mx-auto w-full">
            <button 
              onClick={() => { setActiveTab("login"); setLoginError(""); setSignupError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${activeTab === "login" ? "bg-emerald-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"}`}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
            <button 
              onClick={() => { setActiveTab("signup"); setLoginError(""); setSignupError(""); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-300 ${activeTab === "signup" ? "bg-emerald-500 text-slate-950 shadow-md font-bold" : "text-slate-400 hover:text-white"}`}
            >
              <UserPlus size={16} />
              <span>Register</span>
            </button>
          </div>

          {/* Form Content Wrapper */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {activeTab === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center md:text-left mb-6">
                    <h3 className="text-2xl font-bold text-white">Welcome Back</h3>
                    <p className="text-sm text-slate-400">Sign in to access your dashboard</p>
                  </div>

                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-6 text-sm text-center font-medium animate-fade-in">
                      {loginError}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
                      <input 
                        type="text" 
                        value={loginUsername} 
                        onChange={(e) => setLoginUsername(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="Enter your username"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                        <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">Forgot?</a>
                      </div>
                      <input 
                        type="password" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="Enter your password"
                        required
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loginLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 transition-all transform active:scale-95 disabled:opacity-50 mt-6"
                    >
                      <span>{loginLoading ? "Verifying..." : "Sign In"}</span>
                      {!loginLoading && <ArrowRight size={16} />}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center md:text-left mb-6">
                    <h3 className="text-2xl font-bold text-white">Create Account</h3>
                    <p className="text-sm text-slate-400">Join Trishastik Sustainable Agriculture network</p>
                  </div>

                  {signupError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl mb-6 text-sm text-center font-medium animate-fade-in">
                      {signupError}
                    </div>
                  )}

                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
                        <input 
                          type="text" 
                          value={signupUsername} 
                          onChange={(e) => setSignupUsername(e.target.value)} 
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                          placeholder="e.g. ramu_kisan"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                        <input 
                          type="email" 
                          value={signupEmail} 
                          onChange={(e) => setSignupEmail(e.target.value)} 
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                          placeholder="ramu@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                      <input 
                        type="password" 
                        value={signupPassword} 
                        onChange={(e) => setSignupPassword(e.target.value)} 
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm focus:outline-none"
                        placeholder="Choose a strong password"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Account Type</label>
                      <select 
                        value={signupRole} 
                        onChange={(e) => setSignupRole(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 font-semibold dark:bg-slate-900 bg-white text-slate-900 dark:text-white"
                      >
                        <option value="customer">Customer / Buyer (Shop organic products)</option>
                        <option value="farmer">Farmer (Sell organic products & request testing)</option>
                        <option value="fertilizer_seller">Fertilizer & Agricultural Medicine Seller</option>
                        <option value="instrument_seller">Ag Instruments Seller (Sale & Rent)</option>
                        <option value="transporter">Transporter / Dispatcher</option>
                        <option value="agent">Field Agent (Soil sample collection)</option>
                      </select>
                    </div>

                    <button 
                      type="submit" 
                      disabled={signupLoading}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 transition-all transform active:scale-95 disabled:opacity-50 mt-6"
                    >
                      <span>{signupLoading ? "Registering..." : "Create Account"}</span>
                      {!signupLoading && <ArrowRight size={16} />}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
