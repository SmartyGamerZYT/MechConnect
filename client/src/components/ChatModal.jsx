import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image as ImageIcon } from 'lucide-react';
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

    socket.emit('join_job', jobId);

    const handleNewMessage = (msg) => {
      if (msg.job_id === jobId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleStatusChange = () => {
      fetchChatData();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('job_status_change', handleStatusChange);

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
          message_text: 'Attached file:',
          attachment_url: res.url,
          attachment_type: 'image'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
        <div className="fixed inset-0 z-[1300] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden shadow-2xl relative text-slate-900">

                  {/* Header */}
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs truncate max-w-md">
                        {jobInfo?.title || `Chat (${jobId})`}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Status: {jobInfo?.status} &bull; {jobInfo?.city}
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quote Summary */}
                  {quoteCard && (
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-shrink-0 text-xs">
                          <div>
                            <span className="text-slate-500">Agreed Price: </span>
                            <span className="font-mono font-bold text-slate-900">₹{quoteCard.agreed_price?.toLocaleString()}</span>
                          </div>
                          <span className="text-emerald-700 font-medium">Pre-Authorized</span>
                        </div>
        )}

                          {/* Messages */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                                  No messages yet.
                                </div>
                                ) : (
            messages.map((m) => {
              const isMe = m.sender_user_id === currentUser.id;
                                const isSystem = m.sender_role === 'system';

                                if (isSystem || m.is_quote_card) {
                return (
                                  <div key={m.id} className="flex justify-center my-1.5">
                                    <span className="bg-slate-100 text-slate-700 text-[11px] px-3 py-1 rounded-full border border-slate-200 font-medium">
                                      {m.message_text}
                                    </span>
                                  </div>
                                  );
              }

                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl p-3 text-xs shadow-xs ${
                          isMe
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        {!isMe && (
                          <div className="text-[10px] text-slate-500 font-semibold mb-0.5">
                            {m.sender_name || 'User'}
                          </div>
                        )}
                                            <div className="leading-relaxed">{m.message_text}</div>

                                            {m.attachment_url && (
                      <img
                        src={m.attachment_url}
                        alt=""
                        className="mt-1.5 max-h-48 rounded cursor-pointer"
                        onClick={() => window.open(m.attachment_url, '_blank')}
                      />
                                            )}

                                              <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-slate-300' : 'text-slate-400'}`}>
                                                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                            </div>
                                          </div>
                                        );
            })
          )}
                                        <div ref={messagesEndRef} />
                                      </div>

                                        {/* Input */}
                                        <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-100 flex items-center gap-1.5 bg-white flex-shrink-0">
                                          <label className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 cursor-pointer">
                                            <ImageIcon className="w-3.5 h-3.5" />
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
                                            placeholder={uploading ? 'Uploading...' : 'Type message...'}
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            disabled={uploading}
                                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                                          />

                                          <button
                                            type="submit"
                                            disabled={!inputText.trim() || uploading}
                                            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg disabled:opacity-40"
                                          >
                                            Send
                                          </button>
                                        </form>

                                      </div>
                                  </div>
                                  );
}
