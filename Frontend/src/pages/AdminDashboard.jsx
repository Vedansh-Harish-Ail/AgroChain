import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ShieldAlert, Users, LineChart, FileText, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                    <span className="font-bold">{analytics.user_counts.testers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consumers</span>
                    <span className="font-bold">{analytics.user_counts.consumers}</span>
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
                    <p className="text-slate-600 dark:text-slate-450 leading-tight">{log.details}</p>
                    <p className="text-[9px] text-slate-400">Trigger: {log.user_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
