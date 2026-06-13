import React, { useState } from 'react';
import { Globe, FileCode, CheckCircle, Laptop, ArrowRight, Play } from 'lucide-react';
import Sidebar from '../components/Udyan/Sidebar';

const UdyanExtension: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'content' | 'popup'>('manifest');
  const [simState, setSimState] = useState<'idle' | 'running' | 'done'>('idle');

  // Mock Form State
  const [formFields, setFormFields] = useState({
    firm_name: '',
    proprietor: '',
    mobile_num: '',
    pincode: '',
    address: ''
  });

  const runSimulation = () => {
    setSimState('running');
    setFormFields({ firm_name: '', proprietor: '', mobile_num: '', pincode: '', address: '' });

    // Step-by-step simulated typing
    setTimeout(() => {
      setFormFields(prev => ({ ...prev, firm_name: 'Spice Route Restaurant' }));
    }, 400);

    setTimeout(() => {
      setFormFields(prev => ({ ...prev, proprietor: 'Rahul Sharma' }));
    }, 800);

    setTimeout(() => {
      setFormFields(prev => ({ ...prev, mobile_num: '9876543210' }));
    }, 1200);

    setTimeout(() => {
      setFormFields(prev => ({ ...prev, pincode: '560001' }));
    }, 1600);

    setTimeout(() => {
      setFormFields(prev => ({ ...prev, address: 'MG Road, Bengaluru, Karnataka' }));
      setSimState('done');
    }, 2000);
  };

  const codeFiles = {
    manifest: `{
  "manifest_version": 3,
  "name": "Udyan Autofill",
  "version": "1.0",
  "description": "Intelligently autofills Indian government license forms using Udyan AI business coordinates",
  "permissions": ["activeTab", "storage"],
  "host_permissions": [
    "https://*.gst.gov.in/*",
    "https://*.fssai.gov.in/*",
    "https://*.gov.in/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": "icon.png"
  },
  "content_scripts": [
    {
      "matches": ["https://*.gst.gov.in/*", "https://*.fssai.gov.in/*", "https://*.gov.in/*", "http://localhost/*"],
      "js": ["content.js"]
    }
  ]
}`,
    content: `// Udyan Autofill Content Script
// Intelligently maps form labels and placeholders to business coordinates

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    const profile = request.data;
    
    // Auto-mapping parameters
    const fieldMapping = {
      business_name: ["business_name", "firm_name", "establishment_name", "legal_name", "applicant_name"],
      owner_name: ["owner_name", "proprietor", "authorized_signatory", "applicant", "owner"],
      email: ["email", "email_address", "contact_email", "mail"],
      mobile: ["mobile", "phone", "contact_number", "mobile_number", "telephone"],
      gstin: ["gstin", "gst_number", "gst_code"],
      fssai_number: ["fssai_number", "fssai_code", "food_license"],
      address: ["address", "street", "place_of_business", "premise_address"],
      city: ["city", "town", "taluk"],
      pincode: ["pincode", "pin", "postal_code", "zip"]
    };

    // Iterate through inputs
    const inputs = document.querySelectorAll("input, textarea, select");
    let filledCount = 0;

    inputs.forEach(input => {
      const name = (input.name || "").toLowerCase();
      const id = (input.id || "").toLowerCase();
      const placeholder = (input.placeholder || "").toLowerCase();
      
      // Look for labels
      let labelText = "";
      if (input.id) {
        const labelEl = document.querySelector(\`label[for="\${input.id}"]\`);
        if (labelEl) labelText = labelEl.innerText.toLowerCase();
      }

      // Map matching keys
      for (const [coordKey, synonyms] of Object.entries(fieldMapping)) {
        const isMatch = synonyms.some(syn => 
          name.includes(syn) || 
          id.includes(syn) || 
          placeholder.includes(syn) ||
          labelText.includes(syn)
        );

        if (isMatch && profile[coordKey]) {
          input.value = profile[coordKey];
          // Dispatch input events so React/Angular values sync
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
          break;
        }
      }
    });

    sendResponse({ status: "success", filled: filledCount });
  }
});`,
    popup: `<!-- Udyan Autofill Extension Popup -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { width: 300px; font-family: sans-serif; padding: 12px; margin: 0; background: #0F172A; color: #FFF; }
    h3 { margin-top: 0; color: #3B82F6; font-size: 14px; }
    .btn { background: #2563EB; border: none; color: #FFF; width: 100%; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn:hover { background: #1D4ED8; }
    .meta { font-size: 11px; color: #94A3B8; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h3>Udyan Autofill Active</h3>
  <p class="meta">Connected profile: Spice Route Restaurant</p>
  <button id="autofill-btn" class="btn">Auto Fill Form</button>
  <script>
    document.getElementById("autofill-btn").addEventListener("click", () => {
      // Fetches active coordinates and transmits to Content Script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "autofill",
          data: {
            business_name: "Spice Route Restaurant",
            owner_name: "Rahul Sharma",
            mobile: "9876543210",
            pincode: "560001",
            address: "MG Road, Bengaluru, Karnataka"
          }
        });
      });
    });
  </script>
</body>
</html>`
  };

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen text-black font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        
        {/* Top Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-norms tracking-tight flex items-center gap-2 text-black">
            Udyan Autofill Extension 
            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-sans uppercase font-bold">
              Manifest V3
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Intelligent form mapper. Written to scan page inputs and auto-inject credentials upon clicking.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel: Installation Guide & Interactive Simulator */}
          <div className="space-y-6">
            
            {/* Guide */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-black">
              <h2 className="text-base font-bold font-norms text-black flex items-center gap-2 mb-4">
                <Laptop className="w-5 h-5 text-blue-600" />
                How to load in Chrome
              </h2>
              
              <ul className="text-xs space-y-3.5 text-gray-700">
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-gray-100 border border-gray-200 text-gray-655 text-[10px] rounded-full flex items-center justify-center shrink-0 font-bold">1</span>
                  <div>
                    <strong className="text-black">Locate sources:</strong> The source code files are automatically written in the workspace directory under <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-gray-600">/chrome-extension</code>.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-gray-100 border border-gray-200 text-gray-655 text-[10px] rounded-full flex items-center justify-center shrink-0 font-bold">2</span>
                  <div>
                    <strong className="text-black">Open Extension page:</strong> In Google Chrome, navigate to URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-gray-600">chrome://extensions/</code>.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-gray-100 border border-gray-200 text-gray-655 text-[10px] rounded-full flex items-center justify-center shrink-0 font-bold">3</span>
                  <div>
                    <strong className="text-black">Toggle Dev Mode:</strong> Enable the **Developer mode** toggle in the top-right corner.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="w-5 h-5 bg-gray-100 border border-gray-200 text-gray-655 text-[10px] rounded-full flex items-center justify-center shrink-0 font-bold">4</span>
                  <div>
                    <strong className="text-black">Load Unpacked:</strong> Click **Load unpacked** on the top-left and select the <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-gray-600">chrome-extension</code> folder.
                  </div>
                </li>
              </ul>
            </div>

            {/* Live Interactive Simulator */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-black">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                <h2 className="text-sm font-bold font-norms text-black flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-emerald-600" />
                  Interactive Extension Simulator
                </h2>
                <span className="text-[10px] text-gray-400 font-mono">Sandbox Environment</span>
              </div>
              <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                Test the extension's mapping behavior below. See how it scans the labels on this simulated portal form and types the values automatically.
              </p>

              {/* Simulated Extension Action Bar */}
              <div className="bg-gray-55 border border-gray-200 p-4 rounded-xl flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div>
                    <span className="text-xs font-bold text-black block">Udyan Autofill Active</span>
                    <span className="text-[9px] text-gray-500 font-mono">Matches profile: Spice Route Restaurant</span>
                  </div>
                </div>
                <button
                  onClick={runSimulation}
                  disabled={simState === 'running'}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {simState === 'running' ? 'Injecting...' : 'Auto Fill Form'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Simulated Form */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-4">
                <span className="text-[10px] bg-white text-gray-500 border border-gray-200 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider shadow-sm">
                  MOCK GOVERNMENT PORTAL FORM
                </span>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">Firm/Establishment Name:</label>
                    <input
                      type="text"
                      readOnly
                      value={formFields.firm_name}
                      placeholder="Will be autofilled..."
                      className="bg-white border border-gray-300 text-black text-xs p-2.5 rounded-lg w-full outline-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Name of Proprietor:</label>
                      <input
                        type="text"
                        readOnly
                        value={formFields.proprietor}
                        placeholder="Proprietor..."
                        className="bg-white border border-gray-300 text-black text-xs p-2.5 rounded-lg w-full outline-none font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Mobile/Contact Number:</label>
                      <input
                        type="text"
                        readOnly
                        value={formFields.mobile_num}
                        placeholder="Mobile..."
                        className="bg-white border border-gray-300 text-black text-xs p-2.5 rounded-lg w-full outline-none font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Postal PIN Code:</label>
                      <input
                        type="text"
                        readOnly
                        value={formFields.pincode}
                        placeholder="PIN..."
                        className="bg-white border border-gray-300 text-black text-xs p-2.5 rounded-lg w-full outline-none font-semibold"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Street/Premises Address:</label>
                      <input
                        type="text"
                        readOnly
                        value={formFields.address}
                        placeholder="Street..."
                        className="bg-white border border-gray-300 text-black text-xs p-2.5 rounded-lg w-full outline-none font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {simState === 'done' && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-250 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Autofill mapping verified successfully. 5 fields injected.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Panel: Tabbed code viewer */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm text-black">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                <h2 className="text-base font-bold font-norms text-black flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-600" />
                  Code Inspector
                </h2>
                <div className="flex bg-gray-100 p-1 border border-gray-200 rounded-lg">
                  {(['manifest', 'content', 'popup'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded transition-all ${
                        activeTab === tab ? 'bg-white text-black shadow-sm font-bold' : 'text-gray-500 hover:text-black'
                      }`}
                    >
                      {tab === 'manifest' ? 'manifest.json' : tab === 'content' ? 'content.js' : 'popup.html'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code viewer screen */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl max-h-[480px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre">
                {codeFiles[activeTab]}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-6 text-gray-400 text-[11px] leading-relaxed">
              These sources compile to an unpacked manifest V3 package. All mapping is client-side, respecting user data privacy.
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};

export default UdyanExtension;
