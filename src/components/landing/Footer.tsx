import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight">SalesNet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              La plataforma para operar ventas, inventario, compras y clientes desde una sola aplicación.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">Crear cuenta</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Iniciar sesión</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Acceso</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/forgot-password" className="hover:text-primary transition-colors">Recuperar contraseña</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Entrar al sistema</Link></li>
              <li><Link to="/register" className="hover:text-primary transition-colors">Solicitar acceso</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Disponibilidad</h4>
            <p className="text-sm text-muted-foreground">
              Mostramos solo accesos y rutas operativas. Las secciones de demo, precios y reportes públicos se habilitarán cuando exista contenido real.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SalesNet. Todos los derechos reservados.
          </p>
          <p className="text-sm text-muted-foreground">
            Acceso web para equipos comerciales y operativos.
          </p>
        </div>
      </div>
    </footer>
  );
}
