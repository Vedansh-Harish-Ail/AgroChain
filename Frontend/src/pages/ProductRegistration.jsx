import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { FileCheck, Wallet, Calendar, Tag, ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function ProductRegistration() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const { showToast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    lot_number: Math.floor(1000 + Math.random() * 9000), // Random 4 digit default
    farmer_id: '',
    crop_name: '',
    quality_grade: 'Grade A+',
    price_eth: '1.0', // ETH units to be converted to Wei
    test_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 180 days default
    certification_status: 'APPROVED'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txDetails, setTxDetails] = useState(null);

  useEffect(() => {
    if (location.state) {
      setFormData(prev => ({
        ...prev,
        farmer_id: location.state.cropId || '',
        crop_name: location.state.cropName || ''
      }));
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTxDetails(null);
    setLoading(true);

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to register product details on the blockchain.');
        setLoading(false);
        return;
      }
    }

    try {
      showLoading('Broadcasting quality certificate and lot registry transaction...');
      const lotNumber = parseInt(formData.lot_number);
      const farmerId = parseInt(formData.farmer_id);
      
      // Parse price in ETH to Wei
      const priceWei = ethers.parseEther(formData.price_eth);
      
      const testTimestamp = Math.floor(new Date(formData.test_date).getTime() / 1000);
      const expiryTimestamp = Math.floor(new Date(formData.expiry_date).getTime() / 1000);

      // 1. Call Smart Contract `registerProduct`
      const tx = await contracts.productRegistry.registerProduct(
        lotNumber,
        farmerId,
        formData.crop_name,
        formData.quality_grade,
        priceWei,
        testTimestamp,
        expiryTimestamp,
        formData.certification_status
      );

      setTxDetails({ step: 'broadcasting', hash: tx.hash });

      // Wait for receipt
      const receipt = await tx.wait();
      const blockNumber = receipt.blockNumber;

      setTxDetails({ step: 'confirmed', hash: tx.hash, block: blockNumber });

      // 2. Log transaction to Explorer Index
      await axios.post('/api/explorer/log-tx', {
        tx_hash: tx.hash,
        block_number: blockNumber,
        from_address: tx.from,
        to_address: tx.to,
        amount: 0,
        method_name: 'registerProduct',
        event_data: JSON.stringify({
          lotNumber,
          farmerId,
          cropName: formData.crop_name,
          qualityGrade: formData.quality_grade,
          price: priceWei.toString()
        })
      });

      // 3. Save to database
      await axios.post('/api/product/register', {
        lot_number: lotNumber,
        farmer_id: farmerId,
        crop_name: formData.crop_name,
        quality_grade: formData.quality_grade,
        price: priceWei.toString(), // Save stringified BigInt
        test_date: formData.test_date,
        expiry_date: formData.expiry_date,
        certification_status: formData.certification_status,
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      hideLoading();
      showToast(`Product Lot ${lotNumber} certified and registered on the blockchain successfully!`, 'success');
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Verify farmer is approved on-chain.');
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="p-3 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-2xl">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Product Batch Lot</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Issue Quality Certificates and Register Lots on Blockchain</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        {txDetails && (
          <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {txDetails.step === 'broadcasting' ? 'Registering lot on blockchain...' : 'Transaction Confirmed!'}
              </span>
            </div>
            <p className="font-mono text-slate-550 dark:text-slate-400">Tx Hash: {txDetails.hash}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lot Number (Unique ID)
              </label>
              <input
                type="number"
                name="lot_number"
                required
                value={formData.lot_number}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-450 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="e.g. 1001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Farmer Crop Project ID
              </label>
              <input
                type="number"
                name="farmer_id"
                required
                value={formData.farmer_id}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-450 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="e.g. 172"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Crop Name
              </label>
              <input
                type="text"
                name="crop_name"
                required
                value={formData.crop_name}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-450 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="e.g. Organic Basmati Rice"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quality Grade
              </label>
              <select
                name="quality_grade"
                value={formData.quality_grade}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              >
                <option value="Grade A+">Grade A+ (Premium Organic)</option>
                <option value="Grade A">Grade A (High Quality)</option>
                <option value="Grade B">Grade B (Standard)</option>
                <option value="Grade C">Grade C (Sub-Standard)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Listing Price (in ETH)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Tag className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="price_eth"
                  required
                  value={formData.price_eth}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-450 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="e.g. 0.5"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Estimated value: Rs. {Math.round(parseFloat(formData.price_eth || 0) * 250000).toLocaleString('en-IN')} (at 1 ETH = Rs. 2,50,000)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Quality Certification Status
              </label>
              <select
                name="certification_status"
                value={formData.certification_status}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              >
                <option value="APPROVED">APPROVED (Certify and List)</option>
                <option value="REJECTED">REJECTED (Inspect Fail)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Inspection Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  name="test_date"
                  required
                  value={formData.test_date}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lot Expiration Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  name="expiry_date"
                  required
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-2">
                  <Wallet className="h-4.5 w-4.5" /> Sign Quality Certificate
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
