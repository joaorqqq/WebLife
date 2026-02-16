
import React, { useEffect, useState, useRef } from 'react';

interface Props {
  isAnarchy: boolean;
  onSuccess: () => void;
  onFail: () => void;
}

const MinigameBribery: React.FC<Props> = ({ isAnarchy, onSuccess, onFail }) => {
  const [pos, setPos] = useState(0);
  const [direction, setDirection] = useState(1);
  const speed = 4;
  const targetWidth = isAnarchy ? 40 : 15; // Anarchy makes it easier
  const targetPos = 50;

  useEffect(() => {
    const interval = setInterval(() => {
      setPos(prev => {
        let next = prev + direction * speed;
        if (next > 100 || next < 0) {
          setDirection(d => -d);
          return prev;
        }
        return next;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [direction]);

  const handleStop = () => {
    if (pos >= targetPos - targetWidth && pos <= targetPos + targetWidth) {
      onSuccess();
    } else {
      onFail();
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-emerald-400">Bribery: Stop the Meter!</h2>
      <div className="w-full h-8 bg-slate-900 rounded-full relative overflow-hidden border border-slate-600 mb-8">
        {/* Target Zone */}
        <div 
          className="absolute h-full bg-emerald-500 opacity-50"
          style={{ left: `${targetPos - targetWidth}%`, width: `${targetWidth * 2}%` }}
        />
        {/* Cursor */}
        <div 
          className="absolute h-full w-2 bg-white shadow-[0_0_10px_white]"
          style={{ left: `${pos}%` }}
        />
      </div>
      <button 
        onClick={handleStop}
        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all"
      >
        STOP!
      </button>
      <p className="mt-4 text-sm text-slate-400">
        {isAnarchy ? "Anarchy active: The target zone is wider!" : "Hit the target zone to pay off the guard."}
      </p>
    </div>
  );
};

export default MinigameBribery;
