import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Sprout, ShieldCheck, ArrowLeft, Cpu } from 'lucide-react';
import axios from 'axios';

export default function CropHistory() {
  const { user } = useAuth();
  const { isConnected, connectWallet, contracts } = useWallet();
  const [myCrops, setMyCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const navigate = useNavigate();

  const fetchCrops = async () => {
    try {
      const res = await axios.get('/api/farmer/my-crops');
      setMyCrops(res.data);
    } catch (err) {
      console.error("Failed to load crop history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleLazyVerify = async (crop) => {
    if (!isConnected) {
      const address = await connectWallet();
      if (!address) return;
    }

    try {
      setVerifying(crop.id);
      const farmerId = Math.floor(Date.now() / 1000);
      const cultivationTimestamp = Math.floor(new Date(crop.cultivation_date).getTime() / 1000);

      // 1. Contract Call
      const tx = await contracts.farmerRegistry.registerFarmer(
        farmerId,
        user.name,
        crop.farm_location,
        crop.farm_size,
        crop.farming_type,
        crop.crop_type,
        parseInt(crop.expected_yield),
        cultivationTimestamp
      );

      const receipt = await tx.wait();
      
      // 2. Log to Explorer
      await axios.post('/api/explorer/log-tx', {
        tx_hash: tx.hash,
        block_number: receipt.blockNumber,
        from_address: tx.from,
        to_address: tx.to,
        amount: 0,
        method_name: 'registerFarmer (Lazy)',
        event_data: JSON.stringify({ farmerId, cropId: crop.id })
      });

      // 3. Update DB
      await axios.post(`/api/farmer/update-blockchain-status/${crop.id}`, {
        tx_hash: tx.hash,
        block_number: receipt.blockNumber
      });

      // Refresh list
      await fetchCrops();
      alert('Crop successfully verified on blockchain!');
    } catch (err) {
      console.error(err);
      alert('Verification failed. Please try again.');
    } finally {
      setVerifying(null);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <Sprout className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Crop Registration History
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your registered crops, view details, and complete blockchain verifications.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : myCrops.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <Sprout className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Registered Crops</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            You haven't registered any crops yet. Go back to the dashboard and select "Register Crops" to list your first cultivation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCrops.map(crop => (
              <div key={crop.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-6 hover:shadow-md transition">
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl shrink-0 self-start ${crop.blockchain_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
                    <Sprout className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{crop.crop_type}</h4>
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span> {crop.farm_location}</p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Size:</span> {crop.farm_size}</p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Expected Yield:</span> {crop.expected_yield}kg</p>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                      Farming: <span className="capitalize">{crop.farming_type}</span> • Registered: {new Date(crop.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {crop.blockchain_status === 'VERIFIED' ? (
                    <div className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl">
                      <ShieldCheck className="h-4 w-4" /> Blockchain Verified
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleLazyVerify(crop)}
                      disabled={verifying === crop.id}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      {verifying === crop.id ? (
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      ) : <ShieldCheck className="h-4 w-4" />}
                      Verify Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
