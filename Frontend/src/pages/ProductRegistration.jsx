import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { FileCheck, Wallet, Search, CheckCircle, AlertCircle, Loader, ArrowLeft, Info } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function ProductRegistration() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const { showToast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const location = useLocation();
  const navigate = useNavigate();

  const [cropId, setCropId] = useState('');
  const [cropData, setCropData] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('idle'); // idle | loading | found | not_found | error
  const [qualityGrade, setQualityGrade] = useState('A+');
  const [testerRemarks, setTesterRemarks] = useState('');
  const [lotNumber] = useState(Math.floor(1000 + Math.random() * 9000));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [txDetails, setTxDetails] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (location.state?.cropId) {
      const id = String(location.state.cropId);
      setCropId(id);
      fetchCropDetails(id);
    }
  }, [location.state]);

  const fetchCropDetails = async (id) => {
    if (!id || isNaN(parseInt(id))) {
      setCropData(null);
      setFetchStatus('idle');
      return;
    }
    setFetchStatus('loading');
    setCropData(null);
    try {
      const res = await axios.get(`/api/quality/crop/${id}`);
      const crop = res.data?.crop || res.data;
      if (crop && crop.crop_type) {
        setCropData(crop);
        setFetchStatus('found');
      } else {
        setFetchStatus('not_found');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setFetchStatus('not_found');
      } else {
        setFetchStatus('error');
      }
    }
  };

  const handleCropIdChange = (e) => {
    const val = e.target.value;
    setCropId(val);
    setCropData(null);
    setFetchStatus(val ? 'idle' : 'idle');
    clearTimeout(debounceRef.current);
    if (val) {
      debounceRef.current = setTimeout(() => fetchCropDetails(val), 600);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTxDetails(null);

    if (!cropData || fetchStatus !== 'found') {
      setError('Please enter a valid Crop ID and wait for crop details to load.');
      return;
    }

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
      const lot = lotNumber;
      const farmerId = parseInt(cropId);
      const derivedStatus = qualityGrade === 'C' ? 'REJECTED' : 'APPROVED';
      const priceWei = ethers.parseEther('1.0');
      const testTimestamp = Math.floor(Date.now() / 1000);
      const expiryTimestamp = Math.floor((Date.now() + 180 * 24 * 60 * 60 * 1000) / 1000);
      const cropName = cropData.crop_type;

      const tx = await contracts.productRegistry.registerProduct(
        lot,
        farmerId,
        cropName,
        qualityGrade,
        priceWei,
        testTimestamp,
        expiryTimestamp,
        derivedStatus
      );

      setTxDetails({ step: 'broadcasting', hash: tx.hash });
      const receipt = await tx.wait();
      const blockNumber = receipt.blockNumber;
      setTxDetails({ step: 'confirmed', hash: tx.hash, block: blockNumber });

      await axios.post('/api/explorer/log-tx', {
        tx_hash: tx.hash,
        block_number: blockNumber,
        from_address: tx.from,
        to_address: tx.to,
        amount: 0,
        method_name: 'registerProduct',
        event_data: JSON.stringify({ lotNumber: lot, farmerId, cropName, qualityGrade })
      });

      const today = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await axios.post('/api/product/register', {
        lot_number: lot,
        farmer_id: farmerId,
        crop_name: cropName,
        quality_grade: qualityGrade,
        price: priceWei.toString(),
        test_date: today,
        expiry_date: expiry,
        certification_status: derivedStatus,
        tester_remarks: testerRemarks,
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      hideLoading();
      showToast(`Product Lot ${lot} certified and registered on the blockchain successfully!`, 'success');
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Verify farmer is approved on-chain.');
      setLoading(false);
      hideLoading();
    }
  };

  const isApproved = qualityGrade !== 'C';

  return (
    <div className="max-w-xl mx-auto py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">

        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 rounded-2xl">
            <FileCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Issue Quality Certificate</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Certify a harvested crop batch and register on blockchain</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Tx status */}
        {txDetails && (
          <div className="mb-5 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {txDetails.step === 'broadcasting' ? 'Registering on blockchain...' : 'Transaction Confirmed!'}
              </span>
            </div>
            <p className="font-mono text-slate-500 dark:text-slate-400 break-all">Tx: {txDetails.hash}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Crop ID input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Crop ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="number"
                value={cropId}
                onChange={handleCropIdChange}
                className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-10 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="Enter Crop ID (e.g. 5)"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {fetchStatus === 'loading' && <Loader className="h-4 w-4 text-slate-400 animate-spin" />}
                {fetchStatus === 'found' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                {(fetchStatus === 'not_found' || fetchStatus === 'error') && <AlertCircle className="h-4 w-4 text-rose-500" />}
              </div>
            </div>
            {fetchStatus === 'not_found' && (
              <p className="mt-1 text-xs text-rose-500">No approved crop found with this ID.</p>
            )}
          </div>

          {/* Auto-fetched crop info card */}
          {fetchStatus === 'found' && cropData && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 uppercase tracking-wide">
                <CheckCircle className="h-3.5 w-3.5" /> Crop Details
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Crop Name</span>
                  <p className="font-semibold text-slate-800 dark:text-white">{cropData.crop_type}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Farmer</span>
                  <p className="font-semibold text-slate-800 dark:text-white">{cropData.farmer_name || cropData.name || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">District</span>
                  <p className="font-semibold text-slate-800 dark:text-white">{cropData.district || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Expected Yield</span>
                  <p className="font-semibold text-slate-800 dark:text-white">{cropData.expected_yield ? `${cropData.expected_yield} kg` : '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Farming Method</span>
                  <p className="font-semibold text-slate-800 dark:text-white">{cropData.farming_type || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs block">Lot Number</span>
                  <p className="font-semibold text-slate-800 dark:text-white">#{lotNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quality Grade */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Quality Grade <span className="text-rose-500">*</span>
            </label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
            >
              <option value="A+">Grade A+ (Premium Organic)</option>
              <option value="A">Grade A (High Quality)</option>
              <option value="B+">Grade B+ (Very Good)</option>
              <option value="B">Grade B (Standard)</option>
              <option value="C">Grade C (Sub-Standard / Reject)</option>
            </select>
            <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isApproved
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
            }`}>
              {isApproved
                ? <><CheckCircle className="h-3 w-3" /> Will be APPROVED &amp; listed</>
                : <><AlertCircle className="h-3 w-3" /> Will be REJECTED</>
              }
            </div>
          </div>

          {/* Tester Remarks */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tester Remarks <span className="text-slate-400 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={testerRemarks}
              onChange={(e) => setTesterRemarks(e.target.value)}
              rows={3}
              className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm resize-none"
              placeholder="e.g. Excellent quality. No signs of pest damage. Moisture within acceptable range."
            />
          </div>

          {/* Info note */}
          <div className="flex gap-2 items-start text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Certificate date and lot expiry are automatically recorded at the time of signing.</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || fetchStatus !== 'found'}
            className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Sign Quality Certificate
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

