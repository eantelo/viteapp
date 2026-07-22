import { Link } from "react-router-dom";

const footerLinkClasses =
  "rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        Información y accesos de SalesNet
      </h2>
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_1.1fr] lg:gap-8">
          <div className="max-w-sm space-y-4">
            <Link
              to="/"
              aria-label="SalesNet, ir al inicio"
              className={`inline-flex items-center gap-2.5 ${footerLinkClasses}`}
            >
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground"
              >
                S
              </span>
              <span className="text-xl font-bold tracking-tight" translate="no">
                SalesNet
              </span>
            </Link>
            <p className="text-pretty text-sm leading-6 text-muted-foreground">
              Centraliza ventas, inventario, compras y clientes en una aplicación diseñada para equipos comerciales y operativos.
            </p>
          </div>

          <nav aria-label="Producto">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Producto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="#features" className={footerLinkClasses}>
                  Funcionalidades
                </a>
              </li>
              <li>
                <Link to="/register" className={footerLinkClasses}>
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Acceso a la cuenta">
            <h3 className="mb-4 text-sm font-semibold text-foreground">Tu cuenta</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link to="/login" className={footerLinkClasses}>
                  Iniciar sesión
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className={footerLinkClasses}>
                  Recuperar contraseña
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Listo para tu equipo</h3>
            <p className="text-pretty text-sm leading-6 text-muted-foreground">
              Accede desde el navegador y continúa la operación con las rutas disponibles para tu organización.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SalesNet. Todos los derechos reservados.</p>
          <p>Plataforma web para gestión comercial.</p>
        </div>
      </div>
    </footer>
  );
}
