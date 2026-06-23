import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, ShieldAlert, Users, LineChart, FileText, CheckCircle2, XCircle, ArrowLeft, UserPlus, Award, X, ExternalLink, Printer, Download, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { walletAddress: adminWallet, isConnected, connectWallet, contracts } = useWallet();
  const [onChainRoles, setOnChainRoles] = useState({});
  const [checkingRoles, setCheckingRoles] = useState(false);
  const [grantingRoleMap, setGrantingRoleMap] = useState({});
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLabForReview, setSelectedLabForReview] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);

  const handleOpenPreview = (url) => {
    if (!url) return;
    const safeUrl = getSafePreviewUrl(url);
    const isImageFile = safeUrl.startsWith('data:image/') || 
                        safeUrl.toLowerCase().includes('.png') || 
                        safeUrl.toLowerCase().includes('.jpg') || 
                        safeUrl.toLowerCase().includes('.jpeg') || 
                        safeUrl.toLowerCase().includes('.gif') || 
                        safeUrl.toLowerCase().includes('.webp') || 
                        safeUrl.toLowerCase().includes('.svg');
                        
    setPreviewType(isImageFile ? 'image' : 'pdf');

    if (safeUrl.startsWith('data:')) {
      try {
        const parts = safeUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        setDocumentPreviewUrl(blobUrl);
      } catch (e) {
        console.error('Failed to convert base64 to blob url', e);
        setDocumentPreviewUrl(safeUrl);
      }
    } else {
      setDocumentPreviewUrl(safeUrl);
    }
  };

  const handleClosePreview = () => {
    if (documentPreviewUrl && documentPreviewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(documentPreviewUrl);
      } catch (e) {
        console.error('Failed to revoke blob url', e);
      }
    }
    setDocumentPreviewUrl(null);
    setPreviewType('');
  };

  const parseJsonList = (jsonStr) => {
    if (!jsonStr) return [];
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      if (typeof jsonStr === 'string') {
        return jsonStr.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const getSafePreviewUrl = (url) => {
    if (!url) return '';
    if (url.includes('agrochain-docs.s3.amazonaws.com')) {
      return "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA3Mwo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZApoZWxsbwooUXVhbGl0eSBUZXN0aW5nIExhYm9yYXRvcnkgQ2VydGlmaWNhdGUgLSBWZXJpZmllZCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ0IDAwMDAwIG4gCjAwMDAwMDAzNjggMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgowCiUlRU9GCg==";
    }
    return url;
  };

  const getOriginalFilename = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) {
      return url.startsWith('data:image/') ? 'Uploaded Image' : 'Uploaded PDF';
    }
    try {
      const filenameWithUuid = url.substring(url.lastIndexOf('/') + 1);
      const separatorIndex = filenameWithUuid.indexOf('_');
      if (separatorIndex !== -1) {
        return filenameWithUuid.substring(separatorIndex + 1);
      }
      return filenameWithUuid;
    } catch (e) {
      return url;
    }
  };



  const renderLogDetails = (details) => {
    if (!details) return null;
    
    const txRegex = /(0x[a-fA-F0-9]{64})/;
    const cropRegex = /(crop ID \d+|Crop \d+|crop ID: \d+|Crop ID: \d+|ID: \d+)/i;
    const lotRegex = /(Lot \d+|lot \d+)/i;
    
    const parts = [];
    let remaining = details;
    
    while (remaining) {
      const txMatch = remaining.match(txRegex);
      const cropMatch = remaining.match(cropRegex);
      const lotMatch = remaining.match(lotRegex);
      
      if (!txMatch && !cropMatch && !lotMatch) {
        parts.push(remaining);
        break;
      }
      
      const txIndex = txMatch ? txMatch.index : Infinity;
      const cropIndex = cropMatch ? cropMatch.index : Infinity;
      const lotIndex = lotMatch ? lotMatch.index : Infinity;
      
      const minIndex = Math.min(txIndex, cropIndex, lotIndex);
      
      if (minIndex === txIndex) {
        const matchText = txMatch[0];
        const matchIdx = txMatch.index;
        parts.push(remaining.substring(0, matchIdx));
        parts.push(
          <a
            key={remaining + matchIdx + 'tx'}
            href={`/explorer`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/explorer', { state: { searchQuery: matchText } });
            }}
            className="font-mono text-[10px] bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 hover:underline px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900 inline-block font-semibold ml-1"
          >
            {matchText.substring(0, 8)}...{matchText.substring(matchText.length - 6)}
          </a>
        );
        remaining = remaining.substring(matchIdx + matchText.length);
      } else if (minIndex === cropIndex) {
        const matchText = cropMatch[0];
        const matchIdx = cropMatch.index;
        const digits = matchText.match(/\d+/)[0];
        parts.push(remaining.substring(0, matchIdx));
        parts.push(
          <a
            key={remaining + matchIdx + 'crop'}
            href={`/explorer`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/explorer', { state: { searchType: 'CROP', query: digits } });
            }}
            className="font-bold text-emerald-600 hover:underline dark:text-emerald-400 font-mono text-[11px] ml-1"
          >
            {matchText}
          </a>
        );
        remaining = remaining.substring(matchIdx + matchText.length);
      } else {
        const matchText = lotMatch[0];
        const matchIdx = lotMatch.index;
        const digits = matchText.match(/\d+/)[0];
        parts.push(remaining.substring(0, matchIdx));
        parts.push(
          <a
            key={remaining + matchIdx + 'lot'}
            href={`/explorer`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/explorer', { state: { searchType: 'LOT', query: digits } });
            }}
            className="font-bold text-cyan-600 hover:underline dark:text-cyan-400 font-mono text-[11px] ml-1"
          >
            {matchText}
          </a>
        );
        remaining = remaining.substring(matchIdx + matchText.length);
      }
    }
    
    return <span>{parts}</span>;
  };

  const loadAdminData = async () => {
    try {
      const uRes = await axios.get('/api/admin/users');
      setUsers(uRes.data);

      const logsRes = await axios.get('/api/admin/audit-logs');
      setLogs(logsRes.data);

      const analyticsRes = await axios.get('/api/admin/analytics');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const checkAllOnChainRoles = async () => {
    if (!isConnected || !contracts.farmerRegistry || !contracts.productRegistry) return;
    setCheckingRoles(true);
    try {
      const QUALITY_TESTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QUALITY_TESTOR_ROLE"));
      const AGRICULTURE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGRICULTURE_ROLE"));
      const newRoles = {};
      
      const listToCheck = users.filter(u => u.wallet_address && (u.role === 'TESTER' || u.role === 'INSPECTOR'));
      
      for (const u of listToCheck) {
        const addr = u.wallet_address.toLowerCase();
        try {
          if (u.role === 'INSPECTOR') {
            const hasRole = await contracts.farmerRegistry.hasRole(AGRICULTURE_ROLE, addr);
            newRoles[addr] = hasRole;
          } else if (u.role === 'TESTER') {
            const hasRole = await contracts.productRegistry.hasRole(QUALITY_TESTOR_ROLE, addr);
            newRoles[addr] = hasRole;
          }
        } catch (e) {
          console.error("Error checking role for", addr, e);
        }
      }
      setOnChainRoles(newRoles);
    } catch (err) {
      console.error("Error checking on-chain roles:", err);
    } finally {
      setCheckingRoles(false);
    }
  };

  useEffect(() => {
    if (isConnected && contracts.farmerRegistry && contracts.productRegistry && users.length > 0) {
      checkAllOnChainRoles();
    }
  }, [isConnected, contracts, users]);

  const handleGrantBlockchainRole = async (user) => {
    if (!isConnected) {
      setAlertMessage({
        title: 'MetaMask Disconnected',
        message: 'Please connect your admin MetaMask wallet to grant on-chain roles.',
        type: 'warning'
      });
      return;
    }
    
    const walletAddress = user.wallet_address;
    if (!walletAddress) return;
    
    setGrantingRoleMap(prev => ({ ...prev, [walletAddress.toLowerCase()]: true }));
    setError('');
    
    try {
      if (user.role === 'INSPECTOR') {
        const AGRICULTURE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("AGRICULTURE_ROLE"));
        
        setAlertMessage({
          title: 'Granting Agriculture Role',
          message: 'Please approve the transaction in MetaMask to grant AGRICULTURE_ROLE on FarmerRegistry.',
          type: 'info'
        });
        
        const tx = await contracts.farmerRegistry.grantRole(AGRICULTURE_ROLE, walletAddress);
        await tx.wait();
        
        setAlertMessage({
          title: 'Agriculture Role Granted',
          message: `Successfully granted AGRICULTURE_ROLE to ${walletAddress} on the blockchain.`,
          type: 'success'
        });
      } else if (user.role === 'TESTER') {
        const QUALITY_TESTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("QUALITY_TESTOR_ROLE"));
        
        setAlertMessage({
          title: 'Granting Quality Testor Role',
          message: 'Please approve the transaction in MetaMask to grant QUALITY_TESTOR_ROLE on ProductRegistry.',
          type: 'info'
        });
        
        const tx = await contracts.productRegistry.grantRole(QUALITY_TESTOR_ROLE, walletAddress);
        await tx.wait();
        
        setAlertMessage({
          title: 'Quality Testor Role Granted',
          message: `Successfully granted QUALITY_TESTOR_ROLE to ${walletAddress} on the blockchain.`,
          type: 'success'
        });
      }
      
      // Refresh role status
      checkAllOnChainRoles();
    } catch (err) {
      console.error(err);
      setAlertMessage({
        title: 'Transaction Failed',
        message: err.reason || err.message || 'MetaMask transaction failed.',
        type: 'warning'
      });
    } finally {
      setGrantingRoleMap(prev => ({ ...prev, [walletAddress.toLowerCase()]: false }));
    }
  };

  const handleUserApprove = async (userId) => {
    try {
      await axios.post(`/api/admin/approve-user/${userId}`);
      setAlertMessage({
        title: 'Profile Approved',
        message: 'The Quality Laboratory profile has been successfully approved and activated.',
        type: 'success'
      });
      loadAdminData();
    } catch (err) {
      console.error(err);
      setError('User approval operation failed.');
    }
  };

  const handlePrintDocument = (url) => {
    if (!url) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setAlertMessage({
        title: 'Print Blocked',
        message: 'Pop-up blocker is enabled. Please allow pop-ups to print this document.',
        type: 'warning'
      });
      return;
    }

    if (previewType === 'image') {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Image</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background-color: white;
              }
              img {
                max-width: 100%;
                max-height: 100vh;
                object-fit: contain;
              }
              @media print {
                body {
                  margin: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                }
                img {
                  max-width: 100%;
                  max-height: 100%;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <img src="${url}" onload="setTimeout(function() { window.focus(); window.print(); window.close(); }, 500);" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else if (previewType === 'pdf') {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print PDF</title>
            <style>
              body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                overflow: hidden;
              }
              iframe {
                border: none;
                width: 100%;
                height: 100%;
              }
            </style>
          </head>
          <body>
            <iframe id="pdfFrame" src="${url}"></iframe>
            <script>
              const frame = document.getElementById('pdfFrame');
              frame.onload = function() {
                setTimeout(function() {
                  try {
                    frame.contentWindow.focus();
                    frame.contentWindow.print();
                  } catch (e) {
                    window.focus();
                    window.print();
                  }
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      printWindow.location.href = url;
    }
  };

  const handleDownloadDocument = (url) => {
    if (!url) return;
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = previewType === 'image' ? 'document_preview.png' : 'document_preview.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = previewType === 'image' ? 'document_preview.png' : 'document_preview.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(err => {
        console.warn('CORS download block, opening in new tab', err);
        window.open(url, '_blank');
      });
  };
  
  const renderBlockchainRoleCell = (user) => {
    if (!user.wallet_address) {
      return <span className="text-slate-400 dark:text-slate-500 italic">Wallet not linked</span>;
    }
    
    const addr = user.wallet_address.toLowerCase();
    const hasRole = onChainRoles[addr];
    const isGranting = grantingRoleMap[addr];
    
    if (hasRole === true) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 uppercase tracking-wider">
          Authorized
        </span>
      );
    }
    
    if (hasRole === false) {
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-955 dark:text-rose-455 uppercase tracking-wider">
            Not Authorized
          </span>
          <button
            onClick={() => handleGrantBlockchainRole(user)}
            disabled={isGranting}
            className="px-2.5 py-1 text-[9px] font-extrabold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1"
          >
            {isGranting ? (
              <div className="h-2 w-2 animate-spin rounded-full border border-white border-t-transparent"></div>
            ) : null}
            <span>{user.role === 'INSPECTOR' ? 'Grant Agriculture Role' : 'Grant Quality Testor Role'}</span>
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
        {checkingRoles ? (
          <div className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent"></div>
        ) : (
          <span className="text-[10px] italic">Pending Check</span>
        )}
      </div>
    );
  };

  const location = useLocation();
  const isApprovalsView = location.pathname === '/admin/approvals';
  const pendingFarmers = users.filter(u => u.role === 'FARMER' && !u.is_approved);
  const pendingLabs = users.filter(u => u.role === 'TESTER' && !u.is_approved);
  const activeUsers = users.filter(u => u.is_approved);
  const activeLabs = users.filter(u => u.role === 'TESTER' && u.is_approved);
  const activeInspectors = users.filter(u => u.role === 'INSPECTOR' && u.status === 'ACTIVE');
  const pendingInspectors = users.filter(u => u.role === 'INSPECTOR' && u.status === 'PENDING_SETUP');

  return (
    <div className="space-y-8 py-4">
      {/* Admin Panel Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          {isApprovalsView ? (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" /> User Authority Verification
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Review and approve credentials for new farmer accounts and quality testing laboratories.</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" /> Admin Management Panel
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Control role assignments, audit activity trails, verify inspectors, and manage system metrics.</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {isApprovalsView ? (
            /* Approvals View: User Authority Verification ONLY */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              
              {/* MetaMask Connection Banner for Admin Role Management */}
              {!isConnected ? (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 dark:text-amber-100 text-sm flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-650 animate-pulse" /> Admin MetaMask Wallet Disconnected
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">Connect your admin MetaMask wallet to verify, manage, and grant on-chain verifier roles (Inspectors and Quality Labs).</p>
                  </div>
                  <button
                    onClick={connectWallet}
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl transition text-xs shrink-0"
                  >
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-955/25 border border-emerald-200/50 dark:border-emerald-950/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-900 dark:text-emerald-100 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Admin MetaMask Connected
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">Address: {adminWallet}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-450 rounded-full font-bold uppercase tracking-wider text-[9px]">
                    Ready
                  </span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white">User Authority Verification</h3>
                {/* Tabs Switcher */}
                <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold gap-1">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all duration-205 flex items-center gap-2 ${
                      activeTab === 'pending'
                        ? 'bg-white text-indigo-650 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Pending Labs</span>
                    {pendingLabs.length > 0 && (
                      <span className="bg-rose-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold animate-pulse">
                        {pendingLabs.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`px-3 py-1.5 rounded-lg transition-all duration-205 flex items-center gap-2 ${
                      activeTab === 'active'
                        ? 'bg-white text-indigo-650 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-450 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Active Labs</span>
                    <span className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      {activeLabs.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inspectors')}
                    className={`px-3 py-1.5 rounded-lg transition-all duration-205 flex items-center gap-2 ${
                      activeTab === 'inspectors'
                        ? 'bg-white text-indigo-650 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-805 dark:text-slate-450 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Active Inspectors</span>
                    <span className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      {activeInspectors.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab('pendingInspectors')}
                    className={`px-3 py-1.5 rounded-lg transition-all duration-205 flex items-center gap-2 ${
                      activeTab === 'pendingInspectors'
                        ? 'bg-white text-indigo-650 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-805 dark:text-slate-450 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Pending Inspectors</span>
                    {pendingInspectors.length > 0 && (
                      <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold animate-pulse">
                        {pendingInspectors.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {pendingLabs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                      No pending quality lab credentials awaiting review.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-4">Lab Name</th>
                            <th className="py-3 px-4">Authorized Person</th>
                            <th className="py-3 px-4">License Number</th>
                            <th className="py-3 px-4 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingLabs.map((user) => (
                            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-semibold">{user.lab_name || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-slate-505">{user.name}</td>
                              <td className="py-3.5 px-4 font-mono text-xs">{user.lab_license_number || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => setSelectedLabForReview(user)}
                                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-[10px] font-bold text-white transition shadow-sm"
                                >
                                  Review Lab
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'active' && (
                <div className="space-y-4">
                  {activeLabs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                      No active quality labs registered on the platform.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-4">Lab Name</th>
                            <th className="py-3 px-4">Authorized Person</th>
                            <th className="py-3 px-4 font-mono text-xs">Wallet Address</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeLabs.map((user) => (
                            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-semibold">{user.lab_name || 'N/A'}</td>
                              <td className="py-3.5 px-4 text-slate-550">{user.name}</td>
                              <td className="py-3.5 px-4 font-mono text-xs">{user.wallet_address ? `${user.wallet_address.substring(0, 10)}...${user.wallet_address.substring(user.wallet_address.length - 8)}` : 'Not Linked'}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 uppercase tracking-wider">
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'inspectors' && (
                <div className="space-y-4">
                  {activeInspectors.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                      No active field inspectors currently registered.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-4">Inspector Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">District / Taluk</th>
                            <th className="py-3 px-4 font-mono text-xs">Wallet Address</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeInspectors.map((user) => (
                            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-semibold">{user.name}</td>
                              <td className="py-3.5 px-4 text-slate-505">{user.email}</td>
                              <td className="py-3.5 px-4 font-medium">{user.district} ({user.sub_district || 'N/A'})</td>
                              <td className="py-3.5 px-4 font-mono text-xs">{user.wallet_address ? `${user.wallet_address.substring(0, 10)}...${user.wallet_address.substring(user.wallet_address.length - 8)}` : 'Not Linked'}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 uppercase tracking-wider">
                                  Active
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'pendingInspectors' && (
                <div className="space-y-4">
                  {pendingInspectors.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                      No inspectors currently awaiting setup.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                            <th className="py-3 px-4">Inspector Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">District / Taluk</th>
                            <th className="py-3 px-4 text-center">Setup Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingInspectors.map((user) => (
                            <tr key={user.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                              <td className="py-3.5 px-4 font-semibold">{user.name}</td>
                              <td className="py-3.5 px-4 text-slate-550">{user.email}</td>
                              <td className="py-3.5 px-4 font-medium">{user.district} ({user.sub_district || 'N/A'})</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-955/30 dark:text-amber-450 dark:border-amber-900/30 uppercase tracking-wider">
                                  Awaiting Wallet Link
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Admin Console View: Analytics & Audit Trail */
            <div className="space-y-8">
              {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* User Roles */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-purple-500" /> System Users
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Farmers</span>
                        <span className="font-bold">{analytics.user_counts.farmers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Inspectors</span>
                        <span className="font-bold">{analytics.user_counts.inspectors || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quality Lab (Testers)</span>
                        <span className="font-bold">{analytics.user_counts.testers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Consumers</span>
                        <span className="font-bold">{analytics.user_counts.consumers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Investors</span>
                        <span className="font-bold">{analytics.user_counts.investors || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Certifications */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Inspections Audit
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Approved Lots</span>
                        <span className="font-bold text-emerald-600">{analytics.quality_stats.approved}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Rejected Lots</span>
                        <span className="font-bold text-rose-600">{analytics.quality_stats.rejected}</span>
                      </div>
                    </div>
                  </div>

                  {/* Crop Distributions */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <LineChart className="h-4 w-4 text-blue-500" /> Crop Distribution
                    </h4>
                    <div className="space-y-2 text-xs max-h-20 overflow-y-auto no-scrollbar">
                      {Object.entries(analytics.crop_categories).length === 0 ? (
                        <p className="text-slate-400 italic">No crops logged</p>
                      ) : (
                        Object.entries(analytics.crop_categories).map(([crop, count]) => (
                          <div key={crop} className="flex justify-between">
                            <span className="text-slate-500 truncate max-w-[100px]">{crop}</span>
                            <span className="font-bold">{count}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Fraud Monitoring Alerts */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-500" /> Fraud Monitor
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Threat Alerts</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          analytics.fraud_warnings.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {analytics.fraud_warnings.length} Active
                        </span>
                      </div>
                      {analytics.fraud_warnings.map((f, i) => (
                        <p key={i} className="text-[10px] text-rose-500 leading-tight truncate">{f.details}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="h-5 w-5 text-purple-600" /> System Audit Trail
                </h3>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                  {logs.map((log) => (
                    <div key={log.id} className="border-b border-slate-100 dark:border-slate-800 pb-3 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{log.action}</span>
                        <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-455 leading-tight">{renderLogDetails(log.details)}</p>
                      <p className="text-[9px] text-slate-400">Trigger: {log.user_name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Review Lab Documents */}
      {selectedLabForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" /> Review Quality Lab Credentials
              </h3>
              <button
                onClick={() => setSelectedLabForReview(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Lab Name</span>
                  <span className="font-bold text-sm text-slate-850 dark:text-slate-250">{selectedLabForReview.lab_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Authorized Person</span>
                  <span className="font-bold text-sm text-slate-850 dark:text-slate-250">{selectedLabForReview.authorized_person || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Email Address</span>
                  <span className="font-medium text-slate-750 dark:text-slate-350">{selectedLabForReview.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Contact Phone</span>
                  <span className="font-medium text-slate-750 dark:text-slate-350">{selectedLabForReview.phone_number}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">District</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedLabForReview.district || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Sub-District (Taluk)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedLabForReview.sub_district || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Base PIN Code</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedLabForReview.pin_code || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">License Number</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedLabForReview.lab_license_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Accreditation No</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedLabForReview.accreditation_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-0.5">Gov Registration No</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedLabForReview.gov_reg_number || 'N/A'}</span>
                </div>
              </div>

              {/* Certificates & Docs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-1.5">Lab Certificates</span>
                  {parseJsonList(selectedLabForReview.lab_certificates).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No certificates submitted.</span>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
                      {parseJsonList(selectedLabForReview.lab_certificates).map((url, i) => (
                        <button
                          onClick={() => handleOpenPreview(url)}
                          type="button"
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-350 hover:underline text-left bg-transparent border-none p-0 cursor-pointer w-full"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{getOriginalFilename(url)}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px] mb-1.5">Supporting Documents</span>
                  {parseJsonList(selectedLabForReview.supporting_documents).length === 0 ? (
                    <span className="text-xs text-slate-500 italic">No supporting documents.</span>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto no-scrollbar">
                      {parseJsonList(selectedLabForReview.supporting_documents).map((url, i) => (
                        <button
                          onClick={() => handleOpenPreview(url)}
                          type="button"
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-350 hover:underline text-left bg-transparent border-none p-0 cursor-pointer w-full"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{getOriginalFilename(url)}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedLabForReview(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleUserApprove(selectedLabForReview.id);
                  setSelectedLabForReview(null);
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold transition flex items-center gap-1.5"
              >
                Approve & Activate Lab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {documentPreviewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto no-scrollbar">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" /> Document Preview
              </h3>
              <button
                onClick={handleClosePreview}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex justify-center items-center bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 min-h-[300px] max-h-[60vh] overflow-y-auto border border-slate-100 dark:border-slate-850">
              {previewType === 'image' ? (
                <img
                  src={documentPreviewUrl}
                  alt="Document Preview"
                  className="max-h-[50vh] max-w-full object-contain rounded-xl shadow-md"
                />
              ) : previewType === 'pdf' ? (
                <iframe
                  src={documentPreviewUrl}
                  title="PDF Preview"
                  className="w-full h-[55vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <FileText className="h-12 w-12 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-500 dark:text-slate-455 font-medium">Preview not available for this file type.</p>
                  <p className="text-xs text-slate-400">You can download the file to view it on your device.</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handlePrintDocument(documentPreviewUrl)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDocument(documentPreviewUrl)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  Download
                </button>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="w-full sm:w-auto rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 px-5 py-2 text-xs font-bold transition shadow-md text-center"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center transform scale-100 transition-all duration-300">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-100 dark:bg-emerald-950/50' 
                : 'bg-amber-100 dark:bg-amber-950/50'
            }`}>
              {alertMessage.type === 'success' ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-450" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {alertMessage.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {alertMessage.message}
              </p>
            </div>
            <button
              onClick={() => {
                if (alertMessage.onClose) alertMessage.onClose();
                setAlertMessage(null);
              }}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 text-xs font-bold transition shadow-md"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
