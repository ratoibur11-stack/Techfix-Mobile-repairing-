import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  ThumbsUp, 
  UserCheck, 
  Plus, 
  Send 
} from 'lucide-react';
import { ClientFeedback } from '../types';
import { BUSINESS_DETAILS } from '../data/initialData';

interface FeedbackHubProps {
  feedbacks: ClientFeedback[];
  onAddFeedback: (fb: ClientFeedback) => void;
  customerUser?: { displayName: string; email: string } | null;
}

export const FeedbackHub: React.FC<FeedbackHubProps> = ({
  feedbacks,
  onAddFeedback,
  customerUser
}) => {
  const [clientName, setClientName] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [serviceType, setServiceType] = useState('Hardware Repairing');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync client name when customer user changes or form opens
  React.useEffect(() => {
    if (customerUser) {
      setClientName(customerUser.displayName || customerUser.email.split('@')[0]);
    }
  }, [customerUser]);

  const averageRating = (
    feedbacks.reduce((sum, f) => sum + f.rating, 0) / (feedbacks.length || 1)
  ).toFixed(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !comment.trim()) return;

    const newFb: ClientFeedback = {
      id: `fb-user-${Date.now()}`,
      clientName: clientName.trim(),
      rating,
      comment: comment.trim(),
      submittedAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      approved: true,
      serviceType,
      deviceModel: deviceModel.trim() || "Android Mobile"
    };

    onAddFeedback(newFb);
    setComment('');
    setDeviceModel('');
    setShowForm(false);
    setSuccessMsg('Thank you! Your review has been posted successfully and saved.');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
            Customer Testimonials
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Client Reviews & Service Feedback
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            See what customers in Goalpara say about our mobile hardware, software flashing, and IC board-level repair services.
          </p>
        </div>

        {/* Rating Score Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 text-center min-w-[200px] border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-center gap-1 text-amber-400">
            <Star className="w-6 h-6 fill-amber-400" />
            <span className="text-3xl font-black">{averageRating}</span>
            <span className="text-slate-400 text-xs">/ 5.0</span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            Based on {feedbacks.length} Verified Customer Reviews
          </p>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Action to Add Feedback */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900">
          Recent Client Reviews
        </h2>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Review Submission Form Modal / Panel */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-300 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
            Share Your Experience at TECHFIX Shop
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Joydeb Sarkar"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Model</label>
              <input
                type="text"
                placeholder="e.g. Samsung M31"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Service Done</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
              >
                <option value="Hardware Repairing">Hardware Repairing</option>
                <option value="IC-Level Board Repair">IC-Level Board Repair</option>
                <option value="Software Flashing">Software Flashing</option>
                <option value="Display Replacement">Display Replacement</option>
                <option value="Battery / Connector">Battery / Connector</option>
                <option value="Pre-Owned Mobile Purchase">Pre-Owned Phone</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Rating:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition"
                >
                  <Star className={`w-5 h-5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Your Review *</label>
            <textarea
              rows={3}
              required
              placeholder="Tell us about the repair quality, speed, and customer service..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
            >
              Post Review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedbacks.map((fb) => (
          <div 
            key={fb.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{fb.clientName}</h3>
                <p className="text-[11px] text-slate-500">{fb.deviceModel} • {fb.serviceType}</p>
              </div>

              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3.5 h-3.5 ${i < fb.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-700 italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{fb.comment}"
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Verified Customer
              </span>
              <span>{fb.submittedAt}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
