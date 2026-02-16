
import React, { useState, useEffect, useRef } from 'react';
import { Character, GlobalEvent, FamilyMember, GameLog, GameState, InteractiveEvent, SocialStats } from './types';
import { COUNTRIES, CITIES_DATA, CHAOS_CHANCE } from './constants';
import { generateFamily, generateYearNarrative, generateInteractiveEvent, resolveEventChoice, generateSocialPostResult } from './services/geminiService';

const INITIAL_SOCIAL: SocialStats = { isActive: false, followers: 0, isVerified: false, isBanned: false, totalPosts: 0 };

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-600', label: 'Inscritos', actions: ['Vídeo', 'Shorts'] },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black', label: 'Seguidores', actions: ['Vídeo'] },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', label: 'Seguidores', actions: ['Post', 'Story'] },
  { id: 'twitter', name: 'Twitter (X)', icon: '🐦', color: 'bg-sky-500', label: 'Seguidores', actions: ['Post'] },
  { id: 'twitch', name: 'Twitch', icon: '👾', color: 'bg-purple-600', label: 'Seguidores', actions: ['Stream'] },
  { id: 'pornhub', name: 'Pornhub', icon: '🍑', color: 'bg-orange-500', label: 'Assinantes', actions: ['Vídeo'] },
  { id: 'onlyfans', name: 'OnlyFans', icon: '💎', color: 'bg-blue-400', label: 'Fãs', actions: ['Imagem'] }
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [char, setChar] = useState<Character>({
    firstName: '',
    lastName: '',
    country: 'Brasil',
    state: 'São Paulo',
    city: 'São Paulo City',
    age: 18,
    health: 95,
    happiness: 50,
    intellect: 50,
    appearance: 50,
    money: 1000,
    fame: 0,
    job: 'Desempregado',
    hasBunker: false,
    hasDodo: false,
    socialMedia: {
      youtube: { ...INITIAL_SOCIAL },
      tiktok: { ...INITIAL_SOCIAL },
      instagram: { ...INITIAL_SOCIAL },
      twitter: { ...INITIAL_SOCIAL },
      twitch: { ...INITIAL_SOCIAL },
      pornhub: { ...INITIAL_SOCIAL },
      onlyfans: { ...INITIAL_SOCIAL }
    }
  });

  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [currentEvent, setCurrentEvent] = useState<GlobalEvent>(GlobalEvent.NORMAL);
  const [pendingEvent, setPendingEvent] = useState<InteractiveEvent | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'danger' | 'success' = 'info') => {
    setLogs(prev => [...prev, { year: char.age, event: currentEvent, message, type }]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const groupedLogs = logs.reduce((acc, log) => {
    const year = log.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(log.message);
    return acc;
  }, {} as Record<number, string[]>);

  const startGame = async () => {
    if (!char.firstName || !char.lastName) {
      alert("Por favor, preencha seu nome e sobrenome!");
      return;
    }
    setGameState(GameState.PLAYING);
    addLog(`Você nasceu em ${char.city}, ${char.state}, ${char.country}. Sua jornada começa agora!`, 'success');
  };

  const passYear = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (Math.random() < 0.6) {
      try {
        const eventData = await generateInteractiveEvent(char);
        setPendingEvent(eventData);
        setGameState(GameState.INTERACTIVE_EVENT);
        setIsProcessing(false);
        return;
      } catch (e) { console.error(e); }
    }
    await executePassYear();
    setIsProcessing(false);
  };

  const executePassYear = async () => {
    let nextAge = char.age + 1;
    let nextHealth = Math.max(0, char.health - (Math.random() * 3));
    let nextHappiness = Math.max(0, Math.min(100, char.happiness + (Math.random() * 6 - 3)));
    
    let socialIncome = 0;
    (Object.values(char.socialMedia) as SocialStats[]).forEach(s => {
      if (s.isActive && !s.isBanned) {
        socialIncome += (s.followers * 0.15);
      }
    });

    let jobIncome = char.job === 'Desempregado' ? 0 : 40000;
    let nextMoney = char.money + jobIncome + socialIncome;

    if (nextHealth <= 0 || nextAge > 120) {
      setGameState(GameState.GAMEOVER);
      return;
    }

    const narrative = await generateYearNarrative(nextAge, GlobalEvent.NORMAL, char.city);
    addLog(narrative);
    if (socialIncome > 0) addLog(`💰 Ganhos digitais: R$ ${socialIncome.toLocaleString('pt-BR')}`, 'success');

    setChar(prev => ({
      ...prev,
      age: nextAge,
      health: nextHealth,
      money: nextMoney,
      happiness: nextHappiness
    }));
  };

  const handleChoice = async (resultId: string) => {
    if (!pendingEvent) return;
    setIsProcessing(true);
    try {
      const result = await resolveEventChoice(pendingEvent, resultId);
      addLog(result.narrative, result.impact.happiness < 0 ? 'danger' : 'success');
      setChar(prev => ({
        ...prev,
        health: Math.max(0, Math.min(100, prev.health + (result.impact.health || 0))),
        happiness: Math.max(0, Math.min(100, prev.happiness + (result.impact.happiness || 0))),
        money: prev.money + (result.impact.money || 0),
        intellect: Math.max(0, Math.min(100, prev.intellect + (result.impact.intellect || 0))),
        appearance: Math.max(0, Math.min(100, prev.appearance + (result.impact.appearance || 0)))
      }));
      setPendingEvent(null);
      setGameState(GameState.PLAYING);
      await executePassYear();
    } catch (e) { setGameState(GameState.PLAYING); } finally { setIsProcessing(false); }
  };

  const createSocialAccount = (platformId: string) => {
    setChar(prev => {
      const updated = { ...prev.socialMedia };
      updated[platformId] = { ...INITIAL_SOCIAL, isActive: true };
      addLog(`Você abriu uma conta no ${platformId.toUpperCase()}. Hora de viralizar!`, 'info');
      return { ...prev, socialMedia: updated };
    });
  };

  const deleteSocialAccount = (platformId: string) => {
    if (!confirm(`TEM CERTEZA? Excluir sua conta no ${platformId} é permanente e todos os seus seguidores serão perdidos.`)) return;
    setChar(prev => {
      const updated = { ...prev.socialMedia };
      updated[platformId] = { ...INITIAL_SOCIAL, isActive: false };
      addLog(`Você deletou sua conta no ${platformId}. Um recomeço ou um erro?`, 'danger');
      return { ...prev, socialMedia: updated };
    });
  };

  const postOnSocial = async (platformId: string, contentType: string) => {
    const platform = char.socialMedia[platformId];
    if (platform.isBanned) return alert("Esta conta foi BANIDA.");

    setIsProcessing(true);
    try {
      const result = await generateSocialPostResult(platformId, platform.followers, contentType);
      addLog(`[${platformId.toUpperCase()}] ${result.title}: ${result.narrative}`, 'info');
      
      setChar(prev => {
        const updatedSocial = { ...prev.socialMedia };
        updatedSocial[platformId] = {
          ...updatedSocial[platformId],
          followers: Math.max(0, updatedSocial[platformId].followers + result.gainFollowers),
          totalPosts: updatedSocial[platformId].totalPosts + 1
        };
        
        let hapImpact = result.gainHappiness;
        if (platformId === 'pornhub' || platformId === 'onlyfans') hapImpact -= 5;

        return {
          ...prev,
          socialMedia: updatedSocial,
          money: prev.money + result.gainMoney,
          happiness: Math.max(0, Math.min(100, prev.happiness + hapImpact))
        };
      });
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  if (gameState === GameState.SETUP) {
    const selectedCountry = COUNTRIES.find(c => c.name === char.country) || COUNTRIES[0];
    const availableStates = selectedCountry.states || [];
    const availableCities = CITIES_DATA[char.state] || [];

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0066cc] p-4">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-md animate-fadeIn">
          <h1 className="text-5xl font-black text-center mb-1 text-[#0066cc] italic uppercase tracking-tighter">WebLife</h1>
          <p className="text-center text-slate-400 mb-8 font-black text-[10px] uppercase tracking-widest">Chaos Edition</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Nome" className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold focus:border-[#0066cc] outline-none" onChange={(e) => setChar({...char, firstName: e.target.value})} />
              <input type="text" placeholder="Sobrenome" className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold focus:border-[#0066cc] outline-none" onChange={(e) => setChar({...char, lastName: e.target.value})} />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-200">
              <button onClick={() => setGender('Male')} className={`flex-1 py-3 rounded-xl font-black transition-all ${gender === 'Male' ? 'bg-[#0066cc] text-white shadow-md' : 'text-slate-400'}`}>HOMEM</button>
              <button onClick={() => setGender('Female')} className={`flex-1 py-3 rounded-xl font-black transition-all ${gender === 'Female' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400'}`}>MULHER</button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nascimento</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none"
                value={char.country}
                onChange={(e) => {
                  const countryName = e.target.value;
                  const firstState = COUNTRIES.find(c => c.name === countryName)?.states[0] || '';
                  const firstCity = CITIES_DATA[firstState]?.[0] || '';
                  setChar({...char, country: countryName, state: firstState, city: firstCity});
                }}
              >
                {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>

              <select 
                className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none"
                value={char.state}
                onChange={(e) => {
                  const stateName = e.target.value;
                  const firstCity = CITIES_DATA[stateName]?.[0] || '';
                  setChar({...char, state: stateName, city: firstCity});
                }}
              >
                {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                className="w-full bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none"
                value={char.city}
                onChange={(e) => setChar({...char, city: e.target.value})}
              >
                {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <button onClick={startGame} className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white font-black py-5 rounded-[2.5rem] text-xl shadow-xl transition-all active:scale-95 uppercase">COMEÇAR VIDA</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAMEOVER) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6 text-center">
        <div className="bg-white p-12 rounded-[3.5rem] border-4 border-slate-200 shadow-2xl max-w-sm w-full">
          <div className="text-7xl mb-6">🪦</div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter">{char.firstName} {char.lastName}</h1>
          <p className="text-slate-400 font-bold mb-6 italic">Descansou aos {char.age} anos</p>
          <div className="bg-green-50 p-6 rounded-3xl mb-8 border-2 border-green-100">
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Patrimônio Final</p>
            <p className="text-3xl font-black text-[#22c55e]">R$ {char.money.toLocaleString()}</p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-[#0066cc] text-white py-5 rounded-2xl font-black text-xl shadow-lg">RECOMEÇAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200 relative">
      {/* OVERLAYS */}
      {gameState === GameState.INTERACTIVE_EVENT && pendingEvent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full rounded-[3rem] shadow-2xl p-8 animate-fadeIn border-t-8 border-[#0066cc]">
            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-4 uppercase italic">{pendingEvent.title}</h2>
            <p className="text-slate-600 mb-8 font-medium text-lg leading-snug">{pendingEvent.description}</p>
            <div className="space-y-3">
              {pendingEvent.options.map((opt, idx) => (
                <button key={idx} onClick={() => handleChoice(opt.resultId)} className="w-full bg-slate-100 hover:bg-[#0066cc] hover:text-white transition-all font-black py-5 rounded-[2rem] border-2 border-slate-200">{opt.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.ACTIVITIES_MENU && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-10 border-b-4 border-[#0066cc] pb-4">
            <h2 className="text-4xl font-black text-[#0066cc] italic uppercase">ATIVIDADES</h2>
            <button onClick={() => setGameState(GameState.PLAYING)} className="text-3xl font-black bg-slate-100 w-14 h-14 rounded-full flex items-center justify-center">✕</button>
          </div>
          <button onClick={() => setGameState(GameState.DIGITAL_CAREERS)} className="w-full flex items-center p-8 bg-blue-50 border-2 border-blue-200 rounded-[3rem] shadow-sm active:scale-95 transition-all">
            <span className="text-6xl mr-6">🤳</span>
            <div className="text-left">
              <p className="font-black text-2xl text-blue-900">Império Digital</p>
              <p className="text-xs text-blue-500 font-bold uppercase tracking-widest">YouTube, TikTok, Instagram...</p>
            </div>
          </button>
        </div>
      )}

      {gameState === GameState.DIGITAL_CAREERS && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center mb-8">
            <button onClick={() => setGameState(GameState.ACTIVITIES_MENU)} className="text-2xl mr-4 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center font-black">←</button>
            <h2 className="text-3xl font-black text-[#0066cc] italic">REDES SOCIAIS</h2>
          </div>
          <div className="grid gap-6 pb-24">
            {PLATFORMS.map(p => {
              const account = char.socialMedia[p.id];
              return (
                <div key={p.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 shadow-xl relative overflow-hidden transition-all hover:border-slate-300">
                  <div className={`absolute top-0 right-0 w-2 h-full ${p.color}`}></div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className={`w-16 h-16 ${p.color} text-white rounded-3xl flex items-center justify-center text-4xl mr-5 shadow-lg`}>
                        {p.icon}
                      </div>
                      <div>
                        <p className="font-black text-2xl text-slate-800">{p.name}</p>
                        {account.isActive ? (
                          <p className="text-sm text-[#0066cc] font-black uppercase tracking-tighter">
                            {account.followers.toLocaleString()} {p.label}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Inativo</p>
                        )}
                      </div>
                    </div>
                    {account.isBanned && <span className="text-[10px] bg-red-600 text-white px-4 py-1 rounded-full font-black uppercase shadow-sm">BANIDO</span>}
                  </div>
                  
                  {!account.isActive ? (
                    <button 
                      onClick={() => createSocialAccount(p.id)}
                      className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                    >
                      CRIAR CONTA
                    </button>
                  ) : !account.isBanned && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {p.actions.map(action => (
                          <button 
                            key={action}
                            onClick={() => postOnSocial(p.id, action)}
                            disabled={isProcessing}
                            className="flex-1 min-w-[120px] bg-[#0066cc] hover:bg-blue-700 text-white py-4 rounded-2xl text-xs font-black shadow-md active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                          >
                            Postar {action}
                          </button>
                        ))}
                        <button 
                          onClick={() => deleteSocialAccount(p.id)}
                          className="w-full bg-red-50 text-red-600 py-3 rounded-xl text-xs font-black border-2 border-red-100 hover:bg-red-600 hover:text-white transition-all uppercase tracking-widest mt-2"
                        >
                          EXCLUIR CANAL
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-[#0066cc] p-6 text-white flex items-start justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-yellow-50 rounded-[1.5rem] flex items-center justify-center text-5xl border-4 border-white shadow-xl transform -rotate-3 transition-transform hover:rotate-0">
            {gender === 'Male' ? '👱‍♂️' : '👩'}
          </div>
          <div>
            <h2 className="font-black text-2xl underline underline-offset-4 decoration-4">{char.firstName} {char.lastName}</h2>
            <p className="text-[10px] font-black opacity-80 uppercase tracking-widest mt-1">{char.job} • {char.city}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-[#4ade80] drop-shadow-md">R$ {char.money.toLocaleString()}</p>
          <p className="text-[10px] uppercase font-black opacity-50 tracking-widest">Saldo</p>
        </div>
      </header>

      {/* JOURNAL */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] space-y-12 border-b border-slate-100">
        {(Object.entries(groupedLogs) as [string, string[]][]).map(([year, messages]) => (
          <div key={year} className="animate-fadeIn">
            <h3 className="text-[#0066cc] font-black text-3xl mb-5 border-b-8 border-white pb-2 italic tracking-tighter">Idade: {year} anos</h3>
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <p key={idx} className="text-slate-800 leading-relaxed font-bold pl-5 border-l-8 border-[#0066cc]/20 mb-5 text-xl bg-white p-5 rounded-r-[2rem] shadow-sm italic">{m}</p>
              ))}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-10">
            <span className="text-9xl mb-4">👶</span>
            <p className="font-black text-2xl">O começo de tudo...</p>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="bg-[#f1f5f9] py-12 relative flex justify-center border-t-2 border-slate-200">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-around px-8 pointer-events-none">
          <div className="flex flex-col items-center pointer-events-auto">
            <button className="w-16 h-16 bg-[#ff8c00] text-white rounded-full shadow-2xl flex items-center justify-center text-3xl border-4 border-white transition-all hover:scale-110">💼</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Emprego</span>
          </div>
          <div className="flex flex-col items-center pointer-events-auto">
            <button className="w-16 h-16 bg-[#00bfff] text-white rounded-full shadow-2xl flex items-center justify-center text-3xl border-4 border-white transition-all hover:scale-110">💰</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Ativos</span>
          </div>
          <div className="w-24"></div>
          <div className="flex flex-col items-center pointer-events-auto">
            <button className="w-16 h-16 bg-[#00ced1] text-white rounded-full shadow-2xl flex items-center justify-center text-3xl border-4 border-white transition-all hover:scale-110">❤️</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Social</span>
          </div>
          <div className="flex flex-col items-center pointer-events-auto">
            <button onClick={() => setGameState(GameState.ACTIVITIES_MENU)} className="w-16 h-16 bg-[#4169e1] text-white rounded-full shadow-2xl flex items-center justify-center text-3xl border-4 border-white transition-all hover:scale-110 hover:rotate-12">💬</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Lazer</span>
          </div>
        </div>
        <button onClick={passYear} disabled={isProcessing} className="w-32 h-32 bg-[#4ade80] hover:bg-[#22c55e] text-white rounded-full shadow-[0_20px_40px_rgba(74,222,128,0.4)] flex flex-col items-center justify-center border-8 border-white active:scale-95 transition-all disabled:opacity-50 z-10">
          <span className="text-7xl font-black mb-[-15px]">{isProcessing ? '...' : '+'}</span>
          <span className="text-[12px] font-black uppercase tracking-widest">IDADE</span>
        </button>
      </div>

      {/* STATUS BARS */}
      <footer className="bg-white p-6 grid gap-4 border-t-4 border-slate-100">
        <Stat label="Felicidade" value={char.happiness} color="bg-yellow-400" />
        <Stat label="Saúde" value={char.health} color="bg-green-500" />
        <Stat label="Intelecto" value={char.intellect} color="bg-purple-500" />
        <Stat label="Aparência" value={char.appearance} color="bg-pink-400" />
      </footer>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="flex items-center space-x-4">
    <div className="w-28 text-right font-black text-[#0066cc] text-[11px] uppercase tracking-tighter">{label}</div>
    <div className="flex-1 bg-slate-100 h-5 rounded-full border-2 border-slate-50 overflow-hidden shadow-inner">
      <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default App;
