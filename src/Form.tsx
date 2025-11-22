import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Upload,Search, FileText, CheckCircle,Hash } from 'lucide-react';
import { mapFormToBackend, mapBackendToForm } from './utils/dataMapper';

// --- Interfaces (Matches your original structure) ---
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
  currentlyStationedAt: string;
  freeFromDate: string;
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

interface TeamMember {
  name: string;
  mobile: string;
}

interface TeamAvailability {
  teamNumber: string;
  startDate: string;
  endDate: string;
}

interface NotificationPreferences {
  whatsapp: boolean;
  sms: boolean;
  call: boolean;
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
  deputyMukkadamMobile: string;
  
  // Team Members
  teamMembers: TeamMember[];
  
  // Availability
  startDate: string;
  endDate: string;
  dailyWorkTiming: string;
  teamAvailabilities: TeamAvailability[];
  
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
  
  // Referral
  referralSource: string;
  
  // Notification Preferences
  notificationPreferences: NotificationPreferences;
  aadharNumber: string;
  panNumber: string;
  referredBy: string;
  referralSourceText: string;
  // Other Info
  otherCommitments: string;
}

// New Interface for Document Previews
interface DocumentPreviews {
  profile_photo: string;
  aadhar_card: string;
  pan_card: string;
  bank_proof: string;
}

const MukkadamForm: React.FC = () => {
  const { id } = useParams(); // Detect if we are in Edit Mode
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [existingMukkadams, setExistingMukkadams] = useState<any[]>([]);
  const [referralSearch, setReferralSearch] = useState(''); // For filtering the dropdown

  // --- 1. Main Form State ---
  const [formData, setFormData] = useState<FormData>({
    mukkadamName: '',
    mobileNumbers: '',
    village: '',
    hasSmartphone: '',
    crewSize: '',
    maxCrewCapacity: '',
    splittingLogic: '',
    deputyMukkadamName: '',
    deputyMukkadamMobile: '',
    teamMembers: [],
    startDate: '',
    endDate: '',
    dailyWorkTiming: '',
    teamAvailabilities: [],
    rateCard: {
      failFoot: '', secondFail: '', dipping: '', thinning: '', shootTying: '', caneTying: '', shendaStop: '', otherWorkRate: '',
    },
    homeLocation: '',
    preferredWorkLocations: '',
    maxTravelDistance: '',
    transportMode: '',
    transportCharges: {
      bikeChargePerBike: '', bikeBeyondKm: '', pickupChargeDetails: '', currentlyStationedAt: '', freeFromDate: '',
    },
    transportArrangedBy: '',
    paymentDetails: {
      modes: { cash: false, upi: false, bank: false },
      upiId: '', accountNumber: '', ifscCode: '', bankNameBranch: '',
    },
    workMode: '',
    aadharNumber: '',
    panNumber: '',
    moveInPreferredRegion: '',
    referralSource: '',
    referredBy: '',
    referralSourceText: '',
    notificationPreferences: { whatsapp: false, sms: false, call: false },
    otherCommitments: '',
  });

  // --- 2. File State (For uploading) ---
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    profile_photo: null,
    aadhar_card: null,
    pan_card: null,
    bank_proof: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://127.0.0.1:8000/api/mukkadam/dropdown_list/', {
        headers: { Authorization: `Token ${token}` }
    }).then(res => setExistingMukkadams(res.data));
  }, []);

  // Filter the list based on search typing
  const filteredReferrals = existingMukkadams.filter(m => 
     m.mukkadam_name.toLowerCase().includes(referralSearch.toLowerCase()) || 
     m.mobile_numbers.includes(referralSearch)
  );

  // --- 3. Preview State (For showing images) ---
  const [previews, setPreviews] = useState<DocumentPreviews>({
    profile_photo: '',
    aadhar_card: '',
    pan_card: '',
    bank_proof: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // --- 4. Effect: Fetch Data if Edit Mode ---
  useEffect(() => {
    if (isEditMode) {
      const token = localStorage.getItem('token');
      if (!token) {
          navigate('/login');
          return;
      }

      setLoading(true);
      axios.get(`http://127.0.0.1:8000/api/mukkadam/${id}/`, {
        headers: { Authorization: `Token ${token}` }
      })
      .then(res => {
        // Convert Backend Snake_Case to Frontend CamelCase
        const mappedData = mapBackendToForm(res.data);
        setFormData(mappedData);

        // Set existing image previews (if they exist on server)
        setPreviews({
            profile_photo: res.data.profile_photo || '',
            aadhar_card: res.data.aadhar_card || '',
            pan_card: res.data.pan_card || '',
            bank_proof: res.data.bank_proof || ''
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load profile data.");
        navigate('/dashboard');
      });
    }
  }, [id, isEditMode, navigate]);


  // --- 5. Handlers ---

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.startsWith('rateCard.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, rateCard: { ...prev.rateCard, [field]: value } }));
    } else if (name.startsWith('transportCharges.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, transportCharges: { ...prev.transportCharges, [field]: value } }));
    } else if (name.startsWith('paymentDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, paymentDetails: { ...prev.paymentDetails, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const mode = name.split('.')[2] as 'cash' | 'upi' | 'bank';
    setFormData(prev => ({ ...prev, paymentDetails: { ...prev.paymentDetails, modes: { ...prev.paymentDetails.modes, [mode]: checked } } }));
  };

  const handleNotificationChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const preference = name.split('.')[1] as 'whatsapp' | 'sms' | 'call';
    setFormData(prev => ({ ...prev, notificationPreferences: { ...prev.notificationPreferences, [preference]: checked } }));
  };

  // Array Manipulations
  const addTeamMember = () => setFormData(prev => ({ ...prev, teamMembers: [...prev.teamMembers, { name: '', mobile: '' }] }));
  const removeTeamMember = (index: number) => setFormData(prev => ({ ...prev, teamMembers: prev.teamMembers.filter((_, i) => i !== index) }));
  const updateTeamMember = (index: number, field: 'name' | 'mobile', value: string) => {
    setFormData(prev => ({ ...prev, teamMembers: prev.teamMembers.map((member, i) => i === index ? { ...member, [field]: value } : member) }));
  };

  const addTeamAvailability = () => setFormData(prev => ({ ...prev, teamAvailabilities: [...prev.teamAvailabilities, { teamNumber: '', startDate: '', endDate: '' }] }));
  const removeTeamAvailability = (index: number) => setFormData(prev => ({ ...prev, teamAvailabilities: prev.teamAvailabilities.filter((_, i) => i !== index) }));
  const updateTeamAvailability = (index: number, field: 'teamNumber' | 'startDate' | 'endDate', value: string) => {
    setFormData(prev => ({ ...prev, teamAvailabilities: prev.teamAvailabilities.map((availability, i) => i === index ? { ...availability, [field]: value } : availability) }));
  };

  // File Handler
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: keyof DocumentPreviews) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({ ...prev, [fieldName]: file }));
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, [fieldName]: objectUrl }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.mukkadamName.trim()) newErrors.mukkadamName = 'Mukkadam name is required';
    if (!formData.mobileNumbers.trim()) newErrors.mobileNumbers = 'Mobile number is required';
    if (!formData.village.trim()) newErrors.village = 'Village is required';
    if (!formData.hasSmartphone) newErrors.hasSmartphone = 'Required';
    if (!formData.crewSize) newErrors.crewSize = 'Required';
    if (!formData.transportMode) newErrors.transportMode = 'Required';
    if (!formData.workMode) newErrors.workMode = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- 6. Submit Logic ---
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
        alert('Please fix errors before submitting.');
        return;
    }

    setLoading(true);
    const payload = new FormData();
    
    // 1. Map to Backend format
    const backendJson = mapFormToBackend(formData);
    payload.append('data', JSON.stringify(backendJson));

    // 2. Append Files (Only if new ones selected)
    if (files.profile_photo) payload.append('profile_photo', files.profile_photo);
    if (files.aadhar_card) payload.append('aadhar_card', files.aadhar_card);
    if (files.pan_card) payload.append('pan_card', files.pan_card);
    if (files.bank_proof) payload.append('bank_proof', files.bank_proof);

    try {
      const token = localStorage.getItem('token');
      const url = isEditMode 
        ? `http://127.0.0.1:8000/api/mukkadam/${id}/` 
        : 'http://127.0.0.1:8000/api/mukkadam/';
      
      const method = isEditMode ? 'patch' : 'post';

      await axios({
        method,
        url,
        data: payload,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert(isEditMode ? 'Profile Updated Successfully!' : 'Registration Successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Submission Error:', error);
      alert('Operation failed. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode && !formData.mukkadamName) {
      return <div className="min-h-screen flex items-center justify-center">Loading Profile Data...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation Back */}
        <button 
            onClick={() => navigate(isEditMode ? '/profile-search' : '/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition"
        >
            <ArrowLeft className="mr-2" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-8 sm:px-8">
            <h1 className="text-3xl font-bold text-white text-center">
              {isEditMode ? 'Edit Mukkadam Profile' : 'मुक्कादम माहिती संकलन फॉर्म'}
            </h1>
            <p className="text-green-50 text-center mt-2 text-lg">
              {isEditMode ? 'Update Information & Documents' : 'New Mukkadam Information Collection Form'}
            </p>
          </div>

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
                    name="mukkadamName"
                    value={formData.mukkadamName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${errors.mukkadamName ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label htmlFor="mobileNumbers" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number(s) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mobileNumbers"
                    value={formData.mobileNumbers}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${errors.mobileNumbers ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                    Village / Residence Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="village"
                    value={formData.village}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${errors.village ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Smartphone Availability <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input type="radio" name="hasSmartphone" value="yes" checked={formData.hasSmartphone === 'yes'} onChange={handleInputChange} className="w-4 h-4 text-green-600" />
                      <span className="ml-2 text-gray-700">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="hasSmartphone" value="no" checked={formData.hasSmartphone === 'no'} onChange={handleInputChange} className="w-4 h-4 text-green-600" />
                      <span className="ml-2 text-gray-700">No</span>
                    </label>
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Crew Size <span className="text-red-500">*</span></label>
                  <input type="number" name="crewSize" value={formData.crewSize} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Crew Capacity</label>
                  <input type="number" name="maxCrewCapacity" value={formData.maxCrewCapacity} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Splitting Logic</label>
                  <textarea name="splittingLogic" value={formData.splittingLogic} onChange={handleInputChange} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deputy Mukkadam Name</label>
                  <input type="text" name="deputyMukkadamName" value={formData.deputyMukkadamName} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500" />
                </div>
                {formData.deputyMukkadamName && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deputy Mobile</label>
                    <input type="text" name="deputyMukkadamMobile" value={formData.deputyMukkadamMobile} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500" />
                  </div>
                )}
              </div>
            </section>

            {/* 2a. Team Members */}
            <section className="space-y-6">
              <div className="border-b-2 border-cyan-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-cyan-100 text-cyan-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">2a</span>
                  Team Members
                </h2>
              </div>
              <div className="space-y-4">
                {formData.teamMembers.map((member, index) => (
                  <div key={index} className="bg-cyan-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    <button type="button" onClick={() => removeTeamMember(index)} className="absolute top-2 right-2 text-red-600 text-sm font-bold">Remove</button>
                    <input type="text" value={member.name} onChange={(e) => updateTeamMember(index, 'name', e.target.value)} placeholder="Name" className="w-full px-4 py-2 border rounded-lg" />
                    <input type="text" value={member.mobile} onChange={(e) => updateTeamMember(index, 'mobile', e.target.value)} placeholder="Mobile" className="w-full px-4 py-2 border rounded-lg" />
                  </div>
                ))}
                <button type="button" onClick={addTeamMember} className="w-full py-3 border-2 border-dashed border-cyan-300 text-cyan-700 rounded-lg hover:bg-cyan-50">+ Add Team Member</button>
              </div>
            </section>

            {/* 3. Availability */}
           {!isEditMode && ( <section className="space-y-6">
              <div className="border-b-2 border-purple-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-purple-100 text-purple-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">3</span>
                  Availability
                </h2>
              </div>
              {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="block text-sm font-medium mb-2">Start Date</label>
                   <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-purple-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-2">End Date</label>
                   <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-purple-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium mb-2">Daily Timing</label>
                   <input type="text" name="dailyWorkTiming" value={formData.dailyWorkTiming} onChange={handleInputChange} placeholder="7 AM - 5 PM" className="w-full px-4 py-2.5 border rounded-lg focus:ring-purple-500" />
                </div>
              </div> */}
              
              {/* Team Availability Sub-section */}
              {/* <div className="border-t pt-4">
                 <h3 className="font-medium text-gray-800 mb-3">Specific Team Availability</h3> */}
                 {formData.teamAvailabilities.map((avail, idx) => (
                     <div key={idx} className="bg-purple-50 p-3 rounded mb-3 grid md:grid-cols-3 gap-3 relative">
                         <button type="button" onClick={() => removeTeamAvailability(idx)} className="absolute top-1 right-2 text-red-500 text-xs">Remove</button>
                         {/* <input type="text" value={avail.teamNumber} onChange={e => updateTeamAvailability(idx, 'teamNumber', e.target.value)} placeholder="Team Name" className="border p-2 rounded"/> */}
                         <input type="date" value={avail.startDate} onChange={e => updateTeamAvailability(idx, 'startDate', e.target.value)} className="border p-2 rounded"/>
                         <input type="date" value={avail.endDate} onChange={e => updateTeamAvailability(idx, 'endDate', e.target.value)} className="border p-2 rounded"/>
                     </div>
                 ))}
                 <button type="button" onClick={addTeamAvailability} className="text-sm text-purple-700 font-medium">+ Add Team Availability</button>
              {/* </div> */}
            </section>)}


            {/* 4. Rate Card */}
            <section className="space-y-6">
              <div className="border-b-2 border-yellow-200 pb-2">
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <span className="bg-yellow-100 text-yellow-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">4</span>
                  Rate Card (₹)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {['failFoot', 'secondFail', 'dipping', 'thinning', 'shootTying', 'caneTying', 'shendaStop'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                    <input type="number" name={`rateCard.${field}`} value={formData.rateCard[field as keyof RateCard]} onChange={handleInputChange} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-yellow-500" />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Work Rate</label>
                  <textarea name="rateCard.otherWorkRate" value={formData.rateCard.otherWorkRate} onChange={handleInputChange} rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-yellow-500" />
                </div>
              </div>
            </section>

            {/* 5. Work Area */}
            <section className="space-y-6">
               <div className="border-b-2 border-indigo-200 pb-2">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">5</span>
                    Work Area
                  </h2>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="block text-sm font-medium mb-2">Home Location</label>
                     <input type="text" name="homeLocation" value={formData.homeLocation} onChange={handleInputChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-indigo-500"/>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-2">Max Travel Distance (km)</label>
                     <input type="number" name="maxTravelDistance" value={formData.maxTravelDistance} onChange={handleInputChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-indigo-500"/>
                  </div>
                  <div className="md:col-span-2">
                     <label className="block text-sm font-medium mb-2">Preferred Villages</label>
                     <textarea name="preferredWorkLocations" value={formData.preferredWorkLocations} onChange={handleInputChange} className="w-full px-4 py-2.5 border rounded-lg focus:ring-indigo-500"/>
                  </div>
               </div>
            </section>

            {/* 6. Transport Details */}
            <section className="space-y-6">
               <div className="border-b-2 border-red-200 pb-2">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <span className="bg-red-100 text-red-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">6</span>
                    Transport
                  </h2>
               </div>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium mb-2">Mode <span className="text-red-500">*</span></label>
                     <div className="flex flex-col space-y-2">
                        {['own_bike', 'own_pickup', 'no_vehicle'].map(val => (
                            <label key={val} className="flex items-center">
                                <input type="radio" name="transportMode" value={val} checked={formData.transportMode === val} onChange={handleInputChange} className="mr-2 text-red-600"/>
                                <span className="capitalize">{val.replace('_', ' ')}</span>
                            </label>
                        ))}
                     </div>
                  </div>
                  {formData.transportMode === 'own_bike' && (
                      <div className="bg-red-50 p-4 rounded grid md:grid-cols-2 gap-4">
                          <input type="number" name="transportCharges.bikeChargePerBike" value={formData.transportCharges.bikeChargePerBike} onChange={handleInputChange} placeholder="Charge per Bike" className="border p-2 rounded"/>
                          <input type="number" name="transportCharges.bikeBeyondKm" value={formData.transportCharges.bikeBeyondKm} onChange={handleInputChange} placeholder="Beyond KM" className="border p-2 rounded"/>
                      </div>
                  )}
                  {formData.transportMode === 'own_pickup' && (
                      <div className="bg-red-50 p-4 rounded">
                          <input type="text" name="transportCharges.pickupChargeDetails" value={formData.transportCharges.pickupChargeDetails} onChange={handleInputChange} placeholder="Pickup Charge Details" className="w-full border p-2 rounded"/>
                      </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                      <input type="text" name="transportCharges.currentlyStationedAt" value={formData.transportCharges.currentlyStationedAt} onChange={handleInputChange} placeholder="Currently Stationed At" className="border p-2 rounded w-full"/>
                      <input type="date" name="transportCharges.freeFromDate" value={formData.transportCharges.freeFromDate} onChange={handleInputChange} className="border p-2 rounded w-full"/>
                  </div>
               </div>
            </section>

            {/* 7. Payment Details */}
            <section className="space-y-6">
               <div className="border-b-2 border-pink-200 pb-2">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <span className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">7</span>
                    Payment
                  </h2>
               </div>
               <div className="space-y-4">
                   <div className="flex space-x-4">
                       {['cash', 'upi', 'bank'].map(mode => (
                           <label key={mode} className="flex items-center">
                               <input type="checkbox" name={`paymentDetails.modes.${mode}`} checked={formData.paymentDetails.modes[mode as keyof typeof formData.paymentDetails.modes]} onChange={handleCheckboxChange} className="mr-2 text-pink-600"/>
                               <span className="capitalize">{mode}</span>
                           </label>
                       ))}
                   </div>
                   {formData.paymentDetails.modes.upi && (
                       <input type="text" name="paymentDetails.upiId" value={formData.paymentDetails.upiId} onChange={handleInputChange} placeholder="UPI ID" className="w-full border p-2 rounded focus:ring-pink-500"/>
                   )}
                   {formData.paymentDetails.modes.bank && (
                       <div className="bg-pink-50 p-4 rounded grid md:grid-cols-2 gap-4">
                           <input type="text" name="paymentDetails.accountNumber" value={formData.paymentDetails.accountNumber} onChange={handleInputChange} placeholder="Account No" className="border p-2 rounded"/>
                           <input type="text" name="paymentDetails.ifscCode" value={formData.paymentDetails.ifscCode} onChange={handleInputChange} placeholder="IFSC" className="border p-2 rounded"/>
                           <input type="text" name="paymentDetails.bankNameBranch" value={formData.paymentDetails.bankNameBranch} onChange={handleInputChange} placeholder="Bank Name & Branch" className="md:col-span-2 border p-2 rounded"/>
                       </div>
                   )}
               </div>
            </section>

            {/* 8. Work Mode */}
            <section className="space-y-6">
               <div className="border-b-2 border-teal-200 pb-2">
                  <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                    <span className="bg-teal-100 text-teal-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">8</span>
                    Work Mode
                  </h2>
               </div>
               <div className="space-y-2">
                   {['daily_up_down', 'move_in', 'both'].map(val => (
                       <label key={val} className="flex items-center p-2 border rounded hover:bg-teal-50 cursor-pointer">
                           <input type="radio" name="workMode" value={val} checked={formData.workMode === val} onChange={handleInputChange} className="mr-3 text-teal-600"/>
                           <span className="capitalize">{val.replace(/_/g, ' ')}</span>
                       </label>
                   ))}
                   {(formData.workMode === 'move_in' || formData.workMode === 'both') && (
                       <input type="text" name="moveInPreferredRegion" value={formData.moveInPreferredRegion} onChange={handleInputChange} placeholder="Preferred Move-in Region" className="w-full border p-2 rounded mt-2"/>
                   )}
               </div>
            </section>

            {/* 9, 10, 11 — Short Sections */}
<section className="space-y-8">
{!isEditMode && (
 
  <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
    <div className="border-b-2 border-amber-200 pb-2 mb-4">
      <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
        <span className="bg-amber-100 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
          9
        </span>
        Referral / संदर्भ
      </h2>
    </div>

    <div className="grid md:grid-cols-2 gap-6">

      {/* Dropdown with Search */}
      <div className="bg-amber-50 p-4 rounded border border-amber-200">
        <label className="block font-bold text-gray-700 mb-2">
          Referred By (Existing Mukkadam)
        </label>

        {/* Search Box */}
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Name or Mobile..."
            className="w-full pl-10 p-2 border rounded text-sm"
            onChange={(e) => setReferralSearch(e.target.value)}
          />
        </div>

        {/* Dropdown */}
        <select
          name="referredBy"
          value={formData.referredBy || ""}
          onChange={handleInputChange}
          className="w-full p-3 border rounded bg-white"
        >
          <option value="">-- Select Referrer --</option>
          <option value="">No one / Direct Joining</option>

          {filteredReferrals.map((m) =>
            m.id !== parseInt(id || "0") ? (
              <option key={m.id} value={m.id}>
                {m.mukkadam_name} ({m.mobile_numbers}) - {m.village}
              </option>
            ) : null
          )}
        </select>
      </div>

      {/* Other Source Text */}
      <div>
        <label className="block font-medium mb-2">
          Other Source (if not in list)
        </label>
        <input
          type="text"
          name="referralSourceText"
          value={formData.referralSourceText}
          onChange={handleInputChange}
          placeholder="e.g. Newspaper, Friend Name"
          className="w-full p-3 border rounded"
        />
      </div>
    </div>
  </div>)}

  {/* Section 10 — Notifications */}
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <label className="block font-medium mb-2 text-lg flex items-center">
      <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
        10
      </span>
      Notifications
    </label>

    <div className="flex space-x-6 mt-3">
      {["whatsapp", "sms", "call"].map((pref) => (
        <label key={pref} className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            name={`notificationPreferences.${pref}`}
            checked={
              formData.notificationPreferences[
                pref as keyof NotificationPreferences
              ]
            }
            onChange={handleNotificationChange}
            className="mr-2"
          />
          <span className="capitalize">{pref}</span>
        </label>
      ))}
    </div>
  </div>

  {/* Section 11 — Other Commitments */}
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <label className="block font-medium mb-2 text-lg flex items-center">
      <span className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
        11
      </span>
      Other Commitments
    </label>

    <textarea
      name="otherCommitments"
      value={formData.otherCommitments}
      onChange={handleInputChange}
      rows={3}
      className="w-full border p-3 rounded"
    />
  </div>

</section>


            <section className="border-t-4 border-gray-100 pt-6">
               <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                 12. Documents & ID <span className="text-sm font-normal text-gray-500 ml-2">(Optional / Alternative)</span>
               </h3>

               <div className="grid md:grid-cols-2 gap-8">
                 
                 {/* Aadhar Card Block */}
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center"><FileText size={18} className="mr-2"/> Aadhar Details</h4>
                    
                    {/* Option 1: Text Input */}
                    <div className="mb-4">
                       <label className="text-sm text-gray-500 block mb-1">Aadhar Number (Text)</label>
                       <div className="relative">
                         <Hash size={16} className="absolute left-3 top-3 text-gray-400"/>
                         <input 
                           type="text" 
                           name="aadharNumber" 
                           value={formData.aadharNumber} 
                           onChange={handleInputChange}
                           placeholder="Enter 12-digit number" 
                           className="w-full pl-10 p-2 border rounded bg-white"
                         />
                       </div>
                    </div>

                    <div className="text-center text-gray-400 text-sm mb-2">- OR -</div>

                    {/* Option 2: File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded p-3 bg-white">
                       <label className="text-sm text-gray-500 block mb-2">Upload Photo</label>
                       {previews.aadhar_card && (
                          <img src={previews.aadhar_card} className="h-16 object-contain mb-2 mx-auto" alt="Preview"/>
                       )}
                       <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhar_card')} className="text-xs w-full"/>
                    </div>
                 </div>

                 {/* PAN Card Block */}
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3 flex items-center"><FileText size={18} className="mr-2"/> PAN Details</h4>
                    
                    <div className="mb-4">
                       <label className="text-sm text-gray-500 block mb-1">PAN Number (Text)</label>
                       <div className="relative">
                         <Hash size={16} className="absolute left-3 top-3 text-gray-400"/>
                         <input 
                           type="text" 
                           name="panNumber" 
                           value={formData.panNumber} 
                           onChange={handleInputChange}
                           placeholder="Enter PAN Number" 
                           className="w-full pl-10 p-2 border rounded bg-white"
                         />
                       </div>
                    </div>

                    <div className="text-center text-gray-400 text-sm mb-2">- OR -</div>

                    <div className="border-2 border-dashed border-gray-300 rounded p-3 bg-white">
                       <label className="text-sm text-gray-500 block mb-2">Upload Photo</label>
                       {previews.pan_card && (
                          <img src={previews.pan_card} className="h-16 object-contain mb-2 mx-auto" alt="Preview"/>
                       )}
                       <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'pan_card')} className="text-xs w-full"/>
                    </div>
                 </div>

                 {/* Profile Photo (Still file preferred) */}
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3">Profile Photo</h4>
                    <div className="flex items-center gap-4">
                       {previews.profile_photo ? (
                          <img src={previews.profile_photo} className="h-20 w-20 rounded-full object-cover border-2 border-white shadow" alt="Profile"/>
                       ) : (
                          <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">Img</div>
                       )}
                       <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'profile_photo')} className="text-sm"/>
                    </div>
                 </div>

                 {/* Bank Proof (File) */}
                 <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3">Bank Proof</h4>
                    <p className="text-xs text-gray-500 mb-2">Upload Passbook/Cheque if available</p>
                    {previews.bank_proof && <img src={previews.bank_proof} className="h-16 object-contain mb-2" alt="Bank"/>}
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'bank_proof')} className="text-sm"/>
                 </div>

               </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.01] shadow-lg ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'
                }`}
              >
                {loading ? (
                    'Processing...'
                ) : (
                    <>
                       <CheckCircle className="mr-2" /> 
                       {isEditMode ? 'Update Mukkadam Profile / माहिती अपडेट करा' : 'Submit Registration / नोंदणी करा'}
                    </>
                )}
              </button>
            </div>

          </form>
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
