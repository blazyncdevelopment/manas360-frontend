import { useState, useEffect } from 'react';
import { api } from '../../api/admin.api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  blueprint_state?: string;
  assignee?: string;
  created: string;
}

interface BlueprintCard {
  title: string;
  total: number;
  open: number;
  color: string;
}

interface TicketComment {
  id: string;
  content: string;
  commenter?: { name: string };
  isPublic: boolean;
  createdTime: string;
}

export default function ZohoDeskPanel() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [blueprints, setBlueprints] = useState<BlueprintCard[]>([]);
  
  // Drawer states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Comment Form states
  const [commentText, setCommentText] = useState('');
  const [isCommentPublic, setIsCommentPublic] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchData = async () => {
    try {
      const [ticketsRes, blueprintsRes] = await Promise.all([
        api.get('/v1/admin/tickets?limit=15'),
        api.get('/v1/admin/blueprints/status')
      ]);

      const ticketsPayload = ticketsRes?.data?.data?.tickets || ticketsRes?.data?.tickets || [];
      const blueprintPayload = blueprintsRes?.data?.data || blueprintsRes?.data || {};

      setTickets(ticketsPayload);

      setBlueprints([
        {
          title: 'Therapist Onboarding',
          total: (blueprintPayload.onboarding?.pending || 0) + (blueprintPayload.onboarding?.approved || 0) + (blueprintPayload.onboarding?.rejected || 0),
          open: blueprintPayload.onboarding?.pending || 0,
          color: '#3b82f6', // blue
        },
        {
          title: 'Clinical Escalation',
          total: (blueprintPayload.crisis?.open || 0) + (blueprintPayload.crisis?.resolved || 0),
          open: blueprintPayload.crisis?.open || 0,
          color: '#f59e0b', // amber
        },
        {
          title: 'Insurance Claims',
          total: (blueprintPayload.insurance?.in_review || 0) + (blueprintPayload.insurance?.paid || 0),
          open: blueprintPayload.insurance?.in_review || 0,
          color: '#10b981', // emerald
        },
      ]);
      toast.success('Zoho Desk data synced');
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync Zoho Desk data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openTicketDrawer = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
    setIsLoadingDetails(true);
    setTicketDetails(null);
    setComments([]);
    setCommentText('');
    setIsCommentPublic(false);

    try {
      const [detailsRes, commentsRes] = await Promise.all([
        api.get(`/v1/admin/tickets/${ticket.id}`),
        api.get(`/v1/admin/tickets/${ticket.id}/comments`)
      ]);

      setTicketDetails(detailsRes?.data?.data || detailsRes?.data || null);
      
      const commentsPayload = commentsRes?.data?.data?.data || commentsRes?.data?.data || [];
      setComments(commentsPayload);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load ticket details or comments');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadComments = async (ticketId: string) => {
    try {
      const res = await api.get(`/v1/admin/tickets/${ticketId}/comments`);
      const commentsPayload = res?.data?.data?.data || res?.data?.data || [];
      setComments(commentsPayload);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await api.post(`/v1/admin/tickets/${selectedTicket.id}/comment`, {
        content: commentText.trim(),
        isPublic: isCommentPublic
      });
      toast.success('Response added to ticket');
      setCommentText('');
      await loadComments(selectedTicket.id);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add response');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTicket(null);
    setTicketDetails(null);
    setComments([]);
  };

  return (
    <div className="p-6 relative min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zoho Desk Command Center</h1>
        <Button onClick={fetchData} variant="secondary" className="flex items-center gap-2">
          <span>🔄</span> Sync Live
        </Button>
      </div>

      {/* Blueprint Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {blueprints.map((bp) => (
          <Card 
            key={bp.title} 
            className="p-6 hover:shadow-md transition border-l-4 bg-white" 
            style={{ borderLeftColor: bp.color }}
          >
            <div className="flex justify-between items-start">
              <p className="font-semibold text-gray-700">{bp.title}</p>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700">Live</Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-5xl font-bold text-gray-900">{bp.total}</span>
              <span className="text-sm text-gray-500">total</span>
            </div>
            <p className="text-amber-600 font-medium text-sm mt-2">
              {bp.open} open • {bp.total - bp.open} closed
            </p>
          </Card>
        ))}
      </div>

      {/* Active Tickets Table */}
      <Card className="shadow overflow-hidden bg-white border border-gray-100 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-800 text-lg">Active Tickets</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-100 font-bold">
                <th className="px-6 py-3.5 text-left">Ticket No.</th>
                <th className="px-6 py-3.5 text-left">Subject</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Priority</th>
                <th className="px-6 py-3.5 text-left">Blueprint State</th>
                <th className="px-6 py-3.5 text-left">Assignee</th>
                <th className="px-6 py-3.5 text-left">Created</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-400 italic">No tickets found</td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-semibold text-blue-600">#{t.ticketNumber}</td>
                    <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-900">{t.subject}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-none capitalize">{t.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        variant={t.priority === 'High' || t.priority === 'Urgent' ? 'destructive' : 'secondary'}
                        className="capitalize"
                      >
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-medium italic">{t.blueprint_state || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{t.assignee || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.created).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openTicketDrawer(t)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm"
                      >
                        View & Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drawer Overlay Backdrop */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity z-40"
          onClick={closeDrawer}
        />
      )}

      {/* Slide-over Right Sidebar Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 transform border-l border-gray-100 ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedTicket && (
          <>
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Ticket #{selectedTicket.ticketNumber}
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1 line-clamp-1">
                  {selectedTicket.subject}
                </h2>
              </div>
              <button 
                type="button"
                onClick={closeDrawer}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 rounded-full hover:bg-gray-200 transition-colors leading-none"
              >
                &times;
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 font-medium">Fetching details from Zoho Desk...</p>
                </div>
              ) : (
                <>
                  {/* Metadata Fields */}
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
                    <div>
                      <span className="text-gray-400 block text-xs font-medium uppercase">Priority</span>
                      <Badge 
                        variant={selectedTicket.priority === 'High' || selectedTicket.priority === 'Urgent' ? 'destructive' : 'secondary'}
                        className="mt-1 capitalize"
                      >
                        {selectedTicket.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-xs font-medium uppercase">Status</span>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 mt-1 border-none capitalize">
                        {selectedTicket.status}
                      </Badge>
                    </div>
                    {ticketDetails?.contact && (
                      <div className="col-span-2 border-t border-gray-200/60 pt-3 mt-1">
                        <span className="text-gray-400 block text-xs font-medium uppercase">Requester</span>
                        <p className="font-semibold text-gray-800 mt-0.5">
                          {ticketDetails.contact.firstName} {ticketDetails.contact.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500">{ticketDetails.contact.email || 'No email'}</p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Content / Description */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Description</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-line shadow-sm leading-relaxed min-h-[80px]">
                      {ticketDetails?.description || ticketDetails?.content || 'No description provided.'}
                    </div>
                  </div>

                  {/* Conversation Thread */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Communication Thread</h3>
                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm italic py-4">No comments or replies yet.</p>
                      ) : (
                        comments.map((comment) => (
                          <div 
                            key={comment.id}
                            className={`p-4 rounded-lg border text-sm shadow-sm ${
                              comment.isPublic 
                                ? 'bg-blue-50/40 border-blue-100' 
                                : 'bg-amber-50/40 border-amber-100'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-semibold text-gray-800">
                                {comment.commenter?.name || 'Zoho User'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  comment.isPublic 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {comment.isPublic ? 'Public Reply' : 'Private Note'}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  {new Date(comment.createdTime).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer Response Editor */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-gray-150 bg-gray-50 space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">Add Response</label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type your reply or internal note here..."
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  required
                />
              </div>

              <div className="flex justify-between items-center">
                {/* Visibility Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600">Type:</span>
                  <button
                    type="button"
                    onClick={() => setIsCommentPublic(false)}
                    className={`px-2 py-1 text-xs font-semibold rounded transition-all ${
                      !isCommentPublic 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200 font-bold' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Private Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCommentPublic(true)}
                    className={`px-2 py-1 text-xs font-semibold rounded transition-all ${
                      isCommentPublic 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200 font-bold' 
                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Public Reply
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmittingComment || !commentText.trim()}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded transition-colors shadow-sm disabled:opacity-50 ${
                    isCommentPublic 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isSubmittingComment ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
