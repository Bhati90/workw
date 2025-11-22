import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Scissors, User, Phone, Calendar, Save } from 'lucide-react';

// --- Interfaces ---
interface AvailabilitySlot {
  id: string;
  teamName: string;
  status: 'Available' | 'Busy' | 'Leave';
  startDate: string;
  endDate: string;
  leaderName?: string;
  leaderMobile?: string;
}

interface MukadamBasic {
  id: number;
  mukkadam_name: string;
  village: string;
  start_date?: string;
  end_date?: string;
  team_availabilities: any[]; // Use any here to handle incoming legacy data safely
}

const AdvancedAvailability = () => {
  const navigate = useNavigate();
  const [mukadams, setMukadams] = useState<MukadamBasic[]>([]);
  const [selectedMukadam, setSelectedMukadam] = useState<MukadamBasic | null>(null);
  
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [mode, setMode] = useState<'view' | 'add' | 'split'>('view');
  const [form, setForm] = useState<AvailabilitySlot>({
    id: '',
    teamName: 'Main Crew',
    status: 'Available',
    startDate: '',
    endDate: '',
    leaderName: '',
    leaderMobile: ''
  });
  
  const [splitTargetId, setSplitTargetId] = useState<string | null>(null);

  // --- 1. Fetch Data ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://127.0.0.1:8000/api/mukkadam/', {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setMukadams(res.data));
  }, []);

  // --- 2. Helper: Handle Selection (FIXED LOGIC HERE) ---
  const handleSelect = (id: string) => {
    const m = mukadams.find(x => x.id === parseInt(id));
    if (m) {
      setSelectedMukadam(m);
      
      // Normalize incoming data:
      // 1. If 'status' is missing, default to 'Available'
      // 2. If 'teamName' is missing but 'teamNumber' exists, use that
      let existingSlots: AvailabilitySlot[] = (m.team_availabilities || []).map((s: any, i: number) => ({
        ...s,
        id: s.id || `${Date.now()}-${i}`,
        status: s.status || 'Available', // <--- FORCE GREEN IF MISSING
        teamName: s.teamName || s.teamNumber || 'Main Crew' // <--- Fix legacy names
      }));

      // If list is empty but basic dates exist, create a default slot
      if (existingSlots.length === 0 && m.start_date && m.end_date) {
          existingSlots = [{
              id: 'default-auto',
              teamName: 'Main Crew',
              status: 'Available',
              startDate: m.start_date,
              endDate: m.end_date,
              leaderName: m.mukkadam_name,
              leaderMobile: ''
          }];
      }

      setSlots(existingSlots);
      setMode('view');
    }
  };

  // --- 3. Add New Slot ---
  const handleAdd = () => {
    const newSlot = { ...form, id: Date.now().toString() };
    setSlots([...slots, newSlot]);
    setMode('view');
    resetForm();
  };

  // --- 4. Split Algorithm ---
  const handleSplit = () => {
    if (!splitTargetId) return;
    
    const targetIndex = slots.findIndex(s => s.id === splitTargetId);
    if (targetIndex === -1) return;

    const original = slots[targetIndex];
    const leaveStart = new Date(form.startDate);
    const leaveEnd = new Date(form.endDate);
    const originalStart = new Date(original.startDate);
    const originalEnd = new Date(original.endDate);

    if (leaveStart < originalStart || leaveEnd > originalEnd) {
      alert("Leave dates must be INSIDE the current availability range.");
      return;
    }

    const newSlots: AvailabilitySlot[] = [];

    // Before Slice
    if (leaveStart > originalStart) {
      const beforeEnd = new Date(leaveStart);
      beforeEnd.setDate(beforeEnd.getDate() - 1);
      newSlots.push({
        ...original,
        id: Date.now() + '-1',
        endDate: beforeEnd.toISOString().split('T')[0]
      });
    }

    // Leave Slice
    newSlots.push({
      ...original,
      id: Date.now() + '-2',
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
    });

    // After Slice
    if (leaveEnd < originalEnd) {
      const afterStart = new Date(leaveEnd);
      afterStart.setDate(afterStart.getDate() + 1);
      newSlots.push({
        ...original,
        id: Date.now() + '-3',
        startDate: afterStart.toISOString().split('T')[0]
      });
    }

    const updatedList = [...slots];
    updatedList.splice(targetIndex, 1, ...newSlots);
    
    setSlots(updatedList);
    setMode('view');
    resetForm();
  };

  const resetForm = () => {
    setForm({
      id: '', teamName: 'Main Crew', status: 'Available', 
      startDate: '', endDate: '', leaderName: '', leaderMobile: ''
    });
    setSplitTargetId(null);
  };

  // --- 5. Save Changes ---
  const saveChanges = async () => {
    if (!selectedMukadam) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://127.0.0.1:8000/api/mukkadam/${selectedMukadam.id}/`, 
        { data: JSON.stringify({ team_availabilities: slots }) },
        { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } }
      );
      alert('Availability Updated Successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save changes.');
    }
  };

  // --- Render Helpers (UPDATED COLOR LOGIC) ---
  const getStatusColor = (status?: string) => {
    // Default to Available (Green) if status is undefined or 'Available'
    if (!status || status === 'Available') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'Busy') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Only yellow if specifically 'Leave'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 mb-6">
          <ArrowLeft size={20} className="mr-2"/> Back
        </button>

        <h1 className="text-2xl font-bold mb-6 text-blue-800">Advanced Availability Manager</h1>

        {/* 1. Select Mukadam */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <label className="block mb-2 font-bold text-gray-700">Select Mukkadam</label>
          <select 
            className="w-full p-3 border rounded-lg"
            onChange={(e) => handleSelect(e.target.value)}
          >
            <option value="">-- Select --</option>
            {mukadams.map(m => (
              <option key={m.id} value={m.id}>{m.mukkadam_name} ({m.village})</option>
            ))}
          </select>
        </div>

        {selectedMukadam && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            
            {/* 2. Timeline View */}
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">Current Schedule</h2>
               <button 
                 onClick={() => { setMode('add'); resetForm(); }}
                 className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
               >
                 <Plus size={16} className="mr-2"/> Add New
               </button>
            </div>

            <div className="space-y-3 mb-8">
              {slots.length === 0 && <p className="text-gray-500 italic">No availability records found.</p>}
              
              {slots.map((slot) => (
                <div key={slot.id} className={`p-4 rounded-lg border-l-4 flex justify-between items-center ${getStatusColor(slot.status)}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{slot.startDate}</span>
                      <span className="text-gray-500">to</span>
                      <span className="font-bold text-lg">{slot.endDate}</span>
                    </div>
                    <div className="text-sm mt-1 flex gap-4">
                      <span className="font-semibold">{slot.teamName}</span>
                      <span className="uppercase text-xs tracking-wide px-2 py-0.5 rounded bg-white/50 border">
                        {slot.status || 'Available'}
                      </span>
                    </div>
                    {slot.leaderName && (
                       <div className="text-xs mt-1 text-gray-600 flex gap-3">
                         <span className="flex items-center"><User size={10} className="mr-1"/> {slot.leaderName}</span>
                         <span className="flex items-center"><Phone size={10} className="mr-1"/> {slot.leaderMobile}</span>
                       </div>
                    )}
                  </div>

                  {/* Only allow splitting if it's Available */}
                  {(slot.status === 'Available' || !slot.status) && (
                    <button 
                      onClick={() => { setSplitTargetId(slot.id); setMode('split'); setForm({...form, status: 'Leave'}); }}
                      className="flex items-center text-sm bg-white border border-gray-300 px-3 py-2 rounded hover:bg-gray-50 text-gray-700"
                    >
                      <Scissors size={14} className="mr-2"/> Report Leave
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 3. Action Forms */}
            {(mode === 'add' || mode === 'split') && (
              <div className="bg-gray-50 border border-blue-200 p-5 rounded-xl mb-6 animate-fade-in">
                <h3 className="font-bold text-lg mb-4 text-blue-800">
                  {mode === 'add' ? 'Add New Availability' : 'Report Leave / Split Availability'}
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">From Date</label>
                    <input type="date" className="w-full p-2 border rounded" 
                      value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">To Date</label>
                    <input type="date" className="w-full p-2 border rounded" 
                      value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Status</label>
                    <select className="w-full p-2 border rounded" 
                      value={form.status} 
                      onChange={e => setForm({...form, status: e.target.value as any})}>
                      <option value="Available">Available</option>
                      <option value="Busy">Busy (Working elsewhere)</option>
                      <option value="Leave">On Leave</option>
                    </select>
                  </div>

                  {mode === 'add' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Team Name</label>
                      <input type="text" className="w-full p-2 border rounded" 
                        value={form.teamName} onChange={e => setForm({...form, teamName: e.target.value})} 
                        placeholder="e.g. Main Crew or Team B" />
                    </div>
                  )}
                </div>

                {/* Leader Info */}
                {mode === 'add' && form.teamName.toLowerCase() !== 'main crew' && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-xs text-orange-800 font-bold mb-2">Sub-Team Leader Details Required</p>
                    <div className="grid md:grid-cols-2 gap-4">
                       <input type="text" placeholder="Leader Name" className="w-full p-2 border rounded"
                         value={form.leaderName} onChange={e => setForm({...form, leaderName: e.target.value})} />
                       <input type="text" placeholder="Leader Mobile" className="w-full p-2 border rounded"
                         value={form.leaderMobile} onChange={e => setForm({...form, leaderMobile: e.target.value})} />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => setMode('view')} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                  <button 
                    onClick={mode === 'add' ? handleAdd : handleSplit}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700"
                  >
                    {mode === 'add' ? 'Add to List' : 'Apply'}
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={saveChanges}
              className="w-full py-4 bg-green-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-green-700 flex justify-center items-center"
            >
              <Save className="mr-2" /> Save All Changes
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAvailability;