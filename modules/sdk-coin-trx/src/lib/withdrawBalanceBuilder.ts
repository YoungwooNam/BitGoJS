import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';

export class WithdrawBuilder extends TransactionBuilder {
  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /** Override to initialize this builder from a raw transaction */
  initBuilder(rawTransaction: string | any): void {
    this.transaction = this.fromImplementation(rawTransaction);
    // Explicitly set the transaction type after initialization
    this.transaction.setTransactionType(this.transactionType);
  }

  validateTransaction(transaction: any): void {
    if (transaction && typeof transaction.toJson === 'function') {
      super.validateTransaction(transaction);
      // Get the raw transaction data from the Transaction object
      const rawTx = transaction.toJson();
      this.validateWithdrawTransaction(rawTx);
    } else {
      // If it's already a raw transaction object, validate it directly
      this.validateWithdrawTransaction(transaction);
    }
  }

  /**
   * Validates if the transaction is a valid withdraw transaction
   * @param transaction The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateWithdrawTransaction(transaction: any): void {
    if (
      !transaction ||
      !transaction.raw_data ||
      !transaction.raw_data.contract ||
      transaction.raw_data.contract.length === 0
    ) {
      throw new InvalidTransactionError('Invalid transaction: missing or empty contract array');
    }

    const contract = transaction.raw_data.contract[0];

    // Validate contract type
    if (contract.type !== 'WithdrawExpireUnfreezeContract') {
      throw new InvalidTransactionError(
        `Invalid withdraw transaction: expected contract type WithdrawExpireUnfreezeContract but got ${contract.type}`
      );
    }

    // Validate parameter value
    if (!contract.parameter || !contract.parameter.value) {
      throw new InvalidTransactionError('Invalid withdraw transaction: missing parameter value');
    }

    const value = contract.parameter.value;

    // Validate owner_address
    if (!value.owner_address || typeof value.owner_address !== 'string' || value.owner_address.length === 0) {
      throw new InvalidTransactionError('Invalid withdraw transaction: missing or invalid owner_address');
    }
  }

  /**
   * Check if the transaction is a valid withdraw transaction
   * @param transaction Transaction to check
   * @returns True if the transaction is a valid withdraw transaction
   */
  canSign(transaction: any): boolean {
    try {
      this.validateWithdrawTransaction(transaction);
      return true;
    } catch (e) {
      return false;
    }
  }
}
