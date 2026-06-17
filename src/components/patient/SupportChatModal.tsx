import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import { Send, Loader2, RefreshCw } from 'lucide-react';
import { patientApi } from '../../api/patient';

interface Message {
  id: string;
  role: 'patient' | 'support';
  message: string;
  createdAt: string;
}

interface SupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
}

export const SupportChatModal: React.FC<SupportChatModalProps> = ({ isOpen, onClose, ticketId }) => {
  const [loading, setLoading] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket();
    } else {
      setTicketDetails(null);
      setMessages([]);
      setNewMessage('');
    }
  }, [isOpen, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadTicket = async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      const res = await patientApi.getSupportTicket(ticketId);
      if (res?.data) {
        setTicketDetails(res.data);
        
        // Add the initial message if there are no messages
        const fetchedMsgs = res.data.messages || [];
        if (fetchedMsgs.length === 0) {
          fetchedMsgs.push({
            id: 'initial',
            role: 'patient',
            message: res.data.message,
            createdAt: res.data.createdAt,
          });
        }
        setMessages(fetchedMsgs);
      }
    } catch (err) {
      console.error('Error loading ticket', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticketId) return;

    try {
      setSending(true);
      const res = await patientApi.replySupportTicket(ticketId, { message: newMessage });
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error sending message', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={ticketDetails?.title || 'Support Request'}>
      <div className="flex flex-col h-[60vh] -m-6">
        {/* Ticket Header Info */}
        {ticketDetails && (
          <div className="px-6 py-4 border-b border-calm-sage/10 bg-calm-sage/5 flex items-center justify-between shrink-0">
            <div>
              <span className="text-xs font-semibold text-charcoal/50 uppercase tracking-wider">Status</span>
              <p className="font-medium text-sm text-charcoal">
                {ticketDetails.status === 'OPEN' ? (
                  <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Open</span>
                ) : ticketDetails.status === 'CLOSED' ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Closed</span>
                ) : (
                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{ticketDetails.status}</span>
                )}
              </p>
            </div>
            <button 
              onClick={loadTicket} 
              className="p-2 text-calm-sage hover:bg-white rounded-full transition-colors flex items-center gap-2 text-sm font-medium"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          {loading && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-calm-sage" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-charcoal/50 text-sm">
              No messages yet
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isPatient = msg.role === 'patient';
              return (
                <div key={msg.id || idx} className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      isPatient 
                        ? 'bg-calm-sage text-white rounded-tr-sm' 
                        : 'bg-white border border-calm-sage/20 text-charcoal rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                  <span className="text-[10px] text-charcoal/40 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 border-t border-calm-sage/10 bg-white">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full resize-none rounded-xl border border-calm-sage/30 bg-white p-3 text-sm text-charcoal placeholder-charcoal/40 focus:border-calm-sage focus:outline-none focus:ring-1 focus:ring-calm-sage/50"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || ticketDetails?.status === 'CLOSED'}
              className="mb-1 rounded-full bg-calm-sage p-3 text-white transition-all hover:bg-calm-sage/90 disabled:opacity-50 flex items-center justify-center h-12 w-12 shrink-0"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default SupportChatModal;
