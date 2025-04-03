
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster({ position = "bottom-right", closeButton = true }: { position?: string, closeButton?: boolean }) {
  const { toasts } = useToast()
  
  // Convert position string like "bottom-right" to CSS classes "bottom right"
  const positionClasses = position ? position.replace('-', ' ') : "bottom right"

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            {closeButton && <ToastClose />}
          </Toast>
        )
      })}
      <ToastViewport className={positionClasses} />
    </ToastProvider>
  )
}
