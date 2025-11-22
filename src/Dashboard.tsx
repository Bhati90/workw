import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, List, Calendar, UserCog, LogOut } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Agent Dashboard</h1>
        <button onClick={logout} className="flex items-center text-red-600 font-medium">
          <LogOut size={20} className="mr-2" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <button onClick={() => navigate('/registration')} className="bg-green-500 text-white p-8 rounded-xl shadow-lg flex flex-col items-center hover:bg-green-600 transition">
          <UserPlus size={48} className="mb-4" />
          <span className="text-2xl font-bold">Registration</span>
        </button>

        <button onClick={() => navigate('/list')} className="bg-blue-500 text-white p-8 rounded-xl shadow-lg flex flex-col items-center hover:bg-blue-600 transition">
          <List size={48} className="mb-4" />
          <span className="text-2xl font-bold">Mukadam List</span>
        </button>

        <button onClick={() => navigate('/availability-update')} className="bg-purple-500 text-white p-8 rounded-xl shadow-lg flex flex-col items-center hover:bg-purple-600 transition">
          <Calendar size={48} className="mb-4" />
          <span className="text-2xl font-bold">Avail. Update</span>
        </button>

        <button onClick={() => navigate('/profile-search')} className="bg-orange-500 text-white p-8 rounded-xl shadow-lg flex flex-col items-center hover:bg-orange-600 transition">
          <UserCog size={48} className="mb-4" />
          <span className="text-2xl font-bold">Profile Update</span>
        </button>

        <button onClick={() => navigate('/job')} className="bg-orange-500 text-white p-8 rounded-xl shadow-lg flex flex-col items-center hover:bg-orange-600 transition">
          <UserCog size={48} className="mb-4" />
          <span className="text-2xl font-bold">Job-List</span>
        </button>

        <button onClick={() => navigate('/assign')} className="bg-orange-500 text-white p-8 rounded-xl shadow-lg flex flex-col items-center hover:bg-orange-600 transition">
          <UserCog size={48} className="mb-4" />
          <span className="text-2xl font-bold">Assin Mukadam</span>
        </button>
      </div>
    </div>
  );
};
export default Dashboard;