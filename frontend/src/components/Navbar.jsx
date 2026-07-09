import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, LogOut, User as UserIcon, Sprout, ShoppingBag, BookOpen, Newspaper, ShieldAlert, Users, Compass, Info, Sun, Moon, Truck, Clock } from "lucide-react";
import logo from "../assets/logo.png";
const Navbar = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

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
      window.location.href = "/login";
    }
  };

  const isActive = (path) => location.pathname === path;

  const isAdmin = user && (user.role === "admin" || user.email === "sramu1090@gmail.com");
  const isFarmer = user && (user.role === "farmer" || user.email === "sramu1090@gmail.com");
  const isAgent = user && user.role === "agent";
  const isCustomer = user && (user.role === "customer" || user.role === "farmer" || user.role === "fertilizer_seller" || user.role === "instrument_seller");
  const isTransporter = user && user.role === "transporter";
  const isSeller = user && (user.role === "farmer" || user.role === "fertilizer_seller" || user.role === "instrument_seller");
  const isStandardCustomer = user && user.role === "customer";

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex justify-between items-center">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={logo}
                  alt="Trishastik Logo"
                  className="w-11 h-11 object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  Trishastik
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 tracking-widest uppercase font-bold">Bharat Farms</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              to="/"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
            >
              <Compass size={14} />
              <span>Home</span>
            </Link>
            <Link
              to="/about"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/about") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
            >
              <Info size={14} />
              <span>About</span>
            </Link>

            {!isAdmin && !isTransporter && !isAgent && (
              <Link
                to="/shop"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/shop") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <ShoppingBag size={14} />
                <span>Shop</span>
              </Link>
            )}

            {isSeller && (
              <Link
                to="/seller-dashboard"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/seller-dashboard") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <Sprout size={14} />
                <span>Seller Portal</span>
              </Link>
            )}

            {isTransporter && (
              <Link
                to="/transporter-dashboard"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/transporter-dashboard") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <Truck size={14} />
                <span>Transport Portal</span>
              </Link>
            )}

            {!isStandardCustomer && (
              <>
                <Link
                  to="/soil-test"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/soil-test") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <Sprout size={14} />
                  <span>Soil Health</span>
                </Link>

                <Link
                  to="/blog"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/blog") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <Newspaper size={14} />
                  <span>Blog</span>
                </Link>
                <Link
                  to="/education"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/education") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <BookOpen size={14} />
                  <span>Education</span>
                </Link>
              </>
            )}

            {isStandardCustomer && (
              <>
                <Link
                  to="/shop?tab=cart"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${location.search.includes("tab=cart") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <ShoppingBag size={14} />
                  <span>My Cart</span>
                  {user.cart && user.cart.length > 0 && (
                    <span className="ml-1 bg-blue-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                      {user.cart.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/shop?tab=orders"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${location.search.includes("tab=orders") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
                >
                  <Clock size={14} />
                  <span>My Purchases</span>
                  {user.order && user.order.length > 0 && (
                    <span className="ml-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full shrink-0">
                      {user.order.length}
                    </span>
                  )}
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/customer"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${isActive("/customer") ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}
              >
                <Users size={14} />
                <span>Customers</span>
              </Link>
            )}
          </div>

          {/* Desktop Right Panel (Profile/Auth) */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all duration-200"
              title="Toggle Light/Dark Theme"
            >
              {theme === "dark" ? <Sun size={15} className="text-blue-600 dark:text-blue-400" /> : <Moon size={15} />}
            </button>
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <img
                      src={user.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-white max-w-[100px] truncate">{user.username}</span>
                    <span className="text-[8px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">{user.role?.replace("_", " ")}</span>
                  </div>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg py-2 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 animate-fade-in z-50 text-left">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{user.fullName || user.username}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-semibold"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserIcon size={14} className="mr-2 text-slate-400" />
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
                      className="w-full text-left flex items-center px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 hover:text-red-700 transition-colors text-xs font-semibold border-t border-slate-100 dark:border-slate-800/50"
                    >
                      <LogOut size={14} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm text-xs transition-all transform active:scale-95"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Sidebar Hamburger Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors shadow-sm"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>

      {user && !user.isProfileComplete && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-250 dark:border-amber-500/20 text-amber-705 dark:text-amber-400 text-[10px] px-4 py-2 rounded-xl flex items-center justify-between shadow-sm mt-1 mb-3 mx-4 md:mx-6 text-left">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 relative flex shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="font-semibold font-sans">Your profile is incomplete. Please add your contact and address details to unlock all platform features.</span>
          </div>
          <Link to="/profile" className="font-extrabold underline hover:text-amber-800 dark:hover:text-amber-300 ml-4 shrink-0">Complete Profile</Link>
        </div>
      )}

      {/* Mobile Drawer (Sidebar) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden text-left">
          {/* Backdrop */}
          <div
            className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xl transition-all duration-300"
            onClick={() => setSidebarOpen(false)}
          ></div>

          {/* Sidebar Panel */}
          <div
            className="relative flex flex-col w-72 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-100 p-6 shadow-2xl z-50 transition-all duration-300 animate-slide-right"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-2">
                <Sprout className="text-blue-600 dark:text-blue-400" size={24} />
                <span className="font-bold text-lg text-slate-900 dark:text-white">Trishastik</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  title="Toggle Theme"
                >
                  {theme === "dark" ? <Sun size={16} className="text-blue-600 dark:text-blue-400" /> : <Moon size={16} />}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                  >
                    <Compass size={18} />
                    <span>Home</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/about"
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/about") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
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
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/shop") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
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
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/seller-dashboard") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
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
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/transporter-dashboard") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                    >
                      <Truck size={18} />
                      <span>Transport Portal</span>
                    </Link>
                  </li>
                )}

                {!isStandardCustomer && (
                  <>
                    <li>
                      <Link
                        to="/soil-test"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/soil-test") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                      >
                        <Sprout size={18} />
                        <span>Soil Testing</span>
                      </Link>
                    </li>

                    <li>
                      <Link
                        to="/blog"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/blog") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                      >
                        <Newspaper size={18} />
                        <span>Agronomy Blog</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/education"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/education") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                      >
                        <BookOpen size={18} />
                        <span>Learning Hub</span>
                      </Link>
                    </li>
                  </>
                )}

                {isStandardCustomer && (
                  <>
                    <li>
                      <Link
                        to="/shop?tab=cart"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${location.search.includes("tab=cart") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <ShoppingBag size={18} />
                          <span>My Cart</span>
                        </div>
                        {user.cart && user.cart.length > 0 && (
                          <span className="bg-blue-600 text-white font-extrabold text-xs px-2 py-0.5 rounded-full shrink-0">
                            {user.cart.length}
                          </span>
                        )}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/shop?tab=orders"
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${location.search.includes("tab=orders") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Clock size={18} />
                          <span>My Purchases</span>
                        </div>
                        {user.order && user.order.length > 0 && (
                          <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-105 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-extrabold text-xs px-2 py-0.5 rounded-full shrink-0">
                            {user.order.length}
                          </span>
                        )}
                      </Link>
                    </li>
                  </>
                )}

                {isAdmin && (
                  <li>
                    <Link
                      to="/customer"
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition-colors text-xs font-semibold ${isActive("/customer") ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-100 font-bold"}`}
                    >
                      <Users size={18} />
                      <span>Customer List</span>
                    </Link>
                  </li>
                )}
              </ul>

              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-4 text-xs font-semibold">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img
                          src={user.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user.username}</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{user.role?.replace("_", " ")}</span>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-700 dark:text-slate-200"
                    >
                      <UserIcon size={16} className="mr-2 text-slate-400" />
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left flex items-center px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setSidebarOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl block text-center transition-all duration-200"
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
