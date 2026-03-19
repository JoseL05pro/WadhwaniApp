import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const UNSPLASH_IMAGES = [
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1600&q=80",
  "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1600&q=80",
  "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?w=1600&q=80",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1600&q=80",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&q=80",
];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --navy: #0A1128;
    --navy-mid: #132042;
    --blue: #1A73E8;
    --sky: #5BB8F5;
    --cyan: #34D8E8;
    --white: #FFFFFF;
    --gray: #b8c9e4;
    --gray-dim: rgba(184,201,228,0.5);
    --error: #FF4D6A;
    --success: #34D399;
    --glass-bg: rgba(10, 17, 40, 0.62);
    --glass-border: rgba(255,255,255,0.1);
    --input-bg: rgba(255,255,255,0.06);
    --input-border: rgba(255,255,255,0.1);
    --input-focus-bg: rgba(91,184,245,0.08);
    --input-focus-border: var(--sky);
    --input-focus-ring: rgba(91,184,245,0.16);
  }

  body {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    overflow: hidden;
    background: var(--navy);
  }

  .login-root {
    display: flex;
    min-height: 100vh;
    position: relative;
  }

  /* ── Background slideshow ── */
  .bg-slide {
    position: fixed;
    inset: 0;
    background-size: cover;
    background-position: center;
    z-index: 0;
    opacity: 0;
    transition: opacity 1.6s ease-in-out;
  }
  .bg-slide.active { opacity: 1; }

  .bg-overlay {
    position: fixed;
    inset: 0;
    z-index: 1;
    background:
      radial-gradient(ellipse at 30% 50%, rgba(10,17,40,0.55) 0%, transparent 70%),
      linear-gradient(135deg,
        rgba(10,17,40,0.94) 0%,
        rgba(10,17,40,0.72) 45%,
        rgba(10,17,40,0.50) 100%
      );
  }

  /* Grain texture overlay */
  .bg-grain {
    position: fixed;
    inset: 0;
    z-index: 1;
    opacity: 0.028;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    background-size: 180px;
  }

  /* ── Left panel ── */
  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 60px 70px;
    position: relative;
    z-index: 2;
    animation: slideIn 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-40px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 56px;
  }

  .brand-logo {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, var(--sky), var(--cyan));
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 22px;
    color: white;
    box-shadow: 0 8px 28px rgba(52,216,232,0.35);
    position: relative;
  }

  .brand-logo::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 17px;
    background: linear-gradient(135deg, var(--sky), var(--cyan));
    opacity: 0.25;
    z-index: -1;
    filter: blur(8px);
  }

  .brand-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 22px;
    color: var(--white);
    letter-spacing: -0.3px;
  }

  .headline {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(34px, 4vw, 54px);
    line-height: 1.08;
    color: var(--white);
    margin-bottom: 22px;
    text-shadow: 0 2px 30px rgba(0,0,0,0.5);
  }

  .headline span {
    background: linear-gradient(90deg, var(--sky), var(--cyan));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtext {
    font-size: 15.5px;
    color: var(--gray);
    line-height: 1.7;
    max-width: 380px;
    margin-bottom: 52px;
  }

  /* ── Gallery thumbnails ── */
  .gallery {
    display: flex;
    gap: 10px;
    margin-bottom: 36px;
  }

  .gallery-thumb {
    width: 64px; height: 64px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.5;
    position: relative;
    overflow: hidden;
  }

  .gallery-thumb::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(10,17,40,0.3);
    transition: background 0.3s ease;
  }

  .gallery-thumb:hover { opacity: 0.8; transform: translateY(-2px); }
  .gallery-thumb:hover::after { background: transparent; }
  .gallery-thumb.active {
    opacity: 1;
    border-color: var(--sky);
    box-shadow: 0 0 0 3px rgba(91,184,245,0.25), 0 4px 16px rgba(0,0,0,0.4);
  }
  .gallery-thumb.active::after { background: transparent; }

  .stats {
    display: flex;
    gap: 14px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: var(--glass-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border);
    border-radius: 14px;
    padding: 16px 22px;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .stat-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  .stat-number {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    background: linear-gradient(90deg, var(--sky), var(--cyan));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 11px;
    color: var(--gray-dim);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 500;
  }

  /* ── Right panel ── */
  .right-panel {
    width: 470px;
    background: var(--glass-bg);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border-left: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 56px 46px;
    position: relative;
    z-index: 2;
    animation: fadeUp 0.8s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
    overflow-y: auto;
  }

  /* Decorative glow behind form */
  .right-panel::before {
    content: '';
    position: absolute;
    top: 30%;
    left: -80px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(91,184,245,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 27px;
    font-weight: 700;
    color: var(--white);
    margin-bottom: 6px;
    letter-spacing: -0.3px;
  }

  .form-subtitle {
    font-size: 14px;
    color: var(--gray-dim);
    margin-bottom: 26px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .form-label {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--sky);
    text-transform: uppercase;
    letter-spacing: 1.4px;
  }

  .input-wrapper {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }

  .input-icon svg {
    width: 16px;
    height: 16px;
    stroke: var(--gray-dim);
    stroke-width: 1.8;
    fill: none;
    transition: stroke 0.2s ease;
  }

  .form-input:focus ~ .input-icon svg,
  .form-input:focus + .input-icon svg { stroke: var(--sky); }

  /* Reorder: icon then input so we can use ~ selector */
  .input-wrapper { display: flex; flex-direction: row-reverse; align-items: center; position: relative; }
  .input-wrapper .form-input { flex: 1; }
  .input-wrapper .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); z-index: 2; }

  .form-input {
    width: 100%;
    padding: 13px 16px 13px 42px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 12px;
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    transition: all 0.25s ease;
    outline: none;
  }

  .form-input::placeholder { color: rgba(184,201,228,0.3); }

  .form-input:focus {
    border-color: var(--input-focus-border);
    background: var(--input-focus-bg);
    box-shadow: 0 0 0 3px var(--input-focus-ring);
  }

  .form-input.error {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(255,77,106,0.12);
  }
  .error-msg { font-size: 12px; color: var(--error); margin-top: 2px; }

  .forgot-link {
    text-align: right;
    margin-top: -4px;
    margin-bottom: 20px;
  }

  .forgot-link a {
    font-size: 13px;
    color: var(--sky);
    text-decoration: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .forgot-link a:hover { opacity: 0.7; }

  .btn-login {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--blue), var(--sky));
    border: none;
    border-radius: 12px;
    color: white;
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 8px 28px rgba(26,115,232,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .btn-login::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent, rgba(255,255,255,0.12));
    opacity: 0;
    transition: opacity 0.3s;
  }
  .btn-login:hover::before { opacity: 1; }
  .btn-login:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(26,115,232,0.5); }
  .btn-login:active { transform: translateY(0); }
  .btn-login:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .btn-login:disabled::before { display: none; }

  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .register-link {
    text-align: center;
    margin-top: 22px;
    font-size: 14px;
    color: var(--gray-dim);
  }

  .register-link a {
    color: var(--sky);
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;
    cursor: pointer;
    transition: color 0.2s;
  }
  .register-link a:hover { color: var(--cyan); text-decoration: underline; }

  /* ── Mode switch ── */
  .mode-switch {
    display: flex;
    background: rgba(255,255,255,0.04);
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 26px;
    border: 1px solid rgba(255,255,255,0.06);
  }

  .mode-btn {
    flex: 1;
    padding: 9px;
    border: none;
    border-radius: 9px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    background: transparent;
    color: var(--gray-dim);
  }

  .mode-btn.active {
    background: linear-gradient(135deg, var(--blue), var(--sky));
    color: white;
    box-shadow: 0 4px 16px rgba(26,115,232,0.4);
  }

  /* ── Success overlay ── */
  .success-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10,17,40,0.97);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .success-icon {
    width: 84px; height: 84px;
    background: linear-gradient(135deg, var(--blue), var(--cyan));
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 38px;
    margin-bottom: 22px;
    animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
    box-shadow: 0 0 60px rgba(52,216,232,0.3);
  }

  @keyframes popIn {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  .success-text {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: white;
    margin-bottom: 8px;
    text-align: center;
  }

  .success-sub { color: var(--gray); font-size: 14px; text-align: center; }

  .reg-success {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.25);
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 13px;
    color: var(--success);
    margin-bottom: 16px;
    text-align: center;
    line-height: 1.5;
  }

  /* ── Slideshow dots ── */
  .slide-dots {
    position: fixed;
    bottom: 30px;
    left: 70px;
    display: flex;
    gap: 8px;
    z-index: 3;
  }

  .slide-dot {
    width: 28px;
    height: 3px;
    border-radius: 2px;
    background: rgba(255,255,255,0.2);
    transition: all 0.4s ease;
    cursor: pointer;
    border: none;
    padding: 0;
  }
  .slide-dot.active {
    width: 44px;
    background: var(--sky);
    box-shadow: 0 0 8px rgba(91,184,245,0.5);
  }

  @media (max-width: 900px) {
    .left-panel { display: none; }
    .slide-dots { display: none; }
    .right-panel { width: 100%; border-left: none; padding: 40px 24px; }
  }
`;

/* ── SVG icon components ── */
const IconUser = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
);
const IconMail = () => (
  <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-rotate background images
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % UNSPLASH_IMAGES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const switchMode = (m) => {
    setMode(m);
    setErrors({});
    setRegSuccess(false);
    setNombre(""); setEmail(""); setPassword(""); setConfirm("");
  };

  const validateLogin = () => {
    const e = {};
    if (!email) e.email = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Correo inválido";
    if (!password) e.password = "La contraseña es requerida";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    return e;
  };

  const validateRegister = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = "El nombre es requerido";
    if (!email) e.email = "El correo es requerido";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Correo inválido";
    if (!password) e.password = "La contraseña es requerida";
    else if (password.length < 6) e.password = "Mínimo 6 caracteres";
    if (!confirm) e.confirm = "Confirma tu contraseña";
    else if (confirm !== password) e.confirm = "Las contraseñas no coinciden";
    return e;
  };

  const handleLogin = async () => {
    const e = validateLogin();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setErrors({ password: "Correo o contraseña incorrectos" });
      return;
    }

    setSuccess(true);
    setTimeout(() => onLogin(data.user), 1500);
  };

  const handleRegister = async () => {
    const e = validateRegister();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre } },
    });

    setLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        setErrors({ email: "Este correo ya está registrado" });
      } else {
        setErrors({ email: error.message });
      }
      return;
    }

    setRegSuccess(true);
    setNombre(""); setEmail(""); setPassword(""); setConfirm("");
  };

  return (
    <>
      <style>{styles}</style>

      {success && (
        <div className="success-overlay">
          <div className="success-icon">✓</div>
          <div className="success-text">¡Bienvenido a Sketch!</div>
          <div className="success-sub">Redirigiendo al dashboard...</div>
        </div>
      )}

      {/* Background slideshow */}
      {UNSPLASH_IMAGES.map((src, i) => (
        <div
          key={i}
          className={`bg-slide ${i === activeSlide ? "active" : ""}`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      ))}
      <div className="bg-overlay" />
      <div className="bg-grain" />

      {/* Slide progress dots */}
      <div className="slide-dots">
        {UNSPLASH_IMAGES.map((_, i) => (
          <button
            key={i}
            className={`slide-dot ${i === activeSlide ? "active" : ""}`}
            onClick={() => setActiveSlide(i)}
          />
        ))}
      </div>

      <div className="login-root">
        {/* ── Panel izquierdo ── */}
        <div className="left-panel">
          <div className="brand">
            <div className="brand-logo">S</div>
            <span className="brand-name">Sketch</span>
          </div>

          <h1 className="headline">
            Inventario <span>inteligente</span><br />para tu tienda
          </h1>
          <p className="subtext">
            Controla tu stock en tiempo real, anticipa faltantes y haz crecer tu
            negocio con tecnología diseñada para las tienditas mexicanas.
          </p>

          {/* Thumbnail gallery to control slideshow */}
          <div className="gallery">
            {UNSPLASH_IMAGES.map((src, i) => (
              <div
                key={i}
                className={`gallery-thumb ${i === activeSlide ? "active" : ""}`}
                style={{ backgroundImage: `url('${src}')` }}
                onClick={() => setActiveSlide(i)}
              />
            ))}
          </div>

          <div className="stats">
            <div className="stat-item">
              <span className="stat-number">-75%</span>
              <span className="stat-label">Menos errores</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">+40%</span>
              <span className="stat-label">Más ventas</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Offline</span>
            </div>
          </div>
        </div>

        {/* ── Panel derecho (formulario) ── */}
        <div className="right-panel">
          <div className="form-title">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </div>
          <div className="form-subtitle">
            {mode === "login"
              ? "Accede a tu cuenta de Sketch"
              : "Regístrate gratis y empieza hoy"}
          </div>

          <div className="mode-switch">
            <button
              className={`mode-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => switchMode("login")}
            >
              Iniciar sesión
            </button>
            <button
              className={`mode-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => switchMode("register")}
            >
              Registrarse
            </button>
          </div>

          {regSuccess && (
            <div className="reg-success">
              ✓ ¡Cuenta creada! Ya puedes iniciar sesión con tu correo y contraseña.
            </div>
          )}

          {/* Nombre (solo registro) */}
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <div className="input-wrapper">
                <input
                  className={`form-input ${errors.nombre ? "error" : ""}`}
                  type="text"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: "" })); }}
                />
                <span className="input-icon"><IconUser /></span>
              </div>
              {errors.nombre && <span className="error-msg">{errors.nombre}</span>}
            </div>
          )}

          {/* Correo */}
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <div className="input-wrapper">
              <input
                className={`form-input ${errors.email ? "error" : ""}`}
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
              />
              <span className="input-icon"><IconMail /></span>
            </div>
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrapper">
              <input
                className={`form-input ${errors.password ? "error" : ""}`}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                onKeyDown={(e) => e.key === "Enter" && mode === "login" && handleLogin()}
              />
              <span className="input-icon"><IconLock /></span>
            </div>
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          {/* Confirmar (solo registro) */}
          {mode === "register" && (
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <div className="input-wrapper">
                <input
                  className={`form-input ${errors.confirm ? "error" : ""}`}
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: "" })); }}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                <span className="input-icon"><IconLock /></span>
              </div>
              {errors.confirm && <span className="error-msg">{errors.confirm}</span>}
            </div>
          )}

          {mode === "login" && (
            <div className="forgot-link">
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>
          )}

          <button
            className="btn-login"
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" />
                <span>{mode === "login" ? "Verificando..." : "Creando cuenta..."}</span>
              </>
            ) : mode === "login" ? (
              "Entrar"
            ) : (
              "Crear cuenta"
            )}
          </button>

          <div className="register-link">
            {mode === "login" ? (
              <>
                ¿No tienes cuenta?
                <a onClick={() => switchMode("register")}>Regístrate gratis</a>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?
                <a onClick={() => switchMode("login")}>Inicia sesión</a>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}