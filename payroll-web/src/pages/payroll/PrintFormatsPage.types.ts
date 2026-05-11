export interface PrintFormat {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  outputType: "register" | "payslip" | "transmittal" | "journal" | "denomination";
  paperSize: "A4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  fontSize: "xs" | "sm" | "md" | "lg";
  showHeader: boolean;
  showFooter: boolean;
  headerHtml: string;
  footerHtml: string;
  showCompanyLogo: boolean;
  showCompanyName: boolean;
  showCompanyAddress: boolean;
  showCompanyTIN: boolean;
  showTitle: boolean;
  showPeriod: boolean;
  showSignatureLines: boolean;
  signatureLabels: string[];
  columns: string[];
  includeTotals: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
