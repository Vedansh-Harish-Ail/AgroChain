import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { 
  Search, CheckCircle, XCircle, ShieldAlert, Cpu, UserCheck, ArrowLeft, 
  MapPin, ExternalLink, Image, FileText, Award, Download, Clock, ShieldCheck,
  Sprout, Wallet, AlertTriangle, Info, CheckCircle2, X as XIcon
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { ethers } from 'ethers';
import { fetchServerIp, getQrCodeBaseUrl } from '../utils/qr';

// ─── Custom Toast Notification Component ─────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl border shadow-2xl px-4 py-3.5 min-w-[280px] max-w-[380px] backdrop-blur-sm animate-in slide-in-from-right-4 fade-in duration-300 ${
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/80 dark:border-emerald-800'
              : t.type === 'error'
              ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/80 dark:border-rose-800'
              : t.type === 'warning'
              ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/80 dark:border-amber-800'
              : 'bg-blue-50 border-blue-200 dark:bg-blue-950/80 dark:border-blue-800'
          }`}
        >
          <div className={`mt-0.5 shrink-0 ${
            t.type === 'success' ? 'text-emerald-600 dark:text-emerald-400'
            : t.type === 'error' ? 'text-rose-600 dark:text-rose-400'
            : t.type === 'warning' ? 'text-amber-600 dark:text-amber-400'
            : 'text-blue-600 dark:text-blue-400'
          }`}>
            {t.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> 
            : t.type === 'error' ? <XCircle className="h-5 w-5" />
            : t.type === 'warning' ? <AlertTriangle className="h-5 w-5" />
            : <Info className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            {t.title && (
              <p className={`text-xs font-bold mb-0.5 ${
                t.type === 'success' ? 'text-emerald-800 dark:text-emerald-300'
                : t.type === 'error' ? 'text-rose-800 dark:text-rose-300'
                : t.type === 'warning' ? 'text-amber-800 dark:text-amber-300'
                : 'text-blue-800 dark:text-blue-300'
              }`}>{t.title}</p>
            )}
            <p className={`text-xs leading-relaxed ${
              t.type === 'success' ? 'text-emerald-700 dark:text-emerald-400'
              : t.type === 'error' ? 'text-rose-700 dark:text-rose-400'
              : t.type === 'warning' ? 'text-amber-700 dark:text-amber-400'
              : 'text-blue-700 dark:text-blue-400'
            }`}>{t.message}</p>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className={`shrink-0 rounded-lg p-1 transition hover:bg-black/10 dark:hover:bg-white/10 ${
              t.type === 'success' ? 'text-emerald-500'
              : t.type === 'error' ? 'text-rose-500'
              : t.type === 'warning' ? 'text-amber-500'
              : 'text-blue-500'
            }`}
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Custom Confirm Dialog Component ─────────────────────────────────────────
function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 fade-in duration-200">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
          dialog.variant === 'danger' 
            ? 'bg-rose-100 dark:bg-rose-950/50' 
            : 'bg-amber-100 dark:bg-amber-950/50'
        }`}>
          <AlertTriangle className={`h-6 w-6 ${
            dialog.variant === 'danger' 
              ? 'text-rose-600 dark:text-rose-400' 
              : 'text-amber-600 dark:text-amber-400'
          }`} />
        </div>
        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">{dialog.title || 'Are you sure?'}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{dialog.message}</p>
        </div>
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition shadow-md ${
              dialog.variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
            }`}
          >
            {dialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QualityTesting() {
  const { isConnected, connectWallet, contracts, walletAddress } = useWallet();
  const { user } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [inspectionMethod, setInspectionMethod] = useState('PHYSICAL_VISIT');
  const [savingNotes, setSavingNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [txDetails, setTxDetails] = useState(null);
  const [error, setError] = useState('');
  const [selectedCropForLetter, setSelectedCropForLetter] = useState(null);
  const [selectedCropForCertificate, setSelectedCropForCertificate] = useState(null);
  const [serverIp, setServerIp] = useState(null);

  // ─── Toast notification state ───────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info', title = '') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);
  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ─── Confirm dialog state ────────────────────────────────────────────────────
  const [confirmDialog, setConfirmDialog] = useState(null);
  const showConfirm = useCallback((config) => {
    return new Promise((resolve) => {
      setConfirmDialog({ ...config, resolve });
    });
  }, []);
  const handleConfirmOk = () => {
    if (confirmDialog?.resolve) confirmDialog.resolve(true);
    setConfirmDialog(null);
  };
  const handleConfirmCancel = () => {
    if (confirmDialog?.resolve) confirmDialog.resolve(false);
    setConfirmDialog(null);
  };

  const navigate = useNavigate();

  const isWalletMismatched = isConnected && user?.wallet_address && walletAddress && (walletAddress.toLowerCase() !== user.wallet_address.toLowerCase());
  const isWalletNotConnected = !isConnected && user?.wallet_address;
  const isActionDisabled = isWalletMismatched || isWalletNotConnected;



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

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/product/all');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const initServerIp = async () => {
      const ip = await fetchServerIp();
      if (ip) {
        setServerIp(ip);
      }
    };
    initServerIp();
    fetchPendingCrops();
    fetchProducts();
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
      showLoading('Submitting crop approval transaction on-chain...');
      const cropId = crop.id;
      const farmerName = crop.farmer_name || 'Unknown Farmer';
      const farmLocation = crop.farm_location || '';
      const farmSize = crop.farm_size || '0';
      const farmingType = crop.farming_type || 'Organic';
      const cropType = crop.crop_type || '';
      const expectedYield = crop.expected_yield || 0;
      const cultivationTimestamp = Math.floor(new Date(crop.cultivation_date).getTime() / 1000) || 0;
      const farmerWallet = crop.wallet_address || ethers.ZeroAddress;

      // 1. Call Smart Contract `approveFarmer` (the 9-parameter overload)
      const tx = await contracts.farmerRegistry.approveFarmer(
        cropId,
        farmerName,
        farmLocation,
        farmSize,
        farmingType,
        cropType,
        expectedYield,
        cultivationTimestamp,
        farmerWallet
      );

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
          farmerId: cropId,
          farmerName,
          cropType
        })
      });

      // 3. Update status in Database
      await axios.post(`/api/quality/approve/${crop.id}`, {
        tester_remarks: remarks,
        inspection_notes: remarks,
        inspection_method: inspectionMethod,
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      hideLoading();
      addToast(`Farmer crop ID ${crop.id} has been verified and approved on-chain successfully!`, 'success', 'Approved On-Chain ✓');
      setSelectedCrop(null);
      setRemarks('');
      setInspectionMethod('PHYSICAL_VISIT');
      fetchPendingCrops();

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Approval failed. Please try again.');
      setLoading(false);
      hideLoading();
    }
  };

  const handleReject = async (crop) => {
    if (!remarks) {
      setError('Please add inspection remarks detailing the reason for rejection.');
      return;
    }
    const confirmed = await showConfirm({
      title: 'Reject Crop Registration?',
      message: 'This will permanently reject the crop registration. The farmer will be notified. This action cannot be undone.',
      confirmText: 'Yes, Reject',
      variant: 'danger'
    });
    if (!confirmed) return;
    setLoading(true);
    showLoading('Rejecting crop registration...');
    try {
      await axios.post(`/api/quality/reject/${crop.id}`, {
        tester_remarks: remarks,
        inspection_notes: remarks,
        inspection_method: inspectionMethod
      });
      hideLoading();
      addToast('The crop registration has been rejected successfully.', 'warning', 'Crop Rejected');
      setSelectedCrop(null);
      setRemarks('');
      setInspectionMethod('PHYSICAL_VISIT');
      fetchPendingCrops();
    } catch (err) {
      console.error(err);
      hideLoading();
      setError("Failed to reject cultivation project.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!remarks) {
      setError('Please add inspection remarks/notes before saving.');
      return;
    }
    setError('');
    setSavingNotes(true);
    showLoading('Saving inspection remarks...');
    try {
      await axios.post(`/api/quality/save-notes/${selectedCrop.id}`, {
        inspection_notes: remarks,
        inspection_method: inspectionMethod
      });
      hideLoading();
      addToast('Inspection notes saved successfully!', 'info', 'Notes Saved');
      fetchPendingCrops();
    } catch (err) {
      console.error(err);
      hideLoading();
      setError(err.response?.data?.message || 'Failed to save inspection notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCertifyAuto = async (crop) => {
    setError('');
    setTxDetails(null);
    setLoading(true);

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to execute approvals and certification.');
        setLoading(false);
        return;
      }
    }

    try {
      showLoading('Broadcasting quality certification transaction on-chain...');
      const lotNumber = Math.floor(1000 + Math.random() * 9000);
      const cropId = crop.id;
      const cropName = crop.crop_type;
      const qualityGrade = 'Grade A+';
      const priceEth = '1.0';
      const priceWei = ethers.parseEther(priceEth);
      
      const today = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const testTimestamp = Math.floor(new Date(today).getTime() / 1000);
      const expiryTimestamp = Math.floor(new Date(expiry).getTime() / 1000);

      // 1. Call Smart Contract `registerProduct`
      const tx = await contracts.productRegistry.registerProduct(
        lotNumber,
        cropId,
        cropName,
        qualityGrade,
        priceWei,
        testTimestamp,
        expiryTimestamp,
        'APPROVED'
      );

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
        method_name: 'registerProduct',
        event_data: JSON.stringify({
          lotNumber,
          farmerId: cropId,
          cropName,
          qualityGrade,
          price: priceWei.toString()
        })
      });

      // 3. Save to database
      await axios.post('/api/product/register', {
        lot_number: lotNumber,
        farmer_id: cropId,
        crop_name: cropName,
        quality_grade: qualityGrade,
        price: priceWei.toString(),
        test_date: today,
        expiry_date: expiry,
        certification_status: 'APPROVED',
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      hideLoading();
      addToast(`Product Lot ${lotNumber} certified and registered on the blockchain successfully!`, 'success', 'Lot Certified ✓');
      
      // Refresh list
      await fetchPendingCrops();
      await fetchProducts();

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Check MetaMask logs.');
      setLoading(false);
      hideLoading();
    }
  };

  const handleCertifyReject = async (crop) => {
    setError('');
    setTxDetails(null);
    setLoading(true);

    if (!isConnected) {
      const address = await connectWallet();
      if (!address) {
        setError('Please connect your MetaMask wallet to execute approvals and certification.');
        setLoading(false);
        return;
      }
    }

    const lotConfirmed = await showConfirm({
      title: 'Reject Crop Lot Certification?',
      message: 'This will log a FAILED/REJECTED product lot on the blockchain. This action cannot be undone.',
      confirmText: 'Yes, Reject Lot',
      variant: 'danger'
    });
    if (!lotConfirmed) {
      setLoading(false);
      return;
    }

    try {
      showLoading('Broadcasting rejected lot transaction on-chain...');
      const lotNumber = Math.floor(1000 + Math.random() * 9000);
      const cropId = crop.id;
      const cropName = crop.crop_type;
      const qualityGrade = 'Failed / Rejected';
      const priceWei = 0n;
      
      const today = new Date().toISOString().split('T')[0];
      const expiry = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const testTimestamp = Math.floor(new Date(today).getTime() / 1000);
      const expiryTimestamp = Math.floor(new Date(expiry).getTime() / 1000);

      // 1. Call Smart Contract `registerProduct`
      const tx = await contracts.productRegistry.registerProduct(
        lotNumber,
        cropId,
        cropName,
        qualityGrade,
        priceWei,
        testTimestamp,
        expiryTimestamp,
        'REJECTED'
      );

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
        method_name: 'registerProduct',
        event_data: JSON.stringify({
          lotNumber,
          farmerId: cropId,
          cropName,
          qualityGrade,
          price: '0'
        })
      });

      // 3. Save to database
      await axios.post('/api/product/register', {
        lot_number: lotNumber,
        farmer_id: cropId,
        crop_name: cropName,
        quality_grade: qualityGrade,
        price: '0',
        test_date: today,
        expiry_date: expiry,
        certification_status: 'REJECTED',
        tx_hash: tx.hash,
        block_number: blockNumber
      });

      setLoading(false);
      hideLoading();
      addToast(`Product Lot ${lotNumber} has been rejected and logged on the blockchain.`, 'warning', 'Lot Rejected');
      
      // Refresh list
      await fetchPendingCrops();
      await fetchProducts();

    } catch (err) {
      console.error(err);
      setError(err.reason || err.message || 'Transaction failed. Check MetaMask logs.');
      setLoading(false);
      hideLoading();
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

  // Helper to parse evidence documents
  const getDocsList = (evidenceDocs) => {
    if (!evidenceDocs) return [];
    try {
      const parsed = JSON.parse(evidenceDocs);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (typeof evidenceDocs === 'string') {
        return evidenceDocs.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const handleDownloadLetterPDF = () => {
    if (!selectedCropForLetter) return;
    const element = document.getElementById('approval-letter-print-area');
    if (!element) return;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Approval_Letter_Crop_${selectedCropForLetter.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const getFileTypeLabel = (url, index) => {
    if (url.startsWith('data:')) {
      const match = url.match(/data:([^;]+);/);
      if (match && match[1]) {
        const mime = match[1];
        if (mime === 'application/pdf') return `Document Proof #${index + 1} (PDF)`;
        if (mime.includes('image/')) return `Document Proof #${index + 1} (Image)`;
        if (mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return `Document Proof #${index + 1} (Word)`;
        if (mime.includes('excel') || mime.includes('officedocument.spreadsheetml')) return `Document Proof #${index + 1} (Excel)`;
        if (mime.includes('zip') || mime.includes('x-zip-compressed')) return `Document Proof #${index + 1} (ZIP)`;
      }
    } else {
      const parts = url.split('/');
      const rawFilename = parts[parts.length - 1];
      const underscoreIndex = rawFilename.indexOf('_');
      if (underscoreIndex !== -1 && underscoreIndex === 32) {
        return rawFilename.substring(underscoreIndex + 1);
      }
      return rawFilename;
    }
    return `Document Proof #${index + 1}`;
  };

  return (
    <div className="space-y-8 py-4">
      {/* ─── Toast Notifications ─── */}
      <Toast toasts={toasts} removeToast={removeToast} />
      {/* ─── Confirm Dialog ─── */}
      <ConfirmDialog dialog={confirmDialog} onConfirm={handleConfirmOk} onCancel={handleConfirmCancel} />
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
              <UserCheck className="h-6 w-6 text-emerald-600" />
              {user?.role === 'TESTER' ? 'Quality Testing & Certification' : 'Cultivation Quality Approvals'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {user?.role === 'TESTER' 
                ? 'Verify harvested crops, review inspector approvals, and certify batch quality lots on-chain'
                : 'Verify crop locations, survey details, and log them securely on-chain'}
            </p>
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

      {isWalletMismatched && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 font-medium flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-rose-600 animate-pulse shrink-0" />
          <div>
            <strong>Wallet Mismatch:</strong> Your connected MetaMask wallet address (<span className="font-mono text-xs">{walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.slice(-4)}` : ''}</span>) does not match your registered wallet address (<span className="font-mono text-xs">{user.wallet_address ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.slice(-4)}` : ''}</span>).
            Please switch to your registered account in MetaMask to perform actions.
          </div>
        </div>
      )}

      {isWalletNotConnected && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40 font-medium flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
          <div>
            <strong>MetaMask Disconnected:</strong> Please connect your registered MetaMask wallet (<span className="font-mono text-xs">{user.wallet_address ? `${user.wallet_address.substring(0, 6)}...${user.wallet_address.slice(-4)}` : ''}</span>) to perform actions on this page.
          </div>
        </div>
      )}

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
            <div className="space-y-4 animate-pulse">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="h-10 bg-slate-100 dark:bg-slate-850 rounded-xl w-full"></div>
              ))}
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
                    <th className="py-3 px-4">{user?.role === 'TESTER' ? 'Timeline Status' : 'Survey Number'}</th>
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
                      <td className="py-3 px-4 font-mono text-xs">
                        {user?.role === 'TESTER' ? (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            crop.timeline_status === 'PRODUCT_AVAILABLE' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {crop.timeline_status === 'PRODUCT_AVAILABLE' ? 'Certified' : crop.timeline_status.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          crop.land_survey_no || 'N/A'
                        )}
                      </td>
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
                  <span className="text-slate-400 font-medium">District</span>
                  <span className="font-semibold">{selectedCrop.district || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Taluk (Sub-District)</span>
                  <span className="font-semibold">{selectedCrop.sub_district || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-slate-400 font-medium">Village</span>
                  <span className="font-semibold">{selectedCrop.village || 'N/A'}</span>
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
                          <img src={url} alt="Crop Evidence" className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-slate-900/60 backdrop-blur-[1px] px-2 py-1 text-[9px] text-white font-medium truncate select-none">
                            {getFileTypeLabel(url, i)}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Evidence Documents Section */}
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-slate-400 font-medium block mb-2">Evidence Documents</span>
                  {getDocsList(selectedCrop.evidence_documents).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No document evidence submitted.</span>
                  ) : (
                    <div className="space-y-1.5">
                      {getDocsList(selectedCrop.evidence_documents).map((url, i) => (
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          key={i} 
                          className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-350 hover:underline"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{getFileTypeLabel(url, i)}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Remarks/Inspection Input */}
                {user?.role !== 'TESTER' ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                        Inspection Method
                      </label>
                      <select
                        value={inspectionMethod}
                        onChange={(e) => setInspectionMethod(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-white p-2 text-xs focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="PHYSICAL_VISIT">PHYSICAL_VISIT (Physical Visit)</option>
                        <option value="PHOTO_REVIEW">PHOTO_REVIEW (Photo Review)</option>
                        <option value="HYBRID">HYBRID (Hybrid)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                        Inspector remarks / verification notes
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
                ) : (
                  <div className="space-y-2.5">
                    {selectedCrop.inspection_method && (
                      <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-xs">
                        <span className="text-slate-400 font-medium">Inspection Method</span>
                        <span className="font-semibold font-mono">{selectedCrop.inspection_method}</span>
                      </div>
                    )}
                    {selectedCrop.tester_remarks && (
                      <div className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inspector Remarks</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 italic">"{selectedCrop.tester_remarks}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {user?.role === 'TESTER' ? (
                <div className="space-y-4 pt-2">
                  {(() => {
                    const matchedProduct = products.find(p => p.farmer_id === selectedCrop.id);
                    return (
                      <div className="space-y-3">
                        {matchedProduct ? (
                          matchedProduct.certification_status === 'REJECTED' ? (
                            <div className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/30 px-3 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                              <XCircle className="h-4 w-4" /> Rejected Lot: #{matchedProduct.lot_number}
                            </div>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-95/30 px-3 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950">
                              <ShieldCheck className="h-4 w-4" /> Certified Lot: #{matchedProduct.lot_number}
                            </div>
                          )
                        ) : (
                          <div className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-95/30 px-3 py-2.5 rounded-xl border border-amber-100 dark:border-amber-950">
                            <Clock className="h-4 w-4 animate-pulse" /> Awaiting Certification
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedCropForLetter(selectedCrop)}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 py-2.5 rounded-xl transition"
                        >
                          <FileText className="h-4 w-4" /> View Approval Letter
                        </button>

                        {matchedProduct ? (
                          matchedProduct.certification_status !== 'REJECTED' && (
                            <button
                              onClick={() => setSelectedCropForCertificate({ crop: selectedCrop, product: matchedProduct })}
                              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-50/50 dark:hover:bg-amber-955/30 py-2.5 rounded-xl transition"
                            >
                              <Award className="h-4 w-4" /> Print Certificate & QR
                            </button>
                          )
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => handleCertifyReject(selectedCrop)}
                              disabled={loading || isActionDisabled}
                              className="flex justify-center items-center gap-1.5 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-955/30 dark:hover:bg-rose-950/20 text-xs font-bold transition disabled:opacity-50"
                            >
                              {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-600 border-t-transparent"></div>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4" /> Reject Lot
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleCertifyAuto(selectedCrop)}
                              disabled={loading || isActionDisabled}
                              className="flex justify-center items-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold transition disabled:opacity-50"
                            >
                              {loading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" /> Approve Lot
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

              ) : selectedCrop.is_approved ? (
                <div className="space-y-3 pt-2">
                  <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <ShieldCheck className="h-4.5 w-4.5" /> Cultivation Verified & Approved
                  </div>
                </div>
              ) : selectedCrop.verification_status === 'REJECTED' ? (
                <div className="space-y-3 pt-2">
                  <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/20 px-3 py-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <XCircle className="h-4.5 w-4.5" /> Cultivation Rejected
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={loading || savingNotes || isActionDisabled}
                    className="w-full flex justify-center items-center gap-1.5 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-750 dark:bg-slate-700 dark:hover:bg-slate-650 text-xs font-bold transition disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes (No MetaMask)'}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleReject(selectedCrop)}
                      disabled={loading || savingNotes || isActionDisabled}
                      className="flex justify-center items-center gap-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-xs font-bold transition disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" /> Reject Crop
                    </button>
                    <button
                      onClick={() => handleApprove(selectedCrop)}
                      disabled={loading || savingNotes || isActionDisabled}
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
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-350 p-8 text-center text-slate-400 dark:border-slate-850 dark:text-slate-500">
              Select a crop from the list to view specifications and perform audits.
            </div>
          )}
        </div>
      </div>

      {/* Printer styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${selectedCropForLetter ? `
            #approval-letter-print-area, #approval-letter-print-area * {
              visibility: visible;
            }
            #approval-letter-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              background: transparent !important;
              color: black !important;
            }
          ` : ''}
          ${selectedCropForCertificate ? `
            #batch-certificate-print-area, #batch-certificate-print-area * {
              visibility: visible;
            }
            #batch-certificate-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: 4px double #10b981 !important;
              padding: 24px !important;
              margin: 0 !important;
              background: transparent !important;
              color: black !important;
            }
          ` : ''}
        }
      `}</style>

      {/* Modal 1: Approval Letter */}
      {selectedCropForLetter && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar print:p-0 print:bg-transparent print:relative">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-auto print:border-none print:shadow-none print:p-0 print:m-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" /> Crop Verification Approval Letter
              </h3>
              <button
                onClick={() => setSelectedCropForLetter(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-sm font-semibold transition"
              >
                Close
              </button>
            </div>

            {/* Letter Content (Print Target) */}
            <div id="approval-letter-print-area" className="space-y-6 font-serif text-slate-800 dark:text-slate-200 p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl print:border-none print:p-0 print:text-black">
              <div className="text-center space-y-2 border-b border-slate-250 pb-4 print:border-slate-300">
                <div className="flex justify-center items-center gap-2">
                  <Sprout className="h-8 w-8 text-emerald-600" />
                  <span className="font-sans font-extrabold text-xl tracking-wider text-slate-900 dark:text-white print:text-black">AGROCHAIN TRANSPARENCY LABS</span>
                </div>
                <p className="font-sans text-[10px] text-slate-400 uppercase tracking-widest">Quality Assurance & Organic Verification Department</p>
              </div>

              <div className="flex justify-between text-xs font-sans text-slate-400">
                <span>Ref ID: #AC-CROP-{selectedCropForLetter.id}</span>
                <span>Date: {selectedCropForLetter.verification_date ? new Date(selectedCropForLetter.verification_date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>

              <div className="space-y-4 text-sm leading-relaxed">
                <p className="font-bold font-sans text-slate-900 dark:text-white print:text-black">TO WHOMSOEVER IT MAY CONCERN</p>
                <p>
                  This official document serves as a certificate of compliance confirming that the crop cultivation lot registered by
                  <strong> {selectedCropForLetter.farmer_name}</strong> under ID <strong>#{selectedCropForLetter.id}</strong> has passed all rigorous chemical-free farming standards, soil health toxicity tests, and ownership deed verifications conducted on-site by our authorized verifiers.
                </p>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-sans text-xs my-4 print:bg-slate-100 print:text-black">
                  <div>
                    <span className="text-slate-450 block mb-0.5">Crop Cultivation Type</span>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">{selectedCropForLetter.crop_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block mb-0.5">Farming Methodology</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{selectedCropForLetter.farming_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block mb-0.5">Verified Area Size</span>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">{selectedCropForLetter.farm_size}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block mb-0.5">Land Survey Deed No</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white print:text-black">{selectedCropForLetter.land_survey_no || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-455 block mb-0.5">GPS Verification Coordinates</span>
                    <span className="font-mono text-slate-900 dark:text-white print:text-black">
                      Latitude: {selectedCropForLetter.gps_latitude} • Longitude: {selectedCropForLetter.gps_longitude}
                    </span>
                  </div>
                </div>

                <p>
                  The chemical checks and soil nitrogen audits align with organic parameters. The farm has been successfully logged on the immutable blockchain registry for trace-back safety.
                </p>
              </div>

              <div className="flex justify-between items-end pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1 font-sans text-xs max-w-md">
                  <span className="text-slate-400 block font-semibold uppercase tracking-wider text-[9px]">Tester Remarks</span>
                  <p className="italic text-slate-650 dark:text-slate-400 print:text-black">"{selectedCropForLetter.tester_remarks || 'All chemical and organic indicators check out. Approved.'}"</p>
                </div>
                <div className="text-center shrink-0 w-36 font-sans">
                  <div className="border-b border-slate-300 pb-1">
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 italic font-bold print:text-black"> {selectedCropForLetter.tester_name || 'Dr. Anita Sharma'} </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 uppercase tracking-wider">Authorized Tester</span>
                </div>
              </div>

              {selectedCropForLetter.tx_hash && (
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl font-mono text-[9px] text-slate-400 border border-slate-100 dark:border-slate-850 mt-4 flex justify-between items-center print:bg-slate-100 print:text-black">
                  <span>Ledger Block Height: #{selectedCropForLetter.block_number || 'N/A'}</span>
                  <span className="truncate max-w-[280px]">Tx: {selectedCropForLetter.tx_hash}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedCropForLetter(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Print Letter
              </button>
              <button
                onClick={handleDownloadLetterPDF}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Quality Certificate */}
      {selectedCropForCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar print:p-0 print:bg-transparent print:relative">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" /> Certified Batch Quality Certificate
              </h3>
              <button
                onClick={() => setSelectedCropForCertificate(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-sm font-semibold transition"
              >
                Close
              </button>
            </div>

            {/* Certificate Content */}
            <div id="batch-certificate-print-area" className="border-4 border-double border-emerald-500 rounded-2xl p-6 space-y-6 bg-gradient-to-br from-emerald-50/10 to-teal-50/10 dark:from-slate-950 dark:to-slate-900 print:bg-transparent print:border-emerald-600 print:text-black">
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase tracking-wider text-[10px] print:bg-emerald-100 print:text-emerald-800">
                    Blockchain Certified Lot
                  </span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white print:text-black">
                  QUALITY CERTIFICATE & TRUST SEAL
                </h2>
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest font-sans">Issued under Decentralized Product Registry</p>
              </div>

              <div className="grid grid-cols-2 gap-6 items-center border-y border-slate-200 dark:border-slate-850 py-6 print:border-slate-300">
                {/* Left Details */}
                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Product Lot Number</span>
                    <span className="text-lg font-mono font-bold text-slate-950 dark:text-white print:text-black">#{selectedCropForCertificate.product.lot_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Crop / Cultivation Name</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white print:text-black">{selectedCropForCertificate.product.crop_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Certified Quality Grade</span>
                    <span className="inline-block px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-450 dark:border-emerald-900 font-bold text-xs mt-1">
                      {selectedCropForCertificate.product.quality_grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Inspection Test Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{new Date(selectedCropForCertificate.product.test_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Batch Expiry Date</span>
                    <span className="font-semibold text-slate-805 dark:text-slate-200 print:text-black">{new Date(selectedCropForCertificate.product.expiry_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right QR Code Link */}
                <div className="flex flex-col items-center space-y-2 shrink-0">
                  <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white shadow-sm print:border-slate-300">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                        getQrCodeBaseUrl(serverIp) + '/explorer?lot=' + selectedCropForCertificate.product.lot_number
                      )}`}
                      alt="Product Batch QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 uppercase font-semibold text-center leading-tight tracking-wider font-sans max-w-[130px]">
                    Scan QR to Trace Immutable Ledger Proof
                  </span>
                </div>
              </div>

              {selectedCropForCertificate.product.tx_hash && (
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 p-3 rounded-xl font-mono text-[9px] text-slate-400 leading-relaxed space-y-1 print:bg-slate-100 print:text-black">
                  <div className="flex justify-between">
                    <span>MINT BLOCK HEIGHT</span>
                    <span className="font-bold text-slate-950 dark:text-white print:text-black">#{selectedCropForCertificate.product.block_number}</span>
                  </div>
                  <div className="truncate text-left">
                    <span>TX HASH: {selectedCropForCertificate.product.tx_hash}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedCropForCertificate(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Print Certificate
              </button>
              <button
                onClick={handleDownloadCertificatePDF}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
