import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --navy:   #0A1628;
    --panel:  #111E38;
    --card:   #162040;
    --border: rgba(255,255,255,0.07);
    --blue:   #1A73E8;
    --sky:    #5BB8F5;
    --green:  #34D399;
    --orange: #FB923C;
    --red:    #F87171;
    --white:  #FFFFFF;
    --gray:   #8A9BBF;
    --light:  #C8D8F0;
  }

  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--navy); color: var(--white); }

  .inv-app { display: flex; height: 100vh; overflow: hidden; }

  .sidebar { width: 220px; background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 28px 0; flex-shrink: 0; }
  .sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 22px 28px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
  .brand-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--sky), var(--blue)); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; box-shadow: 0 4px 14px rgba(91,184,245,0.35); }
  .brand-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--white); }
  .nav-section { padding: 0 12px; }
  .nav-label { font-size: 10px; font-weight: 500; color: var(--gray); text-transform: uppercase; letter-spacing: 1.5px; padding: 0 10px; margin-bottom: 6px; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; color: var(--gray); font-size: 14px; margin-bottom: 2px; border: 1px solid transparent; }
  .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--light); }
  .nav-item.active { background: rgba(26,115,232,0.15); color: var(--sky); border-color: rgba(91,184,245,0.2); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }
  .sidebar-footer { margin-top: auto; padding: 16px 22px; border-top: 1px solid var(--border); }
  .user-chip { display: flex; align-items: center; gap: 10px; }
  .user-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, var(--blue), var(--sky)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; }
  .user-name { font-size: 13px; font-weight: 500; color: var(--light); }
  .user-role { font-size: 11px; color: var(--gray); }

  .inv-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .inv-topbar { display: flex; align-items: center; justify-content: space-between; padding: 18px 32px; border-bottom: 1px solid var(--border); background: var(--panel); flex-shrink: 0; }
  .inv-topbar h1 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }
  .inv-topbar p  { font-size: 13px; color: var(--gray); margin-top: 2px; }
  .topbar-actions { display: flex; gap: 10px; align-items: center; }

  .btn-primary { display: flex; align-items: center; gap: 6px; padding: 9px 18px; background: linear-gradient(135deg, var(--blue), var(--sky)); border: none; border-radius: 10px; color: white; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(26,115,232,0.4); }
  .btn-primary:hover { transform: translateY(-1px); }
  .btn-secondary { padding: 9px 16px; background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--gray); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; }
  .btn-secondary:hover { border-color: var(--sky); color: var(--sky); }

  .inv-content { flex: 1; overflow-y: auto; padding: 24px 32px; }
  .inv-content::-webkit-scrollbar { width: 4px; }
  .inv-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
  .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .stat-icon.blue   { background: rgba(26,115,232,0.15); }
  .stat-icon.green  { background: rgba(52,211,153,0.15); }
  .stat-icon.orange { background: rgba(251,146,60,0.15); }
  .stat-icon.red    { background: rgba(248,113,113,0.15); }
  .stat-info { display: flex; flex-direction: column; gap: 2px; }
  .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--white); }
  .stat-lbl { font-size: 12px; color: var(--gray); }

  .filters-row { display: flex; gap: 10px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
  .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
  .search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--gray); font-size: 14px; pointer-events: none; }
  .search-input { width: 100%; padding: 10px 16px 10px 38px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; color: var(--white); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
  .search-input::placeholder { color: var(--gray); }
  .search-input:focus { border-color: var(--sky); box-shadow: 0 0 0 3px rgba(91,184,245,0.15); }
  .filter-select { padding: 10px 14px; background: var(--card); border: 1px solid var(--border); border-radius: 10px; color: var(--light); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; cursor: pointer; }
  .filter-select option { background: var(--card); }
  .results-count { font-size: 13px; color: var(--gray); margin-left: auto; }

  .table-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: rgba(255,255,255,0.03); }
  thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); padding: 14px 16px; text-align: left; font-weight: 500; white-space: nowrap; }
  tbody tr { border-top: 1px solid var(--border); transition: background 0.15s; }
  tbody tr:hover { background: rgba(255,255,255,0.025); }
  tbody td { padding: 13px 16px; font-size: 13px; color: var(--light); }

  .prod-name { font-weight: 500; color: var(--white); }
  .prod-code { font-size: 11px; color: var(--gray); margin-top: 2px; font-family: monospace; }
  .cat-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(91,184,245,0.1); color: var(--sky); border: 1px solid rgba(91,184,245,0.2); white-space: nowrap; }
  .stock-cell { display: flex; align-items: center; gap: 8px; min-width: 100px; }
  .stock-num { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; min-width: 28px; }
  .stock-bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; min-width: 50px; }
  .stock-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .status-tag { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .status-tag.ok     { background: rgba(52,211,153,0.12); color: var(--green); border: 1px solid rgba(52,211,153,0.2); }
  .status-tag.low    { background: rgba(251,146,60,0.12);  color: var(--orange); border: 1px solid rgba(251,146,60,0.2); }
  .status-tag.out    { background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }
  .price-cell { font-family: 'Syne', sans-serif; font-weight: 600; color: var(--green); }
  .actions-cell { display: flex; gap: 6px; }
  .btn-icon { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--gray); font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
  .btn-icon.edit:hover { border-color: var(--sky); color: var(--sky); background: rgba(91,184,245,0.08); }
  .btn-icon.del:hover  { border-color: var(--red); color: var(--red); background: rgba(248,113,113,0.08); }

  .empty-state { padding: 60px 20px; text-align: center; }
  .empty-icon  { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .empty-text  { font-size: 15px; color: var(--gray); }
  .loading-row td { text-align: center; padding: 40px; color: var(--gray); font-size: 14px; }
  .spinner-sm { display: inline-block; width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--sky); border-radius: 50%; animation: spin 0.7s linear infinite; vertical-align: middle; margin-right: 8px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 50; display: flex; align-items: center; justify-content: center; }
  .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 20px; padding: 32px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s ease; margin: 20px; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }
  .btn-close { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); color: var(--gray); font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .btn-close:hover { background: rgba(248,113,113,0.1); color: var(--red); border-color: var(--red); }
  .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .modal-grid .full { grid-column: 1 / -1; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-size: 12px; font-weight: 500; color: var(--sky); text-transform: uppercase; letter-spacing: 1px; }
  .field input, .field select { padding: 11px 14px; background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 10px; color: var(--white); font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
  .field input::placeholder { color: rgba(138,155,191,0.5); }
  .field input:focus, .field select:focus { border-color: var(--sky); background: rgba(91,184,245,0.08); box-shadow: 0 0 0 3px rgba(91,184,245,0.15); }
  .field input.err { border-color: var(--red); }
  .field select option { background: var(--panel); }
  .field-err { font-size: 12px; color: var(--red); }
  .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
  .btn-cancel { padding: 10px 20px; background: transparent; border: 1px solid var(--border); border-radius: 10px; color: var(--gray); font-family: 'DM Sans', sans-serif; font-size: 14px; cursor: pointer; transition: all 0.2s; }
  .btn-cancel:hover { border-color: var(--gray); color: var(--light); }
  .btn-save { padding: 10px 24px; background: linear-gradient(135deg, var(--blue), var(--sky)); border: none; border-radius: 10px; color: white; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(26,115,232,0.4); display: flex; align-items: center; gap: 8px; }
  .btn-save:hover { transform: translateY(-1px); }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .confirm-modal { max-width: 380px; text-align: center; }
  .confirm-icon { font-size: 48px; margin-bottom: 12px; }
  .confirm-text { font-size: 15px; color: var(--light); margin-bottom: 6px; }
  .confirm-sub  { font-size: 13px; color: var(--gray); margin-bottom: 24px; }
  .confirm-actions { display: flex; gap: 10px; justify-content: center; }
  .btn-delete { padding: 10px 24px; background: var(--red); border: none; border-radius: 10px; color: white; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; }
  .btn-delete:hover { background: #ef4444; }

  .toast { position: fixed; bottom: 24px; right: 24px; padding: 14px 20px; border-radius: 12px; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 10px; z-index: 200; animation: toastIn 0.3s ease; box-shadow: 0 8px 24px rgba(0,0,0,0.4); max-width: 320px; }
  .toast.success { background: rgba(52,211,153,0.15); border: 1px solid rgba(52,211,153,0.3); color: var(--green); }
  .toast.error   { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.3); color: var(--red); }
  @keyframes toastIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
`;

const CATEGORIAS = ["Bebidas","Botanas","Lácteos","Panadería","Limpieza","Abarrotes","Frutas y Verduras","Carnes","Otro"];
const UNIDADES   = ["pieza","litro","kg","caja","paquete","botella","lata"];
const EMPTY_FORM = { nombre:"", categoria:"Bebidas", stock:"", stock_minimo:"", precio:"", unidad:"pieza", proveedor:"", codigo_barras:"" };

const navItems = [
  { icon:"📊", label:"Dashboard",  page:"dashboard"  },
  { icon:"📦", label:"Inventario", page:"inventario" },
  { icon:"💰", label:"Ventas",     page:"ventas"     },
  { icon:"🔔", label:"Alertas",    page:"alertas"    },
  { icon:"📈", label:"Reportes",   page:"reportes"   },
];

function getStatus(stock, min) {
  if (stock <= 0) return "out";
  if (stock <= min) return "low";
  return "ok";
}

function statusLabel(s) {
  return s === "ok" ? "Normal" : s === "low" ? "Stock bajo" : "Agotado";
}

export default function Inventario({ onNavigate, user }) {
  const [productos, setProductos]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [catFilter, setCatFilter]       = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]     = useState({});
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState(null);
  const [delLoading, setDelLoading]     = useState(false);
  const [toast, setToast]               = useState(null);

  useEffect(() => {
    setLoading(true);
    const channel = supabase
      .channel("productos-realtime")
      .on("postgres_changes", { event:"*", schema:"public", table:"productos" }, () => fetchProductos())
      .subscribe();
    fetchProductos();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchProductos = async () => {
    const { data, error } = await supabase.from("productos").select("*").order("created_at", { ascending: false });
    if (!error) setProductos(data || []);
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = productos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.codigo_barras||"").includes(search) ||
      (p.proveedor||"").toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "Todas" || p.categoria === catFilter;
    const st          = getStatus(p.stock, p.stock_minimo);
    const matchStatus = statusFilter === "Todos" ||
      (statusFilter === "Normal"  && st === "ok")  ||
      (statusFilter === "Bajo"    && st === "low")  ||
      (statusFilter === "Agotado" && st === "out");
    return matchSearch && matchCat && matchStatus;
  });

  const totalProductos = productos.length;
  const totalUnidades  = productos.reduce((a, p) => a + (p.stock || 0), 0);
  const bajos          = productos.filter(p => getStatus(p.stock, p.stock_minimo) === "low").length;
  const agotados       = productos.filter(p => getStatus(p.stock, p.stock_minimo) === "out").length;

  const openAdd  = () => { setEditing(null); setForm(EMPTY_FORM); setFormErrors({}); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ nombre:p.nombre||"", categoria:p.categoria||"Bebidas", stock:p.stock??"", stock_minimo:p.stock_minimo??"", precio:p.precio??"", unidad:p.unidad||"pieza", proveedor:p.proveedor||"", codigo_barras:p.codigo_barras||"" });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (form.stock === "" || isNaN(form.stock)) e.stock = "Stock inválido";
    if (form.stock_minimo === "" || isNaN(form.stock_minimo)) e.stock_minimo = "Mínimo inválido";
    if (form.precio === "" || isNaN(form.precio)) e.precio = "Precio inválido";
    return e;
  };

  const handleSave = async () => {
    const e = validateForm();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSaving(true);
    const payload = { nombre:form.nombre.trim(), categoria:form.categoria, stock:Number(form.stock), stock_minimo:Number(form.stock_minimo), precio:parseFloat(form.precio), unidad:form.unidad, proveedor:form.proveedor.trim()||null, codigo_barras:form.codigo_barras.trim()||null };
    let error;
    if (editing) {
      ({ error } = await supabase.from("productos").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("productos").insert([payload]));
    }
    setSaving(false);
    if (error) { showToast("Error: " + error.message, "error"); return; }
    showToast(editing ? "✓ Producto actualizado" : "✓ Producto agregado");
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDelLoading(true);
    const { error } = await supabase.from("productos").delete().eq("id", deleting.id);
    setDelLoading(false);
    if (error) { showToast("Error: " + error.message, "error"); return; }
    showToast("✓ Producto eliminado");
    setDeleting(null);
  };

  const f = (key, val) => { setForm(p => ({...p, [key]:val})); setFormErrors(p => ({...p, [key]:""})); };

  const initials      = user?.user_metadata?.nombre ? user.user_metadata.nombre.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() : "JL";
  const nombreUsuario = user?.user_metadata?.nombre || "Jose Luis";

  return (
    <>
      <style>{styles}</style>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="inv-app">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-icon">S</div>
            <span className="brand-name">Sketch</span>
          </div>
          <div className="nav-section">
            <div className="nav-label">Menú</div>
            {navItems.map(item => (
              <div key={item.page}
                className={`nav-item ${item.page === "inventario" ? "active" : ""}`}
                onClick={() => onNavigate && onNavigate(item.page)}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div>
                <div className="user-name">{nombreUsuario}</div>
                <div className="user-role">Administrador</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="inv-main">
          <header className="inv-topbar">
            <div>
              <h1>Inventario</h1>
              <p>Gestión de productos en tiempo real</p>
            </div>
            <div className="topbar-actions">
              <button className="btn-secondary" onClick={fetchProductos}>↻ Actualizar</button>
              <button className="btn-primary" onClick={openAdd}>+ Agregar producto</button>
            </div>
          </header>

          <div className="inv-content">
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card"><div className="stat-icon blue">📦</div><div className="stat-info"><span className="stat-val">{totalProductos}</span><span className="stat-lbl">Total productos</span></div></div>
              <div className="stat-card"><div className="stat-icon green">🔢</div><div className="stat-info"><span className="stat-val">{totalUnidades}</span><span className="stat-lbl">Unidades en stock</span></div></div>
              <div className="stat-card"><div className="stat-icon orange">⚠️</div><div className="stat-info"><span className="stat-val" style={{color:'var(--orange)'}}>{bajos}</span><span className="stat-lbl">Stock bajo</span></div></div>
              <div className="stat-card"><div className="stat-icon red">🚨</div><div className="stat-info"><span className="stat-val" style={{color:'var(--red)'}}>{agotados}</span><span className="stat-lbl">Agotados</span></div></div>
            </div>

            {/* Filtros */}
            <div className="filters-row">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Buscar por nombre, código o proveedor..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="Todas">Todas las categorías</option>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="Todos">Todos los estados</option>
                <option value="Normal">Normal</option>
                <option value="Bajo">Stock bajo</option>
                <option value="Agotado">Agotado</option>
              </select>
              <span className="results-count">{filtered.length} productos</span>
            </div>

            {/* Tabla */}
            <div className="table-card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th><th>Categoría</th><th>Stock</th><th>Mín.</th>
                      <th>Estado</th><th>Precio</th><th>Unidad</th><th>Proveedor</th><th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr className="loading-row"><td colSpan={9}><span className="spinner-sm"/>Cargando productos...</td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-icon">📭</div>
                          <div className="empty-text">{search || catFilter !== "Todas" || statusFilter !== "Todos" ? "No se encontraron productos con ese filtro" : "No hay productos aún — agrega el primero"}</div>
                        </div>
                      </td></tr>
                    ) : filtered.map(p => {
                      const st = getStatus(p.stock, p.stock_minimo);
                      const pct = p.stock_minimo > 0 ? Math.min(100, Math.round((p.stock / (p.stock_minimo * 3)) * 100)) : 50;
                      const barColor = st === "ok" ? "var(--green)" : st === "low" ? "var(--orange)" : "var(--red)";
                      return (
                        <tr key={p.id}>
                          <td><div className="prod-name">{p.nombre}</div>{p.codigo_barras && <div className="prod-code">{p.codigo_barras}</div>}</td>
                          <td><span className="cat-badge">{p.categoria}</span></td>
                          <td><div className="stock-cell"><span className="stock-num" style={{color:barColor}}>{p.stock}</span><div className="stock-bar-bg"><div className="stock-bar-fill" style={{width:`${pct}%`,background:barColor}}/></div></div></td>
                          <td style={{color:'var(--gray)'}}>{p.stock_minimo}</td>
                          <td><span className={`status-tag ${st}`}>{statusLabel(st)}</span></td>
                          <td className="price-cell">${Number(p.precio).toFixed(2)}</td>
                          <td style={{color:'var(--gray)'}}>{p.unidad}</td>
                          <td style={{color:'var(--gray)'}}>{p.proveedor||"—"}</td>
                          <td><div className="actions-cell">
                            <button className="btn-icon edit" onClick={() => openEdit(p)}>✏️</button>
                            <button className="btn-icon del"  onClick={() => setDeleting(p)}>🗑️</button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Agregar/Editar */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? "Editar producto" : "Agregar producto"}</span>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-grid">
              <div className="field full">
                <label>Nombre del producto</label>
                <input placeholder="Ej: Coca-Cola 600ml" value={form.nombre} className={formErrors.nombre?"err":""} onChange={e => f("nombre", e.target.value)} />
                {formErrors.nombre && <span className="field-err">{formErrors.nombre}</span>}
              </div>
              <div className="field">
                <label>Categoría</label>
                <select value={form.categoria} onChange={e => f("categoria", e.target.value)}>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Unidad</label>
                <select value={form.unidad} onChange={e => f("unidad", e.target.value)}>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Stock actual</label>
                <input type="number" min="0" placeholder="0" value={form.stock} className={formErrors.stock?"err":""} onChange={e => f("stock", e.target.value)} />
                {formErrors.stock && <span className="field-err">{formErrors.stock}</span>}
              </div>
              <div className="field">
                <label>Stock mínimo</label>
                <input type="number" min="0" placeholder="5" value={form.stock_minimo} className={formErrors.stock_minimo?"err":""} onChange={e => f("stock_minimo", e.target.value)} />
                {formErrors.stock_minimo && <span className="field-err">{formErrors.stock_minimo}</span>}
              </div>
              <div className="field">
                <label>Precio ($)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.precio} className={formErrors.precio?"err":""} onChange={e => f("precio", e.target.value)} />
                {formErrors.precio && <span className="field-err">{formErrors.precio}</span>}
              </div>
              <div className="field">
                <label>Proveedor</label>
                <input placeholder="Nombre del proveedor" value={form.proveedor} onChange={e => f("proveedor", e.target.value)} />
              </div>
              <div className="field full">
                <label>Código de barras</label>
                <input placeholder="Ej: 7501234567890" value={form.codigo_barras} onChange={e => f("codigo_barras", e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? <><span className="spinner-sm"/>Guardando...</> : editing ? "Guardar cambios" : "Agregar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deleting && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDeleting(null)}>
          <div className="modal confirm-modal">
            <div className="confirm-icon">🗑️</div>
            <div className="confirm-text">¿Eliminar este producto?</div>
            <div className="confirm-sub"><strong style={{color:'var(--light)'}}>{deleting.nombre}</strong> será eliminado permanentemente.</div>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="btn-delete" onClick={handleDelete} disabled={delLoading}>{delLoading ? "Eliminando..." : "Sí, eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}