// src/shared/testing/TestContainer.ts
import { Container } from '@/shared/di/Container'
import { ServiceTokens } from '@/shared/di/ServiceTokens'

// Mock implementations
class MockTransactionRepository {
  async findAll() { return [] }
  async findById() { return null }
  async create() { return null }
  async update() { return null }
  async delete() { return }
  async bulkUpdate() { return }
  async countByFilters() { return 0 }
}

class MockAccountRepository {
  async findAll() { return [] }
  async findById() { return null }
  async create() { return null }
  async update() { return null }
  async delete() { return }
  async updateBalance() { return null }
}

class MockLogger {
  info() {}
  error() {}
  warn() {}
  debug() {}
}

/**
 * Container configurado para testes
 */
export function createTestContainer(): Container {
  const container = new Container()

  // Mocks
  container.registerInstance(ServiceTokens.LOGGER, new MockLogger())
  container.registerInstance(ServiceTokens.TRANSACTION_REPOSITORY, new MockTransactionRepository())
  container.registerInstance(ServiceTokens.ACCOUNT_REPOSITORY, new MockAccountRepository())

  return container
}