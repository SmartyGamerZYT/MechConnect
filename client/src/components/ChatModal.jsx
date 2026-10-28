import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  AlertCircle,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import { api, socket } from '../services/api';

export default function ChatModal({
  jobId,
  isOpen,
  onClose,
  currentUser
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [jobInfo, setJobInfo] = useState(null);
  const [quoteCard, setQuoteCard] = useState(null);
  const messagesEndRef = useRef(null);

  const fetchChatData = async () => {
    if (!jobId) return;
    try {
      const [msgs, jobData] = await Promise.all([
        api.getChatMessages(jobId),
        api.getJobDetails(jobId)
      ]);
      setMessages(msgs);
      setJobInfo(jobData.job);
      setQuoteCard(jobData.quoteCard);
    } catch (err) {
      console.error('Chat data fetch error:', err);
    }
  };

  useEffect(() => {
    if (!isOpen || !jobId) return;

    fetchChatData();

    // Join Socket room
    socket.emit('join_job', jobId);

    const handleNewMessage = (msg) => {
      if (msg.job_id === jobId) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleStatusChange = () => {
      fetchChatData();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('job_status_change', handleStatusChange);

    // Reliable fallback poller every 2.5 seconds
    const interval = setInterval(() => {
      fetchChatData();
    }, 2500);

    return () => {
      clearInterval(interval);
      socket.emit('leave_job', jobId);
      socket.off('new_message', handleNewMessage);
      socket.off('job_status_change', handleStatusChange);
    };
  }, [isOpen, jobId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const currentText = inputText.trim();
    setInputText('');

    const payload = {
      sender_user_id: currentUser.id,
      sender_role: currentUser.role,
      message_text: currentText
    };

    try {
      const res = await api.sendMessage(jobId, payload);
      if (res && res.id) {
        setMessages((prev) => {
          if (prev.some(m => m.id === res.id)) return prev;
          return [...prev, res];
        });
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadFile(file, currentUser.id, 'chat', jobId);
      if (res.url) {
        await api.sendMessage(jobId, {
          sender_user_id: currentUser.id,
          sender_role: currentUser.role,
          message_text: 'Attached image/schematic:',
          attachment_url: res.url,
          attachment_type: 'image'
        });
      }
    } catch (err) {
      console.error('Upload chat error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#1E1E1E] border border-[#2C2C2E] rounded-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-[#2C2C2E] flex items-center justify-between bg-[#181818] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
              💬
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm truncate max-w-[280px] sm:max-w-md">
                  {jobInfo?.title || `Job Chat (${jobId})`}
                </h3>
                <span className="text-[10px] font-mono bg-[#00E5FF]/20 text-[#00E5FF] px-1.5 py-0.2 rounded font-bold">
                  {jobInfo?.urgency || 'SLA'}
                </span>
              </div>
              <div className="text-[11px] text-[#98989D] flex items-center gap-2">
                <span>{jobInfo?.company_name || 'Plant'} &bull; {jobInfo?.city}</span>
                <span className="text-[#32D74B] font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#32D74B] animate-pulse"></span>
                  Encrypted Industrial Channel
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#252525] hover:bg-[#303030] text-[#98989D] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pinned Quote Card Summary if locked */}
        {quoteCard && (
          <div className="bg-[#141414] border-b border-[#00E5FF]/40 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              <div className="text-xs">
                <span className="text-[#98989D]">Locked Deal Price: </span>
                <span className="font-mono font-bold text-white text-[#00E5FF]">₹{quoteCard.agreed_price?.toLocaleString()}</span>
                <span className="text-[11px] text-[#32D74B] ml-2">✓ Pre-Authorized</span>
              </div>
            </div>
            <span className="text-[10px] text-[#98989D] font-mono">
              Status: {jobInfo?.status}
            </span>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#121212]/80">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#98989D] p-6">
              <div className="w-12 h-12 rounded-full bg-[#1E1E1E] border border-[#2C2C2E] flex items-center justify-center text-xl mb-2">
                🔒
              </div>
              <p className="text-xs font-semibold text-white">Direct Channel Initialized</p>
              <p className="text-[11px] max-w-sm mt-1">
                Discuss machine symptoms, electrical schematics, parts availability, and finalize on-site quote.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_user_id === currentUser.id;
              const isSystem = m.sender_role === 'system';

              if (isSystem || m.is_quote_card) {
                return (
                  <div key={m.id} className="flex justify-center my-2">
                    <div className="bg-[#1E1E1E] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-mono px-3.5 py-1.5 rounded-full shadow flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{m.message_text}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <img
                      src={m.sender_avatar || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-[#2C2C2E]"
                    />
                  )}

                  <div className={`max-w-[75%] rounded-2xl p-3 text-xs ${
                    isMe
                      ? 'bg-[#00E5FF] text-black font-medium rounded-br-none shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                      : 'bg-[#1E1E1E] text-white border border-[#2C2C2E] rounded-bl-none'
                  }`}>
                    {!isMe && (
                      <div className="text-[10px] text-[#00E5FF] font-bold mb-1 flex items-center gap-1">
                        <span>{m.sender_name || 'User'}</span>
                        <span className="text-[8px] bg-[#2C2C2E] text-[#98989D] px-1 rounded uppercase font-mono">{m.sender_role}</span>
                      </div>
                    )}

                    <div className="leading-relaxed whitespace-pre-wrap">{m.message_text}</div>

                    {/* Attached Image */}
                    {m.attachment_url && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-black/20">
                        <img
                          src={m.attachment_url}
                          alt="Attachment"
                          className="max-h-56 w-full object-cover rounded-md cursor-pointer hover:scale-[1.02] transition"
                          onClick={() => window.open(m.attachment_url, '_blank')}
                        />
                      </div>
                    )}

                    <div className={`text-[9px] mt-1 text-right font-mono ${isMe ? 'text-black/70' : 'text-[#98989D]'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-[#181818] border-t border-[#2C2C2E] flex items-center gap-2 flex-shrink-0">
          <label className="w-9 h-9 rounded-xl bg-[#252525] hover:bg-[#303030] text-[#98989D] hover:text-[#00E5FF] flex items-center justify-center transition cursor-pointer flex-shrink-0">
            <ImageIcon className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleUploadImage}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <input
            type="text"
            placeholder={uploading ? 'Uploading attachment...' : 'Type message or counter-offer details...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={uploading}
            className="flex-1 bg-[#121212] border border-[#2C2C2E] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#505050] focus:outline-none focus:border-[#00E5FF] transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || uploading}
            className="w-9 h-9 rounded-xl bg-[#00E5FF] hover:bg-[#00c5dc] text-black flex items-center justify-center transition cursor-pointer disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}

