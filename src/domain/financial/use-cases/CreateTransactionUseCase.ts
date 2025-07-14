// src/domain/financial/use-cases/CreateTransactionUseCase.ts

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: any,
    private readonly accountRepository: any
  ) {}

  async execute(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Transaction timeout')), 8000);
    });

    return Promise.race([
      this.processTransaction(request),
      timeoutPromise
    ]);
  }

  private async processTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
      // Validate account first
      const account = await this.accountRepository.findById(request.accountId);
      
      if (!account) {
        throw new Error('Account not found');
      }

      const isValidAccount = await this.validateAccountPermissions(account.id);
      if (!isValidAccount) {
        throw new Error('Account is not active');
      }

      // Check balance for expenses
      if (request.type === 'despesa' && request.isPaid && account.balance < request.amount) {
        throw new Error('Insufficient balance');
      }

      // Execute atomic transaction
      return await this.transactionRepository.$transaction(async (tx: any) => {
        // Create transaction
        const transaction = {
          ...request,
          created_at: new Date(),
          updated_at: new Date(),
          status: 'PENDING'
        } as Transaction;

        const savedTransaction = await tx.transaction.create({
          data: transaction
        });

        // Update account balance if paid
        let updatedAccount = account;
        if (request.isPaid) {
          const newBalance = request.type === 'receita' 
            ? account.balance + request.amount
            : account.balance - request.amount;

          updatedAccount = await tx.account.update({
            where: { id: account.id },
            data: { 
              balance: newBalance,
              updated_at: new Date()
            }
          });
        }

        // Update transaction status
        const finalTransaction = await tx.transaction.update({
          where: { id: savedTransaction.id },
          data: { status: 'COMPLETED' }
        });

        return {
          success: true,
          transaction: finalTransaction,
          account: updatedAccount
        };
      }, {
        timeout: 7000,
        maxWait: 5000
      });

    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Transaction failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper method to validate account permissions
  private async validateAccountPermissions(accountId: string): Promise<boolean> {
    try {
      const account = await this.accountRepository.findById(accountId);
      return account?.is_active === true;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn(`Account validation failed: ${error.message}`);
      return false;
    }
  }

  // Helper method to calculate installment amounts
  private calculateInstallmentAmounts(totalAmount: number, installments: number): number {
    return Math.round((totalAmount / installments) * 100) / 100;
  }
}

interface CreateTransactionRequest {
  accountId: string;
  amount: number;
  type: 'receita' | 'despesa';
  isPaid: boolean;
  description?: string;
  category?: string;
  installments?: number;
}

interface CreateTransactionResponse {
  success: boolean;
  transaction: Transaction;
  account: any;
}

interface Transaction {
  id?: string;
  accountId: string;
  amount: number;
  type: string;
  isPaid: boolean;
  description?: string;
  category?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}