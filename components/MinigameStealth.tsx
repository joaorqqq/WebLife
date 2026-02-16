
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  onSuccess: () => void;
  onFail: () => void;
}

const MinigameStealth: React.FC<Props> = ({ onSuccess, onFail }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState({ x: 20, y: 150 });
  const [guard, setGuard] = useState({ x: 250, y: 50, dir: 1 });
  const goal = { x: 350, y: 150 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;

    const update = () => {
      // Move guard
      setGuard(prev => {
        let newY = prev.y + prev.dir * 3;
        let newDir = prev.dir;
        if (newY > 250 || newY < 50) newDir *= -1;
        return { ...prev, y: newY, dir: newDir };
      });

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Goal
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(goal.x, goal.y, 30, 30);
      ctx.fillStyle = '#000';
      ctx.fillText("WILL", goal.x + 2, goal.y + 18);

      // Player
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(player.x, player.y, 20, 20);

      // Guard
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(guard.x, guard.y, 20, 20);

      // Guard Vision
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(guard.x - 40, guard.y - 40, 100, 100);

      // Collision Detection
      if (
        player.x < guard.x + 60 &&
        player.x + 20 > guard.x - 40 &&
        player.y < guard.y + 60 &&
        player.y + 20 > guard.y - 40
      ) {
        onFail();
      }

      // Goal Detection
      if (
        player.x < goal.x + 30 &&
        player.x + 20 > goal.x &&
        player.y < goal.y + 30 &&
        player.y + 20 > goal.y
      ) {
        onSuccess();
      }

      animationFrame = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationFrame);
  }, [player, guard]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 10;
    if (e.key === 'ArrowUp') setPlayer(p => ({ ...p, y: Math.max(0, p.y - step) }));
    if (e.key === 'ArrowDown') setPlayer(p => ({ ...p, y: Math.min(280, p.y + step) }));
    if (e.key === 'ArrowLeft') setPlayer(p => ({ ...p, x: Math.max(0, p.x - step) }));
    if (e.key === 'ArrowRight') setPlayer(p => ({ ...p, x: Math.min(380, p.x + step) }));
  };

  return (
    <div className="flex flex-col items-center p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-amber-400">Stealth: Forging the Will</h2>
      <p className="text-sm mb-4 text-slate-400">Avoid the guard's red zone and reach the document!</p>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="bg-slate-900 border-2 border-slate-600 rounded cursor-pointer outline-none"
      />
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div></div>
        <button onClick={() => setPlayer(p => ({ ...p, y: Math.max(0, p.y - 15) }))} className="bg-slate-700 p-2 rounded">↑</button>
        <div></div>
        <button onClick={() => setPlayer(p => ({ ...p, x: Math.max(0, p.x - 15) }))} className="bg-slate-700 p-2 rounded">←</button>
        <button onClick={() => setPlayer(p => ({ ...p, y: Math.min(280, p.y + 15) }))} className="bg-slate-700 p-2 rounded">↓</button>
        <button onClick={() => setPlayer(p => ({ ...p, x: Math.min(380, p.x + 15) }))} className="bg-slate-700 p-2 rounded text-center">→</button>
      </div>
      <p className="mt-4 text-xs italic">Use Arrow Keys or buttons to move.</p>
    </div>
  );
};

export default MinigameStealth;
