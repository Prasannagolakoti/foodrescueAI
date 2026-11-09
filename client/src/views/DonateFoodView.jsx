import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, 
  Upload, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Info,
  Calendar,
  Camera,
  Link as LinkIcon,
  X,
  RotateCw,
  Image as ImageIcon,
  Check,
  VideoOff
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DonateFoodView({ setCurrentView, onSuccessDonation }) {
  const { user } = useAuth();

  const now = new Date();
  const formatIsoForInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cooked Meals');
  const [foodType, setFoodType] = useState('veg');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [packetsCount, setPacketsCount] = useState('');
  const [prepTime, setPrepTime] = useState(formatIsoForInput(new Date(now.getTime() - 2 * 3600 * 1000)));
  const [safeDeadline, setSafeDeadline] = useState(formatIsoForInput(new Date(now.getTime() + 6 * 3600 * 1000)));
  const [storageCondition, setStorageCondition] = useState('Hot Held (>60°C)');
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');

  // Image Upload State (3 Options: 'camera' | 'upload' | 'url')
  const [imageMode, setImageMode] = useState('upload'); // 'camera', 'upload', 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageSourceType, setImageSourceType] = useState(''); // 'Camera Capture', 'Device Upload', 'Image Link'
  const [imageFormatValid, setImageFormatValid] = useState(true);
  const [imageError, setImageError] = useState(null);

  // Live Camera Viewfinder State (for desktop webcam and in-browser camera)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // AI Live Safety Check State
  const [safetyCheck, setSafetyCheck] = useState(null);
  const [evaluatingSafety, setEvaluatingSafety] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Preset sample images for quick selection in URL mode
  const imagePresets = [
    { label: 'Biryani / Pulao', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
    { label: 'Dal & Rice Meals', url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80' },
    { label: 'Artisan Bread & Rolls', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80' },
    { label: 'Farm Fresh Veggies', url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80' },
    { label: 'Chicken Gravy Curry', url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80' },
    { label: 'Dairy & Sweets', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80' }
  ];

  // Auto calculate packets estimate when quantity changes
  useEffect(() => {
    if (quantity && !packetsCount) {
      setPacketsCount(Math.round(parseFloat(quantity) * 2.5));
    }
  }, [quantity]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  // Start live webcam / camera stream
  const startCameraStream = async () => {
    setImageError(null);
    setCameraLoading(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('In-browser camera stream is not supported. Please use the device camera button below.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera stream error:', err);
      setImageError(err.message || 'Could not access device camera. Please check camera permissions or select image file.');
      // Fallback: trigger native mobile camera input
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
      }
    } finally {
      setCameraLoading(false);
    }
  };

  // Capture still photo from live video feed
  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
      setImageSourceType('Camera Photo');
      setImageFormatValid(true);
      setImageError(null);

      // Stop camera stream after capture
      stopCameraStream();
    } catch (err) {
      setImageError('Failed to capture snapshot from camera stream.');
    }
  };

  // Process file upload / mobile native camera photo
  const handleFileSelected = (file, sourceType = 'Device Upload') => {
    setImageError(null);
    if (!file) return;

    // Validate image format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setImageError('Invalid file format. Please choose a JPEG, PNG, WebP, or GIF image.');
      setImageFormatValid(false);
      return;
    }

    // Read and compress image client-side to optimized base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setImagePreview(compressedDataUrl);
        setImageUrl(compressedDataUrl);
        setImageSourceType(sourceType);
        setImageFormatValid(true);
      };
      img.onerror = () => {
        setImageError('Unable to process selected image file.');
        setImageFormatValid(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle URL change & live validate
  const handleUrlChange = (url) => {
    setImageUrl(url);
    setImageError(null);

    if (!url.trim()) {
      setImagePreview('');
      setImageFormatValid(true);
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setImageError('URL must begin with http:// or https://');
      setImageFormatValid(false);
      return;
    }

    // Test image loading
    const testImg = new Image();
    testImg.onload = () => {
      setImagePreview(url);
      setImageSourceType('Image Link');
      setImageFormatValid(true);
      setImageError(null);
    };
    testImg.onerror = () => {
      setImagePreview(url);
      setImageError('Warning: Image link failed to load or is protected by CORS. Please verify link.');
      setImageFormatValid(false);
    };
    testImg.src = url;
  };

  const handleClearImage = () => {
    setImageUrl('');
    setImagePreview('');
    setImageSourceType('');
    setImageError(null);
    setImageFormatValid(true);
    stopCameraStream();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mobileCameraInputRef.current) mobileCameraInputRef.current.value = '';
  };

  // Re-run AI Food Safety evaluation live whenever time or storage condition changes
  useEffect(() => {
    runLiveSafetyCheck();
  }, [category, foodType, prepTime, safeDeadline, storageCondition]);

  const runLiveSafetyCheck = async () => {
    if (!category || !prepTime || !safeDeadline || !storageCondition) return;
    try {
      setEvaluatingSafety(true);
      const result = await api.previewSafety({
        category,
        food_type: foodType,
        prep_time: new Date(prepTime).toISOString(),
        safe_deadline: new Date(safeDeadline).toISOString(),
        storage_condition: storageCondition
      });
      setSafetyCheck(result);
    } catch (err) {
      console.warn('Safety check preview error:', err);
    } finally {
      setEvaluatingSafety(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        food_name: foodName,
        description,
        image_url: imageUrl,
        category,
        food_type: foodType,
        quantity: parseFloat(quantity),
        quantity_unit: quantityUnit,
        packets_count: parseInt(packetsCount) || Math.round(parseFloat(quantity) * 2.5),
        prep_time: new Date(prepTime).toISOString(),
        safe_deadline: new Date(safeDeadline).toISOString(),
        storage_condition: storageCondition,
        pickup_address: pickupAddress,
        contact_phone: contactPhone
      };

      const res = await api.createDonation(payload);
      setSuccessMsg('Donation successfully published and verified by AI!');
      setTimeout(() => {
        if (onSuccessDonation) onSuccessDonation(res.donation);
        setCurrentView('available-food');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit food donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
          <span>Surplus Food Redistribution Intake</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          List Surplus Food Donation
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide accurate preparation timestamps, photos, and storage details. Our AI safety engine will verify your listing and alert matching shelters.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Submission Blocked:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Main Form & Safety Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column (2 Cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* 1. Food Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">1. Food Details</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Food / Dish Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hyderabadi Dum Biryani with Salan, Fresh Chapati & Paneer"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="Cooked Meals">Cooked Meals</option>
                  <option value="Bakery & Bread">Bakery & Bread</option>
                  <option value="Raw Produce / Veggies">Raw Produce / Veggies</option>
                  <option value="Packaged / Canned">Packaged / Canned</option>
                  <option value="Dairy & Sweets">Dairy & Sweets</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dietary Classification *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFoodType('veg')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      foodType === 'veg'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🌿 Pure Veg
                  </button>
                  <button
                    type="button"
                    onClick={() => setFoodType('non-veg')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      foodType === 'non-veg'
                        ? 'bg-rose-50 border-rose-500 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🍗 Non-Veg
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description & Ingredients</label>
              <textarea
                rows={2}
                placeholder="Mention key ingredients, allergen info, packaging details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* 2. Multiple Food Image Upload Options (Camera / Upload / URL) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                2. Food Photo & Image Options
              </h3>
              {imagePreview && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Photo Ready
                </span>
              )}
            </div>

            {/* 3 Upload Options Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setImageMode('camera');
                  if (!imagePreview) startCameraStream();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  imageMode === 'camera'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageMode('upload');
                  stopCameraStream();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  imageMode === 'upload'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageMode('url');
                  stopCameraStream();
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  imageMode === 'url'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image URL</span>
              </button>
            </div>

            {/* Option A: Open Camera Viewfinder */}
            {imageMode === 'camera' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  ref={mobileCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0], 'Camera Photo');
                    }
                  }}
                />

                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black max-w-md mx-auto aspect-4/3 flex items-center justify-center shadow-md">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    
                    {/* Viewfinder crosshairs */}
                    <div className="absolute inset-6 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                      <span className="text-[11px] text-white/80 font-bold bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                        Center food in frame
                      </span>
                    </div>

                    {/* Camera Control Bar */}
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-4 z-10">
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition"
                        title="Cancel Camera"
                      >
                        <VideoOff className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-xl flex items-center gap-2 transform active:scale-95 transition"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Direct Device Camera Capture</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Capture fresh food condition instantly using your smartphone or desktop webcam.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startCameraStream}
                        disabled={cameraLoading}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {cameraLoading ? 'Starting Camera...' : 'Open Live Camera Viewfinder'}
                      </button>

                      <button
                        type="button"
                        onClick={() => mobileCameraInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
                      >
                        Native Camera (Mobile)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option B: Upload Image from Device Gallery / File Manager */}
            {imageMode === 'upload' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0], 'Device Upload');
                    }
                  }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-white/50 hover:bg-emerald-50/30 group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 group-hover:scale-110 text-emerald-700 flex items-center justify-center mx-auto transition">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-2">
                    Click to browse device gallery or drag & drop photo
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports JPEG, PNG, WebP, or GIF (auto-optimized for mobile & web)
                  </p>
                </div>
              </div>
            )}

            {/* Option C: Image URL Input & Presets */}
            {imageMode === 'url' && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paste Image URL Link</label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://example.com/food-dish.jpg"
                      value={imageUrl.startsWith('data:') ? '' : imageUrl}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Or choose a high-res preset:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {imagePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleUrlChange(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition border ${
                          imageUrl === preset.url
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Message for Image */}
            {imageError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{imageError}</span>
              </div>
            )}

            {/* Selected Image Preview Box */}
            {imagePreview && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                <img
                  src={imagePreview}
                  alt="Food listing preview"
                  className="w-full h-44 object-cover"
                />
                
                {/* Floating Preview Info Banner */}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-auto">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3" />
                    {imageSourceType || 'Selected Image'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs">
                    Valid Image Format
                  </span>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white pointer-events-auto">
                  <span className="text-xs font-semibold drop-shadow-xs">Image Preview (Listing Display)</span>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove / Change
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Portion & Quantities */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Portion & Quantities</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="e.g. 25"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="packets">packets</option>
                  <option value="plates">plates</option>
                  <option value="liters">liters</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Est. Portions / Meals *</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 70"
                  value={packetsCount}
                  onChange={(e) => setPacketsCount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 4. Timestamps & Storage Condition (Crucial for Food Safety) */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              4. Time & Food Safety Controls
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preparation Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Safe Consumption Deadline *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={safeDeadline}
                  onChange={(e) => setSafeDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Storage Condition *
              </label>
              <select
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Hot Held (>60°C)">Hot Held (&gt;60°C) — Bain-marie / Insulated Thermoware</option>
                <option value="Refrigerated (0-4°C)">Refrigerated (0-4°C) — Cold Room / Chiller</option>
                <option value="Frozen (<-18°C)">Frozen (&lt;-18°C) — Deep Freezer</option>
                <option value="Ambient / Room Temp">Ambient / Room Temp (Dry Bakery or Immediate Consumption)</option>
              </select>
            </div>
          </div>

          {/* 5. Logistics & Location */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">5. Pickup Location & Contact</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Address *</label>
              <input
                type="text"
                required
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting || (safetyCheck && !safetyCheck.allowRequest)}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Verifying & Publishing Listing...' : 'Publish Surplus Food Donation'}
            </button>
          </div>
        </form>

        {/* Live AI Safety Pre-Check Sticky Column (1 Col) */}
        <div className="space-y-4">
          <div className="sticky top-24 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Live AI Safety Pre-Check
              </span>
              {evaluatingSafety && (
                <span className="text-[10px] text-emerald-600 font-bold animate-pulse">Analyzing...</span>
              )}
            </div>

            {safetyCheck ? (
              <div className="space-y-4">
                {/* Score Dial */}
                <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className={`text-4xl font-black ${
                    safetyCheck.score >= 80 ? 'text-emerald-600' : safetyCheck.score >= 50 ? 'text-amber-500' : 'text-rose-600'
                  }`}>
                    {safetyCheck.score}
                    <span className="text-base font-normal text-slate-400">/100</span>
                  </div>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                    safetyCheck.status === 'Safe to Consider'
                      ? 'bg-emerald-100 text-emerald-800'
                      : safetyCheck.status === 'Needs Verification'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {safetyCheck.status}
                  </span>
                </div>

                {/* Hours remaining counter */}
                <div className="flex items-center justify-between text-xs text-slate-600 p-2.5 rounded-xl bg-slate-50">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    Safe Remaining:
                  </span>
                  <strong className="text-slate-800 font-bold">
                    {safetyCheck.hoursUntilDeadline > 0 ? `${safetyCheck.hoursUntilDeadline} hrs` : 'Expired'}
                  </strong>
                </div>

                {/* Warnings or Guidelines */}
                {safetyCheck.warnings && safetyCheck.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 space-y-1">
                    <span className="text-[11px] font-bold text-rose-800 block">Critical Risk Alerts:</span>
                    {safetyCheck.warnings.map((w, idx) => (
                      <p key={idx} className="text-[11px] text-rose-700 leading-tight">
                        • {w}
                      </p>
                    ))}
                  </div>
                )}

                {/* Recommendation */}
                <p className="text-xs text-slate-600 leading-relaxed italic border-t border-slate-100 pt-3">
                  "{safetyCheck.recommendation}"
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Fill preparation timestamps and storage condition to evaluate food safety score.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
