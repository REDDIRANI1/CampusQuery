"use client";

import { useState, useEffect } from 'react';
import { fetchAPI } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadStats = async () => {
    try {
      const data = await fetchAPI('/allocation/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRunAllocation = async () => {
    if (!confirm("Are you sure? This will lock registrations and run the allocation algorithm.")) return;
    
    setRunning(true);
    try {
      await fetchAPI('/allocation/run', { method: 'POST' });
      await loadStats();
      alert("Allocation completed successfully!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { type: 'user', text: query }]);
    setChatLoading(true);

    try {
      const data = await fetchAPI('/allocation/ask', {
        method: 'POST',
        body: JSON.stringify({ question: query })
      });
      setChatHistory(prev => [...prev, { type: 'ai', text: data.answer, sql: data.sql }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { type: 'ai', text: "Error: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <Link href="/admin/courses" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
          Manage Courses
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-2">Total Students</h3>
          <p className="text-4xl font-bold text-slate-900">{stats ? stats.total_students : '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-2">Allocated</h3>
          <p className="text-4xl font-bold text-green-600">{stats ? stats.allocated_students : '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-2">Rejected</h3>
          <p className="text-4xl font-bold text-red-600">{stats ? stats.rejected_students : '-'}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-slate-500 font-medium mb-2">Available Seats</h3>
          <p className="text-4xl font-bold text-blue-600">{stats ? stats.total_available_seats : '-'}</p>
        </div>
      </div>
      
      {/* Category Wise & Course Stats */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Category-wise Allocation</h2>
            <div className="flex gap-4">
               <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">General</p>
                  <p className="text-2xl font-bold">{stats.category_wise_allocation.General}</p>
               </div>
               <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">OBC</p>
                  <p className="text-2xl font-bold">{stats.category_wise_allocation.OBC}</p>
               </div>
               <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">SC</p>
                  <p className="text-2xl font-bold">{stats.category_wise_allocation.SC}</p>
               </div>
               <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">ST</p>
                  <p className="text-2xl font-bold">{stats.category_wise_allocation.ST}</p>
               </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-64">
             <h2 className="text-xl font-bold text-slate-900 mb-4">Course Statistics</h2>
             <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-2 font-medium">Course</th>
                    <th className="pb-2 font-medium text-right">Available</th>
                    <th className="pb-2 font-medium text-right">Rejections</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.course_statistics.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="py-3 text-right text-slate-600">{c.available_seats}</td>
                      <td className="py-3 text-right text-red-500">{c.rejections}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Allocation Control */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Run Allocation</h2>
          <p className="text-slate-600 text-sm mb-6">
            Executing the allocation algorithm will assign courses based on merit and category reservations. It will lock the system preventing new registrations.
          </p>
          <button 
            onClick={handleRunAllocation} 
            disabled={running}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm disabled:opacity-70 transition-colors"
          >
            {running ? 'Running Algorithm...' : 'Execute Allocation'}
          </button>
        </div>

        {/* AI Chat */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              Allocation AI Assistant
            </h2>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-400 mt-20">
                Ask me questions about the allocation results!
                <br/>(e.g., "How many SC students got into Computer Science?")
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                  {msg.sql && (
                    <div className="mt-3 p-2 bg-slate-800 rounded text-xs text-slate-300 font-mono overflow-x-auto">
                      {msg.sql}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-3 text-sm animate-pulse">
                  Analyzing database...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100">
            <form onSubmit={handleAskAI} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask a question..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:ring-2 focus:ring-purple-500 outline-none"
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
