import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Building,
  Users,
  IndianRupee,
  Layers,
  Home,
  UserCheck,
  ToggleLeft,
  FileBadge,
  AlertOctagon,
  Award
} from 'lucide-react';
import { saveOnboarding, getOnboarding } from '../utils/udyanStorage';
import type { OnboardingAnswers } from '../utils/udyanStorage';
import confetti from 'canvas-confetti';

const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 256 256"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
  </svg>
);

const UdyanOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Wizard state variables
  const [sector, setSector] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [locationCount, setLocationCount] = useState('');
  const [premisesType, setPremisesType] = useState('');
  const [dailyFootfall, setDailyFootfall] = useState('');
  const [operations, setOperations] = useState<string[]>([]);
  const [hazardousMaterials, setHazardousMaterials] = useState('');
  const [existingLicenses, setExistingLicenses] = useState<string[]>([]);
  const [compliancePriority, setCompliancePriority] = useState('');

  useEffect(() => {
    loadPreviousAnswers();
  }, []);

  const loadPreviousAnswers = async () => {
    setLoading(true);
    try {
      const data = await getOnboarding();
      if (data) {
        if (data.business_sector) setSector(data.business_sector);
        if (data.employee_count_range) setEmployeeCount(data.employee_count_range);
        if (data.annual_revenue_range) setAnnualRevenue(data.annual_revenue_range);
        if (data.location_count) setLocationCount(data.location_count);
        if (data.premises_type) setPremisesType(data.premises_type);
        if (data.daily_footfall) setDailyFootfall(data.daily_footfall);
        if (data.business_operations) setOperations(data.business_operations);
        if (data.hazardous_materials) setHazardousMaterials(data.hazardous_materials);
        if (data.existing_licenses) setExistingLicenses(data.existing_licenses);
        if (data.compliance_priority) setCompliancePriority(data.compliance_priority);
      }
    } catch (err) {
      console.error('Failed to load onboarding answers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !sector) return;
    if (currentStep === 2 && !employeeCount) return;
    if (currentStep === 3 && !annualRevenue) return;
    if (currentStep === 4 && !locationCount) return;
    if (currentStep === 5 && !premisesType) return;
    if (currentStep === 6 && !dailyFootfall) return;
    if (currentStep === 7 && operations.length === 0) return;
    if (currentStep === 8 && !hazardousMaterials) return;
    if (currentStep === 9 && existingLicenses.length === 0) return;
    if (currentStep === 10 && !compliancePriority) return;

    if (currentStep < 10) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleMultiSelect = (item: string, state: string[], setState: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (item === 'None') {
      setState(['None']);
      return;
    }
    const filtered = state.filter(x => x !== 'None');
    if (filtered.includes(item)) {
      setState(filtered.filter(x => x !== item));
    } else {
      setState([...filtered, item]);
    }
  };

  const getOperationsOptions = () => {
    switch (sector) {
      case 'Restaurant / Food Service':
        return ['Food Preparation', 'Food Delivery', 'Alcohol Service', 'Catering'];
      case 'Manufacturing Unit':
        return ['Production', 'Packaging', 'Storage', 'Export'];
      case 'Pharmacy / Medical Store':
        return ['Retail Medicines', 'Wholesale Medicines', 'Online Medicines'];
      case 'Hospital / Clinic':
        return ['OPD Services', 'Inpatient Services', 'Laboratory', 'Pharmacy'];
      case 'Hotel / Resort':
        return ['Accommodation', 'Restaurant', 'Banquet Hall', 'Spa Services'];
      case 'Educational Institution':
        return ['School', 'College', 'Coaching Center', 'Hostel Facility'];
      default:
        return ['General Production', 'Distribution', 'Customer Facing Sales', 'Service Delivery'];
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    const answers: OnboardingAnswers = {
      business_sector: sector,
      employee_count_range: employeeCount,
      annual_revenue_range: annualRevenue,
      location_count: locationCount,
      premises_type: premisesType,
      daily_footfall: dailyFootfall,
      business_operations: operations,
      hazardous_materials: hazardousMaterials,
      existing_licenses: existingLicenses,
      compliance_priority: compliancePriority
    };

    try {
      await saveOnboarding(answers);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.8 }
      });
      setTimeout(() => {
        navigate('/udyan/upload-licenses');
      }, 1500);
    } catch (err) {
      alert('Failed to save onboarding checklist values.');
    } finally {
      setSaving(false);
    }
  };

  // Helper for rendering questions
  const renderQuestion = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" />
              What type of business do you operate?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Restaurant / Food Service',
                'Manufacturing Unit',
                'Pharmacy / Medical Store',
                'Hospital / Clinic',
                'Hotel / Resort',
                'Educational Institution'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { setSector(opt); setOperations([]); }}
                  className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 ${
                    sector === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              How many employees work in your organization?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['1 - 5', '6 - 20', '21 - 50', '51 - 100', '101 - 250', '250+'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEmployeeCount(opt)}
                  className={`p-4 text-center border rounded-2xl font-semibold transition-all duration-200 ${
                    employeeCount === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-indigo-500" />
              What is your approximate annual revenue?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Below ₹10 Lakhs',
                '₹10 Lakhs - ₹50 Lakhs',
                '₹50 Lakhs - ₹1 Crore',
                '₹1 Crore - ₹5 Crores',
                '₹5 Crores - ₹10 Crores',
                'Above ₹10 Crores'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnnualRevenue(opt)}
                  className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 ${
                    annualRevenue === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              How many business locations do you operate?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['1', '2 - 5', '6 - 10', '11 - 25', '25+'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLocationCount(opt)}
                  className={`p-4 text-center border rounded-2xl font-semibold transition-all duration-200 ${
                    locationCount === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-500" />
              Where does your business operate?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Owned Building',
                'Rented Building',
                'Leased Property',
                'Government Premises',
                'Shared Workspace'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPremisesType(opt)}
                  className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 ${
                    premisesType === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />
              Average daily customer footfall?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Less than 50',
                '50 - 100',
                '100 - 500',
                '500 - 1000',
                'More than 1000'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDailyFootfall(opt)}
                  className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 ${
                    dailyFootfall === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <ToggleLeft className="w-5 h-5 text-indigo-500" />
              Which activities apply to your business?
            </h3>
            <p className="text-xs text-gray-400 font-semibold mb-2">Dynamic operations matching your sector: {sector}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getOperationsOptions().map(opt => {
                const isSelected = operations.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleMultiSelect(opt, operations, setOperations)}
                    className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 ${
                      isSelected 
                        ? 'border-black bg-black text-white shadow-md' 
                        : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-indigo-500" />
              Do you store or handle hazardous materials?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Yes', 'No'].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setHazardousMaterials(opt)}
                  className={`p-4 text-center border rounded-2xl font-semibold transition-all duration-200 ${
                    hazardousMaterials === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <FileBadge className="w-5 h-5 text-indigo-500" />
              Which licenses do you currently have?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                'FSSAI',
                'GST',
                'Trade License',
                'Shop & Establishment',
                'Fire NOC',
                'Drug License',
                'Pollution Consent',
                'Factory License',
                'Clinical Establishment License',
                'Education Board Affiliation',
                'None'
              ].map(opt => {
                const isSelected = existingLicenses.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleMultiSelect(opt, existingLicenses, setExistingLicenses)}
                    className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 text-sm ${
                      isSelected 
                        ? 'border-black bg-black text-white shadow-md' 
                        : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-norms flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-500" />
              What is your biggest compliance challenge?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                'Tracking Renewals',
                'Understanding Regulations',
                'Avoiding Penalties',
                'Managing Multiple Licenses',
                'Filling Government Forms',
                'Document Management'
              ].map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCompliancePriority(opt)}
                  className={`p-4 text-left border rounded-2xl font-semibold transition-all duration-200 ${
                    compliancePriority === opt 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-200 hover:border-gray-400 bg-white text-gray-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F5F5F5] min-h-screen text-black items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading questionnaire profile...</p>
        </div>
      </div>
    );
  }

  // Check step completeness
  const isStepComplete = () => {
    if (currentStep === 1) return !!sector;
    if (currentStep === 2) return !!employeeCount;
    if (currentStep === 3) return !!annualRevenue;
    if (currentStep === 4) return !!locationCount;
    if (currentStep === 5) return !!premisesType;
    if (currentStep === 6) return !!dailyFootfall;
    if (currentStep === 7) return operations.length > 0;
    if (currentStep === 8) return !!hazardousMaterials;
    if (currentStep === 9) return existingLicenses.length > 0;
    if (currentStep === 10) return !!compliancePriority;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="px-8 py-5 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg text-white">
            <LogoIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black font-norms">UDYAN AI</h1>
            <p className="text-[10px] text-gray-500 font-medium font-sans uppercase">Onboarding journey</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 font-semibold">
          Step 2 of 3: Business Profile Questionnaire
        </div>
      </header>

      {/* Main Form Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:py-12">
        {/* Step Progress bar */}
        <div className="mb-8 space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
            <span>QUESTION {currentStep} OF 10</span>
            <span>{Math.round((currentStep / 10) * 100)}% COMPLETED</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-black h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Panel */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-10 shadow-sm min-h-[22rem] flex flex-col justify-between">
          <div>
            {renderQuestion()}
          </div>

          <div className="flex justify-between items-center gap-4 mt-8 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-3 border border-gray-250 hover:bg-gray-50 font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!isStepComplete() || saving}
              className="flex items-center gap-2 px-7 py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all disabled:bg-gray-200 disabled:text-gray-400"
            >
              {saving ? (
                <>
                  Saving Profile...
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : currentStep === 10 ? (
                <>
                  Complete & Analyze
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                </>
              ) : (
                <>
                  Next Question
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 text-center text-xs text-gray-400">
        UdyamAI Compliance Copilot Engine. Powered by Sarvam AI.
      </footer>
    </div>
  );
};

export default UdyanOnboarding;
