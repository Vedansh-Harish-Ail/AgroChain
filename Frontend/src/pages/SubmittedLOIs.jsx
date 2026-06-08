import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Coins, ArrowLeft, Clock, XCircle, ShieldCheck,
  Mail, Phone, FileText, Download, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

export default function SubmittedLOIs() {
  const { user } = useAuth();
  const [lois, setLois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoiForDoc, setSelectedLoiForDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const navigate = useNavigate();

  const counts = {
    ALL: lois.length,
    PENDING: lois.filter(l => l.status === 'PENDING').length,
    ACCEPTED: lois.filter(l => l.status === 'ACCEPTED').length,
    REJECTED: lois.filter(l => l.status === 'DECLINED').length,
  };

  const filteredLois = lois.filter(loi => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return loi.status === 'PENDING';
    if (activeTab === 'ACCEPTED') return loi.status === 'ACCEPTED';
    if (activeTab === 'REJECTED') return loi.status === 'DECLINED';
    return true;
  });

  const fetchLOIs = async () => {
    try {
      const res = await axios.get('/api/finance/my-investments');
      setLois(res.data);

      // Save the current status of each LOI as seen in localStorage
      const seenStatuses = JSON.parse(localStorage.getItem('seen_loi_statuses') || '{}');
      let changed = false;
      res.data.forEach(loi => {
        if (seenStatuses[loi.id] !== loi.status) {
          seenStatuses[loi.id] = loi.status;
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem('seen_loi_statuses', JSON.stringify(seenStatuses));
      }
    } catch (err) {
      console.error("Failed to load submitted LOIs:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchLOIs();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDownloadLoiPDF = () => {
    const element = document.getElementById('loi-document-print-area');
    if (!element) return;

    const opt = {
      margin: [0.4, 0.4, 0.4, 0.4],
      filename: `Letter_of_Intent_LOI_${selectedLoiForDoc.id}.pdf`,
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
    element.style.borderColor = '#cbd5e1';

    const styledElements = [];
    const textElements = element.querySelectorAll('span, p, strong, h2, div');
    textElements.forEach(el => {
      const origColor = el.style.color;
      styledElements.push({ el, type: 'color', val: origColor });

      if (el.classList.contains('text-slate-400') || el.classList.contains('text-slate-450') || el.classList.contains('text-slate-455')) {
        el.style.color = '#64748b';
      } else if (el.classList.contains('text-emerald-600') || el.classList.contains('text-emerald-500')) {
        el.style.color = '#059669';
      } else if (el.classList.contains('text-blue-600')) {
        el.style.color = '#2563eb';
      } else {
        el.style.color = '#0f172a';
      }
    });

    const bgElements = element.querySelectorAll('.bg-slate-50, .dark\\:bg-slate-950, .dark\\:bg-slate-955\\/40, .dark\\:bg-slate-900');
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

  return (
    <div className="space-y-8 py-4">
      {/* Printer styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          ${selectedLoiForDoc ? `
            #loi-document-print-area, #loi-document-print-area * {
              visibility: visible;
            }
            #loi-document-print-area {
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
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-955 dark:text-white flex items-center gap-2">
              <Coins className="h-6 w-6 text-emerald-600" />
              Submitted Letters of Intent (LOI)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Track and manage all your proposed crop micro-finance partnerships.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : lois.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <Coins className="h-12 w-12 text-slate-350 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Submitted Letters of Intent</h3>
          <p className="text-sm text-slate-500 dark:text-slate-405 max-w-md mx-auto">
            You haven't submitted any LOIs yet. Go to the marketplace to propose a crop funding partnership.
          </p>
          <button
            onClick={() => navigate('/finance')}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            Explore Marketplace
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs Filter */}
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-850">
            {[
              { id: 'ALL', label: 'All LOIs', count: counts.ALL },
              { id: 'ACCEPTED', label: 'Accepted', count: counts.ACCEPTED },
              { id: 'PENDING', label: 'Pending', count: counts.PENDING },
              { id: 'REJECTED', label: 'Rejected', count: counts.REJECTED }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${isActive
                      ? tab.id === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                        : tab.id === 'PENDING'
                          ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800/80 dark:text-amber-400 shadow-sm ring-1 ring-amber-500/20'
                          : tab.id === 'ACCEPTED'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800/80 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
                            : 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800/80 dark:text-rose-400 shadow-sm ring-1 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850/60 text-slate-550 dark:text-slate-405'
                    }`}
                >
                  <span>{tab.label}</span>
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive
                      ? tab.id === 'ALL'
                        ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                        : tab.id === 'PENDING'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300'
                          : tab.id === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-900 dark:bg-rose-900/50 dark:text-rose-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredLois.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <Coins className="h-12 w-12 text-slate-350 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No {activeTab.toLowerCase()} LOIs found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-405 max-w-md mx-auto">
                There are currently no letters of intent with the status "{activeTab.toLowerCase()}".
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLois.map(loi => (
                <div
                  key={loi.id}
                  className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 flex flex-col justify-between gap-5 hover:shadow-md transition-all duration-300 ${loi.status === 'ACCEPTED' ? 'border-emerald-500 ring-2 ring-emerald-500/10' :
                      loi.status === 'DECLINED' ? 'border-rose-500 ring-2 ring-rose-500/10 dark:border-rose-900/40' :
                        'border-amber-500 ring-2 ring-amber-500/10 dark:border-amber-900/40'
                    }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${loi.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                            loi.status === 'DECLINED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-455' :
                              'bg-amber-100 text-amber-805 dark:bg-amber-950 dark:text-amber-455'
                          }`}>{loi.status === 'DECLINED' ? 'REJECTED' : loi.status}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base mt-2">LOI for Lot #{loi.lot_number}</h4>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Ref: #{loi.id}</span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-3">
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Farmer:</span> {loi.farmer_name}</p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Proposed Funding:</span> <span className="font-bold text-slate-900 dark:text-white">Rs. {loi.amount.toLocaleString('en-IN')}</span></p>
                      <p><span className="font-semibold text-slate-700 dark:text-slate-300">Yield Share:</span> {loi.profit_percentage}% yield margin</p>
                      <p className="line-clamp-2 italic mt-1.5 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg">"{loi.terms}"</p>
                    </div>
                  </div>

                  {/* Actions & Contact Details */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
                    {loi.status === 'ACCEPTED' && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-3 space-y-1.5 text-[11px]">
                        <p className="font-bold text-emerald-800 dark:text-emerald-450 flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Connection Established
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {loi.farmer_email || 'farmer@gmail.com'}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" /> {loi.farmer_phone || '+10000000001'}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedLoiForDoc(loi)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 py-2.5 rounded-xl transition"
                    >
                      <FileText className="h-4 w-4" /> View LOI Document
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: LOI Document */}
      {selectedLoiForDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto no-scrollbar print:p-0 print:bg-transparent print:relative">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:m-0">

            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 print:hidden">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" /> Decentrailzed Letter of Intent (LOI)
              </h3>
              <button
                onClick={() => setSelectedLoiForDoc(null)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-sm font-semibold transition"
              >
                Close
              </button>
            </div>

            {/* Document Content (Print Target) */}
            <div id="loi-document-print-area" className="space-y-6 font-serif text-slate-800 dark:text-slate-200 p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl print:border-none print:p-0 print:text-black">
              {/* Official Letterhead */}
              <div className="text-center space-y-2 border-b border-slate-250 pb-4 print:border-slate-300">
                <div className="flex justify-center items-center gap-2">
                  <Coins className="h-8 w-8 text-emerald-600" />
                  <span className="font-sans font-extrabold text-xl tracking-wider text-slate-900 dark:text-white print:text-black">AGROCHAIN MICRO-FINANCE</span>
                </div>
                <p className="font-sans text-[10px] text-slate-400 uppercase tracking-widest">Decentralized Letter of Intent & Funding Agreement</p>
              </div>

              {/* Date and Ref */}
              <div className="flex justify-between text-xs font-sans text-slate-400">
                <span>Ref ID: #AC-LOI-{selectedLoiForDoc.id}</span>
                <span>Date: {new Date(selectedLoiForDoc.timestamp).toLocaleDateString()}</span>
              </div>

              {/* Salutation */}
              <div className="space-y-4 text-sm leading-relaxed">
                <p className="font-bold font-sans text-slate-900 dark:text-white print:text-black">LETTER OF INTENT FOR AGRICULTURAL CO-INVESTMENT</p>
                <p>
                  This official document is issued by the co-investor
                  <strong> {selectedLoiForDoc.investor_name}</strong> to the cultivator
                  <strong> {selectedLoiForDoc.farmer_name}</strong> as a formal proposal to fund crop cultivation Lot <strong>#{selectedLoiForDoc.lot_number}</strong>. This LOI serves as the basis of the smart contract transaction logged on the immutable blockchain ledger.
                </p>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl font-sans text-xs my-4 print:bg-slate-100 print:text-black">
                  <div>
                    <span className="text-slate-455 block mb-0.5">Proposed Funding Amount</span>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">Rs. {selectedLoiForDoc.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block mb-0.5">Expected Returns Share</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{selectedLoiForDoc.profit_percentage}% of yield sales</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block mb-0.5">Investor Name</span>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">{selectedLoiForDoc.investor_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-455 block mb-0.5">Farmer Name</span>
                    <span className="font-bold text-slate-900 dark:text-white print:text-black">{selectedLoiForDoc.farmer_name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-455 block mb-0.5">Proposed Terms & Conditions</span>
                    <p className="italic text-slate-800 dark:text-slate-200 mt-1 font-serif print:text-black">"{selectedLoiForDoc.terms}"</p>
                  </div>
                </div>

                {selectedLoiForDoc.message && (
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-400 block font-sans uppercase font-bold text-[9px] tracking-wider">Investor Message</span>
                    <p className="italic">"{selectedLoiForDoc.message}"</p>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-150 dark:border-slate-800 font-sans text-xs">
                <div className="text-center">
                  <div className="border-b border-slate-300 pb-1">
                    <span className="font-mono text-slate-700 dark:text-slate-300 italic font-bold print:text-black">{selectedLoiForDoc.investor_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 uppercase tracking-wider">Co-Investor Signature</span>
                </div>
                <div className="text-center">
                  <div className="border-b border-slate-300 pb-1">
                    <span className="font-mono text-slate-750 dark:text-slate-300 italic font-bold print:text-black">{selectedLoiForDoc.farmer_name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 uppercase tracking-wider">Farmer Acceptance Signature</span>
                </div>
              </div>

              {/* Blockchain proof */}
              {selectedLoiForDoc.tx_hash && (
                <div className="bg-slate-50 dark:bg-slate-955/40 p-3 rounded-xl font-mono text-[9px] text-slate-400 border border-slate-100 dark:border-slate-850 mt-4 flex justify-between items-center print:bg-slate-100 print:text-black">
                  <span>Ledger Block Height: #{selectedLoiForDoc.block_number || 'N/A'}</span>
                  <span className="truncate max-w-[280px]">Tx: {selectedLoiForDoc.tx_hash}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedLoiForDoc(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-705 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
              >
                Print Document
              </button>
              <button
                onClick={handleDownloadLoiPDF}
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
