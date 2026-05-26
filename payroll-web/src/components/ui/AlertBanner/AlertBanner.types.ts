export interface SystemAlert {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  dismissed: boolean;
  expiresAt?: Date;
}

export interface AlertBannerProps {
  alert: SystemAlert;
  onDismiss: (id: string) => void;
}
