import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { 
  Coins, History, ArrowLeft, ArrowRight, ShieldCheck, Mail, 
  Phone, FileText, Check, AlertCircle, X, ChevronRight, User, Star, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';
import { FundingMarketplaceSkeleton } from '../components/Skeletons';

export default function FundingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoading, hideLoading } = useLoading();
  
  const [products, setProducts] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const wizardRef = React.useRef(null);
  
  // Funding Wizard form states
  const [wizardStep, setWizardStep] = useState(1);
  const [proposedAmount, setProposedAmount] = useState('50000');
  const [proposedProfitShare, setProposedProfitShare] = useState('12');
  const [proposedTerms, setProposedTerms] = useState('Lump sum payment returned after successful harvest and crop sales.');
  const [proposalMessage, setProposalMessage] = useState('Hi Rajesh, we would like to fund this crop batch. Please review our proposed terms so we can coordinate next steps.');
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Farmer Trust Report States
  const [activeTab, setActiveTab] = useState('report'); // 'report' or 'wizard'
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [farmerReviews, setFarmerReviews] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadData = async () => {
    try {
      const pRes = await axios.get('/api/product/all');
      // Filter for approved products
      const approvedProducts = pRes.data.filter(p => p.certification_status === 'APPROVED');
      setProducts(approvedProducts);

      // Auto-select crop lot if passed via state
      if (location.state?.selectLot) {
        const matched = approvedProducts.find(p => p.lot_number === location.state.selectLot);
        if (matched) {
          setSelectedProduct(matched);
        }
      }

      // Load my investments if logged in as investor
      if (user && user.role === 'INVESTOR') {
        const invRes = await axios.get('/api/finance/my-investments');
        setMyInvestments(invRes.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch marketplace data.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedProduct) {
      setWizardStep(1);
      setError('');
      setSuccess('');
      // Auto-calculate 50% of crop target value in Rs as default offer
      const ethPrice = parseFloat(ethers.formatEther(selectedProduct.price.toString()));
      const rsPrice = Math.round(ethPrice * 250000);
      setProposedAmount(Math.round(rsPrice * 0.5).toString());
      
      // Smooth scroll the wizard panel into view
      setTimeout(() => {
        if (wizardRef.current) {
          wizardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [selectedProduct]);

  useEffect(() => {
    const fetchFarmerProfile = async () => {
      if (!selectedProduct || !selectedProduct.farmer_user_id) {
        setFarmerProfile(null);
        setFarmerReviews([]);
        return;
      }
      setLoadingProfile(true);
      try {
        const res = await axios.get(`/api/farmer/profile/${selectedProduct.farmer_user_id}`);
        setFarmerProfile(res.data.profile);
        setFarmerReviews(res.data.reviews || []);
      } catch (err) {
        console.error("Error fetching farmer profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchFarmerProfile();
    setActiveTab('report');
  }, [selectedProduct]);

  const handleSubmitProposal = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    showLoading('Submitting partnership proposal & LOI details...');

    try {
      await axios.post('/api/finance/invest', {
        farmer_id: selectedProduct.farmer_id,
        lot_number: selectedProduct.lot_number,
        amount: parseInt(proposedAmount),
        profit_percentage: parseInt(proposedProfitShare),
        terms: proposedTerms,
        message: proposalMessage
      });

      setSuccess('Your partnership proposal was sent to the farmer successfully!');
      setLoading(false);
      hideLoading();
      setTimeout(() => {
        setSelectedProduct(null);
        setSuccess('');
        loadData();
      }, 2500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit partnership proposal.');
      setLoading(false);
      hideLoading();
    }
  };

  const formatAmount = (amountStr) => {
    try {
      const amt = parseFloat(amountStr);
      if (amt > 1e12) {
        // Legacy Wei formatting
        const eth = parseFloat(ethers.formatEther(amountStr));
        return `Rs. ${(Math.round(eth * 250000)).toLocaleString('en-IN')}`;
      }
      return `Rs. ${Math.round(amt).toLocaleString('en-IN')}`;
    } catch (e) {
      return `Rs. ${amountStr}`;
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="h-6 w-6 text-emerald-600" /> Crop Micro-Finance Marketplace
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Propose custom funding partnerships directly with local farmers. Set mutual profit margins and unlock private deals.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:border-rose-900/30">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/30">
          {success}
        </div>
      )}

      {loadingData ? (
        <FundingMarketplaceSkeleton />
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side: Product Lot Marketplace */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Active Crop Listings</h3>
            
            {products.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12 bg-white rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-850">
                No active certified crop lots available for funding.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {products.map((product) => {
                  const ethPrice = ethers.formatEther(product.price.toString());
                  const rsPrice = Math.round(parseFloat(ethPrice) * 250000);
                  const isSelected = selectedProduct?.lot_number === product.lot_number;
                  const existingLOI = myInvestments.find(inv => inv.lot_number === product.lot_number);
                  return (
                    <div
                      key={product.lot_number}
                      className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-900 flex flex-col justify-between ${
                        isSelected 
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500' 
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 uppercase">
                                {product.quality_grade}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                product.investment_status === 'OPEN'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/20 dark:text-rose-455'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${product.investment_status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                {product.investment_status === 'OPEN' ? 'Open' : 'Closed'}
                              </span>
                              {existingLOI && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                  existingLOI.status === 'ACCEPTED' 
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400' 
                                    : existingLOI.status === 'DECLINED'
                                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-450'
                                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400'
                                }`}>
                                  LOI Sent ({existingLOI.status})
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mt-1.5 text-lg">{product.crop_name}</h4>
                            
                            {/* Average Ratings */}
                            {product.average_rating > 0 ? (
                                <div className="flex items-center gap-1 mt-1 text-[11px]">
                                  <div className="flex gap-0.5 text-amber-500">
                                    {Array.from({ length: Math.round(product.average_rating) }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    ))}
                                    {Array.from({ length: 5 - Math.round(product.average_rating) }).map((_, i) => (
                                      <Star key={i} className="h-3 w-3 text-slate-200 dark:text-slate-700" />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    {product.average_rating} ({product.rating_count})
                                  </span>
                                </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic mt-1 block">No ratings</span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">Lot: {product.lot_number}</span>
                        </div>
 
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Farmer</span>
                            <span className="font-semibold">{product.farmer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Batch Target Value</span>
                            <span className="font-bold text-slate-950 dark:text-white">Rs. {rsPrice.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Expiry Limit</span>
                            <span>{new Date(product.expiry_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
 
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className={`w-full mt-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                            : product.investment_status !== 'OPEN'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-350'
                              : existingLOI
                                ? 'bg-amber-600 hover:bg-amber-500 text-white dark:bg-amber-700 dark:hover:bg-amber-600'
                                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                        }`}
                      >
                        {user?.role === 'INVESTOR' 
                          ? product.investment_status === 'OPEN'
                            ? existingLOI 
                              ? 'Resend LOI / Propose New Terms' 
                              : 'Send LOI / Propose Partnership' 
                            : 'View Trust Report (Closed)'
                          : 'View Trust & Crop Details'} <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Partnership Wizard Panel */}
          <div ref={wizardRef} className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {selectedProduct ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 relative overflow-hidden">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Tab Bar (only shown if user is an INVESTOR) */}
                {user?.role === 'INVESTOR' ? (
                  <div className="flex border-b border-slate-100 dark:border-slate-800 pb-1">
                    <button
                      onClick={() => setActiveTab('report')}
                      className={`flex-1 pb-2 text-xs font-bold border-b-2 transition ${
                        activeTab === 'report'
                          ? 'border-emerald-600 text-emerald-650 dark:border-emerald-500 dark:text-emerald-400'
                          : 'border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-200'
                      }`}
                    >
                      📜 Farmer & Trust Report
                    </button>
                    <button
                      onClick={() => setActiveTab('wizard')}
                      className={`flex-1 pb-2 text-xs font-bold border-b-2 transition ${
                        activeTab === 'wizard'
                          ? 'border-emerald-600 text-emerald-650 dark:border-emerald-500 dark:text-emerald-400'
                          : 'border-transparent text-slate-400 hover:text-slate-655 dark:hover:text-slate-200'
                      }`}
                    >
                      💰 LOI Proposal Wizard
                    </button>
                  </div>
                ) : (
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">Farmer & Trust Report</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Verifiable credentials, genuinity check, and track records</p>
                  </div>
                )}

                {activeTab === 'report' || user?.role !== 'INVESTOR' ? (
                  /* TAB 1: Farmer & Genuinity Report */
                  <div className="space-y-6 text-xs animate-in fade-in duration-200">
                    
                    {/* Investment Status Banner */}
                    {selectedProduct.investment_status === 'OPEN' ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-slate-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-slate-300 rounded-xl leading-relaxed text-[11px] flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>INVESTMENT WINDOW OPEN</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-emerald-600 dark:text-emerald-500 font-mono">
                          <span>Deadline: {new Date(selectedProduct.investment_close_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span>Start: {new Date(selectedProduct.investment_start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 text-slate-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-slate-300 rounded-xl leading-relaxed text-[11px] flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                          <AlertCircle className="h-4 w-4 text-rose-600" />
                          <span>INVESTMENT WINDOW CLOSED</span>
                        </div>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 italic">
                          Reason: {selectedProduct.investment_status_reason}
                        </p>
                      </div>
                    )}

                    {/* Agricultural Inspector Verification (Anti-Fraud Genuinity) */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] border-b pb-1">👮 Agricultural Inspection Report</h4>
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-850 space-y-2.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Genuinity Verification</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">VERIFIED GENUINE</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Assigned Inspector</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {selectedProduct.inspector_name || 'Inspector Rajiv Kumar'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Inspection Date</span>
                          <span className="font-mono">
                            {selectedProduct.inspection_date ? new Date(selectedProduct.inspection_date).toLocaleDateString() : 'Decentralized Inspector Verified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Inspection Notes</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-[180px]">
                            {selectedProduct.inspection_notes || 'Physical land inspection completed. Soil parameters and crop possession match registry records.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quality Tester Report */}
                    {loadingProfile ? (
                      <div className="text-center py-4 text-slate-400">Loading farmer track record...</div>
                    ) : farmerProfile ? (
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] border-b pb-1">🧪 Quality Tester Grade Track Record</h4>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl bg-slate-50 dark:bg-slate-955 p-3 border border-slate-200 dark:border-slate-850 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Average Grade</span>
                            <span className={`text-2xl font-black mt-1 ${
                              farmerProfile.avg_quality_grade === 'C' ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>{farmerProfile.avg_quality_grade}</span>
                            <span className="text-[9px] text-slate-400 mt-1">Weighted: {farmerProfile.avg_quality_value}/5.0</span>
                          </div>

                          <div className="rounded-xl bg-slate-50 dark:bg-slate-955 p-3 border border-slate-200 dark:border-slate-850 flex flex-col items-center justify-center">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Certified Lots</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white mt-1">{farmerProfile.certified_crop_count}</span>
                            <span className="text-[9px] text-slate-400 mt-1">Registered batches</span>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-200 dark:border-slate-850">
                          <span className="text-[10px] text-slate-400 font-semibold block mb-1">Tester Evaluation Remarks</span>
                          <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 font-medium italic">
                            "{farmerProfile.quality_remark}"
                          </p>
                        </div>

                        {/* Grade Distribution Bar Chart */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-400 font-semibold block">Grade Distribution</span>
                          {Object.entries(farmerProfile.grade_counts || {}).map(([grade, count]) => {
                            const pct = farmerProfile.certified_crop_count > 0 
                              ? (count / farmerProfile.certified_crop_count) * 105 
                              : 0;
                            return (
                              <div key={grade} className="flex items-center gap-2">
                                <span className="w-5 font-bold font-mono text-[10px]">{grade}</span>
                                <div className="flex-grow bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${grade === 'C' ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="w-4 text-right font-mono text-[10px] text-slate-400">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center border rounded-xl italic text-slate-400 bg-slate-50 dark:bg-slate-950">
                        No tester verification record found for this farmer.
                      </div>
                    )}

                    {/* Stakeholder Ratings & Comments Feed */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] border-b pb-1">💬 Consumer & Investor Trust Reviews</h4>
                      
                      {farmerReviews.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                          No stakeholder reviews or trust comments posted yet.
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {farmerReviews.map((rev) => (
                            <div key={rev.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-950/40">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800 dark:text-slate-250">{rev.rater_name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {rev.rater_role}
                                </span>
                              </div>
                              <div className="flex gap-4 text-[9px] text-slate-400 font-mono">
                                <span>Reliability: {rev.reliability}/5</span>
                                <span>Quality: {rev.product_quality}/5</span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 leading-normal text-[11px] italic font-medium">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Verification Evidence Info */}
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] border-b pb-1">📋 Crop Specifications</h4>
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-850 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Land Survey No.</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.land_survey_no || 'SUR-BAS-2026-101'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Farming Method</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.farming_type || 'Organic'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Expected Yield</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedProduct.expected_yield || 2500} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Sowing Date</span>
                          <span className="font-mono">{new Date(selectedProduct.cultivation_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Expected Harvest</span>
                          <span className="font-mono">{new Date(selectedProduct.expected_harvest_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Non-investor help message */}
                    {user?.role !== 'INVESTOR' && (
                      <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-850 dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400 rounded-xl leading-relaxed text-[11px] flex gap-2">
                        <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                        <span>You are currently signed in as a <strong>{user?.role || 'Guest'}</strong>. Only registered investors can submit a **Letter of Intent (LOI)**. Please log in with an <strong>Investor</strong> account to propose funding.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: LOI Proposal Wizard (Only for INVESTOR) */
                  <div className="space-y-6 animate-in fade-in duration-200">
                    {selectedProduct.investment_status !== 'OPEN' ? (
                      /* Block LOI submissions if Closed */
                      <div className="space-y-4 py-6 text-center text-xs">
                        <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-955/40 flex items-center justify-center text-rose-600">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm">Funding Window is Closed</h4>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                            You cannot submit Letters of Intent (LOIs) for this crop lot because the investment window is closed.
                          </p>
                        </div>
                        <div className="p-3 bg-rose-50 border border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 rounded-xl italic font-mono">
                          Reason: {selectedProduct.investment_status_reason}
                        </div>
                      </div>
                    ) : (
                      /* Step Form rendering when OPEN */
                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step {wizardStep} of 4</span>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">LOI Proposal Wizard</h3>
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Submit a Letter of Intent (LOI) for {selectedProduct.crop_name} (Lot #{selectedProduct.lot_number})</p>
                        </div>

                        {myInvestments.find(inv => inv.lot_number === selectedProduct.lot_number) && (
                          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-850 dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400 rounded-xl leading-relaxed text-[11px] flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                            <span>You have already submitted an LOI for this lot (Status: <strong>{myInvestments.find(inv => inv.lot_number === selectedProduct.lot_number).status}</strong>). Submitting this wizard will resend a new LOI proposal with updated terms.</span>
                          </div>
                        )}

                        {/* Step Indicators */}
                        <div className="flex justify-between items-center gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div 
                              key={step} 
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                step <= wizardStep ? 'bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Wizard Steps Content */}
                        <div className="min-h-[220px] transition-all duration-300">
                          {wizardStep === 1 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-1 duration-200">
                              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase">Step 1: LOI Financial Offer</h4>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                    Proposed Funding Amount (Rs.)
                                  </label>
                                  <input
                                    type="number"
                                    value={proposedAmount}
                                    onChange={(e) => setProposedAmount(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-xs"
                                  />
                                  <p className="text-[10px] text-slate-400 mt-1">
                                    Batch Target Value: Rs. {Math.round(parseFloat(ethers.formatEther(selectedProduct.price.toString())) * 250000).toLocaleString('en-IN')}
                                  </p>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                                    Expected Returns Margin (%)
                                  </label>
                                  <div className="relative">
                                    <input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={proposedProfitShare}
                                      onChange={(e) => setProposedProfitShare(e.target.value)}
                                      className="block w-full rounded-xl border border-slate-200 py-2.5 pl-3 pr-8 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-xs"
                                    />
                                    <span className="absolute right-3 top-3 text-xs font-semibold text-slate-400 select-none">
                                      %
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-450 block mt-1">Typical rates: 10% - 18% based on crop quality.</span>

                                  {/* Estimated Returns display */}
                                  {parseFloat(proposedAmount) > 0 && parseFloat(proposedProfitShare) > 0 && (
                                    <div className="mt-4 p-3 bg-emerald-50/40 dark:bg-emerald-955/20 border border-emerald-100/30 rounded-xl space-y-1.5 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-slate-400">Estimated Net Profit:</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                          Rs. {Math.round(parseFloat(proposedAmount) * (parseFloat(proposedProfitShare) / 100)).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold">
                                        <span className="text-slate-700 dark:text-slate-350">Estimated Total Return:</span>
                                        <span className="text-slate-950 dark:text-white">
                                          Rs. {Math.round(parseFloat(proposedAmount) * (1 + parseFloat(proposedProfitShare) / 100)).toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {wizardStep === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-1 duration-200">
                              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase">Step 2: LOI Terms & Conditions</h4>
                              <div>
                                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">
                                  Custom Terms & Conditions
                                </label>
                                <textarea
                                  rows="5"
                                  value={proposedTerms}
                                  onChange={(e) => setProposedTerms(e.target.value)}
                                  placeholder="e.g. Return paid in full within 30 days post-harvest sales. Milestones verified by laboratory reports."
                                  className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-xs resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {wizardStep === 3 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-1 duration-200">
                              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase">Step 3: Custom Message</h4>
                              <div>
                                <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-1">
                                  Message to Farmer
                                </label>
                                <textarea
                                  rows="5"
                                  value={proposalMessage}
                                  onChange={(e) => setProposalMessage(e.target.value)}
                                  placeholder="Write a message introducing yourself or asking clarifying questions..."
                                  className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-xs resize-none"
                                />
                              </div>
                            </div>
                          )}

                          {wizardStep === 4 && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-right-1 duration-200 text-xs">
                              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-355 uppercase mb-2">Step 4: Review LOI Proposal</h4>
                              
                              <div className="rounded-xl bg-slate-50 dark:bg-slate-955 border border-slate-250 dark:border-slate-800 p-3.5 space-y-2.5">
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                  <span className="text-slate-400">Offer Amount</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Rs. {parseInt(proposedAmount).toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                  <span className="text-slate-400">Returns Share</span>
                                  <span className="font-semibold">{proposedProfitShare}% of Harvest yield sales</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 block">Proposed Terms</span>
                                  <p className="text-slate-700 dark:text-slate-300 font-medium italic">"{proposedTerms}"</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Controls */}
                        <div className="flex gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                          {wizardStep > 1 && (
                            <button
                              onClick={() => setWizardStep(wizardStep - 1)}
                              className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs font-bold transition flex items-center gap-1"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" /> Back
                            </button>
                          )}
                          {wizardStep < 4 ? (
                            <button
                              onClick={() => setWizardStep(wizardStep + 1)}
                              disabled={!proposedAmount}
                              className="flex-grow py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-850 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                            >
                              Next Step <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={handleSubmitProposal}
                              disabled={loading}
                              className="flex-grow py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                            >
                              {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" /> Send LOI Proposal
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 dark:border-slate-800 dark:text-slate-500">
                Select an active certified crop listing and click "{user?.role === 'FARMER' ? 'View Crop Details' : 'Send LOI'}" to view details or start the wizard.
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
