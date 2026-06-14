import React, { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle2, User, Landmark, MapPin } from 'lucide-react';
import { getProfile, saveProfile } from '../utils/udyanStorage';
import type { BusinessProfile } from '../utils/udyanStorage';
import Sidebar from '../components/Udyan/Sidebar';
import confetti from 'canvas-confetti';

const UdyanProfile: React.FC = () => {
  const [profile, setProfile] = useState<BusinessProfile>({
    business_name: '',
    owner_name: '',
    email: '',
    mobile: '',
    gstin: '',
    fssai_number: '',
    trade_license_number: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    pan: '',
    aadhaar: ''
  });

  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const data = await getProfile();
    setProfile(data);
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    if (saveSuccess) setSaveSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaveSuccess(false);

    // Simple validations
    if (!profile.business_name || !profile.owner_name || !profile.email || !profile.mobile) {
      setErrorMsg('Please fill out all primary business coordinates (Name, Owner, Email, Mobile).');
      return;
    }

    try {
      await saveProfile(profile);
      setSaveSuccess(true);
      
      // Fire confetti for judges
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      setErrorMsg('Failed to update business profile.');
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F5F5F5] min-h-screen text-black items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Synchronizing credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen text-black font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* Top Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-norms tracking-tight text-black">Business Profile Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            These coordinates are securely utilized by Udyan AI to map and pre-fill government portal forms.
          </p>
        </header>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-center mb-6 max-w-4xl text-red-700">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-xs font-semibold">{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-250 rounded-2xl flex gap-3 items-center mb-6 max-w-4xl text-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">
              Business Profile successfully updated! Changes are synced across all portals.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          
          {/* Card 1: Core details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black font-norms font-medium">Primary Authorized Signatory</h2>
                <p className="text-xs text-gray-400">Contact coordinates of the restaurant/business operator.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Legal Business Name</label>
                <input
                  type="text"
                  name="business_name"
                  value={profile.business_name}
                  onChange={handleChange}
                  placeholder="e.g. Spice Route Hospitality Pvt Ltd"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Authorized Owner/Operator</label>
                <input
                  type="text"
                  name="owner_name"
                  value={profile.owner_name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Registered Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="e.g. contact@business.com"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Primary Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={profile.mobile}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Legal Identifiers */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black font-norms font-medium">Statutory Registrations & KYC</h2>
                <p className="text-xs text-gray-400">Government registry keys required for filing renewals.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">GSTIN (15-Digit)</label>
                <input
                  type="text"
                  name="gstin"
                  value={profile.gstin}
                  onChange={handleChange}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">FSSAI Number (14-Digit)</label>
                <input
                  type="text"
                  name="fssai_number"
                  value={profile.fssai_number}
                  onChange={handleChange}
                  placeholder="e.g. 21224009000123"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Trade License Reference</label>
                <input
                  type="text"
                  name="trade_license_number"
                  value={profile.trade_license_number}
                  onChange={handleChange}
                  placeholder="e.g. TL-BBMP-98212"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">PAN Card (10-Digit)</label>
                <input
                  type="text"
                  name="pan"
                  value={profile.pan}
                  onChange={handleChange}
                  placeholder="e.g. ABCDE1234F"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full font-mono uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-2">Aadhaar Number (12-Digit)</label>
                <input
                  type="text"
                  name="aadhaar"
                  value={profile.aadhaar}
                  onChange={handleChange}
                  placeholder="e.g. 1234-5678-9012"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Location Details */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-black font-norms font-medium">Physical Location & Address</h2>
                <p className="text-xs text-gray-400">Mailing and operating coordinates used for municipal licenses.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-2">Street Address</label>
                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="e.g. 45, MG Road, Landmark: Opposite Metro Station"
                  className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">District</label>
                  <input
                    type="text"
                    name="district"
                    value={profile.district}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru Urban"
                    className="bg-slate-950 border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={profile.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">PIN Code</label>
                  <input
                    type="text"
                    name="pincode"
                    value={profile.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560001"
                    className="bg-white border border-gray-300 focus:border-black text-black text-sm p-3 rounded-xl focus:outline-none w-full font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 max-w-4xl">
            <button
              type="button"
              onClick={loadProfile}
              className="bg-white border border-gray-200 hover:bg-gray-55 text-gray-550 text-sm font-semibold px-6 py-3 rounded-xl transition-all"
            >
              Reset to Saved
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-bold px-8 py-3 rounded-xl shadow transition-all"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default UdyanProfile;
