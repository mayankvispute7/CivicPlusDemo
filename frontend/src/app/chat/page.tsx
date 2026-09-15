'use client';

import { useState } from 'react';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'CIVIC PULSE Operations AI is online. I have analyzed 18 active incidents and 30 infrastructure assets in the Pune Region. How can I assist you with deployment or analysis today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let response = "I'm cross-referencing that request against current active incidents and field deployments.";
      const lower = userMessage.toLowerCase();
      
      if (lower.match(/hey|hi|hello/)) {
        response = 'Hello! CIVIC PULSE AI is fully operational. I am currently tracking 18 incidents across Pune. How can I assist you?';
      } else if (lower.includes('work done') || lower.includes('verify')) {
        response = 'Work Order WO-2026-0142 has been verified via ground photos and satellite SAR telemetry. Computer Vision analysis confirmed 78% condition improvement. Would you like me to generate a post-incident report for the municipality?';
      } else if (lower.includes('todo') || lower.includes('next') || lower.includes('priority') || lower.includes('what should i do')) {
        response = 'You have 3 CRITICAL incidents pending. I strongly recommend analyzing INC-1055 (Pipeline Leak) next, as it intersects with critical rush-hour traffic routes and has a 92% probability of causing a sinkhole within 48 hours.';
      } else if (lower.includes('complaint')) {
        response = 'By resolving the recent Baner Road waterlogging incident, 42 pending citizen complaints were automatically closed in the municipal CRM. Citizen satisfaction metrics for that ward are projected to increase by 14%.';
      } else if (lower.includes('cheat') || lower.includes('fraud') || lower.includes('satellite')) {
        response = 'To prevent fraud, CIVIC PULSE automatically cross-references all contractor field photos against live Synthetic Aperture Radar (SAR) data from Sentinel-1 satellites to verify physical changes (like water removal) independently.';
      } else if (lower.includes('roadmap') || lower.includes('people') || lower.includes('ppl') || lower.includes('more')) {
        response = 'I have analyzed the resource constraints. I can allocate 2 additional Drainage Technicians from Team C (currently idle) to INC-1055, which will reduce the projected completion time by 4 hours. Should I update the dispatch order?';
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--accent-blue)' }}>✦</span>
          AI Command Assistant
        </h1>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Discuss operations, query asset history, or generate strategic roadmaps.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            {m.role !== 'user' && (
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', fontSize: 18, flexShrink: 0 }}>
                ✦
              </div>
            )}
            <div style={{
              background: m.role === 'user' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border-primary)',
              padding: '16px 20px',
              borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
              fontSize: 15,
              color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
              lineHeight: 1.6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', maxWidth: '80%' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', fontSize: 18, flexShrink: 0 }}>
              ✦
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '16px 20px', borderRadius: '0 12px 12px 12px', fontSize: 15, color: 'var(--text-secondary)' }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: 16 }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask the AI Assistant about priorities, verification, or deployment strategy..."
              style={{
                flex: 1,
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 8,
                padding: '16px 20px',
                color: 'var(--text-primary)',
                fontSize: 15,
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
            <button
              type="submit"
              disabled={isTyping}
              className="btn btn-primary"
              style={{ padding: '0 32px', fontSize: 16 }}
            >
              SEND ↵
            </button>
          </form>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button className="badge badge-low" style={{ cursor: 'pointer', border: '1px solid var(--border-primary)', background: 'transparent' }} onClick={() => setInput('What should I do next?')}>What should I do next?</button>
            <button className="badge badge-low" style={{ cursor: 'pointer', border: '1px solid var(--border-primary)', background: 'transparent' }} onClick={() => setInput('How does satellite verification prevent fraud?')}>Explain satellite verification</button>
            <button className="badge badge-low" style={{ cursor: 'pointer', border: '1px solid var(--border-primary)', background: 'transparent' }} onClick={() => setInput('How many citizen complaints were solved?')}>View citizen impact</button>
          </div>
        </div>
      </div>
    </div>
  );
}
