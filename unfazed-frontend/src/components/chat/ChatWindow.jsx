import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, User, Shield, MessageSquare } from 'lucide-react';

export const ChatWindow = ({
  therapistId,
  clientId,
  currentUserRole = 'therapist', // 'therapist' | 'client'
  currentUserName = 'Dr. Sharma',
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.io /chat namespace
    const socket = io('/chat', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', {
        therapistId,
        clientId,
        senderRole: currentUserRole,
        senderName: currentUserName,
      });
    });

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [therapistId, clientId, currentUserRole, currentUserName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      text: inputText.trim(),
      therapistId,
      clientId,
      senderRole: currentUserRole,
      senderName: currentUserName,
    });

    setInputText('');
  };

  return (
    <div className="flex h-[520px] flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-850 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Private Session Consultation Chat</h4>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{isConnected ? 'End-to-End Encrypted Tunnel Active' : 'Connecting...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Shield className="h-8 w-8 mb-2 text-slate-600" />
            <p className="text-xs">No messages yet. Send a message to start real-time consultation.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderRole === currentUserRole;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-slate-500 mb-1 px-1">
                  {msg.senderName} ({msg.senderRole})
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                    isMe
                      ? 'bg-gradient-to-r from-brand-600 to-teal-500 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-600 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="border-t border-slate-800 bg-slate-850 p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || !isConnected}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
