import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

// Hook que usa sonner para mostrar notificaciones
export function useToast() {
  const toast = (props: ToastProps) => {
    const message = props.description
      ? `${props.title}: ${props.description}`
      : props.title;

    if (props.variant === "destructive") {
      sonnerToast.error(props.title, {
        description: props.description,
      });
    } else {
      sonnerToast.success(props.title, {
        description: props.description,
      });
    }
  };

  return { toast };
}
