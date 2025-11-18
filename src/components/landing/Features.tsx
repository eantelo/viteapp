import { motion } from "framer-motion";
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  Smartphone 
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Gain deep insights into your business performance with real-time dashboards and customizable reports."
  },
  {
    icon: Users,
    title: "Customer Management",
    description: "Track customer interactions, purchase history, and preferences to build stronger relationships."
  },
  {
    icon: ShoppingCart,
    title: "Inventory Control",
    description: "Manage stock levels, track movements, and automate reordering to prevent stockouts."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern technology for instant page loads and seamless interactions."
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description: "Bank-grade encryption and role-based access control to keep your data safe."
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description: "Access your ERP from anywhere, on any device, with our fully responsive design."
  }
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to grow</h2>
          <p className="text-lg text-muted-foreground">
            Powerful tools designed to help you manage every aspect of your business from a single platform.
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
                <feature.icon className="w-6 h-6" />
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
