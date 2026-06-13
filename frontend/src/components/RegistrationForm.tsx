"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';

interface Course {
  id: string;
  name: string;
  total_seats: number;
}

export default function RegistrationForm() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentIdStr, setStudentIdStr] = useState('');
  const [name, setName] = useState('');
  const [marks, setMarks] = useState('');
  const [category, setCategory] = useState('General');
  
  const [pref1, setPref1] = useState('');
  const [pref2, setPref2] = useState('');
  const [pref3, setPref3] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUuid, setCreatedUuid] = useState('');

  useEffect(() => {
    fetchAPI('/courses/')
      .then(data => setCourses(data))
      .catch(err => console.error("Failed to load courses:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (new Set([pref1, pref2, pref3]).size !== 3) {
      setError("Please select three distinct courses for your preferences.");
      setLoading(false);
      return;
    }

    const payload = {
      student_id_str: studentIdStr,
      name,
      marks: parseFloat(marks),
      category,
      preferences: [
        { course_id: pref1, priority: 1 },
        { course_id: pref2, priority: 2 },
        { course_id: pref3, priority: 3 },
      ]
    };

    try {
      const resp = await fetchAPI('/students/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccess(true);
      setCreatedUuid(resp.id);
      // Reset form
      setStudentIdStr('');
      setName('');
      setMarks('');
      setCategory('General');
      setPref1('');
      setPref2('');
      setPref3('');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Student Registration</h2>
      
      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          <p className="font-bold text-lg mb-2">Registration successful!</p>
          <p>Your application has been recorded.</p>
          <div className="mt-4 p-3 bg-white rounded border border-green-100">
            <p className="text-sm text-slate-500 mb-1">Your Dashboard Login UUID (Save this!):</p>
            <p className="font-mono text-lg font-bold text-slate-900 select-all">{createdUuid}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
            <input type="text" required value={studentIdStr} onChange={e => setStudentIdStr(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Marks (%)</label>
            <input type="number" step="0.1" min="0" max="100" required value={marks} onChange={e => setMarks(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select required value={category} onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow">
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preference 1</label>
              <select required value={pref1} onChange={e => setPref1(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow">
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preference 2</label>
              <select required value={pref2} onChange={e => setPref2(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow">
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preference 3</label>
              <select required value={pref3} onChange={e => setPref3(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow">
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-70">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
