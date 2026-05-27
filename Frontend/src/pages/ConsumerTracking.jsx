import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { Search, ShieldCheck, Star, Award, CheckCircle2, ChevronRight, MessageSquare, Plus } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function ConsumerTracking() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const { user } = useAuth();

  // Search parameters
  const [searchType, setSearchType] = useState('lot'); // 'lot' or 'farmer'
  const [queryId, setQueryId] = useState('');
  
  // Loaded results
  const [farmer, setFarmer] = useState(null);
  const [product, setProduct] = useState(null);
  const [credibility, setCredibility] = useState(null);
  const [reviews, setReviews] = useState([]);
  
  // Rating form states
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [reliability, setReliability] = useState('5');
  const [quality, setQuality] = useState('5');
  const [satisfaction, setSatisfaction] = useState('5');
  const [comment, setComment] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!queryId) return;
    setError('');
    setLoading(true);
    setFarmer(null);
    setProduct(null);
    setCredibility(null);
    setReviews([]);

    try {
      if (searchType === 'lot') {
        const pRes = await axios.get(`/api/product/${queryId}`);
        const pData = pRes.data;
        setProduct(pData);

        const fRes = await axios.get(`/api/farmer/${pData.farmer_id}`);
        const fData = fRes.data;
        setFarmer(fData);

        const credRes = await axios.get(`/api/rating/farmer/${fData.id}`);
        setCredibility(credRes.data);

        const reviewRes = await axios.get(`/api/rating/farmer/${fData.id}/reviews`);
        setReviews(reviewRes.data);
      } else {
        const fRes = await axios.get(`/api/farmer/${queryId}`);
        const fData = fRes.data;
        setFarmer(fData);

        const credRes = await axios.get(`/api/rating/farmer/${fData.id}`);
        setCredibility(credRes.data);

        const reviewRes = await axios.get(`/api/rating/farmer/${fData.id}/reviews`);
        setReviews(reviewRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('No matching verified records found in database or ledger.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!farmer || !product) return;
    setError('');
    setLoadingRating(true);

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to submit review weights to Solidity.');
        setLoadingRating(false);
        return;
      }
    }

    try {
      // 1. Submit rating to Solidity rating contract
      // addRating(uint256 _farmerId, uint256 _lotNumber, uint8 _reliability, uint8 _productQuality, uint8 _deliverySatisfaction, string _comment)
      const tx = await contracts.ratingSystem.addRating(
        farmer.id,
        product.lot_number,
        parseInt(reliability),
        parseInt(quality),
        parseInt(satisfaction),
        comment
      );

      const receipt = await tx.wait();
      const blockNumber = receipt.blockNumber;

      // 2. Log transaction to Explorer
      await axios.post('/api/explorer/log-tx', {
        tx_hash: tx.hash,
        block_number: blockNumber,
        from_address: tx.from,
        to_address: tx.to,
        amount: 0,
        method_name: 'addRating',
        event_data: JSON.stringify({
          farmerId: farmer.id,
          lotNumber: product.lot_number,
          reliability,
          quality,
          satisfaction
        })
      });

      // 3. Submit rating to Database
      await axios.post('/api/rating/add', {
        farmer_id: farmer.id,
        lot_number: product.lot_number,
        reliability: parseInt(reliability),
        product_quality: parseInt(quality),
        delivery_satisfaction: parseInt(satisfaction),
        comment,
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoadingRating(false);
      alert('Review recorded successfully on blockchain!');
      setShowRatingForm(false);
      
      // Reload reviews
      const credRes = await axios.get(`/api/rating/farmer/${farmer.id}`);
      setCredibility(credRes.data);
      const reviewRes = await axios.get(`/api/rating/farmer/${farmer.id}/reviews`);
      setReviews(reviewRes.data);
    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Rating submission failed. Verify crop and lot details.');
      setLoadingRating(false);
    }
  };

  const getBadgeColorClass = (color) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-350 dark:border-emerald-800';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-350 dark:border-indigo-800';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-350 dark:border-amber-800';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Search Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Supply Chain Traceability Portal</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Scan lot numbers or search farmer IDs to verify the origin and custody of agricultural batches.</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex justify-center gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="lot"
                  checked={searchType === 'lot'}
                  onChange={() => setSearchType('lot')}
                  className="accent-emerald-500"
                />
                Trace Lot Number
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="farmer"
                  checked={searchType === 'farmer'}
                  onChange={() => setSearchType('farmer')}
                  className="accent-emerald-500"
                />
                Farmer Profile ID
              </label>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder={searchType === 'lot' ? "Enter product Lot number (e.g. 1001)..." : "Enter Farmer Project ID (e.g. 1)..."}
                  value={queryId}
                  onChange={(e) => setQueryId(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/10 transition disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Trace'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 text-center max-w-xl mx-auto">
          {error}
        </div>
      )}

      {/* Results View */}
      {farmer && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Traceability Timeline & Badges */}
          <div className="lg:col-span-2 space-y-8">
            {/* Timeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Crop Lifecycle Verification Trail
              </h3>

              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 pl-6 space-y-8 text-sm">
                {/* Step 1: Crop registered */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Farmer Listed Cultivation Project</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Crop: {farmer.crop_type} | Yield: {farmer.expected_yield} kg</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Location: {farmer.farm_location}</p>
                  {farmer.tx_hash && (
                    <div className="mt-2 font-mono text-[10px] text-slate-450 dark:text-slate-550">
                      Tx: <span className="hover:text-emerald-500 cursor-pointer">{farmer.tx_hash}</span>
                    </div>
                  )}
                </div>

                {/* Step 2: Quality Inspection */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                    farmer.is_approved ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                  }`}>
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <h4 className={`font-bold ${farmer.is_approved ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>Quality Inspection Verified</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {farmer.is_approved 
                      ? 'Approved by authorized quality inspection authority.' 
                      : 'Pending Quality Tester certification review.'}
                  </p>
                </div>

                {/* Step 3: Product Batch Certified */}
                {product && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Product Certified & Lot Created</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Lot Code: {product.lot_number} | Quality: <span className="font-semibold text-emerald-600">{product.quality_grade}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Target Price: {ethers.formatEther(product.price)} ETH | Tested Date: {new Date(product.test_date).toLocaleDateString()}
                    </p>
                    {product.tx_hash && (
                      <div className="mt-2 font-mono text-[10px] text-slate-450 dark:text-slate-550">
                        Tx: <span>{product.tx_hash}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Credibility Reviews List */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" /> Consumer Feedback Logs
              </h3>

              {reviews.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No reviews submitted for this farmer yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{review.consumer_name}</p>
                          <p className="text-[10px] text-slate-400">Lot Ref: {review.lot_number}</p>
                        </div>
                        <div className="flex gap-0.5 text-amber-500">
                          {Array.from({ length: Math.round((review.reliability + review.product_quality + review.delivery_satisfaction) / 3) }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-450">{review.comment}</p>
                      {review.tx_hash && (
                        <p className="font-mono text-[9px] text-slate-450 dark:text-slate-550">On-Chain Tx: {review.tx_hash}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Trust Badge, Credibility Math & Review Form */}
          <div className="space-y-8">
            {/* Credibility Score Box */}
            {credibility && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 text-center space-y-4">
                <div className="flex justify-center">
                  <Award className="h-12 w-12 text-amber-500" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-500 text-xs uppercase tracking-wider">Credibility Trust Rating</h4>
                  <div className="text-4xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {credibility.average_rating > 0 ? `${credibility.average_rating}/5.0` : 'No Ratings'}
                  </div>
                </div>

                {/* Trust Badge */}
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

            {/* Rating Submit Panel */}
            {user && user.role === 'CONSUMER' && product && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <button
                  onClick={() => setShowRatingForm(!showRatingForm)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 text-xs font-bold transition"
                >
                  <Plus className="h-4 w-4" /> {showRatingForm ? 'Hide Review Panel' : 'Submit Consumer Rating'}
                </button>

                {showRatingForm && (
                  <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Reliability (1-5)</label>
                      <select value={reliability} onChange={(e) => setReliability(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950">
                        <option value="5">5 - Excellent</option>
                        <option value="4">4 - Good</option>
                        <option value="3">3 - Average</option>
                        <option value="2">2 - Fair</option>
                        <option value="1">1 - Poor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Quality (1-5)</label>
                      <select value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950">
                        <option value="5">5 - Pure Organic</option>
                        <option value="4">4 - High Quality</option>
                        <option value="3">3 - Clean Standard</option>
                        <option value="2">2 - Moderate</option>
                        <option value="1">1 - Bad Batch</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Delivery Satisfaction (1-5)</label>
                      <select value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2 px-2.5 dark:border-slate-800 dark:bg-slate-950">
                        <option value="5">5 - Instant & Secure</option>
                        <option value="4">4 - Ontime</option>
                        <option value="3">3 - Acceptable</option>
                        <option value="2">2 - Delayed</option>
                        <option value="1">1 - Damaged / Never Arrived</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Public Review Comments</label>
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
                      className="w-full flex justify-center items-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {loadingRating ? 'Signing Blockchain Review...' : 'Submit Rating'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
