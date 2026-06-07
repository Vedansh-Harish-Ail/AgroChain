import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { 
  Sprout, FileCheck, Coins, Eye, Cpu, Settings, ShieldCheck, 
  HelpCircle, UserCheck, CheckCircle2, TrendingUp, Layers, AlertCircle, ArrowRight, Wallet, Mail, Phone
} from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const { user, linkWallet } = useAuth();
  const { walletAddress, isConnected, connectWallet, contracts } = useWallet();
  const [stats, setStats] = useState({
    cropsCount: 0,
    lotsCount: 0,
    investmentsCount: 0,
    ratingsCount: 0
  });
  const [myCrops, setMyCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPendingApprovals, setUnreadPendingApprovals] = useState(0);
  const [unreadPendingCerts, setUnreadPendingCerts] = useState(0);
  const [unreadMyCropUpdates, setUnreadMyCropUpdates] = useState(0);
  const [unreadProposals, setUnreadProposals] = useState(0);

  const [currentPendingApprovalIds, setCurrentPendingApprovalIds] = useState([]);
  const [currentPendingCertIds, setCurrentPendingCertIds] = useState([]);
  const [currentFarmerCropStatuses, setCurrentFarmerCropStatuses] = useState({});

  const navigate = useNavigate();

  const handleWalletLink = async () => {
    let address = walletAddress;
    if (!isConnected) {
      address = await connectWallet();
    }
    if (address) {
      await linkWallet(address);
    }
  };

  const fetchProposals = async () => {
    setLoadingProposals(true);
    try {
      const res = await axios.get('/api/finance/received-proposals');
      setProposals(res.data);

      const seenProposals = JSON.parse(localStorage.getItem('farmer_seen_proposals') || '[]');
      let unread = 0;
      const currentPendingIds = [];
      res.data.forEach(prop => {
        if (prop.status === 'PENDING') {
          currentPendingIds.push(prop.id);
          if (!seenProposals.includes(prop.id)) {
            unread++;
          }
        }
      });
      setUnreadProposals(unread);
      if (unread > 0) {
        localStorage.setItem('farmer_seen_proposals', JSON.stringify(currentPendingIds));
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchSubmittedLOIs = async () => {
    setLoadingProposals(true);
    try {
      const res = await axios.get('/api/finance/my-investments');
      setProposals(res.data);
      
      const seenStatuses = JSON.parse(localStorage.getItem('seen_loi_statuses') || '{}');
      let unread = 0;
      res.data.forEach(loi => {
        if (loi.status !== 'PENDING' && seenStatuses[loi.id] !== loi.status) {
          unread++;
        }
      });
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load submitted LOIs:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleProposalAction = async (proposalId, status) => {
    setProposalError('');
    try {
      await axios.post(`/api/finance/update-status/${proposalId}`, { status });
      const res = await axios.get('/api/finance/received-proposals');
      setProposals(res.data);
      alert(`Proposal successfully ${status.toLowerCase()}ed!`);
    } catch (err) {
      console.error(err);
      setProposalError('Failed to update proposal status.');
    }
  };


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const explorerSummary = await axios.get('/api/explorer/summary');
        const cropsList = await axios.get('/api/farmer/all-crops');
        const lotsList = await axios.get('/api/product/all');
        
        setStats({
          cropsCount: cropsList.data.length,
          lotsCount: lotsList.data.length,
          investmentsCount: explorerSummary.data.total_transactions || 0,
          ratingsCount: 0 
        });

        if (user?.role === 'TESTER' || user?.role === 'ADMIN') {
          // Tester Pending Approvals
          const seenApprovals = JSON.parse(localStorage.getItem('tester_seen_pending_approvals') || '[]');
          let newApprovals = 0;
          const pendingCrops = cropsList.data.filter(c => c.verification_status === 'PENDING');
          const pIds = [];
          pendingCrops.forEach(c => {
            pIds.push(c.id);
            if (!seenApprovals.includes(c.id)) newApprovals++;
          });
          setUnreadPendingApprovals(newApprovals);
          setCurrentPendingApprovalIds(pIds);

          // Tester Certify Batches (Approved crops but no product lot yet)
          const seenCerts = JSON.parse(localStorage.getItem('tester_seen_pending_certs') || '[]');
          let newCerts = 0;
          const lotsFarmerIds = lotsList.data.map(l => l.farmer_id);
          const pendingCertsList = cropsList.data.filter(c => c.is_approved === true && !lotsFarmerIds.includes(c.id));
          const cIds = [];
          pendingCertsList.forEach(c => {
            cIds.push(c.id);
            if (!seenCerts.includes(c.id)) newCerts++;
          });
          setUnreadPendingCerts(newCerts);
          setCurrentPendingCertIds(cIds);
        }

        if (user?.role === 'FARMER') {
          const myCropsRes = await axios.get('/api/farmer/my-crops');
          setMyCrops(myCropsRes.data);
          
          // Farmer My Crop Updates
          const seenCropStatuses = JSON.parse(localStorage.getItem('farmer_seen_crop_statuses') || '{}');
          let unreadMyCrops = 0;
          const currentStatusMap = {};
          myCropsRes.data.forEach(c => {
            const currentStatusSig = `${c.verification_status}_${c.timeline_status}`;
            currentStatusMap[c.id] = currentStatusSig;
            if (seenCropStatuses[c.id] !== currentStatusSig) {
              unreadMyCrops++;
            }
          });
          setUnreadMyCropUpdates(unreadMyCrops);
          setCurrentFarmerCropStatuses(currentStatusMap);

          fetchProposals();
        } else if (user?.role === 'INVESTOR') {
          fetchSubmittedLOIs();
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleClearTesterApprovals = () => {
    localStorage.setItem('tester_seen_pending_approvals', JSON.stringify(currentPendingApprovalIds));
    setUnreadPendingApprovals(0);
  };

  const handleClearTesterCerts = () => {
    localStorage.setItem('tester_seen_pending_certs', JSON.stringify(currentPendingCertIds));
    setUnreadPendingCerts(0);
  };

  const handleClearFarmerCrops = () => {
    localStorage.setItem('farmer_seen_crop_statuses', JSON.stringify(currentFarmerCropStatuses));
    setUnreadMyCropUpdates(0);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
      case 'FARMER': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
      case 'TESTER': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      case 'INVESTOR': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Profile Welcome Block */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
              Hello, {user?.name}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getRoleBadge(user?.role)}`}>
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome to your unified AgroChain control panel.
          </p>
        </div>

        <div className="shrink-0">
          {user?.wallet_address ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 font-mono">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              <span>Wallet: {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(user.wallet_address.length - 4)}</span>
            </div>
          ) : user?.role === 'FARMER' ? (
            <div className="flex items-center gap-3">
               <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">No wallet required for basic use</span>
               <button
                onClick={handleWalletLink}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all"
              >
                <Wallet className="h-4 w-4" /> Link Secure Wallet
              </button>
            </div>
          ) : (
            <button
              onClick={handleWalletLink}
              className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all"
            >
              <TrendingUp className="h-4.5 w-4.5" /> Link MetaMask Wallet
            </button>
          )}
        </div>
      </div>

      {/* Pending Inspection Alert for Farmers */}
      {user?.role === 'FARMER' && myCrops.some(c => c.verification_status === 'PENDING') && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-xl shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 dark:text-blue-100 text-lg">Quality Audits Pending</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400 max-w-xl">
                Some of your registered crop cultivations are awaiting on-site quality inspections and blockchain certification by verifiers.
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/farmer/crops')}
            className="whitespace-nowrap flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition"
          >
            Review Status <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Network Crops</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.cropsCount}</h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Sprout className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certified Batches</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.lotsCount}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger Actions</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.investmentsCount}</h3>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Farmer Trust</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">98.4%</h3>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Menu of Actions */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Operations Console</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Public Action: Traceability */}
          <Link to="/consumer/track" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
              <Eye className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Trace Crop Supply Chain</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Explore farms, trace crop timelines, check lab certificates, and verify ledger hashes.</p>
            </div>
          </Link>

          {/* Public Action: Explorer */}
          <Link to="/explorer" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
              <Cpu className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Blockchain Explorer</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Audit blocks, verify Solidity events, track transaction addresses.</p>
            </div>
          </Link>

          {/* Microfinance (All users) */}
          <Link to="/finance" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 group-hover:scale-105 transition-transform shrink-0">
              <Coins className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Microfinance Portal</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fund farmers directly with test ETH / Rupees (Rs.) and track investment metrics.</p>
            </div>
          </Link>

          {/* Investor Specific Action: Submitted LOIs */}
          {(user?.role === 'INVESTOR' || user?.role === 'ADMIN') && (
            <Link 
              to="/investor/lois"
              className="relative group text-left rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4 w-full"
            >
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-pulse z-10">
                  {unreadCount}
                </span>
              )}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                <Coins className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Submitted Letters of Intent (LOI)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Track status of your letters of intent and proposals sent to farmers.</p>
              </div>
            </Link>
          )}

          {/* Farmer Specific Action: Register Crops */}
          {(user?.role === 'FARMER' || user?.role === 'ADMIN') && (
            <Link to="/farmer/register" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                <Sprout className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Register Crops</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">FARMER: Register a new cultivation lot to request quality verifications.</p>
              </div>
            </Link>
          )}

          {/* Farmer Specific Action: My Crop */}
          {(user?.role === 'FARMER' || user?.role === 'ADMIN') && (
            <Link 
              to="/farmer/crops" 
              onClick={handleClearFarmerCrops}
              className="relative group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4 w-full"
            >
              {unreadMyCropUpdates > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-pulse z-10">
                  {unreadMyCropUpdates}
                </span>
              )}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                <Layers className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">My Crop</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">FARMER: View your crop registration history and track blockchain verification status.</p>
              </div>
            </Link>
          )}

          {/* Tester Specific Actions */}
          {(user?.role === 'TESTER' || user?.role === 'ADMIN') && (
            <>
              <Link 
                to="/tester/approve" 
                onClick={handleClearTesterApprovals}
                className="relative group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4 w-full"
              >
                {unreadPendingApprovals > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-pulse z-10">
                    {unreadPendingApprovals}
                  </span>
                )}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Pending Approvals</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">TESTER: View registered farmer crops and approve/reject profiles.</p>
                </div>
              </Link>

              <Link 
                to="/tester/product" 
                onClick={handleClearTesterCerts}
                className="relative group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4 w-full"
              >
                {unreadPendingCerts > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-pulse z-10">
                    {unreadPendingCerts}
                  </span>
                )}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Certify Batches</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">TESTER: Record test logs and create certified product lots.</p>
                </div>
              </Link>
            </>
          )}

          {/* Admin Specific Action */}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 group-hover:scale-105 transition-transform shrink-0">
                <Settings className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Admin Console</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">ADMIN: View audit logs, oversee active registrations, and analyze fraud.</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Received Partnership Proposals Section (Farmers only) */}
      {user?.role === 'FARMER' && (
        <div className="space-y-6 pt-4">
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-650" /> Received Letters of Intent (LOI)
              {unreadProposals > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-sm ring-1 ring-rose-500/50 animate-pulse ml-2">
                  {unreadProposals}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review Letters of Intent (LOI) and partnership proposals submitted by verified investors for your certified crop lots.</p>
          </div>
          
          {proposalError && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/30">
              {proposalError}
            </div>
          )}

          {loadingProposals ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
            </div>
          ) : proposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-350 p-8 text-center text-slate-400 dark:border-slate-850 dark:text-slate-500 text-xs">
              No Letters of Intent (LOI) received yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {proposals.map((prop) => (
                <div 
                  key={prop.id} 
                  className={`rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900 flex flex-col justify-between transition-all duration-300 ${
                    prop.status === 'ACCEPTED' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 
                    prop.status === 'DECLINED' ? 'border-rose-500 ring-2 ring-rose-500/10 dark:border-rose-900/40' : 
                    'border-amber-500 ring-2 ring-amber-500/10 dark:border-amber-900/40'
                  }`}
                >
                  <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-950 dark:text-white text-sm">LOI from {prop.investor_name}</span>
                        <p className="text-slate-450 dark:text-slate-500 text-[10px] mt-0.5">Lot Number: {prop.lot_number}</p>
                      </div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        prop.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                        prop.status === 'DECLINED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-450' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-450'
                      }`}>{prop.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Proposed Funding</span>
                        <p className="font-bold text-slate-900 dark:text-white">Rs. {prop.amount.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Returns Share</span>
                        <p className="font-bold text-slate-900 dark:text-white">{prop.profit_percentage}% yield margin</p>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3 text-[11px]">
                      <p className="text-slate-700 dark:text-slate-355"><strong>Proposed Terms:</strong> {prop.terms}</p>
                      <p className="text-slate-705 dark:text-slate-350 italic"><strong>Message:</strong> "{prop.message}"</p>
                    </div>

                    {/* Unlocked Contact Panel */}
                    {prop.status === 'ACCEPTED' && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-3 space-y-1.5 text-[11px] animate-in fade-in duration-300">
                        <p className="font-bold text-emerald-800 dark:text-emerald-450 flex items-center gap-1">
                          <ShieldCheck className="h-4 w-4" /> Connection Established
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mt-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {prop.investor_email || 'consumer@gmail.com'}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" /> {prop.investor_phone || '+10000000004'}
                        </p>
                      </div>
                    )}
                  </div>

                  {prop.status === 'PENDING' && (
                    <div className="flex gap-2.5 mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleProposalAction(prop.id, 'ACCEPTED')}
                        className="flex-1 py-2 rounded-xl bg-emerald-650 hover:bg-emerald-600 text-white font-bold text-xs transition"
                      >
                        Accept Proposal
                      </button>
                      <button
                        onClick={() => handleProposalAction(prop.id, 'DECLINED')}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/30 font-bold text-xs transition"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}



    </div>
  );
}
