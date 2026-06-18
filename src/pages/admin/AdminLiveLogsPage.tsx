import React, { useState, useEffect, useRef } from 'react';
import { Terminal, History, Download, Clock, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { http } from '../../lib/http';
import toast from 'react-hot-toast';

export default function AdminLiveLogsPage() {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [logs, setLogs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [historyFiles, setHistoryFiles] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const maxLogs = 1000;

  // -- LIVE LOGS SSE --
  useEffect(() => {
    if (activeTab === 'live' && !isPaused) {
      connectSSE();
    } else {
      disconnectSSE();
    }
    return () => disconnectSSE();
  }, [activeTab, isPaused]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current && !isPaused) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const connectSSE = () => {
    if (eventSourceRef.current) return;
    
    // Using custom EventSource with headers is tricky in standard browser API.
    // Instead, since it's admin authenticated, if you rely on cookies it's fine. 
    // If relying on Bearer token, standard EventSource doesn't support headers.
    // We'll pass the token as a query param for the SSE connection.
    const token = localStorage.getItem('token');
    eventSourceRef.current = new EventSource(`${getApiBaseUrl()}/admin/logs/live?token=${token}`);
    
    eventSourceRef.current.onmessage = (event) => {
      // Don't append if paused (the server keeps sending, we just ignore to not re-render)
      // Actually, if we are paused, we shouldn't even parse. But let's just hold the state.
      if (event.data === ':') return; // Keep-alive ping
      
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'log') {
          setLogs(prev => {
            const newLogs = [...prev, parsed.data];
            if (newLogs.length > maxLogs) return newLogs.slice(newLogs.length - maxLogs);
            return newLogs;
          });
        }
      } catch (e) {
        console.error('Error parsing log event', e);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      // Try to reconnect after 5s
      setTimeout(() => {
        if (!isPaused && activeTab === 'live') connectSSE();
      }, 5000);
    };
  };

  const disconnectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const clearTerminal = () => setLogs([]);

  // -- HISTORY LOGS --
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await http.get('/admin/logs/history');
      setHistoryFiles(response.data);
    } catch (error) {
      toast.error('Failed to load historical logs');
    } finally {
      setLoadingHistory(false);
    }
  };

  const downloadLog = async (filename: string) => {
    try {
      toast.loading('Downloading...', { id: 'download' });
      const url = `/api/v1/admin/logs/download/${filename}`;
      const response = await http.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Download complete', { id: 'download' });
    } catch (error) {
      toast.error('Download failed', { id: 'download' });
    }
  };

  // Format log lines
  const getLogColor = (level: string) => {
    switch(level?.toLowerCase()) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-emerald-400';
      case 'debug': return 'text-blue-400';
      default: return 'text-slate-300';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-indigo-600" />
            System Logs
          </h1>
          <p className="text-slate-500 mt-1">Real-time server monitoring and 30-day historical logs.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Play className="w-4 h-4" /> Live Tail
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <History className="w-4 h-4" /> History (30 Days)
          </button>
        </div>
      </div>

      {activeTab === 'live' && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-[#0f172a] flex flex-col shadow-lg" style={{ height: '70vh' }}>
          <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              </div>
              <span className="text-slate-400 text-sm font-mono flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {!isPaused && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isPaused ? 'bg-slate-500' : 'bg-emerald-500'}`}></span>
                </span>
                combined-{new Date().toISOString().split('T')[0]}.log
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white hover:bg-slate-700 h-8"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white hover:bg-slate-700 h-8"
                onClick={clearTerminal}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Clear
              </Button>
            </div>
          </div>
          
          <div 
            ref={terminalRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed"
          >
            {logs.length === 0 ? (
              <div className="text-slate-500 flex flex-col items-center justify-center h-full gap-2">
                <Terminal className="w-8 h-8 opacity-50" />
                <p>Waiting for logs...</p>
              </div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1 hover:bg-slate-800/50 px-2 -mx-2 rounded transition-colors break-all">
                  <span className="text-slate-500 mr-3 shrink-0">[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}]</span>
                  <span className={`uppercase font-bold mr-3 ${getLogColor(log.level)}`}>{log.level || 'INFO'}</span>
                  <span className="text-slate-300">{log.message}</span>
                  {log.stack && (
                    <pre className="text-red-300/80 mt-1 pl-4 border-l-2 border-red-500/30 text-xs overflow-x-auto">
                      {log.stack}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Retained Logs (Last 30 Days)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Files older than 30 days are automatically deleted from the server.</p>
          </div>
          
          <div className="p-0">
            {loadingHistory ? (
              <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
            ) : historyFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No historical logs found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {historyFiles.map(file => (
                  <div key={file.filename} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900 text-sm">{file.filename}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(file.modifiedAt).toLocaleString()} • {formatBytes(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadLog(file.filename)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
