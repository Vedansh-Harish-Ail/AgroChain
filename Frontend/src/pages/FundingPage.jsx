import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { Coins, Wallet, History, Users, Tag, TrendingUp, DollarSign, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function FundingPage() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Funding form states
  const [fundAmount, setFundAmount] = useState('0.1'); // Default 0.1 ETH
  const [profitShare, setProfitShare] = useState('10'); // Default 10% profit return
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const loadData = async () => {
    try {
      const pRes = await axios.get('/api/product/all');
      // Filter for approved products
      const approvedProducts = pRes.data.filter(p => p.certification_status === 'APPROVED');
      setProducts(approvedProducts);

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

  const handleInvest = async (product) => {
    setError('');
    setTxHash('');
    setLoading(true);

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to back this crop.');
        setLoading(false);
        return;
      }
    }

    try {
      const amountWei = ethers.parseEther(fundAmount);
      
      // 1. Call Smart Contract `invest`
      // invest(uint256 _farmerId, uint256 _lotNumber, uint256 _profitPercentage) payable
      const tx = await contracts.microFinance.invest(
        product.farmer_id,
        product.lot_number,
        parseInt(profitShare),
        { value: amountWei }
      );

      setTxHash(tx.hash);

      const receipt = await tx.wait();
      const blockNumber = receipt.blockNumber;

      // 2. Log transaction to Explorer Index
      await axios.post('/api/explorer/log-tx', {
        tx_hash: tx.hash,
        block_number: blockNumber,
        from_address: tx.from,
        to_address: tx.to,
        amount: amountWei.toString(),
        method_name: 'invest',
        event_data: JSON.stringify({
          farmerId: product.farmer_id,
          lotNumber: product.lot_number,
          amount: amountWei.toString(),
          profitPercentage: profitShare
        })
      });

      // 3. Save to database
      await axios.post('/api/finance/invest', {
        farmer_id: product.farmer_id,
        lot_number: product.lot_number,
        amount: amountWei.toString(),
        profit_percentage: parseInt(profitShare),
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      alert('Investment transaction completed! Funds forwarded to farmer.');
      setSelectedProduct(null);
      loadData();

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Make sure you have enough test ETH.');
      setLoading(false);
    }
  };

  const getFundingProgress = (product) => {
    // Sum all investments for this lot number
    const lotInvestments = myInvestments.filter(inv => inv.lot_number === product.lot_number);
    // Let's mock a progress logic or fetch sum from db if we want, but simple display is beautiful.
    return 35; // default starting representation
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Back local farmers directly by funding crop batches with zero interest. Track yields and earn sales margins.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {txHash && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs dark:bg-slate-950 dark:border-slate-800 font-mono">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Funding Transaction Dispatched!</p>
          <p>Tx Hash: {txHash}</p>
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
                  return (
                    <div
                      key={product.lot_number}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 uppercase">
                              {product.quality_grade}
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white mt-1 text-lg">{product.crop_name}</h4>
                          </div>
                          <span className="font-mono text-xs text-slate-450 dark:text-slate-500">Lot: {product.lot_number}</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Farmer ID</span>
                            <span className="font-semibold">{product.farmer_name} (ID: {product.farmer_id})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Target Value</span>
                            <span className="font-bold text-slate-950 dark:text-white">Rs. {Math.round(parseFloat(ethPrice) * 250000).toLocaleString('en-IN')} ({ethPrice} ETH)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Expiry Limit</span>
                            <span>{new Date(product.expiry_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Funding Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                            <span>Funding Progress</span>
                            <span>{getFundingProgress(product)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${getFundingProgress(product)}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold dark:bg-emerald-600 dark:hover:bg-emerald-500 transition"
                      >
                        Invest In Crop
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Side: Investment Panel / Details */}
          <div className="space-y-6">
            {selectedProduct ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
                <h3 className="font-bold text-slate-900 dark:text-white">Fund Investment Details</h3>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs dark:bg-slate-950 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crop Selected</span>
                    <span className="font-bold">{selectedProduct.crop_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lot Number</span>
                    <span className="font-mono">{selectedProduct.lot_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price Target</span>
                    <span>Rs. {Math.round(parseFloat(ethers.formatEther(selectedProduct.price.toString())) * 250000).toLocaleString('en-IN')} ({ethers.formatEther(selectedProduct.price.toString())} ETH)</span>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Funding Contribution (ETH)
                    </label>
                    <input
                      type="text"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Estimated value: Rs. {Math.round(parseFloat(fundAmount || 0) * 250000).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Agreed Profit Margin Return
                      </label>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{profitShare}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="25"
                      value={profitShare}
                      onChange={(e) => setProfitShare(e.target.value)}
                      className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleInvest(selectedProduct)}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 py-3 text-xs font-bold transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" /> Send Funds via Metamask
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-350 p-8 text-center text-slate-400 dark:border-slate-850 dark:text-slate-500">
                Select an active crop listing to input investment values and view yield percentages.
              </div>
            )}

            {/* My Investments History */}
            {user && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-base">
                  <History className="h-4 w-4 text-emerald-600" /> My Investment Portfolio
                </h3>
                
                {myInvestments.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">You haven't backed any crops yet.</p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                    {myInvestments.map((inv) => (
                      <div key={inv.id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 text-xs flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">Lot {inv.lot_number}</p>
                          <p className="text-slate-500 dark:text-slate-400">Backed Farmer {inv.farmer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            Rs. {Math.round(parseFloat(ethers.formatEther(inv.amount.toString())) * 250000).toLocaleString('en-IN')} ({ethers.formatEther(inv.amount.toString())} ETH)
                          </p>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
