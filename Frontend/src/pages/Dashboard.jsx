import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { 
  Sprout, FileCheck, Coins, Eye, Cpu, Settings, ShieldCheck, 
  HelpCircle, UserCheck, CheckCircle2, TrendingUp, Layers, AlertCircle, ArrowRight, Wallet, Mail, Phone,
  UserPlus, X
} from 'lucide-react';
import axios from 'axios';

const KERALA_LOCATIONS = {
  "Thiruvananthapuram": {
    "Thiruvananthapuram": [], "Chirayinkeezhu": [], "Nedumangad": [], "Neyyattinkara": [], "Varkala": []
  },
  "Kollam": {
    "Kollam": [], "Karunagappally": [], "Kunnathur": [], "Punalur": [], "Pathanapuram": [], "Kottarakkara": []
  },
  "Pathanamthitta": {
    "Pathanamthitta": [], "Adoor": [], "Ranni": [], "Konni": [], "Kozhencherry": []
  },
  "Alappuzha": {
    "Alappuzha": [], "Ambalappuzha": [], "Chengannur": [], "Kuttanad": [], "Mavelikkara": []
  },
  "Kottayam": {
    "Kottayam": [], "Changanassery": [], "Vaikom": [], "Meenachil": []
  },
  "Idukki": {
    "Devikulam": [], "Udumbanchola": [], "Idukki": [], "Thodupuzha": []
  },
  "Ernakulam": {
    "Ernakulam": [], "Aluva": [], "Kothamangalam": [], "Muvattupuzha": []
  },
  "Thrissur": {
    "Thrissur": [], "Chavakkad": [], "Kunnamkulam": [], "Irinjalakuda": [], "Mukundapuram": []
  },
  "Palakkad": {
    "Palakkad": [], "Chittur": [], "Alathur": [], "Ottapalam": [], "Mannarkkad": []
  },
  "Malappuram": {
    "Malappuram": [], "Perinthalmanna": [], "Tirur": [], "Nilambur": [], "Ponnani": []
  },
  "Kozhikode": {
    "Kozhikode": [], "Vatakara": [], "Koyilandy": [], "Thamarassery": []
  },
  "Wayanad": {
    "Mananthavady": [], "Sulthan Bathery": [], "Vythiri": []
  },
  "Kannur": {
    "Kannur": [], "Taliparamba": [], "Thalassery": [], "Iritty": []
  },
  "Kasaragod": {
    "Kasaragod": [], "Hosdurg": [], "Manjeshwaram": []
  }
};

export default function Dashboard() {
  const { user, linkWallet, changePassword } = useAuth();
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
  const [unreadUserApprovals, setUnreadUserApprovals] = useState(0);

  const [currentPendingApprovalIds, setCurrentPendingApprovalIds] = useState([]);
  const [currentPendingCertIds, setCurrentPendingCertIds] = useState([]);
  const [currentFarmerCropStatuses, setCurrentFarmerCropStatuses] = useState({});
  const [currentPendingUserIds, setCurrentPendingUserIds] = useState([]);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Wallet verification state
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const [linkingWallet, setLinkingWallet] = useState(false);

  // Inspector creation states
  const [showCreateInspectorModal, setShowCreateInspectorModal] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorEmail, setInspectorEmail] = useState('');
  const [inspectorPhone, setInspectorPhone] = useState('');
  const [inspectorDistrict, setInspectorDistrict] = useState('');
  const [inspectorSubDistrict, setInspectorSubDistrict] = useState('');
  const [inspectorCoverage, setInspectorCoverage] = useState('SUB_DISTRICT');
  const [creatingInspector, setCreatingInspector] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [generatedTempPassword, setGeneratedTempPassword] = useState('');

  const navigate = useNavigate();

  const handleWalletLink = async () => {
    setWalletError('');
    setWalletSuccess('');
    setLinkingWallet(true);
    try {
      let address = walletAddress;
      if (!isConnected) {
        address = await connectWallet();
      }
      if (!address) {
        setWalletError('MetaMask connection failed or was rejected.');
        setLinkingWallet(false);
        return;
      }
      
      if (user?.role === 'INSPECTOR') {
        const message = `Verify wallet ownership for AgroChain Inspector: ${user.email}`;
        let signature;
        try {
          signature = await window.ethereum.request({
            method: 'personal_sign',
            params: [message, address],
          });
        } catch (signErr) {
          console.error(signErr);
          setWalletError('Signature request was rejected by user.');
          setLinkingWallet(false);
          return;
        }
        
        const res = await linkWallet(address, message, signature);
        if (res.success) {
          setWalletSuccess('MetaMask wallet successfully verified and linked!');
        } else {
          setWalletError(res.message);
        }
      } else {
        const res = await linkWallet(address);
        if (res.success) {
          setWalletSuccess('Wallet linked successfully.');
        } else {
          setWalletError(res.message);
        }
      }
    } catch (err) {
      console.error(err);
      setWalletError('Failed to link wallet.');
    } finally {
      setLinkingWallet(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (!newPassword || newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }
    setChangingPass(true);
    const res = await changePassword(newPassword);
    setChangingPass(false);
    if (res.success) {
      setPassSuccess('Password updated successfully!');
    } else {
      setPassError(res.message);
    }
  };

  const handleCreateInspector = async (e) => {
    e.preventDefault();
    setCreateSuccess('');
    setCreateError('');
    setGeneratedTempPassword('');
    setCreatingInspector(true);
    
    try {
      const res = await axios.post('/api/admin/create-inspector', {
        name: inspectorName,
        email: inspectorEmail,
        phone_number: inspectorPhone,
        district: inspectorDistrict,
        sub_district: inspectorSubDistrict,
        coverage_level: inspectorCoverage
      });
      setCreateSuccess('Inspector account created successfully!');
      setGeneratedTempPassword(res.data.temp_password);
      
      // Clear form
      setInspectorName('');
      setInspectorEmail('');
      setInspectorPhone('');
      setInspectorDistrict('');
      setInspectorSubDistrict('');
      setInspectorCoverage('SUB_DISTRICT');
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || 'Failed to create inspector account.');
    } finally {
      setCreatingInspector(false);
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

        if (user?.role === 'INSPECTOR' || user?.role === 'ADMIN') {
          // Inspector Pending Approvals
          const seenApprovals = JSON.parse(localStorage.getItem('inspector_seen_pending_approvals') || '[]');
          let newApprovals = 0;
          const pendingCrops = cropsList.data.filter(c => c.verification_status === 'PENDING');
          const pIds = [];
          pendingCrops.forEach(c => {
            pIds.push(c.id);
            if (!seenApprovals.includes(c.id)) newApprovals++;
          });
          setUnreadPendingApprovals(newApprovals);
          setCurrentPendingApprovalIds(pIds);
        } else if (user?.role === 'TESTER') {
          // Tester Pending Certifications (Approved, READY_TO_HARVEST/HARVEST_COMPLETED/PRODUCT_AVAILABLE, assigned to this tester)
          const seenApprovals = JSON.parse(localStorage.getItem('tester_seen_pending_approvals') || '[]');
          let newApprovals = 0;
          const pendingCrops = cropsList.data.filter(c => c.is_approved === true && c.assigned_tester_id === user.id && ['READY_TO_HARVEST', 'HARVEST_COMPLETED', 'PRODUCT_AVAILABLE'].includes(c.timeline_status));
          const pIds = [];
          pendingCrops.forEach(c => {
            pIds.push(c.id);
            if (!seenApprovals.includes(c.id)) newApprovals++;
          });
          setUnreadPendingApprovals(newApprovals);
          setCurrentPendingApprovalIds(pIds);
        }

        if (user?.role === 'TESTER' || user?.role === 'ADMIN') {
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

        if (user?.role === 'ADMIN') {
          try {
            const usersRes = await axios.get('/api/admin/users');
            const pendingUsers = usersRes.data.filter(u => u.role === 'TESTER' && !u.is_approved);
            const seenUserApprovals = JSON.parse(localStorage.getItem('admin_seen_user_approvals') || '[]');
            let newUserApprovals = 0;
            const pUserIds = [];
            pendingUsers.forEach(u => {
              pUserIds.push(u.id);
              if (!seenUserApprovals.includes(u.id)) {
                newUserApprovals++;
              }
            });
            setUnreadUserApprovals(newUserApprovals);
            setCurrentPendingUserIds(pUserIds);
          } catch (usersErr) {
            console.error("Failed to load admin users for notifications:", usersErr);
          }
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
    const storageKey = user?.role === 'TESTER' ? 'tester_seen_pending_approvals' : 'inspector_seen_pending_approvals';
    localStorage.setItem(storageKey, JSON.stringify(currentPendingApprovalIds));
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

  const handleClearUserApprovals = () => {
    localStorage.setItem('admin_seen_user_approvals', JSON.stringify(currentPendingUserIds));
    setUnreadUserApprovals(0);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
      case 'FARMER': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
      case 'TESTER': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      case 'INSPECTOR': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400';
      case 'INVESTOR': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* First Login Change Password Modal */}
      {user?.must_change_password && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-500 animate-pulse" /> First Login: Password Reset
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For security reasons, you must change your temporary password before accessing your dashboard.
            </p>
            {passError && (
              <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 rounded-xl">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-xl">
                {passSuccess}
              </div>
            )}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={changingPass}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition text-xs flex justify-center items-center gap-2"
              >
                {changingPass ? 'Saving...' : 'Update Password & Continue'}
              </button>
            </form>
          </div>
        </div>
      )}

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
          {['ADMIN', 'INSPECTOR', 'TESTER'].includes(user?.role) ? (
            user?.wallet_address ? (
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-600 dark:bg-slate-955 dark:border-slate-800 dark:text-slate-400 font-mono">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                <span>Wallet: {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(user.wallet_address.length - 4)}</span>
              </div>
            ) : (
              <button
                onClick={handleWalletLink}
                disabled={linkingWallet}
                className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <TrendingUp className="h-4.5 w-4.5" /> Link MetaMask Wallet
              </button>
            )
          ) : (
            <span className="text-xs font-medium text-slate-505 dark:text-slate-400 italic">
              Secure Cloud Account Active
            </span>
          )}
        </div>
      </div>

      {/* MetaMask Warning Alert for Inspectors */}
      {user?.role === 'INSPECTOR' && !user?.wallet_address && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20 space-y-4">
          <div className="flex gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl shrink-0">
              <Wallet className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-100 text-lg">Action Required: Link MetaMask Wallet</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 max-w-xl">
                Your account is currently in <strong>PENDING_SETUP</strong> status. You must verify and link your MetaMask wallet to transition to <strong>ACTIVE</strong> status and receive crop inspection assignments.
              </p>
              {walletError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2">{walletError}</p>
              )}
              {walletSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">{walletSuccess}</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleWalletLink}
            disabled={linkingWallet}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition disabled:opacity-50"
          >
            {linkingWallet ? 'Verifying...' : 'Connect & Verify MetaMask'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MetaMask Warning Alert for Quality Labs */}
      {user?.role === 'TESTER' && !user?.wallet_address && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/20 space-y-4">
          <div className="flex gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-xl shrink-0">
              <Wallet className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-amber-900 dark:text-amber-100 text-lg">Attention: MetaMask Connection Required</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 max-w-xl">
                To perform crop quality certifications, issue lab certificates, and log batch quality records on the blockchain, you must connect and link your MetaMask wallet.
              </p>
              {walletError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2">{walletError}</p>
              )}
              {walletSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2">{walletSuccess}</p>
              )}
            </div>
          </div>
          <button 
            onClick={handleWalletLink}
            disabled={linkingWallet}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-600/20 transition disabled:opacity-50"
          >
            {linkingWallet ? 'Connecting...' : 'Connect & Link MetaMask'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

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

          {/* Inspector & Tester Specific Actions: Pending Approvals */}
          {(user?.role === 'INSPECTOR' || user?.role === 'TESTER' || user?.role === 'ADMIN') && (
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
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Pending Approvals</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role === 'TESTER' 
                    ? 'TESTER: View ready to harvest crops and perform quality certification.' 
                    : 'INSPECTOR: View registered farmer crops and verify farm properties.'}
                </p>
              </div>
            </Link>
          )}

          {/* Tester Specific Actions */}
          {(user?.role === 'TESTER' || user?.role === 'ADMIN') && (
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
                <p className="text-xs text-slate-500 dark:text-slate-400">TESTER: Record lab test logs and create certified product lots.</p>
              </div>
            </Link>
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

          {/* Admin Specific Action: User Approvals */}
          {user?.role === 'ADMIN' && (
            <Link 
              to="/admin/approvals" 
              onClick={handleClearUserApprovals}
              className="relative group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4"
            >
              {unreadUserApprovals > 0 && (
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-slate-900 animate-pulse z-10">
                  {unreadUserApprovals}
                </span>
              )}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 group-hover:scale-105 transition-transform shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">User Approvals</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">ADMIN: Review and approve quality laboratory credentials.</p>
              </div>
            </Link>
          )}

          {/* Admin Specific Action: Create Inspector */}
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => {
                setCreateSuccess('');
                setCreateError('');
                setGeneratedTempPassword('');
                setShowCreateInspectorModal(true);
              }}
              className="text-left group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4 w-full"
            >
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-purple-600 group-hover:scale-105 transition-transform shrink-0">
                <UserPlus className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Create Inspector Account</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">ADMIN: Onboard official field officers, assign coverage, and generate passwords.</p>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Received Partnership Proposals Section (Farmers only) */}
      {user?.role === 'FARMER' && (
        <div className="space-y-6 pt-4">
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="h-5 w-5 text-emerald-600" /> Received Letters of Intent (LOI)
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
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
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

      {/* Create Inspector Modal (Admin only) */}
      {user?.role === 'ADMIN' && showCreateInspectorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setShowCreateInspectorModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="h-6 w-6" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" /> Create Agricultural Inspector Account
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter details to create a new field inspector. The system will auto-generate a temporary password.
              </p>
            </div>

            {createSuccess && (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-semibold space-y-2">
                <p>{createSuccess}</p>
                {generatedTempPassword && (
                  <div className="font-mono bg-white dark:bg-slate-950 p-2.5 rounded border border-emerald-200 dark:border-emerald-800/40 inline-block">
                    Temporary Password: <strong className="text-emerald-700 dark:text-emerald-450 select-all">{generatedTempPassword}</strong> (Copy and share with inspector)
                  </div>
                )}
              </div>
            )}

            {createError && (
              <div className="rounded-xl bg-rose-50 p-4 text-xs text-rose-600 dark:bg-rose-955/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateInspector} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Inspector Name</label>
                <input 
                  type="text" 
                  value={inspectorName} 
                  onChange={(e) => setInspectorName(e.target.value)} 
                  required 
                  placeholder="Rajiv Kumar" 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Official Email</label>
                <input 
                  type="email" 
                  value={inspectorEmail} 
                  onChange={(e) => setInspectorEmail(e.target.value)} 
                  required 
                  placeholder="inspector@agrochain.gov" 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Contact Number</label>
                <input 
                  type="tel" 
                  value={inspectorPhone} 
                  onChange={(e) => setInspectorPhone(e.target.value)} 
                  required 
                  placeholder="+919876543210" 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">District</label>
                <select 
                  value={inspectorDistrict} 
                  onChange={(e) => { setInspectorDistrict(e.target.value); setInspectorSubDistrict(''); }} 
                  required 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
                >
                  <option value="">Select District</option>
                  {Object.keys(KERALA_LOCATIONS).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Sub-District (Taluk)</label>
                <select 
                  value={inspectorSubDistrict} 
                  onChange={(e) => setInspectorSubDistrict(e.target.value)} 
                  required 
                  disabled={!inspectorDistrict}
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{inspectorDistrict ? 'Select Taluk' : 'Select District first'}</option>
                  {inspectorDistrict && KERALA_LOCATIONS[inspectorDistrict] && Object.keys(KERALA_LOCATIONS[inspectorDistrict]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Coverage Level</label>
                <select 
                  value={inspectorCoverage} 
                  onChange={(e) => setInspectorCoverage(e.target.value)} 
                  required 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="SUB_DISTRICT">SUB_DISTRICT</option>
                  <option value="DISTRICT">DISTRICT</option>
                </select>
              </div>
              
              <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateInspectorModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInspector}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2.5 px-6 rounded-xl transition disabled:opacity-50 text-xs shadow-md shadow-purple-600/10"
                >
                  {creatingInspector ? 'Creating...' : 'Create Inspector Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
