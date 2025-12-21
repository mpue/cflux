export interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;
  
  // Company Info
  companyName: string;
  companyStreet: string;
  companyZip: string;
  companyCity: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyTaxId: string;
  companyIban: string;
  companyBank: string;
  
  // Header/Footer
  headerText?: string;
  footerText?: string;
  
  // Styling
  primaryColor: string;
  logoUrl?: string;
  
  // Text Templates
  introText?: string;
  paymentTermsText?: string;
  
  // Settings
  showLogo: boolean;
  showTaxId: boolean;
  showPaymentInfo: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceTemplateFormData {
  name: string;
  isDefault?: boolean;
  
  // Company Info
  companyName: string;
  companyStreet: string;
  companyZip: string;
  companyCity: string;
  companyCountry: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyTaxId: string;
  companyIban: string;
  companyBank: string;
  
  // Header/Footer
  headerText?: string;
  footerText?: string;
  
  // Styling
  primaryColor: string;
  logoUrl?: string;
  
  // Text Templates
  introText?: string;
  paymentTermsText?: string;
  
  // Settings
  showLogo: boolean;
  showTaxId: boolean;
  showPaymentInfo: boolean;
}
