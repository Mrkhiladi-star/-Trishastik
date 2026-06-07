import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut, User as UserIcon, Sprout, ShoppingBag, BookOpen, Newspaper, ShieldAlert, Users, Compass, Info, Sun, Moon, Truck } from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      navigate("/");
    }
  };

  const isActive = (path) => location.pathname === path;

  const isAdmin = user && (user.role === "admin" || user.email === "freeforfire15@gmail.com");
  const isFarmer = user && (user.role === "farmer" || user.email === "freeforfire15@gmail.com");
  const isAgent = user && user.role === "agent";
  const isCustomer = user && (user.role === "customer" || user.role === "farmer" || user.role === "fertilizer_seller" || user.role === "instrument_seller");
  const isTransporter = user && user.role === "transporter";
  const isSeller = user && (user.role === "farmer" || user.role === "fertilizer_seller" || user.role === "instrument_seller");

  return (
    <nav className="sticky top-0 z-50 w-full mb-6">
      <div className="glass-panel backdrop-blur-md bg-slate-950/60 p-4 shadow-2xl rounded-2xl border border-slate-800/80 transition-all duration-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all duration-300">
                <Sprout className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" size={24} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight text-white group-hover:text-emerald-400 transition-colors duration-300">
                  Trishastik
                </span>
                <span className="text-[10px] text-slate-400 tracking-widest uppercase">Bharat Farms</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link 
              to="/" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
            >
              <Compass size={16} />
              <span>Home</span>
            </Link>
            <Link 
              to="/about" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/about") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
            >
              <Info size={16} />
              <span>About</span>
            </Link>
            
            {!isAdmin && !isTransporter && !isAgent && (
              <Link 
                to="/shop" 
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/shop") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
              >
                <ShoppingBag size={16} />
                <span>Shop</span>
              </Link>
            )}

            {isSeller && (
              <Link 
                to="/seller-dashboard" 
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/seller-dashboard") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
              >
                <Sprout size={16} />
                <span>Seller Portal</span>
              </Link>
            )}

            {isTransporter && (
              <Link 
                to="/transporter-dashboard" 
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/transporter-dashboard") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
              >
                <Truck size={16} />
                <span>Transport Portal</span>
              </Link>
            )}

            <Link 
              to="/soil-test" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/soil-test") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
            >
              <Sprout size={16} />
              <span>Soil Health</span>
            </Link>
            
            <Link 
              to="/blog" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/blog") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
            >
              <Newspaper size={16} />
              <span>Blog</span>
            </Link>
            <Link 
              to="/education" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/education") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
            >
              <BookOpen size={16} />
              <span>Education</span>
            </Link>

            {isAdmin && (
              <Link 
                to="/customer" 
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive("/customer") ? "bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}
              >
                <Users size={16} />
                <span>Customers</span>
              </Link>
            )}
          </div>

          {/* Desktop Right Panel (Profile/Auth) */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 dark:text-emerald-400 hover:bg-slate-800/80 transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700">
                    <img 
                      src={user.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-semibold text-white max-w-[100px] truncate">{user.username}</span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 glass-panel rounded-xl shadow-2xl py-2 text-slate-200 border border-slate-800/90 animate-fade-in z-50">
                    <div className="px-4 py-3 border-b border-slate-800/80">
                      <p className="font-bold text-sm text-white truncate">{user.fullName || user.username}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <Link 
                      to="/profile" 
                      className="flex items-center px-4 py-2.5 hover:bg-slate-800/80 hover:text-white transition-colors text-sm"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserIcon size={16} className="mr-2 text-slate-400" />
                      {user.role === "farmer" ? "Farmer Profile" :
                       user.role === "customer" ? "Customer Profile" :
                       user.role === "transporter" ? "Transporter Profile" :
                       user.role === "agent" ? "Field Agent Profile" :
                       user.role === "fertilizer_seller" ? "Fertilizer Seller Profile" :
                       user.role === "instrument_seller" ? "Ag Instruments Seller Profile" :
                       user.role === "admin" ? "Admin Profile" : "My Profile"}
                    </Link>
                    <button 
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center px-4 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-sm border-t border-slate-800/50"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-5 rounded-xl shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 transform active:scale-95 text-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Sidebar Hamburger Toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {user && !user.isProfileComplete && (
        <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between animate-fade-in shadow-md">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 relative flex shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span>Your profile is incomplete. Please add your contact and address details to unlock all platform features.</span>
          </div>
          <Link to="/profile" className="font-bold underline hover:text-amber-300 ml-4 shrink-0">Complete Profile</Link>
        </div>
      )}

      {/* Mobile Drawer (Sidebar) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          ></div>
          
          {/* Sidebar Panel */}
          <div className="relative flex flex-col w-72 max-w-xs bg-slate-950 border-r border-slate-800/80 text-slate-200 p-6 shadow-2xl z-10 transition-all duration-300 animate-slide-right">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-2">
                <Sprout className="text-emerald-400" size={24} />
                <span className="font-bold text-lg text-white">Trishastik</span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 dark:text-emerald-400"
                  title="Toggle Theme"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between flex-grow">
              <ul className="flex flex-col space-y-3 font-medium">
                <li>
                  <Link 
                    to="/" 
                    onClick={() => setSidebarOpen(false)} 
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                  >
                    <Compass size={18} />
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/about" 
                    onClick={() => setSidebarOpen(false)} 
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/about") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                  >
                    <Info size={18} />
                    <span>About Us</span>
                  </Link>
                </li>
                
                {!isAdmin && !isTransporter && !isAgent && (
                  <li>
                    <Link 
                      to="/shop" 
                      onClick={() => setSidebarOpen(false)} 
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/shop") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                    >
                      <ShoppingBag size={18} />
                      <span>Shop Products</span>
                    </Link>
                  </li>
                )}

                {isSeller && (
                  <li>
                    <Link 
                      to="/seller-dashboard" 
                      onClick={() => setSidebarOpen(false)} 
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/seller-dashboard") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                    >
                      <Sprout size={18} />
                      <span>Seller Portal</span>
                    </Link>
                  </li>
                )}

                {isTransporter && (
                  <li>
                    <Link 
                      to="/transporter-dashboard" 
                      onClick={() => setSidebarOpen(false)} 
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/transporter-dashboard") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                    >
                      <Truck size={18} />
                      <span>Transport Portal</span>
                    </Link>
                  </li>
                )}

                <li>
                  <Link 
                    to="/soil-test" 
                    onClick={() => setSidebarOpen(false)} 
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/soil-test") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                  >
                    <Sprout size={18} />
                    <span>Soil Testing</span>
                  </Link>
                </li>
                
                <li>
                  <Link 
                    to="/blog" 
                    onClick={() => setSidebarOpen(false)} 
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/blog") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                  >
                    <Newspaper size={18} />
                    <span>Agronomy Blog</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/education" 
                    onClick={() => setSidebarOpen(false)} 
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/education") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                  >
                    <BookOpen size={18} />
                    <span>Learning Hub</span>
                  </Link>
                </li>

                {isAdmin && (
                  <li>
                    <Link 
                      to="/customer" 
                      onClick={() => setSidebarOpen(false)} 
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors ${isActive("/customer") ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-950"}`}
                    >
                      <Users size={18} />
                      <span>Customer List</span>
                    </Link>
                  </li>
                )}
              </ul>

              <div className="border-t border-slate-800/80 pt-4 mt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-850">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800">
                        <img 
                          src={user.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-white leading-tight">{user.username}</span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{user.role}</span>
                      </div>
                    </div>
                    <Link 
                      to="/profile" 
                      onClick={() => setSidebarOpen(false)} 
                      className="flex items-center px-3 py-2.5 hover:bg-slate-900 rounded-xl transition-colors text-sm font-medium"
                    >
                      <UserIcon size={16} className="mr-2 text-slate-400" />
                      View Profile
                    </Link>
                    <button 
                      onClick={() => {
                        setSidebarOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center px-3 py-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors text-sm font-medium"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link 
                    to="/login" 
                    onClick={() => setSidebarOpen(false)} 
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl block text-center transition-all duration-200"
                  >
                    Get Started
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
