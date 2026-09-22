import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export interface StatusIconProps {
  status: string;
}

export const StatusIcon = ({ status }: StatusIconProps) => {
  if (status === "pass" || status === "good")
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  if (status === "fail" || status === "error")
    return <XCircle className="w-5 h-5 text-red-500" />;
  return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
};
