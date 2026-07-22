import {
  ChartBar,
  DeviceMobile,
  Lightning,
  Package,
  ShieldCheck,
  Users,
} from "@phosphor-icons/react";
import { motion, useReducedMotion } from "framer-motion";

const features = [
  {
    icon: ChartBar,
    title: "Ventas y punto de venta",
    description:
      "Registra operaciones y consulta la actividad comercial desde un flujo diseñado para el trabajo diario.",
  },
  {
    icon: Package,
    title: "Inventario y almacenes",
    description:
      "Organiza productos, existencias, almacenes y transferencias con información centralizada.",
  },
  {
    icon: Users,
    title: "Clientes y seguimiento",
    description:
      "Mantén el contexto comercial de cada cliente disponible para las personas que lo necesitan.",
  },
  {
    icon: Lightning,
    title: "Compras y proveedores",
    description:
      "Conecta el abastecimiento con la operación para reducir pasos manuales y mantener trazabilidad.",
  },
  {
    icon: ShieldCheck,
    title: "Acceso empresarial",
    description:
      "Protege cada sesión y organiza el acceso de los usuarios según su rol dentro del tenant.",
  },
  {
    icon: DeviceMobile,
    title: "Experiencia adaptable",
    description:
      "Trabaja desde escritorio o móvil con una interfaz que prioriza claridad, velocidad y continuidad.",
  },
];

export function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      aria-labelledby="features-title"
      className="scroll-mt-20 border-y border-border/60 bg-muted/30 py-20 sm:py-24"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
            Una operación conectada
          </p>
          <h2 id="features-title" className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Lo esencial para gestionar tu empresa con claridad
          </h2>
          <p className="mt-4 text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Unifica las tareas comerciales, administrativas y de inventario en una experiencia consistente para todo el equipo.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {features.map((feature, index) => (
            <motion.li
              key={feature.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                delay: shouldReduceMotion ? 0 : index * 0.07,
                ease: "easeOut",
              }}
              className="group h-full rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-transform motion-safe:hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg sm:p-7"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon aria-hidden="true" className="size-6" weight="duotone" />
              </div>
              <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{feature.title}</h3>
              <p className="mt-2 text-pretty leading-7 text-muted-foreground">{feature.description}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
