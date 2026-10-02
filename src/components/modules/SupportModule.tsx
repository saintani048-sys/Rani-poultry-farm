import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { SupportTicket } from '../../types/index.ts';
import { HelpCircle, Phone, Mail, MapPin, Send, MessageSquare, ArrowLeft, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export const SupportModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTickets = async () => {
    try {
      const res = await api.getSupportTickets();
      setTickets(res);
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await api.submitSupportTicket({ subject, message, priority });
      setFeedback({ type: 'success', message: res.message });
      setSubject('');
      setMessage('');
      await loadTickets();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit ticket.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:text-emerald-950 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        <button
          onClick={loadTickets}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">WhatsApp / Helpline</span>
            <span className="text-sm font-bold text-slate-900 font-mono">
              {settings.support_phone || '+92 300 1234567'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Official Email</span>
            <span className="text-sm font-bold text-slate-900">
              {settings.support_email || 'support@nooranipoultry.com'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 block font-medium">Farm Facility</span>
            <span className="text-xs font-semibold text-slate-900 truncate block">
              {settings.farm_address || 'Chak 45-SB, Sargodha Road, Punjab'}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Submission Form & Tickets List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Submit Help Desk Ticket</h3>
            <p className="text-xs text-slate-500 mb-4">
              Our veterinary and technical management responds within 2-4 hours.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding Golden Misri hen feed"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e: any) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 bg-white"
                >
                  <option value="low">Low - General Inquiry</option>
                  <option value="medium">Medium - Purchase or Collection Assistance</option>
                  <option value="high">High - Urgent Payment / Account Issue</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Message Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain your inquiry or issue clearly..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#064E3B] hover:bg-[#053F30] text-white font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting...' : 'Send Support Ticket'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Tickets History */}
        <div className="lg:col-span-7">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3">Your Support Tickets</h3>
            {tickets.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                You have not submitted any support inquiries yet.
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{t.subject}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          t.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'open'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{t.message}</p>

                    {t.admin_reply && (
                      <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                        <div className="flex items-center justify-between font-bold text-[11px] text-emerald-950 mb-1">
                          <span>Farm Management Response:</span>
                          <span className="font-mono text-slate-400 font-normal">
                            {t.replied_at ? new Date(t.replied_at).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p>{t.admin_reply}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono">
                      Submitted on: {new Date(t.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
