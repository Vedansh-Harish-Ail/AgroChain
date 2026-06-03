import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Search, Layers, Calendar, ArrowRight, ArrowLeftRight, HelpCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';

export default function BlockchainExplorer() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [txs, setTxs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');

  const loadExplorerData = async () => {
    try {
      const sumRes = await axios.get('/api/explorer/summary');
      setSummary(sumRes.data);
      
      const txsRes = await axios.get('/api/explorer/transactions');
      setTxs(txsRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch blockchain data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExplorerData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      setSelectedTx(null);
      return;
    }
    setError('');
    setLoadingSearch(true);
    try {
      const res = await axios.get(`/api/explorer/tx/${searchQuery}`);
      setSelectedTx(res.data);
    } catch (err) {
      setSelectedTx(null);
      setError('Transaction hash not found in local index.');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Back button */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      {/* Explorer Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex justify-center items-center gap-2">
              <Cpu className="h-7 w-7 text-emerald-600 dark:text-emerald-400" /> AgroChain Blockchain Explorer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Search transactions, verify block state changes, audit smart contract execution event logs.</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Transaction Hash (0x...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm font-mono text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loadingSearch}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50"
            >
              {loadingSearch ? 'Loading...' : 'Search'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 text-center max-w-xl mx-auto">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && !selectedTx && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Latest Confirmed Block</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">#{summary.latest_block}</h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Indexed Tx Logs</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{summary.total_transactions}</h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Smart Contract Wallets</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{summary.unique_wallets_active}</h3>
              </div>
            </div>
          )}

          {/* Search Result Transaction Inspection Panel */}
          {selectedTx ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-1.5">
                  <ArrowLeftRight className="h-5 w-5 text-emerald-600" /> Transaction Receipt Details
                </h3>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-500"
                >
                  Close Inspection
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm font-mono">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Tx Hash</span>
                    <span className="text-xs text-slate-900 dark:text-white block truncate">{selectedTx.tx_hash}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Block Confirmation</span>
                    <span className="text-slate-900 dark:text-white font-bold">Block #{selectedTx.block_number}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Method Invoked</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold font-sans">
                      {selectedTx.method_name || 'Transfer'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Sender Wallet</span>
                    <span className="text-xs text-slate-900 dark:text-white block truncate">{selectedTx.from_address}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Receiver Address</span>
                    <span className="text-xs text-slate-900 dark:text-white block truncate">{selectedTx.to_address || 'Contract Deployment / System'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block font-sans">Value Transferred</span>
                    <span className="text-slate-900 dark:text-white font-semibold">
                      {selectedTx.amount > 0 ? `Rs. ${Math.round(parseFloat(ethers.formatEther(selectedTx.amount.toString())) * 250000).toLocaleString('en-IN')} (${ethers.formatEther(selectedTx.amount.toString())} ETH)` : 'Rs. 0 (0 ETH)'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedTx.event_data && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Decoded Solidity Event Parameters</span>
                  <pre className="rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-950 overflow-x-auto text-emerald-600 dark:text-emerald-400 font-mono">
                    {JSON.stringify(JSON.parse(selectedTx.event_data), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            /* Transactions List */
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Latest Verified Ledger Transactions</h3>
              
              {txs.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-12">No transactions recorded on this local testnet chain.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                        <th className="py-3 px-4">Tx Hash</th>
                        <th className="py-3 px-4">Block</th>
                        <th className="py-3 px-4">From</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Value</th>
                        <th className="py-3 px-4">Age</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {txs.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTx(tx)}
                          className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                        >
                          <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">{tx.tx_hash}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">#{tx.block_number}</td>
                          <td className="py-3.5 px-4 truncate max-w-[120px] text-slate-500 dark:text-slate-400">{tx.from_address}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-sans font-semibold text-[10px]">
                              {tx.method_name || 'Transfer'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            {tx.amount > 0 ? `Rs. ${Math.round(parseFloat(ethers.formatEther(tx.amount.toString())) * 250000).toLocaleString('en-IN')} (${ethers.formatEther(tx.amount.toString())} ETH)` : '0'}
                          </td>
                          <td className="py-3.5 px-4 font-sans text-slate-500 dark:text-slate-450">
                            {new Date(tx.timestamp).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
