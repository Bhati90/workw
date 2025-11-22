// JobList.tsx - Main job list component with assignment modal

import React, { useState, useEffect } from 'react';
import { Job, Mukkadam, AssignmentFormData } from './types';
import { jobsApi, mukkadamsApi } from './api';
import AssignMukkadamModal from './AssignMukkadamModal';

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchJobs();
  }, [filterStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const data = await jobsApi.getJobs(params);
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClick = (job: Job) => {
    setSelectedJob(job);
    setShowAssignModal(true);
  };

  const handleAssignmentComplete = () => {
    setShowAssignModal(false);
    setSelectedJob(null);
    fetchJobs(); // Refresh the list
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
        
        {/* Filter Dropdown */}
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Jobs</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No jobs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
            >
              {/* Job Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(job.start_date)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                    job.status
                  )}`}
                >
                  {job.status}
                </span>
              </div>

              {/* Job Details */}
              <div className="space-y-2 mb-4">
                {job.farmer_name && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-24">Farmer:</span>
                    <span className="font-medium">{job.farmer_name}</span>
                  </div>
                )}
                
                {job.village && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-24">Location:</span>
                    <span className="font-medium">{job.village}</span>
                  </div>
                )}

                {job.plot_crop && (
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 w-24">Crop:</span>
                    <span className="font-medium">{job.plot_crop}</span>
                  </div>
                )}

                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-24">Workers:</span>
                  <span className="font-medium">
                    {job.total_assigned_workers} / {job.workers_required}
                  </span>
                  {job.is_fully_assigned && (
                    <span className="ml-2 text-green-600 text-xs">✓ Full</span>
                  )}
                </div>
              </div>

              {/* Assignments */}
              {job.assignments && job.assignments.length > 0 && (
                <div className="mb-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Assigned Mukkadams:
                  </p>
                  <div className="space-y-1">
                    {job.assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="text-xs bg-gray-50 p-2 rounded flex justify-between"
                      >
                        <span className="font-medium">
                          {assignment.mukkadam_details.mukkadam_name}
                        </span>
                        <span className="text-gray-600">
                          {assignment.workers_count} workers
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleAssignClick(job)}
                  disabled={job.is_fully_assigned}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    job.is_fully_assigned
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {job.is_fully_assigned ? 'Fully Assigned' : 'Assign Mukkadam'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedJob && (
        <AssignMukkadamModal
          job={selectedJob}
          onClose={() => setShowAssignModal(false)}
          onSuccess={handleAssignmentComplete}
        />
      )}
    </div>
  );
};

export default JobList;