import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, ShieldCheck, ArrowLeft, Clock, XCircle, 
  FileText, Award, Download, ExternalLink 
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

export default function CropHistory() {
  const { user } = useAuth();
  const [myCrops, setMyCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCropForLetter, setSelectedCropForLetter] = useState(null);
  const [selectedCropForCertificate, setSelectedCropForCertificate] = useState(null);
  const navigate = useNavigate();

  const fetchCrops = async () => {
    try {
      const res = await axios.get('/api/farmer/my-crops');
      setMyCrops(res.data);
    } catch (err) {
      console.error("Failed to load crop history:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/product/all');
      setProducts(res.data);
    } catch (err) {
      console.error("Failed to load product certificates:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCrops(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleUpdateTimeline = async (cropId, timelineStatus) => {
    try {
      await axios.post(`/api/farmer/update-timeline/${cropId}`, {
        timeline_status: timelineStatus
      });
      await fetchCrops();
      alert('Timeline status updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update timeline status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDownloadLetterPDF = () => {
    const element = document.getElementById('approval-letter-print-area');
    if (!element) return;

    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4],
      filename:     `Approval_Letter_Crop_${selectedCropForLetter.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const originalStyle = element.getAttribute('style') || '';
    element.style.backgroundColor = '#ffffff';
    element.style.color = '#0f172a';
    element.style.borderColor = '#cbd5e1';

    const styledElements = [];
    const textElements = element.querySelectorAll('span, p, strong, h2, div');
    textElements.forEach(el => {
      const origColor = el.style.color;
      styledElements.push({ el, type: 'color', val: origColor });
      
      if (el.classList.contains('text-slate-400') || el.classList.contains('text-slate-450') || el.classList.contains('text-slate-455')) {
        el.style.color = '#64748b';
      } else if (el.classList.contains('text-emerald-600')) {
        el.style.color = '#059669';
      } else if (el.classList.contains('text-blue-600')) {
        el.style.color = '#2563eb';
      } else {
        el.style.color = '#0f172a';
      }
    });

    const bgElements = element.querySelectorAll('.bg-slate-50, .dark\\:bg-slate-950, .dark\\:bg-slate-950\\/40');
    bgElements.forEach(el => {
      const origBg = el.style.backgroundColor;
      styledElements.push({ el, type: 'bg', val: origBg });
      el.style.backgroundColor = '#f8fafc';
      el.style.color = '#0f172a';
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

  const handleDownloadCertificatePDF = () => {
    const element = document.getElementById('batch-certificate-print-area');
    if (!element) return;

    const opt = {
      margin:       [0.4, 0.4, 0.4, 0.4],
      filename:     `Quality_Certificate_Lot_${selectedCropForCertificate.product.lot_number}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff'
      },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CROP_REGISTERED': return '1. Crop Registered';
      case 'QUALITY_TESTED': return '2. Quality Tested';
      case 'TESTER_APPROVED': return '3. Tester Approved';
      case 'FUNDING_COMPLETED': return '4. Funding Completed';
      case 'READY_TO_HARVEST': return '5. Ready to Harvest';
      case 'HARVEST_COMPLETED': return '6. Harvest Completed';
      case 'PRODUCT_AVAILABLE': return '7. Product Available';
      default: return status;
    }
  };

  const getTimelineSelectProps = (crop) => {
    const isVerified = crop.verification_status === 'VERIFIED';
    const status = crop.timeline_status || 'CROP_REGISTERED';
    
    if (!isVerified) {
      return {
        disabled: true,
        options: [
          { value: 'CROP_REGISTERED', label: '1. Crop Registered (Awaiting Audit)' }
        ]
      };
    }
    
    switch (status) {
      case 'CROP_REGISTERED':
      case 'QUALITY_TESTED':
      case 'TESTER_APPROVED':
        return {
          disabled: false,
          options: [
            { value: status, label: getStatusLabel(status) },
            { value: 'READY_TO_HARVEST', label: '5. Ready to Harvest' }
          ]
        };
      case 'FUNDING_COMPLETED':
        return {
          disabled: false,
          options: [
            { value: 'FUNDING_COMPLETED', label: '4. Funding Completed' },
            { value: 'READY_TO_HARVEST', label: '5. Ready to Harvest' }
          ]
        };
      case 'READY_TO_HARVEST':
        return {
          disabled: false,
          options: [
            { value: 'READY_TO_HARVEST', label: '5. Ready to Harvest' },
            { value: 'HARVEST_COMPLETED', label: '6. Harvest Completed' }
          ]
        };
      case 'HARVEST_COMPLETED':
        return {
          disabled: true,
          options: [
            { value: 'HARVEST_COMPLETED', label: '6. Harvest Completed (Awaiting Tester Certification)' }
          ]
        };
      case 'PRODUCT_AVAILABLE':
        return {
          disabled: true,
          options: [
            { value: 'PRODUCT_AVAILABLE', label: '7. Product Available (Certified)' }
          ]
        };
      default:
        return {
          disabled: true,
          options: [
            { value: status, label: status }
          ]
        };
    }
  };

  return (
    <div className="space-y-8 py-4">
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

      {/* Header and Back navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <Sprout className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Crop Registration History
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage your registered crops, view details, download approval letters, and print batch QR codes.
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
            {myCrops.map(crop => {
              const matchedProduct = products.find(p => p.farmer_id === crop.id);
              
              return (
                <div key={crop.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between gap-5 hover:shadow-md transition">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl shrink-0 self-start ${crop.verification_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : crop.verification_status === 'REJECTED' ? 'bg-rose-50 text-rose-655 dark:bg-rose-950/40' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'}`}>
                      <Sprout className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">{crop.crop_type}</h4>
                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Location:</span> {crop.farm_location}</p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Size:</span> {crop.farm_size}</p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Expected Yield:</span> {crop.expected_yield}kg</p>
                        <p><span className="font-semibold text-slate-700 dark:text-slate-300">Survey No:</span> <span className="font-mono text-[11px] font-bold">{crop.land_survey_no || 'N/A'}</span></p>
                      </div>
                      <p className="text-[10px] text-slate-405 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                        Farming: <span className="capitalize">{crop.farming_type}</span> • Registered: {new Date(crop.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Timeline Status Selector */}
                  <div className="space-y-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                      Traceability Timeline Status
                    </span>
                    {(() => {
                      const selectProps = getTimelineSelectProps(crop);
                      return (
                        <select
                          value={crop.timeline_status || 'CROP_REGISTERED'}
                          disabled={selectProps.disabled}
                          onChange={(e) => handleUpdateTimeline(crop.id, e.target.value)}
                          className={`w-full rounded-xl border border-slate-200 py-2 px-3 text-xs text-slate-800 dark:border-slate-800 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                            selectProps.disabled
                              ? 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed text-slate-400 dark:text-slate-550'
                              : 'bg-slate-50 dark:bg-slate-950'
                          }`}
                        >
                          {selectProps.options.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                  
                  {/* Status and Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {crop.verification_status === 'VERIFIED' ? (
                      <div className="space-y-3">
                        <div className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-950">
                          <ShieldCheck className="h-4 w-4" /> Blockchain Verified
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 pt-1">
                          <button
                            onClick={() => setSelectedCropForLetter(crop)}
                            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 py-2.5 rounded-xl transition"
                          >
                            <FileText className="h-4 w-4" /> View Approval Letter
                          </button>

                          {matchedProduct ? (
                            <button
                              onClick={() => setSelectedCropForCertificate({ crop, product: matchedProduct })}
                              className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 py-2.5 rounded-xl transition"
                            >
                              <Award className="h-4 w-4" /> Print Certificate & QR
                            </button>
                          ) : crop.timeline_status === 'HARVEST_COMPLETED' ? (
                            <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 italic py-1 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                              Awaiting Tester Certification
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : crop.verification_status === 'REJECTED' ? (
                      <div className="w-full flex flex-col items-center justify-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-455 bg-rose-50 dark:bg-rose-950/30 px-3 py-3 rounded-xl border border-rose-100 dark:border-rose-950">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="h-4 w-4" /> Audit Rejected
                        </div>
                        {crop.tester_remarks && (
                          <p className="text-[10px] text-rose-550 text-center italic mt-1 line-clamp-2">
                            "{crop.tester_remarks}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 rounded-xl border border-amber-100 dark:border-amber-950">
                        <Clock className="h-4 w-4 animate-pulse" /> Pending Tester Audit
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Approval Letter */}
      {selectedCropForLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar print:p-0 print:bg-transparent print:relative">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">
            
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
              {/* Official Letterhead */}
              <div className="text-center space-y-2 border-b border-slate-250 pb-4 print:border-slate-300">
                <div className="flex justify-center items-center gap-2">
                  <Sprout className="h-8 w-8 text-emerald-600" />
                  <span className="font-sans font-extrabold text-xl tracking-wider text-slate-900 dark:text-white print:text-black">AGROCHAIN TRANSPARENCY LABS</span>
                </div>
                <p className="font-sans text-[10px] text-slate-400 uppercase tracking-widest">Quality Assurance & Organic Verification Department</p>
              </div>

              {/* Date and Ref */}
              <div className="flex justify-between text-xs font-sans text-slate-400">
                <span>Ref ID: #AC-CROP-{selectedCropForLetter.id}</span>
                <span>Date: {selectedCropForLetter.verification_date ? new Date(selectedCropForLetter.verification_date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </div>

              {/* Salutation */}
              <div className="space-y-4 text-sm leading-relaxed">
                <p className="font-bold font-sans text-slate-900 dark:text-white print:text-black">TO WHOMSOEVER IT MAY CONCERN</p>
                <p>
                  This official document serves as a certificate of compliance confirming that the crop cultivation lot registered by 
                  <strong> {selectedCropForLetter.farmer_name || user?.name}</strong> under ID <strong>#{selectedCropForLetter.id}</strong> has passed all rigorous chemical-free farming standards, soil health toxicity tests, and ownership deed verifications conducted on-site by our authorized verifiers.
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

              {/* Remarks and Sign */}
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

              {/* Ledger Proof */}
              {selectedCropForLetter.tx_hash && (
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl font-mono text-[9px] text-slate-400 border border-slate-100 dark:border-slate-850 mt-4 flex justify-between items-center print:bg-slate-100 print:text-black">
                  <span>Ledger Block Height: #{selectedCropForLetter.block_number || 'N/A'}</span>
                  <span className="truncate max-w-[280px]">Tx: {selectedCropForLetter.tx_hash}</span>
                </div>
              )}
            </div>

            {/* Footer / Printable Action */}
            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedCropForLetter(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-705 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition"
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
              
              {/* Certificate Badge & Title */}
              <div className="text-center space-y-2">
                <div className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase tracking-wider text-[10px] print:bg-emerald-100 print:text-emerald-800">
                    Blockchain Certified Lot
                  </span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white print:text-black">
                  QUALITY CERTIFICATE & TRUST SEAL
                </h2>
                <p className="text-[10px] font-medium text-slate-505 dark:text-slate-400 uppercase tracking-widest font-sans">Issued under Decentralized Product Registry</p>
              </div>

              {/* Certificate Body (Table/Grid) */}
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
                    <span className="inline-block px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-455 dark:border-emerald-900 font-bold text-xs mt-1">
                      {selectedCropForCertificate.product.quality_grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Inspection Test Date</span>
                    <span className="font-semibold text-slate-805 dark:text-slate-200 print:text-black">{new Date(selectedCropForCertificate.product.test_date).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider block font-bold font-sans">Batch Expiry Date</span>
                    <span className="font-semibold text-slate-805 dark:text-slate-200 print:text-black">{new Date(selectedCropForCertificate.product.expiry_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Right QR Code Link (Dynamic link to explorer) */}
                <div className="flex flex-col items-center space-y-2 shrink-0">
                  <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white shadow-sm print:border-slate-300">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                        window.location.origin + '/explorer?lot=' + selectedCropForCertificate.product.lot_number
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

              {/* Cryptographic Trust Hashes */}
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

            {/* Printable Actions */}
            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedCropForCertificate(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-705 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition"
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
