// src/domain/financial/repositories/IAccountRepository.ts
import { AccountEntity, Account } from '../entities/Account'

export interface IAccountRepository {
  findById(id: string): Promise<AccountEntity | null>
  findAll(): Promise<AccountEntity[]>
  findActive(): Promise<AccountEntity[]>
  create(account: AccountEntity): Promise<AccountEntity>
  update(id: string, account: Partial<Account>): Promise<AccountEntity>
  delete(id: string): Promise<void>
  updateBalance(id: string, balance: number): Promise<AccountEntity>
}