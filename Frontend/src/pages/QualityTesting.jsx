import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { Search, CheckCircle, XCircle, ShieldAlert, Cpu, UserCheck, ArrowLeft, MapPin, ExternalLink, Image } from 'lucide-react';
import axios from 'axios';

export default function QualityTesting() {
  const { isConnected, connectWallet, contracts } = useWallet();
  const [crops, setCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [remarks, setRemarks] = useState('');
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

    if (!remarks) {
      setError('Please add inspection remarks before approving.');
      setLoading(false);
      return;
    }

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to execute approvals.');
        setLoading(false);
        return;
      }
    }

    try {
      let tx;
      // 1. Call Smart Contract
      if (crop.blockchain_status === 'DB_ONLY') {
        const cultivationTimestamp = Math.floor(new Date(crop.cultivation_date).getTime() / 1000);
        const farmerWallet = crop.wallet_address || "0x0000000000000000000000000000000000000000";

        tx = await contracts.farmerRegistry["approveFarmer(uint256,string,string,string,string,string,uint256,uint256,address)"](
          crop.id,
          crop.farmer_name || "Unknown Farmer",
          crop.farm_location || "",
          crop.farm_size || "",
          crop.farming_type || "Organic",
          crop.crop_type || "",
          parseInt(crop.expected_yield || 0),
          cultivationTimestamp,
          farmerWallet
        );
      } else {
        tx = await contracts.farmerRegistry["approveFarmer(uint256)"](crop.id);
      }

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
          verifier: tx.from,
          surveyNo: crop.land_survey_no
        })
      });

      // 3. Update status in Database
      await axios.post(`/api/quality/approve/${crop.id}`, {
        tx_hash: tx.hash,
        block_number: blockNumber,
        tester_remarks: remarks
      });

      setLoading(false);
      alert(`Farmer crop ID ${crop.id} has been verified and registered on-chain successfully!`);
      setSelectedCrop(null);
      setRemarks('');
      fetchPendingCrops();

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Check MetaMask logs.');
      setLoading(false);
    }
  };

  const handleReject = async (crop) => {
    if (!remarks) {
      setError('Please add inspection remarks detailing the reason for rejection.');
      return;
    }
    if (!window.confirm("Are you sure you want to reject this crop registration?")) return;
    setLoading(true);
    try {
      await axios.post(`/api/quality/reject/${crop.id}`, {
        tester_remarks: remarks
      });
      alert("Crop rejected.");
      setSelectedCrop(null);
      setRemarks('');
      fetchPendingCrops();
    } catch (err) {
      console.error(err);
      setError("Failed to reject cultivation project.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to parse evidence photos
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
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Verify crop locations, survey details, and log them securely on-chain</p>
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
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-medium">
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
                    <th className="py-3 px-4">Survey Number</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {crops.map((crop) => (
                    <tr
                      key={crop.id}
                      onClick={() => {
                        setSelectedCrop(crop);
                        setRemarks('');
                        setError('');
                      }}
                      className={`border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition ${
                        selectedCrop?.id === crop.id ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{crop.id}</td>
                      <td className="py-3 px-4">{crop.farmer_name}</td>
                      <td className="py-3 px-4 font-semibold">{crop.crop_type}</td>
                      <td className="py-3 px-4 font-mono text-xs">{crop.land_survey_no || 'N/A'}</td>
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
                  <span className="text-slate-400 font-medium">Crop ID</span>
                  <span className="font-mono font-semibold">{selectedCrop.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Farmer Name</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-250">{selectedCrop.farmer_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Survey Number</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-250">{selectedCrop.land_survey_no || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Location</span>
                  <span className="text-right max-w-[180px] truncate">{selectedCrop.farm_location}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">GPS Coordinates</span>
                  <span className="font-mono text-xs flex flex-col items-end">
                    <span>Lat: {selectedCrop.gps_latitude}</span>
                    <span>Lng: {selectedCrop.gps_longitude}</span>
                    {selectedCrop.gps_latitude && selectedCrop.gps_longitude && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedCrop.gps_latitude},${selectedCrop.gps_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 mt-1 font-semibold"
                      >
                        <MapPin className="h-3 w-3" /> View on Map <ExternalLink className="h-2 w-2" />
                      </a>
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Farm Size</span>
                  <span>{selectedCrop.farm_size}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Farming Method</span>
                  <span className="font-semibold text-emerald-600">{selectedCrop.farming_type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Expected Yield</span>
                  <span className="font-semibold">{selectedCrop.expected_yield} kg</span>
                </div>

                {/* Evidence Photos Section */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-slate-400 font-medium block mb-2">Evidence Photos</span>
                  {getPhotosList(selectedCrop.evidence_photos).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No photo evidence submitted.</span>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {getPhotosList(selectedCrop.evidence_photos).map((url, i) => (
                        <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 aspect-square hover:opacity-80 transition block">
                          <img src={url} alt="Crop Evidence" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remarks Input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    Inspector remarks / verification details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter details on soil test, survey matching, pesticide levels, and verification status..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white p-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  ></textarea>
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
