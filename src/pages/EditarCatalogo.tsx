import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import styles from './EditarCatalogo.module.css';

/* ── Types ── */
interface Catalogo {
  id: number;
  nombre: string;
  descripcion: string | null;
  publico: boolean;
  estado: boolean;
  user: string;
  created_at: string;
}

interface ItemCat {
  id: number;
  nombre: string;
  codigo: string | null;
  contenedor: boolean;
  iditempadre: number | null;
  created_at: string;
  children?: ItemCat[];
  _dirty?: boolean;
  _new?: boolean;
  _deleted?: boolean;
}

/* ── Icons ── */
function IconX({ size = 18 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>; }
function IconBack() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>; }
function IconLock({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>; }
function IconGlobe({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>; }
function IconFolder({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>; }
function IconItem({ size = 16 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>; }
function IconChevron({ open, size = 14 }: { open: boolean; size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6" /></svg>; }
function IconEdit({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>; }
function IconPlus({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function IconCheck({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function IconSave({ size = 15 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>; }
function IconDrag({ size = 14 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="9" cy="19" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="19" r="1" fill="currentColor" stroke="none"/></svg>; }

/* ── Drag state (module-level ref, no re-renders) ── */
const dragState = {
  draggedId: null as number | null,
};

/* ── Tree helpers ── */
function buildTree(items: ItemCat[]): ItemCat[] {
  const map = new Map<number, ItemCat>();
  items.forEach(i => map.set(i.id, { ...i, children: [] }));
  const roots: ItemCat[] = [];
  map.forEach(item => {
    if (item.iditempadre === null) roots.push(item);
    else { const p = map.get(item.iditempadre); if (p) p.children!.push(item); else roots.push(item); }
  });
  return roots;
}

function flattenTree(nodes: ItemCat[]): ItemCat[] {
  const result: ItemCat[] = [];
  function walk(n: ItemCat) { result.push(n); n.children?.forEach(walk); }
  nodes.forEach(walk);
  return result;
}

/** Remove an item (by id) from the tree, return [newTree, removedItem] */
function removeFromTree(nodes: ItemCat[], id: number): [ItemCat[], ItemCat | null] {
  let removed: ItemCat | null = null;
  function walk(list: ItemCat[]): ItemCat[] {
    return list.reduce<ItemCat[]>((acc, n) => {
      if (n.id === id) { removed = n; return acc; }
      const newChildren = n.children ? walk(n.children) : [];
      acc.push({ ...n, children: newChildren });
      return acc;
    }, []);
  }
  return [walk(nodes), removed];
}

/** Insert item as last child of parentId (or root if parentId === null) */
function insertIntoParent(nodes: ItemCat[], item: ItemCat, parentId: number | null): ItemCat[] {
  if (parentId === null) return [...nodes, item];
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: [...(n.children ?? []), item] };
    return { ...n, children: n.children ? insertIntoParent(n.children, item, parentId) : [] };
  });
}

/** Check if targetId is a descendant of nodeId (to prevent circular moves) */
function isDescendant(nodes: ItemCat[], nodeId: number, targetId: number): boolean {
  function find(list: ItemCat[], lookingFor: number): ItemCat | null {
    for (const n of list) {
      if (n.id === lookingFor) return n;
      const r = find(n.children ?? [], lookingFor);
      if (r) return r;
    }
    return null;
  }
  const node = find(nodes, nodeId);
  if (!node) return false;
  function hasDesc(n: ItemCat, tid: number): boolean {
    return (n.children ?? []).some(c => c.id === tid || hasDesc(c, tid));
  }
  return hasDesc(node, targetId);
}

/* ── Add item inline form ── */
function AddItemForm({ onAdd, onCancel, isGroup }: {
  onAdd: (nombre: string, codigo: string) => void;
  onCancel: () => void;
  isGroup: boolean;
}) {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  return (
    <div className={styles.addItemForm}>
      <span className={styles.addItemFormIcon} style={{ color: isGroup ? '#185FA5' : '#94a3b8' }}>
        {isGroup ? <IconFolder size={15} /> : <IconItem size={15} />}
      </span>
      <input autoFocus type="text" className={styles.addItemInput}
        placeholder={isGroup ? 'Nombre del grupo...' : 'Nombre del ítem...'}
        value={nombre} onChange={e => setNombre(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && nombre.trim()) onAdd(nombre.trim(), codigo.trim()); if (e.key === 'Escape') onCancel(); }} />
      <input type="text" className={`${styles.addItemInput} ${styles.addItemInputCode}`}
        placeholder="Código" value={codigo} onChange={e => setCodigo(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && nombre.trim()) onAdd(nombre.trim(), codigo.trim()); if (e.key === 'Escape') onCancel(); }} />
      <button className={styles.addItemConfirm} disabled={!nombre.trim()} onClick={() => nombre.trim() && onAdd(nombre.trim(), codigo.trim())}><IconCheck size={13} /></button>
      <button className={styles.addItemCancel} onClick={onCancel}><IconX size={13} /></button>
    </div>
  );
}

/* ── Tree node ── */
function TreeNode({
  item, depth = 0, editMode, catalogoEnUso,
  onUpdateItem, onAddChild, onDeleteItem, onMoveItem,
  treeItems,
}: {
  item: ItemCat; depth?: number; editMode: boolean; catalogoEnUso: boolean;
  onUpdateItem: (id: number, fields: Partial<ItemCat>) => void;
  onAddChild: (parentId: number | null, nombre: string, codigo: string, isGroup: boolean) => void;
  onDeleteItem: (id: number) => void;
  onMoveItem: (draggedId: number, newParentId: number | null) => void;
  treeItems: ItemCat[];
}) {
  const [open, setOpen] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragOverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChildren = item.children && item.children.filter(c => !c._deleted).length > 0;
  const showAddForms = addingItem || addingGroup;
  const canDelete = !catalogoEnUso || item._new;

  /* Drag source */
  const handleDragStart = (e: React.DragEvent) => {
    if (!editMode) return;
    dragState.draggedId = item.id;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(item.id));
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    dragState.draggedId = null;
    (e.currentTarget as HTMLElement).style.opacity = '1';
  };

  /* Drop target (only groups can receive children) */
  const handleDragOver = (e: React.DragEvent) => {
    if (!editMode || !item.contenedor) return;
    const draggedId = dragState.draggedId;
    if (draggedId === null || draggedId === item.id) return;
    // Prevent dropping an ancestor into its own descendant
    if (isDescendant(treeItems, draggedId, item.id)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    // Auto-open folder on hover
    if (dragOverTimer.current) clearTimeout(dragOverTimer.current);
    dragOverTimer.current = setTimeout(() => setOpen(true), 500);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    if (dragOverTimer.current) clearTimeout(dragOverTimer.current);
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTimer.current) clearTimeout(dragOverTimer.current);
    setIsDragOver(false);
    const draggedId = dragState.draggedId;
    if (draggedId === null || draggedId === item.id) return;
    if (!item.contenedor) return;
    if (isDescendant(treeItems, draggedId, item.id)) return;
    onMoveItem(draggedId, item.id);
    setOpen(true);
  };

  return (
    <div>
      <div
        className={[
          styles.treeRow,
          item._dirty ? styles.treeRowDirty : '',
          item._new ? styles.treeRowNew : '',
          isDragOver ? styles.treeRowDropTarget : '',
        ].filter(Boolean).join(' ')}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
        draggable={editMode}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {editMode && (
          <span className={styles.dragHandle} title="Arrastrar">
            <IconDrag size={13} />
          </span>
        )}

        <span className={styles.treeToggle} onClick={() => (hasChildren || showAddForms) && setOpen(o => !o)}>
          {item.contenedor
            ? <IconChevron open={open} />
            : <span style={{ width: 14, display: 'inline-block' }} />}
        </span>

        <span className={styles.treeIcon} style={{ color: item.contenedor ? '#185FA5' : '#94a3b8' }}>
          {item.contenedor ? <IconFolder /> : <IconItem />}
        </span>

        {editMode ? (
          <input
            className={`${styles.treeInlineInput} ${styles.treeInlineInputCode}`}
            value={item.codigo ?? ''}
            placeholder="—"
            onChange={e => onUpdateItem(item.id, { codigo: e.target.value || null, _dirty: true })}
          />
        ) : (
          <span className={styles.treeCodigo}>{item.codigo ?? '—'}</span>
        )}

        {editMode ? (
          <input
            className={styles.treeInlineInput}
            value={item.nombre}
            onChange={e => onUpdateItem(item.id, { nombre: e.target.value, _dirty: true })}
          />
        ) : (
          <span className={styles.treeNombre}>{item.nombre}</span>
        )}

        <span className={`${styles.treeBadge} ${item.contenedor ? styles.treeBadgeFolder : styles.treeBadgeItem}`}>
          {item.contenedor ? 'Grupo' : 'Ítem'}
        </span>

        {item._new && <span className={styles.tagNew}>nuevo</span>}
        {item._dirty && !item._new && <span className={styles.tagDirty}>editado</span>}

        {editMode && (
          <div className={styles.treeActions}>
            {item.contenedor && (
              <>
                <button className={styles.treeActionBtn} title="Añadir ítem"
                  onClick={() => { setAddingItem(true); setAddingGroup(false); setOpen(true); }}>
                  <IconPlus size={11} /><IconItem size={12} />
                </button>
                <button className={styles.treeActionBtn} title="Añadir grupo"
                  onClick={() => { setAddingGroup(true); setAddingItem(false); setOpen(true); }}>
                  <IconPlus size={11} /><IconFolder size={12} />
                </button>
              </>
            )}
            {canDelete ? (
              <button className={styles.treeDeleteBtn} title="Eliminar" onClick={() => onDeleteItem(item.id)}>
                <IconX size={12} />
              </button>
            ) : (
              <button className={styles.treeDeleteBtnDisabled} title="No se puede eliminar: catálogo en uso" disabled>
                <IconX size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {item.contenedor && open && (
        <div>
          {item.children?.filter(c => !c._deleted).map(child => (
            <TreeNode
              key={child.id}
              item={child}
              depth={depth + 1}
              editMode={editMode}
              catalogoEnUso={catalogoEnUso}
              onUpdateItem={onUpdateItem}
              onAddChild={onAddChild}
              onDeleteItem={onDeleteItem}
              onMoveItem={onMoveItem}
              treeItems={treeItems}
            />
          ))}
          {addingItem && (
            <div style={{ paddingLeft: `${16 + (depth + 1) * 24}px` }}>
              <AddItemForm isGroup={false}
                onAdd={(n, c) => { onAddChild(item.id, n, c, false); setAddingItem(false); }}
                onCancel={() => setAddingItem(false)} />
            </div>
          )}
          {addingGroup && (
            <div style={{ paddingLeft: `${16 + (depth + 1) * 24}px` }}>
              <AddItemForm isGroup={true}
                onAdd={(n, c) => { onAddChild(item.id, n, c, true); setAddingGroup(false); }}
                onCancel={() => setAddingGroup(false)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main ── */
export default function EditarCatalogo() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [treeItems, setTreeItems] = useState<ItemCat[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [catalogoEnUso, setCatalogoEnUso] = useState(false);
  const snapshotRef = useRef<{ catalogo: Catalogo; tree: ItemCat[] } | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [draftNombre, setDraftNombre] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftPublico, setDraftPublico] = useState(false);

  const [addingRootItem, setAddingRootItem] = useState(false);
  const [addingRootGroup, setAddingRootGroup] = useState(false);

  // Drop zone state for root-level drops
  const [rootDropActive, setRootDropActive] = useState(false);

  const tempIdRef = useRef(-1);
  const isOwner = catalogo?.user === user?.id;

  /* ── Carga inicial ── */
  useEffect(() => {
    async function init() {
      if (!user || !id) return;
      const { data, error: rpcError } = await supabase.rpc('get_catalogo_detalle', { p_id: parseInt(id) });
      if (rpcError || !data) { setError('No se pudo cargar el catálogo.'); setLoading(false); return; }

      setCatalogo(data.catalogo);
      const flat: ItemCat[] = data.items ?? [];
      setTotalItems(flat.length);
      setTreeItems(buildTree(flat));
      setLoading(false);
    }
    init();
  }, [user, id]);

  /* ── Verificar si está en uso ── */
  useEffect(() => {
    async function checkEnUso() {
      if (!catalogo) return;
      const { count } = await supabase
        .from('estadodecuenta')
        .select('id', { count: 'exact', head: true })
        .eq('idcatalogo', catalogo.id)
        .eq('estado', true);
      setCatalogoEnUso((count ?? 0) > 0);
    }
    checkEnUso();
  }, [catalogo?.id]);

  /* ── Entrar en modo edición ── */
  const startEdit = () => {
    if (!catalogo) return;
    snapshotRef.current = {
      catalogo: { ...catalogo },
      tree: JSON.parse(JSON.stringify(treeItems)),
    };
    setDraftNombre(catalogo.nombre);
    setDraftDesc(catalogo.descripcion ?? '');
    setDraftPublico(catalogo.publico);
    setEditMode(true);
  };

  /* ── Cancelar ── */
  const cancelEdit = () => {
    if (snapshotRef.current) {
      setCatalogo(snapshotRef.current.catalogo);
      setTreeItems(snapshotRef.current.tree);
      setTotalItems(flattenTree(snapshotRef.current.tree).filter(i => !i._deleted).length);
    }
    setEditMode(false);
    setAddingRootItem(false);
    setAddingRootGroup(false);
  };

  /* ── Guardar ── */
  const saveAll = async () => {
    if (!catalogo) return;
    setSaving(true);

    const flatItems = flattenTree(treeItems);

    const itemsEdit = flatItems
  .filter(i => i._dirty && !i._new && !i._deleted)
  .map(i => ({
    id: i.id,
    nombre: i.nombre,
    codigo: i.codigo ?? '',
    iditempadre: i.iditempadre !== null ? String(i.iditempadre) : null, 
  }));

    const itemsNew = flatItems
      .filter(i => i._new && !i._deleted)
      .map(i => ({
        temp_id:     String(i.id),
        nombre:      i.nombre,
        codigo:      i.codigo ?? '',
        contenedor:  i.contenedor,
        iditempadre: i.iditempadre !== null ? String(i.iditempadre) : null,
      }));

    const itemsDelete = flatItems
      .filter(i => i._deleted && !i._new)
      .map(i => i.id);

    const { error } = await supabase.rpc('guardar_catalogo', {
      p_id:           catalogo.id,
      p_nombre:       draftNombre,
      p_descripcion:  draftDesc,
      p_publico:      draftPublico,
      p_items_edit:   itemsEdit,
      p_items_new:    itemsNew,
      p_items_delete: itemsDelete,
    });

    setSaving(false);

    if (error) {
      alert('Error al guardar: ' + error.message);
      return;
    }

    setCatalogo(c => c ? { ...c, nombre: draftNombre, descripcion: draftDesc || null, publico: draftPublico } : c);

    function clearFlags(nodes: ItemCat[]): ItemCat[] {
      return nodes
        .filter(n => !n._deleted)
        .map(n => ({ ...n, _dirty: false, _new: false, children: n.children ? clearFlags(n.children) : [] }));
    }
    setTreeItems(prev => clearFlags(prev));
    setTotalItems(flattenTree(treeItems).filter(i => !i._deleted).length);
    setEditMode(false);
    setAddingRootItem(false);
    setAddingRootGroup(false);
  };

  /* ── Actualizar ítem ── */
  const handleUpdateItem = (itemId: number, fields: Partial<ItemCat>) => {
    function update(nodes: ItemCat[]): ItemCat[] {
      return nodes.map(n => n.id === itemId
        ? { ...n, ...fields }
        : { ...n, children: n.children ? update(n.children) : [] });
    }
    setTreeItems(prev => update(prev));
  };

  /* ── Eliminar ítem ── */
  const handleDeleteItem = (itemId: number) => {
    function removeNode(nodes: ItemCat[]): ItemCat[] {
      return nodes
        .filter(n => n.id !== itemId)
        .map(n => ({ ...n, children: n.children ? removeNode(n.children) : [] }));
    }
    function markDeleted(nodes: ItemCat[]): ItemCat[] {
      return nodes.map(n => n.id === itemId
        ? { ...n, _deleted: true }
        : { ...n, children: n.children ? markDeleted(n.children) : [] });
    }

    const flat = flattenTree(treeItems);
    const target = flat.find(i => i.id === itemId);

    if (target?._new) {
      setTreeItems(prev => removeNode(prev));
    } else {
      setTreeItems(prev => markDeleted(prev));
    }
    setTotalItems(prev => prev - 1);
  };

  /* ── Añadir hijo ── */
  const handleAddChild = (parentId: number | null, nombre: string, codigo: string, isGroup: boolean) => {
    const newItem: ItemCat = {
      id: tempIdRef.current--,
      nombre,
      codigo: codigo || null,
      contenedor: isGroup,
      iditempadre: parentId,
      created_at: new Date().toISOString(),
      children: [],
      _new: true,
    };
    if (parentId === null) {
      setTreeItems(prev => [...prev, newItem]);
    } else {
      function addTo(nodes: ItemCat[]): ItemCat[] {
        return nodes.map(n => n.id === parentId
          ? { ...n, children: [...(n.children ?? []), newItem] }
          : { ...n, children: n.children ? addTo(n.children) : [] });
      }
      setTreeItems(prev => addTo(prev));
    }
    setTotalItems(prev => prev + 1);
  };

  /* ── Mover ítem (drag & drop) ── */
  const handleMoveItem = (draggedId: number, newParentId: number | null) => {
    setTreeItems(prev => {
      // Remove dragged item from wherever it is
      const [treeWithout, removed] = removeFromTree(prev, draggedId);
      if (!removed) return prev;

      // Update iditempadre and mark as dirty (unless it's new)
      const updatedItem: ItemCat = {
        ...removed,
        iditempadre: newParentId,
        _dirty: !removed._new ? true : removed._dirty,
      };

      // Insert into new parent
      return insertIntoParent(treeWithout, updatedItem, newParentId);
    });
  };

  /* ── Root drop zone handlers ── */
  const handleRootDragOver = (e: React.DragEvent) => {
    if (!editMode) return;
    const draggedId = dragState.draggedId;
    if (draggedId === null) return;
    // Only show root drop if item is NOT already at root
    const flat = flattenTree(treeItems);
    const dragged = flat.find(i => i.id === draggedId);
    if (!dragged || dragged.iditempadre === null) return;
    e.preventDefault();
    setRootDropActive(true);
  };

  const handleRootDragLeave = () => {
    setRootDropActive(false);
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setRootDropActive(false);
    const draggedId = dragState.draggedId;
    if (draggedId === null) return;
    handleMoveItem(draggedId, null);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className={styles.spinnerLg} />
    </div>
  );

  return (
    <>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate('/dashboard/catalogos')}>
          <IconBack /> Volver a catálogos
        </button>
      </div>

      <div className={styles.contentArea}>
        {error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button className={styles.primaryBtn} onClick={() => navigate('/dashboard/catalogos')}>Volver</button>
          </div>
        ) : catalogo && (
          <>
            {/* Banner edición */}
            {editMode && (
              <div className={styles.editBanner}>
                <span className={styles.editBannerDot} />
                <span>
                  Modo edición activo — los cambios no se guardan hasta presionar <strong>Guardar</strong>.
                  Puedes <strong>arrastrar</strong> ítems y grupos para reorganizarlos.
                  {catalogoEnUso && (
                    <span style={{ marginLeft: 8, fontWeight: 600 }}>
                      · Este catálogo está en uso: no se pueden eliminar ítems existentes
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* Catálogo header */}
            <div className={styles.catalogoHeader}>
              <div className={styles.catalogoMeta}>
                <div className={styles.catalogoIconWrap} style={{
                  backgroundColor: (editMode ? draftPublico : catalogo.publico) ? '#E6F1FB' : '#f3f4f6',
                  color: (editMode ? draftPublico : catalogo.publico) ? '#185FA5' : '#64748b'
                }}>
                  {(editMode ? draftPublico : catalogo.publico) ? <IconGlobe size={20} /> : <IconLock size={20} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editMode ? (
                    <input
                      className={styles.draftInputNombre}
                      value={draftNombre}
                      onChange={e => setDraftNombre(e.target.value)}
                      placeholder="Nombre del catálogo"
                    />
                  ) : (
                    <h1 className={styles.catalogoNombre}>{catalogo.nombre}</h1>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0 8px' }}>
                    <span className={`${styles.badge} ${(editMode ? draftPublico : catalogo.publico) ? styles.badgePub : styles.badgePriv}`}>
                      {(editMode ? draftPublico : catalogo.publico) ? 'Público' : 'Privado'}
                    </span>
                    {isOwner && <span className={styles.badgeOwner}>Tu catálogo</span>}
                    {catalogoEnUso && <span className={styles.badgeEnUso}>En uso</span>}
                  </div>

                  {editMode ? (
                    <textarea
                      className={styles.draftInputDesc}
                      value={draftDesc}
                      onChange={e => setDraftDesc(e.target.value)}
                      placeholder="Descripción opcional..."
                      rows={2}
                    />
                  ) : (
                    <p className={styles.catalogoDesc}>{catalogo.descripcion || 'Sin descripción'}</p>
                  )}

                  {editMode && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>Visibilidad:</span>
                      <button
                        className={`${styles.visibilidadBtn} ${draftPublico ? styles.visibilidadBtnPub : styles.visibilidadBtnPriv}`}
                        onClick={() => setDraftPublico(v => !v)}
                      >
                        {draftPublico ? <><IconGlobe size={13} /> Público</> : <><IconLock size={13} /> Privado</>}
                      </button>
                    </div>
                  )}

                  <span className={styles.catalogoFecha}>
                    Creado el {new Date(catalogo.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {isOwner && (
                <div className={styles.headerActions}>
                  {editMode ? (
                    <>
                      <button className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>Cancelar</button>
                      <button className={styles.saveBtn} onClick={saveAll} disabled={saving}>
                        {saving ? <><div className={styles.spinnerSm} /> Guardando...</> : <><IconSave size={14} /> Guardar cambios</>}
                      </button>
                    </>
                  ) : (
                    <button className={styles.editBtn} onClick={startEdit}>
                      <IconEdit size={14} /> Editar catálogo
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{totalItems}</span>
                <span className={styles.statLabel}>Ítems totales</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{treeItems.filter(i => !i._deleted).length}</span>
                <span className={styles.statLabel}>Grupos raíz</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum} style={{ color: catalogo.publico ? '#185FA5' : '#64748b' }}>
                  {catalogo.publico ? 'Público' : 'Privado'}
                </span>
                <span className={styles.statLabel}>Visibilidad</span>
              </div>
            </div>

            {/* Árbol */}
            <div className={`${styles.treeSection} ${editMode ? styles.treeSectionEdit : ''}`}>
              <div className={styles.treeSectionHeader}>
                <div>
                  <h2>Cuentas del catálogo</h2>
                  {editMode && <p className={styles.treeSectionHint}>Edita los campos directamente · Arrastra <IconDrag size={11} /> para reorganizar</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.treeCount}>{totalItems} ítems</span>
                  {editMode && (
                    <>
                      <button className={styles.addBtn} onClick={() => { setAddingRootItem(true); setAddingRootGroup(false); }}>
                        <IconPlus size={12} /> Ítem
                      </button>
                      <button className={`${styles.addBtn} ${styles.addBtnBlue}`} onClick={() => { setAddingRootGroup(true); setAddingRootItem(false); }}>
                        <IconPlus size={12} /> Grupo
                      </button>
                    </>
                  )}
                </div>
              </div>

              {totalItems === 0 && !addingRootItem && !addingRootGroup ? (
                <div className={styles.emptyTree}>
                  <IconFolder size={40} />
                  <p>Este catálogo no tiene ítems aún</p>
                  {editMode && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button className={styles.addBtn} onClick={() => setAddingRootItem(true)}><IconPlus size={12} /> Añadir ítem</button>
                      <button className={`${styles.addBtn} ${styles.addBtnBlue}`} onClick={() => setAddingRootGroup(true)}><IconPlus size={12} /> Añadir grupo</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.treeContainer}>
                  {treeItems.filter(i => !i._deleted).map(item => (
                    <TreeNode
                      key={item.id}
                      item={item}
                      depth={0}
                      editMode={editMode}
                      catalogoEnUso={catalogoEnUso}
                      onUpdateItem={handleUpdateItem}
                      onAddChild={handleAddChild}
                      onDeleteItem={handleDeleteItem}
                      onMoveItem={handleMoveItem}
                      treeItems={treeItems}
                    />
                  ))}

                  {/* Root drop zone: appears when dragging a nested item */}
                  {editMode && (
                    <div
                      className={`${styles.rootDropZone} ${rootDropActive ? styles.rootDropZoneActive : ''}`}
                      onDragOver={handleRootDragOver}
                      onDragLeave={handleRootDragLeave}
                      onDrop={handleRootDrop}
                    >
                      ↑ Soltar aquí para mover al nivel raíz
                    </div>
                  )}

                  {addingRootItem && (
                    <div style={{ padding: '4px 16px' }}>
                      <AddItemForm isGroup={false}
                        onAdd={(n, c) => { handleAddChild(null, n, c, false); setAddingRootItem(false); }}
                        onCancel={() => setAddingRootItem(false)} />
                    </div>
                  )}
                  {addingRootGroup && (
                    <div style={{ padding: '4px 16px' }}>
                      <AddItemForm isGroup={true}
                        onAdd={(n, c) => { handleAddChild(null, n, c, true); setAddingRootGroup(false); }}
                        onCancel={() => setAddingRootGroup(false)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}