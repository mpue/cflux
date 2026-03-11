import { invoiceTemplateService } from '../invoiceTemplateService';
import api from '../api';

jest.mock('../api');
const mockApi = api as jest.Mocked<typeof api>;

describe('invoiceTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTemplate = {
    id: 'tmpl-1',
    name: 'Standard Template',
    isDefault: true,
    headerHtml: '<h1>Invoice</h1>',
    footerHtml: '<p>Footer</p>',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  describe('getAll', () => {
    it('should fetch all templates', async () => {
      mockApi.get.mockResolvedValue({ data: [mockTemplate] });

      const result = await invoiceTemplateService.getAll();

      expect(mockApi.get).toHaveBeenCalledWith('/invoice-templates');
      expect(result).toEqual([mockTemplate]);
    });
  });

  describe('getById', () => {
    it('should fetch a template by id', async () => {
      mockApi.get.mockResolvedValue({ data: mockTemplate });

      const result = await invoiceTemplateService.getById('tmpl-1');

      expect(mockApi.get).toHaveBeenCalledWith('/invoice-templates/tmpl-1');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('getDefault', () => {
    it('should fetch the default template', async () => {
      mockApi.get.mockResolvedValue({ data: mockTemplate });

      const result = await invoiceTemplateService.getDefault();

      expect(mockApi.get).toHaveBeenCalledWith('/invoice-templates/default');
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('create', () => {
    it('should create a template', async () => {
      const data = { name: 'New Template', headerHtml: '<h1>New</h1>' } as any;
      mockApi.post.mockResolvedValue({ data: mockTemplate });

      const result = await invoiceTemplateService.create(data);

      expect(mockApi.post).toHaveBeenCalledWith('/invoice-templates', data);
      expect(result).toEqual(mockTemplate);
    });
  });

  describe('update', () => {
    it('should update a template', async () => {
      const data = { name: 'Updated Template' };
      const updated = { ...mockTemplate, ...data };
      mockApi.put.mockResolvedValue({ data: updated });

      const result = await invoiceTemplateService.update('tmpl-1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/invoice-templates/tmpl-1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a template', async () => {
      mockApi.delete.mockResolvedValue({});

      await invoiceTemplateService.delete('tmpl-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/invoice-templates/tmpl-1');
    });
  });

  describe('setDefault', () => {
    it('should set a template as default', async () => {
      mockApi.put.mockResolvedValue({ data: { ...mockTemplate, isDefault: true } });

      const result = await invoiceTemplateService.setDefault('tmpl-1');

      expect(mockApi.put).toHaveBeenCalledWith('/invoice-templates/tmpl-1/set-default');
      expect(result.isDefault).toBe(true);
    });
  });
});
