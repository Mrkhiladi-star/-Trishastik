import React from "react";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Sprout } from "lucide-react";

const Footer = () => {
  return (
    <footer className="glass-panel border-t border-slate-800/80 text-slate-300 py-16 mt-16 rounded-t-3xl" id="contact-us">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo & Slogan */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Sprout className="text-emerald-400" size={18} />
              </div>
              <span className="font-bold text-lg text-white">Trishastik</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering farmers across Bharat with modern soil intelligence, sustainable agri-inputs, and data-driven crop recommendations.
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 transition-all text-slate-400">
                <Facebook size={16} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 transition-all text-slate-400">
                <Twitter size={16} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 transition-all text-slate-400">
                <Instagram size={16} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 transition-all text-slate-400">
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-400">123 Green Avenue, Sitapur, Uttar Pradesh, India</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="text-slate-400">+91 87568 92991</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-emerald-400 flex-shrink-0" />
                <span className="text-slate-400">support@trishastikfarm.com</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Services</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="/soil-test" className="hover:text-emerald-400 transition-colors">Soil Nutrition Analysis</a>
              </li>
              <li>
                <a href="/shop" className="hover:text-emerald-400 transition-colors">Sustainble Input Shop</a>
              </li>
              <li>
                <a href="/education" className="hover:text-emerald-400 transition-colors">Farmer Education Portal</a>
              </li>
              <li>
                <a href="/blog" className="hover:text-emerald-400 transition-colors">AgriTech Blog & Articles</a>
              </li>
            </ul>
          </div>

          {/* Quote info */}
          <div className="space-y-4 md:col-span-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Our Mission</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              "To revolutionize farming in rural India by providing cost-effective technology tools, bridging the information gap, and enabling organic and sustainable farming protocols."
            </p>
            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] text-emerald-400 text-center font-bold tracking-wider uppercase">
              🌱 Green Bharat, Clean Bharat
            </div>
          </div>
        </div>

        <div className="text-center mt-12 text-slate-500 border-t border-slate-900 pt-6 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Trishastik Bharat Sustainable Farms. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-slate-400">Privacy Policy</a>
            <span>&middot;</span>
            <a href="#" className="hover:text-slate-400">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
