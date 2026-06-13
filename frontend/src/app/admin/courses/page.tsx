"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  general_seats: number;
  obc_seats: number;
  sc_seats: number;
  st_seats: number;
  total_seats: number;
  rejection_count: number;
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [name, setName] = useState('');
  const [genSeats, setGenSeats] = useState(0);
  const [obcSeats, setObcSeats] = useState(0);
  const [scSeats, setScSeats] = useState(0);
  const [stSeats, setStSeats] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadCourses = async () => {
    try {
      const data = await fetchAPI('/courses/');
      setCourses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchAPI('/courses/', {
        method: 'POST',
        body: JSON.stringify({
          name,
          general_seats: genSeats,
          obc_seats: obcSeats,
          sc_seats: scSeats,
          st_seats: stSeats
        })
      });
      loadCourses();
      setName('');
      setGenSeats(0);
      setObcSeats(0);
      setScSeats(0);
      setStSeats(0);
    } catch (err) {
      console.error(err);
      alert("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Courses</h1>
        <Link href="/admin" className="text-blue-600 hover:text-blue-800 font-medium">
          &larr; Back to Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Add New Course</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Course Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">General Seats</label>
                <input type="number" required min="0" value={genSeats} onChange={e => setGenSeats(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">OBC Seats</label>
                <input type="number" required min="0" value={obcSeats} onChange={e => setObcSeats(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">SC Seats</label>
                <input type="number" required min="0" value={scSeats} onChange={e => setScSeats(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">ST Seats</label>
                <input type="number" required min="0" value={stSeats} onChange={e => setStSeats(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Seats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quotas (Gen/OBC/SC/ST)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rejections</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {courses.map(course => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{course.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{course.total_seats}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {course.general_seats} / {course.obc_seats} / {course.sc_seats} / {course.st_seats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{course.rejection_count}</td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No courses created yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
