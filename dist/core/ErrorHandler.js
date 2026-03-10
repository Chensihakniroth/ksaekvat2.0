"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = exports.ValidationError = exports.InsufficientBalanceError = exports.UserNotFoundError = exports.AppError = void 0;
const logger = require('../utils/logger.js');
/**
 * Base custom error class for application-specific errors.
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Thrown when a user profile is not found in the database.
 */
class UserNotFoundError extends AppError {
    constructor(message = 'User profile could not be found.') {
        super(message, 404);
    }
}
exports.UserNotFoundError = UserNotFoundError;
/**
 * Thrown when a user attempts an economy/gacha action without sufficient balance.
 */
class InsufficientBalanceError extends AppError {
    constructor(message = 'You do not have enough balance for this action.') {
        super(message, 400);
    }
}
exports.InsufficientBalanceError = InsufficientBalanceError;
/**
 * Thrown when user input or action is invalid.
 */
class ValidationError extends AppError {
    constructor(message = 'Invalid operation.') {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
/**
 * The global Error Handler Service.
 * Used to elegantly catch and handle both predicted (AppError) and unpredicted exceptions.
 */
class ErrorHandler {
    /**
     * Handles discord command interaction errors.
     */
    static async handleInteractionError(error, interaction) {
        if (error instanceof AppError && error.isOperational) {
            // Known business logic error (e.g., InsufficientBalanceError)
            logger.warn(`Operational Error [${interaction.commandName}]: ${error.message}`);
            const replyOptions = { content: `⚠️ ${error.message}`, ephemeral: true };
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(replyOptions);
                }
                else {
                    await interaction.reply(replyOptions);
                }
            }
            catch (replyErr) {
                logger.error('Failed to send error message to user:', replyErr);
            }
        }
        else {
            // Unknown programmer error / unhandled exception
            logger.error(`Critical Error executing [${interaction.commandName || 'Unknown command'}]:`, error);
            const replyOptions = { content: '❌ An unexpected error occurred while processing your request. Please try again later.', ephemeral: true };
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.followUp(replyOptions);
                }
                else {
                    await interaction.reply(replyOptions);
                }
            }
            catch (replyErr) {
                logger.error('Failed to send fallback error message to user:', replyErr);
            }
        }
    }
    /**
     * Wrapper for async route/command handlers to eliminate try/catch blocks.
     */
    static catchAsync(fn) {
        return (interaction, ...args) => {
            fn(interaction, ...args).catch((err) => ErrorHandler.handleInteractionError(err, interaction));
        };
    }
}
exports.ErrorHandler = ErrorHandler;
