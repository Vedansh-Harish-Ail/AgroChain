import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Coins, History, ArrowLeft, ArrowRight, ShieldCheck, Mail, 
  Phone, FileText, Check, AlertCircle, X, ChevronRight, User, Star
} from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function FundingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [products, setProducts] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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

      // Load my investments if logged in
      if (user) {
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
    }
  }, [selectedProduct]);

  const handleSubmitProposal = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

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
      setTimeout(() => {
        setSelectedProduct(null);
        setSuccess('');
        loadData();
      }, 2500);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit partnership proposal.');
      setLoading(false);
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
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
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
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 uppercase">
                              {product.quality_grade}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-lg">{product.crop_name}</h4>
                            
                            {/* Average Ratings */}
                            {product.average_rating > 0 ? (
                              <div className="flex items-center gap-1 mt-1 text-[11px]">
                                <div className="flex gap-0.5 text-amber-500">
                                  {Array.from({ length: Math.round(product.average_rating) }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-amber-500 text-amber-500" />
                                  ))}
                                  {Array.from({ length: 5 - Math.round(product.average_rating) }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 text-slate-250 dark:text-slate-700" />
                                  ))}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  {product.average_rating} ({product.rating_count})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-405 italic mt-1 block">No ratings</span>
                            )}
                          </div>
                          <span className="font-mono text-xs text-slate-450 dark:text-slate-500">Lot: {product.lot_number}</span>
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
                        className={`w-full mt-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-650 text-white hover:bg-emerald-500'
                            : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700'
                        }`}
                      >
                        {user?.role === 'FARMER' ? 'View Crop Details' : 'Send LOI / Propose Partnership'} <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Partnership Wizard Panel */}
          <div className="space-y-6">
            {selectedProduct ? (
              user?.role === 'FARMER' ? (
                /* Read-only crop details card for Farmer role */
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5 relative overflow-hidden text-xs">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-605 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Crop Lot Details</h3>
                  
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-850 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Crop Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{selectedProduct.crop_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lot Number</span>
                      <span className="font-mono">{selectedProduct.lot_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Value</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        Rs. {Math.round(parseFloat(ethers.formatEther(selectedProduct.price.toString())) * 250000).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-850 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 rounded-xl leading-relaxed text-[11px] flex gap-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <span>You are currently signed in as a <strong>Farmer</strong>. Only investors can submit a **Letter of Intent (LOI)** to fund crop lots. Sign in as an <strong>Investor</strong> to use this feature.</span>
                  </div>
                </div>
              ) : (
                /* LOI Proposal Wizard for non-farmers */
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6 relative overflow-hidden">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step {wizardStep} of 4</span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">LOI Proposal Wizard</h3>
                    <p className="text-xs font-semibold text-emerald-650 dark:text-emerald-450">Submit a Letter of Intent (LOI) for {selectedProduct.crop_name} (Lot #{selectedProduct.lot_number})</p>
                  </div>

                  {/* Step Indicators */}
                  <div className="flex justify-between items-center gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          step <= wizardStep ? 'bg-emerald-650' : 'bg-slate-100 dark:bg-slate-800'
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
                              <div className="mt-4 p-3 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/30 rounded-xl space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Estimated Net Profit:</span>
                                  <span className="font-semibold text-emerald-650 dark:text-emerald-450">
                                    Rs. {Math.round(parseFloat(proposedAmount) * (parseFloat(proposedProfitShare) / 100)).toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-1.5 font-bold">
                                  <span className="text-slate-700 dark:text-slate-350">Estimated Total Return:</span>
                                  <span className="text-slate-905 dark:text-white">
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
                            Message to Rajesh Patel
                          </label>
                          <textarea
                            rows="5"
                            value={proposalMessage}
                            onChange={(e) => setProposalMessage(e.target.value)}
                            placeholder="Write a message introducing yourself or asking clarify questions..."
                            className="block w-full rounded-xl border border-slate-200 py-2.5 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-xs resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {wizardStep === 4 && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-right-1 duration-200 text-xs">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-355 uppercase mb-2">Step 4: Review LOI Proposal</h4>
                        
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 p-3.5 space-y-2.5">
                          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                            <span className="text-slate-400">Offer Amount</span>
                            <span className="font-bold text-emerald-650 dark:text-emerald-450">Rs. {parseInt(proposedAmount).toLocaleString('en-IN')}</span>
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
                        className="flex-grow py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
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
              )
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
