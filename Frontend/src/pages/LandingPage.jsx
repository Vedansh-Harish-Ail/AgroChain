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
    .card-dots {
      background-image: radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0);
      background-size: 16px 16px;
    }
  `}</style>
);

/* ── Role cards ── */
const roles = [
  {
    cols: 'md:col-span-3 lg:col-span-4',
    Icon: Sprout,
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30',
    glowColor: 'from-emerald-500/10 to-transparent',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    roleBadgeText: 'Production',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-500/50',
    hoverShadow: 'hover:shadow-emerald-500/5',
    title: 'Farmers',
    desc: 'List your crops, apply for safety testing, and sell directly to bulk buyers for a fair price.',
    cta: 'Start a Listing',
    link: '/farmer/register',
  },
  {
    cols: 'md:col-span-3 lg:col-span-4',
    Icon: FlaskConical,
    iconBg: 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30',
    glowColor: 'from-blue-500/10 to-transparent',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50',
    badgeText: 'text-blue-700 dark:text-blue-400',
    roleBadgeText: 'Quality Control',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-500/50',
    hoverShadow: 'hover:shadow-blue-500/5',
    title: 'Testing Labs',
    desc: 'Analyze crop and soil samples, record chemical metrics, and issue safety certificates.',
    cta: 'Log Lab Tests',
    link: '/tester/approve',
  },
  {
    cols: 'md:col-span-6 lg:col-span-4',
    Icon: Coins,
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/30',
    glowColor: 'from-amber-500/10 to-transparent',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-400',
    roleBadgeText: 'Capital',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-500/50',
    hoverShadow: 'hover:shadow-amber-500/5',
    title: 'Buyers & Investors',
    desc: 'Fund farm harvests early to secure priority contract prices and buy verified batches directly.',
    cta: 'Browse Harvests',
    link: '/finance',
  },
  {
    cols: 'md:col-span-3 lg:col-span-6',
    Icon: QrCode,
    iconBg: 'bg-teal-50 text-teal-600 border border-teal-100 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/30',
    glowColor: 'from-teal-500/10 to-transparent',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50',
    badgeText: 'text-teal-700 dark:text-teal-400',
    roleBadgeText: 'Transparency',
    hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-500/50',
    hoverShadow: 'hover:shadow-teal-500/5',
    title: 'Consumers',
    desc: 'Scan packaging QR codes to see exactly where your food grew and read its lab safety report.',
    cta: 'Trace Your Food',
    link: '/consumer/track',
  },
  {
    cols: 'md:col-span-3 lg:col-span-6',
    Icon: ShieldCheck,
    iconBg: 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/50',
    glowColor: 'from-slate-400/10 to-transparent',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    roleBadgeText: 'Network Safety',
    hoverBorder: 'hover:border-slate-300 dark:hover:border-slate-500/50',
    hoverShadow: 'hover:shadow-slate-500/5',
    title: 'Governance',
    desc: 'Verify lab credentials and approve field inspectors to keep the marketplace safe and fair.',
    cta: 'Admin Console',
    link: '/admin',
  },
];

/* ── Lifecycle steps ── */
const lifecycle = [
  { Icon: ClipboardList, step: '1. Farmer Registration', desc: 'Farmers list expected crop yields, GPS locations, land survey records, and cultivation details.' },
  { Icon: ShieldCheck, step: '2. Inspector Verification', desc: 'Government-approved field inspectors verify land deeds and perform physical or photo reviews.' },
  { Icon: FlaskConical, step: '3. Lab Certification', desc: 'Accredited laboratories test crop chemical metrics to sign safety certificates and award grades on-chain.' },
  { Icon: Banknote, step: '4. Direct Funding', desc: 'Investors propose contract pricing and fund harvests early using secure smart contract escrows.' },
  { Icon: ScanBarcode, step: '5. Consumer Tracing', desc: 'Consumers scan product QR codes to trace the complete chain of custody and chemical safety logs.' },
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
    rating: 'Grade A / Pesticide-Free',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPw-B3iiDUqUWe-FqFnPs-1fU6g0OIQWY8-lHcB2O-W46zyNDk2bNTe-kAEcm8wezhBpQv3w4LL-EY2X6kAHC7qnO1IvAnizEofClBIHlhkH0xElbWJkTp5ZNuNg19yMpNCBq_U1aTtr6IIrZlug_UrJ_x6GXA2UhoIXgvly3XZMEucH2Fzxg8gQwTCvG8XEByg75XZoE2w_dm1C1Ibt6SN-kq4ldeVJD6Fzs6ixrUBDBYAnTYxV5i8XmlmbPskZnUeKf1EAe78uc',
    alt: 'Basmati Rice',
    name: 'High-Yield Basmati Rice',
    farm: 'Punjab Agro Hub',
    location: 'Amritsar, PB',
    price: '₹60,000 / ton',
    sowed: 'Sown: May 02',
    rating: 'Grade A+ / Pesticide-Free',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmVnpoDcmu5hYJrEIrUVi555IGtBZL2PkjjsnNhobauMKqLVJaD1xuOvh_IOl42P-kcEeEPlb6932johAomyY_mOOAqO4dqnMhy4wquD9w_PZx5h_HxQE4lzm72cyyo05Nss_IFE1Oo1oBfGtrnLIgA_YOmZFZkU5LvYdqRrq5w482HE6-1f3pFWPa5j0ua5MJ99fIoqxIJhRZoNjzK2qL50E3gy_XVj3QlKRta3QF15FFlLdih3ozBkHW0QJzmB3qN3kVhSwKyj0',
    alt: 'Sunflower Seeds',
    name: 'Organic Sunflower Seeds',
    farm: 'HelioTerra Farms',
    location: 'Nagpur, MH',
    price: '₹35,000 / ton',
    sowed: 'Sown: Mar 20',
    rating: 'Grade A / Chemical-Free',
  },
  {
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp_M47RIRkIBAuR87atc_9Wg2mCfvqNe2l9m_Z0ozXqCKm_CtGQYraIYrp2UDBKOjG94HJTylkD9TFEv2d9CIhi9o-9WDXhEymMYGwk8-ZvNquWH1NvdJwMOaKJTqYiKKxTzsTvutit5H0Q1jH54eOkExGex9MfJyHCGyCcPKjXIKjlDdr4nUV_ySeDOHIHzRoFaU6Sqjuy9ZQvruTFJ3EtZdqmMdOqM3CGNwuOf7wHUmySifoy8spxg8AhoW7MTnCTKdu-65QOQU',
    alt: 'Arabica Coffee',
    name: 'Grade-A Arabica Beans',
    farm: 'Andean Growers',
    location: 'Chikmagalur, KA',
    price: '₹350 / kg',
    sowed: 'Sown: Feb 15',
    rating: 'Grade A / Premium Quality',
  },
];

/* ── Trust features ── */
const trustFeatures = [
  {
    Icon: ShieldAlert,
    title: 'Pesticide & Safety Testing',
    desc: 'No guesswork. Every batch is tested by accredited regional labs to ensure it matches strict food safety guidelines.',
  },
  {
    Icon: Lock,
    title: 'Tamper-Proof Records',
    desc: 'Once lab results and farm details are verified, they are locked on the blockchain so they cannot be altered or falsified.',
  },
  {
    Icon: Eye,
    title: 'Fair Wholesale Deals',
    desc: 'Dealing directly with farmers eliminates broker fees, ensuring lower prices for buyers and better pay for growers.',
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
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-6xl z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl transition-all duration-300 shadow-md ${scrolled ? 'nav-shadow' : ''}`}>
        <div className="flex justify-between items-center h-16 px-6 md:px-10">
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

      <main className="w-full">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-28 pb-16 bg-white dark:bg-slate-950">
          {/* Translucent Background Image Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-35 dark:opacity-50 pointer-events-none"
            style={{ backgroundImage: "url('/hero_background.png')" }}
          />
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white/70 lg:bg-gradient-to-r lg:from-white lg:via-white/92 lg:to-transparent dark:from-slate-950 dark:via-slate-950/92 dark:to-transparent pointer-events-none" />
          
          <div className="max-w-screen-xl mx-auto px-6 md:px-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ac-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Active on Localhost Node</span>
              </div>
              <h1 className="text-4xl md:text-5.5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                Sell Your Harvest.<br />
                <span className="text-emerald-600 dark:text-emerald-400">Get Funded. No Middlemen.</span>
              </h1>
              <p className="text-lg text-slate-700 dark:text-slate-200 mb-10 max-w-xl leading-relaxed font-medium">
                Farmers list certified cultivations, buyers fund harvests through secure smart contract escrows, and money releases only after independent laboratory safety check approvals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link to="/register" className="bg-emerald-700 dark:bg-emerald-600 text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-700/20 dark:shadow-emerald-950/20 text-center flex items-center justify-center gap-2">
                  <span>Start Listing Crops</span> <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/consumer/track" className="border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-900/80 px-8 py-3.5 rounded-xl text-sm font-bold transition-all text-center flex items-center justify-center gap-2">
                  <span>Browse Marketplace</span>
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Escrow Protected</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Accredited Labs Only</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Coins className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Zero Platform Fees</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 glass-card rounded-2xl overflow-hidden shadow-2xl border border-slate-200/40 dark:border-slate-800/40">
                <img
                  src="/landing_page.png"
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
                Built for the entire food community
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Bringing farmers, laboratories, and buyers together in a single open network.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
              {roles.map(({ cols, Icon, iconBg, glowColor, badgeBg, badgeText, roleBadgeText, hoverBorder, hoverShadow, title, desc, cta }) => (
                <div
                  key={title}
                  className={`${cols} relative overflow-hidden bg-white/70 dark:bg-slate-950/40 backdrop-blur-md p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between ${hoverBorder} ${hoverShadow}`}
                  style={{
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.01)',
                  }}
                >
                  {/* Hover glow background */}
                  <div className={`absolute -right-16 -top-16 w-40 h-40 rounded-full bg-gradient-to-br ${glowColor} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  {/* Subtle dot pattern background */}
                  <div className="absolute inset-0 card-dots text-slate-900/5 dark:text-white/5 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <span className={`text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full ${badgeBg} ${badgeText}`}>
                        {roleBadgeText}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white tracking-tight">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors uppercase tracking-widest">
                    <span>{cta}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Verification Lifecycle ── */}
        <section id="how-it-works" className="py-20 bg-white dark:bg-slate-950">
          <div className="max-w-screen-xl mx-auto px-6 md:px-16">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                How it works
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                A simple, certified flow that tracks crops from the field to your shopping cart.
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
                  Certified Crop Batches
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                  Shop certified, pesticide-tested crop listings straight from local partner farms.
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
                    <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">On-Chain Verification</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Certificate recorded permanently. Verified by regional inspectors and testing laboratories.
                  </p>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">
                  Know exactly where your food comes from
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
                  Ready to source food differently?
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
                  Partner directly with local farms, inspect laboratory chemical safety reports, and agree on fair pricing.
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
