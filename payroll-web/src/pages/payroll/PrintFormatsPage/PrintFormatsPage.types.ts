export interface PrintFormat {
  id: string;
  name: string;
  description?: string;
  outputType: string;
  paperSize: string;
  orientation: string;
  fontSize: "xs" | "sm" | "md" | "lg";
  showHeader: boolean;
  showFooter: boolean;
  headerHtml?: string;
  footerHtml?: string;
  showCompanyLogo: boolean;
  showCompanyName: boolean;
  showCompanyAddress: boolean;
  showCompanyTIN: boolean;
  showTitle: boolean;
  showPeriod: boolean;
  showSignatureLines: boolean;
  signatureLabels: string[];
  columnOrder: string[];
  includeTotals: boolean;
  companyId: string;
  isDefault: boolean;
  template?: string;
}

export interface PrintFormatsPageFilters {
  search: string;
  companyId: string;
}
