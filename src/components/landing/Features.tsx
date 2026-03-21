import { motion } from "framer-motion";
import { 
  ChartBar, 
  Users, 
  ShoppingCart, 
  Lightning, 
  ShieldCheck, 
  DeviceMobile 
} from "@phosphor-icons/react";

const features = [
  {
    icon: ChartBar,
    title: "Analítica avanzada",
    description: "Visualiza métricas clave con tableros en tiempo real y reportes listos para operar."
  },
  {
    icon: Users,
    title: "Gestión de clientes",
    description: "Consulta historial, preferencias y seguimiento comercial desde un solo lugar."
  },
  {
    icon: ShoppingCart,
    title: "Control de inventario",
    description: "Administra existencias, movimientos y reposición para reducir quiebres de stock."
  },
  {
    icon: Lightning,
    title: "Operación ágil",
    description: "Interfaz ligera y rápida para registrar ventas y navegar módulos sin fricción."
  },
  {
    icon: ShieldCheck,
    title: "Seguridad empresarial",
    description: "Acceso por roles y protección de sesión para trabajar con datos sensibles con confianza."
  },
  {
    icon: DeviceMobile,
    title: "Listo para móvil",
    description: "Accede al sistema desde escritorio o móvil con una experiencia adaptada al contexto."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas para crecer</h2>
          <p className="text-lg text-muted-foreground">
            Herramientas pensadas para centralizar la operación comercial, administrativa y de inventario.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="w-6 h-6" weight="duotone" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
