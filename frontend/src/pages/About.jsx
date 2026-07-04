import React from "react";
import { Sprout, Users, ShieldCheck, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-[80vh] py-8 animate-fade-in-up">
      <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-800/80 max-w-4xl mx-auto space-y-12">

        {/* Title */}
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <Sprout className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Our Mission & Vision</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-500 to-green-600 mx-auto rounded-full"></div>
        </div>

        {/* Description paragraphs */}
        <div className="space-y-6 text-sm sm:text-base text-slate-300 leading-relaxed text-justify">
          <p>
            At <strong className="text-emerald-400">Trishastik Bharat Sustainable Farms</strong>, we are passionate about creating a healthier, greener future for our community and the environment. Our mission is to promote sustainable farming practices that not only provide fresh, organic produce but also preserve the earth for future generations. We believe in the power of nature to nourish, heal, and sustain, and we work every day to cultivate the best organic products, grown with care and respect for the environment.
          </p>

          <p>
            Our journey begins with the farmers. By empowering local farmers with knowledge and tools to implement sustainable farming techniques, we help them improve their yields, reduce dependency on harmful chemicals, and create more resilient crops. In return, we build a healthier ecosystem, promote biodiversity, and contribute to the overall well-being of the community. Trishastik Bharat Sustainable Farms isn't just a business; it's a movement towards a more sustainable and harmonious world.
          </p>

          <p>
            We take pride in offering a wide range of organic products that are not only good for you but are also grown in ways that protect and regenerate the land. When you shop with us, you’re not just supporting a farm – you’re investing in the future of sustainable agriculture and a better world for all.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Users size={20} />
            </div>
            <h3 className="font-bold text-white text-sm">Empowering Kisans</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Providing local communities with diagnostic testing kits and agronomist support.</p>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-white text-sm">100% Certified</h3>
            <p className="text-xs text-slate-400 leading-relaxed">All products and recommendations comply with organic and natural farming standards.</p>
          </div>

          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <Heart size={20} />
            </div>
            <h3 className="font-bold text-white text-sm">Ecological Care</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Restoring soil microbiological carbon layers through regenerative protocols.</p>
          </div>
        </div>

        {/* Watch Our Story Video Section */}
        <div className="border-t border-slate-800/80 pt-10 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Watch Our Story</h2>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              See how Trishastik sustainable technology and Grok-AI help farmers increase crop yield and restore soil health.
            </p>
          </div>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-850 bg-slate-950">
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

      </div>
    </div>
  );
};

export default About;
