import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import Ventas from "./Ventas";


const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --navy:   #0A1628;
    --panel:  #111E38;
    --card:   #162040;
    --card2:  #1A2850;
    --border: rgba(255,255,255,0.07);
    --blue:   #1A73E8;
    --sky:    #5BB8F5;
    --cyan:   #34D8E8;
    --green:  #34D399;
    --orange: #FB923C;
    --red:    #F87171;
    --white:  #FFFFFF;
    --gray:   #8A9BBF;
    --light:  #C8D8F0;
  }

  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--navy); color: var(--white); }

  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── Sidebar ── */
  .sidebar {
    width: 230px;
    background: var(--panel);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 28px 0;
    flex-shrink: 0;
    animation: slideInLeft 0.5s ease both;
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1);
    z-index: 50;
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 22px 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
  }

  .brand-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--sky), var(--cyan));
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 18px;
    box-shadow: 0 4px 14px rgba(52,216,232,0.3);
  }

  .brand-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--white); }

  .nav-section { padding: 0 12px; margin-bottom: 8px; flex: 1; }

  .nav-label {
    font-size: 10px; font-weight: 500; color: var(--gray);
    text-transform: uppercase; letter-spacing: 1.5px;
    padding: 0 10px; margin-bottom: 6px;
  }

  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 10px;
    cursor: pointer; transition: all 0.2s ease;
    color: var(--gray); font-size: 14px; font-weight: 400;
    margin-bottom: 2px; border: 1px solid transparent;
    user-select: none;
  }

  .nav-item:hover { background: rgba(255,255,255,0.05); color: var(--light); }
  .nav-item.active { background: rgba(26,115,232,0.15); color: var(--sky); border-color: rgba(91,184,245,0.2); }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }

  .sidebar-footer {
    margin-top: auto;
    padding: 16px 22px;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .user-chip { display: flex; align-items: center; gap: 10px; }
  .user-avatar {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px;
    flex-shrink: 0;
  }
  .user-info { display: flex; flex-direction: column; overflow: hidden; }
  .user-name { font-size: 13px; font-weight: 500; color: var(--light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-role { font-size: 11px; color: var(--gray); }

  .btn-logout {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 9px 14px;
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 10px;
    color: var(--red);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .btn-logout:hover { background: rgba(248,113,113,0.2); }

  /* ── Mobile sidebar ── */
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(10,22,40,0.7);
    z-index: 40;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .hamburger {
    display: none;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    width: 38px; height: 38px;
    align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 18px;
    color: var(--light);
    flex-shrink: 0;
  }

  /* ── Main ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 28px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
    animation: fadeDown 0.5s 0.1s ease both;
    flex-shrink: 0;
    gap: 12px;
    flex-wrap: wrap;
  }

  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .topbar-left { display: flex; align-items: center; gap: 12px; }
  .topbar-left h1 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--white); }
  .topbar-left p { font-size: 13px; color: var(--gray); margin-top: 2px; }
  .topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  /* Search */
  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  .search-input {
    width: 200px;
    padding: 9px 14px 9px 36px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    outline: none;
    transition: all 0.25s ease;
  }
  .search-input::placeholder { color: rgba(138,155,191,0.5); }
  .search-input:focus { border-color: var(--sky); background: rgba(91,184,245,0.06); box-shadow: 0 0 0 3px rgba(91,184,245,0.12); width: 260px; }
  .search-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: var(--gray);
    font-size: 14px;
  }

  .btn-add {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 18px;
    background: linear-gradient(135deg, var(--blue), var(--sky));
    border: none; border-radius: 10px;
    color: white; font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s ease;
    box-shadow: 0 4px 14px rgba(26,115,232,0.4);
    white-space: nowrap;
  }
  .btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,115,232,0.5); }

  .notif-btn {
    width: 36px; height: 36px;
    background: var(--card); border: 1px solid var(--border);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px; transition: background 0.2s; position: relative;
    flex-shrink: 0;
  }
  .notif-btn:hover { background: rgba(255,255,255,0.08); }
  .notif-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: var(--red); border-radius: 50%; border: 2px solid var(--panel); }

  /* ── Content ── */
  .content {
    flex: 1; overflow-y: auto;
    padding: 24px 28px;
    animation: fadeUp 0.5s 0.2s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .content::-webkit-scrollbar { width: 4px; }
  .content::-webkit-scrollbar-track { background: transparent; }
  .content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  /* ── KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }

  .kpi-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }

  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    border-radius: 16px 16px 0 0;
  }
  .kpi-card.blue::before  { background: linear-gradient(90deg, var(--blue), var(--sky)); }
  .kpi-card.green::before { background: linear-gradient(90deg, var(--green), #6ee7b7); }
  .kpi-card.orange::before{ background: linear-gradient(90deg, var(--orange), #fbbf24); }
  .kpi-card.red::before   { background: linear-gradient(90deg, var(--red), #fca5a5); }

  .kpi-glow {
    position: absolute;
    top: -20px; right: -20px;
    width: 80px; height: 80px;
    border-radius: 50%;
    opacity: 0.08;
    filter: blur(20px);
  }
  .kpi-card.blue  .kpi-glow { background: var(--sky); }
  .kpi-card.green .kpi-glow { background: var(--green); }
  .kpi-card.orange .kpi-glow{ background: var(--orange); }
  .kpi-card.red   .kpi-glow { background: var(--red); }

  .kpi-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
  .kpi-label { font-size: 12px; color: var(--gray); text-transform: uppercase; letter-spacing: 1px; }
  .kpi-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
  .kpi-icon.blue   { background: rgba(26,115,232,0.15); }
  .kpi-icon.green  { background: rgba(52,211,153,0.15); }
  .kpi-icon.orange { background: rgba(251,146,60,0.15); }
  .kpi-icon.red    { background: rgba(248,113,113,0.15); }

  .kpi-value { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--white); line-height: 1; margin-bottom: 8px; }
  .kpi-change { font-size: 12px; display: flex; align-items: center; gap: 4px; }
  .kpi-change.up   { color: var(--green); }
  .kpi-change.down { color: var(--red); }
  .kpi-change.warn { color: var(--orange); }

  /* ── Main grid ── */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 16px;
    margin-bottom: 16px;
  }

  /* ── Chart card ── */
  .chart-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
  }

  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--white); }
  .card-subtitle { font-size: 12px; color: var(--gray); margin-top: 2px; }

  .chart-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.05); padding: 3px; border-radius: 8px; }
  .chart-tab { padding: 5px 14px; font-size: 12px; font-weight: 500; border: none; background: transparent; color: var(--gray); border-radius: 6px; cursor: pointer; transition: all 0.2s; }
  .chart-tab.active { background: var(--blue); color: white; }

  .chart-svg { width: 100%; overflow: visible; }
  .chart-grid-line { stroke: rgba(255,255,255,0.05); stroke-width: 1; }
  .chart-axis-label { fill: var(--gray); font-size: 11px; font-family: 'DM Sans', sans-serif; }
  .line-sales { fill: none; stroke: var(--sky); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
  .line-stock { fill: none; stroke: var(--green); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 6 3; }
  .area-sales { fill: url(#gradSales); }
  .area-stock  { fill: url(#gradStock); }
  .dot-sales { fill: var(--sky); stroke: var(--card); stroke-width: 2; }
  .dot-stock  { fill: var(--green); stroke: var(--card); stroke-width: 2; }

  .chart-legend { display: flex; gap: 20px; margin-top: 16px; }
  .legend-item { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--gray); }
  .legend-line { width: 20px; height: 3px; border-radius: 2px; }

  .chart-summary { display: flex; gap: 24px; margin-bottom: 16px; }
  .summary-item { display: flex; flex-direction: column; gap: 2px; }
  .summary-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .summary-val.blue  { color: var(--sky); }
  .summary-val.green { color: var(--green); }
  .summary-lbl { font-size: 11px; color: var(--gray); text-transform: uppercase; letter-spacing: 0.8px; }
  .summary-sep { width: 1px; background: var(--border); align-self: stretch; }

  /* ── Alerts card ── */
  .alerts-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; }

  .alert-item { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .alert-item:last-child { border-bottom: none; padding-bottom: 0; }
  .alert-item:first-child { padding-top: 0; }

  .alert-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .alert-dot.red    { background: var(--red);    box-shadow: 0 0 6px var(--red); }
  .alert-dot.orange { background: var(--orange); box-shadow: 0 0 6px var(--orange); }
  .alert-dot.green  { background: var(--green);  box-shadow: 0 0 6px var(--green); }

  .alert-info { flex: 1; min-width: 0; }
  .alert-product { font-size: 13px; font-weight: 500; color: var(--light); }
  .alert-detail  { font-size: 11px; color: var(--gray); margin-top: 1px; }

  .alert-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
  .alert-badge.red    { background: rgba(248,113,113,0.15); color: var(--red); }
  .alert-badge.orange { background: rgba(251,146,60,0.15);  color: var(--orange); }
  .alert-badge.green  { background: rgba(52,211,153,0.15);  color: var(--green); }

  /* ── Bottom grid ── */
  .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* ── Table ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--gray); padding: 0 12px 10px; text-align: left; font-weight: 500; }
  tbody tr { border-top: 1px solid var(--border); transition: background 0.15s; cursor: pointer; }
  tbody tr:hover { background: rgba(255,255,255,0.03); }
  tbody td { padding: 11px 12px; font-size: 13px; color: var(--light); }

  .stock-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .stock-bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
  .stock-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

  .tag { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
  .tag.ok     { background: rgba(52,211,153,0.12); color: var(--green); }
  .tag.low    { background: rgba(251,146,60,0.12);  color: var(--orange); }
  .tag.out    { background: rgba(248,113,113,0.12); color: var(--red); }

  /* ── Activity ── */
  .activity-item { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); align-items: flex-start; }
  .activity-item:last-child { border-bottom: none; }
  .activity-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; margin-top: 1px; }
  .activity-icon.sale   { background: rgba(26,115,232,0.15); }
  .activity-icon.add    { background: rgba(52,211,153,0.15); }
  .activity-icon.alert  { background: rgba(248,113,113,0.15); }
  .activity-icon.update { background: rgba(251,146,60,0.15); }
  .activity-text { font-size: 13px; color: var(--light); line-height: 1.4; }
  .activity-time { font-size: 11px; color: var(--gray); margin-top: 2px; }

  /* ── Loading skeleton ── */
  .skeleton {
    background: linear-gradient(90deg, var(--card) 25%, var(--card2) 50%, var(--card) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10,22,40,0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    animation: fadeIn 0.2s ease;
    padding: 20px;
  }

  .modal {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 20px;
    width: 100%;
    max-width: 460px;
    padding: 32px;
    animation: modalPop 0.3s cubic-bezier(0.22,1,0.36,1) both;
    max-height: 90vh;
    overflow-y: auto;
  }

  @keyframes modalPop {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 4px;
  }

  .modal-subtitle {
    font-size: 13px;
    color: var(--gray);
    margin-bottom: 24px;
  }

  .modal-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 16px;
  }

  .modal-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--sky);
    text-transform: uppercase;
    letter-spacing: 1.2px;
  }

  .modal-input, .modal-select {
    width: 100%;
    padding: 11px 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    outline: none;
    transition: all 0.2s ease;
  }
  .modal-input::placeholder { color: rgba(138,155,191,0.4); }
  .modal-input:focus, .modal-select:focus {
    border-color: var(--sky);
    background: rgba(91,184,245,0.06);
    box-shadow: 0 0 0 3px rgba(91,184,245,0.12);
  }
  .modal-select { appearance: none; cursor: pointer; }
  .modal-select option { background: var(--panel); color: var(--white); }

  .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 24px;
  }

  .btn-cancel {
    flex: 1;
    padding: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid var(--border);
    border-radius: 10px;
    color: var(--gray);
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-cancel:hover { background: rgba(255,255,255,0.1); color: var(--light); }

  .btn-save {
    flex: 1;
    padding: 12px;
    background: linear-gradient(135deg, var(--blue), var(--sky));
    border: none;
    border-radius: 10px;
    color: white;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 14px rgba(26,115,232,0.4);
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(26,115,232,0.5); }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .modal-error { font-size: 12px; color: var(--red); margin-top: -8px; margin-bottom: 8px; }

  .spinner-sm {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Chatbot panel ── */
  /* Chatbot panel — flotante, no empuja el layout */
.chatbot-panel-wrapper {
  position: fixed;
  bottom: 104px;
  right: 28px;
  width: 400px;
  max-width: calc(100vw - 2rem);
  z-index: 9999;
}

/* FAB del chatbot */
.bot-fab {
  position: fixed;
  bottom: 28px;
  right: 28px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);
  color: #0a0f1c;
  font-size: 26px;
  cursor: pointer;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px rgba(34,211,238,0.35);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bot-fab:hover {
  transform: scale(1.1);
}

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .main-grid { grid-template-columns: 1fr; }
    .bottom-grid { grid-template-columns: 1fr; }
    .chart-summary { flex-wrap: wrap; }
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0; top: 0; bottom: 0;
      transform: translateX(-100%);
      box-shadow: 4px 0 24px rgba(0,0,0,0.5);
    }
    .sidebar.open { transform: translateX(0); }
    .sidebar-overlay.show { display: block; }
    .hamburger { display: flex; }
    .topbar { padding: 14px 16px; }
    .content { padding: 16px; }
    .search-input { width: 140px; }
    .search-input:focus { width: 180px; }
    .btn-add span.btn-text { display: none; }
    .chatbot-panel-wrapper { position: fixed; top: 0; right: 0; bottom: 0; width: 100%; z-index: 60; }
    @keyframes slideInRight { from { opacity: 0; width: 0; } to { opacity: 1; width: 100%; } }
  }

  @media (max-width: 500px) {
    .kpi-grid { grid-template-columns: 1fr; }
    .kpi-value { font-size: 24px; }
  }
`;

// ── Helper: format date in Spanish ──
function formatDateEs() {
  const now = new Date();
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${days[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ── Helper: get user initials ──
function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

// ── SVG Line Chart ──
function LineChart({ data }) {
  const W = 560, H = 180, padL = 30, padR = 10, padT = 10, padB = 28;
  const maxVal = Math.max(...data.map(d => Math.max(d.sales, d.stock))) * 1.15;
  const xs = data.map((_, i) => padL + (i / (data.length - 1)) * (W - padL - padR));
  const yS = d => H - padB - ((d.sales / maxVal) * (H - padT - padB));
  const yK = d => H - padB - ((d.stock / maxVal) * (H - padT - padB));

  const pathD = (yFn) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${yFn(d)}`).join(" ");

  const areaD = (yFn) =>
    `${pathD(yFn)} L ${xs[data.length - 1]} ${H - padB} L ${xs[0]} ${H - padB} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1].map(r => H - padB - r * (H - padT - padB));

  return (
    <svg className="chart-svg" viewBox={`0 0 ${W} ${H}`} style={{ height: 200 }}>
      <defs>
        <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5BB8F5" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5BB8F5" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="gradStock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {gridLines.map((y, i) => (
        <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} className="chart-grid-line" />
      ))}
      <path d={areaD(yK)} className="area-stock" />
      <path d={areaD(yS)} className="area-sales" />
      <path d={pathD(yK)} className="line-stock" />
      <path d={pathD(yS)} className="line-sales" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={yK(d)} r={4} className="dot-stock" />
          <circle cx={xs[i]} cy={yS(d)} r={4} className="dot-sales" />
        </g>
      ))}
      {data.map((d, i) => (
        <text key={i} x={xs[i]} y={H - 4} textAnchor="middle" className="chart-axis-label">
          {d.day}
        </text>
      ))}
    </svg>
  );
}

// ── Add Product Modal ──
function AddProductModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ nombre: "", categoria: "Bebidas", precio: "", stock: "", stock_max: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const categories = ["Bebidas", "Botanas", "Lácteos", "Panadería", "Limpieza", "Abarrotes", "Frutas y Verduras", "Otros"];

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    if (!form.precio || Number(form.precio) <= 0) { setError("Precio inválido"); return; }
    if (!form.stock || Number(form.stock) < 0) { setError("Stock inválido"); return; }

    setSaving(true);
    const { error: dbError } = await supabase.from("productos").insert([{
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      precio: Number(form.precio),
      stock: Number(form.stock),
      stock_max: Number(form.stock_max) || Number(form.stock) * 2,
    }]);

    setSaving(false);
    if (dbError) { setError(dbError.message); return; }

    onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Agregar producto</div>
        <div className="modal-subtitle">Completa la información del nuevo producto</div>

        <div className="modal-group">
          <label className="modal-label">Nombre del producto</label>
          <input className="modal-input" placeholder="Ej. Coca-Cola 600ml"
            value={form.nombre} onChange={e => handleChange("nombre", e.target.value)} />
        </div>

        <div className="modal-group">
          <label className="modal-label">Categoría</label>
          <select className="modal-select" value={form.categoria}
            onChange={e => handleChange("categoria", e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="modal-row">
          <div className="modal-group">
            <label className="modal-label">Precio ($)</label>
            <input className="modal-input" type="number" step="0.5" min="0" placeholder="0.00"
              value={form.precio} onChange={e => handleChange("precio", e.target.value)} />
          </div>
          <div className="modal-group">
            <label className="modal-label">Stock inicial</label>
            <input className="modal-input" type="number" min="0" placeholder="0"
              value={form.stock} onChange={e => handleChange("stock", e.target.value)} />
          </div>
        </div>

        <div className="modal-group">
          <label className="modal-label">Stock máximo (opcional)</label>
          <input className="modal-input" type="number" min="0" placeholder="Auto: 2x stock inicial"
            value={form.stock_max} onChange={e => handleChange("stock_max", e.target.value)} />
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spinner-sm" /> Guardando...</> : "Guardar producto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Navigation items ──
const NAV_ITEMS = [
  { icon: "📊", label: "Dashboard", key: "dashboard" },
  { icon: "📦", label: "Inventario", key: "inventario" },
  { icon: "💰", label: "Ventas", key: "ventas" },
  { icon: "🔔", label: "Alertas", key: "alertas" },
  { icon: "📈", label: "Reportes", key: "reportes" },
];

// ── Fallback static data (used when Supabase tables don't exist yet) ──
const FALLBACK_PRODUCTS = [
  { id: 1, nombre: "Coca-Cola 600ml", categoria: "Bebidas", stock: 3, stock_max: 50, precio: 18 },
  { id: 2, nombre: "Sabritas Original", categoria: "Botanas", stock: 8, stock_max: 30, precio: 22 },
  { id: 3, nombre: "Leche Lala 1L", categoria: "Lácteos", stock: 12, stock_max: 40, precio: 26 },
  { id: 4, nombre: "Pan Bimbo", categoria: "Panadería", stock: 48, stock_max: 60, precio: 45 },
  { id: 5, nombre: "Jabón Zote", categoria: "Limpieza", stock: 22, stock_max: 30, precio: 14 },
  { id: 6, nombre: "Agua Ciel 1.5L", categoria: "Bebidas", stock: 0, stock_max: 40, precio: 15 },
];

const CHART_DATA = [
  { day: "Lun", sales: 62, stock: 78 },
  { day: "Mar", sales: 81, stock: 72 },
  { day: "Mié", sales: 54, stock: 88 },
  { day: "Jue", sales: 94, stock: 61 },
  { day: "Vie", sales: 108, stock: 83 },
  { day: "Sáb", sales: 125, stock: 69 },
  { day: "Dom", sales: 73, stock: 91 },
];

const ACTIVITIES = [
  { icon: "💰", type: "sale", text: "Venta registrada — Coca-Cola x2, Sabritas x1", time: "Hace 5 min" },
  { icon: "📦", type: "add", text: "Pan Bimbo reabastecido — 48 piezas agregadas", time: "Hace 32 min" },
  { icon: "🚨", type: "alert", text: "Alerta: Agua 1.5L llegó a 0 unidades", time: "Hace 1 hr" },
  { icon: "✏️", type: "update", text: "Precio actualizado — Leche Lala $24 → $26", time: "Hace 2 hrs" },
  { icon: "💰", type: "sale", text: "Venta registrada — Jabón Zote x3", time: "Hace 3 hrs" },
];

// ══════════════════════════════════════════════
// ── DASHBOARD COMPONENT ──
// ══════════════════════════════════════════════
export default function Dashboard({ onNavigate, user }) {
  const [activeTab, setActiveTab] = useState("semana");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [showBot, setShowBot] = useState(false);

  // ── User info ──
  const userName = user?.user_metadata?.nombre || user?.email?.split("@")[0] || "Usuario";
  const initials = getInitials(userName);
  const todayStr = formatDateEs();

  // ── Fetch products from Supabase ──
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("stock", { ascending: true });

    if (error || !data || data.length === 0) {
      setProducts(FALLBACK_PRODUCTS);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Computed KPIs ──
  const totalProducts = products.length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= (p.stock_max || 50) * 0.3).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.precio || 0) * (p.stock || 0), 0);

  const kpis = [
    { label: "Productos", value: totalProducts.toString(), change: `${totalProducts} registrados`, dir: "up", icon: "📦", color: "blue" },
    { label: "Valor stock", value: `$${totalValue.toLocaleString("es-MX")}`, change: "Inventario total", dir: "up", icon: "💰", color: "green" },
    { label: "Stock bajo", value: lowStock.toString(), change: "Requieren atención", dir: lowStock > 0 ? "warn" : "up", icon: "⚠️", color: "orange" },
    { label: "Agotados", value: outOfStock.toString(), change: outOfStock > 0 ? "Reabastecer ya" : "Todo en orden", dir: outOfStock > 0 ? "down" : "up", icon: "🚨", color: "red" },
  ];

  // ── Alerts from products ──
  const alerts = products.slice(0, 5).map(p => {
    const pct = p.stock_max ? (p.stock / p.stock_max) * 100 : (p.stock > 10 ? 80 : 20);
    let level = "green", badge = "OK", detail = `${p.stock} pzas disponibles`;
    if (p.stock === 0) { level = "red"; badge = "Agotado"; detail = "0 piezas disponibles"; }
    else if (pct < 20) { level = "red"; badge = "Agotándose"; detail = `Solo ${p.stock} piezas restantes`; }
    else if (pct < 40) { level = "orange"; badge = "Stock bajo"; detail = `${p.stock} pzas — mín. recomendado: ${Math.round((p.stock_max || 50) * 0.5)}`; }
    return { product: p.nombre, detail, level, badge };
  });

  // ── Critical products table ──
  const criticalProducts = products.slice(0, 5).map(p => ({
    name: p.nombre,
    cat: p.categoria || "General",
    stock: p.stock || 0,
    max: p.stock_max || 50,
    status: p.stock === 0 ? "out" : (p.stock <= (p.stock_max || 50) * 0.3 ? "low" : "ok"),
  }));

  // ── Search filter ──
  const filteredProducts = search.trim()
    ? criticalProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.cat.toLowerCase().includes(search.toLowerCase()))
    : criticalProducts;

  // ── Navigation handler ──
  const handleNav = (key) => {
    setCurrentPage(key);
    setSidebarOpen(false);
    if (key !== "dashboard" && key !== "ventas") onNavigate(key);
  };

  // ── Logout ──
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onNavigate("login");
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* Sidebar overlay (mobile) */}
        <div className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-brand">
            <div className="brand-icon">S</div>
            <span className="brand-name">Sketch</span>
          </div>
          <div className="nav-section">
            <div className="nav-label">Menú</div>
            {NAV_ITEMS.map(item => (
              <div key={item.key}
                className={`nav-item ${currentPage === item.key ? "active" : ""}`}
                onClick={() => handleNav(item.key)}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{initials}</div>
              <div className="user-info">
                <span className="user-name">{userName}</span>
                <span className="user-role">Administrador</span>
              </div>
            </div>
            <button className="btn-logout" onClick={handleLogout}>
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="main">

          {/* ═══ VENTAS PAGE ═══ */}
          {currentPage === "ventas" && (
            <Ventas onNavigate={onNavigate} user={user} />
          )}

          {/* ═══ DASHBOARD PAGE ═══ */}
          {currentPage === "dashboard" && (
          <>
          <header className="topbar">
            <div className="topbar-left">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
              <div>
                <h1>Dashboard</h1>
                <p>{todayStr}</p>
              </div>
            </div>
            <div className="topbar-right">
              <div className="search-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="notif-btn">
                🔔
                {(outOfStock + lowStock) > 0 && <div className="notif-dot" />}
              </div>
              <button className="btn-add" onClick={() => setShowModal(true)}>
                + <span className="btn-text">Agregar producto</span>
              </button>
            </div>
          </header>

          <div className="content">

            {/* KPIs */}
            <div className="kpi-grid">
              {kpis.map((k, i) => (
                <div key={i} className={`kpi-card ${k.color}`}>
                  <div className="kpi-glow" />
                  <div className="kpi-top">
                    <span className="kpi-label">{k.label}</span>
                    <div className={`kpi-icon ${k.color}`}>{k.icon}</div>
                  </div>
                  <div className="kpi-value">
                    {loading ? <div className="skeleton" style={{ width: 80, height: 28 }} /> : k.value}
                  </div>
                  <div className={`kpi-change ${k.dir}`}>
                    {k.dir === "up" ? "↑" : k.dir === "down" ? "↓" : "●"} {k.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + Alerts */}
            <div className="main-grid">
              <div className="chart-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Ventas vs Stock disponible</div>
                    <div className="card-subtitle">Tendencia de la semana</div>
                  </div>
                  <div className="chart-tabs">
                    {["semana", "mes"].map(t => (
                      <button key={t} className={`chart-tab ${activeTab === t ? "active" : ""}`}
                        onClick={() => setActiveTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chart-summary">
                  <div className="summary-item">
                    <span className="summary-val blue">$12,480</span>
                    <span className="summary-lbl">Total ventas</span>
                  </div>
                  <div className="summary-sep" />
                  <div className="summary-item">
                    <span className="summary-val green">+14.2%</span>
                    <span className="summary-lbl">vs semana anterior</span>
                  </div>
                  <div className="summary-sep" />
                  <div className="summary-item">
                    <span className="summary-val" style={{ color: 'var(--light)' }}>{products.reduce((s, p) => s + (p.stock || 0), 0)}</span>
                    <span className="summary-lbl">Unidades en stock</span>
                  </div>
                </div>

                <LineChart data={CHART_DATA} />

                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-line" style={{ background: 'var(--sky)' }} />
                    Ventas diarias
                  </div>
                  <div className="legend-item">
                    <div className="legend-line" style={{ background: 'var(--green)', backgroundImage: 'repeating-linear-gradient(90deg,var(--green) 0,var(--green) 6px,transparent 6px,transparent 9px)' }} />
                    Stock disponible
                  </div>
                </div>
              </div>

              {/* Alerts */}
              <div className="alerts-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Alertas activas</div>
                    <div className="card-subtitle">Requieren tu atención</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}
                    onClick={() => handleNav("alertas")}>Ver todas</span>
                </div>
                {loading ? (
                  [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)
                ) : (
                  alerts.map((a, i) => (
                    <div key={i} className="alert-item">
                      <div className={`alert-dot ${a.level}`} />
                      <div className="alert-info">
                        <div className="alert-product">{a.product}</div>
                        <div className="alert-detail">{a.detail}</div>
                      </div>
                      <span className={`alert-badge ${a.level}`}>{a.badge}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bottom */}
            <div className="bottom-grid">
              <div className="chart-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      {search ? `Resultados: "${search}"` : "Productos críticos"}
                    </div>
                    <div className="card-subtitle">{search ? `${filteredProducts.length} encontrados` : "Stock más bajo"}</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--sky)', cursor: 'pointer' }}
                    onClick={() => handleNav("inventario")}>Ver inventario</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [1, 2, 3].map(i => (
                          <tr key={i}><td colSpan={4}><div className="skeleton" style={{ height: 20 }} /></td></tr>
                        ))
                      ) : filteredProducts.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--gray)", padding: 20 }}>
                          {search ? "No se encontraron productos" : "Sin productos"}
                        </td></tr>
                      ) : (
                        filteredProducts.map((p, i) => {
                          const pct = Math.round((p.stock / p.max) * 100);
                          const color = p.status === "ok" ? "var(--green)" : p.status === "low" ? "var(--orange)" : "var(--red)";
                          return (
                            <tr key={i}>
                              <td>{p.name}</td>
                              <td style={{ color: 'var(--gray)' }}>{p.cat}</td>
                              <td>
                                <div className="stock-bar-wrap">
                                  <span style={{ fontSize: 12, minWidth: 24 }}>{p.stock}</span>
                                  <div className="stock-bar-bg">
                                    <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`tag ${p.status}`}>
                                  {p.status === "ok" ? "Normal" : p.status === "low" ? "Bajo" : "Agotado"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="chart-card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Actividad reciente</div>
                    <div className="card-subtitle">Últimas acciones del día</div>
                  </div>
                </div>
                {ACTIVITIES.map((a, i) => (
                  <div key={i} className="activity-item">
                    <div className={`activity-icon ${a.type}`}>{a.icon}</div>
                    <div>
                      <div className="activity-text">{a.text}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
          </>
          )}
        </div>

        </div>

      {/* Chatbot panel — flotante, fuera del layout */}
      {showBot && (
        <div className="chatbot-panel-wrapper">
          <SketchBot
            onClose={() => setShowBot(false)}
            onProductsChanged={fetchProducts}
          />
        </div>
      )}

      {/* FAB chatbot button */}
      {!showBot && (
        <button className="bot-fab" onClick={() => setShowBot(true)} title="Abrir SketchBot">
          💬
        </button>
      )}

      {/* Modal agregar producto */}
      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSaved={fetchProducts}
        />
      )}
    </>
  );
}