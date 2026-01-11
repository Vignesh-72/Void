import React, { useEffect, useState, useRef } from 'react';

export default function IntroAnimation({ onComplete }) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const [stage, setStage] = useState('waiting');
  const [particles, setParticles] = useState([]); // For blast debris
  const audioContextRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // --- 1. VISUAL ASSETS (STARS - UNTOUCHED) ---
  const stars = React.useMemo(() => {
    return [...Array(200)].map((_, i) => {
      const widthSpread = window.innerWidth + 200;
      const heightSpread = window.innerHeight + 200;
      
      const x = (Math.random() - 0.5) * widthSpread;
      const y = (Math.random() - 0.5) * heightSpread;
      
      const size = 0.5 + Math.random() * 3; 
      const duration = 1.0 + Math.random() * 1.5; 
      const delay = Math.random() * 1.0; 

      return { id: i, x, y, size, duration, delay };
    });
  }, []);

  // --- 2. CHAOTIC BLAST PARTICLES ---
  const generateBlastParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 300; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 50; 
      const size = 1 + Math.random() * 8;
      const life = 0.2 + Math.random() * 0.6; 
      newParticles.push({ id: i, angle, speed, size, life, progress: 0 });
    }
    setParticles(newParticles);
  };

  // --- 3. HAPTIC FEEDBACK HELPER ---
  const triggerHaptic = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore errors on unsupported devices
      }
    }
  };

  // --- 4. AUDIO ENGINE ---
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
  };

  const playSound = (type, duration) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'suction') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + duration);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.15, now + duration - 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } 
    else if (type === 'rumble') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.linearRampToValueAtTime(40, now + duration);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + duration);
    }
    else if (type === 'blast') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.4);
      gain.gain.setValueAtTime(0.8, now); 
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    }
    else if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    }

    osc.start();
    osc.stop(now + duration + 0.5);
  };

  const startSequence = () => {
    initAudio();
    setHasInteracted(true);
    setStage('absorbing');
    playSound('suction', 2.5);
    triggerHaptic(10);
  };

  // --- 5. TIMELINE ---
  useEffect(() => {
    if (!hasInteracted) return;

    // 2.5s: Unstable
    const unstableTimer = setTimeout(() => {
      setStage('unstable');
      playSound('rumble', 0.7);
      triggerHaptic([30, 30, 30, 30, 30, 30, 30, 30, 30]); 
    }, 2500);

    // 3.2s: Blast
    const blastTimer = setTimeout(() => {
      setStage('blast');
      generateBlastParticles();
      playSound('blast', 1.0);
      triggerHaptic(150);
    }, 3200);

    // 3.4s: Reveal
    const revealTimer = setTimeout(() => {
      setStage('reveal');
      playSound('scan', 1.5);
    }, 3400);

    const exitTimer = setTimeout(() => setStage('exit'), 6500);
    const finishTimer = setTimeout(() => {
        if (onCompleteRef.current) onCompleteRef.current();
    }, 7500);

    return () => {
      clearTimeout(unstableTimer);
      clearTimeout(blastTimer);
      clearTimeout(revealTimer);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [hasInteracted]);

  // Particle Loop
  useEffect(() => {
    if (stage !== 'blast') return;
    let frame;
    let start = Date.now();
    const loop = () => {
      const elapsed = (Date.now() - start) / 1000;
      setParticles(prev => prev.map(p => ({ ...p, progress: Math.min(elapsed / p.life, 1) })));
      if (elapsed < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [stage]);

  return (
    <div className={`
      fixed inset-0 z-[100] flex items-center justify-center overflow-hidden
      transition-colors duration-500 ease-out
      ${stage === 'blast' ? 'bg-white duration-0' : 'bg-black'} 
      ${stage === 'exit' ? 'pointer-events-none' : ''}
    `}>
      
      <style>{`
        @keyframes suckIn {
          /* CHANGED: Start from opacity 0 for cinematic fade-in */
          0% { transform: translate(var(--startX), var(--startY)) scale(1); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(0, 0) scale(0); opacity: 0; }
        }
        
        @keyframes violentShake {
          0% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(-30px, 30px) scale(1.5); }
          50% { transform: translate(30px, -30px) scale(0.5); }
          75% { transform: translate(-30px, -30px) scale(1.4); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        
        .animate-suckIn { animation: suckIn 2.5s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; animation-delay: var(--delay)s; }
        .animate-violentShake { animation: violentShake 0.04s infinite linear; }
        .animate-glitch { animation: glitch 0.3s ease-in-out infinite; }
      `}</style>

      {/* START BUTTON */}
      {!hasInteracted && (
        <button 
          onClick={startSequence}
          className="group relative z-50 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-1000 cursor-pointer"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-black border border-white/20 rounded-full flex items-center justify-center group-hover:border-white transition-colors">
               <img 
                 src="/logotrans.png" 
                 alt=" " 
                 className="w-8 h-8 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
               />
            </div>
          </div>
          <p className="text-xs font-mono text-slate-500 tracking-[0.3em] uppercase group-hover:text-white transition-colors">
            Press To Start
          </p>
        </button>
      )}

      {/* ANIMATION CONTENT */}
      {hasInteracted && (
        <>
          {/* SCENE 1 & 2: WHITE HOLE + STARS */}
          {(stage === 'absorbing' || stage === 'unstable') && (
            // CHANGED: Added animate-in wrapper to gently reveal the whole scene
            <div className="relative flex items-center justify-center animate-in fade-in zoom-in duration-1000 ease-out">
              
              {/* THE STARS */}
              {(stage === 'absorbing' || stage === 'unstable') && stars.map(star => (
                <div 
                  key={star.id}
                  className="absolute bg-white rounded-full animate-suckIn"
                  style={{
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    '--startX': `${star.x}px`,
                    '--startY': `${star.y}px`,
                    '--delay': `${star.delay}s`,
                    boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, 0.8)`,
                  }}
                />
              ))}

              {/* THE WHITE HOLE CORE */}
              <div className="relative z-10">
                 <div className={`
                  absolute inset-0 rounded-full blur-2xl bg-white/30
                  /* Smoother transition */
                  transition-all duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1)
                  ${stage === 'absorbing' ? 'scale-100' : 'scale-[2.5] bg-white/50'}
                `} />
                 <div className={`
                  bg-white rounded-full shadow-[0_0_60px_rgba(255,255,255,0.6)]
                  /* Smoother transition */
                  transition-all duration-[2500ms] cubic-bezier(0.4, 0, 0.2, 1)
                  ${stage === 'absorbing' ? 'w-4 h-4' : 'w-40 h-40'}
                  ${stage === 'unstable' ? 'animate-violentShake' : ''}
                `}>
                   {stage === 'unstable' && (
                       <div className="absolute inset-0 bg-black/20 rounded-full animate-pulse" />
                   )}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 3: BLAST */}
          {stage === 'blast' && (
            <>
              {particles.map(p => {
                const tx = Math.cos(p.angle) * p.speed * 100 * p.progress;
                const ty = Math.sin(p.angle) * p.speed * 100 * p.progress;
                return (
                  <div key={p.id} className="absolute bg-black rounded-full"
                    style={{
                      width: `${p.size}px`, height: `${p.size}px`, 
                      left: '50%', top: '50%',
                      transform: `translate(${tx}px, ${ty}px)`,
                      opacity: 1 - p.progress
                    }}
                  />
                );
              })}
            </>
          )}

          {/* STAGE 4: REVEAL TEXT */}
          {(stage === 'reveal' || stage === 'exit') && (
            <div className={`
              flex flex-col items-center justify-center z-10 text-center
              transition-all duration-1000 ease-out
              ${stage === 'exit' ? 'opacity-0 scale-105 blur-xl' : 'opacity-100 scale-100 blur-0'}
            `}>
              
              <div className="relative animate-in slide-in-from-bottom-10 duration-700">
                <h1 className="text-7xl md:text-9xl font-black italic text-white tracking-tighter mb-2 drop-shadow-[0_0_35px_rgba(255,255,255,0.8)] relative z-10 mix-blend-difference">
                  VOID
                </h1>
                <h1 className="text-7xl md:text-9xl font-black italic text-red-500 tracking-tighter absolute top-0 left-[1px] -z-10 opacity-50 animate-glitch">VOID</h1>
                <h1 className="text-7xl md:text-9xl font-black italic text-cyan-500 tracking-tighter absolute top-0 -left-[1px] -z-10 opacity-50 animate-glitch" style={{animationDelay: '0.1s'}}>VOID</h1>
              </div>
              
              <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mb-6 animate-in zoom-in duration-700 delay-300" />
              
              <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-700 delay-500">
                <p className="text-xs md:text-sm font-mono text-slate-400 tracking-[0.5em] uppercase">
                  System Initialization
                </p>
                
                <div className="flex items-center justify-center gap-3 p-3 rounded-lg backdrop-blur-sm bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
                  <div className="relative">
                    <div className="w-2 h-2 bg-white rounded-full animate-ping absolute" />
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#10b981]" />
                  </div>
                  <p className="text-[10px] md:text-xs font-mono text-white tracking-[0.2em] uppercase font-bold">
                    By Vignesh
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}