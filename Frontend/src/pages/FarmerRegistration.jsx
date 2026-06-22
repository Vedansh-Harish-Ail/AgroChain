import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, FileText, Calendar, Compass, ShieldCheck, Database, Info, ArrowLeft, MapPin, Upload, X, Check, Search } from 'lucide-react';
import axios from 'axios';

const KERALA_LOCATIONS = {
  "Thiruvananthapuram": {
    "Thiruvananthapuram": ["Trivandrum City", "Pattom", "Palayam", "Vattiyoorkavu"],
    "Chirayinkeezhu": ["Chirayinkeezhu Town", "Attingal", "Kadakkavoor"],
    "Nedumangad": ["Nedumangad Town", "Aruvikkara", "Vellanad"],
    "Neyyattinkara": ["Neyyattinkara Town", "Balaramapuram", "Parasala"],
    "Varkala": ["Varkala Town", "Edava", "Elakamon"]
  },
  "Kollam": {
    "Kollam": ["Kollam Town", "Thrikkadavoor", "Eravipuram"],
    "Karunagappally": ["Karunagappally Town", "Oachira", "Clappana"],
    "Kunnathur": ["Sasthamcotta", "Kunnathur Town", "Sooranad"],
    "Punalur": ["Punalur Town", "Anchal", "Thenmala"],
    "Pathanapuram": ["Pathanapuram Town", "Pidavoor", "Pattazhy"],
    "Kottarakkara": ["Kottarakkara Town", "Veliyam", "Ezhukone"]
  },
  "Pathanamthitta": {
    "Pathanamthitta": ["Pathanamthitta Town", "Malayalappuzha", "Mylapra"],
    "Adoor": ["Adoor Town", "Pandalam", "Enathu"],
    "Ranni": ["Ranni Town", "Angadi", "Vadasserikkara"],
    "Konni": ["Konni Town", "Koodal", "Pramadom"],
    "Kozhencherry": ["Kozhencherry Town", "Elanthoor", "Aranmula"]
  },
  "Alappuzha": {
    "Alappuzha": ["Alappuzha Town", "Aryad", "Mararikulam"],
    "Ambalappuzha": ["Punnapra", "Ambalappuzha North", "Ambalappuzha South"],
    "Chengannur": ["Chengannur Town", "Mulakuzha", "Mannar"],
    "Kuttanad": ["Pulincunnu", "Champakulam", "Edathua"],
    "Mavelikkara": ["Mavelikkara Town", "Kayamkulam", "Harippad"]
  },
  "Kottayam": {
    "Kottayam": ["Kottayam Town", "Vijayapuram", "Panachikkad"],
    "Changanassery": ["Changanassery Town", "Kurichy", "Madappally"],
    "Vaikom": ["Vaikom Town", "Thalayolaparambu", "Kaduthuruthy"],
    "Meenachil": ["Pala", "Erattupetta", "Bharananganam"]
  },
  "Idukki": {
    "Devikulam": ["Munnar", "Devikulam Town", "Adimaly"],
    "Udumbanchola": ["Nedumkandam", "Kattappana", "Cumbummettu"],
    "Idukki": ["Painavu", "Cheruthoni", "Kanjikuzhy"],
    "Thodupuzha": ["Thodupuzha Town", "Karimannoor", "Vannappuram"]
  },
  "Ernakulam": {
    "Ernakulam": ["Kochi (Urban)", "Kalamassery", "Edappally", "Palluruthy"],
    "Aluva": ["Chunangamveli", "Keezhmad", "Aluva West", "Chengamanad"],
    "Kothamangalam": ["Kothamangalam Town", "Keerampara", "Pindimana"],
    "Muvattupuzha": ["Muvattupuzha Town", "Marady", "Valakom"]
  },
  "Thrissur": {
    "Thrissur": ["Olarikkara", "Ayyanthole", "Ramavarmapuram"],
    "Chavakkad": ["Chavakkad Town", "Guruvayur", "Punnayur"],
    "Kunnamkulam": ["Kunnamkulam Town", "Vadakkekad", "Choondal"],
    "Irinjalakuda": ["Irinjalakuda Town", "Aloor", "Padiyoor"],
    "Mukundapuram": ["Chalakkudy West", "Kodungallur North", "Pudukkad"]
  },
  "Palakkad": {
    "Palakkad": ["Palakkad Town", "Pirayiri", "Puduppariyaram"],
    "Chittur": ["Chittur-Thathamangalam", "Koduvayur", "Kozhinjampara"],
    "Alathur": ["Alathur Town", "Kavassery", "Tarur"],
    "Ottapalam": ["Ottapalam Town", "Shoranur", "Cherpulassery"],
    "Mannarkkad": ["Mannarkkad Town", "Attappady", "Alanallur"]
  },
  "Malappuram": {
    "Malappuram": ["Malappuram Town", "Manjeri", "Kondotty"],
    "Perinthalmanna": ["Perinthalmanna Town", "Melattur", "Aliparamba"],
    "Tirur": ["Tirur Town", "Tanur", "Kottakkal"],
    "Nilambur": ["Nilambur Town", "Wandoor", "Edakkara"],
    "Ponnani": ["Ponnani Town", "Edapal", "Tavanur"]
  },
  "Kozhikode": {
    "Kozhikode": ["Kozhikode City", "Beypore", "Elathur"],
    "Vatakara": ["Vatakara Town", "Chorode", "Maniyur"],
    "Koyilandy": ["Koyilandy Town", "Atholi", "Balussery"],
    "Thamarassery": ["Thamarassery Town", "Koduvally", "Thiruvambady"]
  },
  "Wayanad": {
    "Mananthavady": ["Mananthavady Town", "Thirunelly", "Vellamunda"],
    "Sulthan Bathery": ["Sulthan Bathery Town", "Ambalavayal", "Noolpuzha"],
    "Vythiri": ["Kalpetta", "Vythiri Town", "Meppadi"]
  },
  "Kannur": {
    "Kannur": ["Kannur Town", "Edakkad", "Puzhathi"],
    "Taliparamba": ["Taliparamba Town", "Payyannur", "Alakode"],
    "Thalassery": ["Thalassery Town", "Dharmadom", "Panoor"],
    "Iritty": ["Iritty Town", "Mattannur", "Peravoor"]
  },
  "Kasaragod": {
    "Kasaragod": ["Kasaragod Town", "Kumbla", "Badiadka"],
    "Hosdurg": ["Kanhangad", "Nileshwar", "Cheruvathur"],
    "Manjeshwaram": ["Manjeshwar Town", "Uppala", "Mangalpady"]
  }
};

const DISTRICT_COORDINATES = {
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Kollam": [8.8932, 76.6141],
  "Pathanamthitta": [9.2648, 76.7870],
  "Alappuzha": [9.4981, 76.3388],
  "Kottayam": [9.5916, 76.5222],
  "Idukki": [9.9189, 77.1025],
  "Ernakulam": [9.9816, 76.2999],
  "Thrissur": [10.5276, 76.2144],
  "Palakkad": [10.7867, 76.6548],
  "Malappuram": [11.0735, 76.0740],
  "Kozhikode": [11.2588, 75.7804],
  "Wayanad": [11.6854, 76.1320],
  "Kannur": [11.8745, 75.3704],
  "Kasaragod": [12.5102, 74.9852]
};

export default function FarmerRegistration() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    farm_location: '',
    district: '',
    sub_district: '',
    village: '',
    pin_code: '',
    farm_size: '',
    farming_type: 'Organic',
    crop_type: '',
    expected_yield: '',
    cultivation_date: new Date().toISOString().split('T')[0],
    land_survey_no: '',
    gps_latitude: '',
    gps_longitude: ''
  });
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [evidenceDocuments, setEvidenceDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Dynamic Leaflet Loading
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Add Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Keep script in window to prevent double load if navigating back
    };
  }, []);

  // Initialize Map
  const initMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    // Reset default markers images URL to fix Vite packager pathing issue
    delete window.L.Icon.Default.prototype._getIconUrl;
    window.L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const streetTiles = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    });

    const satelliteTiles = window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    });

    // Default view centered on Kerala
    const map = window.L.map(mapRef.current, {
      center: [10.8505, 76.2711],
      zoom: 7,
      layers: [streetTiles]
    });
    mapInstanceRef.current = map;

    const baseMaps = {
      "Standard Map": streetTiles,
      "Satellite View": satelliteTiles
    };

    window.L.control.layers(baseMaps).addTo(map);

    // Initial marker placement if coordinates exist (e.g. form re-mounts)
    if (formData.gps_latitude && formData.gps_longitude) {
      const lat = parseFloat(formData.gps_latitude);
      const lng = parseFloat(formData.gps_longitude);
      markerRef.current = window.L.marker([lat, lng], { draggable: true }).addTo(map);
      map.setView([lat, lng], 16);
    }

    // Handle map click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateSelectedLocation(lat, lng);
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setFormData(prev => ({
          ...prev,
          farm_location: data.display_name
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const updateSelectedLocation = (lat, lng) => {
    const fixedLat = lat.toFixed(6);
    const fixedLng = lng.toFixed(6);

    setFormData(prev => ({
      ...prev,
      gps_latitude: fixedLat,
      gps_longitude: fixedLng
    }));

    if (window.L && mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = window.L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        markerRef.current.on('dragend', () => {
          const position = markerRef.current.getLatLng();
          updateSelectedLocation(position.lat, position.lng);
        });
      }
    }

    reverseGeocode(lat, lng);
  };

  useEffect(() => {
    if (leafletLoaded) {
      initMap();
    }
  }, [leafletLoaded]);

  // Clean up map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const geocodeAndCenter = async (queryText, fallbackQueries = [], zoomLevel = 12) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], zoomLevel);
          updateSelectedLocation(lat, lon);
        }
      } else if (fallbackQueries && fallbackQueries.length > 0) {
        const nextFallback = fallbackQueries[0];
        const remainingFallbacks = fallbackQueries.slice(1);
        const nextZoom = Math.max(10, zoomLevel - 2);
        await geocodeAndCenter(nextFallback, remainingFallbacks, nextZoom);
      }
    } catch (err) {
      console.error("Geocoding failed:", err);
      if (fallbackQueries && fallbackQueries.length > 0) {
        const nextFallback = fallbackQueries[0];
        const remainingFallbacks = fallbackQueries.slice(1);
        const nextZoom = Math.max(10, zoomLevel - 2);
        await geocodeAndCenter(nextFallback, remainingFallbacks, nextZoom);
      }
    }
  };

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const fullQuery = `${searchQuery}, Kerala, India`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 17);
          updateSelectedLocation(lat, lon);
        }
      } else {
        const response2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data2 = await response2.json();
        if (data2 && data2.length > 0) {
          const lat = parseFloat(data2[0].lat);
          const lon = parseFloat(data2[0].lon);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lon], 17);
            updateSelectedLocation(lat, lon);
          }
        } else {
          alert("Location not found. Please try a different search term.");
        }
      }
    } catch (err) {
      console.error("Search geocoding failed:", err);
      alert("Failed to search location.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      district: val,
      sub_district: '',
      village: ''
    }));

    if (val) {
      if (DISTRICT_COORDINATES[val] && mapInstanceRef.current) {
        const coords = DISTRICT_COORDINATES[val];
        mapInstanceRef.current.setView(coords, 11);
        updateSelectedLocation(coords[0], coords[1]);
      } else {
        geocodeAndCenter(`${val} District, Kerala, India`, [`${val}, Kerala, India`], 11);
      }
    }
  };

  const handleTalukChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      sub_district: val,
      village: ''
    }));

    if (val && formData.district) {
      geocodeAndCenter(
        `${val}, ${formData.district}, Kerala, India`,
        [`${val}, Kerala, India`, `${formData.district}, Kerala, India`],
        14
      );
    }
  };

  const handleVillageChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      village: val
    }));

    if (val && formData.sub_district && formData.district) {
      geocodeAndCenter(
        `${val}, ${formData.sub_district}, ${formData.district}, Kerala, India`,
        [
          `${val}, ${formData.district}, Kerala, India`,
          `${formData.sub_district}, ${formData.district}, Kerala, India`,
          `${formData.district}, Kerala, India`
        ],
        16
      );
    }
  };


  const getFileTypeLabel = (url, index) => {
    if (url.startsWith('data:')) {
      const match = url.match(/data:([^;]+);/);
      if (match && match[1]) {
        const mime = match[1];
        if (mime === 'application/pdf') return `Document Proof #${index + 1} (PDF)`;
        if (mime.includes('image/')) return `Document Proof #${index + 1} (Image)`;
        if (mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return `Document Proof #${index + 1} (Word)`;
        if (mime.includes('excel') || mime.includes('officedocument.spreadsheetml')) return `Document Proof #${index + 1} (Excel)`;
        if (mime.includes('zip') || mime.includes('x-zip-compressed')) return `Document Proof #${index + 1} (ZIP)`;
      }
    }
    return `Document Proof #${index + 1}`;
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const readPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises)
      .then(results => {
        setEvidencePhotos(prev => [...prev, ...results]);
        setUploading(false);
      })
      .catch(err => {
        console.error("Error reading photos:", err);
        setError("Failed to upload one or more photos.");
        setUploading(false);
      });
  };

  const removePhoto = (idx) => {
    setEvidencePhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingDocs(true);
    const readPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises)
      .then(results => {
        setEvidenceDocuments(prev => [...prev, ...results]);
        setUploadingDocs(false);
      })
      .catch(err => {
        console.error("Error reading documents:", err);
        setError("Failed to upload one or more documents.");
        setUploadingDocs(false);
      });
  };

  const removeDoc = (idx) => {
    setEvidenceDocuments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.land_survey_no) {
      setError('Land Survey Number is required for verification.');
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.cultivation_date > today) {
      setError('Cultivation Start Date cannot be in the future.');
      setLoading(false);
      return;
    }

    if (!formData.gps_latitude || !formData.gps_longitude) {
      setError('Please select your farm location on the map.');
      setLoading(false);
      return;
    }

    if (evidencePhotos.length === 0) {
      setError('Please upload at least one crop / land evidence photo.');
      setLoading(false);
      return;
    }

    if (evidenceDocuments.length === 0) {
      setError('Please upload at least one evidence document (e.g. land deed or tax receipt).');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/farmer/register', {
        ...formData,
        evidence_photos: evidencePhotos,
        evidence_documents: evidenceDocuments,
        tx_hash: null,
        block_number: null
      });

      setLoading(false);
      alert('Crop details registered successfully! State officials / Quality testers will inspect this and log it on the blockchain.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save crop details.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Register Crop Cultivation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Log agricultural details for quality verification</p>
          </div>
        </div>

        {/* Info Box explaining the decentralized audit setup */}
        <div className="mb-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 p-4 dark:bg-emerald-950/10 dark:border-emerald-900/30 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Simplified Web3 Architecture</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
              No blockchain wallet is required for farmers. Once you submit your crop details, land survey proof, and GPS coordinates, 
              an authorized quality testing inspector will inspect the details and sign the verification record directly on the blockchain.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">Crop Specifications</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Crop Name / Type
              </label>
              <input
                type="text"
                name="crop_type"
                required
                value={formData.crop_type}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="Basmati Rice, Alphonso Mango, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Farming Type
              </label>
              <select
                name="farming_type"
                value={formData.farming_type}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              >
                <option value="Organic">Organic Farming</option>
                <option value="Non-Organic">Non-Organic Farming</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Expected Yield (in kg)
              </label>
              <input
                type="number"
                name="expected_yield"
                required
                value={formData.expected_yield}
                onChange={handleInputChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                placeholder="e.g. 2500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cultivation Start Date
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="date"
                  name="cultivation_date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={formData.cultivation_date}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                />
              </div>
            </div>
          </div>

          <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pt-2 pb-2">Land & Verification Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Land Survey Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="land_survey_no"
                  required
                  value={formData.land_survey_no}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="e.g. SUR-109/42-B"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Farm Size / Area
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Compass className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="farm_size"
                  required
                  value={formData.farm_size}
                  onChange={handleInputChange}
                  className="block w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
                  placeholder="e.g. 5 Hectares"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Farm Location Address in words
            </label>
            <input
              type="text"
              name="farm_location"
              required
              value={formData.farm_location}
              onChange={handleInputChange}
              className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              placeholder="e.g. Survey No. 45, Near Riverside"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                District
              </label>
              <select
                name="district"
                required
                value={formData.district}
                onChange={handleDistrictChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              >
                <option value="">Select District</option>
                {Object.keys(KERALA_LOCATIONS).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Taluk (Sub-District)
              </label>
              <select
                name="sub_district"
                required
                disabled={!formData.district}
                value={formData.sub_district}
                onChange={handleTalukChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm disabled:opacity-50"
              >
                <option value="">Select Taluk</option>
                {formData.district && Object.keys(KERALA_LOCATIONS[formData.district]).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Village
              </label>
              <select
                name="village"
                required
                disabled={!formData.sub_district}
                value={formData.village}
                onChange={handleVillageChange}
                className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm disabled:opacity-50"
              >
                <option value="">Select Village</option>
                {formData.district && formData.sub_district && KERALA_LOCATIONS[formData.district][formData.sub_district].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Select Farm Coordinates on Map
              </label>
              {formData.gps_latitude && formData.gps_longitude && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 font-mono">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{formData.gps_latitude}, {formData.gps_longitude}</span>
                </span>
              )}
            </div>

            {/* Map Search Bar */}
            <div className="mb-3">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search location (e.g. Aluva railway station, Munnar)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchSubmit(e);
                      }
                    }}
                    className="block w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  disabled={searchLoading}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-200 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-750 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {searchLoading ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <span>Search</span>
                  )}
                </button>
              </div>
            </div>

            <div 
              ref={mapRef} 
              className="w-full h-72 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner z-10"
              style={{ minHeight: '280px' }}
            />
            
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Click anywhere on the map to select your farm location, or drag the marker to adjust coordinates.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Evidence Photos (Crop / land photos)
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {evidencePhotos.map((url, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-800 bg-slate-100">
                  <img src={url} alt="Evidence preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {uploading && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center aspect-square">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                  <span className="text-[10px] text-slate-400 mt-2">Uploading...</span>
                </div>
              )}
            </div>

            <div className="relative border-2 border-dashed border-slate-250 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 transition text-center bg-slate-50/50 dark:bg-slate-900/30">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drag & Drop files or click to upload</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Evidence Documents (Soil reports, land deeds, tax receipts)
            </label>
            
            <div className="space-y-2 mb-4">
              {evidenceDocuments.map((url, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <span className="truncate max-w-[200px] font-medium">{getFileTypeLabel(url, idx)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDoc(idx)}
                    className="p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {uploadingDocs && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                  <span>Uploading document...</span>
                </div>
              )}
            </div>

            <div className="relative border-2 border-dashed border-slate-250 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 transition text-center bg-slate-50/50 dark:bg-slate-900/30">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={handleDocChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploadingDocs}
              />
              <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drag & Drop files or click to upload</p>
              <p className="text-xs text-slate-400 mt-1">PDF, DOC, XLS up to 10MB</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full flex justify-center items-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 disabled:opacity-50 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <span className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Submit Crop for Verification
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
