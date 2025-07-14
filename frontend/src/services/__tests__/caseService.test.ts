import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { caseService } from '../caseService'
import { mockApiResponse, mockPaginationData, mockCase } from '@/test/test-utils'

// Mock request module
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import request from '@/utils/request'

describe('CaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getCaseList', () => {
    it('fetches case list successfully', async () => {
      const mockCases = [
        mockCase({ id: 1, caseNumber: 'CASE001' }),
        mockCase({ id: 2, caseNumber: 'CASE002' })
      ]
      const mockResponse = mockApiResponse(mockPaginationData(mockCases))
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const params = { page: 1, size: 10 }
      const result = await caseService.getCaseList(params)

      expect(request.get).toHaveBeenCalledWith('/api/cases', { params })
      expect(result).toEqual(mockResponse)
      expect(result.data.records).toHaveLength(2)
      expect(result.data.records[0].caseNumber).toBe('CASE001')
    })

    it('handles API error gracefully', async () => {
      const error = new Error('Network error')
      vi.mocked(request.get).mockRejectedValue(error)

      const params = { page: 1, size: 10 }
      
      await expect(caseService.getCaseList(params)).rejects.toThrow('Network error')
      expect(request.get).toHaveBeenCalledWith('/api/cases', { params })
    })

    it('passes search parameters correctly', async () => {
      const mockResponse = mockApiResponse(mockPaginationData([]))
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const params = {
        page: 1,
        size: 20,
        keyword: '张三',
        status: 1,
        startTime: '2024-01-01',
        endTime: '2024-12-31'
      }

      await caseService.getCaseList(params)

      expect(request.get).toHaveBeenCalledWith('/api/cases', { params })
    })
  })

  describe('getCaseDetail', () => {
    it('fetches case detail successfully', async () => {
      const mockCaseDetail = mockCase({ id: 1, caseNumber: 'CASE001' })
      const mockResponse = mockApiResponse(mockCaseDetail)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await caseService.getCaseDetail(1)

      expect(request.get).toHaveBeenCalledWith('/api/cases/1')
      expect(result).toEqual(mockResponse)
      expect(result.data.id).toBe(1)
    })

    it('handles non-existent case', async () => {
      const error = new Error('Case not found')
      vi.mocked(request.get).mockRejectedValue(error)

      await expect(caseService.getCaseDetail(999)).rejects.toThrow('Case not found')
      expect(request.get).toHaveBeenCalledWith('/api/cases/999')
    })
  })

  describe('createCase', () => {
    it('creates case successfully', async () => {
      const newCase = {
        caseNumber: 'CASE003',
        borrowerName: '李四',
        debtorIdCard: '110101199002022345',
        debtAmount: 20000,
        phone: '13800138002'
      }
      const mockCreatedCase = mockCase({ ...newCase, id: 3 })
      const mockResponse = mockApiResponse(mockCreatedCase)
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await caseService.createCase(newCase)

      expect(request.post).toHaveBeenCalledWith('/api/cases', newCase)
      expect(result).toEqual(mockResponse)
      expect(result.data.id).toBe(3)
      expect(result.data.borrowerName).toBe('李四')
    })

    it('handles validation errors', async () => {
      const invalidCase = {
        // Missing required fields
        caseNumber: '',
        borrowerName: '',
        debtAmount: 0
      }
      const error = new Error('Validation failed')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(caseService.createCase(invalidCase)).rejects.toThrow('Validation failed')
      expect(request.post).toHaveBeenCalledWith('/api/cases', invalidCase)
    })
  })

  describe('updateCase', () => {
    it('updates case successfully', async () => {
      const updateData = {
        borrowerName: '李四（更新）',
        debtAmount: 25000
      }
      const mockUpdatedCase = mockCase({ ...updateData, id: 1 })
      const mockResponse = mockApiResponse(mockUpdatedCase)
      
      vi.mocked(request.put).mockResolvedValue(mockResponse)

      const result = await caseService.updateCase(1, updateData)

      expect(request.put).toHaveBeenCalledWith('/api/cases/1', updateData)
      expect(result).toEqual(mockResponse)
      expect(result.data.borrowerName).toBe('李四（更新）')
    })

    it('handles update of non-existent case', async () => {
      const updateData = { borrowerName: '不存在的案件' }
      const error = new Error('Case not found')
      vi.mocked(request.put).mockRejectedValue(error)

      await expect(caseService.updateCase(999, updateData)).rejects.toThrow('Case not found')
    })
  })

  describe('deleteCase', () => {
    it('deletes case successfully', async () => {
      const mockResponse = mockApiResponse({ success: true })
      vi.mocked(request.delete).mockResolvedValue(mockResponse)

      const result = await caseService.deleteCase(1)

      expect(request.delete).toHaveBeenCalledWith('/api/cases/1')
      expect(result).toEqual(mockResponse)
    })

    it('handles deletion of non-existent case', async () => {
      const error = new Error('Case not found')
      vi.mocked(request.delete).mockRejectedValue(error)

      await expect(caseService.deleteCase(999)).rejects.toThrow('Case not found')
    })
  })

  describe('batchImportCases', () => {
    it('imports cases successfully', async () => {
      const file = new File(['case1,case2'], 'cases.csv', { type: 'text/csv' })
      const mockResponse = mockApiResponse({
        successCount: 2,
        failCount: 0,
        errors: []
      })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await caseService.batchImportCases(file)

      expect(request.post).toHaveBeenCalledWith('/api/cases/batch-import', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      expect(result).toEqual(mockResponse)
      expect(result.data.successCount).toBe(2)
    })

    it('handles import errors', async () => {
      const file = new File(['invalid,data'], 'invalid.csv', { type: 'text/csv' })
      const error = new Error('Import failed')
      vi.mocked(request.post).mockRejectedValue(error)

      await expect(caseService.batchImportCases(file)).rejects.toThrow('Import failed')
    })
  })

  describe('getCaseStatistics', () => {
    it('fetches case statistics successfully', async () => {
      const mockStats = {
        totalCases: 1000,
        pendingCases: 100,
        mediationCases: 200,
        litigationCases: 150,
        closedCases: 550,
        mediationSuccessRate: 85.5,
        averageProcessTime: 45
      }
      const mockResponse = mockApiResponse(mockStats)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await caseService.getCaseStatistics()

      expect(request.get).toHaveBeenCalledWith('/api/cases/statistics')
      expect(result).toEqual(mockResponse)
      expect(result.data.totalCases).toBe(1000)
      expect(result.data.mediationSuccessRate).toBe(85.5)
    })
  })

  describe('exportCaseList', () => {
    it('exports case list successfully', async () => {
      const mockBlob = new Blob(['export data'], { type: 'application/vnd.ms-excel' })
      vi.mocked(request.get).mockResolvedValue(mockBlob)

      const params = { status: 1 }
      const result = await caseService.exportCaseList(params)

      expect(request.get).toHaveBeenCalledWith('/api/cases/export', {
        params,
        responseType: 'blob'
      })
      expect(result).toEqual(mockBlob)
    })

    it('handles export errors', async () => {
      const error = new Error('Export failed')
      vi.mocked(request.get).mockRejectedValue(error)

      await expect(caseService.exportCaseList({})).rejects.toThrow('Export failed')
    })
  })

  describe('assignCase', () => {
    it('assigns case to mediation center successfully', async () => {
      const assignData = {
        caseId: 1,
        mediationCenterId: 10,
        assignReason: '地域匹配'
      }
      const mockResponse = mockApiResponse({ success: true })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await caseService.assignCase(assignData)

      expect(request.post).toHaveBeenCalledWith('/api/cases/assign', assignData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getCaseMaterials', () => {
    it('fetches case materials successfully', async () => {
      const mockMaterials = [
        {
          id: 1,
          caseId: 1,
          materialType: 1,
          fileName: 'contract.pdf',
          filePath: '/files/contract.pdf',
          fileSize: 1024000
        }
      ]
      const mockResponse = mockApiResponse(mockMaterials)
      
      vi.mocked(request.get).mockResolvedValue(mockResponse)

      const result = await caseService.getCaseMaterials(1)

      expect(request.get).toHaveBeenCalledWith('/api/cases/1/materials')
      expect(result).toEqual(mockResponse)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].fileName).toBe('contract.pdf')
    })
  })

  describe('uploadCaseMaterial', () => {
    it('uploads case material successfully', async () => {
      const file = new File(['contract content'], 'contract.pdf', { type: 'application/pdf' })
      const materialData = {
        caseId: 1,
        materialType: 1,
        description: '借款合同'
      }
      const mockResponse = mockApiResponse({
        id: 1,
        fileName: 'contract.pdf',
        filePath: '/files/contract.pdf'
      })
      
      vi.mocked(request.post).mockResolvedValue(mockResponse)

      const result = await caseService.uploadCaseMaterial(file, materialData)

      expect(request.post).toHaveBeenCalledWith('/api/cases/materials', expect.any(FormData), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      expect(result).toEqual(mockResponse)
    })
  })
})