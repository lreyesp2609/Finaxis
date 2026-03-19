import { useState } from 'react';
import styles from './ModuloEstadoFinanciero.module.css';

/* ─── Types ── */
interface KPI           { label: string; value: string; delta: string; up: boolean; }
interface CatalogoItem  { cod: string; nombre: string; nivel: number; total: string; }
interface RatioItem     { nombre: string; valor: number; formula: string; nivel: string; color: string; gauge: number; }
interface RiesgoItem    { id: number; categoria: string; riesgo: string; prob: number; impacto: number; nivel: string; }
interface VerticalItem  { cuenta: string; valor: number; pct: number; }
interface HorizontalItem{ cuenta: string; val24: number; val25: number; }
interface ModuleCard    {
  icon: React.ReactNode; color: string;
  title: string; desc: string;
  stats: { label: string; val: string }[];
  tab: string;
}

/* ─── Icons ── */
const IconLibro = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const IconChartBar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IconTrendUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconFormula = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/><line x1="3" y1="12" x2="15" y2="12"/>
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IconAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconGrid = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

/* ─── Datos mock ── */
const KPIS: KPI[] = [
  { label: 'Activos Totales',   value: '$2.847M',  delta: '+8.4%',   up: true  },
  { label: 'Cartera Créditos',  value: '$1.850M',  delta: '+12.1%',  up: true  },
  { label: 'Liquidez',          value: '18.7%',    delta: '−0.3pp',  up: false },
  { label: 'Cobertura Prov.',   value: '134.2%',   delta: '+4.6pp',  up: true  },
  { label: 'ROE',               value: '14.2%',    delta: '+1.8pp',  up: true  },
  { label: 'Índice Morosidad',  value: '3.1%',     delta: '+0.2pp',  up: false },
];

const CATALOGO: CatalogoItem[] = [
  { cod: '1',      nombre: 'ACTIVOS',              nivel: 0, total: '2,847,500.00' },
  { cod: '11',     nombre: 'Fondos Disponibles',   nivel: 1, total: '284,750.00'   },
  { cod: '1101',   nombre: 'Caja',                 nivel: 2, total: '142,375.00'   },
  { cod: '110105', nombre: 'Efectivo',             nivel: 3, total: '98,600.00'    },
  { cod: '13',     nombre: 'Inversiones',          nivel: 1, total: '512,550.00'   },
  { cod: '14',     nombre: 'Cartera de Créditos',  nivel: 1, total: '1,850,200.00' },
];

const RATIOS: RatioItem[] = [
  { nombre: 'Razón Corriente',  valor: 2.34, formula: 'Activo Corriente / Pasivo Corriente',     nivel: 'BAJO',     color: '#16a34a', gauge: 45 },
  { nombre: 'Prueba Ácida',     valor: 1.87, formula: '(Act. C. − Inventarios) / Pasivo C.',     nivel: 'BAJO',     color: '#16a34a', gauge: 37 },
  { nombre: 'Deuda/Patrimonio', valor: 0.68, formula: 'Total Pasivos / Patrimonio',              nivel: 'MODERADO', color: '#d97706', gauge: 62 },
  { nombre: 'ROE',              valor: 14.2, formula: 'Utilidad Neta / Patrimonio × 100',        nivel: 'MODERADO', color: '#d97706', gauge: 71 },
];

const RIESGOS: RiesgoItem[] = [
  { id: 1, categoria: 'Crédito',     riesgo: 'Cartera vencida > 5%',        prob: 3, impacto: 4, nivel: 'ALTO'     },
  { id: 2, categoria: 'Liquidez',    riesgo: 'Retiros masivos simultáneos', prob: 2, impacto: 5, nivel: 'ALTO'     },
  { id: 3, categoria: 'Operacional', riesgo: 'Fallo sistema core bancario', prob: 2, impacto: 4, nivel: 'MODERADO' },
  { id: 4, categoria: 'Mercado',     riesgo: 'Variación tipo de cambio',    prob: 3, impacto: 3, nivel: 'MODERADO' },
];

const HEAT_DATA: number[][] = [
  [0, 0, 1, 1, 2],
  [0, 1, 1, 2, 3],
  [0, 1, 2, 3, 3],
  [1, 2, 3, 3, 4],
  [2, 3, 3, 4, 4],
];

const VERTICAL: VerticalItem[] = [
  { cuenta: 'Caja y Bancos',         valor: 142375, pct: 10.2 },
  { cuenta: 'Inversiones',           valor: 284750, pct: 20.5 },
  { cuenta: 'Cartera de Créditos',   valor: 527900, pct: 38.0 },
  { cuenta: 'Prop. Planta y Equipo', valor: 435625, pct: 31.3 },
];

const HORIZONTAL: HorizontalItem[] = [
  { cuenta: 'Ingresos por Intereses', val24: 820000,  val25: 1024000 },
  { cuenta: 'Comisiones',             val24: 145000,  val25: 178000  },
  { cuenta: 'Gastos Operacionales',   val24: 690000,  val25: 835000  },
  { cuenta: 'Utilidad Neta',          val24: 275000,  val25: 367000  },
];

/* ─── Helpers ── */
const HEAT_COLORS = ['#bbf7d0', '#fde68a', '#fca5a5', '#f87171', '#dc2626'];
const heatColor   = (v: number): string => HEAT_COLORS[v];
const fmtN        = (n: number): string =>
  new Intl.NumberFormat('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
const varPct      = (a: number, b: number): string =>
  (((b - a) / Math.abs(a)) * 100).toFixed(1);

const NIVEL_CLASS: Record<string, string> = {
  BAJO:     styles.nivelBajo,
  MODERADO: styles.nivelModerado,
  ALTO:     styles.nivelAlto,
};

const CAT_CLASS: Record<string, string> = {
  Crédito:     styles.catCredito,
  Liquidez:    styles.catLiquidez,
  Operacional: styles.catOperacional,
  Mercado:     styles.catMercado,
};

const TREE_DOT_CLASS: Record<number, string> = {
  0: styles.nivel0, 1: styles.nivel1, 2: styles.nivel2, 3: styles.nivel3,
};

/* ═══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════════════════════ */
export default function ModuloEstadoFinanciero() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const MODULES: ModuleCard[] = [
    { icon: <IconLibro />,    color: '#185FA5', title: 'Catálogo de Cuentas',  desc: 'Plan de cuentas SB · Estructura jerárquica completa',              stats: [{ label: 'Cuentas activas', val: '847' },  { label: 'Grupos raíz', val: '12' }],      tab: 'catalogo'   },
    { icon: <IconChartBar />, color: '#7c3aed', title: 'Análisis Vertical',    desc: 'Participación % de cada cuenta sobre el total del grupo',          stats: [{ label: 'Último período', val: 'Dic 2025' }, { label: 'Variación', val: '+2.4%' }],    tab: 'vertical'   },
    { icon: <IconTrendUp />,  color: '#16a34a', title: 'Análisis Horizontal',  desc: 'Variación absoluta y porcentual entre períodos comparados',        stats: [{ label: 'Períodos', val: '2' },           { label: 'Δ Ingresos', val: '+24.9%' }],   tab: 'horizontal' },
    { icon: <IconFormula />,  color: '#d97706', title: 'Ratios Financieros',   desc: 'Fórmulas personalizadas · Niveles de riesgo configurables',        stats: [{ label: 'Ratios guardados', val: '8' },   { label: 'Alertas activas', val: '2' }],   tab: 'ratios'     },
    { icon: <IconShield />,   color: '#dc2626', title: 'Riesgo Operacional',   desc: 'Matriz de probabilidad · Mapa de calor · Frecuencia mensual',      stats: [{ label: 'Riesgos registrados', val: '14' },{ label: 'Riesgos altos', val: '3' }],   tab: 'riesgo'     },
    { icon: <IconDownload />, color: '#6b7280', title: 'Exportar Informes',    desc: 'Genera reportes PDF con análisis completo y ratios calculados',    stats: [{ label: 'Último reporte', val: 'Hoy' },   { label: 'Páginas', val: '24' }],          tab: 'overview'   },
  ];

  return (
    <div className={styles.root}>

      {/* ── PAGE HEADER ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={styles.headerTitle}>Estado Financiero</h1>
            <p className={styles.headerSub}>Superintendencia de Bancos · Período 2025</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnOutline}><IconDownload /> Exportar PDF</button>
          <button className={styles.btnPrimary}><IconPlus /> Nuevo Análisis</button>
        </div>
      </div>

      {/* ── KPI STRIP ── */}
      <div className={styles.kpiStrip}>
        {KPIS.map((k) => (
          <div key={k.label} className={styles.kpi}>
            <span className={styles.kpiLabel}>{k.label}</span>
            <span className={styles.kpiValue}>{k.value}</span>
            <span className={`${styles.kpiDelta} ${k.up ? styles.up : styles.down}`}>
              {k.up ? '▲' : '▼'} {k.delta}
            </span>
          </div>
        ))}
      </div>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        {[
          { id: 'overview',   label: 'Resumen',             icon: <IconGrid />     },
          { id: 'catalogo',   label: 'Catálogo de Cuentas', icon: <IconLibro />    },
          { id: 'vertical',   label: 'Análisis Vertical',   icon: <IconChartBar /> },
          { id: 'horizontal', label: 'Análisis Horizontal', icon: <IconTrendUp />  },
          { id: 'ratios',     label: 'Ratios Financieros',  icon: <IconFormula />  },
          { id: 'riesgo',     label: 'Riesgo Operacional',  icon: <IconAlert />    },
        ].map((t) => (
          <button
            key={t.id}
            className={`${styles.navTab}${activeTab === t.id ? ` ${styles.active}` : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── CONTENT ── */}
      <main className={styles.main}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className={styles.overview}>
            <div className={styles.modulesGrid}>
              {MODULES.map((mod) => (
                <button
                  key={mod.title}
                  className={styles.moduleCard}
                  onClick={() => mod.tab !== 'overview' && setActiveTab(mod.tab)}
                >
                  <div className={styles.moduleIcon} style={{ color: mod.color, background: `${mod.color}15` }}>
                    {mod.icon}
                  </div>
                  <div className={styles.moduleBody}>
                    <h3>{mod.title}</h3>
                    <p>{mod.desc}</p>
                    <div className={styles.moduleStats}>
                      {mod.stats.map((s) => (
                        <div key={s.label} className={styles.moduleStat}>
                          <span className="val" style={{ color: mod.color }}>{s.val}</span>
                          <span className="lbl">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className={styles.moduleArrow}><IconArrowRight /></span>
                </button>
              ))}
            </div>

            <div className={styles.previewRow}>
              {/* Ratios mini */}
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>Ratios · Vista rápida</span>
                  <button className={styles.previewLink} onClick={() => setActiveTab('ratios')}>Ver todos →</button>
                </div>
                <div className={styles.ratiosMini}>
                  {RATIOS.map((r) => (
                    <div key={r.nombre} className={styles.ratioMiniRow}>
                      <span className={styles.ratioMiniNombre}>{r.nombre}</span>
                      <span className={styles.ratioMiniValor}>{r.valor}</span>
                      <span className={`${styles.nivelPill} ${NIVEL_CLASS[r.nivel]}`}>{r.nivel}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heat mini */}
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>Mapa de Calor · Riesgo</span>
                  <button className={styles.previewLink} onClick={() => setActiveTab('riesgo')}>Ver →</button>
                </div>
                <div className={styles.heatMiniWrap}>
                  <div className={styles.heatMiniY}>
                    {['Muy Alto', 'Alto', 'Medio', 'Bajo', 'Mínimo'].map((l) => <span key={l}>{l}</span>)}
                  </div>
                  <div>
                    <div className={styles.heatMini}>
                      {HEAT_DATA.map((row, ri) =>
                        row.map((val, ci) => (
                          <div key={`${ri}-${ci}`} className={styles.heatCell} style={{ background: heatColor(val) }} />
                        ))
                      )}
                    </div>
                    <div className={styles.heatMiniX}>
                      {['Raro', 'Improbable', 'Posible', 'Probable', 'C.seguro'].map((l) => <span key={l}>{l}</span>)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Riesgos mini */}
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span className={styles.previewTitle}>Riesgos Registrados</span>
                  <button className={styles.previewLink} onClick={() => setActiveTab('riesgo')}>Ver matriz →</button>
                </div>
                {RIESGOS.map((r) => (
                  <div key={r.id} className={styles.riesgoMiniRow}>
                    <span className={styles.riesgoMiniCat}>{r.categoria}</span>
                    <span className={styles.riesgoMiniNombre}>{r.riesgo}</span>
                    <span className={`${styles.nivelPill} ${NIVEL_CLASS[r.nivel]}`}>{r.nivel}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CATÁLOGO */}
        {activeTab === 'catalogo' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Catálogo de Cuentas</h2>
                <p className={styles.sectionSub}>Plan de cuentas Superintendencia de Bancos del Ecuador</p>
              </div>
              <div className={styles.sectionActions}>
                <button className={styles.btnOutline}><IconDownload /> Importar PDF</button>
                <button className={styles.btnPrimary}><IconPlus /> Nueva cuenta</button>
              </div>
            </div>
            <div className={styles.catalogSearchBar}>
              <IconSearch />
              <input className={styles.searchInput} placeholder="Buscar por código o nombre de cuenta…" />
            </div>
            <div className={styles.catalogTable}>
              <div className={styles.catalogThead}>
                <div className={styles.catalogTh}>Código</div>
                <div className={styles.catalogTh}>Nombre de Cuenta</div>
                <div className={styles.catalogTh} style={{ textAlign: 'right' }}>Saldo Actual</div>
                <div className={styles.catalogTh} style={{ textAlign: 'right' }}>% Participación</div>
                <div className={styles.catalogTh} style={{ textAlign: 'center' }}>Estado</div>
              </div>
              {CATALOGO.map((c) => (
                <div key={c.cod} className={styles.catalogRow} style={{ paddingLeft: `${20 + c.nivel * 26}px` }}>
                  <div className={styles.catalogCod}>
                    <span className={`${styles.treeDot} ${TREE_DOT_CLASS[c.nivel]}`} />
                    {c.cod}
                  </div>
                  <div className={styles.catalogNom} style={{ fontWeight: c.nivel <= 1 ? 600 : 400 }}>{c.nombre}</div>
                  <div className={styles.catalogNum}>{c.total}</div>
                  <div className={styles.catalogNum}>
                    <div className={styles.miniBarWrap}>
                      <span>{((parseFloat(c.total.replace(/,/g, '')) / 2847500) * 100).toFixed(1)}%</span>
                      <div className={styles.miniBar} style={{ width: `${Math.max(4, Math.min(80, (parseFloat(c.total.replace(/,/g, '')) / 2847500) * 80))}px` }} />
                    </div>
                  </div>
                  <div className={styles.catalogSt}><span className={styles.badgeActiva}>Activa</span></div>
                </div>
              ))}
              <div className={styles.catalogMore}>
                <button className={styles.btnGhost}>Cargar las 847 cuentas completas →</button>
              </div>
            </div>
          </div>
        )}

        {/* ANÁLISIS VERTICAL */}
        {activeTab === 'vertical' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Análisis Vertical</h2>
                <p className={styles.sectionSub}>Composición porcentual del Estado Financiero · Diciembre 2025</p>
              </div>
              <button className={styles.btnOutline}><IconDownload /> Exportar</button>
            </div>
            <div className={styles.verticalLayout}>
              <div className={styles.verticalTableWrap}>
                <div className={styles.vThead}>
                  <div className={styles.vTh}>Cuenta</div>
                  <div className={styles.vTh} style={{ textAlign: 'right' }}>Valor (USD)</div>
                  <div className={styles.vTh} style={{ textAlign: 'right' }}>% Part.</div>
                  <div className={styles.vTh}>Distribución</div>
                </div>
                {VERTICAL.map((r) => (
                  <div key={r.cuenta} className={styles.vRow}>
                    <div className={styles.vNom}>{r.cuenta}</div>
                    <div className={styles.vNum}>{fmtN(r.valor)}</div>
                    <div className={styles.vPct}><span className={styles.pctChip}>{r.pct.toFixed(1)}%</span></div>
                    <div className={styles.vBarCell}>
                      <div className={styles.vBarTrack}>
                        <div className={styles.vBarFill} style={{ width: `${r.pct}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className={styles.vTotalRow}>
                  <div className={styles.vNom} style={{ fontWeight: 700 }}>TOTAL ACTIVOS</div>
                  <div className={styles.vNum} style={{ fontWeight: 700 }}>1,390,650</div>
                  <div className={styles.vPct}><span className={`${styles.pctChip} ${styles.pctChipTotal}`}>100.0%</span></div>
                  <div />
                </div>
              </div>
              <div className={styles.verticalInsight}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}><IconChartBar /></span>
                  <span>Interpretación Automática</span>
                </div>
                <ul className={styles.insightList}>
                  <li><span className={styles.insightDot} style={{ background: '#7c3aed' }} />El <strong>38.0%</strong> está concentrado en <strong>Cartera de Créditos</strong>.</li>
                  <li><span className={styles.insightDot} style={{ background: '#185FA5' }} />Solo el <strong>10.2%</strong> corresponde a <strong>Caja y Bancos</strong>.</li>
                  <li><span className={styles.insightDot} style={{ background: '#16a34a' }} />Los <strong>activos fijos</strong> representan el 31.3% del total.</li>
                </ul>
                <div className={styles.insightDonut}>
                  <svg viewBox="0 0 140 140" width="150" height="150">
                    {[
                      { pct: 10.2, color: '#185FA5', offset: 0    },
                      { pct: 20.5, color: '#7c3aed', offset: 10.2 },
                      { pct: 38.0, color: '#d97706', offset: 30.7 },
                      { pct: 31.3, color: '#16a34a', offset: 68.7 },
                    ].map((seg) => {
                      const r2 = 50, cx = 70, cy = 70;
                      const circ = 2 * Math.PI * r2;
                      const dash = (seg.pct / 100) * circ;
                      const gap  = circ - dash;
                      const rot  = (seg.offset / 100) * 360 - 90;
                      return (
                        <circle key={seg.color} cx={cx} cy={cy} r={r2}
                          fill="none" stroke={seg.color} strokeWidth="20"
                          strokeDasharray={`${dash} ${gap}`}
                          transform={`rotate(${rot} ${cx} ${cy})`} />
                      );
                    })}
                    <circle cx="70" cy="70" r="34" fill="white" />
                    <text x="70" y="67" textAnchor="middle" fill="#374151" fontSize="11" fontWeight="600">Activos</text>
                    <text x="70" y="81" textAnchor="middle" fill="#9ca3af" fontSize="10">2025</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANÁLISIS HORIZONTAL */}
        {activeTab === 'horizontal' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Análisis Horizontal</h2>
                <p className={styles.sectionSub}>Comparativo 2024 vs 2025 · Variación absoluta y porcentual</p>
              </div>
              <div className={styles.sectionActions}>
                <div className={styles.periodSelector}>
                  <span>2024</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span>2025</span>
                </div>
                <button className={styles.btnOutline}><IconDownload /> Exportar</button>
              </div>
            </div>
            <div className={styles.hTable}>
              <div className={styles.hThead}>
                <div className={styles.hTh}>Cuenta</div>
                <div className={styles.hTh} style={{ textAlign: 'right' }}>2024 (USD)</div>
                <div className={styles.hTh} style={{ textAlign: 'right' }}>2025 (USD)</div>
                <div className={styles.hTh} style={{ textAlign: 'right' }}>Variación $</div>
                <div className={styles.hTh} style={{ textAlign: 'right' }}>Variación %</div>
                <div className={styles.hTh}>Tendencia</div>
              </div>
              {HORIZONTAL.map((r) => {
                const varAbs = r.val25 - r.val24;
                const pct    = parseFloat(varPct(r.val24, r.val25));
                const isUp   = varAbs >= 0;
                return (
                  <div key={r.cuenta} className={styles.hRow}>
                    <div className={styles.hNom}>{r.cuenta}</div>
                    <div className={`${styles.hNum} ${styles.muted}`}>{fmtN(r.val24)}</div>
                    <div className={styles.hNum}>{fmtN(r.val25)}</div>
                    <div className={`${styles.hNum} ${isUp ? styles.pos : styles.neg}`}>{isUp ? '+' : ''}{fmtN(varAbs)}</div>
                    <div className={`${styles.hNum} ${isUp ? styles.pos : styles.neg}`}>
                      <span className={styles.pctBadge} style={{ background: isUp ? '#dcfce7' : '#fee2e2', color: isUp ? '#15803d' : '#b91c1c', border: `1px solid ${isUp ? '#86efac' : '#fca5a5'}` }}>
                        {isUp ? '▲' : '▼'} {Math.abs(pct)}%
                      </span>
                    </div>
                    <div className={styles.hSpark}>
                      <svg width="80" height="28" viewBox="0 0 80 28">
                        <line x1="5" y1="18" x2="75" y2={isUp ? '8' : '22'} stroke={isUp ? '#16a34a' : '#dc2626'} strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="5"  cy="18"           r="3" fill={isUp ? '#16a34a' : '#dc2626'} />
                        <circle cx="75" cy={isUp ? 8 : 22} r="3" fill={isUp ? '#16a34a' : '#dc2626'} />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={styles.hSummary}>
              {[
                { label: 'Crecimiento total ingresos', val: '+24.9%', pos: true  },
                { label: 'Incremento en costos',        val: '+20.9%', pos: false },
                { label: 'Crecimiento utilidad neta',   val: '+33.5%', pos: true  },
              ].map((s, i) => (
                <div key={s.label} style={{ display: 'contents' }}>
                  {i > 0 && <div className={styles.hSumSep} />}
                  <div className={styles.hSumItem}>
                    <span className={styles.hSumLabel}>{s.label}</span>
                    <span className={`${styles.hSumVal} ${s.pos ? styles.pos : styles.neg}`}>{s.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RATIOS */}
        {activeTab === 'ratios' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Ratios Financieros</h2>
                <p className={styles.sectionSub}>Fórmulas personalizadas · Niveles de riesgo configurables por usuario</p>
              </div>
              <button className={styles.btnPrimary}><IconPlus /> Nueva fórmula</button>
            </div>
            <div className={styles.riskLevels}>
              <span className={styles.riskLevelsTitle}>Límites de riesgo:</span>
              {[
                { label: 'BAJO',          range: '< 1.5',     dot: '#16a34a' },
                { label: 'MODERADO',       range: '1.5 – 2.5', dot: '#d97706' },
                { label: 'SOBRE PROMEDIO', range: '2.5 – 4.0', dot: '#ea580c' },
                { label: 'ALTO',           range: '> 4.0',     dot: '#dc2626' },
              ].map((n) => (
                <div key={n.label} className={styles.riskLevelChip}>
                  <span className={styles.riskDot} style={{ background: n.dot }} />
                  <span className={styles.riskLbl}>{n.label}</span>
                  <span className={styles.riskRange}>{n.range}</span>
                  <button className={styles.riskEditBtn} title="Editar límite">✎</button>
                </div>
              ))}
            </div>
            <div className={styles.ratiosGrid}>
              {RATIOS.map((r) => (
                <div key={r.nombre} className={styles.ratioCard}>
                  <div className={styles.ratioCardHeader}>
                    <span className={styles.ratioNombre}>{r.nombre}</span>
                    <span className={`${styles.nivelPillLg} ${NIVEL_CLASS[r.nivel]}`}>{r.nivel}</span>
                  </div>
                  <div className={styles.ratioValor} style={{ color: r.color }}>{r.valor}</div>
                  <div className={styles.ratioFormula}>{r.formula}</div>
                  <div className={styles.ratioGauge}>
                    <div className={styles.ratioGaugeFill} style={{ width: `${r.gauge}%`, background: r.color }} />
                  </div>
                </div>
              ))}
              <div className={styles.ratioAddCard}>
                <IconPlus />
                <span>Definir nueva fórmula</span>
                <p>Selecciona cuentas del catálogo y construye tu propio indicador</p>
              </div>
            </div>
          </div>
        )}

        {/* RIESGO OPERACIONAL */}
        {activeTab === 'riesgo' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Riesgo Operacional</h2>
                <p className={styles.sectionSub}>Registro mensual · Matriz de probabilidad e impacto · Mapa de calor</p>
              </div>
              <button className={styles.btnPrimary}><IconPlus /> Registrar riesgo</button>
            </div>
            <div className={styles.riesgoLayout}>
              <div className={styles.riesgoTableSection}>
                <p className={styles.subSectionTitle}>Riesgos del período</p>
                <div className={styles.riesgoTable}>
                  <div className={styles.rtThead}>
                    <div className={styles.rtTh}>Categoría</div>
                    <div className={styles.rtTh}>Descripción del Riesgo</div>
                    <div className={styles.rtTh} style={{ textAlign: 'center' }}>Prob.</div>
                    <div className={styles.rtTh} style={{ textAlign: 'center' }}>Impacto</div>
                    <div className={styles.rtTh} style={{ textAlign: 'center' }}>Nivel</div>
                    <div className={styles.rtTh} style={{ textAlign: 'center' }}>Frec./Mes</div>
                  </div>
                  {RIESGOS.map((r) => {
                    const pc = `hsl(${120 - r.prob    * 24}, 65%, 45%)`;
                    const ic = `hsl(${120 - r.impacto * 24}, 65%, 45%)`;
                    return (
                      <div key={r.id} className={styles.rtRow}>
                        <div><span className={`${styles.catTag} ${CAT_CLASS[r.categoria]}`}>{r.categoria}</span></div>
                        <div className={styles.rtDesc}>{r.riesgo}</div>
                        <div className={styles.rtNum}><span className={styles.probDot} style={{ background: pc }}>{r.prob}</span></div>
                        <div className={styles.rtNum}><span className={styles.probDot} style={{ background: ic }}>{r.impacto}</span></div>
                        <div className={styles.rtNum}><span className={`${styles.nivelPill} ${NIVEL_CLASS[r.nivel]}`}>{r.nivel}</span></div>
                        <div className={styles.rtNum}><input className={styles.freqInput} type="number" defaultValue={2} min={0} max={99} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={styles.heatSection}>
                <p className={styles.subSectionTitle}>Mapa de Calor</p>
                <div className={styles.heatMapFull}>
                  <div className={styles.heatYLabel}>← IMPACTO</div>
                  <div className={styles.heatYAxis}>
                    {['Catastrófico', 'Mayor', 'Moderado', 'Menor', 'Mínimo'].map((l) => <span key={l}>{l}</span>)}
                  </div>
                  <div className={styles.heatGridWrap}>
                    <div className={styles.heatGrid}>
                      {HEAT_DATA.map((row, ri) =>
                        row.map((val, ci) => (
                          <div key={`${ri}-${ci}`} className={styles.heatCellFull} style={{ background: heatColor(val) }}>
                            <span className={styles.heatCellVal}>{val > 0 ? val : ''}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className={styles.heatXAxis}>
                      {['Raro', 'Improbable', 'Posible', 'Probable', 'Casi seguro'].map((l) => <span key={l}>{l}</span>)}
                    </div>
                    <div className={styles.heatXLabel}>PROBABILIDAD →</div>
                  </div>
                </div>
                <div className={styles.heatLegend}>
                  {[
                    { color: '#bbf7d0', label: 'Aceptable' },
                    { color: '#fde68a', label: 'Tolerable'  },
                    { color: '#fca5a5', label: 'Moderado'   },
                    { color: '#f87171', label: 'Alto'        },
                    { color: '#dc2626', label: 'Crítico'     },
                  ].map((l) => (
                    <div key={l.label} className={styles.heatLegendItem}>
                      <span className={styles.heatLegendDot} style={{ background: l.color }} />
                      <span>{l.label}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.riesgoSummary}>
                  {[
                    { label: 'Críticos',   count: 0, color: '#dc2626' },
                    { label: 'Altos',      count: 2, color: '#ea580c' },
                    { label: 'Moderados',  count: 2, color: '#d97706' },
                    { label: 'Tolerables', count: 8, color: '#16a34a' },
                    { label: 'Aceptables', count: 2, color: '#6b7280' },
                  ].map((s) => (
                    <div key={s.label} className={styles.rsItem}>
                      <span className={styles.rsCount} style={{ color: s.color }}>{s.count}</span>
                      <span className={styles.rsLabel}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}