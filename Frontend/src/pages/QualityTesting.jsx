import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Search, CheckCircle, XCircle, ShieldAlert, Cpu, UserCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function QualityTesting() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const [crops, setCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [txDetails, setTxDetails] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchPendingCrops = async () => {
    try {
      const res = await axios.get('/api/quality/pending');
      setCrops(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending crops.');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPendingCrops();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      fetchPendingCrops();
      return;
    }
    setLoadingList(true);
    try {
      const res = await axios.get(`/api/farmer/${searchQuery}`);
      setCrops([res.data]);
    } catch (err) {
      setCrops([]);
      setError('Farmer Crop ID not found in database.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleApprove = async (crop) => {
    setError('');
    setTxDetails(null);
    setLoading(true);

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to execute approvals.');
        setLoading(false);
        return;
      }
    }

    try {
      // 1. Call Smart Contract
      const tx = await contracts.farmerRegistry.approveFarmer(crop.id);
      setTxDetails({ step: 'broadcasting', hash: tx.hash });

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
        method_name: 'approveFarmer',
        event_data: JSON.stringify({
          farmerId: crop.id,
          farmerName: crop.farmer_name,
          verifier: tx.from
        })
      });

      // 3. Update status in Database
      await axios.post(`/api/quality/approve/${crop.id}`, {
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      alert(`Farmer crop ID ${crop.id} has been approved on-chain!`);
      
      // Proceed directly to certify product lot
      navigate('/tester/product', { state: { cropId: crop.id, cropName: crop.crop_type } });

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Check MetaMask logs.');
      setLoading(false);
    }
  };

  const handleReject = async (crop) => {
    if (!window.confirm("Are you sure you want to reject this crop registration?")) return;
    setLoading(true);
    try {
      await axios.post(`/api/quality/reject/${crop.id}`);
      alert("Crop rejected.");
      setSelectedCrop(null);
      fetchPendingCrops();
    } catch (err) {
      console.error(err);
      setError("Failed to reject cultivation project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-emerald-600" /> Cultivation Quality Approvals
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Search farmer crop listings and verify agricultural credentials on-chain</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search Crop ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {txDetails && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs dark:bg-slate-950 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {txDetails.step === 'broadcasting' ? 'Approve transaction broadcasting...' : 'Transaction Confirmed!'}
            </span>
          </div>
          <p className="font-mono text-slate-500 dark:text-slate-400">Hash: {txDetails.hash}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Side: Pending Crops Table */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Pending Crop Cultivations</h3>
          
          {loadingList ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : crops.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No pending cultivations found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Crop ID</th>
                    <th className="py-3 px-4">Farmer</th>
                    <th className="py-3 px-4">Crop Type</th>
                    <th className="py-3 px-4">Yield (kg)</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((crop) => (
                    <tr
                      key={crop.id}
                      onClick={() => setSelectedCrop(crop)}
                      className={`border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                        selectedCrop?.id === crop.id ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{crop.id}</td>
                      <td className="py-3 px-4">{crop.farmer_name}</td>
                      <td className="py-3 px-4 font-semibold">{crop.crop_type}</td>
                      <td className="py-3 px-4">{crop.expected_yield}</td>
                      <td className="py-3 px-4">{new Date(crop.cultivation_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Crop Details Inspection Card */}
        <div>
          {selectedCrop ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white">Inspection Panel</h3>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Crop ID</span>
                  <span className="font-mono font-semibold">{selectedCrop.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Farmer Name</span>
                  <span className="font-semibold">{selectedCrop.farmer_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Location</span>
                  <span>{selectedCrop.farm_location}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Farm Size</span>
                  <span>{selectedCrop.farm_size}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Farming Method</span>
                  <span className="font-semibold text-emerald-600">{selectedCrop.farming_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Expected Yield</span>
                  <span className="font-semibold">{selectedCrop.expected_yield} kg</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400">Wallet Address</span>
                  <span className="font-mono text-xs">{selectedCrop.wallet_address || 'Not Linked'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleReject(selectedCrop)}
                  disabled={loading}
                  className="flex justify-center items-center gap-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-xs font-bold transition disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" /> Reject Crop
                </button>
                <button
                  onClick={() => handleApprove(selectedCrop)}
                  disabled={loading}
                  className="flex justify-center items-center gap-1 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold transition disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Approve Crop
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-350 p-8 text-center text-slate-400 dark:border-slate-850 dark:text-slate-500">
              Select a crop from the list to view specifications and perform audits.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
