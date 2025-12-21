import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/auth';

const prisma = new PrismaClient();

// Get all invoice templates
export const getAllTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.invoiceTemplate.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Get template by ID
export const getTemplateById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.invoiceTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
};

// Get default template
export const getDefaultTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.invoiceTemplate.findFirst({
      where: { isDefault: true },
    });

    if (!template) {
      // Create a default template if none exists
      const defaultTemplate = await prisma.invoiceTemplate.create({
        data: {
          name: 'Standard',
          isDefault: true,
          companyName: 'Ihre Firma',
          companyStreet: '',
          companyZip: '',
          companyCity: '',
          companyCountry: 'Schweiz',
          companyPhone: '',
          companyEmail: '',
          companyWebsite: '',
          companyTaxId: '',
          companyIban: '',
          companyBank: '',
          primaryColor: '#2563eb',
          introText: 'Vielen Dank für Ihr Vertrauen. Wir erlauben uns, Ihnen folgende Leistungen in Rechnung zu stellen:',
          paymentTermsText: 'Zahlbar innerhalb von 30 Tagen netto.',
          showLogo: true,
          showTaxId: true,
          showPaymentInfo: true,
        },
      });
      return res.json(defaultTemplate);
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching default template:', error);
    res.status(500).json({ error: 'Failed to fetch default template' });
  }
};

// Create template
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      isDefault,
      companyName,
      companyStreet,
      companyZip,
      companyCity,
      companyCountry,
      companyPhone,
      companyEmail,
      companyWebsite,
      companyTaxId,
      companyIban,
      companyBank,
      headerText,
      footerText,
      primaryColor,
      logoUrl,
      introText,
      paymentTermsText,
      showLogo,
      showTaxId,
      showPaymentInfo,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name,
        isDefault: isDefault || false,
        companyName: companyName || 'Ihre Firma',
        companyStreet: companyStreet || '',
        companyZip: companyZip || '',
        companyCity: companyCity || '',
        companyCountry: companyCountry || 'Schweiz',
        companyPhone: companyPhone || '',
        companyEmail: companyEmail || '',
        companyWebsite: companyWebsite || '',
        companyTaxId: companyTaxId || '',
        companyIban: companyIban || '',
        companyBank: companyBank || '',
        headerText,
        footerText,
        primaryColor: primaryColor || '#2563eb',
        logoUrl,
        introText,
        paymentTermsText,
        showLogo: showLogo !== undefined ? showLogo : true,
        showTaxId: showTaxId !== undefined ? showTaxId : true,
        showPaymentInfo: showPaymentInfo !== undefined ? showPaymentInfo : true,
      },
    });

    res.status(201).json(template);
  } catch (error: any) {
    console.error('Error creating template:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Template with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Update template
export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      isDefault,
      companyName,
      companyStreet,
      companyZip,
      companyCity,
      companyCountry,
      companyPhone,
      companyEmail,
      companyWebsite,
      companyTaxId,
      companyIban,
      companyBank,
      headerText,
      footerText,
      primaryColor,
      logoUrl,
      introText,
      paymentTermsText,
      showLogo,
      showTaxId,
      showPaymentInfo,
    } = req.body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false },
      });
    }

    const template = await prisma.invoiceTemplate.update({
      where: { id },
      data: {
        name,
        isDefault,
        companyName,
        companyStreet,
        companyZip,
        companyCity,
        companyCountry,
        companyPhone,
        companyEmail,
        companyWebsite,
        companyTaxId,
        companyIban,
        companyBank,
        headerText,
        footerText,
        primaryColor,
        logoUrl,
        introText,
        paymentTermsText,
        showLogo,
        showTaxId,
        showPaymentInfo,
      },
    });

    res.json(template);
  } catch (error: any) {
    console.error('Error updating template:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Template with this name already exists' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete template
export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if it's the default template
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.isDefault) {
      return res.status(400).json({ error: 'Cannot delete the default template. Set another template as default first.' });
    }

    await prisma.invoiceTemplate.delete({
      where: { id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

// Set template as default
export const setDefaultTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Unset all other defaults
    await prisma.invoiceTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this template as default
    const template = await prisma.invoiceTemplate.update({
      where: { id },
      data: { isDefault: true },
    });

    res.json(template);
  } catch (error: any) {
    console.error('Error setting default template:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(500).json({ error: 'Failed to set default template' });
  }
};
