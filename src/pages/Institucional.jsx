import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { EsqueletoKpi, EsqueletoPanelBarras, EsqueletoTablaCentros } from '../components/Skeletons';
import { EstadoVacio } from '../components/Estado';
import {
  API,
  guardarSesionInstitucional,
  leerSesionInstitucional,
  cerrarSesionInstitucional,
} from '../api';

const ROLES = {
  admin_sistemas: {
    etiqueta: 'Encargado de Sistemas',
    icono: 'admin_panel_settings',
    descripcion: 'Acceso total al panel y a los indicadores de la red.',
  },
  director: {
    etiqueta: 'Director del Instituto',
    icono: 'shield_person',
    descripcion: 'Indicadores globales de todos los centros de salud.',
  },
};

const formatoNumero = new Intl.NumberFormat('es-VE');

function numero(valor) {
  return formatoNumero.format(Number(valor) || 0);
}

function iniciales(nombre = '') {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

function fechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' });
}

/* ═════════════════════════════════════════════════════════════════
   Sesión
   ═════════════════════════════════════════════════════════════════ */

function useSesionInstitucional() {
  const [sesion, setSesion] = useState(() => leerSesionInstitucional());

  const entrar = useCallback((respuesta) => {
    guardarSesionInstitucional(respuesta.token, respuesta.usuario);
    setSesion({ token: respuesta.token, usuario: respuesta.usuario });
  }, []);

  const salir = useCallback(() => {
    cerrarSesionInstitucional();
    setSesion(null);
  }, []);

  return { sesion, entrar, salir };
}

/* ═════════════════════════════════════════════════════════════════
   Piezas de interfaz
   ═════════════════════════════════════════════════════════════════ */

function Marca({ compacta = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/20">
        <img
          src="/identidad visual/InstitutoSalud.jpeg"
          alt="Instituto de Salud del Municipio Simón Bolívar"
          className="h-full w-full object-contain p-1"
        />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-base font-semibold text-white">
          Panel Institucional
        </span>
        {!compacta && (
          <span className="block text-[11px] uppercase tracking-[0.18em] text-white/55">
            Instituto de Salud · BnaSalud
          </span>
        )}
      </span>
    </div>
  );
}

function TarjetaKpi({ icono, etiqueta, valor, detalle, acento = 'text-secondary' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm card-hover-effect">
      <span
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-secondary via-health to-secondary-container opacity-70"
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
          {etiqueta}
        </p>
        <Icon name={icono} className={`text-lg ${acento}`} />
      </div>
      <p className="mt-2 font-display text-3xl font-semibold leading-none text-primary">
        {valor}
      </p>
      <p className="mt-1.5 text-[11px] text-on-surface-variant">{detalle}</p>
    </div>
  );
}

function Barra({ etiqueta, valor, maximo, color = 'bg-secondary' }) {
  const porcentaje = maximo > 0 ? Math.max((valor / maximo) * 100, 2) : 0;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
      <span className="truncate text-xs text-on-surface" title={etiqueta}>
        {etiqueta}
      </span>
      <span className="font-mono text-xs font-semibold text-on-surface">{numero(valor)}</span>
      <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
        <span
          className={`block h-full rounded-full ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </span>
    </li>
  );
}

function PanelBarras({ titulo, subtitulo, datos, color, vacio = 'Sin datos registrados.' }) {
  const maximo = Math.max(...datos.map((d) => d.total), 0);
  return (
    <section className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
      <header className="mb-3">
        <h3 className="font-display text-base font-semibold text-primary">{titulo}</h3>
        {subtitulo && <p className="text-[11px] text-on-surface-variant">{subtitulo}</p>}
      </header>
      {datos.length ? (
        <ul className="space-y-2.5">
          {datos.map((d) => (
            <Barra
              key={d.etiqueta}
              etiqueta={d.etiqueta}
              valor={d.total}
              maximo={maximo}
              color={color}
            />
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-xs text-on-surface-variant">{vacio}</p>
      )}
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Sidebar del director (colapsable, abre con botón)
   ════════════════════════════════════════════════════════════════ */

const ITEMS_SIDEBAR = [
  { id: 'atencion', etiqueta: 'Alcance y atención', icono: 'monitoring' },
  { id: 'stock', etiqueta: 'Stock e inventario', icono: 'inventory_2' },
  { id: 'laboral', etiqueta: 'Datos laborales', icono: 'work', nota: 'En construcción' },
];

function SidebarDirector({ seccionActiva, setSeccionActiva, sidebarAbierta, setSidebarAbierta }) {
  return (
    <>
      <button
        type="button"
        aria-label={sidebarAbierta ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={sidebarAbierta}
        aria-controls="sidebar-director"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary/10 transition-all text-primary"
        onClick={() => setSidebarAbierta((v) => !v)}
      >
        <Icon name={sidebarAbierta ? 'close' : 'menu'} className="text-xl" />
      </button>

      <aside
        id="sidebar-director"
        className={`fixed inset-y-0 left-0 z-40 bg-surface border-r border-outline-variant flex flex-col w-64 shadow-xl transition-transform duration-300 ${
          sidebarAbierta ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:shadow-none lg:border-0 lg:w-auto`}
        aria-label="Navegación del panel del director"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-white shrink-0">
              <Icon name="dashboard" className="text-sm" />
            </span>
            <span className="font-display text-sm font-semibold text-primary leading-tight">Panel Director</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="lg:hidden p-2 rounded-lg hover:bg-surface-container transition-colors"
            onClick={() => setSidebarAbierta(false)}
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" role="navigation">
          {ITEMS_SIDEBAR.map((item) => {
            const activado = seccionActiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={activado}
                onClick={() => setSeccionActiva(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  activado
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-secondary'
                }`}
              >
                <Icon name={item.icono} className={`text-lg ${activado ? 'text-white' : ''}`} />
                <span className="font-semibold text-sm leading-tight">{item.etiqueta}</span>
                {item.nota && (
                  <span className="ml-auto text-[10px] font-medium text-on-surface-variant/60 uppercase tracking-wider">
                    {item.nota}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-outline-variant/40 px-5 py-4">
          <p className="text-[10px] text-on-surface-variant/60 uppercase tracking-wider">
            Instituto de Salud · BnaSalud
          </p>
        </div>
      </aside>

      {sidebarAbierta && (
        <div
          className="fixed inset-0 z-30 bg-black/25 lg:hidden"
          onClick={() => setSidebarAbierta(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   Pills de filtro por centro
   ═══════════════════════════════════════════════════════════════ */

function PillsFiltroCentro({ centros, centroId, setCentroId }) {
  return (
    <nav aria-label="Filtrar por centro de salud" className="mb-5 flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => setCentroId('general')}
        aria-pressed={centroId === 'general'}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition tab-interactive ${
          centroId === 'general'
            ? 'border-secondary bg-secondary text-white'
            : 'border-outline-variant/70 bg-white text-on-surface-variant hover:border-secondary/50 hover:text-secondary'
        }`}
      >
        Datos generales
      </button>
      {centros.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => setCentroId(String(c.id))}
          aria-pressed={String(c.id) === centroId}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition tab-interactive ${
            String(c.id) === centroId
              ? 'border-secondary bg-secondary text-white'
              : 'border-outline-variant/70 bg-white text-on-surface-variant hover:border-secondary/50 hover:text-secondary'
          }`}
        >
          {c.nombre}
        </button>
      ))}
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════════
   Panel: Alcance y atención (KPIs + gráficas)
   ═══════════════════════════════════════════════════════════════ */

function PanelAlcanceAtencion({ actual, citasPorEstado, especialidades, cargos }) {
  const kpis = [
    {
      icono: 'event_available',
      etiqueta: 'Citas',
      valor: numero(actual.citas),
      detalle: `${numero(actual.citas_hoy)} para hoy · ${numero(actual.citas_pendientes)} pendientes`,
      acento: 'text-secondary',
    },
    {
      icono: 'clinical_notes',
      etiqueta: 'Consultas',
      valor: numero(actual.consultas),
      detalle: 'Consultas registradas en el período',
      acento: 'text-health-dark',
    },
    {
      icono: 'groups',
      etiqueta: 'Pacientes',
      valor: numero(actual.pacientes),
      detalle: 'Pacientes atendidos o citados',
      acento: 'text-secondary',
    },
    {
      icono: 'badge',
      etiqueta: 'Personal',
      valor: numero(actual.personal || actual.personal_activos),
      detalle: `${numero(actual.personal_activos)} activos · ${numero(actual.medicos)} médicos`,
      acento: 'text-health-dark',
    },
  ];

  return (
    <div className="space-y-5">
      <section aria-label="Indicadores principales">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <TarjetaKpi key={kpi.etiqueta} {...kpi} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <PanelBarras
          titulo="Citas por estado"
          subtitulo="Toda la red"
          datos={citasPorEstado}
          color="bg-secondary"
          vacio="Todavía no hay citas registradas."
        />
        <PanelBarras
          titulo="Especialidades con más citas"
          subtitulo="Acumulado de la red"
          datos={especialidades}
          color="bg-health"
          vacio="Todavía no hay especialidades con citas."
        />
        <PanelBarras
          titulo="Personal por cargo"
          subtitulo="Nómina registrada en la red"
          datos={cargos}
          color="bg-secondary-light"
          vacio="Todavía no hay personal registrado."
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Panel: Stock e inventario por centro
   ═══════════════════════════════════════════════════════════════ */

function PanelStockInventario({ centros, centroId, totales }) {
  const centro =
    centroId === 'general' ? null : centros.find((c) => String(c.id) === centroId);
  const actual = centro || totales;
  const nombreVista = centroId === 'general' ? 'Toda la red' : (centro?.nombre || '');

  return (
    <div className="space-y-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-primary sm:text-3xl">
            {nombreVista}
          </h2>
          <p className="text-xs text-on-surface-variant">
            {centro ? `Detalle del centro · ${centro.codigo || 'sin código'}` : 'Inventario consolidado de todos los centros'}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            actual.stock_agotados > 0 ? 'bg-blood-soft text-blood' : 'bg-mint-soft text-mint'
          }`}
        >
          {actual.stock_agotados > 0 ? 'Requiere reposición' : 'Sin agotados'}
        </span>
      </div>

      <TablaCentros
        centros={centros}
        seleccionado={centroId}
        onSeleccionar={() => {}}
        totales={totales}
      />

      <section className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <header className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-primary">Alertas de stock</h3>
            <p className="text-[11px] text-on-surface-variant">{nombreVista}</p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              actual.stock_agotados > 0 ? 'bg-blood-soft text-blood' : 'bg-mint-soft text-mint'
            }`}
          >
            {actual.stock_agotados > 0 ? 'Requiere reposición' : 'Sin agotados'}
          </span>
        </header>
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-surface-container-low py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-on-surface-variant">Agotados</dt>
            <dd className="font-display text-xl font-semibold text-blood">{numero(actual.stock_agotados)}</dd>
          </div>
          <div className="rounded-xl bg-surface-container-low py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-on-surface-variant">Stock bajo</dt>
            <dd className="font-display text-xl font-semibold text-amber">{numero(actual.stock_bajos)}</dd>
          </div>
          <div className="rounded-xl bg-surface-container-low py-2.5">
            <dt className="text-[10px] uppercase tracking-wide text-on-surface-variant">Unidades</dt>
            <dd className="font-display text-xl font-semibold text-primary">{numero(actual.stock_unidades)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-relaxed text-on-surface-variant">
          Se considera stock bajo cuando un medicamento tiene 10 unidades o menos. Los datos provienen del inventario por clínica.
        </p>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Panel: Datos laborales (en construcción)
   ═══════════════════════════════════════════════════════════════ */

function PanelLaboralEnConstruccion() {
  return (
    <div className="py-10">
      <EstadoVacio
        icono="construction"
        titulo="Datos laborales en construcción"
        clase="bg-surface-container-low rounded-3xl border border-outline-variant"
      >
        <p className="text-xs mt-1">
          Los datos de reposos médicos emitidos a trabajadores estarán disponibles
          una vez los doctores alcancen un consenso. Este módulo estará listo para
          su cotejo con Recursos Humanos.
        </p>
      </EstadoVacio>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Login
   ═════════════════════════════════════════════════════════════════ */

function AccesoInstitucional({ onEntrar }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const respuesta = await API.loginInstitucional(username.trim(), password);
      onEntrar(respuesta);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="min-h-screen bg-primary lg:grid lg:grid-cols-[1.05fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden px-6 py-8 lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 18% 12%, rgba(80,217,254,0.20), transparent 46%), radial-gradient(circle at 88% 82%, rgba(13,159,122,0.24), transparent 48%)',
          }}
        />
        <div className="relative">
          <Marca />
        </div>

        <div className="relative mt-10 max-w-xl lg:mt-0">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
            <Icon name="lock" className="text-sm text-health-light" />
            Acceso restringido
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            Todos los números de la red de salud, en un solo lugar.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">
            Citas, consultas, pacientes, personal, recetas y stock de cada centro,
            actualizados desde la nube. Sin depender de la red interna del instituto.
          </p>
          <ul className="mt-6 grid gap-2.5 text-sm text-white/80 sm:grid-cols-2">
            {[
              'Resumen por centro y global',
              'Citas por estado y especialidad',
              'Personal activo y por cargo',
              'Stock crítico y recetas pendientes',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Icon name="check_circle" className="mt-0.5 text-base text-health-light" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 text-[11px] text-white/45 lg:mt-0">
          Instituto de Salud del Municipio Simón Bolívar · Barcelona, Anzoátegui
        </p>
      </section>

      <section className="flex items-center justify-center bg-surface px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-outline-variant/60 bg-white p-6 shadow-xl shadow-primary/10 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <Icon name="badge" className="text-2xl" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-primary">
                  Iniciar sesión
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Cuentas de dirección y sistemas
                </p>
              </div>
            </div>

            <form onSubmit={enviar} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="institucional-usuario"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Usuario
                </label>
                <div className="relative">
                  <Icon
                    name="person"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline"
                  />
                  <input
                    id="institucional-usuario"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-white py-2.5 pl-10 pr-3 text-sm text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/25"
                    placeholder="usuario"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="institucional-clave"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Icon
                    name="key"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline"
                  />
                  <input
                    id="institucional-clave"
                    name="password"
                    type={verClave ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-white py-2.5 pl-10 pr-11 text-sm text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/25"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-outline transition hover:bg-surface-container hover:text-secondary"
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={verClave}
                  >
                    <Icon name={verClave ? 'visibility_off' : 'visibility'} className="text-lg" />
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-error/25 bg-error-container px-3 py-2 text-xs text-error"
                >
                  <Icon name="error" className="mt-0.5 text-base" />
                  <span>{error}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className={`flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-secondary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary disabled:cursor-not-allowed disabled:opacity-60 btn-hover-effect ${enviando ? 'btn-loading' : ''}`}
              >
                {enviando ? 'Verificando…' : 'Entrar al panel'}
                <Icon name="arrow_forward" className="text-lg" />
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between border-t border-outline-variant/60 pt-4 text-xs">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-on-surface-variant transition hover:text-secondary"
              >
                <Icon name="arrow_back" className="text-base" />
                Volver al portal
              </Link>
              <span className="text-on-surface-variant/70">Solo personal autorizado</span>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] leading-relaxed text-on-surface-variant">
            Si olvidó su contraseña, solicite el restablecimiento al encargado de
            sistemas del instituto.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Tabla de centros (compartida)
   ═══════════════════════════════════════════════════════════════ */

function TablaCentros({ centros, seleccionado, onSeleccionar, totales }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-outline-variant/60 bg-white shadow-sm">
      <header className="flex flex-wrap items-end justify-between gap-2 border-b border-outline-variant/50 px-4 py-3">
        <div>
          <h3 className="font-display text-base font-semibold text-primary">
            Resumen por centro de salud
          </h3>
          <p className="text-[11px] text-on-surface-variant">
            Seleccione una fila para ver el detalle del centro.
          </p>
        </div>
        <p className="text-[11px] text-on-surface-variant">
          {numero(totales.centros_activos)} de {numero(totales.centros)} centros activos
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <caption className="sr-only">
            Citas, consultas, pacientes, personal, recetas y stock por centro de salud
          </caption>
          <thead>
            <tr className="bg-surface-container-low text-[10px] uppercase tracking-wider text-on-surface-variant">
              <th scope="col" className="px-4 py-2.5 font-semibold">Centro</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Citas</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Consultas</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Pacientes</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Personal</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Recetas</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Stock</th>
              <th scope="col" className="px-4 py-2.5 text-right font-semibold">Alertas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {centros.map((centro) => {
              const activo = String(seleccionado) === String(centro.id);
              const alertas = centro.stock_agotados + centro.stock_bajos;
              return (
                <tr
                  key={centro.id}
                  className={`cursor-pointer transition list-item-interactive ${
                    activo ? 'bg-secondary/10' : 'hover:bg-surface-container-low/60'
                  }`}
                  onClick={() => onSeleccionar(String(centro.id))}
                >
                  <th scope="row" className="px-4 py-2.5 font-normal">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSeleccionar(String(centro.id));
                      }}
                      className={`text-left text-xs font-semibold transition ${
                        activo ? 'text-secondary-dark' : 'text-on-surface hover:text-secondary'
                      }`}
                    >
                      {centro.nombre}
                      <span className="mt-0.5 block font-mono text-[10px] font-normal text-on-surface-variant">
                        {centro.codigo || '—'}
                      </span>
                    </button>
                  </th>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{numero(centro.citas)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{numero(centro.consultas)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{numero(centro.pacientes)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {numero(centro.personal_activos)}
                    <span className="text-on-surface-variant"> / {numero(centro.personal)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {numero(centro.recetas)}
                    {centro.recetas_pendientes > 0 && (
                      <span className="ml-1 rounded-full bg-amber-soft px-1.5 py-0.5 text-[10px] font-semibold text-amber">
                        {numero(centro.recetas_pendientes)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">
                    {numero(centro.stock_unidades)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {alertas > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blood-soft px-2 py-0.5 text-[10px] font-semibold text-blood">
                        <Icon name="warning" className="text-xs" />
                        {numero(alertas)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-semibold text-mint">
                        <Icon name="check" className="text-xs" />
                        Al día
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-surface-container-low text-xs font-semibold text-primary">
              <th scope="row" className="px-4 py-2.5 text-left">Total de la red</th>
              <td className="px-3 py-2.5 text-right font-mono">{numero(totales.citas)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{numero(totales.consultas)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{numero(totales.pacientes)}</td>
              <td className="px-3 py-2.5 text-right font-mono">
                {numero(totales.personal_activos)} / {numero(totales.personal)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">{numero(totales.recetas)}</td>
              <td className="px-3 py-2.5 text-right font-mono">{numero(totales.stock_unidades)}</td>
              <td className="px-4 py-2.5 text-right font-mono">
                {numero(totales.stock_agotados + totales.stock_bajos)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Panel principal (rol director)
   ════════════════════════════════════════════════════════════════ */

function Panel({ sesion, onSalir }) {
  const { usuario } = sesion;
  const rol = ROLES[usuario.rol] || ROLES.director;
  const [datos, setDatos] = useState(null);
  const [centroId, setCentroId] = useState('general');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [seccionActiva, setSeccionActiva] = useState('atencion');
  const [sidebarAbierta, setSidebarAbierta] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await API.resumenPanel();
      setDatos(respuesta);
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        onSalir();
        return;
      }
      setError(err.message || 'No se pudo cargar el resumen.');
    } finally {
      setCargando(false);
    }
  }, [onSalir]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  /* Placeholder temporal para admin_sistemas hasta su propio rediseño */
  if (usuario.rol !== 'director') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <EstadoVacio
          icono="dashboard"
          titulo="Panel en rediseño"
          clase="text-center"
        >
          <p className="text-xs mt-1">
            Esta interfaz será rediseñada próximamente para el encargado de sistemas.
          </p>
        </EstadoVacio>
      </div>
    );
  }

  const centros = datos?.por_centro || [];
  const t = datos?.totales || {};
  const centro =
    centroId === 'general' ? null : centros.find((c) => String(c.id) === centroId);
  const actual = centro || t;

  const citasPorEstado = (actual.citas_por_estado || datos?.citas_por_estado || []).map((e) => ({
    etiqueta: e.estado.charAt(0).toUpperCase() + e.estado.slice(1),
    total: e.total,
  }));

  const especialidades = (datos?.especialidades || []).map((e) => ({
    etiqueta: e.nombre,
    total: e.total,
  }));

  const cargos = (datos?.personal_por_cargo || []).map((c) => ({
    etiqueta: c.nombre,
    total: c.total,
  }));

  return (
    <div className="min-h-screen bg-surface">
      <header className="relative overflow-hidden bg-primary text-white">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at 12% 10%, rgba(80,217,254,0.18), transparent 42%), radial-gradient(circle at 90% 90%, rgba(13,159,122,0.22), transparent 46%)',
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Marca compacta />
            <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden="true" />
            <span className="hidden items-center gap-1.5 rounded-full border border-health-light/30 bg-health/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-health-light sm:inline-flex">
              <Icon name={rol.icono} className="text-sm" />
              {rol.etiqueta}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cargar}
              disabled={cargando}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              <Icon name="refresh" className={`text-base ${cargando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-health/25 font-display text-[11px] font-semibold text-health-light"
                aria-hidden="true"
              >
                {iniciales(usuario.nombre || usuario.username)}
              </span>
              <span className="hidden leading-tight sm:block">
                <span className="block text-xs font-semibold text-white">
                  {usuario.nombre || usuario.username}
                </span>
                <span className="block text-[10px] text-white/55">{rol.etiqueta}</span>
              </span>
              <button
                type="button"
                onClick={onSalir}
                className="ml-1 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <Icon name="logout" className="text-base" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-4 sm:px-6">
          <p className="text-[11px] text-white/50">
            Última actualización: {datos ? fechaHora(datos.generado_en) : '—'} · Zona horaria{' '}
            {datos?.zona_horaria || 'America/Caracas'}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        {error && (
          <div
            role="alert"
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/25 bg-error-container px-4 py-3 text-sm text-error"
          >
            <span className="flex items-center gap-2">
              <Icon name="error" className="text-lg" />
              {error}
            </span>
            <button
              type="button"
              onClick={cargar}
              className="rounded-lg border border-error/30 px-3 py-1 text-xs font-semibold transition hover:bg-error/10"
            >
              Reintentar
            </button>
          </div>
        )}

        {cargando && !datos ? (
          <div className="space-y-5">
            <section aria-label="Indicadores principales">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <EsqueletoKpi key={i} />
                ))}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
              <EsqueletoPanelBarras />
              <EsqueletoPanelBarras />
              <EsqueletoPanelBarras />
            </div>

            <EsqueletoTablaCentros />

            <div className="grid gap-4 lg:grid-cols-2">
              <EsqueletoPanelBarras />
              <EsqueletoPanelBarras />
            </div>
          </div>
        ) : datos ? (
          <>
            <SidebarDirector
              seccionActiva={seccionActiva}
              setSeccionActiva={setSeccionActiva}
              sidebarAbierta={sidebarAbierta}
              setSidebarAbierta={setSidebarAbierta}
            />

            <div className="lg:pl-64 transition-all duration-300">
              <PillsFiltroCentro centros={centros} centroId={centroId} setCentroId={setCentroId} />

              <div className="space-y-5" aria-busy={cargando}>
                {seccionActiva === 'laboral' ? (
                  <PanelLaboralEnConstruccion />
                ) : seccionActiva === 'stock' ? (
                  <PanelStockInventario centros={centros} centroId={centroId} totales={t} />
                ) : (
                  <PanelAlcanceAtencion
                    actual={actual}
                    citasPorEstado={citasPorEstado}
                    especialidades={especialidades}
                    cargos={cargos}
                  />
                )}
              </div>
            </div>
          </>
        ) : null}

        <p className="mt-8 text-center text-[11px] text-on-surface-variant">
          Panel institucional · Instituto de Salud del Municipio Simón Bolívar ·{' '}
          {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Página
   ════════════════════════════════════════════════════════════════ */

export default function Institucional() {
  const { sesion, entrar, salir } = useSesionInstitucional();

  useEffect(() => {
    document.title = sesion
      ? 'Panel Institucional · Salud Barcelona'
      : 'Acceso institucional · Salud Barcelona';
    return () => {
      document.title = 'Salud Barcelona - Instituto de Salud Municipal';
    };
  }, [sesion]);

  if (!sesion) return <AccesoInstitucional onEntrar={entrar} />;
  return <Panel sesion={sesion} onSalir={salir} />;
}
