import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Cpu, Search, Layers, Calendar, ArrowLeft, ExternalLink, 
  Sprout, Award, ShieldCheck, FileCheck, CheckCircle2, Clock, XCircle, MapPin,
  Download, FileText, QrCode
} from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';
import html2pdf from 'html2pdf.js';
import QrScannerModal from '../components/QrScannerModal';
import { fetchServerIp, getQrCodeBaseUrl } from '../utils/qr';

export default function BlockchainExplorer() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchType, setSearchType] = useState('CROP'); // CROP or LOT
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [serverIp, setServerIp] = useState(null);

  // 7-step timeline mapping
  const getStatusStepNumber = (status) => {
    switch (status) {
      case 'CROP_REGISTERED': return 1;
      case 'QUALITY_TESTED': return 2;
      case 'TESTER_APPROVED': return 3;
      case 'FUNDING_COMPLETED': return 4;
      case 'READY_TO_HARVEST': return 5;
      case 'HARVEST_COMPLETED': return 6;
      case 'PRODUCT_AVAILABLE': return 7;
      default: return 1;
    }
  };

  const handleDownloadCertificatePDF = (productObj) => {
    const element = document.getElementById('batch-certificate-print-area');
    if (!element) return;

    const opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: `Quality_Certificate_Lot_${productObj.lot_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const originalStyle = element.getAttribute('style') || '';
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#0f172a';
    element.style.borderColor = '#10b981';

    const styledElements = [];
    const textElements = element.querySelectorAll('span, p, strong, h2, div');
    textElements.forEach(el => {
      const origColor = el.style.color;
      styledElements.push({ el, type: 'color', val: origColor });

      if (el.classList.contains('text-slate-400') || el.classList.contains('text-slate-505')) {
        el.style.color = '#64748b';
      } else if (el.classList.contains('text-emerald-800') || el.classList.contains('text-emerald-455')) {
        el.style.color = '#065f46';
      } else {
        el.style.color = '#0f172a';
      }
    });

    const bgElements = element.querySelectorAll('.bg-slate-50, .dark\\:bg-slate-950, .bg-emerald-100, .bg-emerald-50');
    bgElements.forEach(el => {
      const origBg = el.style.backgroundColor;
      styledElements.push({ el, type: 'bg', val: origBg });
      if (el.classList.contains('bg-emerald-100')) {
        el.style.backgroundColor = '#d1fae5';
      } else if (el.classList.contains('bg-emerald-50')) {
        el.style.backgroundColor = '#ecfdf5';
      } else {
        el.style.backgroundColor = '#f8fafc';
      }
    });

    html2pdf().from(element).set(opt).save().then(() => {
      element.setAttribute('style', originalStyle);
      styledElements.forEach(({ el, type, val }) => {
        if (type === 'color') {
          el.style.color = val;
        } else if (type === 'bg') {
          el.style.backgroundColor = val;
        }
      });
    }).catch(err => {
      console.error("Failed to generate PDF", err);
      element.setAttribute('style', originalStyle);
      styledElements.forEach(({ el, type, val }) => {
        if (type === 'color') {
          el.style.color = val;
        } else if (type === 'bg') {
          el.style.backgroundColor = val;
        }
      });
    });
  };

  const handleLookup = async (type, query) => {
    if (!query) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // If the query is a transaction hash, resolve it to Crop/Lot
      if (query.startsWith('0x') && query.length === 66) {
        const txRes = await axios.get(`/api/explorer/tx/${query}`);
        const tx = txRes.data;
        const eventData = JSON.parse(tx.event_data || '{}');
        
        if (tx.method_name === 'registerFarmer' || tx.method_name === 'approveFarmer') {
          const farmerId = eventData.farmerId || eventData.id;
          if (farmerId) {
            const cropRes = await axios.get(`/api/farmer/${farmerId}`);
            let matchedProduct = null;
            try {
              const productsRes = await axios.get('/api/product/all');
              matchedProduct = productsRes.data.find(p => p.farmer_id === cropRes.data.id);
            } catch (e) {
              console.warn('Matching product load failed', e);
            }
            setSearchType('CROP');
            setSearchQuery(String(farmerId));
            setResult({ type: 'CROP', data: cropRes.data, product: matchedProduct });
          } else {
            throw new Error('Associated Farmer ID not found in event data');
          }
        } else if (tx.method_name === 'registerProduct') {
          const lotNo = eventData.lotNumber || eventData.lot_number;
          if (lotNo) {
            const productRes = await axios.get(`/api/product/${lotNo}`);
            let parentCrop = null;
            try {
              const cropRes = await axios.get(`/api/farmer/${productRes.data.farmer_id}`);
              parentCrop = cropRes.data;
            } catch (e) {
              console.warn('Parent crop load failed', e);
            }
            setSearchType('LOT');
            setSearchQuery(String(lotNo));
            setResult({ type: 'LOT', data: productRes.data, crop: parentCrop });
          } else {
            throw new Error('Associated Product Lot not found in event data');
          }
        } else if (tx.method_name === 'invest') {
          const lotNo = eventData.lotNumber;
          if (lotNo) {
            const productRes = await axios.get(`/api/product/${lotNo}`);
            let parentCrop = null;
            try {
              const cropRes = await axios.get(`/api/farmer/${productRes.data.farmer_id}`);
              parentCrop = cropRes.data;
            } catch (e) {
              console.warn('Parent crop load failed', e);
            }
            setSearchType('LOT');
            setSearchQuery(String(lotNo));
            setResult({ type: 'LOT', data: productRes.data, crop: parentCrop });
          } else {
            const farmerId = eventData.farmerId;
            if (farmerId) {
              const cropRes = await axios.get(`/api/farmer/${farmerId}`);
              let matchedProduct = null;
              try {
                const productsRes = await axios.get('/api/product/all');
                matchedProduct = productsRes.data.find(p => p.farmer_id === cropRes.data.id);
              } catch (e) {
                console.warn('Matching product load failed', e);
              }
              setSearchType('CROP');
              setSearchQuery(String(farmerId));
              setResult({ type: 'CROP', data: cropRes.data, product: matchedProduct });
            } else {
              throw new Error('Associated entities not found in event data');
            }
          }
        } else {
          throw new Error('Unsupported transaction method');
        }
      } else {
        // Normal Crop ID or Product Lot lookup
        if (type === 'CROP') {
          const cropRes = await axios.get(`/api/farmer/${query}`);
          let matchedProduct = null;
          try {
            const productsRes = await axios.get('/api/product/all');
            matchedProduct = productsRes.data.find(p => p.farmer_id === cropRes.data.id);
          } catch (e) {
            console.warn('Matching product load failed', e);
          }
          setResult({ type: 'CROP', data: cropRes.data, product: matchedProduct });
        } else {
          const productRes = await axios.get(`/api/product/${query}`);
          let parentCrop = null;
          try {
            const cropRes = await axios.get(`/api/farmer/${productRes.data.farmer_id}`);
            parentCrop = cropRes.data;
          } catch (e) {
            console.warn('Parent crop load failed', e);
          }
          setResult({ type: 'LOT', data: productRes.data, crop: parentCrop });
        }
      }
    } catch (err) {
      setError(
        query.startsWith('0x')
          ? `Could not resolve transaction hash: ${err.response?.data?.message || err.message}`
          : type === 'CROP' 
            ? `Crop ID ${query} not found in the decentralized registry.` 
            : `Product Lot ${query} not found in the certification index.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (decodedText) => {
    console.log("Decoded QR:", decodedText);
    try {
      if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        const url = new URL(decodedText);
        const lot = url.searchParams.get('lot') || url.searchParams.get('lot_number');
        const crop = url.searchParams.get('crop') || url.searchParams.get('crop_id');
        
        if (lot) {
          setSearchType('LOT');
          setSearchQuery(lot);
          handleLookup('LOT', lot);
        } else if (crop) {
          setSearchType('CROP');
          setSearchQuery(crop);
          handleLookup('CROP', crop);
        } else {
          const queryParam = url.searchParams.get('query');
          if (queryParam) {
            setSearchQuery(queryParam);
            if (!isNaN(queryParam) && parseInt(queryParam) >= 1000) {
              setSearchType('LOT');
              handleLookup('LOT', queryParam);
            } else {
              setSearchType('CROP');
              handleLookup('CROP', queryParam);
            }
          }
        }
      } else {
        setSearchQuery(decodedText);
        if (!isNaN(decodedText) && parseInt(decodedText) >= 1000) {
          setSearchType('LOT');
          handleLookup('LOT', decodedText);
        } else {
          setSearchType('CROP');
          handleLookup('CROP', decodedText);
        }
      }
    } catch (e) {
      console.error("Error parsing QR content:", e);
      setSearchQuery(decodedText);
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
  }, []);

  useEffect(() => {
    // 1. Read parameters from URL query string (search parameters)
    const params = new URLSearchParams(location.search);
    const lotParam = params.get('lot') || params.get('lot_number');
    const cropParam = params.get('crop') || params.get('crop_id');
    const queryParam = params.get('query');

    if (lotParam) {
      setSearchType('LOT');
      setSearchQuery(lotParam);
      handleLookup('LOT', lotParam);
    } else if (cropParam) {
      setSearchType('CROP');
      setSearchQuery(cropParam);
      handleLookup('CROP', cropParam);
    } else if (queryParam) {
      // Auto-detect queryParam format (transaction hash starts with 0x)
      if (queryParam.startsWith('0x') && queryParam.length === 66) {
        setSearchQuery(queryParam);
        handleLookup('CROP', queryParam);
      } else if (!isNaN(queryParam) && parseInt(queryParam) >= 1000) {
        setSearchType('LOT');
        setSearchQuery(queryParam);
        handleLookup('LOT', queryParam);
      } else {
        setSearchType('CROP');
        setSearchQuery(queryParam);
        handleLookup('CROP', queryParam);
      }
    }
    // 2. Fallback to location state (for internal links)
    else if (location.state?.query) {
      const type = location.state.searchType || 'CROP';
      const query = location.state.query;
      setSearchType(type);
      setSearchQuery(query);
      handleLookup(type, query);
    } else if (location.state?.searchQuery) {
      const query = location.state.searchQuery;
      setSearchQuery(query);
      handleLookup('CROP', query);
    }
  }, [location.state, location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLookup(searchType, searchQuery);
  };

  // Helper to parse evidence photos JSON safely
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
    <div className="space-y-8 py-4 animate-fade-in">
      {/* Back Navigation */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Main Lookup Portal Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex justify-center items-center gap-2">
              <Cpu className="h-7 w-7 text-emerald-600 dark:text-emerald-400 animate-pulse" /> Decentralized Certification & Audit Portal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Query the immutable blockchain ledger for crop verification states, certified grades, and inspection details.
            </p>
          </div>

          {/* Tab Selection */}
          <div className="flex justify-center p-1 bg-slate-100 dark:bg-slate-950 rounded-xl max-w-sm mx-auto">
            <button
              onClick={() => {
                setSearchType('CROP');
                setResult(null);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                searchType === 'CROP'
                  ? 'bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Crop Cultivation ID
            </button>
            <button
              onClick={() => {
                setSearchType('LOT');
                setResult(null);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                searchType === 'LOT'
                  ? 'bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Product Lot Number
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={searchType === 'CROP' ? "Enter Crop ID (e.g. 1)" : "Enter Product Lot (e.g. 1001)"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-12 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-emerald-550 dark:hover:text-emerald-450 transition-colors"
                title="Scan QR Code"
              >
                <QrCode className="h-5 w-5" />
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Lookup'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 text-center max-w-xl mx-auto font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-8 animate-pulse">
          <div className="lg:col-span-6 space-y-8 w-full">
            <div className="h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full"></div>
            <div className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full"></div>
          </div>
          <div className="lg:col-span-6 space-y-8 w-full">
            <div className="h-[480px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full"></div>
          </div>
        </div>
      )}

      {/* Lookup results panel */}
      {result && !loading && (() => {
        const crop = result.type === 'CROP' ? result.data : result.crop;
        const product = result.type === 'CROP' ? result.product : result.data;

        return (
          <div className="w-full font-sans">
            
            {/* PRINTER STYLES */}
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #batch-certificate-print-area, #batch-certificate-print-area * {
                  visibility: visible;
                }
                #batch-certificate-print-area {
                  position: absolute;
                  left: 5%;
                  top: 5%;
                  width: 90%;
                  border: 4px double #10b981 !important;
                  padding: 24px !important;
                  margin: 0 !important;
                  background: white !important;
                  color: black !important;
                }
              }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Certificate & Timeline */}
              <div className="lg:col-span-6 space-y-8 w-full">
                
                {/* SECTION 1: CERTIFICATE CARD OR NOT CERTIFIED NOTICE */}
                {product ? (
                  /* CERTIFIED QUALITY CERTIFICATE & TRUST SEAL CARD */
                  <div 
                    id="batch-certificate-print-area" 
                    className="rounded-3xl border-4 border-double border-emerald-500 bg-white p-6 md:p-8 shadow-xl dark:bg-slate-900 space-y-6 animate-fade-in print:bg-white print:border-emerald-600 print:text-black w-full"
                  >
                    {/* Certificate Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 print:border-slate-300">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 text-[10px] font-bold uppercase tracking-wider print:bg-cyan-50 print:text-cyan-700">
                            Quality Certificate
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-455 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 print:bg-emerald-50 print:text-emerald-700">
                            <Award className="h-3 w-3 animate-pulse text-emerald-600" /> Blockchain Certified
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1 print:text-black">
                          <FileCheck className="h-5 w-5 text-emerald-600 animate-pulse" /> Certified Quality Certificate
                        </h3>
                      </div>
                      <div className="text-left md:text-right font-mono text-xs text-slate-400">
                        <p>Product Lot: #{product.lot_number}</p>
                        <p className="text-[10px]">Issued: {new Date(product.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* 2-column detailed breakdown */}
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      
                      {/* Left Column: Grade & Specs */}
                      <div className="space-y-5">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 print:text-black">
                          Batch Evaluation
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-405 block mb-0.5">Crop Name</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm print:text-black">{product.crop_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-405 block mb-0.5">Assessed Quality Grade</span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-sans font-bold text-xs inline-block border border-emerald-100 dark:border-emerald-900/40 print:bg-emerald-50 print:text-emerald-700">
                              {product.quality_grade}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-405 block mb-0.5">Market Price (Rupees)</span>
                            <span className="font-bold text-slate-900 dark:text-white text-sm print:text-black">
                              Rs. {Math.round(parseFloat(ethers.formatEther(product.price.toString())) * 250000).toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-405 block mb-0.5">Inspection Date</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 print:text-black">{new Date(product.test_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: QR Code Link & Action Buttons */}
                      <div className="flex flex-col items-center space-y-4 shrink-0">
                        <div className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white shadow-md print:border-slate-300">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                              getQrCodeBaseUrl(serverIp) + '/explorer?lot=' + product.lot_number
                            )}`}
                            alt="Product Batch QR Code"
                            className="w-32 h-32"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold text-center leading-tight tracking-wider font-sans max-w-[150px]">
                          Scan QR to Trace Immutable Ledger Proof
                        </span>
                        
                        {/* Action buttons (hidden on print) */}
                        <div className="flex gap-2 w-full max-w-xs print:hidden">
                          <button
                            onClick={() => window.print()}
                            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-705 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition flex items-center justify-center gap-1"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => handleDownloadCertificatePDF(product)}
                            className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            <Download className="h-4 w-4" /> PDF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cryptographic Trust Seal */}
                    {product.tx_hash && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm dark:border-slate-850 dark:bg-slate-950/20 font-mono text-[11px] space-y-3 print:bg-slate-100 print:text-black">
                        <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-sans flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-550 animate-pulse" /> Decentralized Trust Seal Verification
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] block font-sans">Certificate Mint Tx Hash</span>
                            <span className="text-slate-900 dark:text-white block select-all font-semibold break-all print:text-black">{product.tx_hash}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] block font-sans">Ledger Block Height</span>
                            <span className="text-slate-900 dark:text-white font-bold block print:text-black">Confirmed at Block #{product.block_number || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* NOT CERTIFIED BY QUALITY TESTER NOTICE */
                  <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/10 p-6 md:p-8 text-center dark:border-amber-900/50 dark:bg-amber-955/5 space-y-4 animate-fade-in print:hidden w-full">
                    <div className="flex justify-center">
                      <div className="p-3.5 bg-amber-50 text-amber-600 rounded-full dark:bg-amber-950/40 dark:text-amber-400 animate-pulse">
                        <Clock className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold text-amber-800 dark:text-amber-400">
                        Not Certified by Quality Tester
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                        This crop cultivation lot is registered in the decentralized ledger but has not completed laboratory quality inspection or tester approval yet.
                      </p>
                    </div>
                  </div>
                )}

                {/* Traceability Timeline Progress */}
                {crop && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-md dark:border-slate-800 dark:bg-slate-900 space-y-5 print:hidden w-full">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-emerald-600" /> Current Traceability Status
                    </h4>

                    {(() => {
                      const activeStep = getStatusStepNumber(crop.timeline_status || 'CROP_REGISTERED');
                      return (
                        <div className="relative border-l-2 border-emerald-100 dark:border-slate-800 ml-3 pl-6 space-y-6 text-xs font-sans">
                          
                          {/* Step 1: Crop Registered */}
                          <div className="relative">
                            <div className="absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900">
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className="font-bold text-slate-950 dark:text-white">Crop Registered</h4>
                            <p className="text-slate-500 mt-0.5">Farmer declared crop on-chain.</p>
                          </div>

                          {/* Step 2: Quality Tested */}
                          <div className="relative">
                            <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                              activeStep >= 2 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                            }`}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className={`font-bold ${activeStep >= 2 ? 'text-slate-955 dark:text-white' : 'text-slate-400'}`}>Quality Tested</h4>
                            <p className="text-slate-500 mt-0.5">Biochemical metrics assessed.</p>
                          </div>

                          {/* Step 3: Tester Approved */}
                          <div className="relative">
                            <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                              activeStep >= 3 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                            }`}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className={`font-bold ${activeStep >= 3 ? 'text-slate-955 dark:text-white' : 'text-slate-400'}`}>Tester Approved</h4>
                            <p className="text-slate-500 mt-0.5">Lab signs off and certifies crop.</p>
                          </div>

                          {/* Step 4: Funding Completed */}
                          <div className="relative">
                            <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                              activeStep >= 4 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                            }`}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className={`font-bold ${activeStep >= 4 ? 'text-slate-955 dark:text-white' : 'text-slate-400'}`}>Funding Completed</h4>
                            <p className="text-slate-500 mt-0.5">Target capital reached on-ledger.</p>
                          </div>

                          {/* Step 5: Ready to Harvest */}
                          <div className="relative">
                            <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                              activeStep >= 5 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                            }`}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className={`font-bold ${activeStep >= 5 ? 'text-slate-955 dark:text-white' : 'text-slate-400'}`}>Ready to Harvest</h4>
                            <p className="text-slate-500 mt-0.5">Farmer marked crop as ready for harvest.</p>
                          </div>

                          {/* Step 6: Harvest Completed */}
                          <div className="relative">
                            <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                              activeStep >= 6 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                            }`}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className={`font-bold ${activeStep >= 6 ? 'text-slate-955 dark:text-white' : 'text-slate-400'}`}>Harvest Completed</h4>
                            <p className="text-slate-500 mt-0.5">Yield is safely collected.</p>
                          </div>

                          {/* Step 7: Product Available */}
                          <div className="relative">
                            <div className={`absolute -left-[31px] top-0 flex h-4 w-4 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900 ${
                              activeStep >= 7 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
                            }`}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                            </div>
                            <h4 className={`font-bold ${activeStep >= 7 ? 'text-slate-955 dark:text-white' : 'text-slate-400'}`}>Product Available</h4>
                            <p className="text-slate-500 mt-0.5">Batch ready with QR and trust seal.</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Right Column: Cultivation Details & Cryptographic Proof */}
              <div className="lg:col-span-6 space-y-8 w-full">
                {/* SECTION 2: CROP CULTIVATION DETAILS & FARMER INFO (CONSUMER TRACKING INFO) */}
                {crop ? (
                  <div className="space-y-8 w-full">
                    {/* Cultivation specs card */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-md dark:border-slate-800 dark:bg-slate-900 space-y-6 w-full">
                      
                      {/* Cultivation Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-955/30 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                              Decentralized Registry
                            </span>
                            {crop.verification_status === 'VERIFIED' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Audit Verified
                              </span>
                            ) : crop.verification_status === 'REJECTED' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-955/30 dark:text-rose-455 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> Audit Rejected
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-955/30 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <Clock className="h-3 w-3 animate-pulse" /> Pending Audit
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                            <Sprout className="h-5 w-5 text-emerald-600 animate-pulse" /> Cultivation Provenance Details
                          </h3>
                        </div>
                        <div className="text-left md:text-right font-mono text-xs text-slate-400">
                          <p>Crop Reference ID: #{crop.id}</p>
                          <p className="text-[10px]">Registered: {new Date(crop.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* 2-column detailed breakdown */}
                      <div className="grid md:grid-cols-2 gap-8">
                        
                        {/* Left Column: Crop Specs */}
                        <div className="space-y-5">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                            Cultivation Specifications
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                            <div>
                              <span className="text-slate-400 block mb-0.5">Farmer Name</span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{crop.farmer_name || 'Rajesh Patel'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Crop Type</span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">{crop.crop_type}</span>
                            </div>
                            <div>
                              <span className="text-slate-405 block mb-0.5">Farming Method</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm capitalize">{crop.farming_type}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Farm Size</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{crop.farm_size}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Expected Yield</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{crop.expected_yield} kg</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block mb-0.5">Cultivation Date</span>
                              <span className="font-semibold text-slate-805 dark:text-slate-200">{new Date(crop.cultivation_date).toLocaleDateString()}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 block mb-0.5">Farm Jurisdiction Address</span>
                              <span className="font-semibold text-slate-805 dark:text-slate-200 font-sans">
                                {crop.farm_address || crop.farm_location}
                                {crop.village && `, Village: ${crop.village}`}
                                {crop.sub_district && `, Taluk: ${crop.sub_district}`}
                                {crop.district && `, District: ${crop.district}`}
                                {crop.pin_code && ` - ${crop.pin_code}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Auditor Card */}
                        <div className="space-y-5">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                            On-Chain Tester Audit Details
                          </h4>
                          {crop.verification_status !== 'PENDING' ? (
                            <div className="space-y-4 text-xs font-sans">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-400 block mb-0.5">Assigned Verifier</span>
                                  <span className="font-semibold text-slate-805 dark:text-slate-200">{crop.tester_name || 'System Auditor'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-405 block mb-0.5">Audit Date</span>
                                  <span className="font-semibold text-slate-805 dark:text-slate-200 font-sans">
                                    {crop.verification_date ? new Date(crop.verification_date).toLocaleDateString() : 'N/A'}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block mb-0.5">Land Survey Number</span>
                                  <span className="font-mono font-bold text-slate-955 dark:text-white text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded inline-block">
                                    {crop.land_survey_no || 'N/A'}
                                  </span>
                                </div>
                                {crop.gps_latitude && crop.gps_longitude && (
                                  <div className="col-span-2">
                                    <span className="text-slate-405 block mb-0.5">GPS Verification Coordinates</span>
                                    <div className="flex items-center gap-4">
                                      <span className="font-mono text-slate-800 dark:text-slate-200">
                                        Lat: {crop.gps_latitude}, Lng: {crop.gps_longitude}
                                      </span>
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${crop.gps_latitude},${crop.gps_longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-0.5 font-bold animate-pulse"
                                      >
                                        <MapPin className="h-3 w-3 text-emerald-600" /> View on Map <ExternalLink className="h-2 w-2" />
                                      </a>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-3.5 border border-slate-100 dark:border-slate-850 space-y-1">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tester Remarks & Evaluation</span>
                                <p className="text-slate-655 dark:text-slate-350 italic">"{crop.tester_remarks || 'No remarks provided.'}"</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-36 bg-amber-50/20 dark:bg-amber-955/10 border border-dashed border-amber-200 dark:border-amber-900 rounded-2xl p-6 text-center text-slate-500">
                              <Clock className="h-8 w-8 text-amber-505 mb-2 animate-pulse" />
                              <h5 className="font-bold text-amber-800 dark:text-amber-400 text-xs">Audit Pending</h5>
                              <p className="text-[10px] text-slate-400 max-w-[240px] mt-1">
                                This crop registration is waiting for physical land validation and soil chemical analysis by the laboratory team.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Evidence Photos Section */}
                      {getPhotosList(crop.evidence_photos).length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-3">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Submitted Land Evidence</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {getPhotosList(crop.evidence_photos).map((url, idx) => (
                              <a href={url} target="_blank" rel="noopener noreferrer" key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video hover:opacity-85 transition block">
                                <img src={url} alt="Evidence photo" className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cryptographic Proof Card */}
                    {crop.tx_hash && (
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm dark:border-slate-850 dark:bg-slate-950/20 font-mono text-[11px] space-y-3 w-full">
                        <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] font-sans flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-500 animate-pulse" /> Decentralized Trust Ledger Proof
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] block font-sans">Verification Tx Hash</span>
                            <span className="text-slate-955 dark:text-white block select-all font-semibold break-all">{crop.tx_hash}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase text-[9px] block font-sans">Ledger Block Height</span>
                            <span className="text-slate-955 dark:text-white font-bold block">Confirmed at Block #{crop.block_number || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-500 dark:border-slate-800 dark:text-slate-400 print:hidden w-full">
                    No cultivation parent details found for this lot.
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
