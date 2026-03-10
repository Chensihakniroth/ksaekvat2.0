import { CommandInteraction, BaseInteraction } from 'discord.js';
const logger = require('../utils/logger.js');

/**
 * Base custom error class for application-specific errors.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when a user profile is not found in the database.
 */
export class UserNotFoundError extends AppError {
  constructor(message: string = 'User profile could not be found.') {
    super(message, 404);
  }
}

/**
 * Thrown when a user attempts an economy/gacha action without sufficient balance.
 */
export class InsufficientBalanceError extends AppError {
  constructor(message: string = 'You do not have enough balance for this action.') {
    super(message, 400);
  }
}

/**
 * Thrown when user input or action is invalid.
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Invalid operation.') {
    super(message, 400);
  }
}

/**
 * The global Error Handler Service.
 * Used to elegantly catch and handle both predicted (AppError) and unpredicted exceptions.
 */
export class ErrorHandler {
  /**
   * Handles discord command interaction errors.
   */
  static async handleInteractionError(error: Error, interaction: CommandInteraction | any) {
    if (error instanceof AppError && error.isOperational) {
      // Known business logic error (e.g., InsufficientBalanceError)
      logger.warn(`Operational Error [${interaction.commandName}]: ${error.message}`);
      
      const replyOptions = { content: `⚠️ ${error.message}`, ephemeral: true };
      
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(replyOptions);
        } else {
          await interaction.reply(replyOptions);
        }
      } catch (replyErr) {
        logger.error('Failed to send error message to user:', replyErr);
      }
    } else {
      // Unknown programmer error / unhandled exception
      logger.error(`Critical Error executing [${interaction.commandName || 'Unknown command'}]:`, error);
      
      const replyOptions = { content: '❌ An unexpected error occurred while processing your request. Please try again later.', ephemeral: true };
      
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(replyOptions);
        } else {
          await interaction.reply(replyOptions);
        }
      } catch (replyErr) {
        logger.error('Failed to send fallback error message to user:', replyErr);
      }
    }
  }

  /**
   * Wrapper for async route/command handlers to eliminate try/catch blocks.
   */
  static catchAsync(fn: Function) {
    return (interaction: any, ...args: any[]) => {
      fn(interaction, ...args).catch((err: Error) => ErrorHandler.handleInteractionError(err, interaction));
    };
  }
}
