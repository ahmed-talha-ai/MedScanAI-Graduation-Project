import React from 'react';

interface DashboardHeroProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  action?: React.ReactNode;
  backButton?: React.ReactNode;
}

export function DashboardHero({ icon, title, subtitle, action, backButton }: DashboardHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-8 shadow-2xl mb-8"
      style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)` }}
    >
      {/* Scoped Keyframes for this component */}
      <style jsx>{`
        @keyframes heroGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes particleFloat1 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-18px) scale(1.1); opacity: 0.6; }
        }
        @keyframes particleFloat2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-12px) rotate(15deg); opacity: 0.5; }
        }
        @keyframes particleFloat3 {
          0%, 100% { transform: translateY(0px); opacity: 0.15; }
          50% { transform: translateY(-20px); opacity: 0.4; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.3); }
          50% { box-shadow: 0 0 0 8px transparent; }
        }
        .hero-gradient { background-size: 200% 200%; animation: heroGradient 8s ease infinite; }
        .particle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.15); pointer-events: none; animation-duration: 4s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        .pulse-glow { animation: pulseGlow 2.5s ease-in-out infinite; }
      `}</style>

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 opacity-30 hero-gradient" />

      {/* Floating particles */}
      <div className="particle" style={{ width: 60, height: 60, top: '-10px', insetInlineEnd: '15%', animationName: 'particleFloat1' }} />
      <div className="particle" style={{ width: 35, height: 35, bottom: '10px', insetInlineStart: '10%', animationName: 'particleFloat2' }} />
      <div className="particle" style={{ width: 20, height: 20, top: '30%', insetInlineEnd: '8%', animationName: 'particleFloat3' }} />

      {/* Blur orbs */}
      <div className="absolute -top-8 -end-8 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-6 -start-6 w-32 h-32 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {backButton && (
            <div className="flex-shrink-0">
              {backButton}
            </div>
          )}
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30 shadow-lg pulse-glow">
            {typeof icon === 'string' ? (
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            ) : (
              <div className="text-white flex items-center justify-center [&>svg]:w-8 [&>svg]:h-8">
                {icon}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-white/80 text-sm md:text-base mt-1 max-w-xl leading-relaxed">{subtitle}</p>
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
