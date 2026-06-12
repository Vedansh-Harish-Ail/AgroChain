import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ShieldAlert, Users, LineChart, FileText, CheckCircle2, XCircle, ArrowLeft, UserPlus, Award, X, ExternalLink } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLabForReview, setSelectedLabForReview] = useState(null);

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

  const handleUserApprove = async (userId) => {
    try {
      await axios.post(`/api/admin/approve-user/${userId}`);
      alert('User profile approved successfully!');
      loadAdminData();
    } catch (err) {
      console.error(err);
      setError('User approval operation failed.');
    }
  };



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
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400" /> Admin Management Panel
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control role assignments, audit activity trails, verify inspectors, and manage system metrics.</p>
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
          {/* Analytics Block */}
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
                    <span className="text-slate-505">Investors</span>
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

          {/* User Management & Approvals */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">User Authority Verification</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Wallet</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-semibold">{user.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{user.email}</td>
                        <td className="py-3.5 px-4 font-mono text-xs">{user.role}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400 truncate max-w-[120px]">
                          {user.wallet_address || 'Not Connected'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {user.is_approved ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                              <CheckCircle2 className="h-4 w-4" /> Active
                            </span>
                          ) : user.role === 'TESTER' ? (
                            <button
                              onClick={() => setSelectedLabForReview(user)}
                              className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1 text-[10px] font-bold text-white transition-colors"
                            >
                              Review Lab
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserApprove(user.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-500"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Trail */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="h-5 w-5 text-purple-600" /> System Audit Trail
              </h3>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
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
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-indigo-655 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-350 hover:underline"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">Certificate Proof #{i + 1}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
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
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          key={i}
                          className="flex items-center gap-1.5 text-xs text-indigo-655 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-350 hover:underline"
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">Supporting Doc #{i + 1}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
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
    </div>
  );
}
