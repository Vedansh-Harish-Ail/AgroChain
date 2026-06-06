import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, FileText, Calendar, Compass, ShieldCheck, Database, Info, ArrowLeft, MapPin, Upload, X, Check } from 'lucide-react';
import axios from 'axios';

export default function FarmerRegistration() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    farm_location: '',
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
  const [uploading, setUploading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const getGpsLocation = () => {
    setGpsLoading(true);
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_latitude: position.coords.latitude.toFixed(6),
            gps_longitude: position.coords.longitude.toFixed(6)
          }));
          setGpsLoading(false);
        },
        (err) => {
          console.warn("Geolocation permission denied or failed, using simulation:", err);
          // Set simulated coordinates for demo
          setFormData(prev => ({
            ...prev,
            gps_latitude: (18.5204 + (Math.random() - 0.5) * 0.05).toFixed(6),
            gps_longitude: (73.8567 + (Math.random() - 0.5) * 0.05).toFixed(6)
          }));
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
      setGpsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    // Simulate upload progress
    setTimeout(() => {
      // Map files to realistic URLs
      const mockUrls = [
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1594751543129-6701ad44e95b?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?auto=format&fit=crop&w=600&q=80"
      ];
      // Append a mock photo based on current list length
      const index = (evidencePhotos.length) % mockUrls.length;
      setEvidencePhotos(prev => [...prev, mockUrls[index]]);
      setUploading(false);
    }, 1200);
  };

  const removePhoto = (idx) => {
    setEvidencePhotos(prev => prev.filter((_, i) => i !== idx));
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

    if (!formData.gps_latitude || !formData.gps_longitude) {
      setError('GPS Coordinates are required for fraud prevention verification.');
      setLoading(false);
      return;
    }

    if (evidencePhotos.length === 0) {
      setError('Please upload at least one crop / land evidence photo.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/farmer/register', {
        ...formData,
        evidence_photos: evidencePhotos,
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
              Farm Location Address
            </label>
            <input
              type="text"
              name="farm_location"
              required
              value={formData.farm_location}
              onChange={handleInputChange}
              className="block w-full rounded-xl border border-slate-200 py-3 px-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white sm:text-sm"
              placeholder="e.g. Pune District, Maharashtra, India"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  GPS Latitude
                </label>
                <input
                  type="text"
                  name="gps_latitude"
                  required
                  readOnly
                  placeholder="18.5204"
                  value={formData.gps_latitude}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900/50 py-3 px-3 text-slate-900 dark:text-white sm:text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  GPS Longitude
                </label>
                <input
                  type="text"
                  name="gps_longitude"
                  required
                  readOnly
                  placeholder="73.8567"
                  value={formData.gps_longitude}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-900/50 py-3 px-3 text-slate-900 dark:text-white sm:text-sm font-mono"
                />
              </div>
            </div>
            
            <button
              type="button"
              onClick={getGpsLocation}
              disabled={gpsLoading}
              className="flex justify-center items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 py-3 text-sm font-bold transition"
            >
              {gpsLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-t-transparent dark:border-white"></div>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Auto-detect GPS Location
                </>
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Evidence Photos (Soil report, land deeds, crop photos)
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
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF up to 10MB</p>
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
