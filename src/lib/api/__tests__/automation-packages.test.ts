import { deletePackageVersion, deleteAutomationPackage } from '../automation-packages'
import { api } from '../client'

// Mock the API client
jest.mock('../client', () => ({
  api: {
    delete: jest.fn(),
  },
}))

describe('PK-09_DeletePackageVersion', () => {
  const mockApi = api as jest.Mocked<typeof api>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('deletePackageVersion', () => {
    const packageId = 'test-package-id'
    const version = '1.0.0'

    it('should successfully delete a package version', async () => {
      // Arrange
      mockApi.delete.mockResolvedValue(undefined)

      // Act
      await deletePackageVersion(packageId, version)

      // Assert
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/1.0.0'
      )
      expect(mockApi.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors when deleting package version', async () => {
      // Arrange
      const errorMessage = 'Package version not found'
      const apiError = {
        message: errorMessage,
        status: 404,
        details: 'The specified package version does not exist',
      }
      mockApi.delete.mockRejectedValue(apiError)

      // Act & Assert
      await expect(deletePackageVersion(packageId, version)).rejects.toEqual(apiError)
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/1.0.0'
      )
    })

    it('should handle network errors when deleting package version', async () => {
      // Arrange
      const networkError = new Error('Network error')
      mockApi.delete.mockRejectedValue(networkError)

      // Act & Assert
      await expect(deletePackageVersion(packageId, version)).rejects.toThrow('Network error')
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/1.0.0'
      )
    })

    it('should handle empty package ID', async () => {
      // Arrange
      mockApi.delete.mockResolvedValue(undefined)

      // Act
      await deletePackageVersion('', version)

      // Assert
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages//versions/1.0.0'
      )
    })

    it('should handle empty version', async () => {
      // Arrange
      mockApi.delete.mockResolvedValue(undefined)

      // Act
      await deletePackageVersion(packageId, '')

      // Assert
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/'
      )
    })

    it('should handle special characters in package ID and version', async () => {
      // Arrange
      const specialPackageId = 'test-package-id-123!@#'
      const specialVersion = '1.0.0-beta+exp.sha.5114f85'
      mockApi.delete.mockResolvedValue(undefined)

      // Act
      await deletePackageVersion(specialPackageId, specialVersion)

      // Assert
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id-123!@#/versions/1.0.0-beta+exp.sha.5114f85'
      )
    })

    it('should handle 401 unauthorized response', async () => {
      // Arrange
      const unauthorizedError = {
        message: 'Unauthorized',
        status: 401,
        details: 'Token expired or invalid',
      }
      mockApi.delete.mockRejectedValue(unauthorizedError)

      // Act & Assert
      await expect(deletePackageVersion(packageId, version)).rejects.toEqual(unauthorizedError)
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/1.0.0'
      )
    })

    it('should handle 403 forbidden response', async () => {
      // Arrange
      const forbiddenError = {
        message: 'Forbidden',
        status: 403,
        details: 'Insufficient permissions to delete package version',
      }
      mockApi.delete.mockRejectedValue(forbiddenError)

      // Act & Assert
      await expect(deletePackageVersion(packageId, version)).rejects.toEqual(forbiddenError)
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/1.0.0'
      )
    })

    it('should handle 500 server error', async () => {
      // Arrange
      const serverError = {
        message: 'Internal Server Error',
        status: 500,
        details: 'An unexpected error occurred on the server',
      }
      mockApi.delete.mockRejectedValue(serverError)

      // Act & Assert
      await expect(deletePackageVersion(packageId, version)).rejects.toEqual(serverError)
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id/versions/1.0.0'
      )
    })
  })

  describe('deleteAutomationPackage (related function)', () => {
    const packageId = 'test-package-id'

    it('should successfully delete an automation package', async () => {
      // Arrange
      mockApi.delete.mockResolvedValue(undefined)

      // Act
      await deleteAutomationPackage(packageId)

      // Assert
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id'
      )
      expect(mockApi.delete).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors when deleting automation package', async () => {
      // Arrange
      const errorMessage = 'Package not found'
      const apiError = {
        message: errorMessage,
        status: 404,
        details: 'The specified package does not exist',
      }
      mockApi.delete.mockRejectedValue(apiError)

      // Act & Assert
      await expect(deleteAutomationPackage(packageId)).rejects.toEqual(apiError)
      expect(mockApi.delete).toHaveBeenCalledWith(
        'default/api/packages/test-package-id'
      )
    })
  })
})