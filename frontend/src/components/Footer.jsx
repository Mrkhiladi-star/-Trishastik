import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Sprout, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 py-16 mt-16 text-left" id="contact-us">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Column 1: Logo & Description */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center">
                <Sprout className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-slate-900 dark:text-white leading-tight">Trishastik</span>
                <span className="text-[8px] text-slate-500 dark:text-slate-400 tracking-widest uppercase font-bold">Bharat Farms</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Empowering farmers across Bharat with modern soil intelligence, sustainable agri-inputs, and data-driven crop recommendations.
            </p>
            <div className="flex space-x-2 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-slate-500 dark:text-slate-400 shadow-sm">
                <Facebook size={15} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-slate-500 dark:text-slate-400 shadow-sm">
                <Twitter size={15} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-slate-500 dark:text-slate-400 shadow-sm">
                <Instagram size={15} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-slate-500 dark:text-slate-400 shadow-sm">
                <Linkedin size={15} />
              </a>
            </div>
          </div>

          {/* Column 2: Services */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Services</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/shop" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Organic Marketplace
                </Link>
              </li>
              <li>
                <Link to="/soil-test" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Soil Testing
                </Link>
              </li>
              <li>
                <Link to="/shop?category=fertilizer" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Fertilizer Store
                </Link>
              </li>
              <li>
                <Link to="/shop?category=equipment" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Equipment Rental
                </Link>
              </li>
              <li>
                <Link to="/education" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Crop Education
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Blogs
                </Link>
              </li>
              <li>
                <Link to="/transporter-dashboard" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Logistics
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Platform */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Platform</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/farmer-dashboard" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Farmer Dashboard
                </Link>
              </li>
              <li>
                <Link to="/seller-dashboard" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link to="/transporter-dashboard" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Transporter Dashboard
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Orders
                </Link>
              </li>
              <li>
                <Link to="/soil-reports" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Soil Reports
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Contact</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  123 Green Avenue,<br />
                  Sitapur, Uttar Pradesh,<br />
                  India - 261001
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">support@trishastikfarm.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-slate-500 dark:text-slate-400">+91 87568 92991</span>
              </div>
            </div>
          </div>

          {/* Column 5: Mission */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Our Mission</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
              Supporting Sustainable Agriculture through technology and innovation.
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={14} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Soil Testing</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={14} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Marketplace</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={14} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Equipment Rental</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={14} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Education</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              &copy; {new Date().getFullYear()} Trishastik Bharat Sustainable Farms. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Link to="/privacy" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
                Privacy
              </Link>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Link to="/terms" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
                Terms
              </Link>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Link to="/contact" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
                Contact
              </Link>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Link to="/support" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;