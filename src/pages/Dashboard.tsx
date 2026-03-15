import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ── Icons ─────────────────────────────────────── */
function IconAnalisis() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconSalas() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconUnirse() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ── Dashboard Components ─────────────────────── */


/* ── Quick Action Card ────────────────────────── */

/* ── Main content components ───────────────────── */
function QuickActionCard({ icon, title, description, isDashed, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: isDashed ? '1.5px dashed #e5e7eb' : '1px solid #e5e7eb',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#185FA5';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDashed ? '#e5e7eb' : '#e5e7eb';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        backgroundColor: isDashed ? '#f8fafc' : '#E6F1FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#185FA5'
      }}>
        {icon}
      </div>
      <div>
        <h4 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{title}</h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{description}</p>
      </div>
    </div>
  );
}

/* ── Dashboard Component ────────────────────────── */
const mockEmpresas = [
  {
    id: 1,
    nombre: 'Banco de Desarrollo del Ecuador',
    tipo: 'Financiera' as const,
    estados: [
      { id: 1, nombre: 'Balance General', periodo: '2025', fecha: '31/12/2025' },
      { id: 2, nombre: 'Estado de P&G', periodo: '2025', fecha: '31/12/2025' },
    ]
  },
  {
    id: 2,
    nombre: 'Comercial Los Andes S.A.',
    tipo: 'Comercial' as const,
    estados: [
      { id: 4, nombre: 'Balance General', periodo: '2024', fecha: '31/12/2024' },
    ]
  }
];

function SummaryCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', backgroundColor: '#E6F1FB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
      </div>
    </div>
  );
}

/* ── Dashboard Component ────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nombrePersona, setNombrePersona] = useState('');

  useEffect(() => {
    async function getPersona() {
      if (!user) return;
      try {
        const { data } = await supabase.from('personas').select('nombre').eq('id', user.id).maybeSingle();
        if (data) setNombrePersona(data.nombre || '');
      } catch (err) { console.error(err); }
    }
    getPersona();
  }, [user]);

  return (
    <>
      <style>{`
        .grid-summary { display: flex; gap: 1.5rem; margin-bottom: 2.5rem; }
        .grid-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
        @media (max-width: 768px) {
          .grid-summary { flex-direction: column; }
          .grid-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dashboard-content">
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Bienvenido de nuevo, {nombrePersona.split(' ')[0]} 👋</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Esto es lo que está pasando en tu panel hoy.</p>
        </header>

        <div className="grid-summary">
          <SummaryCard label="Empresas" value="2" icon={<IconEmpresas />} />
          <SummaryCard label="Análisis" value="4" icon={<IconAnalisis />} />
          <SummaryCard label="Sala activa" value="1" icon={<IconSalas />} />
        </div>

        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '16px', letterSpacing: '0.05em' }}>ACCIONES RÁPIDAS</div>
        <div className="grid-actions">
          <QuickActionCard 
            icon={<IconPlus />} 
            title="Nueva empresa" 
            description="Registra una empresa para comenzar a analizar sus estados financieros."
            onClick={() => navigate('/dashboard/analisis', { state: { openModal: true } })}
          />
          <QuickActionCard 
            icon={<IconUnirse />} 
            title="Unirse a sala" 
            description="Usa un código compartido para colaborar en análisis en tiempo real."
            isDashed={true}
            onClick={() => navigate('/dashboard/unirse')}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>MIS EMPRESAS RECIENTES</span>
          <span onClick={() => navigate('/dashboard/analisis')} style={{ fontSize: '13px', color: '#185FA5', fontWeight: 600, cursor: 'pointer' }}>Ver todas →</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
          {mockEmpresas.map(emp => (
            <div key={emp.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', cursor: 'pointer' }} onClick={() => navigate('/dashboard/analisis')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {emp.tipo === 'Financiera' ? '🏦' : '🏪'}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{emp.nombre}</h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: emp.tipo === 'Financiera' ? '#185FA5' : '#b45309', backgroundColor: emp.tipo === 'Financiera' ? '#E6F1FB' : '#fff7ed', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{emp.tipo}</span>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>{emp.estados.length} estados financieros registrados</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function IconEmpresas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
      <path d="M5 21V10.12" /><path d="M19 21V10.12" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
    </svg>
  );
}

