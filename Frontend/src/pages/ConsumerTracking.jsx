import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search, ShieldCheck, Star, Award, CheckCircle2,
  ChevronRight, MessageSquare, Plus, Calendar, MapPin,
  Coins, Activity, FileText, UserCheck, History, Sparkles,
  AlertCircle, Filter, ArrowLeft, Loader2, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function ConsumerTracking() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Navigation state: 'explorer', 'profile', 'details'
  const [view, setView] = useState('explorer');

  // Directory Data
  const [farmersList, setFarmersList] = useState([]);
  const [filteredFarmers, setFilteredFarmers] = useState([]);

  // Selection states
  const [selectedFarmer, setSelectedFarmer] = useState(null); // { profile, crops }
  const [selectedCrop, setSelectedCrop] = useState(null); // Farmer crop entry
  const [selectedCropUpdates, setSelectedCropUpdates] = useState([]);

  // Verification details
  const [product, setProduct] = useState(null); // matching Product lot if exists
  const [credibility, setCredibility] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [investments, setInvestments] = useState([]);

  // Search/Filter states
  const [filterLocation, setFilterLocation] = useState('');
  const [filterFarmingType, setFilterFarmingType] = useState('');
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Rating form states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [reliability, setReliability] = useState('5');
  const [quality, setQuality] = useState('5');
  const [satisfaction, setSatisfaction] = useState('5');
  const [comment, setComment] = useState('');

  // Loading/Error states
  const [loading, setLoading] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState('');

  const getPhotosList = (evidencePhotos) => {
    if (!evidencePhotos) return [];
    try {
      const parsed = JSON.parse(evidencePhotos);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (typeof evidencePhotos === 'string') {
        return evidencePhotos.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const getPhotoName = (url) => {
    const parts = url.split('/');
    const rawFilename = parts[parts.length - 1];
    const underscoreIndex = rawFilename.indexOf('_');
    if (underscoreIndex !== -1 && underscoreIndex === 32) {
      return rawFilename.substring(underscoreIndex + 1);
    }
    return rawFilename;
  };


  // 1. Initial Load of Farmer Directory
  useEffect(() => {
    fetchFarmers();
  }, []);

  const fetchFarmers = async () => {
    setLoadingList(true);
    setError('');
    try {
      const res = await axios.get('/api/farmer/profiles');
      setFarmersList(res.data);
      setFilteredFarmers(res.data);
    } catch (err) {
      console.error("Error fetching farmers list:", err);
      setError("Failed to load farmer profiles directory.");
    } finally {
      setLoadingList(false);
    }
  };

  // 2. Client-side search and filters
  useEffect(() => {
    let result = farmersList;

    if (searchQuery) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterLocation) {
      result = result.filter(f =>
        f.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }
    if (filterFarmingType) {
      result = result.filter(f =>
        f.farming_type.toLowerCase() === filterFarmingType.toLowerCase()
      );
    }
    if (filterVerifiedOnly) {
      result = result.filter(f => f.is_approved);
    }

    setFilteredFarmers(result);
  }, [searchQuery, filterLocation, filterFarmingType, filterVerifiedOnly, farmersList]);

  // 3. Selection Actions
  const handleSelectFarmer = async (farmerUserId) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`/api/farmer/profile/${farmerUserId}`);
      setSelectedFarmer(res.data);
      setView('profile');
    } catch (err) {
      console.error(err);
      setError('Failed to load farmer profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCrop = async (crop) => {
    setError('');
    setLoading(true);
    setSelectedCrop(crop);
    setProduct(null);
    setSelectedCropUpdates([]);
    setInvestments([]);
    setCredibility(null);
    setReviews([]);

    try {
      // Fetch Product Lot from DB
      try {
        const productsRes = await axios.get('/api/product/all');
        const matched = productsRes.data.find(p => p.farmer_id === crop.id);
        if (matched) {
          setProduct(matched);
        }
      } catch (err) {
        console.warn('Matching lot load failed', err);
      }

      // Fetch Crop Milestones Timeline
      try {
        const updatesRes = await axios.get(`/api/farmer/crop-updates/${crop.id}`);
        setSelectedCropUpdates(updatesRes.data);
      } catch (err) {
        console.warn('Crop progress updates failed', err);
      }

      // Fetch Investments
      try {
        const invRes = await axios.get(`/api/finance/farmer-investments/${crop.id}`);
        setInvestments(invRes.data);
      } catch (err) {
        console.warn('Investments load failed', err);
      }

      // Fetch ratings & reviews
      try {
        const credRes = await axios.get(`/api/rating/farmer/${crop.id}`);
        setCredibility(credRes.data);
        const reviewRes = await axios.get(`/api/rating/farmer/${crop.id}/reviews`);
        setReviews(reviewRes.data);
      } catch (err) {
        console.warn('Ratings load failed', err);
      }

      setView('details');
    } catch (err) {
      console.error(err);
      setError('Failed to load crop transparency details.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit ratings
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCrop || !product) return;
    setError('');
    setLoadingRating(true);

    try {
      let txHash = null;
      let blockNumber = null;

      // Only attempt blockchain transaction if wallet is connected
      if (isConnected) {
        const tx = await contracts.ratingSystem.addRating(
          selectedCrop.id,
          product.lot_number,
          parseInt(reliability),
          parseInt(quality),
          parseInt(satisfaction),
          comment
        );

        const receipt = await tx.wait();
        blockNumber = receipt.blockNumber;
        txHash = tx.hash;

        await axios.post('/api/explorer/log-tx', {
          tx_hash: txHash,
          block_number: blockNumber,
          from_address: tx.from,
          to_address: tx.to,
          amount: 0,
          method_name: 'addRating',
          event_data: JSON.stringify({
            farmerId: selectedCrop.id,
            lotNumber: product.lot_number,
            reliability,
            quality,
            satisfaction
          })
        });
      }

      await axios.post('/api/rating/add', {
        farmer_id: selectedCrop.id,
        lot_number: product.lot_number,
        reliability: parseInt(reliability),
        product_quality: parseInt(quality),
        delivery_satisfaction: parseInt(satisfaction),
        comment,
        tx_hash: txHash,
        block_number: blockNumber
      });

      setLoadingRating(false);
      if (txHash) {
        showToast('Review recorded successfully on blockchain!', 'success');
      } else {
        showToast('Review recorded successfully in database!', 'success');
      }
      setShowRatingForm(false);

      const credRes = await axios.get(`/api/rating/farmer/${selectedCrop.id}`);
      setCredibility(credRes.data);
      const reviewRes = await axios.get(`/api/rating/farmer/${selectedCrop.id}/reviews`);
      setReviews(reviewRes.data);
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Rating submission failed. Verify MetaMask connection.');
      setLoadingRating(false);
    }
  };

  const getBadgeColorClass = (color) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-250 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 border-indigo-250 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-900';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-250 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800';
    }
  };

  // Investment Calculations
  const totalFundingWei = investments.reduce((sum, inv) => sum + BigInt(inv.amount), BigInt(0));
  const totalFundingEth = parseFloat(ethers.formatEther(totalFundingWei)).toFixed(4);
  const targetPriceEth = product ? parseFloat(ethers.formatEther(product.price.toString())) : 0;
  const fundingPercentage = targetPriceEth > 0 ? Math.min(Math.round((parseFloat(totalFundingEth) / targetPriceEth) * 100), 100) : 0;

  return (
    <div className="space-y-8 py-6 max-w-full mx-auto px-4 sm:px-6 lg:px-8">

      {/* ----------------- VIEW 1: FARM EXPLORER ----------------- */}
      {view === 'explorer' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" /> Immutable Supply Chain Directory
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                AgriBlock Discovery Portal
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Browse registered farms, verify agricultural quality inspects, trace crop timelines, and review decentralized ratings.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid md:grid-cols-4 gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-850 dark:bg-slate-900">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search farm or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Filter by Location (e.g. Pune)..."
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <select
                value={filterFarmingType}
                onChange={(e) => setFilterFarmingType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-xs dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              >
                <option value="">All Cultivation Methods</option>
                <option value="Organic">Organic Farming</option>
                <option value="Non-Organic">Standard Farming</option>
              </select>
            </div>

            <div className="flex items-center justify-end">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={filterVerifiedOnly}
                  onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 dark:border-slate-800 dark:bg-slate-950"
                />
                Verified Farms Only
              </label>
            </div>
          </div>

          {/* Directory Listings */}
          {loadingList ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              No registered farmers matching selection filters found.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFarmers.map((f) => (
                <div
                  key={f.id}
                  onClick={() => handleSelectFarmer(f.id)}
                  className="group cursor-pointer border border-slate-200 hover:border-emerald-350 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 dark:border-slate-850 dark:bg-slate-900"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-950 dark:text-white group-hover:text-emerald-600 transition">
                          {f.name}
                        </h4>
                        {f.is_approved && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-450">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-500" /> {f.location}
                      </p>

                      {/* Overall Rating Stars */}
                      <div className="flex items-center gap-2 mt-1">
                        {f.average_rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5 text-amber-500">
                              {Array.from({ length: Math.round(f.average_rating) }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                              ))}
                              {Array.from({ length: 5 - Math.round(f.average_rating) }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-slate-205 dark:text-slate-700" />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {f.average_rating} ({f.rating_count})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-405 italic">No ratings</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      ID: #{f.id}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Farming: <strong className="text-slate-800 dark:text-slate-200">{f.farming_type}</strong></span>
                    <span className="text-emerald-600 font-bold">{f.crop_count} Listed Crops &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ----------------- VIEW 2: FARMER PROFILE ----------------- */}
      {view === 'profile' && selectedFarmer && (
        <div className="space-y-8">
          {/* Back button */}
          <button
            onClick={() => setView('explorer')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-650 hover:text-emerald-600 dark:text-slate-350 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Farm Directory
          </button>

          {/* Profile Header */}
          <div className="border border-slate-200 rounded-3xl bg-white p-8 shadow-md dark:border-slate-850 dark:bg-slate-900 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {selectedFarmer.profile.name}
                  </h2>
                  {selectedFarmer.profile.is_approved && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <ShieldCheck className="h-4 w-4" /> Verified Producer
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-rose-500" /> {selectedFarmer.profile.location} | Method: {selectedFarmer.profile.farming_type}
                </p>
              </div>

              {selectedFarmer.profile.wallet_address && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                    Farmer Wallet Address
                  </span>
                  <code className="text-xs text-slate-800 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200/50 dark:border-slate-800 block mt-1">
                    {selectedFarmer.profile.wallet_address
                      ? `${selectedFarmer.profile.wallet_address.substring(0, 6)}...${selectedFarmer.profile.wallet_address.slice(-4)}`
                      : ''}
                  </code>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
                Registered producer within the AgriBlock supply chain. All crops listed below undergo third-party laboratory verification before harvest certificate creation, ensuring absolute transparency.
              </p>
            </div>
          </div>

          {/* Listed Crops */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" /> Listed Crops & Cultivations
            </h3>

            {selectedFarmer.crops.length === 0 ? (
              <p className="text-sm text-slate-500 py-8">No crops listed for this farmer yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedFarmer.crops.map((crop) => (
                  <div
                    key={crop.id}
                    onClick={() => handleSelectCrop(crop)}
                    className="border border-slate-200 hover:border-emerald-350 bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer dark:border-slate-850 dark:bg-slate-900 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg text-slate-950 dark:text-white">
                        {crop.crop_type}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${crop.is_approved
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450'
                        }`}>
                        {crop.is_approved ? 'Verified Crop' : 'Inspection Pending'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 font-medium">
                      <p>Expected Yield: <span className="text-slate-800 dark:text-slate-200">{crop.expected_yield} kg</span></p>
                      <p>Cultivation Date: <span className="text-slate-800 dark:text-slate-200">{new Date(crop.cultivation_date).toLocaleDateString()}</span></p>
                    </div>

                    {/* Ratings on crop card */}
                    <div className="flex items-center gap-1 mt-2">
                      {crop.average_rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: Math.round(crop.average_rating) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                            ))}
                            {Array.from({ length: 5 - Math.round(crop.average_rating) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 text-slate-205 dark:text-slate-800" />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {crop.average_rating} ({crop.rating_count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-405 italic">No ratings</span>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-emerald-600 font-bold">
                      <span>View Details &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- VIEW 3: CROP DETAILS (MOST IMPORTANT) ----------------- */}
      {view === 'details' && selectedCrop && (
        <div className="space-y-8">
          {/* Back button */}
          <button
            onClick={() => setView('profile')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-650 hover:text-emerald-600 dark:text-slate-350 dark:hover:text-emerald-400 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Farmer Profile
          </button>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left Content (Span 2) */}
            <div className="lg:col-span-2 space-y-8">

              {selectedCrop.verification_status !== 'VERIFIED' ? (
                <div className="rounded-2xl bg-rose-50/50 border border-rose-100 p-5 dark:bg-rose-950/20 dark:border-rose-900/30 flex gap-3 text-left">
                  <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-450 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-rose-900 dark:text-rose-205">Unverified Crop Warning</p>
                    <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed font-medium">
                      This crop listing has not been verified by agricultural quality authorities yet. Capital investments or purchases are not recommended until it has been inspected and locked on the blockchain.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-50/55 border border-emerald-100 p-5 dark:bg-emerald-950/20 dark:border-emerald-900/30 flex gap-3 text-left">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Quality Verified & On-Chain Anchored</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                      This crop listing has been verified on-site by certified inspectors. All land survey details, GPS coordinates, and biochem results are signed and permanently stored on the ledger.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 1: Crop Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-5">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Active Cultivation Record
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-6 w-6 text-emerald-600" /> {selectedCrop.crop_type}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${selectedCrop.verification_status === 'VERIFIED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900'
                      : selectedCrop.verification_status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900'
                        : 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-450 dark:border-amber-900'
                    }`}>
                    {selectedCrop.verification_status === 'VERIFIED'
                      ? 'Verified & On-Chain'
                      : selectedCrop.verification_status === 'REJECTED'
                        ? 'Rejected by Inspector'
                        : 'Inspection Pending'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Expected Yield</span>
                    <p className="font-semibold text-slate-850 dark:text-slate-200">{selectedCrop.expected_yield} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Cultivation Date</span>
                    <p className="font-semibold text-slate-850 dark:text-slate-200">
                      {new Date(selectedCrop.cultivation_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Farming Method</span>
                    <p className="font-semibold text-slate-850 dark:text-slate-200">{selectedCrop.farming_type}</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Farmer Verification */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-md flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" /> Farmer Ledger Credentials
                  </h4>
                  <span className="text-xs font-semibold text-slate-400">ID: #{selectedCrop.id}</span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block">Producer Name</span>
                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {selectedCrop.farmer_name || 'Rajesh Patel'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Farm Location</span>
                    <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-rose-500" /> {selectedCrop.farm_location}
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Inspector Verification */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-6">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-md flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" /> Agricultural Inspector Verification
                  </h4>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block">Assigned Inspector</span>
                      <p className="font-bold text-slate-950 dark:text-white mt-0.5">
                        {selectedCrop.assigned_inspector_name || 'Assigned Field Inspector'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Land Survey Number</span>
                      <p className="font-mono font-semibold text-slate-950 dark:text-white mt-0.5">
                        {selectedCrop.land_survey_no || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">GPS Coordinates</span>
                      <p className="font-mono font-semibold text-slate-950 dark:text-white mt-0.5 flex items-center gap-1.5">
                        {selectedCrop.gps_latitude ? `Lat: ${selectedCrop.gps_latitude}, Lng: ${selectedCrop.gps_longitude}` : 'N/A'}
                        {selectedCrop.gps_latitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${selectedCrop.gps_latitude},${selectedCrop.gps_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5"
                          >
                            <MapPin className="h-3 w-3" /> View Map <ExternalLink className="h-2 w-2" />
                          </a>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Inspection Approval Timestamp</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedCrop.verification_date
                          ? new Date(selectedCrop.verification_date).toLocaleString()
                          : 'Review Pending'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-400 block">Inspector remarks / field notes</span>
                      <p className="italic text-slate-650 dark:text-slate-400 bg-emerald-50/20 border border-emerald-100/50 p-3 rounded-lg dark:bg-slate-950 dark:border-slate-800">
                        {selectedCrop.tester_remarks
                          ? `"${selectedCrop.tester_remarks}"`
                          : '"Awaiting initial on-site testing logs and verification parameters."'}
                      </p>
                    </div>
                  </div>

                  {getPhotosList(selectedCrop.evidence_photos).length > 0 && (
                    <div className="sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block mb-2 font-medium">Submitted Field Evidence</span>
                      <div className="grid grid-cols-4 gap-2">
                        {getPhotosList(selectedCrop.evidence_photos).map((url, i) => (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            key={i}
                            className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 aspect-square hover:opacity-80 transition block"
                          >
                            <img src={url} alt="Field Evidence" className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-[1px] px-2 py-1 text-[9px] text-white font-medium truncate select-none">
                              {getPhotoName(url)}
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3.5: Laboratory Quality Certification (Only if Product lot is approved/certified) */}
              {product && product.certification_status === 'APPROVED' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-md flex items-center gap-2">
                      <Award className="h-5 w-5 text-emerald-600" /> Laboratory Quality Certification
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 block">Product Lot Number</span>
                        <p className="font-bold font-mono text-emerald-600 dark:text-emerald-450 text-sm mt-0.5">
                          #{product.lot_number}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Quality Grade</span>
                        <p className="font-bold text-slate-950 dark:text-white text-sm mt-0.5">
                          {product.quality_grade || 'Grade A+'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Certified Base Price</span>
                        <p className="font-semibold text-slate-850 dark:text-slate-200 mt-0.5">
                          {ethers.formatEther(product.price.toString())} ETH per unit
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 block">Test Certification Date</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {new Date(product.test_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Batch Expiry Date</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {new Date(product.expiry_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      </div>
                      {product.tester_address && (
                        <div>
                          <span className="text-slate-400 block">Authorized Lab Wallet</span>
                          <code className="text-[10px] font-mono text-slate-700 dark:text-slate-300">
                            {product.tester_address}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: Partnership & Funding Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-855 dark:bg-slate-900 space-y-5">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-md flex items-center gap-2">
                    <Coins className="h-5 w-5 text-emerald-600" /> Partnership & Funding Status
                  </h4>
                  {investments.some(inv => inv.status === 'ACCEPTED') ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 uppercase tracking-wider">
                      Funded & Partnered
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 uppercase tracking-wider">
                      Open for Proposals
                    </span>
                  )}
                </div>

                {investments.some(inv => inv.status === 'ACCEPTED') ? (
                  (() => {
                    const acceptedLoi = investments.find(inv => inv.status === 'ACCEPTED');
                    return (
                      <div className="space-y-4 text-xs">
                        <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Investor Partner</span>
                            <span className="font-bold text-slate-900 dark:text-white">{acceptedLoi.investor_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Funding Capital</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Rs. {acceptedLoi.amount.toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Returns Share</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{acceptedLoi.profit_percentage}% yield margin</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Agreement Date</span>
                            <span className="font-mono">{new Date(acceptedLoi.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl dark:bg-slate-950 dark:border-slate-800 leading-relaxed text-[11px]">
                          <p className="text-slate-650 dark:text-slate-400"><strong>Mutual Terms:</strong> "{acceptedLoi.terms}"</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="space-y-4 text-xs">
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      This certified crop lot is open for micro-finance investments. Verified partners can submit custom profit margin proposals and Letter of Intents (LOI) to fund labor, seeds, and organic fertilizers.
                    </p>

                    {user?.role !== 'INVESTOR' && (
                      <div className="p-3 bg-amber-50 border border-amber-100 text-amber-850 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 rounded-xl leading-relaxed text-[11px] flex gap-2 animate-in fade-in">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                        <span>Only registered investors can submit partnership proposals or fund crop lots.</span>
                      </div>
                    )}

                    {product && product.certification_status === 'APPROVED' && (
                      <div className="pt-2">
                        <button
                          onClick={() => navigate('/finance', { state: { selectLot: product.lot_number } })}
                          className="w-full flex justify-center items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3 text-xs font-bold transition shadow-md shadow-emerald-600/10"
                        >
                          <Coins className="h-4 w-4" />
                          {user?.role === 'INVESTOR'
                            ? 'Submit Letter of Intent / Propose Partnership'
                            : 'View Funding Marketplace Details'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Feedback list */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-6">
                <h4 className="font-bold text-slate-900 dark:text-white text-md flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" /> Consumer Feedback Logs
                </h4>

                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No reviews submitted for this crop yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{review.consumer_name}</p>
                            <p className="text-[10px] text-slate-400">Lot Ref: {review.lot_number}</p>
                          </div>
                          <div className="flex gap-0.5 text-amber-500">
                            {Array.from({ length: Math.round((review.reliability + review.product_quality + review.delivery_satisfaction) / 3) }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-650 dark:text-slate-400">{review.comment}</p>
                        {review.tx_hash && (
                          <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500">On-Chain Tx: {review.tx_hash}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Content (Span 1) */}
            <div className="space-y-8">

              {/* SECTION 5: Crop Journey Timeline */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-5">
                <h3 className="font-bold text-slate-900 dark:text-white text-md flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" /> Traceability Timeline
                </h3>

                {(() => {
                  const getStatusStepNumber = (status) => {
                    switch (status) {
                      case 'CROP_REGISTERED': return 1;
                      case 'QUALITY_TESTED': return 2;
                      case 'TESTER_APPROVED': return 3;
                      case 'FUNDING_COMPLETED': return 4;
                      case 'READY_TO_HARVEST': return 5;
                      case 'HARVEST_COMPLETED': return 6;
                      case 'PRODUCT_AVAILABLE': return 7;
                      default: return 1;
                    }
                  };
                  const activeStep = getStatusStepNumber(selectedCrop.timeline_status || 'CROP_REGISTERED');
                  return (
                    <div className="relative border-l-2 border-emerald-100 dark:border-slate-800 ml-3 pl-6 space-y-6 text-xs">

                      {/* Step 1: Crop Registered */}
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className="font-bold text-slate-950 dark:text-white">Crop Registered</h4>
                        <p className="text-slate-500 mt-0.5">Farmer declared crop on-chain.</p>
                      </div>

                      {/* Step 2: Quality Tested */}
                      <div className="relative">
                        <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${activeStep >= 2 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                          }`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className={`font-bold ${activeStep >= 2 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>Quality Tested</h4>
                        <p className="text-slate-500 mt-0.5">Biochemical metrics assessed.</p>
                      </div>

                      {/* Step 3: Tester Approved */}
                      <div className="relative">
                        <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${activeStep >= 3 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                          }`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className={`font-bold ${activeStep >= 3 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>Tester Approved</h4>
                        <p className="text-slate-500 mt-0.5">Lab signs off and certifies crop.</p>
                      </div>

                      {/* Step 4: Funding Completed */}
                      <div className="relative">
                        <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${activeStep >= 4 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                          }`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className={`font-bold ${activeStep >= 4 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>Funding Completed</h4>
                        <p className="text-slate-500 mt-0.5">Target capital reached on-ledger.</p>
                      </div>

                      {/* Step 5: Ready to Harvest */}
                      <div className="relative">
                        <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${activeStep >= 5 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                          }`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className={`font-bold ${activeStep >= 5 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>Ready to Harvest</h4>
                        <p className="text-slate-500 mt-0.5">Farmer marked crop as ready for harvest.</p>
                      </div>

                      {/* Step 6: Harvest Completed */}
                      <div className="relative">
                        <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${activeStep >= 6 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                          }`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className={`font-bold ${activeStep >= 6 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>Harvest Completed</h4>
                        <p className="text-slate-500 mt-0.5">Yield is safely collected.</p>
                      </div>

                      {/* Step 7: Product Available */}
                      <div className="relative">
                        <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${activeStep >= 7 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                          }`}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <h4 className={`font-bold ${activeStep >= 7 ? 'text-slate-950 dark:text-white' : 'text-slate-400'}`}>Product Available</h4>
                        <p className="text-slate-500 mt-0.5">Batch ready with QR and trust seal.</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 6: Farmer Crop Updates */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-md flex items-center gap-1.5">
                  <History className="h-5 w-5 text-emerald-600" /> Farmer Field Updates
                </h3>

                {selectedCropUpdates.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No field updates registered yet for this crop cycle.</p>
                ) : (
                  <div className="space-y-4 text-xs">
                    {selectedCropUpdates.map((up) => (
                      <div key={up.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-emerald-700 dark:text-emerald-450">{up.title}</span>
                          <span className="text-[10px] text-slate-400">Day {up.day_count}</span>
                        </div>
                        <p className="text-slate-650 dark:text-slate-350 leading-relaxed text-[11px]">{up.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 7: Blockchain Authenticity Verification */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-md flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Cryptographic Proof
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Verification Status</span>
                    {selectedCrop.verification_status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                        Verified & On-Chain Anchored
                      </span>
                    ) : selectedCrop.verification_status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-105 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900">
                        Audit Failed & Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-105 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                        Awaiting Inspector Signatures (DB Only)
                      </span>
                    )}
                  </div>

                  {selectedCrop.tx_hash && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Registration Tx Hash</span>
                      <p className="font-mono text-[9px] bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-150 dark:border-slate-800 select-all break-all text-slate-650 dark:text-slate-350">
                        {selectedCrop.tx_hash}
                      </p>
                    </div>
                  )}

                  {selectedCrop.block_number && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Ledger Anchored Block</span>
                      <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                        #{selectedCrop.block_number}
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-450 dark:text-slate-500 italic border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    "This record is cryptographic proof of crop origin and validator signature, recorded forever on the decentralized blockchain. Any alteration of this certificate will instantly invalidate the hash verification."
                  </div>
                </div>
              </div>

              {/* Trust Badge Rating */}
              {credibility && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 text-center space-y-4">
                  <div className="flex justify-center">
                    <Award className="h-12 w-12 text-amber-500" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Credibility Trust Rating</h4>
                    <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                      {credibility.average_rating > 0 ? `${credibility.average_rating}/5.0` : 'No Ratings'}
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColorClass(credibility.badge_color)}`}>
                    <ShieldCheck className="h-4 w-4" />
                    {credibility.trust_badge}
                  </div>

                  <div className="space-y-2 text-xs text-left border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reliability Score</span>
                      <span className="font-semibold">{credibility.reliability_avg}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Product Quality</span>
                      <span className="font-semibold">{credibility.quality_avg}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Delivery Satisfaction</span>
                      <span className="font-semibold">{credibility.delivery_avg}/5.0</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating Submit Panel (Web2 + Web3 Hybrid) */}
              {user && user.role === 'CONSUMER' && product && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900 space-y-4">
                  {error && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-[11px] text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={() => setShowRatingForm(!showRatingForm)}
                    className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-950 text-xs font-bold transition active:scale-[0.99]"
                  >
                    <Plus className="h-4 w-4" /> {showRatingForm ? 'Hide Review Panel' : 'Submit Trust Rating'}
                  </button>

                  {showRatingForm && (
                    <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-350 mb-1">Reliability (1-5)</label>
                        <select value={reliability} onChange={(e) => setReliability(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950">
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Good</option>
                          <option value="3">3 - Average</option>
                          <option value="2">2 - Fair</option>
                          <option value="1">1 - Poor</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-350 mb-1">Product Quality (1-5)</label>
                        <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950">
                          <option value="5">5 - Pure Organic</option>
                          <option value="4">4 - High Quality</option>
                          <option value="3">3 - Clean Standard</option>
                          <option value="2">2 - Moderate</option>
                          <option value="1">1 - Bad Batch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-350 mb-1">Delivery Satisfaction (1-5)</label>
                        <select value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950">
                          <option value="5">5 - Instant & Secure</option>
                          <option value="4">4 - Ontime</option>
                          <option value="3">3 - Acceptable</option>
                          <option value="2">2 - Delayed</option>
                          <option value="1">1 - Damaged / Never Arrived</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-350 mb-1">Public Review Comments</label>
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Write details of crop quality, packaging, and logistics..."
                          className="w-full h-20 rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950 placeholder-slate-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loadingRating}
                        className="w-full flex justify-center items-center gap-1.5 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 disabled:opacity-50 transition"
                      >
                        {loadingRating ? 'Submitting Review...' : (isConnected ? 'Submit On-Chain Rating' : 'Submit Rating (Web2)')}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
