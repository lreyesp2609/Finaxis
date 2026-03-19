import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './MisSalas.module.css';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Sala {
  id: number;
  created_at: string;
  user: string;
  idcatalogo: number | null;
  codigosala: string;
  fechainicio: string;
  fechafin: string;
  finalizado: boolean;
  estado: boolean;
  catalogo_nombre?: string;
}

interface Participante {
  id: number;
  created_at: string;
  idestadocuenta: number | null;
  idsala: number;
  user: string;
  calificacion: number;
  persona_nombre?: string;
  persona_email?: string;
}

interface Catalogo {
  id: number;
  nombre: string;
  descripcion: string | null;
  publico: boolean;
  user: string | null;
}

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
function IconX({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconCheck({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconPlus({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function IconCopy({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
}
function IconUsers({ size = 48 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IconGlobe({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function IconLock({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function IconEdit({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function IconEye({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IconSearch({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function IconStar({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IconCalendar({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconCode({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
}
function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>;
}
function IconSave({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
}


/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
function generateCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const nums = '23456789';
  return (
    letters[Math.floor(Math.random() * letters.length)] +
    letters[Math.floor(Math.random() * letters.length)] +
    nums[Math.floor(Math.random() * nums.length)] +
    nums[Math.floor(Math.random() * nums.length)] +
    nums[Math.floor(Math.random() * nums.length)] +
    letters[Math.floor(Math.random() * letters.length)]
  );
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getSalaStatus(sala: Sala): 'activa' | 'pendiente' | 'finalizada' {
  if (sala.finalizado) return 'finalizada';
  const now = new Date();
  if (new Date(sala.fechainicio) > now) return 'pendiente';
  return 'activa';
}

/* ─────────────────────────────────────────
   CATALOGO SELECTOR (sub-componente)
───────────────────────────────────────── */
function CatalogoSelector({ userId, selected, onSelect }: {
  userId: string;
  selected: Catalogo | null;
  onSelect: (c: Catalogo) => void;
}) {
  const [tab, setTab] = useState<'mios' | 'publicos'>('mios');
  const [mios, setMios] = useState<Catalogo[]>([]);
  const [publicos, setPublicos] = useState<Catalogo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase.from('catalogo').select('id, nombre, descripcion, publico, user').eq('user', userId).eq('estado', true).order('nombre')
      .then(({ data }) => { setMios(data ?? []); setLoading(false); });
  }, [userId]);

  useEffect(() => {
    if (tab !== 'publicos') return;
    setLoading(true);
    const q = search.trim();
    let query = supabase.from('catalogo').select('id, nombre, descripcion, publico, user').eq('publico', true).eq('estado', true).neq('user', userId).order('nombre').limit(30);
    if (q) query = query.ilike('nombre', `%${q}%`);
    query.then(({ data }) => { setPublicos(data ?? []); setLoading(false); });
  }, [tab, search, userId]);

  const list = tab === 'mios'
    ? mios.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))
    : publicos;

  return (
    <div className={styles['ms-cat-box']}>
      <div className={styles['ms-cat-tabs']}>
        <button className={`${styles['ms-cat-tab']} ${tab === 'mios' ? styles['ms-cat-tab-active'] : ''}`} onClick={() => { setTab('mios'); setSearch(''); }}><IconLock size={11}/> Mis catálogos</button>
        <button className={`${styles['ms-cat-tab']} ${tab === 'publicos' ? styles['ms-cat-tab-active'] : ''}`} onClick={() => { setTab('publicos'); setSearch(''); }}><IconGlobe size={11}/> Públicos</button>
      </div>
      <div className={styles['ms-cat-search']}><IconSearch size={12}/><input className={styles['ms-cat-search-input']} placeholder="Buscar catálogo…" value={search} onChange={e => setSearch(e.target.value)}/></div>
      <div className={styles['ms-cat-list']}>
        {loading ? <p className={styles['ms-cat-empty']}>Cargando…</p>
          : list.length === 0 ? <p className={styles['ms-cat-empty']}>{tab === 'mios' ? 'No tienes catálogos' : 'Sin resultados'}</p>
          : list.map(c => (
            <button key={c.id} className={`${styles['ms-cat-item']} ${selected?.id === c.id ? styles['ms-cat-item-active'] : ''}`} onClick={() => onSelect(c)}>
              <div className={styles['ms-cat-item-info']}>
                <span className={styles['ms-cat-item-name']}>{c.nombre}</span>
                {c.descripcion && <span className={styles['ms-cat-item-desc']}>{c.descripcion}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <span className={c.publico ? styles['ms-badge-pub'] : styles['ms-badge-priv']}>{c.publico ? 'Público' : 'Privado'}</span>
                {selected?.id === c.id && <span style={{ color: '#185FA5' }}><IconCheck size={12}/></span>}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL CREAR / EDITAR SALA
───────────────────────────────────────── */
type ModalMode = 'create' | 'created' | 'edit';

function ModalSala({ userId, sala, onClose, onSaved }: {
  userId: string;
  sala?: Sala; // si se pasa → modo edición
  onClose: () => void;
  onSaved: (sala: Sala, isNew: boolean) => void;
}) {
  const isEdit = !!sala;
  const [mode, setMode] = useState<ModalMode>(isEdit ? 'edit' : 'create');

  // Form
  const [nombre, setNombre] = useState(sala?.catalogo_nombre ?? ''); // nombre de referencia no existe en BD, se usa el catálogo
  const [catalogoSel, setCatalogoSel] = useState<Catalogo | null>(null);
  const [fechainicio, setFechainicio] = useState(sala ? toLocalDatetimeValue(sala.fechainicio) : '');
  const [fechafin, setFechafin] = useState(sala ? toLocalDatetimeValue(sala.fechafin) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSala, setCreatedSala] = useState<Sala | null>(null);
  const [copied, setCopied] = useState(false);

  // Cargar catálogo si es edición
  useEffect(() => {
    if (sala?.idcatalogo) {
      supabase.from('catalogo').select('id, nombre, descripcion, publico, user').eq('id', sala.idcatalogo).single()
        .then(({ data }) => { if (data) setCatalogoSel(data as Catalogo); });
    }
  }, [sala]);

  const handleSave = async () => {
    if (!catalogoSel) { setError('Selecciona un catálogo.'); return; }
    if (!fechainicio || !fechafin) { setError('Las fechas son obligatorias.'); return; }
    if (new Date(fechainicio) >= new Date(fechafin)) { setError('La fecha de fin debe ser posterior al inicio.'); return; }
    setError(null); setSaving(true);

    if (isEdit && sala) {
      // Editar sala
      const { error: err } = await supabase.from('sala').update({
        idcatalogo: catalogoSel.id,
        fechainicio: new Date(fechainicio).toISOString(),
        fechafin: new Date(fechafin).toISOString(),
      }).eq('id', sala.id);
      setSaving(false);
      if (err) { setError('Error al guardar: ' + err.message); return; }
      onSaved({ ...sala, idcatalogo: catalogoSel.id, fechainicio: new Date(fechainicio).toISOString(), fechafin: new Date(fechafin).toISOString(), catalogo_nombre: catalogoSel.nombre }, false);
    } else {
      // Crear sala
      const codigo = generateCode();
      const { data, error: err } = await supabase.from('sala').insert({
        user: userId,
        idcatalogo: catalogoSel.id,
        codigosala: codigo,
        fechainicio: new Date(fechainicio).toISOString(),
        fechafin: new Date(fechafin).toISOString(),
        finalizado: false,
        estado: true,
      }).select('id, created_at, user, idcatalogo, codigosala, fechainicio, fechafin, finalizado, estado').single();
      setSaving(false);
      if (err || !data) { setError('Error al crear: ' + (err?.message ?? '')); return; }
      const salaWithCat: Sala = { ...data, catalogo_nombre: catalogoSel.nombre };
      setCreatedSala(salaWithCat);
      setMode('created');
      onSaved(salaWithCat, true);
    }
  };

  const handleCopy = () => {
    if (createdSala) { navigator.clipboard.writeText(createdSala.codigosala); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const isLocked = saving;

  return (
    <div className={styles['ms-overlay']} onClick={e => { if (e.target === e.currentTarget && !isLocked) onClose(); }}>
      <div className={styles['ms-modal']}>

        {/* HEADER */}
        <div className={styles['ms-modal-header']}>
          <div>
            <h2 className={styles['ms-modal-title']}>{mode === 'created' ? '¡Sala creada!' : isEdit ? 'Editar sala' : 'Nueva sala'}</h2>
            <p className={styles['ms-modal-sub']}>{mode === 'created' ? 'Comparte el código con los participantes' : isEdit ? 'Actualiza los datos de la sala' : 'Configura los detalles de la sala'}</p>
          </div>
          <button className={styles['ms-close-btn']} onClick={onClose} disabled={isLocked}><IconX size={15}/></button>
        </div>

        {/* ── MODO CREADO: mostrar código ── */}
        {mode === 'created' && createdSala && (
          <div className={styles['ms-created-body']}>
            <div className={styles['ms-created-code-wrap']}>
              <div className={styles['ms-created-code-icon']}><IconCode size={28}/></div>
              <div className={styles['ms-created-code-label']}>Código de acceso</div>
              <div className={styles['ms-created-code']}>{createdSala.codigosala}</div>
              <button className={`${styles['ms-copy-code-btn']} ${copied ? styles['ms-copy-code-btn-copied'] : ''}`} onClick={handleCopy}>
                {copied ? <><IconCheck size={14}/> ¡Copiado!</> : <><IconCopy size={14}/> Copiar código</>}
              </button>
            </div>
            <div className={styles['ms-created-info']}>
              <div className={styles['ms-created-info-row']}><IconCalendar size={13}/><span><strong>Inicio:</strong> {formatDateTime(createdSala.fechainicio)}</span></div>
              <div className={styles['ms-created-info-row']}><IconCalendar size={13}/><span><strong>Fin:</strong> {formatDateTime(createdSala.fechafin)}</span></div>
              {createdSala.catalogo_nombre && <div className={styles['ms-created-info-row']}><span>📋</span><span><strong>Catálogo:</strong> {createdSala.catalogo_nombre}</span></div>}
            </div>
            <p className={styles['ms-created-hint']}>Los participantes usan este código para unirse a la sala desde su dispositivo.</p>
          </div>
        )}

        {/* ── MODO CREAR / EDITAR: formulario ── */}
        {mode !== 'created' && (
          <div className={styles['ms-modal-body']}>
            {/* Catálogo */}
            <div className={styles['ms-field-group']}>
              <label className={styles['ms-label']}>Catálogo de cuentas <span className={styles['ms-req']}>*</span></label>
              {catalogoSel ? (
                <div className={styles['ms-selected-cat']}>
                  <div className={styles['ms-selected-cat-info']}>
                    <span className={styles['ms-selected-cat-badge']}>Catálogo</span>
                    <span className={styles['ms-selected-cat-name']}>{catalogoSel.nombre}</span>
                  </div>
                  <button className={styles['ms-clear-cat-btn']} onClick={() => setCatalogoSel(null)}><IconX size={12}/></button>
                </div>
              ) : (
                <CatalogoSelector userId={userId} selected={catalogoSel} onSelect={setCatalogoSel} />
              )}
            </div>

            {/* Fechas */}
            <div className={styles['ms-date-row']}>
              <div className={styles['ms-field-group']}>
                <label className={styles['ms-label']}>Fecha de inicio <span className={styles['ms-req']}>*</span></label>
                <input className={styles['ms-input']} type="datetime-local" value={fechainicio} onChange={e => setFechainicio(e.target.value)}/>
              </div>
              <div className={styles['ms-field-group']}>
                <label className={styles['ms-label']}>Fecha de fin <span className={styles['ms-req']}>*</span></label>
                <input className={styles['ms-input']} type="datetime-local" value={fechafin} onChange={e => setFechafin(e.target.value)}/>
              </div>
            </div>

            {error && <p className={styles['ms-error-msg']}>{error}</p>}
          </div>
        )}

        {/* FOOTER */}
        <div className={styles['ms-modal-footer']}>
          {mode === 'created' ? (
            <button className={styles['ms-btn-primary']} onClick={onClose}>Entendido</button>
          ) : (
            <>
              <button className={styles['ms-btn-secondary']} onClick={onClose} disabled={isLocked}>Cancelar</button>
              <button className={styles['ms-btn-primary']} onClick={handleSave} disabled={isLocked || !catalogoSel || !fechainicio || !fechafin}>
                {saving
                  ? <><span className={styles['ms-spinner']}/>{isEdit ? ' Guardando…' : ' Creando…'}</>
                  : isEdit ? <><IconSave size={14}/> Guardar cambios</> : <><IconPlus size={14}/> Crear sala</>
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL VER SALA (código + participantes + calificaciones)
───────────────────────────────────────── */
function ModalVerSala({ sala, onClose, onEditar }: {
  sala: Sala;
  onClose: () => void;
  onEditar: () => void;
}) {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const navigate = useNavigate();


  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadParticipantes = useCallback(async () => {
  setLoading(true);
  const { data, error } = await supabase.rpc('get_participantes_sala', {
    p_idsala: sala.id,
  });

  if (!data) { setLoading(false); return; }

  const enriched: Participante[] = data.map((p: any) => ({
    id: p.id,
    created_at: p.created_at,
    idestadocuenta: p.idestadocuenta,
    idsala: p.idsala,
    user: p.user,
    calificacion: p.calificacion,
    persona_nombre: p.display_name,
    persona_email: p.email,
  }));

  setParticipantes(enriched);
  setLoading(false);
}, [sala.id]);

  useEffect(() => { loadParticipantes(); }, [loadParticipantes]);

  const handleCopy = () => { navigator.clipboard.writeText(sala.codigosala); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  const startEditCalif = (p: Participante) => {
    setEditingId(p.id);
    setEditVal(p.calificacion > 0 ? String(p.calificacion) : '');
  };

  const saveCalif = async (participanteId: number) => {
    const num = parseFloat(editVal);
    if (isNaN(num) || num < 0 || num > 10) { showToast('La calificación debe ser entre 0 y 10'); return; }
    setSavingId(participanteId);
    const { error } = await supabase.from('participante').update({ calificacion: num }).eq('id', participanteId);
    setSavingId(null);
    if (error) { showToast('Error: ' + error.message); return; }
    setParticipantes(prev => prev.map(p => p.id === participanteId ? { ...p, calificacion: num } : p));
    setEditingId(null);
    showToast('✓ Calificación guardada');
  };

  const status = getSalaStatus(sala);
  const statusLabel: Record<string, string> = { activa: 'Activa', pendiente: 'Pendiente', finalizada: 'Finalizada' };
  const statusClass: Record<string, string> = { activa: styles['ms-status-green'], pendiente: styles['ms-status-yellow'], finalizada: styles['ms-status-gray'] };

  return (
    <div className={styles['ms-overlay']} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`${styles['ms-modal']} ${styles['ms-modal-large']}`}>
        {toast && <div className={styles['ms-inline-toast']}>{toast}</div>}

        {/* HEADER */}
        <div className={styles['ms-modal-header']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className={styles['ms-back-btn']} onClick={onClose}><IconArrowLeft size={15}/></button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 className={styles['ms-modal-title']}>Sala — {sala.codigosala}</h2>
                <span className={`${styles['ms-status-pill']} ${statusClass[status]}`}>{statusLabel[status]}</span>
              </div>
              <p className={styles['ms-modal-sub']}>{sala.catalogo_nombre ?? 'Sin catálogo'} · {formatDateTime(sala.fechainicio)} → {formatDateTime(sala.fechafin)}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={styles['ms-btn-secondary']} onClick={onEditar} style={{ gap: 5 }}><IconEdit size={13}/> Editar</button>
            <button className={styles['ms-close-btn']} onClick={onClose}><IconX size={15}/></button>
          </div>
        </div>

        {/* BODY */}
        <div className={styles['ms-ver-body']}>
          {/* Código de acceso */}
          <div className={styles['ms-code-card']}>
            <div className={styles['ms-code-card-left']}>
              <div className={styles['ms-code-card-icon']}><IconCode size={18}/></div>
              <div>
                <div className={styles['ms-code-card-label']}>Código de acceso</div>
                <div className={styles['ms-code-card-value']}>{sala.codigosala}</div>
              </div>
            </div>
            <button className={`${styles['ms-copy-btn']} ${copied ? styles['ms-copy-btn-copied'] : ''}`} onClick={handleCopy}>
              {copied ? <><IconCheck size={13}/> Copiado</> : <><IconCopy size={13}/> Copiar</>}
            </button>
          </div>

          {/* Participantes */}
          <div className={styles['ms-participantes-section']}>
            <div className={styles['ms-participantes-header']}>
              <span className={styles['ms-participantes-title']}><IconUsers size={15}/> Participantes</span>
              <span className={styles['ms-participantes-count']}>{loading ? '…' : participantes.length}</span>
              <button className={styles['ms-refresh-btn']} onClick={loadParticipantes} disabled={loading} title="Actualizar">↻</button>
            </div>

            {loading ? (
              <div className={styles['ms-participantes-empty']}>Cargando participantes…</div>
            ) : participantes.length === 0 ? (
              <div className={styles['ms-participantes-empty']}>
                <IconUsers size={32}/>
                <span>Sin participantes aún</span>
              </div>
            ) : (
              <div className={styles['ms-participantes-table']}>
                {/* Header */}
                <div className={styles['ms-pt-header']}>
                  <span className={styles['ms-pt-col-name']}>Participante</span>
                  <span className={styles['ms-pt-col-date']}>Ingresó</span>
                  <span className={styles['ms-pt-col-calif']}>Calificación</span>
                  <span className={styles['ms-pt-col-actions']}>Acciones</span>
                </div>
                {/* Rows */}
                {participantes.map(p => (
                  <div key={p.id} className={styles['ms-pt-row']}>
                    <div className={styles['ms-pt-col-name']}>
                      <div className={styles['ms-pt-avatar']}>{(p.persona_nombre ?? 'P')[0].toUpperCase()}</div>
                      <span className={styles['ms-pt-name']}>{p.persona_nombre ?? 'Participante'}</span>
                    </div>
                    <span className={styles['ms-pt-col-date']}>{new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    <div className={styles['ms-pt-col-calif']}>
                      {editingId === p.id ? (
                        <div className={styles['ms-calif-edit']}>
                          <input
                            className={styles['ms-calif-input']}
                            type="number" min="0" max="10" step="0.1"
                            value={editVal}
                            autoFocus
                            onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveCalif(p.id); if (e.key === 'Escape') setEditingId(null); }}
                            placeholder="0–10"
                          />
                          <button className={styles['ms-calif-confirm']} onClick={() => saveCalif(p.id)} disabled={savingId === p.id}>
                            {savingId === p.id ? <span className={styles['ms-spinner-xs']}/> : <IconCheck size={11}/>}
                          </button>
                          <button className={styles['ms-calif-cancel']} onClick={() => setEditingId(null)}><IconX size={11}/></button>
                        </div>
                      ) : (
                        <div className={`${styles['ms-calif-display']} ${p.calificacion > 0 ? styles['ms-calif-display-filled'] : ''}`}>
                          <IconStar size={11}/>
                          <span>{p.calificacion > 0 ? p.calificacion.toFixed(1) : '—'}</span>
                          <span className={styles['ms-calif-max']}>/10</span>
                        </div>
                      )}
                    </div>
                    <div className={styles['ms-pt-col-actions']}>
                      <button className={styles['ms-action-btn']} onClick={() => startEditCalif(p)} title="Calificar"><IconStar size={13}/></button>
                      <button className={styles['ms-action-btn']} title="Ver respuesta" style={{ opacity: 0.35 }}
                        onClick={() => { onClose(); navigate(`/dashboard/salap/${sala.codigosala}/participante/${p.id}`); }}

                      ><IconEye size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TARJETA DE SALA
───────────────────────────────────────── */
function SalaCard({ sala, onVer, onEditar }: { sala: Sala; onVer: () => void; onEditar: () => void }) {
  const [copied, setCopied] = useState(false);
  const status = getSalaStatus(sala);
  const statusLabel: Record<string, string> = { activa: 'Activa', pendiente: 'Pendiente', finalizada: 'Finalizada' };
  const statusClass: Record<string, string> = { activa: styles['ms-status-green'], pendiente: styles['ms-status-yellow'], finalizada: styles['ms-status-gray'] };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sala.codigosala);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles['ms-card']}>
      <div className={styles['ms-card-top']}>
        <div className={styles['ms-card-code-badge']}>
          <IconCode size={13}/>
          <span>{sala.codigosala}</span>
        </div>
        <span className={`${styles['ms-status-pill']} ${statusClass[status]}`}>{statusLabel[status]}</span>
        <button className={styles['ms-card-copy-btn']} onClick={handleCopy} title="Copiar código">
          {copied ? <IconCheck size={12}/> : <IconCopy size={12}/>}
        </button>
      </div>
      <div className={styles['ms-card-catalog']}>📋 {sala.catalogo_nombre ?? 'Sin catálogo'}</div>
      <div className={styles['ms-card-dates']}>
        <span><IconCalendar size={11}/> {formatDateTime(sala.fechainicio)}</span>
        <span className={styles['ms-card-dates-sep']}>→</span>
        <span>{formatDateTime(sala.fechafin)}</span>
      </div>
      <div className={styles['ms-card-footer']}>
        <span className={styles['ms-card-created']}>{new Date(sala.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <div className={styles['ms-card-actions']}>
          <button className={styles['ms-btn-secondary-sm']} onClick={onEditar}><IconEdit size={12}/> Editar</button>
          <button className={styles['ms-btn-primary-sm']} onClick={onVer}><IconEye size={12}/> Ver sala</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────── */
export default function MisSalas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Modales
  const [showCrear, setShowCrear] = useState(false);
  const [salaParaEditar, setSalaParaEditar] = useState<Sala | null>(null);
  const [salaParaVer, setSalaParaVer] = useState<Sala | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  /* ── Cargar salas ── */
  const loadSalas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('sala')
      .select('id, created_at, user, idcatalogo, codigosala, fechainicio, fechafin, finalizado, estado, catalogo:idcatalogo(nombre)')
      .eq('user', user.id)
      .order('created_at', { ascending: false });

    setSalas((data ?? []).map((s: any) => ({ ...s, catalogo_nombre: s.catalogo?.nombre ?? null })));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadSalas(); }, [loadSalas]);

  /* ── Callbacks ── */
  const handleSalaGuardada = (sala: Sala, isNew: boolean) => {
    if (isNew) {
      setSalas(prev => [sala, ...prev]);
      showToast('✓ Sala creada exitosamente');
    } else {
      setSalas(prev => prev.map(s => s.id === sala.id ? sala : s));
      showToast('✓ Sala actualizada');
      setSalaParaEditar(null);
      // Si estábamos viendo la sala, actualizar
      if (salaParaVer?.id === sala.id) setSalaParaVer(sala);
    }
  };

  if (!user) return null;

  return (
    <>

      {toast && <div className={styles['ms-toast']}>{toast}</div>}

      {/* TOP BAR */}
      <div className={styles['ms-top-bar']}>
        <div className={styles['ms-title-section']}>
          <h2>Mis salas</h2>
          <p>Salas de análisis que has creado</p>
        </div>
        <button className={styles['ms-btn-primary']} onClick={() => setShowCrear(true)}>
          <IconPlus size={14}/> Crear sala
        </button>
      </div>

      {/* CONTENT */}
      <main className={styles['ms-content-area']}>
        {loading ? (
          <div className={styles['ms-grid']}>
            {[1,2,3].map(i => <div key={i} className={styles['ms-card-skeleton']}/>)}
          </div>
        ) : salas.length === 0 ? (
          <div className={styles['ms-empty-state']}>
            <IconUsers size={52}/>
            <h3>No has creado ninguna sala</h3>
            <p>Crea una sala y comparte el código con tus participantes</p>
            <button className={styles['ms-btn-primary']} onClick={() => setShowCrear(true)}><IconPlus size={14}/> Crear primera sala</button>
          </div>
        ) : (
          <div className={styles['ms-grid']}>
            {salas.map(sala => (
              <SalaCard
                key={sala.id}
                sala={sala}
                onVer={() => setSalaParaVer(sala)}
                onEditar={() => setSalaParaEditar(sala)}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODAL CREAR */}
      {showCrear && (
        <ModalSala
          userId={user.id}
          onClose={() => setShowCrear(false)}
          onSaved={(sala, isNew) => { handleSalaGuardada(sala, isNew); if (isNew) { /* modal stays open showing code */ } }}
        />
      )}

      {/* MODAL EDITAR */}
      {salaParaEditar && (
        <ModalSala
          userId={user.id}
          sala={salaParaEditar}
          onClose={() => setSalaParaEditar(null)}
          onSaved={handleSalaGuardada}
        />
      )}

      {/* MODAL VER SALA */}
      {salaParaVer && (
        <ModalVerSala
          sala={salaParaVer}
          onClose={() => setSalaParaVer(null)}
          onEditar={() => { setSalaParaEditar(salaParaVer); setSalaParaVer(null); }}
        />
      )}
    </>
  );
}