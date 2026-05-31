import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import addresses from '../contracts/addresses.json';
import FarmerRegistryABI from '../contracts/FarmerRegistry.json';
import ProductRegistryABI from '../contracts/ProductRegistry.json';
import MicroFinanceABI from '../contracts/MicroFinance.json';
import RatingSystemABI from '../contracts/RatingSystem.json';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [error, setError] = useState(null);

  // Check if wallet is already connected on load
  useEffect(() => {
    if (window.ethereum) {
      const checkConnection = async () => {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await browserProvider.send("eth_accounts", []);
          if (accounts.length > 0) {
            await initializeWallet(browserProvider);
          }
        } catch (err) {
          // Log as warning rather than error to avoid blocking non-web3 flows
          console.warn("Wallet connection suppressed during initial load:", err);
        }
      };
      checkConnection();

      // Listen for wallet changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // Wallet disconnected
      setWalletAddress(null);
      setIsConnected(false);
      setSigner(null);
      setContracts({});
    } else {
      // Re-initialize with new active account
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await initializeWallet(browserProvider);
    }
  };

  const initializeWallet = async (browserProvider) => {
    try {
      const currentSigner = await browserProvider.getSigner();
      const address = await currentSigner.getAddress();
      
      // Initialize contract instances
      const farmerRegistry = new ethers.Contract(addresses.FarmerRegistry, FarmerRegistryABI.abi, currentSigner);
      const productRegistry = new ethers.Contract(addresses.ProductRegistry, ProductRegistryABI.abi, currentSigner);
      const microFinance = new ethers.Contract(addresses.MicroFinance, MicroFinanceABI.abi, currentSigner);
      const ratingSystem = new ethers.Contract(addresses.RatingSystem, RatingSystemABI.abi, currentSigner);

      setProvider(browserProvider);
      setSigner(currentSigner);
      setWalletAddress(address.toLowerCase());
      setIsConnected(true);
      setError(null);
      
      setContracts({
        farmerRegistry,
        productRegistry,
        microFinance,
        ratingSystem
      });
      
      return address.toLowerCase();
    } catch (err) {
      console.error("Failed to initialize wallet:", err);
      // Removed setError here to prevent blocking UI for farmers
      return null;
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it to interact with the blockchain.");
      return null;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await browserProvider.send("eth_requestAccounts", []);
      
      // Switch network if not local Hardhat Node
      const network = await browserProvider.getNetwork();
      const hardhatChainId = 31337n; // BigInt in Ethers v6
      
      if (network.chainId !== hardhatChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }], // 31337 in hex
          });
        } catch (switchError) {
          // If network doesn't exist in MetaMask, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7a69',
                chainName: 'Hardhat Localhost',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
                blockExplorerUrls: []
              }]
            });
          } else {
            throw switchError;
          }
        }
      }

      // Recheck provider after network switch/setup
      const finalProvider = new ethers.BrowserProvider(window.ethereum);
      return await initializeWallet(finalProvider);
    } catch (err) {
      console.error("MetaMask connection failed:", err);
      setError("MetaMask connection failed.");
      return null;
    }
  };

  return (
    <WalletContext.Provider value={{ walletAddress, isConnected, connectWallet, contracts, error, provider, signer }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
