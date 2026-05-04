import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Trophy, 
  Lightbulb,
  Scale as ScaleIcon,
  HelpCircle,
  Zap
} from 'lucide-react';

// Types
type Difficulty = 'easy' | 'medium' | 'hard';

interface UnitBlock {
  id: string;
  weight: number;
}

interface SideState {
  xCount: number;
  units: UnitBlock[];
}

export default function App() {
  // Global State
  const [left, setLeft] = useState<SideState>({ xCount: 0, units: [] });
  const [right, setRight] = useState<SideState>({ xCount: 0, units: [] });
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [targetX, setTargetX] = useState<number>(() => Math.floor(Math.random() * 10) + 2); 
  const [userGuess, setUserGuess] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [userEquation, setUserEquation] = useState<string>('');
  const [equationFeedback, setEquationFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [showHelp, setShowHelp] = useState(false);
  const [isBalanced, setIsBalanced] = useState(true);

  // Derived Values
  const leftUnitWeight = useMemo(() => left.units.reduce((sum, u) => sum + u.weight, 0), [left.units]);
  const rightUnitWeight = useMemo(() => right.units.reduce((sum, u) => sum + u.weight, 0), [right.units]);
  
  const leftWeight = useMemo(() => left.xCount * targetX + leftUnitWeight, [left.xCount, targetX, leftUnitWeight]);
  const rightWeight = useMemo(() => right.xCount * targetX + rightUnitWeight, [right.xCount, targetX, rightUnitWeight]);
  
  const tiltAngle = useMemo(() => {
    const diff = rightWeight - leftWeight;
    if (diff === 0) return 0;
    const sensitivity = 3;
    const angle = Math.max(Math.min(diff * sensitivity, 15), -15);
    return angle;
  }, [leftWeight, rightWeight]);

  useEffect(() => {
    setIsBalanced(Math.abs(leftWeight - rightWeight) < 0.01);
  }, [leftWeight, rightWeight]);

  // Actions
  const addX = (side: 'left' | 'right', delta: number) => {
    const setter = side === 'left' ? setLeft : setRight;
    setter(prev => ({
      ...prev,
      xCount: Math.max(0, prev.xCount + delta)
    }));
    setFeedback({ type: null, message: '' });
  };

  const addUnit = (side: 'left' | 'right', weight: number) => {
    const setter = side === 'left' ? setLeft : setRight;
    setter(prev => ({
      ...prev,
      units: [...prev.units, { id: Math.random().toString(36).substr(2, 9), weight }]
    }));
    setFeedback({ type: null, message: '' });
  };

  const removeUnit = (side: 'left' | 'right', weight: number) => {
    const setter = side === 'left' ? setLeft : setRight;
    setter(prev => {
      const index = prev.units.findLastIndex(u => u.weight === weight);
      if (index === -1) return prev;
      const newUnits = [...prev.units];
      newUnits.splice(index, 1);
      return { ...prev, units: newUnits };
    });
    setFeedback({ type: null, message: '' });
  };

  const generateChallenge = (lvl: Difficulty = difficulty) => {
    setDifficulty(lvl);
    let newX, a, b, c, d;

    if (lvl === 'easy') {
      newX = Math.floor(Math.random() * 8) + 2;
      a = Math.floor(Math.random() * 2) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      c = 0;
      d = a * newX + b;
    } else if (lvl === 'medium') {
      newX = Math.floor(Math.random() * 10) + 2;
      a = Math.floor(Math.random() * 3) + 2;
      c = Math.floor(Math.random() * (a - 1)) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      d = (a - c) * newX + b;
    } else {
      newX = Math.floor(Math.random() * 15) + 5;
      a = Math.floor(Math.random() * 4) + 4;
      c = Math.floor(Math.random() * 3) + 1;
      b = Math.floor(Math.random() * 20) + 5;
      d = (a - c) * newX + b;
    }

    setTargetX(newX);

    const getUnitBlocks = (total: number) => {
      const blocks: UnitBlock[] = [];
      let rem = total;
      while(rem > 0) {
        let w = 1;
        if (rem >= 10) w = 10;
        else if (rem >= 5) w = 5;
        else if (rem >= 2) w = 2;
        blocks.push({ id: Math.random().toString(36).substr(2, 9), weight: w });
        rem -= w;
      }
      return blocks;
    };

    // Decide if it starts unbalanced (50% chance)
    const isUnbalancedStart = Math.random() > 0.5;
    
    if (isUnbalancedStart) {
      const missingWeight = Math.floor(Math.random() * 5) + 1;
      // Subtract from right side units
      setLeft({ xCount: a, units: getUnitBlocks(b) });
      setRight({ xCount: c, units: getUnitBlocks(Math.max(0, d - missingWeight)) });
      setFeedback({ type: 'error', message: 'Timbangan tidak seimbang! Tambahkan beban agar seimbang dulu.' });
    } else {
      setLeft({ xCount: a, units: getUnitBlocks(b) });
      setRight({ xCount: c, units: getUnitBlocks(d) });
      setFeedback({ type: null, message: `Tantangan ${lvl === 'easy' ? 'Mudah' : lvl === 'medium' ? 'Sedang' : 'Sulit'}! Cari X.` });
    }

    setUserGuess('');
    setUserEquation('');
    setEquationFeedback({ type: null, message: '' });
  };

  const reset = () => {
    setLeft({ xCount: 0, units: [] });
    setRight({ xCount: 0, units: [] });
    setUserGuess('');
    setUserEquation('');
    setEquationFeedback({ type: null, message: '' });
    setFeedback({ type: null, message: 'Timbangan dikosongkan.' });
  };

  const checkEquation = () => {
    if (!isBalanced) {
      setEquationFeedback({ type: 'error', message: 'Seimbangkan timbangan dulu!' });
      return;
    }
    const normalized = userEquation.replace(/\s+/g, '').toLowerCase();
    const sides = normalized.split('=');
    if (sides.length !== 2) {
      setEquationFeedback({ type: 'error', message: 'Gunakan tanda "=".' });
      return;
    }
    const checkSide = (str: string, xCount: number, weight: number) => {
      if (xCount === 0 && weight === 0) return str === '0';
      if (xCount === 0) return str === weight.toString();
      const xTerm = xCount === 1 ? 'x' : `${xCount}x`;
      const wTerm = weight.toString();
      if (weight === 0) return str === xTerm;
      return str === `${xTerm}+${wTerm}` || str === `${wTerm}+${xTerm}`;
    };
    if (checkSide(sides[0], left.xCount, leftUnitWeight) && checkSide(sides[1], right.xCount, rightUnitWeight)) {
      setEquationFeedback({ type: 'success', message: 'Persamaan tepat!' });
    } else {
      setEquationFeedback({ type: 'error', message: 'Persamaan belum sesuai.' });
    }
  };

  const checkSolution = () => {
    const guessNum = parseInt(userGuess);
    if (isNaN(guessNum)) {
      setFeedback({ type: 'error', message: 'Masukkan angka!' });
      return;
    }
    if (!isBalanced) {
       setFeedback({ type: 'error', message: 'Seimbangkan dulu!' });
       return;
    }
    if (guessNum === targetX) {
      setFeedback({ type: 'success', message: `Benar! X adalah ${targetX}` });
    } else {
      setFeedback({ type: 'error', message: `Maaf, X = ${guessNum} salah.` });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans text-[#2D2D2D] p-4 md:p-8 flex flex-col items-center">
      {/* Header with Top Controls */}
      <header className="w-full max-w-5xl flex flex-col items-center mb-8">
        <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD700] rounded-2xl shadow-lg rotate-3">
              <ScaleIcon className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
                Timbangan <span className="text-[#FF4E00]">SPLSV</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Zap className="w-3 h-3 text-purple-500 fill-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Level: {difficulty}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white p-1 rounded-2xl border border-gray-200 flex gap-1 shadow-sm">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((lvl) => (
                <button 
                  key={lvl}
                  onClick={() => generateChallenge(lvl)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    difficulty === lvl 
                      ? 'bg-purple-600 text-white shadow-md' 
                      : 'bg-transparent text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {lvl === 'easy' ? 'Mudah' : lvl === 'medium' ? 'Sedang' : 'Sulit'}
                </button>
              ))}
            </div>
            <button onClick={reset} className="px-6 py-3 bg-white rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
              Bersihkan
            </button>
            <button onClick={() => setShowHelp(true)} className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 transition-all">
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Simulation Area - Classic Hanging Pan Style */}
      <div className="relative w-full max-w-5xl aspect-[16/10] md:aspect-[21/10] flex items-center justify-center mb-8 bg-white/30 rounded-[3rem] border border-white/50 backdrop-blur-sm shadow-inner overflow-hidden">
        {/* Balance Status Indicator - Moved to top center */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-gray-100 shadow-lg">
          <div className={`w-3 h-3 rounded-full ${isBalanced ? 'bg-[#4CAF50] animate-pulse' : 'bg-[#FF4E00] shadow-[0_0_10px_#FF4E00]'}`} />
          <span className="text-xs font-black uppercase tracking-widest text-[#2D2D2D]">
            {isBalanced ? 'Timbangan Seimbang' : 'Timbangan Miring'}
          </span>
        </div>

        <svg viewBox="0 0 800 450" className="w-full h-full drop-shadow-xl overflow-visible">
          {/* Base Stand */}
          <path d="M380 430 L420 430 L405 100 L395 100 Z" fill="#4A4A4A" />
          <rect x="330" y="420" width="140" height="20" rx="10" fill="#2D2D2D" />
          
          <motion.g animate={{ rotate: tiltAngle }} transition={{ type: 'spring', stiffness: 35, damping: 10 }} style={{ originX: '400px', originY: '100px' }}>
            {/* Main Bar */}
            <rect x="80" y="90" width="640" height="15" rx="7.5" fill="#6B6B6B" />
            <circle cx="400" cy="97" r="12" fill="#2D2D2D" />
            
            {/* Left Hanging Pan */}
            <g transform="translate(130, 100)">
              {/* Chains/Cords */}
              <line x1="0" y1="0" x2="-60" y2="150" stroke="#8E9299" strokeWidth="2" />
              <line x1="0" y1="0" x2="60" y2="150" stroke="#8E9299" strokeWidth="2" />
              
              {/* Pan Basket */}
              <path d="M-80 150 L80 150 L60 180 L-60 180 Z" fill="#D1D1D1" />
              <rect x="-80" y="150" width="160" height="5" fill="#A0A0A0" rx="2" />
              
              {/* Left Objects - Stacked from Pan Bottom Upwards */}
              <foreignObject x="-75" y="-210" width="150" height="360">
                <div className="flex flex-wrap content-end justify-center h-full gap-1 p-1">
                  <AnimatePresence>
                    {Array.from({ length: left.xCount }).map((_, i) => (
                      <motion.div key={`lx-${i}`} initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }} className="w-10 h-10 bg-[#4CAF50] rounded-lg flex items-center justify-center text-lg text-white font-black shadow-lg border-b-4 border-green-700 shrink-0">X</motion.div>
                    ))}
                    {left.units.map((u) => (
                      <motion.div 
                        key={u.id} 
                        initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }} 
                        className={`
                          ${u.weight === 1 ? 'w-5 h-5 text-[10px]' : u.weight === 2 ? 'w-6 h-6 text-xs' : u.weight === 5 ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'} 
                          bg-[#FFD700] rounded-lg flex items-center justify-center text-[#1A1A1A] font-black shadow-md border-b-2 border-[#C0A000] shrink-0
                        `}
                      >
                        {u.weight}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </foreignObject>
            </g>

            {/* Right Hanging Pan */}
            <g transform="translate(670, 100)">
              {/* Chains/Cords */}
              <line x1="0" y1="0" x2="-60" y2="150" stroke="#8E9299" strokeWidth="2" />
              <line x1="0" y1="0" x2="60" y2="150" stroke="#8E9299" strokeWidth="2" />
              
              {/* Pan Basket */}
              <path d="M-80 150 L80 150 L60 180 L-60 180 Z" fill="#D1D1D1" />
              <rect x="-80" y="150" width="160" height="5" fill="#A0A0A0" rx="2" />
              
              {/* Right Objects - Stacked from Pan Bottom Upwards */}
              <foreignObject x="-75" y="-210" width="150" height="360">
                <div className="flex flex-wrap content-end justify-center h-full gap-1 p-1">
                  <AnimatePresence>
                    {Array.from({ length: right.xCount }).map((_, i) => (
                      <motion.div key={`rx-${i}`} initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }} className="w-10 h-10 bg-[#4CAF50] rounded-lg flex items-center justify-center text-lg text-white font-black shadow-lg border-b-4 border-green-700 shrink-0">X</motion.div>
                    ))}
                    {right.units.map((u) => (
                      <motion.div 
                        key={u.id} 
                        initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0, opacity: 0 }} 
                        className={`
                          ${u.weight === 1 ? 'w-5 h-5 text-[10px]' : u.weight === 2 ? 'w-6 h-6 text-xs' : u.weight === 5 ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'} 
                          bg-[#FFD700] rounded-lg flex items-center justify-center text-[#1A1A1A] font-black shadow-md border-b-2 border-[#C0A000] shrink-0
                        `}
                      >
                        {u.weight}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </foreignObject>
            </g>
          </motion.g>
        </svg>
      </div>

      {/* Equation Builder area */}
      <div className="w-full max-w-2xl mb-8 flex flex-col items-center gap-4 bg-white/50 p-6 md:p-8 rounded-[2.5rem] border border-white shadow-sm">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tulis Persamaan (Saat Seimbang)</label>
        <div className="flex w-full flex-col sm:flex-row gap-3">
          <input 
            type="text"
            value={userEquation}
            onChange={(e) => setUserEquation(e.target.value)}
            placeholder="Contoh: 2x + 5 = 11"
            className="flex-1 bg-white border-2 border-[#E5E5E5] rounded-2xl px-6 py-4 text-xl font-mono text-center outline-none focus:border-purple-400 transition-all shadow-sm"
          />
          <button 
            onClick={checkEquation}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 sm:py-0 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            Cek Persamaan
          </button>
        </div>
        <AnimatePresence mode="wait">
          {equationFeedback.type && (
            <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`text-xs font-black uppercase tracking-tight ${equationFeedback.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
              {equationFeedback.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Side Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mb-12">
        <SideControls 
          side="left" 
          state={left} 
          onAddX={(d: number) => addX('left', d)} 
          onAddUnit={(w: number) => addUnit('left', w)} 
          onRemoveUnit={(w: number) => removeUnit('left', w)}
          color="bg-blue-500"
        />
        <SideControls 
          side="right" 
          state={right} 
          onAddX={(d: number) => addX('right', d)} 
          onAddUnit={(w: number) => addUnit('right', w)} 
          onRemoveUnit={(w: number) => removeUnit('right', w)}
          color="bg-red-500"
        />
      </div>

      {/* Solver Section */}
      <div className="w-full max-w-xl bg-[#2D2D2D] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden border-8 border-white/5">
        <div className="flex flex-col items-center mb-6">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Cari Nilai X</h3>
          <h2 className="text-2xl font-black">Berapakah Nilai X?</h2>
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="number" 
              value={userGuess}
              onChange={(e) => setUserGuess(e.target.value)}
              placeholder="X = ?"
              className="flex-1 bg-[#3A3A3A] border-2 border-[#4A4A4A] focus:border-[#4CAF50] rounded-2xl px-6 py-4 text-3xl font-black text-center outline-none transition-all placeholder:text-gray-700"
            />
            <button 
              onClick={checkSolution}
              className="bg-[#4CAF50] hover:bg-[#45a049] text-white px-10 py-5 sm:py-0 rounded-2xl font-black text-sm uppercase tracking-widest transition-all transform active:scale-95 shadow-xl shadow-green-900/20 whitespace-nowrap"
            >
              Cek Nilai X
            </button>
          </div>

          <AnimatePresence mode="wait">
            {feedback.type && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className={`flex items-center justify-center gap-3 p-5 rounded-2xl font-black uppercase text-xs tracking-widest ${feedback.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
                {feedback.type === 'success' ? <Trophy className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      <footer className="mt-16 pb-8 text-[#A0A0A0] text-[10px] font-black uppercase tracking-[0.3em] text-center opacity-50">
        Edu-Scale v2.0 &bull; 2026 Simulation
      </footer>
    </div>
  );
}

function SideControls({ side, state, onAddX, onAddUnit, onRemoveUnit, color }: any) {
  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 transition-all hover:shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A0A0A0] flex items-center gap-2">
          <span className={`w-2 h-2 ${color} rounded-full`} /> {side === 'left' ? 'Sisi Kiri' : 'Sisi Kanan'}
        </h3>
        <ScaleIcon className="w-4 h-4 text-gray-200" />
      </div>
      
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#4CAF50] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-green-100 border-b-4 border-green-700 relative group">
              X
            </div>
            <div>
              <p className="font-black text-sm text-gray-800">Variabel X</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Input Satuan</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <button onClick={() => onAddX(-1)} className="p-3 hover:bg-white hover:shadow-md hover:text-red-500 rounded-xl text-gray-400 transition-all"><Minus className="w-5 h-5" /></button>
            <button onClick={() => onAddX(1)} className="p-3 bg-[#4CAF50] text-white hover:bg-[#45a049] rounded-xl shadow-lg shadow-green-200 transition-all"><Plus className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 justify-center">
             <div className="h-px flex-1 bg-gray-100" />
             <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Pilih Beban Satuan</p>
             <div className="h-px flex-1 bg-gray-100" />
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 5, 10].map((w) => (
              <div key={w} className="flex flex-col gap-2">
                <button onClick={() => onAddUnit(w)} className="bg-[#FFD700] hover:bg-[#FFC800] text-[#1A1A1A] py-4 rounded-2xl font-black shadow-lg shadow-yellow-50 border-b-4 border-[#C0A000] active:border-b-0 active:translate-y-1 transition-all text-sm">+{w}</button>
                <button onClick={() => onRemoveUnit(w)} className="text-gray-400 hover:text-red-400 text-[9px] font-black uppercase tracking-tighter transition-colors">Hapus {w}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ isOpen, onClose }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-10 max-w-xl shadow-2xl relative border-8 border-gray-50" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-yellow-400 rounded-2xl rotate-3 shadow-lg">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-gray-800">Tips Master SPLSV</h2>
            </div>
            
            <div className="space-y-6">
              {[
                { title: 'Level Permainan', text: 'Pilih tingkat kesulitan di atas. Semakin sulit, semakin banyak variabel X di kedua sisi!' },
                { title: 'Seimbangkan Dulu', text: 'Jika soal mulai tidak seimbang, tambahkan atau kurangi beban hingga timbangan lurus. Ini syarat sebelum menebak X.' },
                { title: 'Tulis Persamaan', text: 'Lihat jumlah X dan satuan di kiri/kanan, masukkan ke kotak persamaan (Misal: 2x + 4 = 10).' }
              ].map((tip, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="w-10 h-10 shrink-0 bg-blue-500 text-white flex items-center justify-center rounded-2xl font-black text-lg shadow-lg group-hover:rotate-12 transition-transform">{i+1}</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-1">{tip.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={onClose} className="mt-12 w-full bg-gradient-to-r from-gray-800 to-black text-white py-5 rounded-[2rem] font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl">SIAP BELAJAR!</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
