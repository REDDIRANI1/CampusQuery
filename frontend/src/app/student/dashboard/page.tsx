"use client";

import { useState } from 'react';
import { fetchAPI } from '@/lib/api';

interface Preference {
  course_id: string;
  priority: number;
}

interface StudentData {
  id: string;
  student_id_str: string;
  name: string;
  marks: number;
  category: string;
  allocation_status: string;
  allocated_course_id?: string | null;
  allocated_quota?: string | null;
  preferences: Preference[];
}

export default function StudentDashboard() {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<StudentData | null>(null);
  const [courses, setCourses] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAPI('/courses/')
      .then(data => {
        const courseMap: Record<string, string> = {};
        data.forEach((c: any) => {
          courseMap[c.id] = c.name;
        });
        setCourses(courseMap);
      })
      .catch(err => console.error("Failed to load courses:", err));
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await fetchAPI(`/students/${studentId}/allocation`);
      setStudent(data);
    } catch (err) {
      setError((err as Error).message || 'Student not found');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Student Dashboard</h1>
        <p className="mt-2 text-slate-500">Check your allocation status and manage preferences.</p>
      </div>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <form onSubmit={handleLookup} className="flex gap-4">
          <input
            type="text"
            required
            placeholder="Enter your Student UUID"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-70">
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}
      </div>

      {student && (
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
              <p className="text-slate-500">ID: {student.student_id_str} • Category: {student.category} • Marks: {student.marks}%</p>
            </div>
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
              student.allocation_status === 'Allocated' ? 'bg-green-100 text-green-800' :
              student.allocation_status === 'Rejected' ? 'bg-red-100 text-red-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {student.allocation_status}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Allocation</h3>
            {student.allocation_status === 'Allocated' ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  You have been allocated to <strong>{student.allocated_course_id ? courses[student.allocated_course_id] || student.allocated_course_id : 'Unknown Course'}</strong> under the <strong>{student.allocated_quota}</strong> quota.
                </p>
              </div>
            ) : student.allocation_status === 'Rejected' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Unfortunately, you were not allocated to any of your preferred courses due to high cutoff marks.</p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                Allocation has not been run yet. You can still update your preferences.
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Preferences</h3>
            <ul className="space-y-3">
              {student.preferences.map((p: Preference) => (
                <li key={p.course_id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                  <span className="font-medium text-slate-700">Priority {p.priority}</span>
                  <span className="text-slate-500 text-sm font-medium">{courses[p.course_id] || p.course_id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
