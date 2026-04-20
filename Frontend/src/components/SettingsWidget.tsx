import { motion } from 'framer-motion';
import { Settings, Sun, Palette, ShieldCheck } from 'lucide-react';

export const SettingsWidget = ({ user, isActive, onClick }: { user: any, isActive: boolean, onClick: () => void }) => {
  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ 
        opacity: isActive ? 1 : 0, 
        y: isActive ? 0 : -20 
      }}
      onClick={onClick}
      className="glass-panel"
      style={{
        padding: '0.8rem 1.2rem',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.2rem',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
      whileHover={{ background: 'rgba(255, 255, 255, 0.06)', scale: 1.02 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: user.accentColor || 'var(--accent-primary)',
          boxShadow: `0 0 10px ${user.accentColor || 'var(--accent-primary)'}80`,
          border: '2px solid rgba(255,255,255,0.2)'
        }} />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode</span>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Sun size={16} color="var(--accent-primary)" />
        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.appBrightness ?? 100}%</span>
      </div>

      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={16} color="#4ade80" />
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#4ade80' }}>Secured</span>
      </div>

      <div style={{ 
        marginLeft: '0.5rem',
        padding: '0.4rem',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Settings size={14} color="white" opacity={0.6} />
      </div>
    </motion.div>
  );
};
