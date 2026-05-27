import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { Sprout, Wallet, FileText, Calendar, Compass, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function FarmerRegistration() {
  const { user } = useAuth();
  const { isConnected, connectWallet, contracts } = useWallet();
  const [formData, setFormData] = useState({
    farm_location: '',
    farm_size: '',
    farming_type: 'Organic',
    crop_type: '',
    expected_yield: '',
    cultivation_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [txDetails, setTxDetails] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        setError('Please connect your MetaMask wallet to register details on the blockchain.');
        setLoading(false);
        return;
      }
    }

    try {
      // Generate a unique Farmer/Project ID based on timestamp
      const farmerId = Math.floor(Date.now() / 1000);
      const cultivationTimestamp = Math.floor(new Date(formData.cultivation_date).getTime() / 1000);

      // 1. Call Smart Contract
      const tx = await contracts.farmerRegistry.registerFarmer(
        farmerId,
        user.name,
        formData.farm_location,
        formData.farm_size,
        formData.farming_type,
        formData.crop_type,
        parseInt(formData.expected_yield),
        cultivationTimestamp
      );

      setTxDetails({ step: 'broadcasting', hash: tx.hash });

      // Wait for block confirmation
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
        method_name: 'registerFarmer',
        event_data: JSON.stringify({
          farmerId,
          farmerName: user.name,
          cropType: formData.crop_type,
          farmingType: formData.farming_type
        })
      });

      // 3. Save to database
      await axios.post('/api/farmer/register', {
        ...formData,
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      alert('Crop details registered on blockchain and database successfully!');
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Check your MetaMask settings.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Register Crop Cultivation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Record crop details to the blockchain ledger</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
            {error}
          </div>
        )}

        {txDetails && (
          <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {txDetails.step === 'broadcasting' ? 'Transaction broadcasting...' : 'Transaction Confirmed!'}
              </span>
            </div>
            <div className="space-y-1 font-mono text-slate-500 dark:text-slate-400">
              <p>Tx Hash: <span className="text-slate-700 dark:text-slate-300">{txDetails.hash}</span></p>
              {txDetails.block && <p>Block Number: <span className="text-slate-700 dark:text-slate-300">{txDetails.block}</span></p>}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Farm Location
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Compass className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="farm_location"
                  required
                  value={formData.farm_location}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="Pune, Maharashtra"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Farm Size
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="farm_size"
                  required
                  value={formData.farm_size}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="e.g. 5 Hectares"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Farming Type
              </label>
              <select
                name="farming_type"
                value={formData.farming_type}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              >
                <option value="Organic">Organic Farming</option>
                <option value="Non-Organic">Non-Organic Farming</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Crop Name / Type
              </label>
              <input
                type="text"
                name="crop_type"
                required
                value={formData.crop_type}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="Basmati Rice, Alphonso Mango, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Yield (in kg)
              </label>
              <input
                type="number"
                name="expected_yield"
                required
                value={formData.expected_yield}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="e.g. 2500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cultivation Start Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  name="cultivation_date"
                  required
                  value={formData.cultivation_date}
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
                  <Wallet className="h-4.5 w-4.5" /> Submit to Blockchain & DB
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
