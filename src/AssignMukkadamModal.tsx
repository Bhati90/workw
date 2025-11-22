// AssignMukkadamModal.tsx - Modal for assigning mukkadam to job

import React, { useState, useEffect } from 'react';
import { Job, Mukkadam, AssignmentFormData } from './types';
import { jobsApi, mukkadamsApi } from './api';

interface Props {
  job: Job;
  onClose: () => void;
  onSuccess: () => void;
}

const AssignMukkadamModal: React.FC<Props> = ({ job, onClose, onSuccess }) => {
  const [availableMukkadams, setAvailableMukkadams] = useState<Mukkadam[]>([]);
  const [allMukkadams, setAllMukkadams] = useState<Mukkadam[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const [formData, setFormData] = useState<AssignmentFormData>({
    mukkadam_id: 0,
    workers_count: 0,
    team_members: [],
    agreed_rate: undefined,
    notes: '',
  });

  const [selectedMukkadam, setSelectedMukkadam] = useState<Mukkadam | null>(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchMukkadams();
  }, [job.id]);

  const fetchMukkadams = async () => {
    try {
      setLoading(true);
      
      // Fetch available mukkadams for this job
      const available = await jobsApi.getAvailableMukkadams(job.id);
      setAvailableMukkadams(available);
      
      // Also fetch all mukkadams in case user wants to see all
      const all = await mukkadamsApi.getMukkadams();
      setAllMukkadams(all);
    } catch (error) {
      console.error('Error fetching mukkadams:', error);
    } finally {
      setLoading(false);
    }
  };

  const mukkadamsToShow = showAll ? allMukkadams : availableMukkadams;

  const handleMukkadamSelect = (mukkadam: Mukkadam) => {
    setSelectedMukkadam(mukkadam);
    setFormData({
      ...formData,
      mukkadam_id: mukkadam.id,
      workers_count: parseInt(mukkadam.crew_size) || 0,
    });
    setSelectedTeamMembers([]);
  };

  const handleTeamMemberToggle = (memberName: string) => {
    setSelectedTeamMembers((prev) => {
      if (prev.includes(memberName)) {
        return prev.filter((name) => name !== memberName);
      }
      return [...prev, memberName];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.mukkadam_id) {
      alert('Please select a mukkadam');
      return;
    }

    try {
      setSubmitting(true);
      
      const submitData: AssignmentFormData = {
        ...formData,
        team_members: selectedTeamMembers || [],

      };

      await jobsApi.assignMukkadam(job.id, submitData);
      
      alert('Mukkadam assigned successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error assigning mukkadam:', error);
      alert(error.response?.data?.error || 'Failed to assign mukkadam');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Assign Mukkadam</h2>
            <p className="text-blue-100 text-sm mt-1">{job.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Job Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-2">Job Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Workers Required:</span>
                    <span className="ml-2 font-medium">{job.workers_required}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Already Assigned:</span>
                    <span className="ml-2 font-medium">{job.total_assigned_workers}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Still Needed:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      {job.workers_required - job.total_assigned_workers}
                    </span>
                  </div>
                  {job.village && (
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{job.village}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggle Available/All */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Mukkadam</h3>
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showAll ? 'Show Available Only' : 'Show All Mukkadams'}
                </button>
              </div>

              {/* Mukkadam List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {mukkadamsToShow.map((mukkadam) => (
                  <div
                    key={mukkadam.id}
                    onClick={() => handleMukkadamSelect(mukkadam)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedMukkadam?.id === mukkadam.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {mukkadam.mukkadam_name}
                      </h4>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        {mukkadam.crew_size} workers
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">📍 {mukkadam.village}</p>
                    <p className="text-sm text-gray-600">📱 {mukkadam.mobile_numbers}</p>
                  </div>
                ))}

                {mukkadamsToShow.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No {showAll ? '' : 'available '}mukkadams found
                  </div>
                )}
              </div>

              {/* Selected Mukkadam Details */}
              {selectedMukkadam && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Assignment Details</h3>
                  
                  {/* Workers Count */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Workers to Assign
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedMukkadam.crew_size}
                      value={formData.workers_count}
                      onChange={(e) =>
                        setFormData({ ...formData, workers_count: parseInt(e.target.value) })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max available: {selectedMukkadam.crew_size}
                    </p>
                  </div>

                  {/* Team Members Selection */}
                  {selectedMukkadam.team_members &&
                    selectedMukkadam.team_members.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Team Members (Optional)
                        </label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          {selectedMukkadam.team_members.map((member, index) => (
                            <label
                              key={index}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selectedTeamMembers.includes(member.name)}
                                onChange={() => handleTeamMemberToggle(member.name)}
                                className="rounded text-blue-600"
                              />
                              <span>{member.name}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Selected: {selectedTeamMembers.length} members
                        </p>
                      </div>
                    )}

                  {/* Agreed Rate */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agreed Rate (₹ per worker/day) - Optional
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.agreed_rate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agreed_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="Enter agreed rate"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Any special instructions or notes..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedMukkadam || submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Assigning...' : 'Assign Mukkadam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignMukkadamModal;