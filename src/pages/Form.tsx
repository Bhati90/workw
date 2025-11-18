import React, { useState, FormEvent, ChangeEvent } from 'react';

// TypeScript interfaces for form data
interface RateCard {
  failFoot: string;
  secondFail: string;
  dipping: string;
  thinning: string;
  shootTying: string;
  caneTying: string;
  shendaStop: string;
  otherWorkRate: string;
}

interface TransportCharges {
  bikeChargePerBike: string;
  bikeBeyondKm: string;
  pickupChargeDetails: string;
}
interface PaymentDetails {
  modes: {
    cash: boolean;
    upi: boolean;
    bank: boolean;
  };
  upiId: string;
  accountNumber: string;
  ifscCode: string;
  bankNameBranch: string;
}

interface FormData {
  // Basic Details
  mukkadamName: string;
  mobileNumbers: string;
  village: string;
  hasSmartphone: string;
  
  // Crew Details
  crewSize: string;
  maxCrewCapacity: string;
  splittingLogic: string;
  deputyMukkadamName: string;
  
  // Availability
  startDate: string;
  endDate: string;
  dailyWorkTiming: string;
  
  // Rate Card
  rateCard: RateCard;
  
  // Work Area Preference
  homeLocation: string;
  preferredWorkLocations: string;
  maxTravelDistance: string;
  
  // Transport Details
  transportMode: string;
  transportCharges: TransportCharges;
  transportArrangedBy: string;
  
  // Payment Details
  paymentDetails: PaymentDetails;
  
  // Work Mode
  workMode: string;
  moveInPreferredRegion: string;
  
  // Other Info
  otherCommitments: string;
}

const MukkadamForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    mukkadamName: '',
    mobileNumbers: '',
    village: '',
    hasSmartphone: '',
    crewSize: '',
    maxCrewCapacity: '',
    splittingLogic: '',
    deputyMukkadamName: '',
    startDate: '',
    endDate: '',
    dailyWorkTiming: '',
    rateCard: {
      failFoot: '',
      secondFail: '',
      dipping: '',
      thinning: '',
      shootTying: '',
      caneTying: '',
      shendaStop: '',
      otherWorkRate: '',
    },
    homeLocation: '',
    preferredWorkLocations: '',
    maxTravelDistance: '',
    transportMode: '',
    transportCharges: {
      bikeChargePerBike: '',
      bikeBeyondKm: '',
      pickupChargeDetails: '',
    },
    transportArrangedBy: '',
    paymentDetails: {
      modes: {
        cash: false,
        upi: false,
        bank: false,
      },
      upiId: '',
      accountNumber: '',
      ifscCode: '',
      bankNameBranch: '',
    },
    workMode: '',
    moveInPreferredRegion: '',
    otherCommitments: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle text/number/date inputs
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle nested rate card fields
    if (name.startsWith('rateCard.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        rateCard: {
          ...prev.rateCard,
          [field]: value,
        },
      }));
    }
    // Handle nested transport charges
    else if (name.startsWith('transportCharges.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        transportCharges: {
          ...prev.transportCharges,
          [field]: value,
        },
      }));
    }
    // Handle nested payment details
    else if (name.startsWith('paymentDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        paymentDetails: {
          ...prev.paymentDetails,
          [field]: value,
        },
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox changes for payment modes
  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const mode = name.split('.')[2] as 'cash' | 'upi' | 'bank';
    
    setFormData(prev => ({
      ...prev,
      paymentDetails: {
        ...prev.paymentDetails,
        modes: {
          ...prev.paymentDetails.modes,
          [mode]: checked,
        },
      },
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validations
    if (!formData.mukkadamName.trim()) {
      newErrors.mukkadamName = 'Mukkadam name is required';
    }
    if (!formData.mobileNumbers.trim()) {
      newErrors.mobileNumbers = 'Mobile number is required';
    }
    if (!formData.village.trim()) {
      newErrors.village = 'Village/Residence is required';
    }
    if (!formData.hasSmartphone) {
      newErrors.hasSmartphone = 'Please select smartphone availability';
    }
    if (!formData.crewSize || parseInt(formData.crewSize) <= 0) {
      newErrors.crewSize = 'Crew size must be greater than 0';
    }
    if (!formData.transportMode) {
      newErrors.transportMode = 'Please select transport mode';
    }
    if (!formData.workMode) {
      newErrors.workMode = 'Please select work mode';
    }

    // Payment mode validation
    const { cash, upi, bank } = formData.paymentDetails.modes;
    if (!cash && !upi && !bank) {
      newErrors.paymentModes = 'Please select at least one payment mode';
    }

    // UPI validation
    if (upi && !formData.paymentDetails.upiId.trim()) {
      newErrors['paymentDetails.upiId'] = 'UPI ID is required when UPI is selected';
    }

    // Bank validation
    if (bank) {
      if (!formData.paymentDetails.accountNumber.trim()) {
        newErrors['paymentDetails.accountNumber'] = 'Account number is required';
      }
      if (!formData.paymentDetails.ifscCode.trim()) {
        newErrors['paymentDetails.ifscCode'] = 'IFSC code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      console.log('=== Mukkadam Information Form Submission ===');
      console.log(JSON.stringify(formData, null, 2));
      alert('Form submitted successfully! Check console for data.');
    } else {
      alert('Please fix the errors in the form before submitting.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          {/* <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-white text-center">
              मुक्कादम माहिती संकलन फॉर्म
            </h1>
            <p className="text-green-50 text-center mt-2 text-lg">
              Mukkadam Information Collection Form
            </p>
          </div> */}

          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-8 space-y-8">
            
            {/* 1. Basic Details */}
            <section className="space-y-6">
              <div className="border-b-2 border-green-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">1</span>
                  Basic Details / मूलभूत माहिती
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mukkadamName" className="block text-sm font-medium text-gray-700 mb-2">
                    Name of Mukkadam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="mukkadamName"
                    name="mukkadamName"
                    value={formData.mukkadamName}
                    onChange={handleInputChange}
                    placeholder="Enter mukkadam's full name"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.mukkadamName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.mukkadamName && (
                    <p className="mt-1 text-sm text-red-600">{errors.mukkadamName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="mobileNumbers" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="mobileNumbers"
                    name="mobileNumbers"
                    value={formData.mobileNumbers}
                    onChange={handleInputChange}
                    placeholder="e.g., 9876543210, 9123456789"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.mobileNumbers ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.mobileNumbers && (
                    <p className="mt-1 text-sm text-red-600">{errors.mobileNumbers}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                    Village / Residence Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Enter village or city name"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.village ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.village && (
                    <p className="mt-1 text-sm text-red-600">{errors.village}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Work Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Enter village or city name"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.village ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.village && (
                    <p className="mt-1 text-sm text-red-600">{errors.village}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                    Date When You Be Available  <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="village"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    placeholder="Enter village or city name"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                      errors.village ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.village && (
                    <p className="mt-1 text-sm text-red-600">{errors.village}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Smartphone Availability <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasSmartphone"
                        value="yes"
                        checked={formData.hasSmartphone === 'yes'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="hasSmartphone"
                        value="no"
                        checked={formData.hasSmartphone === 'no'}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
                  {errors.hasSmartphone && (
                    <p className="mt-1 text-sm text-red-600">{errors.hasSmartphone}</p>
                  )}
                </div>
              </div>
            </section>

            {/* 2. Crew Details */}
            <section className="space-y-6">
              <div className="border-b-2 border-blue-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2</span>
                  Crew Details / टोळी माहिती
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="crewSize" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Crew Size <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="crewSize"
                    name="crewSize"
                    value={formData.crewSize}
                    onChange={handleInputChange}
                    placeholder="e.g., 8"
                    min="1"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                      errors.crewSize ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.crewSize && (
                    <p className="mt-1 text-sm text-red-600">{errors.crewSize}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="maxCrewCapacity" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Crew Capacity
                  </label>
                  <input
                    type="number"
                    id="maxCrewCapacity"
                    name="maxCrewCapacity"
                    value={formData.maxCrewCapacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 15"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="splittingLogic" className="block text-sm font-medium text-gray-700 mb-2">
                    Splitting Logic if Team &gt; 12
                  </label>
                  <textarea
                    id="splittingLogic"
                    name="splittingLogic"
                    value={formData.splittingLogic}
                    onChange={handleInputChange}
                    placeholder="Describe how you split the team when crew size exceeds 12 members..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="deputyMukkadamName" className="block text-sm font-medium text-gray-700 mb-2">
                    Deputy Mukkadam Name (for managing second team)
                  </label>
                  <input
                    type="text"
                    id="deputyMukkadamName"
                    name="deputyMukkadamName"
                    value={formData.deputyMukkadamName}
                    onChange={handleInputChange}
                    placeholder="Enter deputy mukkadam's name if applicable"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="deputyMukkadamName" className="block text-sm font-medium text-gray-700 mb-2">
                    Deputy Mukkadam Mobile Number (for managing second team)
                  </label>
                  <input
                    type="text"
                    id="deputyMukkadamName"
                    name="deputyMukkadamName"
                    value={formData.deputyMukkadamName}
                    onChange={handleInputChange}
                    placeholder="Enter deputy mukkadam's name if applicable"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </section>

            {/* 3. Availability */}
            <section className="space-y-6">
              <div className="border-b-2 border-purple-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                  Availability / उपलब्धता
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date of Availability
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date of Availability
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="dailyWorkTiming" className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Work Timing
                  </label>
                  <input
                    type="text"
                    id="dailyWorkTiming"
                    name="dailyWorkTiming"
                    value={formData.dailyWorkTiming}
                    onChange={handleInputChange}
                    placeholder="e.g., 7 AM to 5 PM"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
              </div>

            
            <div className="border-b-2 border-purple-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                  Availability for 2nd team / उपलब्धता 
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date of Availability
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date of Availability
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="dailyWorkTiming" className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Work Timing
                  </label>
                  <input
                    type="text"
                    id="dailyWorkTiming"
                    name="dailyWorkTiming"
                    value={formData.dailyWorkTiming}
                    onChange={handleInputChange}
                    placeholder="e.g., 7 AM to 5 PM"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </section>

            {/* 4. Rate Card */}
            <section className="space-y-6">
              <div className="border-b-2 border-yellow-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-yellow-100 text-yellow-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">5</span>
                  Rate Card / दर तक्ता (Activity-wise charges)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'failFoot', label: 'Fail Foot', placeholder: 'e.g., 500' },
                  { name: 'secondFail', label: 'Second Fail', placeholder: 'e.g., 450' },
                  { name: 'dipping', label: 'Dipping', placeholder: 'e.g., 400' },
                  { name: 'thinning', label: 'Thinning', placeholder: 'e.g., 350' },
                  { name: 'shootTying', label: 'Shoot Tying', placeholder: 'e.g., 300' },
                  { name: 'caneTying', label: 'Cane Tying', placeholder: 'e.g., 350' },
                  { name: 'shendaStop', label: 'Shenda Stop (Shoot Stop)', placeholder: 'e.g., 400' },
                ].map((field) => (
                  <div key={field.name}>
                    <label htmlFor={`rateCard.${field.name}`} className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        id={`rateCard.${field.name}`}
                        name={`rateCard.${field.name}`}
                        value={formData.rateCard[field.name as keyof RateCard]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        min="0"
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label htmlFor="rateCard.otherWorkRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Any Other Work Rate
                  </label>
                  <textarea
                    id="rateCard.otherWorkRate"
                    name="rateCard.otherWorkRate"
                    value={formData.rateCard.otherWorkRate}
                    onChange={handleInputChange}
                    placeholder="Describe any other activities and their rates..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </section>

            {/* 5. Work Area Preference */}
            <section className="space-y-6">
              <div className="border-b-2 border-indigo-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">6</span>
                  Work Area Preference / कामाचे ठिकाण प्राधान्य
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="homeLocation" className="block text-sm font-medium text-gray-700 mb-2">
                    Home Location
                  </label>
                  <input
                    type="text"
                    id="homeLocation"
                    name="homeLocation"
                    value={formData.homeLocation}
                    onChange={handleInputChange}
                    placeholder="Your home village/city"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label htmlFor="maxTravelDistance" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Travel Distance (km)
                  </label>
                  <input
                    type="number"
                    id="maxTravelDistance"
                    name="maxTravelDistance"
                    value={formData.maxTravelDistance}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="preferredWorkLocations" className="block text-sm font-medium text-gray-700 mb-2">
                    Nearby Preferred Work Locations / Villages
                  </label>
                  <textarea
                    id="preferredWorkLocations"
                    name="preferredWorkLocations"
                    value={formData.preferredWorkLocations}
                    onChange={handleInputChange}
                    placeholder="List villages or areas where you prefer to work, separated by commas..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                  
                </div>
              </div>
            </section>

            {/* 6. Transport Details */}
            <section className="space-y-6">
              <div className="border-b-2 border-red-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-red-100 text-red-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">7</span>
                  Transport Details / वाहतूक तपशील
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Mode of Transport <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'own_bike', label: 'Own Bike' },
                      { value: 'own_pickup', label: 'Own Pickup' },
                      { value: 'no_vehicle', label: 'No Vehicle (needs pickup arrangement)' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                          type="radio"
                          name="transportMode"
                          value={option.value}
                          checked={formData.transportMode === option.value}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-3 text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.transportMode && (
                    <p className="mt-2 text-sm text-red-600">{errors.transportMode}</p>
                  )}
                </div>

                {/* Conditional Transport Charges */}
                {formData.transportMode === 'own_bike' && (
                  <div className="bg-red-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium text-gray-800">Bike Transport Charges</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="transportCharges.bikeChargePerBike" className="block text-sm font-medium text-gray-700 mb-2">
                          Charge per Bike
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                          <input
                            type="number"
                            id="transportCharges.bikeChargePerBike"
                            name="transportCharges.bikeChargePerBike"
                            value={formData.transportCharges.bikeChargePerBike}
                            onChange={handleInputChange}
                            placeholder="e.g., 100"
                            min="0"
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="transportCharges.bikeBeyondKm" className="block text-sm font-medium text-gray-700 mb-2">
                          Beyond (km)
                        </label>
                        <input
                          type="number"
                          id="transportCharges.bikeBeyondKm"
                          name="transportCharges.bikeBeyondKm"
                          value={formData.transportCharges.bikeBeyondKm}
                          onChange={handleInputChange}
                          placeholder="e.g., 20"
                          min="0"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.transportMode === 'own_pickup' && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-800 mb-3">Pickup Transport Charges</h3>
                    <label htmlFor="transportCharges.pickupChargeDetails" className="block text-sm font-medium text-gray-700 mb-2">
                      Charge Details (per km or per trip)
                    </label>
                    <textarea
                      id="transportCharges.pickupChargeDetails"
                      name="transportCharges.pickupChargeDetails"
                      value={formData.transportCharges.pickupChargeDetails}
                      onChange={handleInputChange}
                      placeholder="e.g., ₹10 per km or ₹500 per trip"
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="transportArrangedBy" className="block text-sm font-medium text-gray-700 mb-2">
                    Transport Arranged By
                  </label>
                  <select
                    id="transportArrangedBy"
                    name="transportArrangedBy"
                    value={formData.transportArrangedBy}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  >
                    <option value="">Select...</option>
                    <option value="mukkadam">Mukkadam</option>
                    <option value="bi">BI (Business Intelligence / Company)</option>
                  </select>
                </div>
              </div>
            </section>

            {/* 7. Payment Details */}
            <section className="space-y-6">
              <div className="border-b-2 border-pink-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">8</span>
                  Payment Details / पेमेंट तपशील
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Payment Mode(s) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {[
                      { name: 'cash', label: 'Cash' },
                      { name: 'upi', label: 'UPI' },
                      { name: 'bank', label: 'Bank Account Transfer' },
                    ].map((mode) => (
                      <label key={mode.name} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          name={`paymentDetails.modes.${mode.name}`}
                          checked={formData.paymentDetails.modes[mode.name as keyof typeof formData.paymentDetails.modes]}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500 rounded"
                        />
                        <span className="ml-3 text-gray-700">{mode.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.paymentModes && (
                    <p className="mt-2 text-sm text-red-600">{errors.paymentModes}</p>
                  )}
                </div>

                {/* Conditional UPI Field */}
                {formData.paymentDetails.modes.upi && (
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <label htmlFor="paymentDetails.upiId" className="block text-sm font-medium text-gray-700 mb-2">
                      UPI ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="paymentDetails.upiId"
                      name="paymentDetails.upiId"
                      value={formData.paymentDetails.upiId}
                      onChange={handleInputChange}
                      placeholder="e.g., yourname@paytm"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition ${
                        errors['paymentDetails.upiId'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['paymentDetails.upiId'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['paymentDetails.upiId']}</p>
                    )}
                  </div>
                )}

                {/* Conditional Bank Account Fields */}
                {formData.paymentDetails.modes.bank && (
                  <div className="bg-pink-50 p-4 rounded-lg space-y-4">
                    <h3 className="font-medium text-gray-800">Bank Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="paymentDetails.accountNumber" className="block text-sm font-medium text-gray-700 mb-2">
                          Account Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="paymentDetails.accountNumber"
                          name="paymentDetails.accountNumber"
                          value={formData.paymentDetails.accountNumber}
                          onChange={handleInputChange}
                          placeholder="Enter account number"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition ${
                            errors['paymentDetails.accountNumber'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors['paymentDetails.accountNumber'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['paymentDetails.accountNumber']}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="paymentDetails.ifscCode" className="block text-sm font-medium text-gray-700 mb-2">
                          IFSC Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="paymentDetails.ifscCode"
                          name="paymentDetails.ifscCode"
                          value={formData.paymentDetails.ifscCode}
                          onChange={handleInputChange}
                          placeholder="e.g., SBIN0001234"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition ${
                            errors['paymentDetails.ifscCode'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors['paymentDetails.ifscCode'] && (
                          <p className="mt-1 text-sm text-red-600">{errors['paymentDetails.ifscCode']}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="paymentDetails.bankNameBranch" className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name & Branch
                        </label>
                        <input
                          type="text"
                          id="paymentDetails.bankNameBranch"
                          name="paymentDetails.bankNameBranch"
                          value={formData.paymentDetails.bankNameBranch}
                          onChange={handleInputChange}
                          placeholder="e.g., State Bank of India, Nashik Branch"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="border-b-2 border-teal-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">9</span>
                  Work Mode / कामाची पद्धत
                </h2>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mode of Work <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'daily_up_down', label: 'Daily Up-Down (return home daily)' },
                    { value: 'move_in', label: 'Move-in for 1–2 months' },
                    { value: 'both', label: 'Both available depending on work' },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                      <input
                        type="radio"
                        name="workMode"
                        value={option.value}
                        checked={formData.workMode === option.value}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-3 text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.workMode && (
                  <p className="mt-2 text-sm text-red-600">{errors.workMode}</p>
                )}

                {/* Conditional field for move-in */}
                {(formData.workMode === 'move_in' || formData.workMode === 'both') && (
                  <div className="bg-teal-50 p-4 rounded-lg mt-4">
                    <label htmlFor="moveInPreferredRegion" className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Region for Move-in Work
                    </label>
                    <input
                      type="text"
                      id="moveInPreferredRegion"
                      name="moveInPreferredRegion"
                      value={formData.moveInPreferredRegion}
                      onChange={handleInputChange}
                      placeholder="e.g., Nashik District, Satara District"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                    />
                  </div>
                )}
              </div>
            </section>
{/* 8. Work Mode */}
            <section className="space-y-6">
              <div className="border-b-2 border-teal-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">10</span>
                  Reffral Section
                </h2>
              </div>
<div className="md:col-span-2">
                  <label htmlFor="rateCard.otherWorkRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Reffral Name 
                  </label>
                  <textarea
                    id="rateCard.otherWorkRate"
                    name="rateCard.otherWorkRate"
                    value={formData.rateCard.otherWorkRate}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  />
<div className="md:col-span-2">
                  <label htmlFor="rateCard.otherWorkRate" className="block text-sm font-medium text-gray-700 mb-2">
                    Reffral Number
                  </label>
                  <textarea
                    id="rateCard.otherWorkRate"
                    name="rateCard.otherWorkRate"
                    value={formData.rateCard.otherWorkRate}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                  />
                </div>

                </div>
               {/* 7. Payment Details */}
            <section className="space-y-6">
              <div className="border-b-2 border-pink-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">7</span>
                  Notified On 
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preferred Communication Mode(s) <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-3">
                    {[
                      { name: 'cash', label: 'Whatsapp' },
                      { name: 'upi', label: 'Call' },
                      { name: 'bank', label: 'SMS' },
                    ].map((mode) => (
                      <label key={mode.name} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          name={`paymentDetails.modes.${mode.name}`}
                          checked={formData.paymentDetails.modes[mode.name as keyof typeof formData.paymentDetails.modes]}
                          onChange={handleCheckboxChange}
                          className="w-4 h-4 text-pink-600 focus:ring-pink-500 rounded"
                        />
                        <span className="ml-3 text-gray-700">{mode.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.paymentModes && (
                    <p className="mt-2 text-sm text-red-600">{errors.paymentModes}</p>
                  )}
                </div>

                {/* Conditional UPI Field
                {formData.paymentDetails.modes.upi && (
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <label htmlFor="paymentDetails.upiId" className="block text-sm font-medium text-gray-700 mb-2">
                      Whatsapp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="paymentDetails.upiId"
                      name="paymentDetails.upiId"
                      value={formData.paymentDetails.upiId}
                      onChange={handleInputChange}
                      placeholder="e.g., yourname@paytm"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition ${
                        errors['paymentDetails.upiId'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors['paymentDetails.upiId'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['paymentDetails.upiId']}</p>
                    )}
                  </div>
                )} */}

                
              </div>
            </section>
            </section>
            {/* 9. Other Operational Info */}
            <section className="space-y-6">
              <div className="border-b-2 border-orange-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-orange-100 text-orange-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">11</span>
                  Other Operational Info / इतर माहिती
                </h2>
              </div>

              <div>
                <label htmlFor="otherCommitments" className="block text-sm font-medium text-gray-700 mb-2">
                  Any Other Commitments / Not Available Dates
                </label>
                <textarea
                  id="otherCommitments"
                  name="otherCommitments"
                  value={formData.otherCommitments}
                  onChange={handleInputChange}
                  placeholder="Mention any periods when you won't be available, festivals, personal commitments, etc..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
              >
                Submit Form / फॉर्म सबमिट करा
              </button>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          <p>WorkCrop - Agricultural Labor Management Platform</p>
        </div>
      </div>
    </div>
  );
};

export default MukkadamForm;
// import React, { useState, ChangeEvent, FormEvent } from "react";

// type TransportMode = "bike" | "pickup" | "none";

// export default function MukkadamForm(): JSX.Element {
//   const [form, setForm] = useState({
//     // 1. Basic Details
//     name: "",
//     mobiles: "",
//     residence: "",
//     hasSmartphone: "yes",

//     // 2. Crew Details
//     crewSize: "",
//     maxCrewCapacity: "",
//     splittingLogic: "",
//     deputyMukkadam: "",

//     // 3. Availability
//     startDate: "",
//     endDate: "",
//     dailyWorkTiming: "",

//     // 4. Rate Card
//     rate_failFoot: "",
//     rate_secondFail: "",
//     rate_dipping: "",
//     rate_thinning: "",
//     rate_shootTying: "",
//     rate_caneTying: "",
//     rate_shendaStop: "",
//     rate_other: "",

//     // 5. Work Area Preference
//     homeLocation: "",
//     nearbyLocations: "",
//     maxDistanceKm: "",

//     // 6. Transport Details
//     transportMode: "none" as TransportMode,
//     bikeChargePerBikeAfterKm: "",
//     bikeBeyondKm: "",
//     pickupChargeDetails: "",
//     transportArrangedBy: "mukkadam",

//     // 7. Payment Details
//     pay_cash: false,
//     pay_upi: false,
//     pay_bank: false,
//     upiId: "",
//     bankAccountNumber: "",
//     bankIfsc: "",
//     bankNameBranch: "",

//     // 8. Work Mode
//     workMode: "daily",
//     preferredRegionForMoveIn: "",

//     // 9. Other Operational Info
//     otherCommitments: "",
//   });

//   const handleChange = (
//     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target as HTMLInputElement;
//     if (type === "checkbox") {
//       setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
//     } else {
//       setForm((prev) => ({ ...prev, [name]: value }));
//     }
//   };

//   const handleSubmit = (e: FormEvent) => {
//     e.preventDefault();

//     // Basic validation example
//     if (!form.name.trim()) {
//       alert("Please enter the Mukkadam's name.");
//       return;
//     }
//     if (!form.mobiles.trim()) {
//       alert("Please enter at least one mobile number.");
//       return;
//     }

//     // Build a cleaned object with proper types
//     const payload = {
//       ...form,
//       crewSize: form.crewSize ? Number(form.crewSize) : undefined,
//       maxCrewCapacity: form.maxCrewCapacity ? Number(form.maxCrewCapacity) : undefined,
//       maxDistanceKm: form.maxDistanceKm ? Number(form.maxDistanceKm) : undefined,
//       bikeChargePerBikeAfterKm: form.bikeChargePerBikeAfterKm ? Number(form.bikeChargePerBikeAfterKm) : undefined,
//       bikeBeyondKm: form.bikeBeyondKm ? Number(form.bikeBeyondKm) : undefined,
//       // rate card numbers
//       rate_failFoot: form.rate_failFoot ? Number(form.rate_failFoot) : undefined,
//       rate_secondFail: form.rate_secondFail ? Number(form.rate_secondFail) : undefined,
//       rate_dipping: form.rate_dipping ? Number(form.rate_dipping) : undefined,
//       rate_thinning: form.rate_thinning ? Number(form.rate_thinning) : undefined,
//       rate_shootTying: form.rate_shootTying ? Number(form.rate_shootTying) : undefined,
//       rate_caneTying: form.rate_caneTying ? Number(form.rate_caneTying) : undefined,
//       rate_shendaStop: form.rate_shendaStop ? Number(form.rate_shendaStop) : undefined,
//       rate_other: form.rate_other ? Number(form.rate_other) : undefined,
//     } as const;

//     console.log("Mukkadam Form Submitted:", payload);
//     alert("Form data logged to console. (No API submission configured.)");
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 px-4 py-8">
//       <div className="max-w-4xl mx-auto">
//         <div className="bg-white shadow-md rounded-2xl p-6">
//           <h1 className="text-2xl font-semibold mb-2">Mukkadam Information Collection Form</h1>
//           <p className="text-sm text-gray-500 mb-6">Fill details below — all inputs are controlled. Submit will console.log the collected data.</p>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* 1. Basic Details */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">1. Basic Details</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium">Name of Mukkadam *</label>
//                   <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Ram Singh" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Mobile Number(s) *</label>
//                   <input name="mobiles" value={form.mobiles} onChange={handleChange} required placeholder="Primary mobile, alternate (comma separated)" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Village / Residence Location</label>
//                   <input name="residence" value={form.residence} onChange={handleChange} placeholder="Village or town" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Smartphone Availability</label>
//                   <div className="mt-1 flex gap-4 items-center">
//                     <label className="inline-flex items-center">
//                       <input type="radio" name="hasSmartphone" value="yes" checked={form.hasSmartphone === "yes"} onChange={handleChange} />
//                       <span className="ml-2">Yes</span>
//                     </label>
//                     <label className="inline-flex items-center">
//                       <input type="radio" name="hasSmartphone" value="no" checked={form.hasSmartphone === "no"} onChange={handleChange} />
//                       <span className="ml-2">No</span>
//                     </label>
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* 2. Crew Details */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">2. Crew Details</h2>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium">Crew Size (Number)</label>
//                   <input name="crewSize" value={form.crewSize} onChange={handleChange} type="number" min={0} placeholder="e.g. 8" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Maximum crew capacity</label>
//                   <input name="maxCrewCapacity" value={form.maxCrewCapacity} onChange={handleChange} type="number" min={0} placeholder="e.g. 15" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Deputy-Mukkadam name (if any)</label>
//                   <input name="deputyMukkadam" value={form.deputyMukkadam} onChange={handleChange} placeholder="Name of deputy" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div className="md:col-span-3">
//                   <label className="block text-sm font-medium">If crew &gt; 12 — Splitting logic / deployment plan</label>
//                   <textarea name="splittingLogic" value={form.splittingLogic} onChange={handleChange} placeholder="Explain how you split and deploy teams" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={3} />
//                 </div>
//               </div>
//             </section>

//             {/* 3. Availability */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">3. Availability</h2>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium">Start Date of Availability</label>
//                   <input name="startDate" value={form.startDate} onChange={handleChange} type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">End Date of Availability</label>
//                   <input name="endDate" value={form.endDate} onChange={handleChange} type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Daily Work Timing</label>
//                   <input name="dailyWorkTiming" value={form.dailyWorkTiming} onChange={handleChange} placeholder="e.g. 8:30 AM - 5:30 PM" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>
//               </div>
//             </section>

//             {/* 4. Rate Card */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">4. Rate Card (Activity-wise charges)</h2>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 {[
//                   ["rate_failFoot", "Fail Foot"],
//                   ["rate_secondFail", "Second Fail"],
//                   ["rate_dipping", "Dipping"],
//                   ["rate_thinning", "Thinning"],
//                   ["rate_shootTying", "Shoot Tying"],
//                   ["rate_caneTying", "Cane Tying"],
//                   ["rate_shendaStop", "Shenda Stop (Shoot Stop)"],
//                 ].map(([key, label]) => (
//                   <div key={key}>
//                     <label className="block text-sm font-medium">{label}</label>
//                     <div className="mt-1 relative">
//                       <span className="absolute left-3 top-2 text-sm">₹</span>
//                       <input name={String(key)} value={(form as any)[key]} onChange={handleChange} type="number" min={0} placeholder="0" className="pl-8 block w-full rounded-md border-gray-300 shadow-sm" />
//                     </div>
//                   </div>
//                 ))}

//                 <div className="md:col-span-3">
//                   <label className="block text-sm font-medium">Any other work rate</label>
//                   <input name="rate_other" value={form.rate_other} onChange={handleChange} type="number" min={0} placeholder="₹ amount (optional)" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>
//               </div>
//             </section>

//             {/* 5. Work Area Preference */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">5. Work Area Preference</h2>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium">Home Location</label>
//                   <input name="homeLocation" value={form.homeLocation} onChange={handleChange} placeholder="Home village / town" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Nearby Preferred Work Locations / Villages</label>
//                   <input name="nearbyLocations" value={form.nearbyLocations} onChange={handleChange} placeholder="Comma separated villages" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Maximum distance they can travel (km)</label>
//                   <input name="maxDistanceKm" value={form.maxDistanceKm} onChange={handleChange} type="number" min={0} placeholder="e.g. 20" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 </div>
//               </div>
//             </section>

//             {/* 6. Transport Details */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">6. Transport Details</h2>
//               <div className="space-y-3">
//                 <div>
//                   <label className="block text-sm font-medium">Mode of Transport for Team</label>
//                   <div className="mt-2 flex gap-6">
//                     <label className="inline-flex items-center">
//                       <input type="radio" name="transportMode" value="bike" checked={form.transportMode === "bike"} onChange={handleChange} />
//                       <span className="ml-2">Own bike</span>
//                     </label>
//                     <label className="inline-flex items-center">
//                       <input type="radio" name="transportMode" value="pickup" checked={form.transportMode === "pickup"} onChange={handleChange} />
//                       <span className="ml-2">Own pickup</span>
//                     </label>
//                     <label className="inline-flex items-center">
//                       <input type="radio" name="transportMode" value="none" checked={form.transportMode === "none"} onChange={handleChange} />
//                       <span className="ml-2">No vehicle (needs pickup arrangement)</span>
//                     </label>
//                   </div>
//                 </div>

//                 {form.transportMode === "bike" && (
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium">If bike: ₹ per bike (beyond km)</label>
//                       <div className="flex gap-2 mt-1">
//                         <input name="bikeChargePerBikeAfterKm" value={form.bikeChargePerBikeAfterKm} onChange={handleChange} type="number" min={0} placeholder="₹ amount" className="pl-2 block w-full rounded-md border-gray-300 shadow-sm" />
//                         <input name="bikeBeyondKm" value={form.bikeBeyondKm} onChange={handleChange} type="number" min={0} placeholder="beyond km" className="pl-2 block w-full rounded-md border-gray-300 shadow-sm" />
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {form.transportMode === "pickup" && (
//                   <div>
//                     <label className="block text-sm font-medium">If pickup: charge details (per km or per trip)</label>
//                     <input name="pickupChargeDetails" value={form.pickupChargeDetails} onChange={handleChange} placeholder="₹ per km or per trip details" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                   </div>
//                 )}

//                 <div>
//                   <label className="block text-sm font-medium">Transport arranged by</label>
//                   <select name="transportArrangedBy" value={form.transportArrangedBy} onChange={handleChange} className="mt-1 block w-64 rounded-md border-gray-300 shadow-sm">
//                     <option value="mukkadam">Arranged by Mukkadam</option>
//                     <option value="bi">Arranged by BI</option>
//                   </select>
//                 </div>
//               </div>
//             </section>

//             {/* 7. Payment Details */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">7. Payment Details</h2>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
//                 <div className="md:col-span-3">
//                   <label className="block text-sm font-medium">Preferred Mode(s) of Payment</label>
//                   <div className="mt-2 flex gap-6">
//                     <label className="inline-flex items-center">
//                       <input type="checkbox" name="pay_cash" checked={form.pay_cash as boolean} onChange={handleChange} />
//                       <span className="ml-2">Cash</span>
//                     </label>

//                     <label className="inline-flex items-center">
//                       <input type="checkbox" name="pay_upi" checked={form.pay_upi as boolean} onChange={handleChange} />
//                       <span className="ml-2">UPI</span>
//                     </label>

//                     <label className="inline-flex items-center">
//                       <input type="checkbox" name="pay_bank" checked={form.pay_bank as boolean} onChange={handleChange} />
//                       <span className="ml-2">Bank Account</span>
//                     </label>
//                   </div>
//                 </div>

//                 {form.pay_upi && (
//                   <div>
//                     <label className="block text-sm font-medium">UPI ID</label>
//                     <input name="upiId" value={form.upiId} onChange={handleChange} placeholder="example@bank" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                   </div>
//                 )}

//                 {form.pay_bank && (
//                   <>
//                     <div>
//                       <label className="block text-sm font-medium">Account Number</label>
//                       <input name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} placeholder="Account number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">IFSC Code</label>
//                       <input name="bankIfsc" value={form.bankIfsc} onChange={handleChange} placeholder="IFSC" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium">Bank Name & Branch</label>
//                       <input name="bankNameBranch" value={form.bankNameBranch} onChange={handleChange} placeholder="Bank name and branch" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                     </div>
//                   </>
//                 )}
//               </div>
//             </section>

//             {/* 8. Work Mode */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">8. Work Mode</h2>
//               <div className="flex flex-col gap-3">
//                 <label className="inline-flex items-center">
//                   <input type="radio" name="workMode" value="daily" checked={form.workMode === "daily"} onChange={handleChange} />
//                   <span className="ml-2">Daily Up-Down</span>
//                 </label>

//                 <label className="inline-flex items-center">
//                   <input type="radio" name="workMode" value="movein" checked={form.workMode === "movein"} onChange={handleChange} />
//                   <span className="ml-2">Move-in for 1–2 months</span>
//                 </label>

//                 {form.workMode === "movein" && (
//                   <input name="preferredRegionForMoveIn" value={form.preferredRegionForMoveIn} onChange={handleChange} placeholder="Preferred region to move to" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
//                 )}

//                 <label className="inline-flex items-center">
//                   <input type="radio" name="workMode" value="both" checked={form.workMode === "both"} onChange={handleChange} />
//                   <span className="ml-2">Both available depending on work</span>
//                 </label>
//               </div>
//             </section>

//             {/* 9. Other Operational Info */}
//             <section className="border rounded-lg p-4">
//               <h2 className="font-medium mb-3">9. Other Operational Info</h2>
//               <div>
//                 <label className="block text-sm font-medium">Other commitments / Dates not available</label>
//                 <textarea name="otherCommitments" value={form.otherCommitments} onChange={handleChange} placeholder="If any, list dates or commitments" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows={3} />
//               </div>
//             </section>

//             <div className="flex justify-end">
//               <button type="submit" className="inline-flex items-center px-5 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">Submit</button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
