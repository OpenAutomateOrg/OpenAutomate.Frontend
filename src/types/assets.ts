/**
 * Asset related types
 */

export interface AssetResponseDto {
  id: string
  key: string
  value: string
  description: string
  isEncrypted: boolean
  type: AssetType
  createdAt: string
  lastModifiedAt?: string
}

export interface AssetListResponseDto {
  id: string
  key: string
  description: string
  type: AssetType
  isEncrypted: boolean
  createdAt: string
  lastModifiedAt?: string
  authorizedBotAgentsCount: number
}

export interface CreateAssetDto {
  key: string
  value: string
  description: string
  type: AssetType
  botAgentIds?: string[]
}

export interface UpdateAssetDto {
  value: string
  description: string
  key: string
}

export interface AssetDetailDto {
  id: string
  key: string
  value: string
  description: string
  isEncrypted: boolean
  type: AssetType
  createdAt: string
  lastModifiedAt?: string
}

export interface BotAgentSummaryDto {
  id: string
  name: string
  description: string
  isActive: boolean
}

export interface Agent {
  id: string
  name: string
  description: string
  isActive: boolean
}

export enum AssetType {
  String = 0,
  Secret = 1,
}

/**
 * CSV Import/Export types
 */
export interface CsvImportResultDto {
  totalRows: number
  successfulImports: number
  failedImports: number
  errors: string[]
  warnings: string[]
  assetsCreated: number
  assetsUpdated: number
}

export interface AssetCsvDto {
  key: string
  value: string
  description: string
  type: string
}
