import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';

export class VoteBuilder extends TransactionBuilder {
  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingVote;
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
      this.validateVoteTransaction(rawTx);
    } else {
      // If it's already a raw transaction object, validate it directly
      this.validateVoteTransaction(transaction);
    }
  }

  /**
   * Validates if the transaction is a valid vote transaction
   * @param transaction The transaction to validate
   * @throws {InvalidTransactionError} when the transaction is invalid
   */
  private validateVoteTransaction(transaction: any): void {
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
    if (contract.type !== 'VoteWitnessContract') {
      throw new InvalidTransactionError(
        `Invalid vote transaction: expected contract type VoteWitnessContract but got ${contract.type}`
      );
    }

    // Validate parameter value
    if (!contract.parameter || !contract.parameter.value) {
      throw new InvalidTransactionError('Invalid vote transaction: missing parameter value');
    }

    const value = contract.parameter.value;

    // Validate owner_address
    if (!value.owner_address || typeof value.owner_address !== 'string' || value.owner_address.length === 0) {
      throw new InvalidTransactionError('Invalid vote transaction: missing or invalid owner_address');
    }

    // Validate votes
    if (!Array.isArray(value.votes) || value.votes.length === 0) {
      throw new InvalidTransactionError('Invalid vote transaction: missing or empty votes array');
    }

    // Validate each vote
    for (const vote of value.votes) {
      if (!vote.vote_address || typeof vote.vote_address !== 'string' || vote.vote_address.length === 0) {
        throw new InvalidTransactionError('Invalid vote transaction: vote missing or invalid vote_address');
      }

      if (typeof vote.vote_count !== 'number' || vote.vote_count <= 0) {
        throw new InvalidTransactionError('Invalid vote transaction: vote count must be a positive number');
      }
    }
  }

  /**
   * Check if the transaction is a valid vote transaction
   * @param transaction Transaction to check
   * @returns True if the transaction is a valid vote transaction
   */
  canSign(transaction: any): boolean {
    try {
      this.validateVoteTransaction(transaction);
      return true;
    } catch (e) {
      return false;
    }
  }
}
