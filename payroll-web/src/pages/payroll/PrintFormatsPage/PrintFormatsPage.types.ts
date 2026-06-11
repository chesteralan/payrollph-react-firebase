export interface PrintFormat {
  id: string;
  name: string;
  description?: string;
  outputType: string;
  paperSize: string;
  orientation: string;
  fontSize: number;
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
  companyId: string;
  isDefault: boolean;
  template?: string;
}

export interface PrintFormatsPageFilters {
  search: string;
  companyId: string;
}
