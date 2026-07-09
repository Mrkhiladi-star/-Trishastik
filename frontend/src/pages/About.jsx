import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Sprout,
  Users,
  ShieldCheck,
  Heart,
  ShoppingBag,
  FlaskConical,
  Tractor,
  BookOpen,
  Truck,
  Store,
  Package,
  FileText,
  CheckCircle,
  ArrowRight,
  MapPin,
  UserCheck,
  Eye,
  Target,
  BadgeCheck,
  ShoppingCart,
  UserPlus,
  Droplets,
  ClipboardCheck,
  User,
  Settings,
  Monitor,
  Zap,
  Layers,
  Award,
  Clock,
  TrendingUp,
  Leaf,
  Recycle,
  Trees,
  GraduationCap,
  Briefcase,
  Globe,
  Truck as TruckIcon,
  Package as PackageIcon,
  Store as StoreIcon,
  Users as UsersIcon,
  Clipboard,
  Microscope,
  TestTube,
  FileCheck,
  BarChart,
  Calendar,
  Download,
  PenTool,
  PlusCircle,
  Edit,
  Trash2,
  CheckSquare,
  GitBranch,
  Building2
} from "lucide-react";

const About = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section - Full Width */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-3 py-1.5 rounded-full">
                <Sprout className="text-blue-600 dark:text-blue-400" size={14} />
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">About Us</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                An AgriTech Platform for
                <span className="text-blue-600 dark:text-blue-400 block">Bharat's Farmers</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Trishastik Bharat Sustainable Farms connects farmers, sellers, transporters, and field agents in one ecosystem. From soil testing to equipment rental, everything a farmer needs is available on one platform.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm"
                >
                  <UserPlus size={16} />
                  <span>Join the Platform</span>
                </Link>
                <Link
                  to="/login"
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <span>Explore Services</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 p-6 rounded-2xl text-center">
                  <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">6+</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">User Roles</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 p-6 rounded-2xl text-center">
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">4+</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Services</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 p-6 rounded-2xl text-center">
                  <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">100%</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Organic Certified</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 p-6 rounded-2xl text-center">
                  <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">24/7</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Platform Access</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Are - Light Background */}
      <section className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Who We Are
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-4 mb-6"></div>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
              Trishastik Bharat Sustainable Farms is a digital platform built for Indian farmers and the agricultural ecosystem. We are not just an e-commerce website. We are an integrated system that connects farmers, fertilizer sellers, equipment sellers, transporters, field agents, and administrators in one place.
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mt-4">
              Our goal is to make farming more transparent, efficient, and accessible. Whether a farmer needs to sell organic produce, buy fertilizers, rent equipment, or get a soil test done, everything is available through a single login.
            </p>
          </div>
        </div>
      </section>

      {/* Why We Built This - White Background */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why We Built This Platform
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Indian farmers face multiple challenges — fragmented markets, lack of access to quality inputs, expensive equipment, and limited information. We built this platform to solve these problems.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Direct Access</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                Farmers can sell directly to customers and buy from other farmers. No middlemen, no commissions.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Droplets size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Soil Intelligence</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                Free soil testing through government laboratories. Farmers get reports and fertilizer recommendations.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Tractor size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Affordable Equipment</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                Rent equipment for short periods instead of buying. Reduces the financial burden on small farmers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services - Light Background */}
      <section id="services" className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Our Services
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              The platform offers a complete set of services for the agricultural community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Organic Marketplace</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Farmers list organic products directly. Customers buy fresh produce. Farmers can also purchase from other farmers.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <FlaskConical size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Free Soil Testing</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Farmers request soil tests. Field agents collect samples. Government laboratories test and upload reports.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <Store size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Fertilizer Store</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Verified sellers list fertilizers and crop protection products. Farmers can order based on soil test recommendations.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <Tractor size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Equipment Rental</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Farmers can rent agricultural equipment for short periods. Reduces the need for expensive purchases.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <BookOpen size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Crop Education</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Detailed educational modules on organic farming for different crops. Created and managed by the admin.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400">
                  <Truck size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Smart Logistics</h3>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                Transporters receive delivery requests automatically. The system selects the nearest transporter with the lowest cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Soil Testing Works - White Background */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Soil Testing Works
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              A simple workflow that connects farmers to government laboratories through field agents.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-900/50 transform -translate-x-1/2 hidden md:block"></div>
            <div className="space-y-8">
              <div className="relative flex flex-col md:flex-row items-start md:items-center">
                <div className="md:w-1/2 md:pr-12 text-right hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-end space-x-3">
                      <div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">Step 1</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Farmer Request</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Farmer submits a soil testing request through the dashboard.</p>
                      </div>
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <User size={20} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 md:pl-12">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl md:hidden">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <User size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">Step 1</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">Farmer Request</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Farmer submits a soil testing request through the dashboard.</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">Step 1</span>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-2">Farmer Request</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Farmer submits a soil testing request through the dashboard.</p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center">
                <div className="md:w-1/2 md:pr-12">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Step 2</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">Admin Review</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin reviews the request and assigns a government lab and field agent.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 md:pl-12 hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-end space-x-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Step 2</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-right">Admin Review</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-right">Admin reviews the request and assigns a government lab and field agent.</p>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Building2 size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center">
                <div className="md:w-1/2 md:pr-12 text-right hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-end space-x-3">
                      <div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">Step 3</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Agent Collects Sample</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Field agent visits the farm, collects soil samples, and submits to the assigned lab.</p>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <MapPin size={20} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 md:pl-12">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl md:hidden">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">Step 3</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">Agent Collects Sample</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Field agent visits the farm, collects soil samples, and submits to the assigned lab.</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full">Step 3</span>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-2">Agent Collects Sample</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Field agent visits the farm, collects soil samples, and submits to the assigned lab.</p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center">
                <div className="md:w-1/2 md:pr-12">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400 flex-shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full">Step 4</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">Agent Uploads Report</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Agent receives the report from the lab and uploads the PDF to the portal.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 md:pl-12 hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-end space-x-3">
                      <div>
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-3 py-1 rounded-full">Step 4</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-right">Agent Uploads Report</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-right">Agent receives the report from the lab and uploads the PDF to the portal.</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400 flex-shrink-0">
                        <FileText size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center">
                <div className="md:w-1/2 md:pr-12 text-right hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-end space-x-3">
                      <div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full">Step 5</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2">Admin Adds Suggestions</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin adds fertilizer suggestions and approves the report for final publishing.</p>
                      </div>
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 flex-shrink-0">
                        <PenTool size={20} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 md:pl-12">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl md:hidden">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400 flex-shrink-0">
                        <PenTool size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full">Step 5</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">Admin Adds Suggestions</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin adds fertilizer suggestions and approves the report for final publishing.</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full">Step 5</span>
                    <h4 className="font-bold text-slate-900 dark:text-white mt-2">Admin Adds Suggestions</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Admin adds fertilizer suggestions and approves the report for final publishing.</p>
                  </div>
                </div>
              </div>

              <div className="relative flex flex-col md:flex-row items-start md:items-center">
                <div className="md:w-1/2 md:pr-12">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Monitor size={20} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Step 6</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-1">Report in Farmer Dashboard</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">The final approved report with suggestions appears on the farmer's dashboard.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 md:pl-12 hidden md:block">
                  <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl border-emerald-200 dark:border-emerald-900/50">
                    <div className="flex items-center justify-end space-x-3">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">Step 6</span>
                        <h4 className="font-bold text-slate-900 dark:text-white mt-2 text-right">Report in Farmer Dashboard</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-right">The final approved report with suggestions appears on the farmer's dashboard.</p>
                      </div>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                        <Monitor size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Marketplace Works - Light Background */}
      <section className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Marketplace Works
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              A direct marketplace where farmers sell and buy organic products without middlemen.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Farmers as Sellers</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Farmers list their organic produce directly on the platform. They set their own prices and manage their inventory.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Customers Buy Direct</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Customers purchase fresh organic products directly from farmers. The experience is similar to other e-commerce platforms.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Farmers as Buyers</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Farmers can also purchase products from other farmers. The ecosystem is open for all farmers to buy and sell.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg">What's Available</h4>
              <ul className="mt-4 space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Fresh organic grains, vegetables, and produce</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Fertilizers and crop protection medicines from verified sellers</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Agricultural equipment for purchase</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-slate-600 dark:text-slate-300 text-sm">Equipment available for rent</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How Equipment Rental Works - White Background */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Equipment Rental Works
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Equipment sellers list their machines. Farmers can rent them for short periods.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Store size={24} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mt-4">List Equipment</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Equipment sellers list their machines with rental rates and availability.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Tractor size={24} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mt-4">Rent Equipment</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Farmers browse and rent equipment for specific periods.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Truck size={24} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mt-4">Delivery & Return</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Equipment is delivered to the farmer's location. Return request goes to the owner.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <CheckCircle size={24} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mt-4">Complete Rental</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Owner accepts return and completes the rental cycle.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How Logistics Works - Light Background */}
      <section className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Logistics Works
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              Automatic delivery request assignment based on location and cost.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <ShoppingBag size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Order Placed</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                When a customer buys a product or a farmer rents equipment, a transportation request is created automatically.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Truck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Automatic Assignment</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                The system finds the nearest transporter with the lowest cost per km for that route and sends the request.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <GitBranch size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Auto-Fallback</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                If a transporter rejects the request, it automatically goes to the next nearest transporter with the lowest cost.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Use This Platform - White Background */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Who Can Use This Platform
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              The platform is designed for every stakeholder in the agricultural ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <User size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Farmers</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Sell organic products</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Buy from other farmers</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Request free soil testing</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Learn organic farming</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Rent equipment</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Store size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Sellers</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Fertilizer sellers</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Equipment sellers</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>List and manage products</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <Truck size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Transporters</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Accept delivery requests</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Automatic request assignment</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Nearest & lowest cost selection</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <UserCheck size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Field Agents</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Collect soil samples from farms</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Submit samples to government labs</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Upload lab reports to portal</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-600 dark:text-rose-400">
                  <Settings size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Admin</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Manage users and products</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Approve soil reports</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Manage blogs and education modules</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Add new products and manage listings</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Customers</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Buy fresh organic products</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                  <CheckCircle size={12} className="text-emerald-600" />
                  <span>Support local farmers directly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision - Light Background */}
      <section className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <Target size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Our Mission</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                To make farming accessible, transparent, and profitable for every farmer in India. We provide the tools and connections farmers need to grow better and earn more.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Eye size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Our Vision</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                A future where every farmer has access to soil intelligence, quality inputs, affordable equipment, and direct market access — all through a single digital platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - White Background */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Choose This Platform
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">One Platform</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                Everything a farmer needs — soil testing, marketplace, equipment, education — all in one place.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <BadgeCheck size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Verified & Trusted</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                All sellers are verified. Soil reports come from government laboratories. Products are organic certified.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Layers size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Integrated Ecosystem</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mt-2">
                Farmers, sellers, transporters, and agents work together. Everyone benefits from the same system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Watch Our Story - Light Background */}
      <section className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Watch Our Story
            </h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-4 mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              See how the platform works and how it helps farmers across India.
            </p>
          </div>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950">
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/wougJaN_Ha0?si=lN7RVmwTcM0FuV_P"
              title="Trishastik Story"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      {/* Final Call To Action - White Background */}
      <section className="bg-white dark:bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-12 rounded-3xl shadow-sm">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-4 max-w-xl mx-auto">
              Join the platform today. Whether you're a farmer, seller, transporter, or customer — there's a place for you here.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm"
              >
                <UserPlus size={16} />
                <span>Create Account</span>
              </Link>
              <Link
                to="/shop"
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-white font-bold px-8 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <ShoppingBag size={16} />
                <span>Visit Marketplace</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;