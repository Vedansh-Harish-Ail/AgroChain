import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import { DashboardSkeleton } from '../components/Skeletons';
import { 
  Sprout, FileCheck, Coins, Eye, Cpu, Settings, ShieldCheck, 
  HelpCircle, UserCheck, CheckCircle2, TrendingUp, Layers, AlertCircle, ArrowRight, Wallet, Mail, Phone,
  UserPlus, X, CloudSun, CloudMoon, Sun, Moon, Droplets, Thermometer, Wind, BookOpen, Sparkles, Clock,
  RotateCw
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

const DISTRICT_COORDINATES = {
  "Thiruvananthapuram": { lat: 8.5241, lon: 76.9366 },
  "Kollam": { lat: 8.8932, lon: 76.6141 },
  "Pathanamthitta": { lat: 9.2648, lon: 76.7870 },
  "Alappuzha": { lat: 9.4981, lon: 76.3388 },
  "Kottayam": { lat: 9.5916, lon: 76.5222 },
  "Idukki": { lat: 9.9189, lon: 77.1025 },
  "Ernakulam": { lat: 9.9816, lon: 76.2999 },
  "Thrissur": { lat: 10.5276, lon: 76.2144 },
  "Palakkad": { lat: 10.7867, lon: 76.6548 },
  "Malappuram": { lat: 11.0735, lon: 76.0740 },
  "Kozhikode": { lat: 11.2588, lon: 75.7804 },
  "Wayanad": { lat: 11.6854, lon: 76.1320 },
  "Kannur": { lat: 11.8745, lon: 75.3704 },
  "Kasaragod": { lat: 12.5102, lon: 74.9852 }
};

export default function Dashboard() {
  const { user, linkWallet, changePassword } = useAuth();
  const { walletAddress, isConnected, connectWallet, contracts } = useWallet();
  const { showToast } = useToast();
  const { showLoading, hideLoading } = useLoading();
  const [stats, setStats] = useState({
    cropsCount: 0,
    lotsCount: 0,
    investmentsCount: 0,
    ratingsCount: 0,
    testerCertsCount: 0,
    inspectorVerifiedCount: 0
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
  const [alerts, setAlerts] = useState([]);

  const [currentPendingApprovalIds, setCurrentPendingApprovalIds] = useState([]);
  const [currentPendingCertIds, setCurrentPendingCertIds] = useState([]);
  const [currentFarmerCropStatuses, setCurrentFarmerCropStatuses] = useState({});
  const [currentPendingUserIds, setCurrentPendingUserIds] = useState([]);

  // Farmer metrics states
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || 'Thrissur');
  const districtInitialized = useRef(false);

  useEffect(() => {
    if (user?.district && !districtInitialized.current) {
      setSelectedDistrict(user.district);
      districtInitialized.current = true;
    }
  }, [user?.district]);

  const fetchWeather = useCallback(async (force = false) => {
    if (user?.role !== 'FARMER') return;
    
    const shouldForce = force === true;
    const cacheKey = `weather_${selectedDistrict}`;
    
    if (!shouldForce) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          // 15 minutes cache lifetime
          if (Date.now() - timestamp < 15 * 60 * 1000) {
            setWeatherData(data);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached weather:", e);
        }
      }
    }

    setWeatherLoading(true);
    try {
      const coords = DISTRICT_COORDINATES[selectedDistrict] || DISTRICT_COORDINATES['Thrissur'];
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,wind_speed_10m,weather_code,is_day`
      );
      if (!response.ok) {
        throw new Error(`Weather API returned status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.current) {
        const newWeatherData = {
          temp: Math.round(data.current.temperature_2m),
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
          isDay: data.current.is_day,
          district: selectedDistrict,
          isSimulated: false,
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setWeatherData(newWeatherData);
        localStorage.setItem(cacheKey, JSON.stringify({
          data: newWeatherData,
          timestamp: Date.now()
        }));
      } else {
        throw new Error("No current weather data");
      }
    } catch (err) {
      console.error("Failed to fetch live weather, using simulated weather:", err);
      
      // Deterministic simulation based on district and today's date
      const todayStr = new Date().toDateString();
      const getDeterministicValue = (district, seed, min, max) => {
        const str = `${district}_${seed}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return min + (Math.abs(hash) % (max - min + 1));
      };

      const districtBaselines = {
        "Thiruvananthapuram": 30,
        "Kollam": 30,
        "Pathanamthitta": 29,
        "Alappuzha": 30,
        "Kottayam": 29,
        "Idukki": 22,
        "Ernakulam": 31,
        "Thrissur": 31,
        "Palakkad": 34,
        "Malappuram": 31,
        "Kozhikode": 31,
        "Wayanad": 21,
        "Kannur": 31,
        "Kasaragod": 31
      };
      
      const baseTemp = districtBaselines[selectedDistrict] || 29;
      const tempOffset = getDeterministicValue(selectedDistrict, `${todayStr}_temp`, -1, 2);
      const finalTemp = baseTemp + tempOffset;
      
      const weatherCodes = [0, 1, 3, 51, 80];
      const codeIndex = getDeterministicValue(selectedDistrict, `${todayStr}_code`, 0, 4);
      const randomCode = weatherCodes[codeIndex];
      
      const windOffset = getDeterministicValue(selectedDistrict, `${todayStr}_wind`, 40, 120);
      const randomWind = (windOffset / 10).toFixed(1);
      
      const currentHour = new Date().getHours();
      const simIsDay = currentHour >= 6 && currentHour < 18 ? 1 : 0;

      const simWeatherData = {
        temp: finalTemp,
        windSpeed: parseFloat(randomWind),
        weatherCode: randomCode,
        isDay: simIsDay,
        district: selectedDistrict,
        isSimulated: true,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setWeatherData(simWeatherData);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: simWeatherData,
        timestamp: Date.now()
      }));
    } finally {
      setWeatherLoading(false);
    }
  }, [user, selectedDistrict]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const getWeatherDesc = (code, isDay = 1) => {
    const isNight = isDay === 0;
    if (code === 0) return { label: isNight ? 'Clear Night' : 'Sunny' };
    if (code >= 1 && code <= 3) return { label: isNight ? 'Partly Cloudy' : 'Partly Cloudy' };
    if (code >= 45 && code <= 48) return { label: 'Foggy' };
    if (code >= 51 && code <= 67) return { label: 'Rainy' };
    if (code >= 80 && code <= 82) return { label: 'Rain Showers' };
    if (code >= 95 && code <= 99) return { label: 'Thunderstorm' };
    return { label: isNight ? 'Clear Night' : 'Clear' };
  };

  const getWeatherIcon = (code, isDay = 1) => {
    const isNight = isDay === 0;
    if (code === 0) {
      return isNight 
        ? <Moon className="h-10 w-10 text-indigo-305 animate-pulse shrink-0" /> 
        : <Sun className="h-10 w-10 text-amber-550 animate-pulse shrink-0" />;
    }
    if (code >= 1 && code <= 3) {
      return isNight 
        ? <CloudMoon className="h-10 w-10 text-indigo-305 shrink-0" /> 
        : <CloudSun className="h-10 w-10 text-amber-500 shrink-0" />;
    }
    if (code >= 51 && code <= 67) return <Droplets className="h-10 w-10 text-blue-500 animate-bounce shrink-0" />;
    if (code >= 80 && code <= 82) return <Droplets className="h-10 w-10 text-blue-400 shrink-0" />;
    return isNight 
      ? <CloudMoon className="h-10 w-10 text-slate-400 shrink-0" /> 
      : <CloudSun className="h-10 w-10 text-slate-400 shrink-0" />;
  };

  const getCropAdvisory = () => {
    const registeredCrops = myCrops.map(c => (c.crop_type || '').toLowerCase());
    let matchedAdvisories = [];
    if (registeredCrops.some(c => c.includes('rice') || c.includes('paddy'))) {
      matchedAdvisories.push({
        crop: 'Rice / Paddy',
        stage: 'Flowering Stage',
        tips: [
          'Maintain 5cm water level in the field during grain filling.',
          'Monitor carefully for stem borer and leaf folder pests.'
        ]
      });
    }
    if (registeredCrops.some(c => c.includes('coconut'))) {
      matchedAdvisories.push({
        crop: 'Coconut Palm',
        stage: 'Pre-Monsoon Care',
        tips: [
          'Clean palm crowns to prevent bud rot during heavy rain.',
          'Apply organic manure/compost to root basin and mulch.'
        ]
      });
    }
    if (registeredCrops.some(c => c.includes('pepper'))) {
      matchedAdvisories.push({
        crop: 'Black Pepper',
        stage: 'Vines Support',
        tips: [
          'Provide proper support to young vines and regulate shade.',
          'Apply phytophthora control measures before monsoons.'
        ]
      });
    }
    if (registeredCrops.some(c => c.includes('tapioca') || c.includes('cassava'))) {
      matchedAdvisories.push({
        crop: 'Tapioca / Cassava',
        stage: 'Root Development',
        tips: [
          'Apply balanced NPK fertilizer for starch accumulation.',
          'Mound soil around tubers to shield them from exposure.'
        ]
      });
    }

    if (matchedAdvisories.length === 0) {
      return {
        crop: 'General Advisory',
        stage: 'Seasonal Planning',
        tips: [
          'Apply organic manure before planting new batches.',
          'Regularly inspect crop foliage for pest/disease outbreaks.'
        ]
      };
    }
    return matchedAdvisories[0];
  };

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Wallet verification state
  const [walletError, setWalletError] = useState('');
  const [walletSuccess, setWalletSuccess] = useState('');
  const [linkingWallet, setLinkingWallet] = useState(false);

  // Inspector & Tester creation states
  const [showCreateInspectorModal, setShowCreateInspectorModal] = useState(false);
  const [onboardRole, setOnboardRole] = useState('INSPECTOR'); // 'INSPECTOR' or 'TESTER'
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorEmail, setInspectorEmail] = useState('');
  const [inspectorPhone, setInspectorPhone] = useState('');
  const [inspectorDistrict, setInspectorDistrict] = useState('');
  const [inspectorSubDistrict, setInspectorSubDistrict] = useState('');
  const [inspectorCoverage, setInspectorCoverage] = useState('SUB_DISTRICT');
  const [testerPinCode, setTesterPinCode] = useState('');
  const [testerLabName, setTesterLabName] = useState('');
  const [testerLicense, setTesterLicense] = useState('');
  const [testerAccreditation, setTesterAccreditation] = useState('');
  const [testerGovReg, setTesterGovReg] = useState('');
  const [creatingInspector, setCreatingInspector] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');
  const [generatedTempPassword, setGeneratedTempPassword] = useState('');

  // First Login setup wallet states
  const [setupWalletAddress, setSetupWalletAddress] = useState('');
  const [setupMessage, setSetupMessage] = useState('');
  const [setupSignature, setSetupSignature] = useState('');
  const [setupWalletConnected, setSetupWalletConnected] = useState(false);
  const [verifyingSetupWallet, setVerifyingSetupWallet] = useState(false);
  const [setupError, setSetupError] = useState('');

  const navigate = useNavigate();

  const handleWalletLink = async () => {
    setWalletError('');
    setWalletSuccess('');
    setLinkingWallet(true);
    showLoading('Verifying and linking your MetaMask wallet...');
    try {
      let address = walletAddress;
      if (!isConnected) {
        address = await connectWallet();
      }
      if (!address) {
        setWalletError('MetaMask connection failed or was rejected.');
        setLinkingWallet(false);
        hideLoading();
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
          hideLoading();
          return;
        }
        
        const res = await linkWallet(address, message, signature);
        hideLoading();
        if (res.success) {
          setWalletSuccess('MetaMask wallet successfully verified and linked!');
        } else {
          setWalletError(res.message);
        }
      } else {
        const res = await linkWallet(address);
        hideLoading();
        if (res.success) {
          setWalletSuccess('Wallet linked successfully.');
        } else {
          setWalletError(res.message);
        }
      }
    } catch (err) {
      console.error(err);
      setWalletError('Failed to link wallet.');
      hideLoading();
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleSetupConnectWallet = async () => {
    setSetupError('');
    setVerifyingSetupWallet(true);
    try {
      // Always request accounts fresh from MetaMask
      if (!window.ethereum) {
        setSetupError('MetaMask is not installed. Please install the MetaMask browser extension.');
        setVerifyingSetupWallet(false);
        return;
      }
      let accounts;
      try {
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (reqErr) {
        setSetupError('MetaMask connection was rejected. Please approve the connection request.');
        setVerifyingSetupWallet(false);
        return;
      }
      const address = accounts?.[0];
      if (!address) {
        setSetupError('No MetaMask account found. Please unlock MetaMask and try again.');
        setVerifyingSetupWallet(false);
        return;
      }
      
      const message = user?.role === 'TESTER'
        ? `Verify wallet ownership for AgroChain Quality Lab: ${user.email}`
        : `Verify wallet ownership for AgroChain Inspector: ${user.email}`;
      
      let signature;
      try {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
      } catch (signErr) {
        console.error(signErr);
        setSetupError('Signature request was rejected by user.');
        setVerifyingSetupWallet(false);
        return;
      }
      
      setSetupWalletAddress(address);
      setSetupMessage(message);
      setSetupSignature(signature);
      setSetupWalletConnected(true);
    } catch (err) {
      console.error(err);
      setSetupError('Failed to connect or sign message with MetaMask.');
    } finally {
      setVerifyingSetupWallet(false);
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

    const needsWallet = ['INSPECTOR', 'TESTER'].includes(user?.role);
    if (needsWallet && !setupWalletConnected) {
      setPassError('You must connect and verify your MetaMask wallet first.');
      return;
    }

    setChangingPass(true);
    showLoading('Configuring password & credentials...');
    try {
      // 1. Link wallet first
      if (needsWallet) {
        const linkRes = await linkWallet(setupWalletAddress, setupMessage, setupSignature);
        if (!linkRes.success) {
          setPassError(linkRes.message || 'Failed to link wallet on backend.');
          setChangingPass(false);
          hideLoading();
          return;
        }
      }

      // 2. Change password
      const res = await changePassword(newPassword);
      hideLoading();
      if (res.success) {
        setPassSuccess('Setup completed successfully!');
        window.location.reload();
      } else {
        setPassError(res.message);
      }
    } catch (err) {
      console.error(err);
      setPassError('Failed to complete first login setup.');
      hideLoading();
    } finally {
      setChangingPass(false);
    }
  };

  const handleCreateInspector = async (e) => {
    e.preventDefault();
    setCreateSuccess('');
    setCreateError('');
    setGeneratedTempPassword('');
    setCreatingInspector(true);
    showLoading('Creating verifier account profile...');
    
    try {
      let res;
      if (onboardRole === 'INSPECTOR') {
        res = await axios.post('/api/admin/create-inspector', {
          name: inspectorName,
          email: inspectorEmail,
          phone_number: inspectorPhone,
          district: inspectorDistrict,
          sub_district: inspectorSubDistrict,
          coverage_level: inspectorCoverage
        });
        setCreateSuccess('Inspector account created successfully!');
      } else {
        res = await axios.post('/api/admin/create-tester', {
          name: inspectorName,
          email: inspectorEmail,
          phone_number: inspectorPhone,
          district: inspectorDistrict,
          sub_district: inspectorSubDistrict,
          pin_code: testerPinCode,
          lab_name: testerLabName,
          lab_license_number: testerLicense,
          accreditation_number: testerAccreditation,
          gov_reg_number: testerGovReg
        });
        setCreateSuccess('Quality Lab Tester account created successfully!');
      }
      setGeneratedTempPassword(res.data.temp_password);
      hideLoading();
      
      // Clear form
      setInspectorName('');
      setInspectorEmail('');
      setInspectorPhone('');
      setInspectorDistrict('');
      setInspectorSubDistrict('');
      setInspectorCoverage('SUB_DISTRICT');
      setTesterPinCode('');
      setTesterLabName('');
      setTesterLicense('');
      setTesterAccreditation('');
      setTesterGovReg('');
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || 'Failed to create verifier account.');
      hideLoading();
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
    showLoading(status === 'ACCEPTED' ? 'Accepting proposal...' : 'Declining proposal...');
    try {
      await axios.post(`/api/finance/update-status/${proposalId}`, { status });
      const res = await axios.get('/api/finance/received-proposals');
      setProposals(res.data);
      hideLoading();
      showToast(`Proposal successfully ${status.toLowerCase()}ed!`, 'success');
    } catch (err) {
      console.error(err);
      setProposalError('Failed to update proposal status.');
      hideLoading();
      showToast('Failed to update proposal status.', 'error');
    }
  };


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const explorerSummary = await axios.get('/api/explorer/summary');
        const cropsList = await axios.get('/api/farmer/all-crops');
        const lotsList = await axios.get('/api/product/all');
        
        let testerCertsCount = 0;
        if (user && user.role === 'TESTER') {
          const testerCropIds = cropsList.data.filter(c => c.assigned_tester_id === user.id).map(c => c.id);
          testerCertsCount = lotsList.data.filter(l => testerCropIds.includes(l.farmer_id)).length;
        }

        let inspectorVerifiedCount = 0;
        if (user && user.role === 'INSPECTOR') {
          inspectorVerifiedCount = cropsList.data.filter(c => c.assigned_inspector_id === user.id && c.verification_status === 'VERIFIED').length;
        }

        setStats({
          cropsCount: cropsList.data.length,
          lotsCount: lotsList.data.length,
          investmentsCount: explorerSummary.data.total_transactions || 0,
          ratingsCount: 0,
          testerCertsCount,
          inspectorVerifiedCount
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
          
          if (myCropsRes.data && myCropsRes.data.length > 0 && !districtInitialized.current) {
            const sortedCrops = [...myCropsRes.data].sort((a, b) => b.id - a.id);
            const lastCrop = sortedCrops[0];
            if (lastCrop && lastCrop.district) {
              setSelectedDistrict(lastCrop.district);
              districtInitialized.current = true;
            }
          }
          
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

          // Check for newly approved/rejected crop notifications to display as alerts
          const newAlerts = [];
          myCropsRes.data.forEach(c => {
            if (c.verification_status === 'VERIFIED' || c.verification_status === 'REJECTED') {
              const dismissedKey = `dismissed_crop_alert_${c.id}_${c.verification_status}`;
              if (!localStorage.getItem(dismissedKey)) {
                newAlerts.push({
                  id: c.id,
                  type: c.verification_status === 'VERIFIED' ? 'success' : 'error',
                  status: c.verification_status,
                  message: c.verification_status === 'VERIFIED' 
                    ? `Your crop registration for ${c.crop_type} (ID: ${c.id}) has been verified and approved!`
                    : `Your crop registration for ${c.crop_type} (ID: ${c.id}) has been rejected by the inspector.`
                });
              }
            }
          });
          setAlerts(newAlerts);

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

  const totalCapitalCommitted = proposals.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) {
    return <DashboardSkeleton role={user?.role} />;
  }

  return (
    <div className="space-y-8 py-4">
      {/* First Login Change Password & MetaMask Setup Modal */}
      {user?.must_change_password && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-500 animate-pulse" /> First Login: Account Setup
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              For security, you must set a new password and connect your MetaMask wallet to activate your account.
            </p>
            {passError && (
              <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-955/30 dark:text-rose-400 rounded-xl">
                {passError}
              </div>
            )}
            {passSuccess && (
              <div className="p-3 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-955/30 dark:text-emerald-400 rounded-xl">
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

              {['INSPECTOR', 'TESTER'].includes(user?.role) && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    MetaMask Digital Signature Setup
                  </label>
                  {setupWalletConnected ? (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400 font-mono">
                      <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Wallet Verified: {setupWalletAddress.substring(0, 8)}...{setupWalletAddress.substring(setupWalletAddress.length - 6)}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSetupConnectWallet}
                      disabled={verifyingSetupWallet}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-xl transition text-xs disabled:opacity-50"
                    >
                      <Wallet className="h-4 w-4" /> {verifyingSetupWallet ? 'Verifying with MetaMask...' : 'Connect & Verify MetaMask'}
                    </button>
                  )}
                  {setupError && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-450 font-semibold">{setupError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPass || (['INSPECTOR', 'TESTER'].includes(user?.role) && !setupWalletConnected)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition text-xs flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {changingPass ? 'Completing Setup...' : 'Complete Account Setup'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Welcome Block */}
      <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-955 dark:text-white">
              Hello, {user?.name}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${getRoleBadge(user?.role)}`}>
              {user?.role}
            </span>
          </div>
          <p className="text-sm text-slate-505 dark:text-slate-400">
            Welcome to your unified AgroChain control panel.
          </p>
        </div>

        {user?.role === 'FARMER' && (
          <div className="flex items-center justify-around bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800/80 px-6 py-3.5 rounded-2xl flex-1 max-w-xl mx-4 lg:mx-8">
            <div className="text-center flex-1">
              <span className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider">Registered Crop</span>
              <span className="text-lg font-extrabold text-slate-855 dark:text-white">{myCrops.length}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            <div className="text-center flex-1">
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">Approved Crop</span>
              <span className="text-lg font-extrabold text-emerald-650 dark:text-emerald-400">{myCrops.filter(c => c.verification_status === 'VERIFIED').length}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            <div className="text-center flex-1">
              <span className="block text-[10px] font-bold text-amber-605 dark:text-amber-450 uppercase tracking-wider">Pending Crop</span>
              <span className="text-lg font-extrabold text-amber-650 dark:text-amber-400">{myCrops.filter(c => c.verification_status === 'PENDING').length}</span>
            </div>
            {myCrops.some(c => c.verification_status === 'REJECTED') && (
              <>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                <div className="text-center flex-1">
                  <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-455 uppercase tracking-wider">Rejected Crop</span>
                  <span className="text-lg font-extrabold text-rose-655 dark:text-rose-400">{myCrops.filter(c => c.verification_status === 'REJECTED').length}</span>
                </div>
              </>
            )}
          </div>
        )}

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

      {/* Farmer Crop Approval/Rejection Notification Alerts */}
      {user?.role === 'FARMER' && alerts.length > 0 && (
        <div className="space-y-3 mb-6 animate-in fade-in duration-300">
          {alerts.map((alert) => (
            <div 
              key={`${alert.id}_${alert.status}`}
              className={`rounded-2xl border p-4 flex justify-between items-center gap-4 transition-all duration-305 ${
                alert.type === 'success' 
                  ? 'border-emerald-100 bg-emerald-50/50 text-emerald-800 dark:border-emerald-950/40 dark:bg-emerald-950/20 dark:text-emerald-400' 
                  : 'border-rose-100 bg-rose-50/50 text-rose-800 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-455'
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-450 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-455 shrink-0" />
                )}
                <span className="text-sm font-semibold">{alert.message}</span>
              </div>
              <button
                onClick={() => {
                  const dismissedKey = `dismissed_crop_alert_${alert.id}_${alert.status}`;
                  localStorage.setItem(dismissedKey, 'true');
                  setAlerts(prev => prev.filter(a => !(a.id === alert.id && a.status === alert.status)));
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold transition shrink-0 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

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
      {user?.role === 'FARMER' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Weather Forecast */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-[195px] transition hover:shadow-md">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Weather Forecast</span>
                  {weatherData && (
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      weatherData.isSimulated 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30' 
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-250/50 dark:bg-emerald-950/20 dark:text-emerald-455 dark:border-emerald-900/30'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${weatherData.isSimulated ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                      {weatherData.isSimulated ? 'Simulated' : 'Live'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      districtInitialized.current = true;
                    }}
                    className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {Object.keys(DISTRICT_COORDINATES).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-505 dark:text-slate-400 font-semibold">Kerala</span>
                </div>
              </div>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                <CloudSun className="h-4.5 w-4.5" />
              </div>
            </div>
            
            {weatherLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                <span className="text-xs text-slate-450 dark:text-slate-400">Updating forecast...</span>
              </div>
            ) : weatherData ? (
              <div className="my-1 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getWeatherIcon(weatherData.weatherCode, weatherData.isDay)}
                  <div>
                    <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{weatherData.temp}°C</h3>
                    <p className="text-xs font-bold text-slate-505 dark:text-slate-400 mt-1">
                      {getWeatherDesc(weatherData.weatherCode, weatherData.isDay).label} • {weatherData.isDay === 0 ? 'Night 🌙' : 'Day ☀️'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-right shrink-0">
                  <span className="flex items-center justify-end gap-1 text-sm font-bold text-slate-755 dark:text-slate-200">
                    <Wind className="h-4 w-4 text-blue-500 animate-pulse shrink-0" /> {weatherData.windSpeed} km/h
                  </span>
                  <button 
                    onClick={() => fetchWeather(true)}
                    disabled={weatherLoading}
                    className="flex items-center justify-end gap-1 text-[10px] text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors font-semibold font-mono disabled:opacity-55"
                    title="Refresh Weather"
                  >
                    <span>Updated: {weatherData.updatedAt || 'just now'}</span>
                    <RotateCw className={`h-2.5 w-2.5 shrink-0 ${weatherLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-rose-500 py-2">Weather unavailable</p>
            )}
            
            <p className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-1.5 font-medium leading-tight">
              {weatherData?.weatherCode >= 51 && weatherData?.weatherCode <= 82 
                ? "Rainy skies: Hold off irrigation for today." 
                : "Sunny/Cloudy skies: Good for fertilizer application."}
            </p>
          </div>

          {/* Card 2: AI/Smart Crop Advisory */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between h-[195px] transition hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Crop Advisory</p>
                <p className="text-sm text-slate-805 dark:text-slate-300 font-bold mt-1 truncate max-w-[160px] sm:max-w-xs">{getCropAdvisory().crop}</p>
              </div>
              <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600 dark:text-purple-400 shrink-0">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="my-1 space-y-1 overflow-y-auto no-scrollbar max-h-20">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400 font-bold uppercase tracking-wide">
                {getCropAdvisory().stage}
              </span>
              <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-350 leading-relaxed pl-3 list-disc list-outside font-medium">
                {getCropAdvisory().tips.slice(0, 2).map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" /> Ensure drainage & monitor daily.
            </div>
          </div>
        </div>
      ) : (
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
              {user?.role === 'INVESTOR' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">LOIs Submitted</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loadingProposals ? '...' : proposals.length}</h3>
                </div>
              ) : user?.role === 'TESTER' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Lab Audits</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : currentPendingApprovalIds.length}</h3>
                </div>
              ) : user?.role === 'INSPECTOR' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Field Audits</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : currentPendingApprovalIds.length}</h3>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ledger Actions</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.investmentsCount}</h3>
                </div>
              )}
              <div className={`p-2 rounded-xl shrink-0 ${
                user?.role === 'TESTER' || user?.role === 'INSPECTOR'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
              }`}>
                {user?.role === 'TESTER' || user?.role === 'INSPECTOR' ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <Layers className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-start">
              {user?.role === 'INVESTOR' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Committed Capital</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {loadingProposals ? '...' : `Rs. ${totalCapitalCommitted.toLocaleString('en-IN')}`}
                  </h3>
                </div>
              ) : user?.role === 'TESTER' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Certificates Issued</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.testerCertsCount}</h3>
                </div>
              ) : user?.role === 'INSPECTOR' ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Verified Crops</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{loading ? '...' : stats.inspectorVerifiedCount}</h3>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Farmer Trust</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">98.4%</h3>
                </div>
              )}
              <div className={`p-2 rounded-xl shrink-0 ${
                user?.role === 'INVESTOR' 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                  : user?.role === 'TESTER' || user?.role === 'INSPECTOR'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}>
                {user?.role === 'INVESTOR' ? (
                  <Wallet className="h-5 w-5" />
                ) : user?.role === 'TESTER' || user?.role === 'INSPECTOR' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Menu of Actions */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Operations Console</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Public Action: Traceability */}
          {user?.role !== 'ADMIN' && (
            <Link to="/consumer/track" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                <Eye className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Trace Crop Supply Chain</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Explore farms, trace crop timelines, check lab certificates, and verify ledger hashes.</p>
              </div>
            </Link>
          )}

          {/* Public Action: Explorer */}
          {user?.role !== 'ADMIN' && (
            <Link to="/explorer" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform shrink-0">
                <Cpu className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Blockchain Explorer</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Audit blocks, verify Solidity events, track transaction addresses.</p>
              </div>
            </Link>
          )}

          {/* Microfinance (All users) */}
          {user?.role !== 'ADMIN' && (
            <Link to="/finance" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900 flex gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                <Coins className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Microfinance Portal</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Fund farmers directly with test ETH / Rupees (Rs.) and track investment metrics.</p>
              </div>
            </Link>
          )}

          {/* Investor Specific Action: Submitted LOIs */}
          {user?.role === 'INVESTOR' && (
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
          {user?.role === 'FARMER' && (
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
          {user?.role === 'FARMER' && (
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
          {(user?.role === 'INSPECTOR' || user?.role === 'TESTER') && (
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
          {user?.role === 'TESTER' && (
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
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                          Crop: <span className="font-bold text-emerald-600 dark:text-emerald-400">{prop.crop_name || 'N/A'}</span>
                        </p>
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
                <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" /> Onboard Regional Verifier Account
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Enter details to onboard a new field inspector or lab tester. The system will auto-generate a temporary password.
              </p>
            </div>

            {createSuccess && (
              <div className="rounded-xl bg-emerald-50 p-4 text-xs text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-semibold space-y-2">
                <p>{createSuccess}</p>
                {generatedTempPassword && (
                  <div className="font-mono bg-white dark:bg-slate-955 p-2.5 rounded border border-emerald-200 dark:border-emerald-800/40 inline-block">
                    Temporary Password: <strong className="text-emerald-700 dark:text-emerald-455 select-all">{generatedTempPassword}</strong> (Copy and share with verifier)
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
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Onboard Role Type</label>
                <select 
                  value={onboardRole} 
                  onChange={(e) => setOnboardRole(e.target.value)} 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-1 focus:ring-purple-500"
                >
                  <option value="INSPECTOR">Agricultural Inspector</option>
                  <option value="TESTER">Quality Lab Tester</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">
                  {onboardRole === 'TESTER' ? 'Authorized Person Name' : 'Inspector Name'}
                </label>
                <input 
                  type="text" 
                  value={inspectorName} 
                  onChange={(e) => setInspectorName(e.target.value)} 
                  required 
                  placeholder={onboardRole === 'TESTER' ? 'Dr. Jane Smith' : 'Rajiv Kumar'} 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Official Email</label>
                <input 
                  type="email" 
                  value={inspectorEmail} 
                  onChange={(e) => setInspectorEmail(e.target.value)} 
                  required 
                  placeholder="name@agrochain.gov" 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
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
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">District</label>
                <select 
                  value={inspectorDistrict} 
                  onChange={(e) => { setInspectorDistrict(e.target.value); setInspectorSubDistrict(''); }} 
                  required 
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer"
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
                  className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">{inspectorDistrict ? 'Select Taluk' : 'Select District first'}</option>
                  {inspectorDistrict && KERALA_LOCATIONS[inspectorDistrict] && Object.keys(KERALA_LOCATIONS[inspectorDistrict]).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {onboardRole === 'INSPECTOR' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Coverage Level</label>
                  <select 
                    value={inspectorCoverage} 
                    onChange={(e) => setInspectorCoverage(e.target.value)} 
                    required 
                    className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-950 dark:text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="SUB_DISTRICT">SUB_DISTRICT</option>
                    <option value="DISTRICT">DISTRICT</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Base PIN Code</label>
                    <input 
                      type="text" 
                      value={testerPinCode} 
                      onChange={(e) => setTesterPinCode(e.target.value)} 
                      required 
                      placeholder="682022" 
                      className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Lab Name</label>
                    <input 
                      type="text" 
                      value={testerLabName} 
                      onChange={(e) => setTesterLabName(e.target.value)} 
                      required 
                      placeholder="Kerala Quality Testing Lab" 
                      className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Lab License Number</label>
                    <input 
                      type="text" 
                      value={testerLicense} 
                      onChange={(e) => setTesterLicense(e.target.value)} 
                      required 
                      placeholder="LIC-98765" 
                      className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Accreditation Number</label>
                    <input 
                      type="text" 
                      value={testerAccreditation} 
                      onChange={(e) => setTesterAccreditation(e.target.value)} 
                      required 
                      placeholder="ACR-12345" 
                      className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-755 dark:text-slate-300 mb-1">Government Registration Number</label>
                    <input 
                      type="text" 
                      value={testerGovReg} 
                      onChange={(e) => setTesterGovReg(e.target.value)} 
                      required 
                      placeholder="REG-112233" 
                      className="text-xs w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 bg-white dark:bg-slate-955 text-slate-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" 
                    />
                  </div>
                </>
              )}
              
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
                  {creatingInspector ? 'Creating...' : `Create ${onboardRole === 'TESTER' ? 'Tester' : 'Inspector'} Account`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
