"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';

interface Dataset {
  id: string;
  filename: string;
  dynamic_table_name: string;
  row_count: number;
}

interface QueryRecord {
  id: string;
  natural_language_query: string;
  generated_sql: string;
}

interface ChatItem {
  type: 'user' | 'ai';
  text?: string;
  insight?: string;
  sql?: string;
  results?: Record<string, unknown>[];
  error?: string;
}

export default function SQLAssistantPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryRecord[]>([]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadDatasets = useCallback(async () => {
    try {
      const data = await fetchAPI('/datasets/');
      setDatasets(data);
      if (data.length > 0 && !activeDataset) {
        setActiveDataset(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }, [activeDataset]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const loadHistory = useCallback(async (id: string) => {
    try {
      const data = await fetchAPI(`/datasets/${id}/queries`);
      setQueryHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  }, []);

  useEffect(() => {
    if (activeDataset) {
      loadHistory(activeDataset);
    } else {
      setQueryHistory([]);
    }
  }, [activeDataset, loadHistory]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/datasets/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }
      
      const newDataset = await response.json();
      setActiveDataset(newDataset.id);
      await loadDatasets();
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset input
    }
  };

  const handleDeleteDataset = async (e: React.MouseEvent, datasetId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this dataset? This will drop the table and delete all query history.")) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/datasets/${datasetId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete dataset');
      }
      
      if (activeDataset === datasetId) {
        setActiveDataset(null);
      }
      await loadDatasets();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeDataset) return;

    const query = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { type: 'user', text: query }]);
    setChatLoading(true);

    try {
      const data = await fetchAPI(`/datasets/${activeDataset}/query`, {
        method: 'POST',
        body: JSON.stringify({ question: query })
      });
      
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        insight: data.insight, 
        sql: data.sql,
        results: data.results,
        error: data.error
      }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { type: 'ai', error: "Error: " + (err as Error).message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const exportCSV = (results: Record<string, unknown>[]) => {
    if (!results || results.length === 0) return;
    const keys = Object.keys(results[0]);
    const csvContent = [
      keys.join(","),
      ...results.map(row => keys.map(k => JSON.stringify(row[k] ?? "")).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">AI SQL Assistant</h1>
        <p className="text-slate-500">Upload CSV/Excel datasets and query them using natural language.</p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Sidebar: Datasets & History */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Upload Dataset</h2>
            <label className="flex justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-400 focus:outline-none">
                <span className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    <span className="font-medium text-slate-600">
                        {uploading ? 'Uploading...' : 'Drop files or Click'}
                    </span>
                </span>
                <input type="file" name="file_upload" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={uploading} />
            </label>
            {uploadError && <p className="mt-2 text-xs text-red-600">{uploadError}</p>}
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex flex-col max-h-64">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Datasets</h2>
            <div className="space-y-2 overflow-y-auto flex-1">
              {datasets.map(ds => (
                <div key={ds.id} className="relative group mb-2">
                  <button 
                    onClick={() => setActiveDataset(ds.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${activeDataset === ds.id ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'}`}
                  >
                    <p className="font-medium truncate pr-8">{ds.filename}</p>
                    <p className="text-xs text-slate-500">{ds.row_count} rows</p>
                  </button>
                  <button
                    onClick={(e) => handleDeleteDataset(e, ds.id)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete Dataset"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              ))}
              {datasets.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No datasets uploaded yet.</p>}
            </div>
          </div>
          
          {/* Query History */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex-1 min-h-0 flex flex-col">
             <h2 className="text-lg font-bold text-slate-900 mb-4">Query History</h2>
             <div className="space-y-3 overflow-y-auto flex-1">
               {queryHistory.map(q => (
                  <div key={q.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700">
                     <p className="font-medium mb-1">&quot;{q.natural_language_query}&quot;</p>
                     <p className="text-xs text-slate-400 truncate font-mono">{q.generated_sql}</p>
                  </div>
               ))}
               {queryHistory.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No history for this dataset.</p>}
             </div>
          </div>
        </div>

        {/* Chat Main Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Query Console {activeDataset && `- Dataset ID: ${activeDataset.split('-')[0]}`}
            </h2>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {!activeDataset && (
              <div className="flex items-center justify-center h-full text-slate-400">
                Please upload or select a dataset to start querying.
              </div>
            )}
            
            {activeDataset && chatHistory.length === 0 && (
              <div className="text-center text-slate-400 mt-20">
                Type a natural language question about your dataset.
                <br/>(e.g., &quot;Show me the top 5 highest marks&quot;)
              </div>
            )}

            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.type === 'user' ? (
                  <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-blue-600 text-white shadow-sm">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl rounded-2xl p-6 bg-slate-50 border border-slate-200">
                    {msg.error ? (
                      <p className="text-red-600">{msg.error}</p>
                    ) : (
                      <>
                        <div className="flex items-start gap-4 mb-6">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">AI Insight</h4>
                            <p className="text-slate-900 font-medium text-lg">{msg.insight}</p>
                          </div>
                          {msg.results && (
                            <button onClick={() => exportCSV(msg.results || [])} className="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                              Export CSV
                            </button>
                          )}
                        </div>

                        {msg.sql && (
                          <div className="mb-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Generated SQL</h4>
                            <div className="p-3 bg-slate-900 rounded-lg text-sm text-blue-300 font-mono overflow-x-auto">
                              {msg.sql}
                            </div>
                          </div>
                        )}

                        {msg.results && msg.results.length > 0 ? (
                          <div className="max-h-96 overflow-y-auto overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                              <thead className="bg-slate-100">
                                <tr>
                                  {Object.keys(msg.results[0]).map(key => (
                                    <th key={key} className="px-4 py-2 text-left font-semibold text-slate-600">{key}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-slate-200">
                                {msg.results.slice(0, 10).map((row: Record<string, unknown>, rIdx: number) => (
                                  <tr key={rIdx}>
                                    {Object.values(row).map((val: unknown, cIdx: number) => (
                                      <td key={cIdx} className="px-4 py-2 text-slate-700 whitespace-nowrap">{String(val)}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {msg.results.length > 10 && (
                              <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center border-t border-slate-200">
                                Showing 10 of {msg.results.length} rows
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No results returned.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl px-5 py-4 text-sm animate-pulse flex items-center gap-3">
                  <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing query...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
            <form onSubmit={handleAskAI} className="flex gap-3">
              <input
                type="text"
                aria-label="Ask a question about the dataset"
                placeholder="E.g., What is the average age of students?"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={!activeDataset}
                className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button 
                type="submit" 
                disabled={chatLoading || !chatInput.trim() || !activeDataset} 
                className="px-6 py-3 bg-green-600 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm"
              >
                Run Query
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
