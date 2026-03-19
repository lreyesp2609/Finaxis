import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

/* ── Icons ── */
function IconX({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconCheck({ color = 'currentColor' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAttachment() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

/* ── Tipos ── */
interface TipoEmpresa { id: number; nombre: string; }

const TIPO_ICONS: Record<string, string> = { financiera: '🏦', comercial: '🏪' };
const TIPO_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  financiera: { bg: '#E6F1FB', color: '#185FA5', border: '#185FA5' },
  comercial: { bg: '#fff7ed', color: '#d97706', border: '#d97706' },
};

/* ── Badge de tipo ── */
function TipoBadge({ tipoNombre }: { tipoNombre: string | null | undefined }) {
  if (!tipoNombre) return null;
  const col = TIPO_COLORS[tipoNombre] ?? TIPO_COLORS.comercial;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 6,
      background: col.bg, color: col.color, textTransform: 'capitalize',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {TIPO_ICONS[tipoNombre] ?? ''} {tipoNombre}
    </span>
  );
}

export default function Catalogos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Tipos de empresa (cargados una vez)
  const [tipos, setTipos] = useState<TipoEmpresa[]>([]);

  // Catalog States
  const [catalogsList, setCatalogsList] = useState<any[]>([]);
  const [publicCatalogsList, setPublicCatalogsList] = useState<any[]>([]);
  const [catalogTab, setCatalogTab] = useState<'mis' | 'publicos'>('mis');
  const [searchCat, setSearchCat] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [catPage, setCatPage] = useState(0);
  const [pubCatPage] = useState(0);
  const [catTotal, setCatTotal] = useState(0);
  const [pubCatTotal, setPubCatTotal] = useState(0);
  const [, setLoadingCats] = useState(false);
  const [, setLoadingPubCats] = useState(false);
  const CAT_PAGE_SIZE = 8;

  // Form States
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [formCatNombre, setFormCatNombre] = useState('');
  const [formCatDesc, setFormCatDesc] = useState('');
  const [formCatFile, setFormCatFile] = useState<File | null>(null);
  const [formCatPublic, setFormCatPublic] = useState(false);
  const [formCatIdTipo, setFormCatIdTipo] = useState<number | null>(null); // null hasta que el usuario elija
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);
  const [, setExtractError] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function init() {
      if (!user) return;
      await supabase.from('personas').select('nombre').eq('id', user.id).maybeSingle();

      // Cargar tipos de empresa
      const { data: tiposData } = await supabase.from('tipo_empresa').select('id, nombre').order('id');
      setTipos(tiposData ?? []);

      // Eagerly load totals for the tabs
      supabase.rpc('get_mis_catalogos', { p_limit: 1, p_offset: 0, p_search: '' })
        .then(({ data }) => { if (data?.[0]?.total_count) setCatTotal(data[0].total_count); });

      supabase.rpc('get_catalogos_publicos', { p_limit: 1, p_offset: 0, p_search: '' })
        .then(({ data }) => { if (data?.[0]?.total_count) setPubCatTotal(data[0].total_count); });

      setLoading(false);
    }
    init();
  }, [user]);

  useEffect(() => {
    if (catalogTab === 'mis') loadMisCatalogos(catPage, searchCat);
    else loadCatalogosPublicos(pubCatPage, searchCat);
  }, [catalogTab, catPage, pubCatPage, searchCat]);

  const loadMisCatalogos = async (page: number, search: string) => {
    setLoadingCats(true);
    const { data, error } = await supabase.rpc('get_mis_catalogos', {
      p_limit: CAT_PAGE_SIZE, p_offset: page * CAT_PAGE_SIZE, p_search: search,
    });
    if (!error && data) {
      setCatalogsList(data.map((c: any) => ({
        id: c.id.toString(), nombre: c.nombre, descripcion: c.descripcion,
        tipo: c.publico ? 'public' : 'private', created_at: c.created_at,
        idtipo_empresa: c.idtipo_empresa, tipo_nombre: c.tipo_nombre,
      })));
      setCatTotal(data[0]?.total_count ?? 0);
    }
    setLoadingCats(false);
  };

  const loadCatalogosPublicos = async (page: number, search: string) => {
    setLoadingPubCats(true);
    const { data, error } = await supabase.rpc('get_catalogos_publicos', {
      p_limit: CAT_PAGE_SIZE, p_offset: page * CAT_PAGE_SIZE, p_search: search,
    });
    if (!error && data) {
      setPublicCatalogsList(data.map((c: any) => ({
        id: c.id.toString(), nombre: c.nombre, descripcion: c.descripcion,
        autor_nombre: c.autor_nombre, created_at: c.created_at,
        idtipo_empresa: c.idtipo_empresa, tipo_nombre: c.tipo_nombre,
      })));
      setPubCatTotal(data[0]?.total_count ?? 0);
    }
    setLoadingPubCats(false);
  };

  const handleCatFileChange = async (file: File) => {
    setFormCatFile(file);
    setExtractError('');
    setExtractedItems([]);
    if (file.type === 'application/pdf') {
      setExtracting(true);
      try {
        const { extractCatalogFromPDF } = await import('../lib/pdfExtractor');
        const items = await extractCatalogFromPDF(file);
        setExtractedItems(items);
      } catch (err) {
        setExtractError('No se pudo extraer el texto del PDF.');
      } finally {
        setExtracting(false);
      }
    }
  };

  const createCatalog = async () => {
    if (!formCatNombre || formCatIdTipo === null) return;
    setIsCreatingCat(true);
    const { data, error } = await supabase.rpc('crear_catalogo', {
      p_nombre: formCatNombre,
      p_descripcion: formCatDesc || null,
      p_publico: formCatPublic,
      p_idtipo: formCatIdTipo,
    });
    if (error) {
      showToast('Error al crear catálogo');
      setIsCreatingCat(false);
      return;
    }
    const nuevo = data[0];
    if (extractedItems.length > 0) {
      try {
        const catalogoId = parseInt(nuevo.id);
        const codeToId = new Map<string, number>();
        const sorted = [...extractedItems].sort((a, b) => a.nivel - b.nivel);
        for (const item of sorted) {
          let parentId = item.iditempadre_codigo ? codeToId.get(item.iditempadre_codigo) ?? null : null;
          const { data: res } = await supabase.from('itemcat').insert({
            idcatalogo: catalogoId, nombre: item.nombre, codigo: item.codigo || null,
            contenedor: item.contenedor, iditempadre: parentId,
          }).select('id').single();
          if (res && item.codigo) codeToId.set(item.codigo, res.id);
        }
      } catch (err) { console.error(err); }
    }
    loadMisCatalogos(0, searchCat);
    setCatPage(0);
    setIsCreatingCat(false);
    setShowCatalogForm(false);
    setFormCatNombre(''); setFormCatDesc(''); setFormCatFile(null);
    setExtractedItems([]); setFormCatIdTipo(null);
    showToast(`✓ Catálogo creado con éxito`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  if (loading) return null;

  const currentList = catalogTab === 'mis' ? catalogsList : publicCatalogsList;

  return (
    <>
      <style>{`
        .cat-toast {
          position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
          background-color: #ecfdf5; border: 1px solid #10b981; color: #064e3b;
          padding: 12px 24px; border-radius: 12px; z-index: 2000; font-weight: 600; font-size: 14px;
        }
        .cat-card {
          background: white; border: 1px solid #e5e7eb; border-radius: 12px;
          padding: 16px 20px; margin-bottom: 12px; display: flex; align-items: center;
          justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.06); transition: box-shadow 0.2s;
        }
        .cat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .cat-edit-btn {
          border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 8px;
          padding: 7px 16px; font-size: 13px; cursor: pointer; font-weight: 500;
          transition: border-color 0.15s, color 0.15s; white-space: nowrap; flex-shrink: 0;
        }
        .cat-edit-btn:hover { border-color: #185FA5; color: #185FA5; }
        .cat-tab {
          background: none; border: none; border-bottom: 2px solid transparent;
          padding: 12px 4px; margin-right: 24px; font-size: 14px; font-weight: 600;
          color: #6b7280; cursor: pointer; transition: color 0.15s, border-color 0.15s;
        }
        .cat-tab-active { color: #185FA5; border-bottom-color: #185FA5; }
        .cat-search {
          width: 100%; border: 1px solid #d1d5db; border-radius: 8px;
          padding: 10px 14px; font-size: 14px; outline: none; box-sizing: border-box;
          margin-bottom: 20px; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .cat-search:focus { border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.1); }
        .cat-primary-btn {
          background: #185FA5; color: white; padding: 10px 20px; border-radius: 8px;
          border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s;
        }
        .cat-primary-btn:hover { background: #14508a; }
        .cat-primary-btn:disabled { background: #94a3b8; cursor: not-allowed; }
        .cat-secondary-btn {
          background: white; color: #374151; padding: 10px 20px; border-radius: 8px;
          border: 1px solid #d1d5db; font-size: 14px; font-weight: 500; cursor: pointer;
        }
        .cat-outline-btn {
          background: white; color: #374151; padding: 10px 16px; border-radius: 8px;
          border: 1px solid #d1d5db; font-size: 14px; font-weight: 500; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
        }
        .cat-form-card {
          background: white; border: 1px solid #e5e7eb; border-radius: 12px;
          overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .cat-form-header {
          padding: 14px 20px; border-bottom: 1px solid #f1f5f9;
          display: flex; justify-content: space-between; align-items: center;
        }
        .cat-form-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
        .cat-form-body { padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .cat-label { font-size: 12px; font-weight: 600; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; display: block; }
        .cat-input {
          width: 100%; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 10px 14px; font-size: 14px; outline: none; color: #111827; box-sizing: border-box;
        }
        .cat-input:focus { border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,0.1); }
        .cat-radio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cat-radio-card {
          padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;
          text-align: center; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; transition: all 0.2s;
        }
        .cat-radio-card-active { border-color: #185FA5; background: #e0f0ff; color: #185FA5; }
        .cat-radio-card-gray { border-color: #185FA5; background: #f1f5f9; color: #374151; }
        .cat-form-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
        .cat-empty { text-align: center; padding: 80px 40px; color: #94a3b8; }
        .cat-empty h3 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px; }
        .cat-empty p { font-size: 14px; color: #6b7280; margin: 0; }
      `}</style>

      {toast && <div className="cat-toast">{toast}</div>}

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px 40px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#111827' }}>Catálogos</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Gestiona y explora catálogos de cuentas</p>
        </div>
        {showCatalogForm ? (
          <button className="cat-secondary-btn" onClick={() => setShowCatalogForm(false)}>Cancelar</button>
        ) : (
          <button className="cat-primary-btn" onClick={() => setShowCatalogForm(true)}>+ Crear catálogo</button>
        )}
      </div>

      <div style={{ padding: '32px 40px' }}>
        {showCatalogForm ? (
          /* ── Formulario nuevo catálogo ── */
          <div className="cat-form-card">
            <div className="cat-form-header">
              <h3>Nuevo catálogo</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }} onClick={() => setShowCatalogForm(false)}><IconX /></button>
            </div>
            <div className="cat-form-body">

              {/* Nombre */}
              <div>
                <label className="cat-label">Nombre</label>
                <input type="text" className="cat-input" placeholder="Ej: Catálogo SB Bancos 2024" value={formCatNombre} onChange={e => setFormCatNombre(e.target.value)} />
              </div>

              {/* Descripción */}
              <div>
                <label className="cat-label">Descripción</label>
                <textarea className="cat-input" style={{ resize: 'none' }} rows={3} placeholder="Descripción opcional..." value={formCatDesc} onChange={e => setFormCatDesc(e.target.value)} />
              </div>

              {/* Tipo de empresa — solo Financiera / Comercial */}
              <div>
                <label className="cat-label">Tipo de empresa <span style={{ color: '#dc2626' }}>*</span></label>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tipos.length}, 1fr)`, gap: 12 }}>
                  {tipos.map(t => {
                    const col = TIPO_COLORS[t.nombre] ?? TIPO_COLORS.comercial;
                    const active = formCatIdTipo === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormCatIdTipo(t.id)}
                        style={{
                          padding: '14px 10px', borderRadius: 10,
                          border: `2px solid ${active ? col.border : '#e2e8f0'}`,
                          background: active ? col.bg : 'white',
                          cursor: 'pointer', display: 'flex', flexDirection: 'column',
                          alignItems: 'center', gap: 6, transition: 'all 0.15s', fontFamily: 'inherit',
                        }}
                      >
                        <span style={{ fontSize: 26 }}>{TIPO_ICONS[t.nombre] ?? '🏢'}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? col.color : '#475569', textTransform: 'capitalize' }}>{t.nombre}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                          {t.nombre === 'financiera' ? 'Bancos, cooperativas, seguros' : 'Empresas, industrias, comercios'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {formCatIdTipo === null && (
                  <p style={{ fontSize: 11, color: '#f59e0b', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚠ Selecciona un tipo para continuar
                  </p>
                )}
              </div>

              {/* Archivo PDF */}
              <div>
                <label className="cat-label">Archivo PDF</label>
                <button className="cat-outline-btn" onClick={() => catFileInputRef.current?.click()}>
                  <IconAttachment /> {formCatFile ? formCatFile.name : 'Subir PDF del catálogo'}
                </button>
                <input type="file" ref={catFileInputRef} hidden accept=".pdf" onChange={e => handleCatFileChange(e.target.files?.[0]!)} />
                {extracting && <div style={{ fontSize: 13, color: '#64748b', padding: '8px 0' }}>Extrayendo cuentas del PDF...</div>}
                {extractedItems.length > 0 && !extracting && (
                  <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconCheck color="#166534" /> <span style={{ fontSize: 13, color: '#166534', fontWeight: 500 }}>{extractedItems.length} cuentas encontradas</span>
                  </div>
                )}
              </div>

              {/* Visibilidad */}
              <div>
                <label className="cat-label">Visibilidad</label>
                <div className="cat-radio-grid">
                  <div className={`cat-radio-card ${!formCatPublic ? 'cat-radio-card-gray' : ''}`} onClick={() => setFormCatPublic(false)}>Privado</div>
                  <div className={`cat-radio-card ${formCatPublic ? 'cat-radio-card-active' : ''}`} onClick={() => setFormCatPublic(true)}>Público</div>
                </div>
              </div>

              <div className="cat-form-footer">
                <button className="cat-secondary-btn" onClick={() => setShowCatalogForm(false)}>Cancelar</button>
                <button
                  className="cat-primary-btn"
                  disabled={!formCatNombre || formCatIdTipo === null || isCreatingCat || extracting}
                  onClick={createCatalog}
                >
                  {isCreatingCat ? 'Creando...' : 'Crear catálogo'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Tabs ── */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
              <button
                className={`cat-tab ${catalogTab === 'mis' ? 'cat-tab-active' : ''}`}
                onClick={() => { setCatalogTab('mis'); setSearchInput(''); setSearchCat(''); }}
              >
                Mis catálogos {catTotal > 0 && <span style={{ marginLeft: 6, background: '#E6F1FB', color: '#185FA5', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{catTotal}</span>}
              </button>
              <button
                className={`cat-tab ${catalogTab === 'publicos' ? 'cat-tab-active' : ''}`}
                onClick={() => { setCatalogTab('publicos'); setSearchInput(''); setSearchCat(''); }}
              >
                Públicos {pubCatTotal > 0 && <span style={{ marginLeft: 6, background: '#E6F1FB', color: '#185FA5', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10 }}>{pubCatTotal}</span>}
              </button>
            </div>

            {/* ── Search ── */}
            <input
              type="text"
              className="cat-search"
              placeholder="Buscar catálogo..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                searchTimerRef.current = setTimeout(() => setSearchCat(e.target.value), 400);
              }}
            />

            {/* ── Card list ── */}
            {currentList.length === 0 ? (
              <div className="cat-empty">
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <h3>No hay catálogos aún</h3>
                <p>{catalogTab === 'mis' ? 'Crea tu primer catálogo para comenzar.' : 'No se encontraron catálogos públicos.'}</p>
              </div>
            ) : (
              currentList.map(cat => (
                <div key={cat.id} className="cat-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    {/* Ícono con color según tipo */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      background: cat.tipo_nombre ? (TIPO_COLORS[cat.tipo_nombre]?.bg ?? '#E6F1FB') : '#E6F1FB',
                    }}>
                      {cat.tipo_nombre ? (TIPO_ICONS[cat.tipo_nombre] ?? '📋') : '📋'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      {/* Nombre + badge de tipo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 15, color: '#111827' }}>{cat.nombre}</span>
                        <TipoBadge tipoNombre={cat.tipo_nombre} />
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        {cat.descripcion || 'Sin descripción'}
                        {' · '}
                        {new Date(cat.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                      </div>
                      {catalogTab === 'publicos' && cat.autor_nombre && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>
                          por {cat.autor_nombre}
                        </p>
                      )}
                    </div>
                  </div>
                  {catalogTab === 'mis' ? (
                    <button
                      className="cat-edit-btn"
                      onClick={e => { e.stopPropagation(); navigate(`/dashboard/catalogos/${cat.id}`); }}
                    >
                      Editar
                    </button>
                  ) : (
                    <span
                      style={{ color: '#185FA5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); navigate(`/dashboard/catalogos/${cat.id}`); }}
                    >
                      Ver catálogo →
                    </span>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}