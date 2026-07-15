import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, ShieldAlert, Users, LineChart, FileText, CheckCircle2, XCircle, ArrowLeft, UserPlus, Award, X, ExternalLink, Printer, Download, AlertCircle, Search, Copy, MapPin, Building, Clock, ShieldCheck, Check, Sprout } from 'lucide-react';
import axios from 'axios';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';
import { useLoading } from '../context/LoadingContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { walletAddress: adminWallet, isConnected, connectWallet, contracts } = useWallet();
  const { showLoading, hideLoading } = useLoading();
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
  const [copiedLogId, setCopiedLogId] = useState(null);
  const [allCrops, setAllCrops] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [cropSearchInput, setCropSearchInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchingInProgress, setSearchingInProgress] = useState(false);

  const handleCopyWallet = (wallet, logId) => {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    setCopiedLogId(logId);
    setTimeout(() => {
      setCopiedLogId(null);
    }, 2000);
  };

  const handleTriggerSearch = (customVal) => {
    const val = typeof customVal === 'string' ? customVal : cropSearchInput;
    if (!val.trim()) return;
    setSearchingInProgress(true);
    setHasSearched(true);
    setTimeout(() => {
      setCropSearchQuery(val);
      setSearchingInProgress(false);
    }, 1000);
  };

  const handleClearSearch = () => {
    setCropSearchInput('');
    setCropSearchQuery('');
    setHasSearched(false);
    setSearchingInProgress(false);
  };

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

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const highlightText = (text, search) => {
    if (!search || !text) return text;
    const parts = String(text).split(new RegExp(`(${escapeRegExp(search)})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-yellow-250 dark:bg-yellow-800/80 text-slate-900 dark:text-white px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const DashboardSkeleton = () => {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Analytics Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800/60 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700/60 rounded"></div>
                <div className="h-8 w-8 bg-slate-300 dark:bg-slate-700/60 rounded-lg"></div>
              </div>
              <div className="h-6 w-16 bg-slate-300 dark:bg-slate-700/60 rounded"></div>
            </div>
          ))}
        </div>

        {/* Search Registry Skeleton */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-lg"></div>
              <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800/60 rounded-lg"></div>
            </div>
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800/60 rounded-xl"></div>
          </div>
          <div className="h-24 bg-slate-100 dark:bg-slate-950/40 rounded-xl"></div>
        </div>

        {/* Logs & MetaMask Ledger Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column Skeleton */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-lg"></div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-955/20 rounded-xl p-3 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/60 rounded"></div>
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800/60 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-lg"></div>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-slate-100 dark:bg-slate-955/20 rounded-xl p-3 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800/60 rounded"></div>
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800/60 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const loadAdminData = async () => {
    try {
      const uRes = await axios.get('/api/admin/users');
      setUsers(uRes.data);

      const logsRes = await axios.get('/api/admin/audit-logs');
      setLogs(logsRes.data);

      const analyticsRes = await axios.get('/api/admin/analytics');
      setAnalytics(analyticsRes.data);

      const cropsRes = await axios.get('/api/quality/pending');
      setAllCrops(cropsRes.data);

      const productsRes = await axios.get('/api/product/all');
      setAllProducts(productsRes.data);
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
    showLoading('Granting verifier role on the blockchain ledger...');
    
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
      hideLoading();
    } catch (err) {
      console.error(err);
      hideLoading();
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
    showLoading('Activating laboratory profile...');
    try {
      await axios.post(`/api/admin/approve-user/${userId}`);
      hideLoading();
      setAlertMessage({
        title: 'Profile Approved',
        message: 'The Quality Laboratory profile has been successfully approved and activated.',
        type: 'success'
      });
      loadAdminData();
    } catch (err) {
      console.error(err);
      hideLoading();
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
        <DashboardSkeleton />
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

              {/* Crop Traceability Search Registry */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all duration-300">
                <style>{`
                  @keyframes progressShimmer {
                    0% { left: -40%; }
                    100% { left: 100%; }
                  }
                  .animate-progressShimmer {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 40%;
                    border-radius: 9999px;
                    background: linear-gradient(90deg, #10b981, #6366f1);
                    animation: progressShimmer 1.2s infinite linear;
                  }
                `}</style>

                {!hasSearched ? (
                  /* Centered Search Layout (Default State) */
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-6">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shadow-sm animate-pulse">
                        <Sprout className="h-8 w-8 text-emerald-600 dark:text-emerald-455" />
                      </div>
                      <Search className="absolute -bottom-1 -right-1 h-5 w-5 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-full p-1 border border-slate-200 dark:border-slate-700 shadow-xs" />
                    </div>

                    <div className="space-y-2 max-w-md">
                      <h3 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                        Unified Crop Lifecycle & Traceability Search
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Trace the custody chain of any crop batch. Enter a Crop ID, Lot Number, Farmer Name, Inspector Name, or Laboratory details.
                      </p>
                    </div>

                    {/* Centered Large Search Input Box with Search Button & View All Link */}
                    <div className="flex flex-col items-center w-full max-w-md space-y-3">
                      <div className="relative w-full flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search ID, Lot, Farmer, Inspector, Lab..."
                            value={cropSearchInput}
                            onChange={(e) => setCropSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTriggerSearch();
                              }
                            }}
                            className="w-full pl-10 pr-4 py-3 text-xs md:text-sm rounded-xl border border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-200 font-semibold"
                            autoFocus
                          />
                          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                        </div>
                        <button
                          onClick={() => handleTriggerSearch()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl text-xs transition duration-200 shadow-xs"
                        >
                          Search
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSearchingInProgress(true);
                          setHasSearched(true);
                          setCropSearchInput('');
                          setTimeout(() => {
                            setCropSearchQuery('');
                            setSearchingInProgress(false);
                          }, 1000);
                        }}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-350 text-xs font-bold transition hover:underline cursor-pointer"
                      >
                        View All Registered Crops
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Header & Results Layout (Search Active State) */
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base md:text-lg">
                          <Sprout className="h-5.5 w-5.5 text-emerald-600 dark:text-emerald-450" /> Unified Crop Lifecycle & Traceability Search
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Search and audit the end-to-end custody chain of any crop batch registered in the network.</p>
                      </div>
                      
                      {/* Search Input Box with Search Button (Top-Right position) */}
                      <div className="relative w-full md:w-96 flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Search ID, Lot, Farmer..."
                            value={cropSearchInput}
                            onChange={(e) => setCropSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleTriggerSearch();
                              }
                            }}
                            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-250 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850 dark:text-slate-200"
                          />
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-650 dark:hover:text-slate-200"
                          >
                            ✕
                          </button>
                        </div>
                        <button
                          onClick={() => handleTriggerSearch()}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-[10px] transition duration-200 shadow-sm"
                        >
                          Search
                        </button>
                      </div>
                    </div>

                    {/* Results / Loading Area */}
                    {searchingInProgress ? (
                      /* Progressive Loading Bar */
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold animate-pulse text-xs tracking-wider uppercase">
                          <div className="h-2 w-2 animate-ping rounded-full bg-indigo-600 dark:bg-indigo-400"></div>
                          Scanning Blockchain Custody Ledger...
                        </div>
                        
                        <div className="w-full max-w-sm h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                          <div className="animate-progressShimmer"></div>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 italic">Verifying farmer registration, inspector signatures, and laboratory accreditation...</p>
                      </div>
                    ) : (
                      /* Results List */
                      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                        {(() => {
                          const filteredSearchCrops = allCrops.filter(crop => {
                            if (!cropSearchQuery) return true;
                            const query = cropSearchQuery.trim().toLowerCase();
                            const matchedProduct = allProducts.find(p => p.farmer_id === crop.id);
                            const lotStr = matchedProduct ? String(matchedProduct.lot_number) : '';
                            
                            return (
                              String(crop.id) === query ||
                              (crop.crop_type && crop.crop_type.toLowerCase().includes(query)) ||
                              (crop.farmer_name && crop.farmer_name.toLowerCase().includes(query)) ||
                              (crop.assigned_inspector_name && crop.assigned_inspector_name.toLowerCase().includes(query)) ||
                              (crop.assigned_tester_name && crop.assigned_tester_name.toLowerCase().includes(query)) ||
                              lotStr === query
                            );
                          });

                          if (filteredSearchCrops.length === 0) {
                            return (
                              <div className="text-center py-10 text-slate-400 text-xs italic">
                                No matching crop or lot records found for "{cropSearchQuery}".
                              </div>
                            );
                          }

                          const getStatusBadge = (status, approved) => {
                            const sUpper = status ? status.toUpperCase() : '';
                            if (sUpper === 'REJECTED' || approved === false) {
                              return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30';
                            }
                            if (sUpper === 'VERIFIED' || sUpper === 'APPROVED' || approved === true) {
                              return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30';
                            }
                            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/25 dark:text-amber-450 dark:border-amber-900/30';
                          };

                          return filteredSearchCrops.map((crop) => {
                            const matchedProduct = allProducts.find(p => p.farmer_id === crop.id);

                            return (
                              <div key={`crop-search-${crop.id}`} className="border border-slate-150 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-900/10 space-y-4 hover:shadow-xs transition duration-200 animate-fadeIn">
                                {/* Heading: ID & Info */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 flex-wrap">
                                      <span className="bg-indigo-50 text-indigo-700 dark:bg-indigo-955/40 dark:text-indigo-405 border border-indigo-100 dark:border-indigo-900 px-2 py-0.5 rounded-md font-mono text-xs">
                                        ID: {highlightText(crop.id, cropSearchQuery)}
                                      </span>
                                      <span className="text-slate-800 dark:text-slate-200">{highlightText(crop.crop_type, cropSearchQuery)}</span>
                                      <span className="text-xs text-slate-455 font-normal">({highlightText(crop.farming_type, cropSearchQuery)})</span>
                                    </h4>
                                    {crop.tx_hash && (
                                      <p className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                                        <span>Anchor Tx:</span>
                                        <a
                                          href={`/explorer`}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            navigate('/explorer', { state: { searchQuery: crop.tx_hash } });
                                          }}
                                          className="text-indigo-600 dark:text-indigo-405 hover:underline"
                                        >
                                          {crop.tx_hash.substring(0, 16)}...
                                        </a>
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {matchedProduct ? (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-955/20 dark:text-emerald-450 dark:border-emerald-900/45 uppercase">
                                        Lot #{highlightText(matchedProduct.lot_number, cropSearchQuery)} ({highlightText(matchedProduct.quality_grade, cropSearchQuery)})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-955/20 dark:text-amber-450 dark:border-amber-900/30 uppercase">
                                        Lab Testing Pending
                                      </span>
                                    )}
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(crop.timeline_status, crop.is_approved)}`}>
                                      {highlightText(crop.timeline_status.replace(/_/g, ' '), cropSearchQuery)}
                                    </span>
                                  </div>
                                </div>

                                {/* 3-Step Stepper Layout */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                  {/* Step 1: Farmer Cultivation */}
                                  <div className="space-y-2 md:border-r md:border-slate-100 md:dark:border-slate-800 pr-0 md:pr-4">
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-955/25 dark:text-emerald-455 border border-emerald-250 dark:border-emerald-900/50 flex items-center justify-center font-bold text-[10px]">
                                        1
                                      </div>
                                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Sprout className="h-3.5 w-3.5 text-emerald-600" /> Cultivation Register
                                      </span>
                                    </div>
                                    <div className="pl-7 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                                      <p>Farmer Name: <strong className="text-slate-700 dark:text-slate-350">{highlightText(crop.farmer_name, cropSearchQuery)}</strong></p>
                                      <p>Address: <span className="text-slate-600 dark:text-slate-400">{highlightText(crop.farm_address || crop.farm_location, cropSearchQuery)}</span></p>
                                      <p>District: {highlightText(crop.district, cropSearchQuery)}</p>
                                      <p>Land Survey No: <span className="font-mono">{highlightText(crop.land_survey_no || 'N/A', cropSearchQuery)}</span></p>
                                      <p>Plant Date: {new Date(crop.cultivation_date).toLocaleDateString()}</p>
                                      {crop.wallet_address && (
                                        <div className="flex items-center gap-1 text-[9px] text-slate-400 pt-0.5">
                                          <span className="font-mono bg-white dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                            {crop.wallet_address.substring(0, 6)}...{crop.wallet_address.substring(crop.wallet_address.length - 4)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Step 2: Inspector Field Verification */}
                                  <div className="space-y-2 md:border-r md:border-slate-100 md:dark:border-slate-800 pr-0 md:pr-4">
                                    <div className="flex items-center gap-2">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                                        crop.verification_status === 'VERIFIED'
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-955/25 dark:text-emerald-455 border-emerald-250 dark:border-emerald-900/50'
                                          : crop.verification_status === 'REJECTED'
                                          ? 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30'
                                          : 'bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-955/20 dark:text-amber-450 dark:border-amber-900/30'
                                      }`}>
                                        2
                                      </div>
                                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <ShieldCheck className="h-3.5 w-3.5 text-cyan-555" /> Inspector Audit
                                      </span>
                                    </div>
                                    <div className="pl-7 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                                      <p>Inspector: <strong className="text-slate-700 dark:text-slate-300">{highlightText(crop.assigned_inspector_name || 'Unassigned', cropSearchQuery)}</strong></p>
                                      <p>Status: <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] uppercase ${getStatusBadge(crop.verification_status, crop.is_approved)}`}>{highlightText(crop.verification_status, cropSearchQuery)}</span></p>
                                      <p>Audit Method: {highlightText(crop.inspection_method || 'N/A', cropSearchQuery)}</p>
                                      <p>Audit Date: {crop.inspection_date ? new Date(crop.inspection_date).toLocaleDateString() : 'Pending'}</p>
                                      <div className="mt-1 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-855 p-1.5 rounded text-[9px] italic leading-tight text-slate-600 dark:text-slate-400">
                                        Notes: "{highlightText(crop.inspection_notes || 'No audit notes registered.', cropSearchQuery)}"
                                      </div>
                                    </div>
                                  </div>

                                  {/* Step 3: Quality Lab Certification */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] border ${
                                        matchedProduct && matchedProduct.certification_status === 'APPROVED'
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-955/25 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/50'
                                          : matchedProduct && matchedProduct.certification_status === 'REJECTED'
                                          ? 'bg-rose-50 text-rose-600 border-rose-250 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30'
                                          : 'bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-955/20 dark:text-amber-505 dark:border-amber-900/30'
                                      }`}>
                                        3
                                      </div>
                                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                        <Award className="h-3.5 w-3.5 text-amber-550" /> Lab Certification
                                      </span>
                                    </div>
                                    <div className="pl-7 text-[10px] text-slate-500 dark:text-slate-400 space-y-1">
                                      <p>Tester: <strong className="text-slate-700 dark:text-slate-300">{highlightText(crop.assigned_tester_name || 'Unassigned', cropSearchQuery)}</strong></p>
                                      <p>Status: <span className={`px-1.5 py-0.2 rounded font-bold text-[8px] uppercase ${matchedProduct ? getStatusBadge(matchedProduct.certification_status, null) : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>{highlightText(matchedProduct ? matchedProduct.certification_status : 'PENDING', cropSearchQuery)}</span></p>
                                      {matchedProduct ? (
                                        <>
                                          <p>Grade: <strong className="text-emerald-605 dark:text-emerald-455 font-bold">{highlightText(matchedProduct.quality_grade, cropSearchQuery)}</strong></p>
                                          <p>Test Date: {new Date(matchedProduct.test_date).toLocaleDateString()}</p>
                                          <div className="mt-1 bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-855 p-1.5 rounded text-[9px] italic leading-tight text-slate-600 dark:text-slate-400">
                                            Remarks: "{highlightText(crop.tester_remarks || 'No testing remarks registered.', cropSearchQuery)}"
                                          </div>
                                        </>
                                      ) : (
                                        <p className="text-slate-400 italic">Awaiting Lab results</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Double Column Grid: Activity Logs & MetaMask Ledger */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Verification & Inspector Activity Logs */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm md:text-base">
                      <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> Activity & Blockchain Verification Logs
                    </h3>
                    <span className="text-[10px] md:text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      {logs.filter(log => log.action !== 'USER_LOGIN' && log.action !== 'USER_LOGOUT').length} Operations
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                    {(() => {
                      const displayLogs = logs.filter(log => log.action !== 'USER_LOGIN' && log.action !== 'USER_LOGOUT');
                      if (displayLogs.length === 0) {
                        return (
                          <div className="text-center py-8 text-slate-400 text-xs italic">
                            No verification or inspector activity logs recorded yet.
                          </div>
                        );
                      }
                      return displayLogs.map((log) => {
                        const actionUpper = log.action ? log.action.toUpperCase() : '';
                        
                        // Determine action badge styles
                        let badgeClass = 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
                        if (actionUpper.includes('APPROVED') || actionUpper.includes('VERIFIED') || actionUpper.includes('SUCCESS') || actionUpper.includes('CERTIFIED')) {
                          badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
                        } else if (actionUpper.includes('REJECTED') || actionUpper.includes('DECLINED') || actionUpper.includes('CANCEL') || actionUpper.includes('SUSPICION') || actionUpper.includes('FRAUD')) {
                          badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30';
                        } else if (actionUpper.includes('REGISTER') || actionUpper.includes('CREATE') || actionUpper.includes('ADD') || actionUpper.includes('SUBMIT')) {
                          badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900';
                        } else if (actionUpper.includes('LOGIN')) {
                          badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-955/20 dark:text-blue-455 dark:border-blue-900/30';
                        }

                        // Format Role display name and styles
                        let roleLabel = 'System';
                        let roleBadgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                        if (log.user_role === 'ADMIN') {
                          roleLabel = 'System Administrator';
                          roleBadgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
                        } else if (log.user_role === 'INSPECTOR') {
                          roleLabel = 'Agriculture Inspector';
                          roleBadgeClass = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300';
                        } else if (log.user_role === 'TESTER') {
                          roleLabel = 'Quality Tester';
                          roleBadgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                        } else if (log.user_role === 'FARMER') {
                          roleLabel = 'Farmer';
                          roleBadgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                        } else if (log.user_role === 'INVESTOR') {
                          roleLabel = 'Investor';
                          roleBadgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
                        } else if (log.user_role === 'CONSUMER') {
                          roleLabel = 'Consumer';
                          roleBadgeClass = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                        }

                        const formattedDate = new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });

                        // Determine highlighting based on role
                        let cardHighlightClass = 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30';
                        let roleIcon = null;
                        
                        if (log.user_role === 'TESTER') {
                          cardHighlightClass = 'border-l-4 border-l-amber-500 border-y-slate-150 border-r-slate-150 dark:border-y-slate-800 dark:border-r-slate-800 bg-amber-50/10 dark:bg-amber-955/5';
                          roleIcon = <Award className="h-4 w-4 text-amber-600 dark:text-amber-405 shrink-0" />;
                        } else if (log.user_role === 'INVESTOR') {
                          cardHighlightClass = 'border-l-4 border-l-emerald-500 border-y-slate-150 border-r-slate-150 dark:border-y-slate-800 dark:border-r-slate-800 bg-emerald-50/10 dark:bg-emerald-955/5';
                          roleIcon = <LineChart className="h-4 w-4 text-emerald-600 dark:text-emerald-405 shrink-0" />;
                        } else if (log.user_role === 'INSPECTOR') {
                          cardHighlightClass = 'border-l-4 border-l-cyan-500 border-y-slate-150 border-r-slate-150 dark:border-y-slate-800 dark:border-r-slate-800 bg-cyan-50/10 dark:bg-cyan-955/5';
                          roleIcon = <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-405 shrink-0" />;
                        }

                        return (
                          <div key={log.id} className={`border rounded-xl p-3.5 space-y-3 shadow-2xs hover:shadow-xs transition duration-200 ${cardHighlightClass}`}>
                            {/* Header: Action & Timestamp */}
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100/50 dark:border-slate-800/50 pb-2">
                              <div className="flex items-center gap-1.5">
                                {roleIcon}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                                  {log.action}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                                <Clock className="h-3 w-3" /> {formattedDate}
                              </span>
                            </div>

                            {/* Action Details Description */}
                            <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium">
                              {renderLogDetails(log.details)}
                            </p>

                            {/* Actor Meta Data Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100/50 dark:border-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400">
                              {/* Column 1: Who */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{log.user_name || 'System'}</span>
                                  {log.user_role && (
                                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded-xs ${roleBadgeClass}`}>
                                      {roleLabel}
                                    </span>
                                  )}
                                </div>
                                
                                {/* MetaMask details */}
                                {log.user_wallet ? (
                                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                    <span className="font-mono text-[9px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                      {log.user_wallet.substring(0, 6)}...{log.user_wallet.substring(log.user_wallet.length - 4)}
                                    </span>
                                    <button
                                      onClick={() => handleCopyWallet(log.user_wallet, log.id)}
                                      className="p-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                      title="Copy Wallet Address"
                                    >
                                      {copiedLogId === log.id ? (
                                        <Check className="h-2.5 w-2.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-2.5 w-2.5" />
                                      )}
                                    </button>
                                    <a
                                      href={`/explorer`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        navigate('/explorer', { state: { searchQuery: log.user_wallet } });
                                      }}
                                      className="p-0.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                                      title="View in Explorer"
                                    >
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Registered MetaMask Account" />
                                  </div>
                                ) : (
                                  log.user_role && (
                                    <div className="text-[9px] text-slate-400 italic">No MetaMask Linked</div>
                                  )
                                )}
                              </div>

                              {/* Column 2: Where / Coverage */}
                              <div className="space-y-1">
                                {log.user_role === 'INSPECTOR' && log.user_district && (
                                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                    <MapPin className="h-3 w-3 text-cyan-505 shrink-0" />
                                    <span>Coverage: <strong className="text-slate-705 dark:text-slate-205">{log.user_district}</strong>{log.user_pin_code && ` (${log.user_pin_code})`}</span>
                                  </div>
                                )}
                                {log.user_role === 'TESTER' && log.user_lab_name && (
                                  <div className="flex items-start gap-1 bg-white dark:bg-slate-800/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                    <Building className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                                    <span className="truncate">
                                      Lab: <strong className="text-slate-700 dark:text-slate-202" title={log.user_lab_name}>{log.user_lab_name}</strong>
                                      {log.user_accreditation_number && <span className="text-[8px] text-slate-400 block font-semibold">Accred: #{log.user_accreditation_number}</span>}
                                    </span>
                                  </div>
                                )}
                                {log.user_role === 'FARMER' && log.user_district && (
                                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800/40 p-1.5 rounded border border-slate-100 dark:border-slate-800">
                                    <MapPin className="h-3 w-3 text-emerald-505 shrink-0" />
                                    <span>District: <strong className="text-slate-700 dark:text-slate-202">{log.user_district}</strong></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Right Column: MetaMask On-Chain Ledger */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm md:text-base">
                      <Award className="h-5 w-5 text-indigo-650 dark:text-indigo-400" /> MetaMask On-Chain Ledger
                    </h3>
                    <span className="text-[10px] md:text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                      {logs.filter(log => log.details && (/(0x[a-fA-F0-9]{64})/).test(log.details)).length} Ledger Transactions
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                    {(() => {
                      const metaMaskLogs = logs.filter(log => log.details && (/(0x[a-fA-F0-9]{64})/).test(log.details));
                      if (metaMaskLogs.length === 0) {
                        return (
                          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic">
                            No MetaMask smart contract transactions recorded yet.
                          </div>
                        );
                      }
                      return metaMaskLogs.map((log) => {
                        const txMatch = log.details.match(/(0x[a-fA-F0-9]{64})/);
                        const txHash = txMatch ? txMatch[0] : null;
                        
                        const formattedDate = new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });

                        return (
                          <div key={`tx-${log.id}`} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 bg-slate-50/20 dark:bg-slate-900/20 space-y-3 hover:shadow-xs transition duration-200">
                            {/* Top: Log Action & Date */}
                            <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-100/50 dark:border-slate-800/50 pb-2">
                              <span className="font-bold text-indigo-650 dark:text-indigo-400 tracking-wide uppercase">
                                {log.action.replace(/_/g, ' ')}
                              </span>
                              <span className="flex items-center gap-1 font-mono text-[9px]">
                                <Clock className="h-3 w-3" /> {formattedDate}
                              </span>
                            </div>

                            {/* Event Summary */}
                            <p className="text-xs font-medium text-slate-650 dark:text-slate-350">
                              {renderLogDetails(log.details)}
                            </p>

                            {/* Transaction Details Box */}
                            {txHash && (
                              <div className="bg-white dark:bg-slate-800/60 border border-slate-150 dark:border-slate-800 rounded-lg p-2.5 space-y-2 text-[10px]">
                                {/* Tx Hash Row */}
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-400 font-semibold">Tx Hash</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-655 dark:text-slate-350 border border-slate-100 dark:border-slate-800">
                                      {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                                    </span>
                                    <button
                                      onClick={() => handleCopyWallet(txHash, `txhash-${log.id}`)}
                                      className="p-0.5 hover:text-indigo-650 dark:hover:text-indigo-400 transition"
                                      title="Copy Transaction Hash"
                                    >
                                      {copiedLogId === `txhash-${log.id}` ? (
                                        <Check className="h-3 w-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3 w-3 text-slate-400" />
                                      )}
                                    </button>
                                    <a
                                      href={`/explorer`}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        navigate('/explorer', { state: { searchQuery: txHash } });
                                      }}
                                      className="p-0.5 hover:text-indigo-650 dark:hover:text-indigo-400 transition"
                                      title="Search in Blockchain Explorer"
                                    >
                                      <ExternalLink className="h-3 w-3 text-slate-400" />
                                    </a>
                                  </div>
                                </div>

                                {/* Wallet Row */}
                                {log.user_wallet && (
                                  <div className="flex items-center justify-between gap-2 border-t border-slate-100/50 dark:border-slate-800/50 pt-1.5">
                                    <span className="text-slate-400 font-semibold">Signer Wallet</span>
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-655 dark:text-slate-300">
                                        {log.user_wallet.substring(0, 6)}...{log.user_wallet.substring(log.user_wallet.length - 4)}
                                      </span>
                                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" title="Confirmed On-Chain Account" />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Status Badge */}
                                <div className="flex items-center justify-between gap-2 border-t border-slate-100/50 dark:border-slate-800/50 pt-1.5">
                                  <span className="text-slate-400 font-semibold">Ledger Status</span>
                                  <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-bold uppercase tracking-wider text-[8px] dark:bg-emerald-950/40 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900">
                                    MINED / SUCCESS
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
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
