import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { mapBackendToForm } from './utils/dataMapper';
import { 
  ArrowLeft,Network, Edit,Info, Phone, MapPin, Users, 
  Truck,Clock, CreditCard, FileText, Calendar, ExternalLink 
} from 'lucide-react';

const AdminProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://127.0.0.1:8000/api/mukkadam/${id}/`, {
      headers: { Authorization: `Token ${token}` }
    })
    .then(res => {
      // We keep raw data for images, mapped data for logic if needed
      // But for read-only, using response directly is often easier. 
      // Let's use the mapper to ensure consistency with our names.
      setData({ raw: res.data, mapped: mapBackendToForm(res.data) });
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      alert("Could not fetch profile.");
      navigate('/dashboard');
    });
  }, [id, navigate]);

  const getStatusColor = (status: string) => {
    if (status === 'Available') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'Busy') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'Leave') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading || !data) return <div className="p-10 text-center">Loading Profile Dashboard...</div>;

  const { mapped, raw } = data;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 1. Top Navigation Bar */}
        <div className="flex justify-between items-center">
            <button onClick={() => navigate('/profile-search')} className="flex items-center text-gray-600 hover:text-black">
                <ArrowLeft className="mr-2" size={20} /> Back to Search
            </button>
            <div className="space-x-3">
                <button 
                    onClick={() => navigate(`/availability-update`)} 
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition"
                >
                    <Calendar className="inline-block mr-2" size={18} /> Manage Availability
                </button>
                <button 
                    onClick={() => navigate(`/update-form/${id}`)} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow"
                >
                    <Edit className="inline-block mr-2" size={18} /> Edit Profile
                </button>
            </div>
        </div>

        {/* 2. Header Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            <div className="px-8 pb-6 flex flex-col md:flex-row items-start">
                {/* Profile Image */}
                <div className="-mt-16 relative">
                    {raw.profile_photo ? (
                        <img src={raw.profile_photo} className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white" alt="Profile" />
                    ) : (
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center text-4xl">👤</div>
                    )}
                </div>
                
                {/* Basic Info */}
                <div className="mt-4 md:mt-2 md:ml-6 flex-1">
                    <h1 className="text-3xl font-bold text-gray-900">{mapped.mukkadamName}</h1>
                    <div className="flex items-center text-gray-500 mt-1 space-x-4">
                        <span className="flex items-center"><MapPin size={16} className="mr-1"/> {mapped.village}</span>
                        <span className="flex items-center"><Phone size={16} className="mr-1"/> {mapped.mobileNumbers}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${mapped.hasSmartphone === 'yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Smartphone: {mapped.hasSmartphone.toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 md:mt-0 flex space-x-6 text-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Crew Size</p>
                        <p className="text-2xl font-bold text-blue-600">{mapped.crewSize}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Transport</p>
                        <p className="text-2xl font-bold text-orange-600">{mapped.transportMode === 'own_pickup' ? 'Pickup' : 'Bike'}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Operational Details */}
            <div className="space-y-6 lg:col-span-2">
                {/* --- NEW SECTION: LIVE AVAILABILITY --- */}
                {/* --- LIVE AVAILABILITY STATUS --- */}
                <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Clock className="mr-2 text-purple-500"/> Live Availability Status
                    </h3>
                    
                    {/* CASE 1: Complex Slots Exist */}
                    {mapped.teamAvailabilities && mapped.teamAvailabilities.length > 0 ? (
                        <div className="space-y-3">
                            {mapped.teamAvailabilities.map((slot: any, index: number) => (
                                <div key={index} className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between ${getStatusColor(slot.status || 'Available')}`}>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-lg">{slot.startDate}</span>
                                            <span className="text-gray-500">to</span>
                                            <span className="font-bold text-lg">{slot.endDate}</span>
                                        </div>
                                        <p className="text-sm mt-1 opacity-80">
                                            {slot.teamName || "Main Crew"} 
                                        </p>
                                    </div>
                                    <div className="mt-2 sm:mt-0">
                                        <span className="uppercase text-xs font-bold tracking-wider px-3 py-1 bg-white/60 rounded-full border">
                                            {slot.status || 'AVAILABLE'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : mapped.startDate ? (
                        // CASE 2: Fallback to Basic Dates (The fix for your issue)
                        <div className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between bg-green-50 text-green-800 border-green-200">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-lg">{mapped.startDate}</span>
                                    <span className="text-gray-500">to</span>
                                    <span className="font-bold text-lg">{mapped.endDate}</span>
                                </div>
                                <p className="text-sm mt-1 opacity-80">Main Crew (Basic Schedule)</p>
                            </div>
                            <span className="uppercase text-xs font-bold tracking-wider px-3 py-1 bg-white/60 rounded-full border">
                                AVAILABLE
                            </span>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-500">No specific availability schedule set.</p>
                        </div>
                    )}
                </div>
                {/* --- END NEW SECTION --- */}
                {/* Rate Card */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <CreditCard className="mr-2 text-blue-500"/> Rate Card
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(mapped.rateCard).map(([key, val]) => (
                            val && key !== 'otherWorkRate' && (
                                <div key={key} className="bg-gray-50 p-3 rounded border">
                                    <p className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                                    <p className="font-bold text-gray-800">₹ {val as string}</p>
                                </div>
                            )
                        ))}
                    </div>
                    {mapped.rateCard.otherWorkRate && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                            <span className="font-bold">Other Rates:</span> {mapped.rateCard.otherWorkRate}
                        </div>
                    )}
                </div>

                {/* Crew & Team Details */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Users className="mr-2 text-green-500"/> Crew & Team Structure
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-gray-500">Splitting Logic</p>
                            <p className="font-medium">{mapped.splittingLogic || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Deputy Mukkadam</p>
                            <p className="font-medium">{mapped.deputyMukkadamName || 'None'} <span className="text-gray-400 text-sm">{mapped.deputyMukkadamMobile}</span></p>
                        </div>
                    </div>

                    {/* Team List */}
                    {mapped.teamMembers.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-bold text-gray-600 mb-2">Registered Members</h4>
                            <div className="flex flex-wrap gap-2">
                                {mapped.teamMembers.map((m: any, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm border">
                                        {m.name} ({m.mobile})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* --- NEW SECTION: REFERRAL NETWORK --- */}
           {/* 1. Who referred THIS person? */}
                        <div className="p-3 bg-amber-50 rounded border border-amber-100">
                            <p className="text-xs text-gray-500 uppercase font-bold">Referred By</p>
                            
                            {mapped.referredByName ? (
                                // Case A: Referred by existing Mukadam
                                <div className="flex items-center mt-1 cursor-pointer hover:text-blue-600" 
                                     onClick={() => navigate(`/admin-view/${mapped.referredBy}`)}>
                                    <span className="text-lg font-bold text-gray-800 mr-2">{mapped.referredByName}</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">View Profile</span>
                                </div>
                            ) : mapped.referralSourceText ? (
                                // Case B: Text Entry (This fixes your "gourav" issue)
                                <p className="font-bold text-gray-800 text-lg mt-1">
                                    {mapped.referralSourceText}
                                </p>
                            ) : (
                                // Case C: Nothing
                                <p className="text-gray-400 italic mt-1">Direct Joining / No Referrer</p>
                            )}
                        </div>
            <div className="bg-white p-6 rounded-xl shadow border-l-4 border-gray-400">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Info className="mr-2 text-gray-500"/> Other Commitments / Notes
                    </h3>
                    <div className="bg-gray-50 p-4 rounded border">
                        {mapped.otherCommitments ? (
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {mapped.otherCommitments}
                            </p>
                        ) : (
                            <p className="text-gray-400 italic">
                                No other commitments or specific notes mentioned.
                            </p>
                        )}
                    </div>
                </div>

                {/* Transport & Logistics */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <Truck className="mr-2 text-red-500"/> Transport & Work Area
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <span className="block text-gray-500">Work Mode</span>
                            <span className="font-semibold capitalize">{mapped.workMode.replace('_', ' ')}</span>
                        </div>
                        <div>
                            <span className="block text-gray-500">Max Travel Distance</span>
                            <span className="font-semibold">{mapped.maxTravelDistance} km</span>
                        </div>
                        <div className="md:col-span-2">
                             <span className="block text-gray-500">Preferred Locations</span>
                             <span className="font-semibold">{mapped.preferredWorkLocations}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Documents & ID */}
            <div className="space-y-6">
                
                {/* ID Cards Widget */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <FileText className="mr-2 text-indigo-500"/> ID Proofs
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded border">
                            <p className="text-xs text-gray-500">Aadhar Number</p>
                            <p className="font-mono font-bold text-lg tracking-widest">{mapped.aadharNumber || 'Not Added'}</p>
                            {raw.aadhar_card && (
                                <a href={raw.aadhar_card} target="_blank" rel="noreferrer" className="text-blue-600 text-xs flex items-center mt-1 hover:underline">
                                    <ExternalLink size={10} className="mr-1"/> View Document
                                </a>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50 rounded border">
                            <p className="text-xs text-gray-500">PAN Number</p>
                            <p className="font-mono font-bold text-lg">{mapped.panNumber || 'Not Added'}</p>
                            {raw.pan_card && (
                                <a href={raw.pan_card} target="_blank" rel="noreferrer" className="text-blue-600 text-xs flex items-center mt-1 hover:underline">
                                    <ExternalLink size={10} className="mr-1"/> View Document
                                </a>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50 rounded border">
                            <p className="text-xs text-gray-500">Bank Details</p>
                            {mapped.paymentDetails.modes.bank ? (
                                <>
                                    <p className="font-bold text-sm">{mapped.paymentDetails.bankNameBranch}</p>
                                    <p className="font-mono text-sm">AC: {mapped.paymentDetails.accountNumber}</p>
                                    <p className="font-mono text-sm">IFSC: {mapped.paymentDetails.ifscCode}</p>
                                </>
                            ) : <p className="text-sm italic text-gray-400">Bank transfer not enabled</p>}
                            
                            {raw.bank_proof && (
                                <a href={raw.bank_proof} target="_blank" rel="noreferrer" className="text-blue-600 text-xs flex items-center mt-2 hover:underline">
                                    <ExternalLink size={10} className="mr-1"/> View Passbook
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Modes */}
                <div className="bg-white p-6 rounded-xl shadow">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Modes</h3>
                    <div className="flex flex-wrap gap-2">
                        {mapped.paymentDetails.modes.cash && <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">CASH</span>}
                        {mapped.paymentDetails.modes.upi && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">UPI: {mapped.paymentDetails.upiId}</span>}
                        {mapped.paymentDetails.modes.bank && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">BANK</span>}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdminProfileView;