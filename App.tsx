
import React, { useState, useEffect, useRef } from 'react';
import { Character, GlobalEvent, FamilyMember, GameLog, GameState, InteractiveEvent, SocialStats } from './types';
import { COUNTRIES, CITIES_DATA, CHAOS_CHANCE } from './constants';
import { generateFamily, generateYearNarrative, generateInteractiveEvent, resolveEventChoice, generateSocialPostResult } from './services/geminiService';
import MinigameStealth from './components/MinigameStealth';
import MinigameBribery from './components/MinigameBribery';

const INITIAL_SOCIAL: SocialStats = { followers: 0, isVerified: false, isBanned: false, totalPosts: 0 };

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: '📺', color: 'bg-red-600' },
  { id: 'twitch', name: 'Twitch', icon: '👾', color: 'bg-purple-600' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' },
  { id: 'pornhub', name: 'Pornhub', icon: '🍑', color: 'bg-orange-500' },
  { id: 'onlyfans', name: 'OnlyFans', icon: '💎', color: 'bg-blue-400' }
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
    health: 92,
    happiness: 38,
    intellect: 92,
    appearance: 51,
    money: 1803705,
    fame: 0,
    job: 'Corretor da Bolsa Sênior',
    hasBunker: false,
    hasDodo: false,
    socialMedia: {
      youtube: { ...INITIAL_SOCIAL },
      twitch: { ...INITIAL_SOCIAL },
      tiktok: { ...INITIAL_SOCIAL },
      instagram: { ...INITIAL_SOCIAL },
      pornhub: { ...INITIAL_SOCIAL },
      onlyfans: { ...INITIAL_SOCIAL }
    }
  });

  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [currentEvent, setCurrentEvent] = useState<GlobalEvent>(GlobalEvent.NORMAL);
  const [activeTab, setActiveTab] = useState<'status' | 'activities' | 'assets' | 'relations' | 'job'>('status');
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
    const familyData = await generateFamily(char.lastName, char.country);
    setFamily(familyData);
    setGameState(GameState.PLAYING);
    addLog(`Bem-vindo ao WebLife, ${char.firstName}! Sua vida começa agora em ${char.city}, ${char.state}.`, 'success');
  };

  const passYear = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (Math.random() < 0.7) {
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
    let nextHealth = Math.max(0, char.health - (Math.random() * 2));
    let nextHappiness = Math.max(0, Math.min(100, char.happiness + (Math.random() * 6 - 3)));
    
    let socialIncome = 0;
    Object.values(char.socialMedia).forEach(s => {
      if (!s.isBanned) socialIncome += (s.followers * 0.05);
    });

    let nextMoney = char.money + (char.job !== 'Desempregado' ? 45000 : 0) + socialIncome;

    let event = GlobalEvent.NORMAL;
    if (Math.random() < CHAOS_CHANCE) {
      const chaosEvents = [GlobalEvent.GIANTS, GlobalEvent.ZOMBIES, GlobalEvent.ALIENS, GlobalEvent.ANARCHY];
      event = chaosEvents[Math.floor(Math.random() * chaosEvents.length)];
      setCurrentEvent(event);
    } else {
      setCurrentEvent(GlobalEvent.NORMAL);
    }

    if (nextHealth <= 0 || nextAge > 110) {
      setGameState(GameState.GAMEOVER);
      return;
    }

    const narrative = await generateYearNarrative(nextAge, event, char.city);
    addLog(narrative);
    if (socialIncome > 0) addLog(`Suas redes sociais renderam R$ ${socialIncome.toFixed(0)} de lucro este ano!`, 'success');

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

  const postOnSocial = async (platformId: string) => {
    const platform = char.socialMedia[platformId];
    if (platform.isBanned) return alert("Você foi banido desta plataforma!");

    setIsProcessing(true);
    try {
      const result = await generateSocialPostResult(platformId, platform.followers);
      addLog(`[${platformId.toUpperCase()}] ${result.title}: ${result.narrative}`, 'info');
      
      setChar(prev => {
        const updatedSocial = { ...prev.socialMedia };
        updatedSocial[platformId] = {
          ...updatedSocial[platformId],
          followers: Math.max(0, updatedSocial[platformId].followers + result.gainFollowers),
          totalPosts: updatedSocial[platformId].totalPosts + 1
        };
        return {
          ...prev,
          socialMedia: updatedSocial,
          money: prev.money + result.gainMoney,
          happiness: Math.max(0, Math.min(100, prev.happiness + result.gainHappiness))
        };
      });
    } catch (e) { console.error(e); } finally { setIsProcessing(false); }
  };

  const buyFakeFollowers = (platformId: string) => {
    const cost = 5000;
    if (char.money < cost) return alert("Dinheiro insuficiente!");

    setChar(prev => {
      const isCaught = Math.random() < 0.15;
      const updatedSocial = { ...prev.socialMedia };
      
      if (isCaught) {
        updatedSocial[platformId].isBanned = true;
        addLog(`A plataforma ${platformId} detectou seus seguidores fakes e BANIU sua conta!`, 'danger');
      } else {
        updatedSocial[platformId].followers += 10000;
        addLog(`Você comprou 10k seguidores fakes no ${platformId}. Seus números subiram, mas o engajamento é nulo.`, 'info');
      }

      return {
        ...prev,
        money: prev.money - cost,
        socialMedia: updatedSocial
      };
    });
  };

  if (gameState === GameState.SETUP) {
    const selectedCountry = COUNTRIES.find(c => c.name === char.country);
    const availableStates = selectedCountry?.states || [];
    const availableCities = CITIES_DATA[char.state] || [];

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0066cc] p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md text-slate-800">
          <h1 className="text-5xl font-black text-center mb-1 text-[#0066cc] italic tracking-tighter uppercase">WebLife</h1>
          <p className="text-center text-slate-400 mb-8 font-black text-xs uppercase tracking-widest">Chaos Edition</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Nome" 
                className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl outline-none focus:border-[#0066cc] font-bold" 
                onChange={(e) => setChar({...char, firstName: e.target.value})} 
              />
              <input 
                type="text" 
                placeholder="Sobrenome" 
                className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl outline-none focus:border-[#0066cc] font-bold" 
                onChange={(e) => setChar({...char, lastName: e.target.value})} 
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-200">
              <button 
                onClick={() => setGender('Male')}
                className={`flex-1 py-3 rounded-xl font-black transition-all ${gender === 'Male' ? 'bg-[#0066cc] text-white shadow-md' : 'text-slate-400'}`}
              >
                HOMEM
              </button>
              <button 
                onClick={() => setGender('Female')}
                className={`flex-1 py-3 rounded-xl font-black transition-all ${gender === 'Female' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-400'}`}
              >
                MULHER
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase ml-2">Local de Nascimento</label>
              <select 
                className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-[#0066cc]"
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
                className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-[#0066cc]"
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
                className="w-full bg-slate-100 border-2 border-slate-200 p-4 rounded-2xl font-bold outline-none focus:border-[#0066cc]"
                value={char.city}
                onChange={(e) => setChar({...char, city: e.target.value})}
              >
                {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>

            <button 
              onClick={startGame} 
              className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-white font-black py-5 rounded-[2rem] text-xl shadow-xl transition-all active:scale-95"
            >
              COMEÇAR VIDA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === GameState.GAMEOVER) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
        <h1 className="text-6xl font-black text-red-600 mb-4 italic uppercase tracking-tighter">Lápide</h1>
        <div className="bg-white p-12 rounded-[2.5rem] border-4 border-slate-300 shadow-2xl max-w-sm">
          <p className="text-3xl font-black mb-2 text-slate-800">{char.firstName} {char.lastName}</p>
          <p className="text-slate-500 italic mb-4 font-bold">Idade {char.age}</p>
          <p className="text-lg text-slate-600 leading-tight">"Fez história em {char.city}."</p>
          <hr className="my-8 border-slate-100" />
          <p className="text-2xl font-black text-[#4ade80]">R$ {char.money.toLocaleString()}</p>
          <p className="text-[10px] uppercase font-black text-slate-300">Patrimônio Final</p>
        </div>
        <button onClick={() => window.location.reload()} className="mt-10 bg-[#0066cc] text-white px-16 py-5 rounded-full font-black text-xl shadow-xl">RECOMEÇAR</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden border-x border-slate-200 relative">
      {/* INTERACTIVE EVENT OVERLAY */}
      {gameState === GameState.INTERACTIVE_EVENT && pendingEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full rounded-[2.5rem] shadow-2xl p-8 animate-fadeIn border-t-8 border-[#0066cc]">
            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-4">{pendingEvent.title}</h2>
            <p className="text-slate-600 mb-8 font-medium text-lg leading-snug">{pendingEvent.description}</p>
            <div className="space-y-3">
              {pendingEvent.options.map((opt, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleChoice(opt.resultId)} 
                  className="w-full bg-slate-100 hover:bg-[#0066cc] hover:text-white transition-all font-black py-5 rounded-3xl border-2 border-slate-200"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITIES MENU OVERLAY */}
      {gameState === GameState.ACTIVITIES_MENU && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col p-6 animate-fadeIn">
          <div className="flex justify-between items-center mb-8 border-b-4 border-[#0066cc] pb-2">
            <h2 className="text-4xl font-black text-[#0066cc] italic tracking-tighter">ATIVIDADES</h2>
            <button onClick={() => setGameState(GameState.PLAYING)} className="text-4xl bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center">✕</button>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => setGameState(GameState.DIGITAL_CAREERS)}
              className="w-full flex items-center p-6 bg-blue-50 border-2 border-blue-200 rounded-[2rem] hover:bg-blue-100 transition-all shadow-sm"
            >
              <span className="text-4xl mr-5">🤳</span>
              <div className="text-left">
                <p className="font-black text-xl text-blue-900">Carreiras Digitais</p>
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">YouTube, TikTok, OnlyFans...</p>
              </div>
            </button>
            <div className="opacity-30 grayscale pointer-events-none">
              <div className="w-full flex items-center p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem]">
                <span className="text-4xl mr-5">🏥</span>
                <p className="font-black text-xl text-slate-400">Cirurgia Plástica</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL CAREERS MENU OVERLAY */}
      {gameState === GameState.DIGITAL_CAREERS && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center mb-8">
            <button onClick={() => setGameState(GameState.ACTIVITIES_MENU)} className="text-2xl mr-4 bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center">←</button>
            <h2 className="text-3xl font-black text-[#0066cc] italic tracking-tighter">REDES SOCIAIS</h2>
          </div>
          <div className="grid gap-4 pb-10">
            {PLATFORMS.map(p => (
              <div key={p.id} className="bg-white border-2 border-slate-100 rounded-[2rem] p-6 shadow-xl">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center">
                    <div className={`w-14 h-14 ${p.color} text-white rounded-2xl flex items-center justify-center text-3xl mr-4 shadow-lg`}>
                      {p.icon}
                    </div>
                    <div>
                      <p className="font-black text-xl text-slate-800">{p.name}</p>
                      <p className="text-sm text-[#0066cc] font-black uppercase tracking-tighter">
                        {char.socialMedia[p.id].followers.toLocaleString()} seguidores
                      </p>
                    </div>
                  </div>
                  {char.socialMedia[p.id].isBanned && <span className="text-[10px] bg-red-600 text-white px-3 py-1 rounded-full font-black">BANIDO</span>}
                </div>
                
                {!char.socialMedia[p.id].isBanned && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => postOnSocial(p.id)}
                      disabled={isProcessing}
                      className="flex-1 bg-[#0066cc] text-white py-4 rounded-2xl text-sm font-black shadow-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                      POSTAR
                    </button>
                    <button 
                      onClick={() => buyFakeFollowers(p.id)}
                      disabled={isProcessing}
                      className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl text-[10px] font-black border-2 border-slate-200 active:scale-95 transition-all disabled:opacity-50"
                    >
                      COMPRAR FAKES (R$ 5k)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN GAME UI */}
      <header className="bg-[#0066cc] p-5 text-white flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-yellow-200 rounded-2xl flex items-center justify-center text-4xl border-2 border-white shadow-2xl">
            {gender === 'Male' ? '👱‍♂️' : '👩'}
          </div>
          <div>
            <h2 className="font-black text-xl underline decoration-white decoration-2 underline-offset-4">{char.firstName} {char.lastName}</h2>
            <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">{char.job} • {char.city}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#4ade80]">R$ {char.money.toLocaleString()}</p>
          <p className="text-[10px] uppercase font-black opacity-50 tracking-tighter">SALDO BANCÁRIO</p>
        </div>
      </header>

      {/* JOURNAL / LOGS */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-[#fdfdfd] space-y-10 border-b border-slate-100">
        {(Object.entries(groupedLogs) as [string, string[]][]).map(([year, messages]) => (
          <div key={year} className="animate-fadeIn">
            <h3 className="text-[#0066cc] font-black text-2xl mb-4 border-b-4 border-slate-50 pb-2 italic">Idade: {year} anos</h3>
            <div className="space-y-4">
              {messages.map((m, idx) => (
                <p key={idx} className="text-slate-700 leading-relaxed font-bold pl-5 border-l-4 border-[#0066cc]/30 mb-4 text-lg">
                  {m}
                </p>
              ))}
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-10 mt-20">
            <div className="text-9xl mb-4">📖</div>
            <p className="font-black text-2xl italic">Sua história começa agora...</p>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="bg-[#f0f9ff] py-8 relative flex justify-center border-t border-slate-200">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-around px-8 pointer-events-none">
          <div className="flex flex-col items-center pointer-events-auto group">
            <button className="w-14 h-14 bg-[#ff8c00] text-white rounded-full shadow-xl flex items-center justify-center text-2xl border-4 border-white transition-all group-hover:scale-110">💼</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Ocupação</span>
          </div>
          <div className="flex flex-col items-center pointer-events-auto group">
            <button className="w-14 h-14 bg-[#00bfff] text-white rounded-full shadow-xl flex items-center justify-center text-2xl border-4 border-white transition-all group-hover:scale-110">💰</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Ativos</span>
          </div>
          <div className="w-24"></div>
          <div className="flex flex-col items-center pointer-events-auto group">
            <button className="w-14 h-14 bg-[#00ced1] text-white rounded-full shadow-xl flex items-center justify-center text-2xl border-4 border-white transition-all group-hover:scale-110">❤️</button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Relacionar</span>
          </div>
          <div className="flex flex-col items-center pointer-events-auto group">
            <button 
              onClick={() => setGameState(GameState.ACTIVITIES_MENU)}
              className="w-14 h-14 bg-[#4169e1] text-white rounded-full shadow-xl flex items-center justify-center text-2xl border-4 border-white transition-all group-hover:scale-110"
            >
              💬
            </button>
            <span className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">Atividade</span>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <button 
            onClick={passYear}
            disabled={isProcessing}
            className="w-28 h-28 bg-[#4ade80] hover:bg-[#22c55e] text-white rounded-full shadow-[0_15px_30px_rgba(74,222,128,0.4)] flex flex-col items-center justify-center border-4 border-white active:scale-90 transition-all disabled:opacity-50 group"
          >
            <span className="text-6xl font-black mb-[-10px] group-hover:scale-110 transition-transform">{isProcessing ? '...' : '+'}</span>
            <span className="text-[11px] font-black uppercase tracking-tighter">ENVELHECER</span>
          </button>
        </div>
      </div>

      {/* STATUS BARS */}
      <footer className="bg-white p-5 pt-8 border-t-2 border-slate-100 grid gap-3">
        <Stat label="Felicidade" value={char.happiness} color="bg-yellow-400" />
        <Stat label="Saúde" value={char.health} color="bg-green-500" />
        <Stat label="Intelecto" value={char.intellect} color="bg-purple-500" />
        <Stat label="Aparência" value={char.appearance} color="bg-pink-400" />
      </footer>
    </div>
  );
};

const Stat = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="flex items-center space-x-3">
    <div className="w-24 text-right font-black text-[#0066cc] text-[10px] uppercase tracking-tighter">{label}</div>
    <div className="flex-1 bg-slate-100 h-5 rounded-full relative border-2 border-slate-100 overflow-hidden shadow-inner">
      <div className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default App;
