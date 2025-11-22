import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const MukkadamList = () => {
  const [list, setList] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://127.0.0.1:8000/api/mukkadam/', {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setList(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 mb-6">
          <ArrowLeft size={20} className="mr-2"/> Back
        </button>
        <h1 className="text-3xl font-bold mb-6 text-blue-800">Registered Mukkadams</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">👤</div>
                  <div className="ml-4">
                    <h3 className="font-bold text-gray-800">{item.mukkadam_name}</h3>
                    <p className="text-gray-500 text-sm">{item.village}</p>
                  </div>
                </div>
                <div className="border-t pt-4 text-sm space-y-2">
                  <p><span className="font-semibold">Crew Size:</span> {item.crew_size}</p>
                  <p><span className="font-semibold">Availability:</span> {item.start_date || 'Not set'}</p>
                  <p className="text-green-600 font-medium mt-2">Active</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default MukkadamList;