import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  highlight?: string;
  className?: string;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  highlight = "SalesNet Platform",
  className,
}: AuthLayoutProps) {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left Side - Hero/Branding */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900">
           {/* Abstract Background Pattern */}
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-zinc-900/20" />
        </div>
        
        <div className="relative z-20 flex items-center text-lg font-medium tracking-tight">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <Sparkles className="h-4 w-4" />
          </div>
          SalesNet
        </div>
        
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;{highlight}&rdquo;
            </p>
            <p className="text-sm text-zinc-400">
              Gestiona tu negocio con la plataforma ERP más avanzada y segura del mercado.
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn("mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]", className)}
        >
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
          
          {children}
          
          {footer && (
             <div className="px-8 text-center text-sm text-muted-foreground">
                {footer}
             </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
