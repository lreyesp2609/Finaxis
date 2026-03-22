import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';

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

function IconEmpresas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3" />
      <path d="M5 21V10.12" /><path d="M19 21V10.12" /><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
    </svg>
  );
}

/* ── Types ─────────────────────────────────────── */
interface Empresa {
  id: number;
  nombre: string;
  tipo_nombre: string;
  total_estados: number;
  created_at: string;
}

const TIPO_ICONS: Record<string, string> = { financiera: '🏦', comercial: '🏪' };
const TIPO_COLORS: Record<string, { bg: string; color: string }> = {
  financiera: { bg: '#E6F1FB', color: '#185FA5' },
  comercial: { bg: '#fff7ed', color: '#d97706' },
};

/* ── Quick Action Card ────────────────────────── */
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

/* ── Summary Card ─────────────────────────────── */
function SummaryCard({ label, value, icon, loading }: { label: string; value: string | number; icon: React.ReactNode; loading?: boolean }) {
  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', backgroundColor: '#E6F1FB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#185FA5' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{label}</div>
        {loading ? (
          <div style={{ height: '28px', width: '40px', backgroundColor: '#f1f5f9', borderRadius: '6px', marginTop: '4px', animation: 'pulse 1.5s ease infinite' }} />
        ) : (
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
        )}
      </div>
    </div>
  );
}

/* ── Dashboard Component ────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [nombrePersona, setNombrePersona] = useState('');

  // Real data states
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [totalEmpresas, setTotalEmpresas] = useState(0);
  const [totalEstados, setTotalEstados] = useState(0);
  const [salasActivas, setSalasActivas] = useState(0);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!user) return;

      // Nombre del usuario
      try {
        const { data } = await supabase.from('personas').select('nombre').eq('id', user.id).maybeSingle();
        if (data) setNombrePersona(data.nombre || '');
      } catch (err) { console.error(err); }

      // Empresas recientes
      try {
        const { data: empData } = await supabase.rpc('get_mis_empresas', { p_user_id: user.id });
        const list: Empresa[] = empData ?? [];
        setEmpresas(list.slice(0, 4)); // mostrar solo las 4 más recientes
        setTotalEmpresas(list.length);

        // Total estados financieros = suma de todos
        const totalEC = list.reduce((acc: number, e: any) => acc + (e.total_estados ?? 0), 0);
        setTotalEstados(totalEC);
      } catch (err) { console.error(err); } finally {
        setLoadingEmpresas(false);
      }

      // Salas activas del usuario
      try {
        const now = new Date().toISOString();
        const { count } = await supabase
          .from('sala')
          .select('id', { count: 'exact', head: true })
          .eq('user', user.id)
          .eq('estado', true)
          .eq('finalizado', false)
          .lte('fechainicio', now)
          .gte('fechafin', now);
        setSalasActivas(count ?? 0);
      } catch (err) { console.error(err); } finally {
        setLoadingKpis(false);
      }
    }

    loadDashboard();
  }, [user]);

  return (
    <>
      <style>{`
        .grid-summary { display: flex; gap: 1.5rem; margin-bottom: 2.5rem; }
        .grid-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 768px) {
          .grid-summary { flex-direction: column; }
          .grid-actions { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="dashboard-content">
        <header style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            Bienvenido de nuevo{nombrePersona ? `, ${nombrePersona.split(' ')[0]}` : ''} 👋
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>Esto es lo que está pasando en tu panel hoy.</p>
        </header>

        <div className="grid-summary">
          <SummaryCard label="Empresas" value={totalEmpresas} icon={<IconEmpresas />} loading={loadingEmpresas} />
          <SummaryCard label="Estados financieros" value={totalEstados} icon={<IconAnalisis />} loading={loadingEmpresas} />
          <SummaryCard label="Salas activas" value={salasActivas} icon={<IconSalas />} loading={loadingKpis} />
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

        {loadingEmpresas ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
            {[1, 2].map(i => (
              <div key={i} style={{ height: '100px', borderRadius: '16px', background: '#f1f5f9', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <div style={{ backgroundColor: 'white', border: '1.5px dashed #e2e8f0', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏢</div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#64748b', margin: '0 0 6px' }}>Sin empresas todavía</p>
            <p style={{ fontSize: '13px', margin: '0 0 16px' }}>Crea tu primera empresa para empezar a analizar estados financieros.</p>
            <button
              onClick={() => navigate('/dashboard/analisis', { state: { openModal: true } })}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', background: '#185FA5', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              + Crear empresa
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
            {empresas.map(emp => {
              const col = TIPO_COLORS[emp.tipo_nombre] ?? TIPO_COLORS.comercial;
              return (
                <div
                  key={emp.id}
                  style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => navigate('/dashboard/analisis')}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#b5d4f4'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,95,165,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: col.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                      {TIPO_ICONS[emp.tipo_nombre] ?? '🏢'}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{emp.nombre}</h4>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: col.color, backgroundColor: col.bg, padding: '2px 6px', borderRadius: '4px', textTransform: 'capitalize' as const }}>
                        {emp.tipo_nombre}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    {emp.total_estados} estado{emp.total_estados !== 1 ? 's' : ''} financiero{emp.total_estados !== 1 ? 's' : ''} registrado{emp.total_estados !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}