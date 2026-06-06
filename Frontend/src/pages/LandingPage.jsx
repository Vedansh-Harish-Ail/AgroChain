import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  FlaskConical,
  Coins,
  QrCode,
  ShieldCheck,
  ClipboardList,
  Link2,
  Banknote,
  ScanBarcode,
  ShieldAlert,
  Lock,
  Eye,
  CheckCircle2,
  User,
  ArrowRight,
  Globe,
  Rss,
  Sun,
  Moon,
} from 'lucide-react';

/* ── tiny animation style injected once ── */
const PulseStyle = () => (
  <style>{`
    @keyframes ac-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    .ac-pulse { animation: ac-pulse 2s cubic-bezier(.4,0,.6,1) infinite; }
    .glass-card {
      background: rgba(255,255,255,.72);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,.35);
    }
    .dark .glass-card {
      background: rgba(15,23,42,.72);
      border: 1px solid rgba(255,255,255,.08);
    }
    .cta-banner {
      background-image: radial-gradient(circle at 2px 2px, #059669 1px, transparent 0);
      background-size: 24px 24px;
      background-color: #d1fae5;
    }
    .dark .cta-banner {
      background-image: radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0);
      background-color: rgba(6, 78, 59, 0.4);
    }
    .nav-shadow { box-shadow: 0 1px 8px 0 rgba(0,0,0,.06); }
  `}</style>
);

/* ── Role cards ── */
const roles = [
  {
    cols: 'md:col-span-3 lg:col-span-4',
    Icon: Sprout,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    title: 'Farmers',
    desc: 'List your crops, record lab quality reports, and sell directly to wholesale buyers without middleman cuts.',
    cta: 'Register Your Crop',
    link: '/farmer/register',
  },
  {
    cols: 'md:col-span-3 lg:col-span-4',
    Icon: FlaskConical,
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    title: 'Testing Labs',
    desc: 'Perform chemical analyses on crop and soil samples to verify safety metrics and issue certificates.',
    cta: 'Log Test Results',
    link: '/tester/approve',
  },
  {
    cols: 'md:col-span-6 lg:col-span-4',
    Icon: Coins,
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    title: 'Buyers & Investors',
    desc: 'Purchase crop options early to fund seasonal harvests or buy certified batches directly from local farms.',
    cta: 'Find Harvests',
    link: '/finance',
  },
  {
    cols: 'md:col-span-3 lg:col-span-6',
    Icon: QrCode,
    iconBg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
    title: 'Consumers',
    desc: 'Scan QR codes on food packaging to trace the product back to its farm and view its lab certificate.',
    cta: 'Trace Your Food',
    link: '/consumer/track',
  },
  {
    cols: 'md:col-span-3 lg:col-span-6',
    Icon: ShieldCheck,
    iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    title: 'Governance',
    desc: 'Manage licensed laboratory credentials and audit validator nodes to keep the marketplace reliable.',
    cta: 'Open Admin Portal',
    link: '/admin',
  },
];

/* ── Lifecycle steps ── */
const lifecycle = [
  { Icon: ClipboardList, step: '1. Sowing & Listing', desc: 'Farmers list expected crop types and location coordinates before harvest.' },
  { Icon: FlaskConical, step: '2. Chemical Analysis', desc: 'Soil and crop purity is tested for pesticide levels by authorized labs.' },
  { Icon: Link2, step: '3. Digital Twin Log', desc: 'Laboratory certificates and batch details are signed on the public ledger.' },
  { Icon: Banknote, step: '4. Capital Funding', desc: 'Buyers purchase option contracts early, funding the farm upfront.' },
  { Icon: ScanBarcode, step: '5. Retail Traceability', desc: 'Consumers scan packaging QR codes to view chemical safety certificates.' },
];

/* ── Marketplace items ── */
const marketplaceItems = [
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoZVLXCHAlrQHznG44k9GTDVEWQkpJhdi2D2NHq4_qbuVH9qrhLmlIL_EDW7MiWSb-Pp0rGUY1Dk7SLBOf5cWpeMqDirWM3MxEOrH8HlrPkLeIrVWC3ZOesjN4eKgyXWGKQ-URNxzCCEVbTzX75_BRxcuI5pM_vN0D236j-TYQQ3lZbY1GB5OWlN1GOZtNhusj46v-ZiwSardyOxGkDze7yvVWdGlikj7fXdjCl4hxWbqJjuNghtMWmq48n3bNpdAqUtF_YqpxS3c',
    alt: 'Organic Tomatoes',
    name: 'Premium Organic Tomatoes',
    farm: 'GreenValley Farms',
    location: 'Nashik, MH',
    price: '₹40 / kg',
    sowed: 'Sown: Apr 10',
    rating: '98% Chem-Free',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPw-B3iiDUqUWe-FqFnPs-1fU6g0OIQWY8-lHcB2O-W46zyNDk2bNTe-kAEcm8wezhBpQv3w4LL-EY2X6kAHC7qnO1IvAnizEofClBIHlhkH0xElbWJkTp5ZNuNg19yMpNCBq_U1aTtr6IIrZlug_UrJ_x6GXA2UhoIXgvly3XZMEucH2Fzxg8gQwTCvG8XEByg75XZoE2w_dm1C1Ibt6SN-kq4ldeVJD6Fzs6ixrUBDBYAnTYxV5i8XmlmbPskZnUeKf1EAe78uc',
    alt: 'Basmati Rice',
    name: 'High-Yield Basmati Rice',
    farm: 'Punjab Agro Hub',
    location: 'Amritsar, PB',
    price: '₹60,000 / ton',
    sowed: 'Sown: May 02',
    rating: '99% Chem-Free',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmVnpoDcmu5hYJrEIrUVi555IGtBZL2PkjjsnNhobauMKqLVJaD1xuOvh_IOl42P-kcEeEPlb6932johAomyY_mOOAqO4dqnMhy4wquD9w_PZx5h_HxQE4lzm72cyyo05Nss_IFE1Oo1oBfGtrnLIgA_YOmZFZkU5LvYdqRrq5w482HE6-1f3pFWPa5j0ua5MJ99fIoqxIJhRZoNjzK2qL50E3gy_XVj3QlKRta3QF15FFlLdih3ozBkHW0QJzmB3qN3kVhSwKyj0',
    alt: 'Sunflower Seeds',
    name: 'Organic Sunflower Seeds',
    farm: 'HelioTerra Farms',
    location: 'Nagpur, MH',
    price: '₹35,000 / ton',
    sowed: 'Sown: Mar 20',
    rating: '97% Chem-Free',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp_M47RIRkIBAuR87atc_9Wg2mCfvqNe2l9m_Z0ozXqCKm_CtGQYraIYrp2UDBKOjG94HJTylkD9TFEv2d9CIhi9o-9WDXhEymMYGwk8-ZvNquWH1NvdJwMOaKJTqYiKKxTzsTvutit5H0Q1jH54eOkExGex9MfJyHCGyCcPKjXIKjlDdr4nUV_ySeDOHIHzRoFaU6Sqjuy9ZQvruTFJ3EtZdqmMdOqM3CGNwuOf7wHUmySifoy8spxg8AhoW7MTnCTKdu-65QOQU',
    alt: 'Arabica Coffee',
    name: 'Grade-A Arabica Beans',
    farm: 'Andean Growers',
    location: 'Chikmagalur, KA',
    price: '₹350 / kg',
    sowed: 'Sown: Feb 15',
    rating: '96% Chem-Free',
  },
];

/* ── Trust features ── */
const trustFeatures = [
  {
    Icon: ShieldAlert,
    title: 'Lab-Certified Cleanliness',
    desc: 'Every crop listed goes through soil and water chemical analysis to guarantee food quality guidelines are actually met.',
  },
  {
    Icon: Lock,
    title: 'Unalterable Crop Records',
    desc: 'Once lab reports and crop weights are signed, they cannot be backdated or modified to hide defects.',
  },
  {
    Icon: Eye,
    title: 'Direct Wholesale Access',
    desc: 'Ditching middle brokers allows buyers to support farms directly and secure crops at harvest options prices.',
  },
];

export default function LandingPage({ theme, toggleTheme }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 min-h-screen transition-colors duration-300">
      <PulseStyle />

      {/* ── Top Navbar ── */}
      <nav className={`fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 transition-all duration-300 ${scrolled ? 'nav-shadow' : ''}`}>
        <div className="flex justify-between items-center h-20 px-6 md:px-16 max-w-screen-xl mx-auto">
          <Link to="/" className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight flex items-center gap-2">
            <Sprout className="h-6 w-6" />
            AgroChain
          </Link>
          <div className="hidden md:flex gap-8">
            <a href="#marketplace" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">Marketplace</a>
            <a href="#how-it-works" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">How it Works</a>
            <a href="#roles" className="text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors font-medium">Roles</a>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors mr-2"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <Link to="/dashboard" className="bg-emerald-700 dark:bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-emerald-700 dark:text-emerald-400 text-sm font-medium hover:opacity-75 px-3 py-2 transition-opacity">
                  Login
                </Link>
                <Link to="/register" className="bg-emerald-700 dark:bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 transition-all">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-20">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-20 pb-16 bg-white dark:bg-slate-950">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-700 text-emerald-100 px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-300 ac-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider">Direct & Verified</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                From Seed to Table.<br />
                Verified on the <span className="text-emerald-700 dark:text-emerald-400">Ledger</span>.
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 max-w-xl leading-relaxed">
                AgroChain helps farmers secure upfront capital, prove lab quality standards, and connect directly with buyers through an honest, unalterable supply chain.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="bg-emerald-700 dark:bg-emerald-600 text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-700/20 dark:shadow-emerald-950/20 text-center">
                  Get Started
                </Link>
                <Link to="/consumer/track" className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-center">
                  Browse Crops
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 glass-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200/40 dark:border-slate-800/40">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqaLSTU7CuymiyJ3a3xxVhAN40oN2iAjqDE-ClMcsMXLWiJtV6Xnf0urOconhLwimioYcciy1SoC2fH9ejOCkiO9XOujffonpdEjaF-Qcg945BMpWPDd95BdzfK8XPztqrB6LCJq027jNu_KeqzX75JjqQOI5IxksxTCFpotNVynug6_Vl-S_-ccde0TZLC-_m6K7EEjF7nGYQ-uE6uRaPrEkhYvBnza3e8pz_r9MIl5vpXYyBxxOi4rjqwG66POIx44jCjtkg8lY"
                  alt="AgroChain Dashboard"
                  className="w-full h-auto"
                />
              </div>
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-100 dark:bg-emerald-950/20 rounded-full blur-3xl -z-0 opacity-60 dark:opacity-30" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-slate-100 dark:bg-slate-900/30 rounded-full blur-3xl -z-0 opacity-60 dark:opacity-30" />
            </div>
          </div>
        </section>

        {/* ── Roles Bento Grid ── */}
        <section id="roles" className="bg-slate-50 dark:bg-slate-900/60 py-20 border-y border-slate-100 dark:border-slate-900">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                Who is on AgroChain?
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Connecting farmers, laboratories, and buyers in a single transparent network.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
              {roles.map(({ cols, Icon, iconBg, title, desc, cta, link }) => (
                <Link
                  key={title}
                  to={link}
                  className={`${cols} bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all group block`}
                >
                  <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{desc}</p>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">{cta}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Verification Lifecycle ── */}
        <section id="how-it-works" className="py-20 bg-white dark:bg-slate-950">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                How It Works
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Simple, step-by-step verification process to trace crops and secure funding.
              </p>
            </div>
            <div className="relative">
              <div className="hidden lg:block absolute top-8 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {lifecycle.map(({ Icon, step, desc }) => (
                  <div key={step} className="flex flex-col items-center text-center bg-white dark:bg-slate-950 p-4 z-10">
                    <div className="w-16 h-16 rounded-full bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center mb-4 shadow-lg ring-8 ring-white dark:ring-slate-950">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">{step}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Marketplace Preview ── */}
        <section id="marketplace" className="bg-slate-100 dark:bg-slate-900/40 py-20 border-y border-slate-100 dark:border-slate-900">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                  Verified Crop Batches
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Browse laboratory-certified crop listings directly from our partner farms.
                </p>
              </div>
              <Link to="/consumer/track" className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1 mt-6 md:mt-0 hover:underline">
                View All Assets <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketplaceItems.map((item) => (
                <div key={item.name} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={item.img}
                        alt={item.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-emerald-700 dark:bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Verified</span>
                      </div>
                    </div>
                    <div className="p-5 pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">{item.rating}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.sowed}</span>
                      </div>
                      <h5 className="font-bold text-base mb-1 text-slate-900 dark:text-white">{item.name}</h5>
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <User className="h-3.5 w-3.5" />
                        {item.farm}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 pt-0">
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400 dark:text-slate-500">{item.location}</span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Transparency Showcase ── */}
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              {/* Image */}
              <div className="order-2 lg:order-1 relative">
                <div className="aspect-square bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_2KtG0Yzs68_dYHicCJbEarDPywkpPUeINAbq438Fsh0wfQ0_ktZbubNHFWEbw_Zm_vbbg2_qwnV0EzeaUhRk-4pdcHrPNi6UqxmipIKniRbnFXxhhSGcW5sqgxPpKG4kePpavVGHbPVOZKOxh_f9JetrlctmLKLydvixoabqt6qkcPcF-AahVF3zyj47nsjplZqEOhRdIZD4LR5L-p84mDwIuqdVKMi_3YE56yYisVALm2bgicUayQaj_KfJJq6CEPrRU6I17fw"
                    alt="Tracing technology"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 p-4 glass-card rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 max-w-xs shadow-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Immutable Ledger</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    TX: 0x82f...a12c verified by 12 independent testers in 4 minutes.
                  </p>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">
                  Clean Food, Proven Origins.
                </h2>
                <div className="space-y-6">
                  {trustFeatures.map(({ Icon, title, desc }) => (
                    <div key={title} className="flex gap-5">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex-shrink-0 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold mb-1 text-slate-900 dark:text-white">{title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 bg-white dark:bg-slate-950">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16">
            <div
              className="rounded-3xl p-16 text-center relative overflow-hidden cta-banner border border-transparent dark:border-slate-800"
            >
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                  Let's Build an Honest Food Chain
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
                  Connect directly with local farms, verify lab quality results, and secure wholesale agreements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/register" className="bg-emerald-700 dark:bg-emerald-600 text-white px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all text-center">
                    Get Started for Free
                  </Link>
                  <Link to="/consumer/track" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 px-8 py-3.5 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
                    Explore the Platform
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white dark:bg-slate-950 w-full py-16 border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-16 max-w-screen-xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
              <Sprout className="h-6 w-6" /> AgroChain
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
              © {new Date().getFullYear()} AgroChain Ecosystem. Global Ledger for Agricultural Integrity.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h6 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Platform</h6>
            <a href="#marketplace" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Marketplace</a>
            <a href="#how-it-works" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">How it Works</a>
            <a href="#roles" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Roles</a>
            <a href="#" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Documentation</a>
          </div>

          <div className="flex flex-col gap-3">
            <h6 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Portals</h6>
            <Link to="/farmer/register" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Farmer Portal</Link>
            <Link to="/tester/approve" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Tester Network</Link>
            <Link to="/finance" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Investor Desk</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h6 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">Compliance</h6>
            <a href="#" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Security Audit</a>
            <div className="mt-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all cursor-pointer text-slate-500 dark:text-slate-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all cursor-pointer text-slate-500 dark:text-slate-400">
                <Rss className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
