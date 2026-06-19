import React from 'react';

const ChatPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900/95 to-amber-950/10 pb-32">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <h1 className="text-3xl font-black text-white mb-2 bg-gradient-to-r from-white via-blue-300 to-amber-300 bg-clip-text text-transparent">
          Chat dengan RANIA
        </h1>
        <p className="text-slate-400 mb-8">Tanya apapun tentang travel di Timor Leste! ✨</p>
        
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl shadow-blue-900/20">
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/40">
              <span className="text-4xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">RANIA siap membantu!</h3>
            <p className="text-slate-400 mb-6">Silakan kembali ke halaman utama untuk chat dengan RANIA!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;