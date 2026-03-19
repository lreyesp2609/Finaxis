import VerAnalisis from './Veranalisis ';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './MisAnalisis.module.css';
import { extractValuesFromPDF, type CatalogItem, type ExtractedValue } from '../lib/Extractcatalogfrompdf';
// import { extractFullFromPDF, type NewCatalogItem, type NewItemValue, type FullPDFExtractionResult } from '../lib/extractFullFromPDF';
import { extractFullFromPDF, type NewCatalogItem, type NewItemValue, type FullPDFExtractionResult } from '../lib/Extractfullfrompdf';
/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface EstadoCuenta {
  id: number; created_at: string; idcatalogo: number; user: string;
  nombre: string; descripcion: string | null; estado: boolean;
  idarchivofire: string | null; catalogo_nombre?: string;
}
interface Catalogo {
  id: number; nombre: string; descripcion: string | null;
  publico: boolean; user: string | null;
}

/* ─────────────────────────────────────────
   ICONS
───────────────────────────────────────── */
function IconX({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }
function IconPlus({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconFile({ size = 20 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function IconSearch({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconChevronLeft({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>; }
function IconChevronRight({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>; }
function IconCheck({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>; }
function IconGlobe({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>; }
function IconLock({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>; }
function IconDots({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>; }
function IconBuilding() { return <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><path d="M12 22v-4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M12 14h.01"/></svg>; }
function IconUpload({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>; }
function IconPDF({ size = 20 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h1.5a1.5 1.5 0 0 0 0-3H9v6"/><path d="M14 12h2"/><path d="M14 15h2"/><path d="M19 12v6"/></svg>; }
function IconWarning({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconSparkle({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconEdit({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>; }
function IconWand({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h.01"/><path d="M17.8 6.2L19 5"/><path d="M3 21l9-9"/><path d="M12.2 6.2L11 5"/></svg>; }
function IconTree({ size = 13 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

const PAGE_SIZE = 8;

/* ─────────────────────────────────────────
   CATALOGO SELECTOR
───────────────────────────────────────── */
function CatalogoSelector({ userId, selected, onSelect }: { userId: string; selected: Catalogo | null; onSelect: (c: Catalogo) => void }) {
  const [tab, setTab] = useState<'mios' | 'publicos'>('mios');
  const [mios, setMios] = useState<Catalogo[]>([]);
  const [publicos, setPublicos] = useState<Catalogo[]>([]);
  const [search, setSearch] = useState('');
  const [loadingCats, setLoadingCats] = useState(false);

  useEffect(() => {
    async function fetchMios() {
      setLoadingCats(true);
      const { data } = await supabase.from('catalogo').select('id, nombre, descripcion, publico, user').eq('user', userId).eq('estado', true).order('nombre');
      setMios(data ?? []); setLoadingCats(false);
    }
    fetchMios();
  }, [userId]);

  useEffect(() => {
    if (tab !== 'publicos') return;
    async function fetchPublicos() {
      setLoadingCats(true);
      const q = search.trim();
      let query = supabase.from('catalogo').select('id, nombre, descripcion, publico, user').eq('publico', true).eq('estado', true).neq('user', userId).order('nombre').limit(30);
      if (q) query = query.ilike('nombre', `%${q}%`);
      const { data } = await query;
      setPublicos(data ?? []); setLoadingCats(false);
    }
    fetchPublicos();
  }, [tab, search, userId]);

  const list = tab === 'mios' ? mios : publicos;
  const filtered = tab === 'mios' ? list.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase())) : list;

  return (
    <div className={anStyles.catSelector}>
      <div className={anStyles.catTabs}>
        <button className={`${anStyles.catTab} ${tab === 'mios' ? anStyles.catTabActive : ''}`} onClick={() => { setTab('mios'); setSearch(''); }}><IconLock size={12} /> Mis catálogos</button>
        <button className={`${anStyles.catTab} ${tab === 'publicos' ? anStyles.catTabActive : ''}`} onClick={() => { setTab('publicos'); setSearch(''); }}><IconGlobe size={12} /> Públicos</button>
      </div>
      <div className={anStyles.catSearch}><IconSearch size={13} /><input className={anStyles.catSearchInput} placeholder="Buscar catálogo…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className={anStyles.catList}>
        {loadingCats ? <div className={anStyles.catEmpty}>Cargando…</div>
          : filtered.length === 0 ? <div className={anStyles.catEmpty}>{tab === 'mios' ? 'No tienes catálogos' : 'Sin resultados'}</div>
          : filtered.map(c => (
            <button key={c.id} className={`${anStyles.catItem} ${selected?.id === c.id ? anStyles.catItemSelected : ''}`} onClick={() => onSelect(c)}>
              <div className={anStyles.catItemInfo}><span className={anStyles.catItemNombre}>{c.nombre}</span>{c.descripcion && <span className={anStyles.catItemDesc}>{c.descripcion}</span>}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span className={c.publico ? anStyles.badgePub : anStyles.badgePriv}>{c.publico ? 'Público' : 'Privado'}</span>
                {selected?.id === c.id && <span className={anStyles.catItemCheck}><IconCheck size={13} /></span>}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PDF REVIEW PANEL (flujo con catálogo)
───────────────────────────────────────── */
function PDFReviewPanel({ extractedValues, years, onYearsChange, onValueChange, matchRate }: {
  extractedValues: ExtractedValue[]; years: string[];
  onYearsChange: (years: string[]) => void;
  onValueChange: (itemcatId: number, year: string, value: number) => void;
  matchRate: number;
}) {
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [editYearVal, setEditYearVal] = useState('');
  const leafItems = extractedValues.filter(v => years.some(yr => v.values[yr] !== undefined));

  return (
    <div className={anStyles.reviewPanel}>
      <div className={`${anStyles.matchBanner} ${matchRate < 0.3 ? anStyles.matchLow : matchRate < 0.6 ? anStyles.matchMid : anStyles.matchHigh}`}>
        {matchRate < 0.3 ? <IconWarning size={14} /> : <IconCheck size={14} />}
        <span>{matchRate < 0.3 ? `Baja correspondencia (${Math.round(matchRate * 100)}%) — verifica que el PDF coincida con el catálogo` : `${Math.round(matchRate * 100)}% de ítems del catálogo encontrados en el PDF`}</span>
      </div>
      <div className={anStyles.reviewHeader}>
        <span className={anStyles.reviewColLabel}>Cuenta</span>
        {years.map(yr => (
          <div key={yr} className={anStyles.reviewYearCol}>
            {editingYear === yr ? (
              <div className={anStyles.reviewYearEdit}>
                <input className={anStyles.reviewYearInput} value={editYearVal} autoFocus onChange={e => setEditYearVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && editYearVal.trim()) { onYearsChange(years.map(y => y === yr ? editYearVal.trim() : y)); setEditingYear(null); } if (e.key === 'Escape') setEditingYear(null); }} />
                <button className={anStyles.reviewYearConfirm} onClick={() => { if (editYearVal.trim()) onYearsChange(years.map(y => y === yr ? editYearVal.trim() : y)); setEditingYear(null); }}><IconCheck size={10} /></button>
              </div>
            ) : (
              <button className={anStyles.reviewYearBtn} onClick={() => { setEditingYear(yr); setEditYearVal(yr); }}>{yr} <IconEdit size={10} /></button>
            )}
          </div>
        ))}
      </div>
      <div className={anStyles.reviewRows}>
        {leafItems.length === 0 ? <div className={anStyles.reviewEmpty}>No se extrajeron valores</div>
          : leafItems.map(item => (
            <div key={item.itemcatId} className={anStyles.reviewRow}>
              <div className={anStyles.reviewItemLabel}>
                {item.itemCodigo && <span className={anStyles.reviewCode}>{item.itemCodigo}</span>}
                <span className={anStyles.reviewNombre}>{item.itemNombre}</span>
              </div>
              {years.map(yr => (
                <div key={yr} className={anStyles.reviewValCell}>
                  <input className={anStyles.reviewInput} type="number" step="0.01" value={item.values[yr] === 0 ? '' : item.values[yr]} placeholder="0.00"
                    onChange={e => { const num = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0; onValueChange(item.itemcatId, yr, num); }} />
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   FULL PDF REVIEW PANEL (flujo sin catálogo)
   Muestra estructura extraída + valores editables
───────────────────────────────────────── */
function FullPDFReviewPanel({
  items, values, years,
  onYearsChange, onValueChange, onCatalogNameChange, catalogName,
}: {
  items: NewCatalogItem[]; values: NewItemValue[]; years: string[];
  onYearsChange: (years: string[]) => void;
  onValueChange: (tempId: string, year: string, val: number) => void;
  onCatalogNameChange: (name: string) => void;
  catalogName: string;
}) {
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [editYearVal, setEditYearVal] = useState('');

  const leafItems = items.filter(i => !i.contenedor);
  const containers = items.filter(i => i.contenedor);

  const getVal = (tempId: string, year: string) => {
    return values.find(v => v.itemTempId === tempId && v.year === year)?.valor ?? 0;
  };

  return (
    <div className={anStyles.reviewPanel}>
      {/* Nombre del catálogo editable */}
      <div className={anStyles.fullReviewCatName}>
        <label className={anStyles.fullReviewCatLabel}><IconTree size={11}/> Nombre del catálogo que se creará:</label>
        <input className={anStyles.fullReviewCatInput} value={catalogName} onChange={e => onCatalogNameChange(e.target.value)} placeholder="Nombre del catálogo…" />
      </div>

      {/* Resumen de estructura */}
      <div className={anStyles.fullReviewSummary}>
        <div className={anStyles.fullReviewSummaryItem}>
          <span className={anStyles.fullReviewSummaryNum}>{items.length}</span>
          <span>ítems en total</span>
        </div>
        <div className={anStyles.fullReviewSummaryDivider}/>
        <div className={anStyles.fullReviewSummaryItem}>
          <span className={anStyles.fullReviewSummaryNum}>{containers.length}</span>
          <span>grupos</span>
        </div>
        <div className={anStyles.fullReviewSummaryDivider}/>
        <div className={anStyles.fullReviewSummaryItem}>
          <span className={anStyles.fullReviewSummaryNum}>{leafItems.length}</span>
          <span>cuentas con valores</span>
        </div>
        <div className={anStyles.fullReviewSummaryDivider}/>
        <div className={anStyles.fullReviewSummaryItem}>
          <span className={anStyles.fullReviewSummaryNum}>{values.filter(v => v.valor !== 0).length}</span>
          <span>valores ≠ 0</span>
        </div>
      </div>

      {/* Header con años editables */}
      <div className={anStyles.reviewHeader}>
        <span className={anStyles.reviewColLabel}>Cuenta</span>
        {years.map(yr => (
          <div key={yr} className={anStyles.reviewYearCol}>
            {editingYear === yr ? (
              <div className={anStyles.reviewYearEdit}>
                <input className={anStyles.reviewYearInput} value={editYearVal} autoFocus onChange={e => setEditYearVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && editYearVal.trim()) { onYearsChange(years.map(y => y === yr ? editYearVal.trim() : y)); setEditingYear(null); } if (e.key === 'Escape') setEditingYear(null); }} />
                <button className={anStyles.reviewYearConfirm} onClick={() => { if (editYearVal.trim()) onYearsChange(years.map(y => y === yr ? editYearVal.trim() : y)); setEditingYear(null); }}><IconCheck size={10} /></button>
              </div>
            ) : (
              <button className={anStyles.reviewYearBtn} onClick={() => { setEditingYear(yr); setEditYearVal(yr); }}>{yr} <IconEdit size={10} /></button>
            )}
          </div>
        ))}
      </div>

      {/* Filas */}
      <div className={anStyles.reviewRows}>
        {leafItems.length === 0
          ? <div className={anStyles.reviewEmpty}>No se extrajeron cuentas con valores</div>
          : leafItems.map(item => (
            <div key={item.tempId} className={anStyles.reviewRow}>
              <div className={anStyles.reviewItemLabel}>
                {item.codigo && <span className={anStyles.reviewCode}>{item.codigo}</span>}
                <span className={anStyles.reviewNombre}>{item.nombre}</span>
              </div>
              {years.map(yr => (
                <div key={yr} className={anStyles.reviewValCell}>
                  <input className={anStyles.reviewInput} type="number" step="0.01"
                    value={getVal(item.tempId, yr) === 0 ? '' : getVal(item.tempId, yr)}
                    placeholder="0.00"
                    onChange={e => { const num = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0; onValueChange(item.tempId, yr, num); }} />
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MODAL CREAR ESTADO
   Flujos:
   A) Sin PDF → crear estado normal
   B) PDF + catálogo → extraer valores → revisar → crear
   C) PDF sin catálogo → extraer estructura+valores → revisar → crear catálogo+estado
───────────────────────────────────────── */
type ModalStep = 'form' | 'extracting' | 'review' | 'review_full';

function ModalCrearEstado({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: (e: EstadoCuenta) => void }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [catalogoSel, setCatalogoSel] = useState<Catalogo | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [step, setStep] = useState<ModalStep>('form');
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStep, setExtractStep] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flujo B: PDF + catálogo existente
  const [extractedValues, setExtractedValues] = useState<ExtractedValue[]>([]);
  const [pdfYears, setPdfYears] = useState<string[]>([]);
  const [matchRate, setMatchRate] = useState(0);
  const [pdfMismatch, setPdfMismatch] = useState(false);

  // Flujo C: PDF sin catálogo
  const [fullResult, setFullResult] = useState<FullPDFExtractionResult | null>(null);
  const [fullYears, setFullYears] = useState<string[]>([]);
  const [fullValues, setFullValues] = useState<NewItemValue[]>([]);
  const [catalogName, setCatalogName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') setPdfFile(file);
  };

  /* ── Botón principal de acción según estado del formulario ── */
  const getFlowLabel = () => {
    if (!pdfFile) return 'normal';
    if (catalogoSel) return 'pdf_with_catalog';
    return 'pdf_auto';
  };

  /* ── FLUJO B: extraer con catálogo existente ── */
  const handleExtractWithCatalog = async () => {
    if (!pdfFile || !catalogoSel) return;
    setStep('extracting'); setExtractProgress(0); setPdfMismatch(false); setError(null);

    try {
      const { data: rawItems } = await supabase.from('itemcat').select('id, nombre, codigo, contenedor, iditempadre').eq('idcatalogo', catalogoSel.id).order('id');
      const catalogItems: CatalogItem[] = (rawItems ?? []).map((r: any) => ({ id: r.id, nombre: r.nombre, codigo: r.codigo, contenedor: r.contenedor, iditempadre: r.iditempadre }));
      const result = await extractValuesFromPDF(pdfFile, catalogItems, (stepMsg, pct) => { setExtractStep(stepMsg); setExtractProgress(pct); });
      setMatchRate(result.matchRate);
      if (result.matchRate < 0.2) { setPdfMismatch(true); setStep('form'); return; }
      setPdfYears(result.years); setExtractedValues(result.values); setStep('review');
    } catch (err: any) {
      setError('Error al procesar el PDF: ' + (err?.message ?? String(err)));
      setStep('form');
    }
  };

  /* ── FLUJO C: extraer estructura+valores sin catálogo ── */
  const handleExtractFull = async () => {
    if (!pdfFile) return;
    setStep('extracting'); setExtractProgress(0); setError(null);

    try {
      const result = await extractFullFromPDF(pdfFile, (stepMsg, pct) => { setExtractStep(stepMsg); setExtractProgress(pct); });
      if (result.items.length === 0) {
        setError('No se pudo extraer estructura del PDF. Intenta seleccionar un catálogo manualmente.');
        setStep('form'); return;
      }
      setFullResult(result);
      setFullYears(result.years);
      setFullValues(result.values);
      setCatalogName(result.catalogName);
      if (!nombre) setNombre(result.catalogName);
      setStep('review_full');
    } catch (err: any) {
      setError('Error al procesar el PDF: ' + (err?.message ?? String(err)));
      setStep('form');
    }
  };

  const handleExtract = () => {
    const flow = getFlowLabel();
    if (flow === 'pdf_with_catalog') handleExtractWithCatalog();
    else if (flow === 'pdf_auto') handleExtractFull();
  };

  /* ── FLUJO A: crear estado normal ── */
  const handleCreateNormal = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!catalogoSel) { setError('Debes seleccionar un catálogo.'); return; }
    setError(null); setSaving(true);
    const { data: nuevoId, error: errRpc } = await supabase.rpc('crear_estado_completo', { p_nombre: nombre.trim(), p_descripcion: descripcion.trim() || null, p_idcatalogo: catalogoSel.id, p_user_id: userId });
    if (errRpc || !nuevoId) { setError('Error al crear: ' + (errRpc?.message ?? 'Sin respuesta')); setSaving(false); return; }
    const { data: estado } = await supabase.from('estadodecuenta').select('id, created_at, idcatalogo, user, nombre, descripcion, estado, idarchivofire').eq('id', nuevoId).eq('estado', true).single();
    setSaving(false);
    if (estado) onCreated({ ...estado, catalogo_nombre: catalogoSel.nombre });
    else setError('Estado creado pero no se pudo leer.');
  };

  /* ── FLUJO B: crear estado + valores desde PDF con catálogo ── */
  const handleCreateWithPDF = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!catalogoSel) { setError('Debes seleccionar un catálogo.'); return; }
    if (pdfYears.length === 0) { setError('No se detectaron años.'); return; }
    setError(null); setSaving(true);
    try {
      const { data: nuevoId, error: errRpc } = await supabase.rpc('crear_estado_completo', { p_nombre: nombre.trim(), p_descripcion: descripcion.trim() || null, p_idcatalogo: catalogoSel.id, p_user_id: userId });
      if (errRpc || !nuevoId) throw new Error(errRpc?.message ?? 'Sin ID');
      const anioIds: Record<string, number> = {};
      for (const yr of pdfYears) {
        const { data: anioId, error: errAnio } = await supabase.rpc('agregar_anio_estado', { p_idestadocuenta: nuevoId, p_valor: yr });
        if (errAnio || !anioId) throw new Error('Error año ' + yr + ': ' + (errAnio?.message ?? ''));
        anioIds[yr] = anioId;
      }
      const itemsToInsert = extractedValues.flatMap(ev => pdfYears.filter(yr => (ev.values[yr] ?? 0) !== 0).map(yr => ({ id: -1, iditemcat: ev.itemcatId, idanio: anioIds[yr], valor: ev.values[yr] })));
      if (itemsToInsert.length > 0) {
        const { error: errVals } = await supabase.rpc('guardar_valores_estado', { p_idestadocuenta: nuevoId, p_valores: itemsToInsert });
        if (errVals) throw new Error('Error guardando valores: ' + errVals.message);
      }
      const { data: estado } = await supabase.from('estadodecuenta').select('id, created_at, idcatalogo, user, nombre, descripcion, estado, idarchivofire').eq('id', nuevoId).eq('estado', true).single();
      setSaving(false);
      if (estado) onCreated({ ...estado, catalogo_nombre: catalogoSel.nombre });
      else setError('Estado creado pero no se pudo leer.');
    } catch (err: any) { setError('Error: ' + (err?.message ?? String(err))); setSaving(false); }
  };

  /* ── FLUJO C: crear catálogo + estado + valores desde PDF ── */
  const handleCreateFull = async () => {
    if (!nombre.trim()) { setError('El nombre del estado es obligatorio.'); return; }
    if (!catalogName.trim()) { setError('El nombre del catálogo es obligatorio.'); return; }
    if (!fullResult || fullResult.items.length === 0) { setError('No hay estructura extraída.'); return; }
    setError(null); setSaving(true);

    try {
      // 1. Crear catálogo
      const { data: newCatalogo, error: errCat } = await supabase
        .from('catalogo')
        .insert({ nombre: catalogName.trim(), descripcion: `Generado desde PDF: ${pdfFile?.name ?? ''}`, estado: true, publico: false, user: userId })
        .select('id').single();
      if (errCat || !newCatalogo) throw new Error('Error creando catálogo: ' + (errCat?.message ?? ''));
      const catalogoId: number = newCatalogo.id;

      // 2. Insertar ítems del catálogo en orden (raíces primero, luego hijos)
      // Ordenar: raíces (parentTempId = null) primero
      const sorted: NewCatalogItem[] = [];
      const remaining = [...fullResult.items];
      const inserted = new Set<string>();

      // Insertar hasta que no queden ítems sin padre insertado
      let prevLen = -1;
      while (remaining.length > 0 && remaining.length !== prevLen) {
        prevLen = remaining.length;
        for (let i = remaining.length - 1; i >= 0; i--) {
          const item = remaining[i];
          if (item.parentTempId === null || inserted.has(item.parentTempId)) {
            sorted.push(item);
            inserted.add(item.tempId);
            remaining.splice(i, 1);
          }
        }
      }
      // Agregar los que quedaron huérfanos al final
      sorted.push(...remaining);

      // Mapa tempId → id real en BD
      const tempIdToRealId = new Map<string, number>();

      for (const item of sorted) {
        const parentId = item.parentTempId ? (tempIdToRealId.get(item.parentTempId) ?? null) : null;
        const { data: newItem, error: errItem } = await supabase
          .from('itemcat')
          .insert({ idcatalogo: catalogoId, nombre: item.nombre, codigo: item.codigo, contenedor: item.contenedor, iditempadre: parentId })
          .select('id').single();
        if (errItem || !newItem) {
          console.warn('Error insertando ítem:', item.nombre, errItem?.message);
          continue;
        }
        tempIdToRealId.set(item.tempId, newItem.id);
      }

      // 3. Crear el estado de cuenta
      const { data: nuevoId, error: errRpc } = await supabase.rpc('crear_estado_completo', {
        p_nombre: nombre.trim(), p_descripcion: descripcion.trim() || null,
        p_idcatalogo: catalogoId, p_user_id: userId,
      });
      if (errRpc || !nuevoId) throw new Error('Error creando estado: ' + (errRpc?.message ?? ''));

      // 4. Crear años
      const anioIds: Record<string, number> = {};
      for (const yr of fullYears) {
        const { data: anioId, error: errAnio } = await supabase.rpc('agregar_anio_estado', { p_idestadocuenta: nuevoId, p_valor: yr });
        if (errAnio || !anioId) throw new Error('Error año ' + yr + ': ' + (errAnio?.message ?? ''));
        anioIds[yr] = anioId;
      }

      // 5. Insertar valores
      const itemsToInsert = fullValues
        .filter(v => v.valor !== 0)
        .map(v => {
          const realId = tempIdToRealId.get(v.itemTempId);
          if (!realId || !anioIds[v.year]) return null;
          return { id: -1, iditemcat: realId, idanio: anioIds[v.year], valor: v.valor };
        })
        .filter((v): v is { id: number; iditemcat: number; idanio: number; valor: number } => v !== null);

      if (itemsToInsert.length > 0) {
        const { error: errVals } = await supabase.rpc('guardar_valores_estado', { p_idestadocuenta: nuevoId, p_valores: itemsToInsert });
        if (errVals) throw new Error('Error guardando valores: ' + errVals.message);
      }

      // 6. Leer estado creado
      const { data: estado } = await supabase.from('estadodecuenta').select('id, created_at, idcatalogo, user, nombre, descripcion, estado, idarchivofire').eq('id', nuevoId).eq('estado', true).single();
      setSaving(false);
      if (estado) onCreated({ ...estado, catalogo_nombre: catalogName.trim() });
      else setError('Creado pero no se pudo leer el estado.');
    } catch (err: any) { setError('Error: ' + (err?.message ?? String(err))); setSaving(false); }
  };

  const handleValueChangeFull = (tempId: string, year: string, val: number) => {
    setFullValues(prev => {
      const existing = prev.findIndex(v => v.itemTempId === tempId && v.year === year);
      if (existing >= 0) { const n = [...prev]; n[existing] = { ...n[existing], valor: val }; return n; }
      return [...prev, { itemTempId: tempId, year, valor: val }];
    });
  };

  const isLocked = step === 'extracting' || saving;
  const canCreate = nombre.trim() && (catalogoSel || (step === 'review_full'));
  const flow = getFlowLabel();

  const progressLabel: Record<string, string> = {
    normal: 'Crear estado',
    pdf_with_catalog: 'Extraer del PDF',
    pdf_auto: 'Extraer y crear catálogo',
  };

  return (
    <div className={anStyles.overlay} onClick={e => { if (e.target === e.currentTarget && !isLocked) onClose(); }}>
      <div className={`${anStyles.modal} ${(step === 'review' || step === 'review_full') ? anStyles.modalWide : ''}`}>

        {/* HEADER */}
        <div className={anStyles.modalHeader}>
          <div>
            <h2 className={anStyles.modalTitle}>
              {step === 'review' ? 'Revisar valores extraídos'
                : step === 'review_full' ? 'Revisar estructura y valores'
                : 'Nuevo estado de cuenta'}
            </h2>
            <p className={anStyles.modalSub}>
              {step === 'review' ? `PDF: ${pdfFile?.name} · ${pdfYears.join(', ')}`
                : step === 'review_full' ? `PDF: ${pdfFile?.name} · ${fullYears.join(', ')} · ${fullResult?.items.length ?? 0} ítems detectados`
                : 'Completa los datos y selecciona el catálogo de cuentas'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(step === 'review' || step === 'review_full') && (
              <button className={anStyles.backBtn} onClick={() => setStep('form')} disabled={isLocked}>← Volver</button>
            )}
            <button className={anStyles.closeBtn} onClick={onClose} disabled={isLocked}><IconX size={16} /></button>
          </div>
        </div>

        {/* ══ STEP: FORM ══ */}
        {step === 'form' && (
          <div className={anStyles.modalBody}>
            <div className={anStyles.formCol}>
              {pdfMismatch && (
                <div className={anStyles.mismatchAlert}>
                  <IconWarning size={16} />
                  <div><strong>PDF no compatible</strong><p>El documento no parece corresponder al catálogo seleccionado (menos del 20% de ítems reconocidos).</p></div>
                  <button onClick={() => setPdfMismatch(false)}><IconX size={13} /></button>
                </div>
              )}

              <div className={anStyles.fieldGroup}>
                <label className={anStyles.label}>Nombre <span className={anStyles.req}>*</span></label>
                <input className={anStyles.input} placeholder="Ej: Balance General 2025" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className={anStyles.fieldGroup}>
                <label className={anStyles.label}>Descripción <span className={anStyles.opt}>(opcional)</span></label>
                <textarea className={`${anStyles.input} ${anStyles.textarea}`} placeholder="Descripción del estado de cuenta…" value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} />
              </div>

              {catalogoSel && (
                <div className={anStyles.selectedCat}>
                  <div className={anStyles.selectedCatInfo}>
                    <span className={anStyles.selectedCatLabel}>Catálogo seleccionado:</span>
                    <span className={anStyles.selectedCatNombre}>{catalogoSel.nombre}</span>
                  </div>
                  <button className={anStyles.clearCatBtn} onClick={() => { setCatalogoSel(null); setPdfFile(null); }}><IconX size={12} /></button>
                </div>
              )}

              {/* Zona PDF */}
              <div className={anStyles.pdfSection}>
                <div className={anStyles.pdfSectionTitle}><IconSparkle size={13}/><span>Importar desde PDF <span className={anStyles.opt}>(opcional)</span></span></div>
                {pdfFile ? (
                  <div className={anStyles.pdfSelected}>
                    <div className={anStyles.pdfSelectedIcon}><IconPDF size={18}/></div>
                    <div className={anStyles.pdfSelectedInfo}>
                      <span className={anStyles.pdfSelectedName}>{pdfFile.name}</span>
                      <span className={anStyles.pdfSelectedSize}>{(pdfFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                    {/* Badge de flujo detectado */}
                    {!catalogoSel && (
                      <span className={anStyles.autoFlowBadge}><IconWand size={10}/> Creará catálogo automáticamente</span>
                    )}
                    <button className={anStyles.pdfRemoveBtn} onClick={() => setPdfFile(null)}><IconX size={12}/></button>
                  </div>
                ) : (
                  <div className={anStyles.pdfDropzone} onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setPdfFile(f); }} />
                    <IconUpload size={22}/>
                    <span className={anStyles.pdfDropText}>Arrastra un PDF o <strong>haz clic</strong></span>
                    <span className={anStyles.pdfDropHint}>Con catálogo: extrae valores. Sin catálogo: crea catálogo y estado automáticamente</span>
                  </div>
                )}
              </div>

              {error && <p className={anStyles.errorMsg}>{error}</p>}
            </div>

            <div className={anStyles.pickerCol}>
              <p className={anStyles.pickerLabel}>
                Catálogo de cuentas
                {!pdfFile && <span className={anStyles.req}> *</span>}
                {pdfFile && <span className={anStyles.opt}> (opcional con PDF)</span>}
              </p>
              <CatalogoSelector userId={userId} selected={catalogoSel} onSelect={setCatalogoSel} />
            </div>
          </div>
        )}

        {/* ══ STEP: EXTRACTING ══ */}
        {step === 'extracting' && (
          <div className={anStyles.extractingBody}>
            <div className={anStyles.extractingCard}>
              <div className={anStyles.extractingIconWrap}><div className={anStyles.extractingSpinner}/><IconPDF size={24}/></div>
              <div className={anStyles.extractingTexts}>
                <span className={anStyles.extractingTitle}>Procesando PDF…</span>
                <span className={anStyles.extractingStep}>{extractStep}</span>
              </div>
              <div className={anStyles.progressBarWrap}><div className={anStyles.progressBar} style={{ width: `${extractProgress}%` }}/></div>
              <span className={anStyles.progressPct}>{extractProgress}%</span>
            </div>
          </div>
        )}

        {/* ══ STEP: REVIEW (flujo B - con catálogo) ══ */}
        {step === 'review' && (
          <div className={anStyles.reviewBody}>
            <div className={anStyles.reviewFormCol}>
              <div className={anStyles.fieldGroup}><label className={anStyles.label}>Nombre <span className={anStyles.req}>*</span></label><input className={anStyles.input} placeholder="Ej: Balance General 2025" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
              <div className={anStyles.fieldGroup}><label className={anStyles.label}>Descripción <span className={anStyles.opt}>(opcional)</span></label><textarea className={`${anStyles.input} ${anStyles.textarea}`} value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} /></div>
              {catalogoSel && <div className={anStyles.selectedCat}><div className={anStyles.selectedCatInfo}><span className={anStyles.selectedCatLabel}>Catálogo:</span><span className={anStyles.selectedCatNombre}>{catalogoSel.nombre}</span></div></div>}
              <div className={anStyles.reviewInfo}>
                <div className={anStyles.reviewInfoRow}><span>Años detectados:</span><strong>{pdfYears.join(', ')}</strong></div>
                <div className={anStyles.reviewInfoRow}><span>Ítems con datos:</span><strong>{extractedValues.filter(v => pdfYears.some(yr => v.values[yr] !== 0)).length}</strong></div>
              </div>
              {error && <p className={anStyles.errorMsg}>{error}</p>}
            </div>
            <div className={anStyles.reviewTableCol}>
              <PDFReviewPanel extractedValues={extractedValues} years={pdfYears} onYearsChange={setPdfYears}
                onValueChange={(id, yr, val) => setExtractedValues(prev => prev.map(v => v.itemcatId === id ? { ...v, values: { ...v.values, [yr]: val } } : v))}
                matchRate={matchRate} />
            </div>
          </div>
        )}

        {/* ══ STEP: REVIEW_FULL (flujo C - sin catálogo) ══ */}
        {step === 'review_full' && fullResult && (
          <div className={anStyles.reviewBody}>
            <div className={anStyles.reviewFormCol}>
              <div className={anStyles.fieldGroup}><label className={anStyles.label}>Nombre del estado <span className={anStyles.req}>*</span></label><input className={anStyles.input} placeholder="Ej: Balance General 2025" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
              <div className={anStyles.fieldGroup}><label className={anStyles.label}>Descripción <span className={anStyles.opt}>(opcional)</span></label><textarea className={`${anStyles.input} ${anStyles.textarea}`} value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} /></div>
              <div className={anStyles.autoFlowInfo}>
                <div className={anStyles.autoFlowInfoIcon}><IconWand size={14}/></div>
                <div>
                  <strong>Flujo automático</strong>
                  <p>Se creará un catálogo nuevo con la estructura extraída del PDF, y luego el estado con sus valores.</p>
                </div>
              </div>
              <div className={anStyles.reviewInfo}>
                <div className={anStyles.reviewInfoRow}><span>Años:</span><strong>{fullYears.join(', ')}</strong></div>
                <div className={anStyles.reviewInfoRow}><span>Ítems creados:</span><strong>{fullResult.items.length}</strong></div>
                <div className={anStyles.reviewInfoRow}><span>Valores:</span><strong>{fullValues.filter(v => v.valor !== 0).length}</strong></div>
                {fullResult.usedOCR && <div className={anStyles.reviewInfoRow}><span>Extracción:</span><strong>OCR</strong></div>}
              </div>
              {error && <p className={anStyles.errorMsg}>{error}</p>}
            </div>
            <div className={anStyles.reviewTableCol}>
              <FullPDFReviewPanel
                items={fullResult.items} values={fullValues} years={fullYears}
                catalogName={catalogName}
                onCatalogNameChange={setCatalogName}
                onYearsChange={setFullYears}
                onValueChange={handleValueChangeFull} />
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className={anStyles.modalFooter}>
          <button className={anStyles.cancelBtn} onClick={onClose} disabled={isLocked}>Cancelar</button>

          {step === 'form' && flow === 'normal' && (
            <button className={anStyles.saveBtn} onClick={handleCreateNormal} disabled={isLocked || !nombre.trim() || !catalogoSel}>
              {saving ? <><span className={anStyles.spinner}/> Creando…</> : <><IconPlus size={14}/> Crear estado</>}
            </button>
          )}
          {step === 'form' && flow === 'pdf_with_catalog' && (
            <button className={anStyles.saveBtn} onClick={handleExtract} disabled={isLocked || !nombre.trim() || !catalogoSel}>
              <IconSparkle size={14}/> Extraer del PDF
            </button>
          )}
          {step === 'form' && flow === 'pdf_auto' && (
            <button className={anStyles.saveBtn} onClick={handleExtract} disabled={isLocked || !nombre.trim()}>
              <IconWand size={14}/> Extraer y crear catálogo
            </button>
          )}

          {step === 'review' && (
            <button className={anStyles.saveBtn} onClick={handleCreateWithPDF} disabled={isLocked || !nombre.trim()}>
              {saving ? <><span className={anStyles.spinner}/> Creando…</> : <><IconCheck size={14}/> Crear con datos del PDF</>}
            </button>
          )}
          {step === 'review_full' && (
            <button className={anStyles.saveBtn} onClick={handleCreateFull} disabled={isLocked || !nombre.trim() || !catalogName.trim()}>
              {saving ? <><span className={anStyles.spinner}/> Creando catálogo y estado…</> : <><IconWand size={14}/> Crear catálogo y estado</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   TARJETA DE ESTADO
───────────────────────────────────────── */
function EstadoCard({ estado, onVer }: { estado: EstadoCuenta; onVer: () => void }) {
  return (
    <div className={anStyles.card}>
      <div className={anStyles.cardTop}>
        <div className={anStyles.cardIcon}><IconFile size={18}/></div>
        <div className={anStyles.cardInfo}><span className={anStyles.cardNombre}>{estado.nombre}</span>{estado.catalogo_nombre && <span className={anStyles.cardCatalogo}>{estado.catalogo_nombre}</span>}</div>
        <button className={anStyles.dotsBtn} title="Opciones"><IconDots size={15}/></button>
      </div>
      {estado.descripcion && <p className={anStyles.cardDesc}>{estado.descripcion}</p>}
      <div className={anStyles.cardFooter}>
        <span className={anStyles.cardFecha}>{new Date(estado.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        <button className={anStyles.verBtn} onClick={onVer}>Ver análisis →</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   STYLE KEYS
───────────────────────────────────────── */
const anStyles = {
  section: 'an-section', sectionHeader: 'an-section-header', sectionTitle: 'an-section-title', sectionCount: 'an-section-count', newBtn: 'an-new-btn', grid: 'an-grid', emptyState: 'an-empty', emptyIcon: 'an-empty-icon',
  card: 'an-card', cardTop: 'an-card-top', cardIcon: 'an-card-icon', cardInfo: 'an-card-info', cardNombre: 'an-card-nombre', cardCatalogo: 'an-card-catalogo', cardBadge: 'an-card-badge', badgeActive: 'an-badge-active', badgeInactive: 'an-badge-inactive', dotsBtn: 'an-dots-btn', cardDesc: 'an-card-desc', cardFooter: 'an-card-footer', cardFecha: 'an-card-fecha', verBtn: 'an-ver-btn',
  pagination: 'an-pagination', pageBtn: 'an-page-btn', pageBtnActive: 'an-page-btn-active', pageBtnDisabled: 'an-page-btn-disabled', pageInfo: 'an-page-info',
  overlay: 'an-overlay', modal: 'an-modal', modalWide: 'an-modal-wide', modalHeader: 'an-modal-header', modalTitle: 'an-modal-title', modalSub: 'an-modal-sub', closeBtn: 'an-close-btn', backBtn: 'an-back-btn',
  modalBody: 'an-modal-body', formCol: 'an-form-col', pickerCol: 'an-picker-col', pickerLabel: 'an-picker-label', modalFooter: 'an-modal-footer',
  fieldGroup: 'an-field-group', label: 'an-label', req: 'an-req', opt: 'an-opt', input: 'an-input', textarea: 'an-textarea',
  selectedCat: 'an-selected-cat', selectedCatInfo: 'an-selected-cat-info', selectedCatLabel: 'an-selected-cat-label', selectedCatNombre: 'an-selected-cat-nombre', clearCatBtn: 'an-clear-cat-btn', errorMsg: 'an-error-msg',
  cancelBtn: 'an-cancel-btn', saveBtn: 'an-save-btn', spinner: 'an-spinner',
  catSelector: 'an-cat-selector', catTabs: 'an-cat-tabs', catTab: 'an-cat-tab', catTabActive: 'an-cat-tab-active', catSearch: 'an-cat-search', catSearchInput: 'an-cat-search-input', catList: 'an-cat-list', catItem: 'an-cat-item', catItemSelected: 'an-cat-item-selected', catItemInfo: 'an-cat-item-info', catItemNombre: 'an-cat-item-nombre', catItemDesc: 'an-cat-item-desc', catItemCheck: 'an-cat-item-check', catEmpty: 'an-cat-empty', badgePub: 'an-badge-pub', badgePriv: 'an-badge-priv',
  pdfSection: 'an-pdf-section', pdfSectionTitle: 'an-pdf-section-title', pdfDropzone: 'an-pdf-dropzone', pdfDropText: 'an-pdf-drop-text', pdfDropHint: 'an-pdf-drop-hint', pdfSelected: 'an-pdf-selected', pdfSelectedIcon: 'an-pdf-selected-icon', pdfSelectedInfo: 'an-pdf-selected-info', pdfSelectedName: 'an-pdf-selected-name', pdfSelectedSize: 'an-pdf-selected-size', pdfRemoveBtn: 'an-pdf-remove-btn', mismatchAlert: 'an-mismatch-alert',
  autoFlowBadge: 'an-auto-flow-badge', autoFlowInfo: 'an-auto-flow-info', autoFlowInfoIcon: 'an-auto-flow-info-icon',
  extractingBody: 'an-extracting-body', extractingCard: 'an-extracting-card', extractingIconWrap: 'an-extracting-icon-wrap', extractingSpinner: 'an-extracting-spinner', extractingTexts: 'an-extracting-texts', extractingTitle: 'an-extracting-title', extractingStep: 'an-extracting-step', progressBarWrap: 'an-progress-bar-wrap', progressBar: 'an-progress-bar', progressPct: 'an-progress-pct',
  reviewBody: 'an-review-body', reviewFormCol: 'an-review-form-col', reviewTableCol: 'an-review-table-col', reviewPanel: 'an-review-panel', reviewHeader: 'an-review-header', reviewColLabel: 'an-review-col-label', reviewYearCol: 'an-review-year-col', reviewYearBtn: 'an-review-year-btn', reviewYearEdit: 'an-review-year-edit', reviewYearInput: 'an-review-year-input', reviewYearConfirm: 'an-review-year-confirm', reviewRows: 'an-review-rows', reviewRow: 'an-review-row', reviewItemLabel: 'an-review-item-label', reviewCode: 'an-review-code', reviewNombre: 'an-review-nombre', reviewValCell: 'an-review-val-cell', reviewInput: 'an-review-input', reviewEmpty: 'an-review-empty',
  matchBanner: 'an-match-banner', matchLow: 'an-match-low', matchMid: 'an-match-mid', matchHigh: 'an-match-high',
  reviewInfo: 'an-review-info', reviewInfoRow: 'an-review-info-row',
  fullReviewCatName: 'an-full-review-cat-name', fullReviewCatLabel: 'an-full-review-cat-label', fullReviewCatInput: 'an-full-review-cat-input',
  fullReviewSummary: 'an-full-review-summary', fullReviewSummaryItem: 'an-full-review-summary-item', fullReviewSummaryNum: 'an-full-review-summary-num', fullReviewSummaryDivider: 'an-full-review-summary-divider',
};

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const CSS = `
.an-section { padding: 0 32px 48px; }
.an-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
.an-section-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; color: #1e293b; margin: 0; }
.an-section-count { font-size: 12px; font-weight: 600; color: #185FA5; background: #E6F1FB; padding: 2px 8px; border-radius: 10px; }
.an-new-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: #185FA5; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.an-new-btn:hover { background: #1a6fbe; }
.an-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.an-empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: #94a3b8; text-align: center; }
.an-empty-icon { color: #e2e8f0; }
.an-empty p { font-size: 13px; margin: 0; }
.an-empty h4 { font-size: 15px; font-weight: 600; color: #64748b; margin: 0; }
.an-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow 0.15s, border-color 0.15s; }
.an-card:hover { border-color: #b5d4f4; box-shadow: 0 2px 12px rgba(24,95,165,0.07); }
.an-card-top { display: flex; align-items: flex-start; gap: 10px; }
.an-card-icon { width: 36px; height: 36px; border-radius: 9px; background: #E6F1FB; color: #185FA5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.an-card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.an-card-nombre { font-size: 14px; font-weight: 600; color: #1e293b; }
.an-card-catalogo { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.an-card-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; flex-shrink: 0; align-self: flex-start; }
.an-badge-active { background: #dcfce7; color: #15803d; }
.an-badge-inactive { background: #f3f4f6; color: #94a3b8; }
.an-dots-btn { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: 1px solid transparent; background: none; color: #cbd5e1; cursor: pointer; flex-shrink: 0; transition: all 0.1s; }
.an-dots-btn:hover { border-color: #e2e8f0; color: #64748b; background: #f8fafc; }
.an-card-desc { font-size: 12px; color: #64748b; margin: 0; line-height: 1.45; }
.an-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid #f1f5f9; }
.an-card-fecha { font-size: 11px; color: #94a3b8; }
.an-ver-btn { font-size: 12px; font-weight: 600; color: #185FA5; background: none; border: none; cursor: pointer; padding: 0; transition: color 0.1s; }
.an-ver-btn:hover { color: #1a6fbe; }
.an-pagination { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 24px; }
.an-page-btn { display: flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 8px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; font-size: 13px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.1s; }
.an-page-btn:hover:not(.an-page-btn-active):not(.an-page-btn-disabled) { border-color: #185FA5; color: #185FA5; background: #f0f7ff; }
.an-page-btn-active { background: #185FA5; color: white; border-color: #185FA5; }
.an-page-btn-disabled { opacity: 0.35; cursor: not-allowed; pointer-events: none; }
.an-page-info { font-size: 12px; color: #94a3b8; margin: 0 4px; }
.an-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); backdrop-filter: blur(2px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; animation: anFadeIn 0.15s ease; }
@keyframes anFadeIn { from { opacity: 0 } to { opacity: 1 } }
.an-modal { background: white; border-radius: 14px; box-shadow: 0 20px 60px rgba(15,23,42,0.18); width: 100%; max-width: 820px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; animation: anSlideUp 0.18s ease; }
.an-modal-wide { max-width: 1100px; }
@keyframes anSlideUp { from { transform: translateY(10px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
.an-modal-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.an-modal-title { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0 0 3px; }
.an-modal-sub { font-size: 12px; color: #94a3b8; margin: 0; }
.an-close-btn { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; color: #94a3b8; cursor: pointer; transition: all 0.1s; }
.an-close-btn:hover { background: #f8fafc; color: #1e293b; }
.an-back-btn { padding: 5px 12px; border-radius: 7px; border: 1px solid #e2e8f0; background: white; font-size: 12px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.1s; }
.an-back-btn:hover { border-color: #185FA5; color: #185FA5; background: #f0f7ff; }
.an-modal-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
.an-form-col { flex: 1; padding: 20px 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.an-picker-col { width: 300px; flex-shrink: 0; border-left: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; background: #f8fafc; padding: 16px; }
.an-picker-label { font-size: 12px; font-weight: 600; color: #475569; margin: 0 0 10px; }
.an-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 14px 24px; border-top: 1px solid #e2e8f0; flex-shrink: 0; }
.an-field-group { display: flex; flex-direction: column; gap: 6px; }
.an-label { font-size: 12px; font-weight: 600; color: #475569; }
.an-req { color: #dc2626; }
.an-opt { font-weight: 400; color: #94a3b8; }
.an-input { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 8px 11px; font-size: 13px; color: #1e293b; outline: none; transition: border-color 0.15s; font-family: inherit; }
.an-input:focus { border-color: #185FA5; }
.an-textarea { resize: vertical; min-height: 72px; }
.an-selected-cat { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 10px 12px; }
.an-selected-cat-info { display: flex; flex-direction: column; gap: 1px; }
.an-selected-cat-label { font-size: 10px; font-weight: 600; color: #15803d; text-transform: uppercase; letter-spacing: 0.04em; }
.an-selected-cat-nombre { font-size: 13px; font-weight: 600; color: #1e293b; }
.an-clear-cat-btn { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 5px; border: none; background: rgba(220,38,38,0.08); color: #dc2626; cursor: pointer; flex-shrink: 0; }
.an-clear-cat-btn:hover { background: rgba(220,38,38,0.15); }
.an-error-msg { font-size: 12px; color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; padding: 7px 12px; margin: 0; }
.an-cancel-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; background: white; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s; }
.an-cancel-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.an-save-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: #185FA5; color: white; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.an-save-btn:hover:not(:disabled) { background: #1a6fbe; }
.an-save-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.an-spinner { display: inline-block; width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.35); border-top-color: white; border-radius: 50%; animation: anSpin 0.7s linear infinite; }
@keyframes anSpin { to { transform: rotate(360deg); } }
.an-cat-selector { display: flex; flex-direction: column; flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: white; }
.an-cat-tabs { display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.an-cat-tab { flex: 1; padding: 9px 8px; font-size: 11px; font-weight: 600; background: none; border: none; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: color 0.1s; }
.an-cat-tab-active { background: white; color: #185FA5; box-shadow: inset 0 -2px 0 #185FA5; }
.an-cat-search { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; background: white; color: #94a3b8; }
.an-cat-search-input { flex: 1; border: none; outline: none; font-size: 12px; color: #1e293b; background: transparent; }
.an-cat-list { flex: 1; overflow-y: auto; padding: 4px; max-height: 260px; }
.an-cat-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 8px 10px; border-radius: 7px; border: 1px solid transparent; background: white; text-align: left; cursor: pointer; transition: all 0.1s; }
.an-cat-item:hover { background: #f0f7ff; border-color: #b5d4f4; }
.an-cat-item-selected { background: #E6F1FB !important; border-color: #185FA5 !important; }
.an-cat-item-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.an-cat-item-nombre { font-size: 12px; font-weight: 600; color: #1e293b; }
.an-cat-item-desc { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
.an-cat-item-check { color: #185FA5; display: flex; }
.an-cat-empty { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; }
.an-badge-pub { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 8px; background: #E6F1FB; color: #185FA5; }
.an-badge-priv { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 8px; background: #f3f4f6; color: #64748b; }
.an-pdf-section { display: flex; flex-direction: column; gap: 8px; }
.an-pdf-section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #475569; }
.an-pdf-dropzone { border: 2px dashed #cbd5e1; border-radius: 10px; padding: 20px 16px; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; transition: all 0.15s; color: #94a3b8; background: #fafbfc; }
.an-pdf-dropzone:hover { border-color: #185FA5; background: #f0f7ff; color: #185FA5; }
.an-pdf-drop-text { font-size: 13px; font-weight: 500; }
.an-pdf-drop-text strong { color: #185FA5; }
.an-pdf-drop-hint { font-size: 11px; color: #94a3b8; text-align: center; }
.an-pdf-selected { display: flex; align-items: center; gap: 10px; background: #f0f7ff; border: 1.5px solid #b5d4f4; border-radius: 9px; padding: 10px 12px; }
.an-pdf-selected-icon { color: #185FA5; flex-shrink: 0; }
.an-pdf-selected-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.an-pdf-selected-name { font-size: 13px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.an-pdf-selected-size { font-size: 11px; color: #94a3b8; }
.an-pdf-remove-btn { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 5px; border: none; background: rgba(220,38,38,0.08); color: #dc2626; cursor: pointer; flex-shrink: 0; }
.an-pdf-remove-btn:hover { background: rgba(220,38,38,0.15); }
/* Auto flow badge */
.an-auto-flow-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 8px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 10px; font-weight: 700; flex-shrink: 0; white-space: nowrap; }
.an-auto-flow-info { display: flex; align-items: flex-start; gap: 10px; background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 9px; padding: 11px 13px; }
.an-auto-flow-info-icon { width: 28px; height: 28px; border-radius: 7px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.an-auto-flow-info strong { font-size: 12px; font-weight: 700; color: #4c1d95; display: block; margin-bottom: 3px; }
.an-auto-flow-info p { font-size: 11px; color: #6d28d9; margin: 0; line-height: 1.5; }
/* Mismatch */
.an-mismatch-alert { display: flex; align-items: flex-start; gap: 10px; background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 9px; padding: 12px 14px; color: #9a3412; font-size: 12px; }
.an-mismatch-alert strong { font-size: 13px; font-weight: 700; display: block; margin-bottom: 3px; }
.an-mismatch-alert p { margin: 0; line-height: 1.5; }
.an-mismatch-alert button { background: none; border: none; cursor: pointer; color: #9a3412; flex-shrink: 0; padding: 2px; opacity: 0.6; }
.an-mismatch-alert button:hover { opacity: 1; }
/* Extracting */
.an-extracting-body { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
.an-extracting-card { display: flex; flex-direction: column; align-items: center; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 36px 48px; width: 100%; max-width: 400px; text-align: center; }
.an-extracting-icon-wrap { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; color: #185FA5; }
.an-extracting-spinner { position: absolute; inset: 0; border: 3px solid #e2e8f0; border-top-color: #185FA5; border-radius: 50%; animation: anSpin 0.9s linear infinite; }
.an-extracting-texts { display: flex; flex-direction: column; gap: 4px; }
.an-extracting-title { font-size: 16px; font-weight: 700; color: #1e293b; }
.an-extracting-step { font-size: 13px; color: #64748b; }
.an-progress-bar-wrap { width: 100%; height: 6px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
.an-progress-bar { height: 100%; background: linear-gradient(90deg, #185FA5, #38bdf8); border-radius: 10px; transition: width 0.4s ease; }
.an-progress-pct { font-size: 12px; font-weight: 700; color: #185FA5; font-variant-numeric: tabular-nums; }
/* Review */
.an-review-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }
.an-review-form-col { width: 260px; flex-shrink: 0; padding: 20px 16px; border-right: 1px solid #e2e8f0; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #fafbfc; }
.an-review-table-col { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.an-review-info { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.an-review-info-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #64748b; }
.an-review-info-row strong { color: #1e293b; font-weight: 700; }
.an-review-panel { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
.an-match-banner { display: flex; align-items: center; gap: 8px; padding: 8px 16px; font-size: 12px; font-weight: 500; flex-shrink: 0; }
.an-match-high { background: #f0fdf4; color: #15803d; border-bottom: 1px solid #86efac; }
.an-match-mid { background: #fefce8; color: #854d0e; border-bottom: 1px solid #fde047; }
.an-match-low { background: #fff7ed; color: #9a3412; border-bottom: 1px solid #fed7aa; }
.an-review-header { display: flex; align-items: center; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; gap: 0; }
.an-review-col-label { flex: 1; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
.an-review-year-col { width: 130px; flex-shrink: 0; display: flex; align-items: center; justify-content: flex-end; }
.an-review-year-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; font-size: 12px; font-weight: 700; color: #185FA5; cursor: pointer; padding: 3px 6px; border-radius: 5px; transition: background 0.1s; }
.an-review-year-btn:hover { background: #E6F1FB; }
.an-review-year-edit { display: flex; align-items: center; gap: 3px; }
.an-review-year-input { width: 64px; border: 1.5px solid #185FA5; border-radius: 5px; padding: 2px 6px; font-size: 12px; font-weight: 700; color: #185FA5; outline: none; text-align: right; font-family: inherit; }
.an-review-year-confirm { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 4px; border: 1px solid #86efac; background: #f0fdf4; color: #15803d; cursor: pointer; }
.an-review-rows { flex: 1; overflow-y: auto; }
.an-review-row { display: flex; align-items: center; padding: 5px 12px; border-bottom: 1px solid #f1f5f9; transition: background 0.07s; gap: 0; }
.an-review-row:hover { background: #f8fafc; }
.an-review-item-label { flex: 1; display: flex; align-items: center; gap: 6px; min-width: 0; }
.an-review-code { font-size: 9px; font-family: monospace; font-weight: 700; color: #185FA5; background: #E6F1FB; padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
.an-review-nombre { font-size: 11px; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.an-review-val-cell { width: 130px; flex-shrink: 0; display: flex; justify-content: flex-end; padding-left: 8px; }
.an-review-input { width: 115px; border: 1px solid transparent; border-radius: 5px; padding: 4px 6px; font-size: 12px; font-family: monospace; text-align: right; color: #1e293b; background: transparent; outline: none; transition: border-color 0.1s, background 0.1s; -moz-appearance: textfield; }
.an-review-input::-webkit-outer-spin-button, .an-review-input::-webkit-inner-spin-button { -webkit-appearance: none; }
.an-review-input:focus { border-color: #185FA5; background: white; box-shadow: 0 0 0 2px rgba(24,95,165,0.08); }
.an-review-input::placeholder { color: #cbd5e1; }
.an-review-empty { padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; }
/* Full review extras */
.an-full-review-cat-name { display: flex; flex-direction: column; gap: 5px; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; flex-shrink: 0; }
.an-full-review-cat-label { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.an-full-review-cat-input { border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 6px 10px; font-size: 12px; font-weight: 600; color: #1e293b; outline: none; font-family: inherit; transition: border-color 0.15s; }
.an-full-review-cat-input:focus { border-color: #185FA5; }
.an-full-review-summary { display: flex; align-items: center; padding: 8px 12px; background: white; border-bottom: 1px solid #e2e8f0; gap: 0; flex-shrink: 0; }
.an-full-review-summary-item { display: flex; flex-direction: column; align-items: center; gap: 1px; flex: 1; padding: 4px; }
.an-full-review-summary-num { font-size: 16px; font-weight: 800; color: #185FA5; font-variant-numeric: tabular-nums; }
.an-full-review-summary-item span:last-child { font-size: 10px; color: #94a3b8; }
.an-full-review-summary-divider { width: 1px; height: 32px; background: #e2e8f0; flex-shrink: 0; }
@media (max-width: 680px) {
  .an-modal-body, .an-review-body { flex-direction: column; }
  .an-picker-col, .an-review-form-col { width: 100%; border-left: none; border-right: none; border-bottom: 1px solid #e2e8f0; }
  .an-grid { grid-template-columns: 1fr; }
  .an-section { padding: 0 16px 40px; }
  .an-review-table-col { min-height: 300px; }
}
`;

/* ─────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────── */
export default function MisAnalisis() {
  const { user } = useAuth();
  const [vistaEstadoId, setVistaEstadoId] = useState<number | null>(null);
  const [estados, setEstados] = useState<EstadoCuenta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchEstados = useCallback(async (p: number) => {
    if (!user) return;
    setLoadingEstados(true);
    const { count } = await supabase.from('estadodecuenta').select('id', { count: 'exact', head: true }).eq('user', user.id);
    setTotal(count ?? 0);
    const from = (p - 1) * PAGE_SIZE;
    const { data } = await supabase.from('estadodecuenta').select('id, created_at, idcatalogo, user, nombre, descripcion, estado, idarchivofire, catalogo:idcatalogo ( nombre )').eq('user', user.id).eq('estado', true).order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
    setEstados((data ?? []).map((row: any) => ({ ...row, catalogo_nombre: row.catalogo?.nombre ?? null })));
    setLoadingEstados(false);
  }, [user]);

  useEffect(() => { fetchEstados(page); }, [fetchEstados, page]);

  const handleCreated = (nuevo: EstadoCuenta) => {
    setShowModal(false);
    showToast('✓ Estado de cuenta creado exitosamente');
    if (page === 1) { setEstados(prev => [nuevo, ...prev.slice(0, PAGE_SIZE - 1)]); setTotal(t => t + 1); }
    else setPage(1);
  };

  const PaginationBar = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    let visible = pages;
    if (totalPages > 7) {
      if (page <= 4) visible = [...pages.slice(0, 5), -1, totalPages];
      else if (page >= totalPages - 3) visible = [1, -2, ...pages.slice(totalPages - 5)];
      else visible = [1, -3, page - 1, page, page + 1, -4, totalPages];
    }
    return (
      <div className={anStyles.pagination}>
        <button className={`${anStyles.pageBtn} ${page === 1 ? anStyles.pageBtnDisabled : ''}`} onClick={() => setPage(p => Math.max(1, p - 1))}><IconChevronLeft size={14}/></button>
        {visible.map((v) => v < 0 ? <span key={v} className={anStyles.pageInfo}>…</span> : <button key={v} className={`${anStyles.pageBtn} ${v === page ? anStyles.pageBtnActive : ''}`} onClick={() => setPage(v)}>{v}</button>)}
        <button className={`${anStyles.pageBtn} ${page === totalPages ? anStyles.pageBtnDisabled : ''}`} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><IconChevronRight size={14}/></button>
        <span className={anStyles.pageInfo}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total}</span>
      </div>
    );
  };

  if (vistaEstadoId !== null) {
    return (<><style>{CSS}</style><VerAnalisis estadoId={vistaEstadoId} onBack={() => setVistaEstadoId(null)} /></>);
  }

  return (
    <>
      <style>{CSS}</style>
      {toast && <div className={styles.toast}>{toast}</div>}
      <div className={styles.topBar}>
        <div className={styles.titleSection}><h2>Mis análisis</h2><p>Estados de cuenta y análisis financieros</p></div>
        <button className={anStyles.newBtn} onClick={() => setShowModal(true)}><IconPlus size={14}/> Nuevo estado</button>
      </div>
      <div className={anStyles.section}>
        <div className={anStyles.sectionHeader}>
          <h3 className={anStyles.sectionTitle}>Estados de cuenta {total > 0 && <span className={anStyles.sectionCount}>{total}</span>}</h3>
        </div>
        {loadingEstados ? (
          <div className={anStyles.grid}>{Array.from({ length: 4 }).map((_, i) => <div key={i} style={{ height: 110, borderRadius: 12, background: '#f1f5f9', animation: 'anFadeIn 0.5s ease infinite alternate' }}/>)}</div>
        ) : estados.length === 0 ? (
          <div className={anStyles.grid}>
            <div className={anStyles.emptyState}>
              <div className={anStyles.emptyIcon}><IconBuilding/></div>
              <h4>Sin estados de cuenta</h4>
              <p>Crea tu primer estado para comenzar a analizar</p>
              <button className={anStyles.newBtn} onClick={() => setShowModal(true)} style={{ marginTop: 8 }}><IconPlus size={14}/> Crear estado</button>
            </div>
          </div>
        ) : (
          <><div className={anStyles.grid}>{estados.map(e => <EstadoCard key={e.id} estado={e} onVer={() => setVistaEstadoId(e.id)}/>)}</div><PaginationBar/></>
        )}
      </div>
      {showModal && user && <ModalCrearEstado userId={user.id} onClose={() => setShowModal(false)} onCreated={handleCreated}/>}
    </>
  );
}