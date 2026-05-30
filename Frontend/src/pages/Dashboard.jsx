import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { 
  Sprout, FileCheck, Coins, Eye, Cpu, Settings, ShieldCheck, 
  HelpCircle, UserCheck, CheckCircle2, TrendingUp, Layers
} from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const { user, linkWallet } = useAuth();
  const { walletAddress, isConnected, connectWallet } = useWallet();
  const [stats, setStats] = useState({
    cropsCount: 0,
    lotsCount: 0,
    investmentsCount: 0,
    ratingsCount: 0
  });
  const [loading, setLoading] = useState(true);
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
          ratingsCount: 0 // Mocked/calculated
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400';
      case 'FARMER': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400';
      case 'TESTER': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400';
      default: return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Profile Welcome Block */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            Welcome to your unified Web2 + Web3 AgroChain control panel.
          </p>
        </div>

        {/* MetaMask Link Checker */}
        <div className="shrink-0">
          {user?.wallet_address ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 font-mono">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              <span>Wallet Linked: {user.wallet_address.substring(0, 6)}...{user.wallet_address.substring(user.wallet_address.length - 4)}</span>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Crops Listed</p>
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
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Global Trust</p>
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
              <p className="text-xs text-slate-500 dark:text-slate-400">Fund farmers directly with test ETH and track investment metrics.</p>
            </div>
          </Link>

          {/* Farmer Specific Action */}
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

          {/* Tester Specific Actions */}
          {(user?.role === 'TESTER' || user?.role === 'ADMIN') && (
            <>
              <Link to="/tester/approve" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Pending Approvals</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">TESTER: View registered farmer crops and approve/reject profiles.</p>
                </div>
              </Link>

              <Link to="/tester/product" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
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
    </div>
  );
}
