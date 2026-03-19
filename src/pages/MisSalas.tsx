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
  catalogos?: { idcatalogo: number; nombre: string; orden: number }[];
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
  estados_por_catalogo?: { idcatalogo: number; catalogo_nombre: string; idestadocuenta: number | null; orden: number }[];
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
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
}
function IconCheck({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconPlus({ size = 15 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconCopy({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
}
function IconUsers({ size = 48 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function IconGlobe({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
}
function IconLock({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
function IconEdit({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function IconEye({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function IconSearch({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IconStar({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IconCalendar({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
}
function IconCode({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>;
}
function IconArrowLeft({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>;
}
function IconSave({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
}
function IconBook({ size = 13 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getSalaStatus(sala: Sala): 'activa' | 'pendiente' | 'finalizada' {
  if (sala.finalizado) return 'finalizada';
  const now = new Date();
  if (new Date(sala.fechainicio) > now) return 'pendiente';
  return 'activa';
}

/* ─────────────────────────────────────────
   CATALOGO SELECTOR MULTI
───────────────────────────────────────── */
function CatalogoSelectorMulti({ userId, selected, onToggle }: {
  userId: string;
  selected: Catalogo[];
  onToggle: (c: Catalogo) => void;
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

  const isSelected = (id: number) => selected.some(c => c.id === id);

  return (
    <div className={styles['ms-cat-box']}>
      <div className={styles['ms-cat-tabs']}>
        <button className={`${styles['ms-cat-tab']} ${tab === 'mios' ? styles['ms-cat-tab-active'] : ''}`} onClick={() => { setTab('mios'); setSearch(''); }}><IconLock size={11} /> Mis catálogos</button>
        <button className={`${styles['ms-cat-tab']} ${tab === 'publicos' ? styles['ms-cat-tab-active'] : ''}`} onClick={() => { setTab('publicos'); setSearch(''); }}><IconGlobe size={11} /> Públicos</button>
      </div>
      <div className={styles['ms-cat-search']}><IconSearch size={12} /><input className={styles['ms-cat-search-input']} placeholder="Buscar catálogo…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className={styles['ms-cat-list']}>
        {loading ? <p className={styles['ms-cat-empty']}>Cargando…</p>
          : list.length === 0 ? <p className={styles['ms-cat-empty']}>{tab === 'mios' ? 'No tienes catálogos' : 'Sin resultados'}</p>
            : list.map(c => (
              <button key={c.id} className={`${styles['ms-cat-item']} ${isSelected(c.id) ? styles['ms-cat-item-active'] : ''}`} onClick={() => onToggle(c)}>
                <div className={styles['ms-cat-item-info']}>
                  <span className={styles['ms-cat-item-name']}>{c.nombre}</span>
                  {c.descripcion && <span className={styles['ms-cat-item-desc']}>{c.descripcion}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span className={c.publico ? styles['ms-badge-pub'] : styles['ms-badge-priv']}>{c.publico ? 'Público' : 'Privado'}</span>
                  {isSelected(c.id) && <span style={{ color: '#185FA5' }}><IconCheck size={12} /></span>}
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
  sala?: Sala;
  onClose: () => void;
  onSaved: (sala: Sala, isNew: boolean) => void;
}) {
  const isEdit = !!sala;
  const [mode, setMode] = useState<ModalMode>(isEdit ? 'edit' : 'create');
  const [catalogosSel, setCatalogosSel] = useState<Catalogo[]>([]);
  const [fechainicio, setFechainicio] = useState(sala ? toLocalDatetimeValue(sala.fechainicio) : '');
  const [fechafin, setFechafin] = useState(sala ? toLocalDatetimeValue(sala.fechafin) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdSala, setCreatedSala] = useState<Sala | null>(null);
  const [copied, setCopied] = useState(false);

  // Cargar catálogos existentes si es edición
  useEffect(() => {
    if (!sala) return;
    supabase.from('sala_catalogo')
      .select('idcatalogo, orden, catalogo:idcatalogo(id, nombre, descripcion, publico, user)')
      .eq('idsala', sala.id)
      .order('orden')
      .then(({ data }) => {
        if (data) {
          setCatalogosSel(data.map((row: any) => row.catalogo as Catalogo).filter(Boolean));
        }
      });
  }, [sala]);

  const handleToggle = (c: Catalogo) => {
    setCatalogosSel(prev =>
      prev.some(x => x.id === c.id) ? prev.filter(x => x.id !== c.id) : [...prev, c]
    );
  };

  const handleSave = async () => {
    if (catalogosSel.length === 0) { setError('Selecciona al menos un catálogo.'); return; }
    if (!fechainicio || !fechafin) { setError('Las fechas son obligatorias.'); return; }
    if (new Date(fechainicio) >= new Date(fechafin)) { setError('La fecha de fin debe ser posterior al inicio.'); return; }
    setError(null); setSaving(true);

    if (isEdit && sala) {
      // Actualizar fechas
      const { error: err } = await supabase.from('sala').update({
        fechainicio: new Date(fechainicio).toISOString(),
        fechafin: new Date(fechafin).toISOString(),
      }).eq('id', sala.id);
      if (err) { setError('Error al guardar: ' + err.message); setSaving(false); return; }

      // Reemplazar catálogos
      await supabase.from('sala_catalogo').delete().eq('idsala', sala.id);
      const inserts = catalogosSel.map((c, i) => ({ idsala: sala.id, idcatalogo: c.id, orden: i }));
      await supabase.from('sala_catalogo').insert(inserts);

      setSaving(false);
      onSaved({
        ...sala,
        fechainicio: new Date(fechainicio).toISOString(),
        fechafin: new Date(fechafin).toISOString(),
        catalogos: catalogosSel.map((c, i) => ({ idcatalogo: c.id, nombre: c.nombre, orden: i })),
      }, false);
    } else {
      const codigo = generateCode();
      // Usar el primer catálogo como legacy idcatalogo
      const { data, error: err } = await supabase.from('sala').insert({
        user: userId,
        idcatalogo: catalogosSel[0].id,
        codigosala: codigo,
        fechainicio: new Date(fechainicio).toISOString(),
        fechafin: new Date(fechafin).toISOString(),
        finalizado: false,
        estado: true,
      }).select('id, created_at, user, idcatalogo, codigosala, fechainicio, fechafin, finalizado, estado').single();
      if (err || !data) { setError('Error al crear: ' + (err?.message ?? '')); setSaving(false); return; }

      // Insertar todos los catálogos en sala_catalogo
      const inserts = catalogosSel.map((c, i) => ({ idsala: data.id, idcatalogo: c.id, orden: i }));
      await supabase.from('sala_catalogo').insert(inserts);

      const salaNew: Sala = {
        ...data,
        catalogos: catalogosSel.map((c, i) => ({ idcatalogo: c.id, nombre: c.nombre, orden: i })),
      };
      setCreatedSala(salaNew);
      setMode('created');
      onSaved(salaNew, true);
    }
  };

  const handleCopy = () => {
    if (createdSala) { navigator.clipboard.writeText(createdSala.codigosala); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className={styles['ms-overlay']} onClick={e => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className={styles['ms-modal']}>
        <div className={styles['ms-modal-header']}>
          <div>
            <h2 className={styles['ms-modal-title']}>{mode === 'created' ? '¡Sala creada!' : isEdit ? 'Editar sala' : 'Nueva sala'}</h2>
            <p className={styles['ms-modal-sub']}>{mode === 'created' ? 'Comparte el código con los participantes' : isEdit ? 'Actualiza los datos de la sala' : 'Configura los detalles de la sala'}</p>
          </div>
          <button className={styles['ms-close-btn']} onClick={onClose} disabled={saving}><IconX size={15} /></button>
        </div>

        {mode === 'created' && createdSala && (
          <div className={styles['ms-created-body']}>
            <div className={styles['ms-created-code-wrap']}>
              <div className={styles['ms-created-code-icon']}><IconCode size={28} /></div>
              <div className={styles['ms-created-code-label']}>Código de acceso</div>
              <div className={styles['ms-created-code']}>{createdSala.codigosala}</div>
              <button className={`${styles['ms-copy-code-btn']} ${copied ? styles['ms-copy-code-btn-copied'] : ''}`} onClick={handleCopy}>
                {copied ? <><IconCheck size={14} /> ¡Copiado!</> : <><IconCopy size={14} /> Copiar código</>}
              </button>
            </div>
            <div className={styles['ms-created-info']}>
              <div className={styles['ms-created-info-row']}><IconCalendar size={13} /><span><strong>Inicio:</strong> {formatDateTime(createdSala.fechainicio)}</span></div>
              <div className={styles['ms-created-info-row']}><IconCalendar size={13} /><span><strong>Fin:</strong> {formatDateTime(createdSala.fechafin)}</span></div>
              {createdSala.catalogos && createdSala.catalogos.length > 0 && (
                <div className={styles['ms-created-info-row']}>
                  <IconBook size={13} />
                  <span><strong>Catálogos:</strong> {createdSala.catalogos.map(c => c.nombre).join(', ')}</span>
                </div>
              )}
            </div>
            <p className={styles['ms-created-hint']}>Los participantes usan este código para unirse a la sala desde su dispositivo.</p>
          </div>
        )}

        {mode !== 'created' && (
          <div className={styles['ms-modal-body']}>
            {/* Catálogos seleccionados */}
            <div className={styles['ms-field-group']}>
              <label className={styles['ms-label']}>
                Catálogos de cuentas <span className={styles['ms-req']}>*</span>
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>Puedes seleccionar varios</span>
              </label>

              {/* Chips de seleccionados */}
              {catalogosSel.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {catalogosSel.map((c, i) => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      background: '#E6F1FB', border: '1px solid #b5d4f4',
                      borderRadius: 7, padding: '3px 9px', fontSize: 12, fontWeight: 600, color: '#185FA5'
                    }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginRight: 2 }}>{i + 1}.</span>
                      {c.nombre}
                      <button onClick={() => handleToggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#185FA5', padding: 0, display: 'flex', lineHeight: 1 }}>
                        <IconX size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <CatalogoSelectorMulti userId={userId} selected={catalogosSel} onToggle={handleToggle} />
            </div>

            {/* Fechas */}
            <div className={styles['ms-date-row']}>
              <div className={styles['ms-field-group']}>
                <label className={styles['ms-label']}>Fecha de inicio <span className={styles['ms-req']}>*</span></label>
                <input className={styles['ms-input']} type="datetime-local" value={fechainicio} onChange={e => setFechainicio(e.target.value)} />
              </div>
              <div className={styles['ms-field-group']}>
                <label className={styles['ms-label']}>Fecha de fin <span className={styles['ms-req']}>*</span></label>
                <input className={styles['ms-input']} type="datetime-local" value={fechafin} onChange={e => setFechafin(e.target.value)} />
              </div>
            </div>

            {error && <p className={styles['ms-error-msg']}>{error}</p>}
          </div>
        )}

        <div className={styles['ms-modal-footer']}>
          {mode === 'created' ? (
            <button className={styles['ms-btn-primary']} onClick={onClose}>Entendido</button>
          ) : (
            <>
              <button className={styles['ms-btn-secondary']} onClick={onClose} disabled={saving}>Cancelar</button>
              <button className={styles['ms-btn-primary']} onClick={handleSave} disabled={saving || catalogosSel.length === 0 || !fechainicio || !fechafin}>
                {saving
                  ? <><span className={styles['ms-spinner']} />{isEdit ? ' Guardando…' : ' Creando…'}</>
                  : isEdit ? <><IconSave size={14} /> Guardar cambios</> : <><IconPlus size={14} /> Crear sala</>
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
   VISTA DE SALA
───────────────────────────────────────── */
function VistaSala({ sala, onVolver, onEditar }: {
  sala: Sala;
  onVolver: () => void;
  onEditar: (s: Sala) => void;
}) {
  const navigate = useNavigate();
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [searchPart, setSearchPart] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  // Pestaña activa para ver respuestas: null = vista general
  const [tabCatalogo, setTabCatalogo] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadParticipantes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_participantes_sala', { p_idsala: sala.id });
    if (data) {
      setParticipantes(data.map((p: any) => ({
        id: p.id, created_at: p.created_at, idestadocuenta: p.idestadocuenta,
        idsala: p.idsala, user: p.user, calificacion: p.calificacion,
        persona_nombre: p.display_name, persona_email: p.email,
        estados_por_catalogo: p.estados_por_catalogo ?? [],
      })));
    }
    setLoading(false);
  }, [sala.id]);

  useEffect(() => { loadParticipantes(); }, [loadParticipantes]);

  const handleCopy = () => { navigator.clipboard.writeText(sala.codigosala); setCopied(true); setTimeout(() => setCopied(false), 2500); };

  const startEditCalif = (p: Participante) => { setEditingId(p.id); setEditVal(p.calificacion > 0 ? String(p.calificacion) : ''); };

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

  const filtrados = participantes.filter(p =>
    !searchPart || (p.persona_nombre ?? '').toLowerCase().includes(searchPart.toLowerCase())
  );

  const catalogos = sala.catalogos ?? [];

  // Columnas de la tabla: nombre + fecha + calificación + catálogos (una col por cat en modo expandido) + acciones
  return (
    <>
      {toast && <div className={styles['ms-toast']}>{toast}</div>}

      <div className={styles['ms-top-bar']}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onVolver} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', fontSize: 13, fontWeight: 500, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
            <IconArrowLeft size={14} /> Mis salas
          </button>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0f172a', color: 'white', padding: '4px 10px', borderRadius: 7, fontSize: 13, fontWeight: 700 }}>
              <IconCode size={13} /> {sala.codigosala}
            </div>
            <span className={`${styles['ms-status-pill']} ${statusClass[status]}`}>{statusLabel[status]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
            <IconCalendar size={11} /><span>{formatDateTime(sala.fechainicio)} → {formatDateTime(sala.fechafin)}</span>
            {catalogos.length > 0 && (
              <span style={{ marginLeft: 4 }}>· {catalogos.length} catálogo{catalogos.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles['ms-btn-secondary']} onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {copied ? <><IconCheck size={13} /> Copiado</> : <><IconCopy size={13} /> Copiar código</>}
          </button>
          <button className={styles['ms-btn-secondary']} onClick={() => onEditar(sala)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconEdit size={13} /> Editar
          </button>
        </div>
      </div>

      <main className={styles['ms-content-area']}>
        {/* Pestañas de catálogos para filtrar vista */}
        {catalogos.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 0 }}>
            <button
              onClick={() => setTabCatalogo(null)}
              style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none',
                borderBottom: tabCatalogo === null ? '2px solid #185FA5' : '2px solid transparent',
                color: tabCatalogo === null ? '#185FA5' : '#64748b', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Todos los catálogos
            </button>
            {catalogos.map(cat => (
              <button
                key={cat.idcatalogo}
                onClick={() => setTabCatalogo(cat.idcatalogo)}
                style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', background: 'none',
                  borderBottom: tabCatalogo === cat.idcatalogo ? '2px solid #185FA5' : '2px solid transparent',
                  color: tabCatalogo === cat.idcatalogo ? '#185FA5' : '#64748b', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <IconBook size={11} /> {cat.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconUsers size={16} /> Participantes
            </h3>
            {!loading && <span style={{ fontSize: 12, fontWeight: 600, color: '#185FA5', background: '#E6F1FB', padding: '2px 8px', borderRadius: 10 }}>{participantes.length}</span>}
            <button onClick={loadParticipantes} disabled={loading} title="Actualizar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 4, lineHeight: 1 }}>↻</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', flex: '0 1 260px' }}>
            <IconSearch size={13} />
            <input style={{ border: 'none', outline: 'none', fontSize: 13, color: '#1e293b', background: 'transparent', width: '100%', fontFamily: 'inherit' }} placeholder="Buscar participante…" value={searchPart} onChange={e => setSearchPart(e.target.value)} />
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 52, borderRadius: 10, background: '#f1f5f9' }} />)}
          </div>
        ) : filtrados.length === 0 ? (
          <div className={styles['ms-empty-state']} style={{ padding: '60px 20px' }}>
            <IconUsers size={44} />
            <h3>{searchPart ? 'Sin resultados' : 'Sin participantes aún'}</h3>
            <p>{searchPart ? 'No hay participantes con ese nombre.' : 'Comparte el código de la sala para que los participantes se unan.'}</p>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {/* Header tabla */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px 1fr 100px', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Participante</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Ingresó</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Calificación</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {tabCatalogo === null && catalogos.length > 1 ? 'Catálogos' : 'Estado'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.04em' }}>Acciones</span>
            </div>

            {filtrados.map((p, idx) => {
              const estadosCat = p.estados_por_catalogo ?? [];
              const catsFiltrados = tabCatalogo !== null
                ? estadosCat.filter(e => e.idcatalogo === tabCatalogo)
                : estadosCat;

              return (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 150px 1fr 100px', padding: '12px 20px', alignItems: 'center', borderBottom: idx < filtrados.length - 1 ? '1px solid #f1f5f9' : 'none', gap: 8, transition: 'background .07s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'white')}>

                  {/* Nombre */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#E6F1FB', color: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {(p.persona_nombre ?? 'P')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{p.persona_nombre ?? 'Participante'}</div>
                      {p.persona_email && <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.persona_email}</div>}
                    </div>
                  </div>

                  {/* Fecha */}
                  <span style={{ fontSize: 13, color: '#64748b' }}>{new Date(p.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>

                  {/* Calificación */}
                  <div>
                    {editingId === p.id ? (
                      <div className={styles['ms-calif-edit']}>
                        <input className={styles['ms-calif-input']} type="number" min="0" max="10" step="0.1" value={editVal} autoFocus onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCalif(p.id); if (e.key === 'Escape') setEditingId(null); }} placeholder="0–10" />
                        <button className={styles['ms-calif-confirm']} onClick={() => saveCalif(p.id)} disabled={savingId === p.id}>{savingId === p.id ? <span className={styles['ms-spinner-xs']} /> : <IconCheck size={11} />}</button>
                        <button className={styles['ms-calif-cancel']} onClick={() => setEditingId(null)}><IconX size={11} /></button>
                      </div>
                    ) : (
                      <div className={`${styles['ms-calif-display']} ${p.calificacion > 0 ? styles['ms-calif-display-filled'] : ''}`}>
                        <IconStar size={11} /><span>{p.calificacion > 0 ? p.calificacion.toFixed(1) : '—'}</span><span className={styles['ms-calif-max']}>/10</span>
                      </div>
                    )}
                  </div>

                  {/* Catálogos/estados */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {catsFiltrados.length === 0 ? (
                      <span style={{ fontSize: 11, color: '#cbd5e1' }}>Sin datos</span>
                    ) : catsFiltrados.map(ec => (
                      <span key={ec.idcatalogo} style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 6,
                        background: ec.idestadocuenta ? '#dcfce7' : '#f3f4f6',
                        color: ec.idestadocuenta ? '#15803d' : '#94a3b8',
                        border: ec.idestadocuenta ? '1px solid #86efac' : '1px solid #e2e8f0',
                      }}>
                        {catalogos.length > 1 ? `${ec.catalogo_nombre}: ` : ''}{ec.idestadocuenta ? '✓' : '—'}
                      </span>
                    ))}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button className={styles['ms-action-btn']} onClick={() => startEditCalif(p)} title="Calificar"><IconStar size={13} /></button>
                    {/* Si hay múltiples catálogos, mostrar botón por catálogo activo */}
                    {(tabCatalogo !== null ? catsFiltrados : catalogos.length === 1 ? estadosCat : []).map(ec => (
                      ec.idestadocuenta && (
                        <button key={ec.idcatalogo} className={styles['ms-action-btn']} title={`Ver: ${ec.catalogo_nombre}`}
                          onClick={() => navigate(`/dashboard/salap/${sala.codigosala}/participante/${p.id}`)}>
                          <IconEye size={13} />
                        </button>
                      )
                    ))}
                    {tabCatalogo === null && catalogos.length > 1 && (
                      <button className={styles['ms-action-btn']} title="Ver respuestas (selecciona un catálogo)"
                        onClick={() => navigate(`/dashboard/salap/${sala.codigosala}/participante/${p.id}`)}>
                        <IconEye size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
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

  const catalogos = sala.catalogos ?? [];

  return (
    <div className={styles['ms-card']}>
      <div className={styles['ms-card-top']}>
        <div className={styles['ms-card-code-badge']}><IconCode size={13} /><span>{sala.codigosala}</span></div>
        <span className={`${styles['ms-status-pill']} ${statusClass[status]}`}>{statusLabel[status]}</span>
        <button className={styles['ms-card-copy-btn']} onClick={handleCopy} title="Copiar código">
          {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
        </button>
      </div>

      {/* Catálogos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {catalogos.length === 0
          ? <span className={styles['ms-card-catalog']}>📋 Sin catálogo</span>
          : catalogos.map(c => (
            <span key={c.idcatalogo} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', background: '#f1f5f9', borderRadius: 5, padding: '2px 7px' }}>
              <IconBook size={10} /> {c.nombre}
            </span>
          ))
        }
      </div>

      <div className={styles['ms-card-dates']}>
        <span><IconCalendar size={11} /> {formatDateTime(sala.fechainicio)}</span>
        <span className={styles['ms-card-dates-sep']}>→</span>
        <span>{formatDateTime(sala.fechafin)}</span>
      </div>
      <div className={styles['ms-card-footer']}>
        <span className={styles['ms-card-created']}>{new Date(sala.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <div className={styles['ms-card-actions']}>
          <button className={styles['ms-btn-secondary-sm']} onClick={onEditar}><IconEdit size={12} /> Editar</button>
          <button className={styles['ms-btn-primary-sm']} onClick={onVer}><IconEye size={12} /> Ver sala</button>
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
  const [vistaActual, setVistaActual] = useState<'lista' | 'sala'>('lista');
  const [salaActual, setSalaActual] = useState<Sala | null>(null);
  const [showCrear, setShowCrear] = useState(false);
  const [salaParaEditar, setSalaParaEditar] = useState<Sala | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const loadSalas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('sala')
      .select('id, created_at, user, idcatalogo, codigosala, fechainicio, fechafin, finalizado, estado')
      .eq('user', user.id)
      .order('created_at', { ascending: false });

    if (!data) { setLoading(false); return; }

    // Cargar catálogos de cada sala
    const salasConCatalogos = await Promise.all(data.map(async (s: any) => {
      const { data: cats } = await supabase
        .from('sala_catalogo')
        .select('idcatalogo, orden, catalogo:idcatalogo(nombre)')
        .eq('idsala', s.id)
        .order('orden');
      return {
        ...s,
        catalogos: (cats ?? []).map((c: any) => ({ idcatalogo: c.idcatalogo, nombre: c.catalogo?.nombre ?? '', orden: c.orden })),
      };
    }));

    setSalas(salasConCatalogos);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadSalas(); }, [loadSalas]);

  const handleSalaGuardada = (sala: Sala, isNew: boolean) => {
    if (isNew) {
      setSalas(prev => [sala, ...prev]);
      showToast('✓ Sala creada exitosamente');
    } else {
      setSalas(prev => prev.map(s => s.id === sala.id ? sala : s));
      showToast('✓ Sala actualizada');
      setSalaParaEditar(null);
      if (salaActual?.id === sala.id) setSalaActual(sala);
    }
  };

  const handleVerSala = (sala: Sala) => { setSalaActual(sala); setVistaActual('sala'); };
  const handleVolverALista = () => { setVistaActual('lista'); setSalaActual(null); };

  if (!user) return null;

  if (vistaActual === 'sala' && salaActual) {
    return (
      <>
        {toast && <div className={styles['ms-toast']}>{toast}</div>}
        <VistaSala sala={salaActual} onVolver={handleVolverALista} onEditar={(s) => setSalaParaEditar(s)} />
        {salaParaEditar && (
          <ModalSala userId={user.id} sala={salaParaEditar} onClose={() => setSalaParaEditar(null)} onSaved={handleSalaGuardada} />
        )}
      </>
    );
  }

  return (
    <>
      {toast && <div className={styles['ms-toast']}>{toast}</div>}
      <div className={styles['ms-top-bar']}>
        <div className={styles['ms-title-section']}>
          <h2>Mis salas</h2>
          <p>Salas de análisis que has creado</p>
        </div>
        <button className={styles['ms-btn-primary']} onClick={() => setShowCrear(true)}>
          <IconPlus size={14} /> Crear sala
        </button>
      </div>

      <main className={styles['ms-content-area']}>
        {loading ? (
          <div className={styles['ms-grid']}>
            {[1, 2, 3].map(i => <div key={i} className={styles['ms-card-skeleton']} />)}
          </div>
        ) : salas.length === 0 ? (
          <div className={styles['ms-empty-state']}>
            <IconUsers size={52} />
            <h3>No has creado ninguna sala</h3>
            <p>Crea una sala y comparte el código con tus participantes</p>
            <button className={styles['ms-btn-primary']} onClick={() => setShowCrear(true)}><IconPlus size={14} /> Crear primera sala</button>
          </div>
        ) : (
          <div className={styles['ms-grid']}>
            {salas.map(sala => (
              <SalaCard key={sala.id} sala={sala} onVer={() => handleVerSala(sala)} onEditar={() => setSalaParaEditar(sala)} />
            ))}
          </div>
        )}
      </main>

      {showCrear && <ModalSala userId={user.id} onClose={() => setShowCrear(false)} onSaved={handleSalaGuardada} />}
      {salaParaEditar && <ModalSala userId={user.id} sala={salaParaEditar} onClose={() => setSalaParaEditar(null)} onSaved={handleSalaGuardada} />}
    </>
  );
}