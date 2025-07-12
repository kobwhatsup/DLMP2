import { http } from '@/utils/request'
import type { 
  FileRecord,
  FolderRecord,
  FileShare,
  FileOperationLog,
  FileStats,
  UploadConfig,
  FileType,
  FileStatus,
  StorageType,
  PaginationData, 
  PaginationParams 
} from '@/types'

// 文件查询参数
export interface FileQueryParams extends PaginationParams {
  folderId?: number
  fileName?: string
  fileType?: FileType
  status?: FileStatus
  uploaderId?: number
  relatedType?: string
  relatedId?: number
  tags?: string[]
  startDate?: string
  endDate?: string
  isPublic?: boolean
  storageType?: StorageType
}

// 文件夹查询参数
export interface FolderQueryParams extends PaginationParams {
  parentId?: number
  name?: string
  creatorId?: number
  isPublic?: boolean
}

// 文件上传参数
export interface FileUploadParams {
  file: File
  folderId?: number
  relatedType?: string
  relatedId?: number
  tags?: string[]
  description?: string
  isPublic?: boolean
  expireDays?: number
}

// 批量上传参数
export interface BatchUploadParams {
  files: File[]
  folderId?: number
  relatedType?: string
  relatedId?: number
  tags?: string[]
  isPublic?: boolean
}

// 文件夹创建参数
export interface CreateFolderParams {
  name: string
  parentId?: number
  description?: string
  isPublic?: boolean
}

// 文件分享参数
export interface CreateShareParams {
  fileId: number
  password?: string
  downloadLimit?: number
  viewLimit?: number
  expireHours?: number
}

// 文件移动参数
export interface MoveFileParams {
  fileIds: number[]
  targetFolderId?: number
}

// 文件重命名参数
export interface RenameFileParams {
  name: string
}

/**
 * 文件管理相关API
 */
export const fileService = {
  // 文件管理
  /**
   * 分页查询文件列表
   */
  getFileList: (params: FileQueryParams): Promise<{ data: PaginationData<FileRecord> }> => {
    return http.get('/files', { params })
  },

  /**
   * 根据ID获取文件详情
   */
  getFileById: (id: number): Promise<{ data: FileRecord }> => {
    return http.get(`/files/${id}`)
  },

  /**
   * 上传文件
   */
  uploadFile: (params: FileUploadParams, onProgress?: (percent: number) => void): Promise<{ data: FileRecord }> => {
    const formData = new FormData()
    formData.append('file', params.file)
    if (params.folderId) formData.append('folderId', params.folderId.toString())
    if (params.relatedType) formData.append('relatedType', params.relatedType)
    if (params.relatedId) formData.append('relatedId', params.relatedId.toString())
    if (params.tags) formData.append('tags', JSON.stringify(params.tags))
    if (params.description) formData.append('description', params.description)
    if (params.isPublic !== undefined) formData.append('isPublic', params.isPublic.toString())
    if (params.expireDays) formData.append('expireDays', params.expireDays.toString())

    return http.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      }
    })
  },

  /**
   * 批量上传文件
   */
  batchUploadFiles: (params: BatchUploadParams, onProgress?: (percent: number) => void): Promise<{ data: {
    success: FileRecord[]
    failed: Array<{
      fileName: string
      error: string
    }>
  } }> => {
    const formData = new FormData()
    params.files.forEach((file, index) => {
      formData.append(`files`, file)
    })
    if (params.folderId) formData.append('folderId', params.folderId.toString())
    if (params.relatedType) formData.append('relatedType', params.relatedType)
    if (params.relatedId) formData.append('relatedId', params.relatedId.toString())
    if (params.tags) formData.append('tags', JSON.stringify(params.tags))
    if (params.isPublic !== undefined) formData.append('isPublic', params.isPublic.toString())

    return http.post('/files/batch-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      }
    })
  },

  /**
   * 分片上传文件
   */
  chunkUploadFile: (params: {
    file: File
    chunkIndex: number
    totalChunks: number
    chunkHash: string
    fileHash: string
    folderId?: number
  }): Promise<{ data: {
    uploaded: boolean
    fileRecord?: FileRecord
  } }> => {
    const formData = new FormData()
    formData.append('chunk', params.file)
    formData.append('chunkIndex', params.chunkIndex.toString())
    formData.append('totalChunks', params.totalChunks.toString())
    formData.append('chunkHash', params.chunkHash)
    formData.append('fileHash', params.fileHash)
    if (params.folderId) formData.append('folderId', params.folderId.toString())

    return http.post('/files/chunk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  /**
   * 秒传检查
   */
  checkFileExists: (fileHash: string): Promise<{ data: {
    exists: boolean
    fileRecord?: FileRecord
  } }> => {
    return http.get('/files/check-exists', { params: { fileHash } })
  },

  /**
   * 下载文件
   */
  downloadFile: (id: number): Promise<Blob> => {
    return http.get(`/files/${id}/download`, { responseType: 'blob' })
  },

  /**
   * 获取文件下载链接
   */
  getDownloadUrl: (id: number, expireMinutes?: number): Promise<{ data: {
    url: string
    expireTime: string
  } }> => {
    return http.get(`/files/${id}/download-url`, { 
      params: { expireMinutes } 
    })
  },

  /**
   * 更新文件信息
   */
  updateFile: (id: number, params: {
    fileName?: string
    description?: string
    tags?: string[]
    isPublic?: boolean
    expireTime?: string
  }): Promise<{ data: FileRecord }> => {
    return http.put(`/files/${id}`, params)
  },

  /**
   * 重命名文件
   */
  renameFile: (id: number, params: RenameFileParams): Promise<{ data: FileRecord }> => {
    return http.put(`/files/${id}/rename`, params)
  },

  /**
   * 移动文件
   */
  moveFiles: (params: MoveFileParams): Promise<{ data: {
    successCount: number
    failCount: number
    details: Array<{
      fileId: number
      success: boolean
      error?: string
    }>
  } }> => {
    return http.put('/files/move', params)
  },

  /**
   * 复制文件
   */
  copyFiles: (fileIds: number[], targetFolderId?: number): Promise<{ data: {
    successCount: number
    failCount: number
    newFiles: FileRecord[]
  } }> => {
    return http.post('/files/copy', { fileIds, targetFolderId })
  },

  /**
   * 删除文件
   */
  deleteFile: (id: number): Promise<{ data: string }> => {
    return http.delete(`/files/${id}`)
  },

  /**
   * 批量删除文件
   */
  batchDeleteFiles: (ids: number[]): Promise<{ data: {
    successCount: number
    failCount: number
  } }> => {
    return http.delete('/files/batch-delete', { data: { ids } })
  },

  /**
   * 恢复删除的文件
   */
  restoreFile: (id: number): Promise<{ data: string }> => {
    return http.put(`/files/${id}/restore`)
  },

  /**
   * 彻底删除文件
   */
  permanentDeleteFile: (id: number): Promise<{ data: string }> => {
    return http.delete(`/files/${id}/permanent`)
  },

  // 文件夹管理
  /**
   * 获取文件夹列表
   */
  getFolderList: (params: FolderQueryParams): Promise<{ data: PaginationData<FolderRecord> }> => {
    return http.get('/folders', { params })
  },

  /**
   * 获取文件夹树
   */
  getFolderTree: (parentId?: number): Promise<{ data: FolderRecord[] }> => {
    return http.get('/folders/tree', { params: { parentId } })
  },

  /**
   * 根据ID获取文件夹详情
   */
  getFolderById: (id: number): Promise<{ data: FolderRecord }> => {
    return http.get(`/folders/${id}`)
  },

  /**
   * 创建文件夹
   */
  createFolder: (params: CreateFolderParams): Promise<{ data: FolderRecord }> => {
    return http.post('/folders', params)
  },

  /**
   * 更新文件夹
   */
  updateFolder: (id: number, params: Partial<CreateFolderParams>): Promise<{ data: FolderRecord }> => {
    return http.put(`/folders/${id}`, params)
  },

  /**
   * 删除文件夹
   */
  deleteFolder: (id: number, force?: boolean): Promise<{ data: string }> => {
    return http.delete(`/folders/${id}`, { params: { force } })
  },

  /**
   * 移动文件夹
   */
  moveFolder: (id: number, targetParentId?: number): Promise<{ data: FolderRecord }> => {
    return http.put(`/folders/${id}/move`, { targetParentId })
  },

  // 文件预览
  /**
   * 获取文件预览信息
   */
  getFilePreview: (id: number): Promise<{ data: {
    previewType: string
    previewUrl?: string
    thumbnailUrl?: string
    canPreview: boolean
    metadata?: any
  } }> => {
    return http.get(`/files/${id}/preview`)
  },

  /**
   * 生成文件缩略图
   */
  generateThumbnail: (id: number): Promise<{ data: {
    thumbnailUrl: string
  } }> => {
    return http.post(`/files/${id}/thumbnail`)
  },

  /**
   * 文本文件内容预览
   */
  getTextPreview: (id: number, lines?: number): Promise<{ data: {
    content: string
    encoding: string
    isTruncated: boolean
  } }> => {
    return http.get(`/files/${id}/text-preview`, { 
      params: { lines } 
    })
  },

  // 文件分享
  /**
   * 创建文件分享
   */
  createFileShare: (params: CreateShareParams): Promise<{ data: FileShare }> => {
    return http.post('/files/shares', params)
  },

  /**
   * 获取文件分享列表
   */
  getFileShares: (params: PaginationParams & {
    fileId?: number
    creatorId?: number
    isActive?: boolean
  }): Promise<{ data: PaginationData<FileShare> }> => {
    return http.get('/files/shares', { params })
  },

  /**
   * 获取分享详情
   */
  getShareById: (id: number): Promise<{ data: FileShare }> => {
    return http.get(`/files/shares/${id}`)
  },

  /**
   * 通过分享码访问
   */
  accessByShareCode: (shareCode: string, password?: string): Promise<{ data: {
    fileInfo: FileRecord
    shareInfo: FileShare
    downloadUrl?: string
  } }> => {
    return http.post('/files/shares/access', { shareCode, password })
  },

  /**
   * 更新分享设置
   */
  updateFileShare: (id: number, params: Partial<CreateShareParams>): Promise<{ data: FileShare }> => {
    return http.put(`/files/shares/${id}`, params)
  },

  /**
   * 删除分享
   */
  deleteFileShare: (id: number): Promise<{ data: string }> => {
    return http.delete(`/files/shares/${id}`)
  },

  // 文件统计和日志
  /**
   * 获取文件统计信息
   */
  getFileStats: (params?: {
    startDate?: string
    endDate?: string
    folderId?: number
    fileType?: FileType
  }): Promise<{ data: FileStats }> => {
    return http.get('/files/stats', { params })
  },

  /**
   * 获取存储使用情况
   */
  getStorageUsage: (): Promise<{ data: {
    totalUsed: number
    totalLimit: number
    usagePercentage: number
    byType: Array<{
      fileType: FileType
      size: number
      count: number
    }>
    byStorage: Array<{
      storageType: StorageType
      size: number
      count: number
    }>
  } }> => {
    return http.get('/files/storage-usage')
  },

  /**
   * 获取操作日志
   */
  getOperationLogs: (params: PaginationParams & {
    fileId?: number
    operation?: string
    operatorId?: number
    startDate?: string
    endDate?: string
  }): Promise<{ data: PaginationData<FileOperationLog> }> => {
    return http.get('/files/operation-logs', { params })
  },

  // 文件配置
  /**
   * 获取上传配置
   */
  getUploadConfig: (): Promise<{ data: UploadConfig }> => {
    return http.get('/files/upload-config')
  },

  /**
   * 更新上传配置
   */
  updateUploadConfig: (params: Partial<UploadConfig>): Promise<{ data: UploadConfig }> => {
    return http.put('/files/upload-config', params)
  },

  // 文件搜索
  /**
   * 搜索文件
   */
  searchFiles: (params: {
    keyword: string
    fileType?: FileType
    folderId?: number
    tags?: string[]
    dateRange?: string[]
    page?: number
    size?: number
  }): Promise<{ data: PaginationData<FileRecord> }> => {
    return http.get('/files/search', { params })
  },

  /**
   * 高级搜索
   */
  advancedSearch: (params: {
    conditions: Array<{
      field: string
      operator: string
      value: any
    }>
    orderBy?: string
    orderDirection?: 'asc' | 'desc'
    page?: number
    size?: number
  }): Promise<{ data: PaginationData<FileRecord> }> => {
    return http.post('/files/advanced-search', params)
  },

  // 回收站
  /**
   * 获取回收站文件列表
   */
  getTrashFiles: (params: PaginationParams): Promise<{ data: PaginationData<FileRecord> }> => {
    return http.get('/files/trash', { params })
  },

  /**
   * 清空回收站
   */
  emptyTrash: (): Promise<{ data: string }> => {
    return http.delete('/files/trash/empty')
  },

  // 文件标签
  /**
   * 获取所有标签
   */
  getAllTags: (): Promise<{ data: Array<{
    name: string
    count: number
  }> }> => {
    return http.get('/files/tags')
  },

  /**
   * 添加文件标签
   */
  addFileTags: (fileId: number, tags: string[]): Promise<{ data: string }> => {
    return http.post(`/files/${fileId}/tags`, { tags })
  },

  /**
   * 删除文件标签
   */
  removeFileTags: (fileId: number, tags: string[]): Promise<{ data: string }> => {
    return http.delete(`/files/${fileId}/tags`, { data: { tags } })
  },

  // 批量操作
  /**
   * 批量设置文件属性
   */
  batchUpdateFiles: (fileIds: number[], params: {
    tags?: string[]
    isPublic?: boolean
    folderId?: number
  }): Promise<{ data: {
    successCount: number
    failCount: number
  } }> => {
    return http.put('/files/batch-update', { fileIds, ...params })
  },

  /**
   * 批量下载文件
   */
  batchDownloadFiles: (fileIds: number[]): Promise<Blob> => {
    return http.post('/files/batch-download', { fileIds }, { 
      responseType: 'blob' 
    })
  },

  /**
   * 导出文件列表
   */
  exportFileList: (params: FileQueryParams): Promise<Blob> => {
    return http.get('/files/export', { 
      params,
      responseType: 'blob'
    })
  }
}