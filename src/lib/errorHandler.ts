/**
 * Safe error handler utility - sanitizes error messages before displaying to users
 * to prevent information leakage (database schemas, internal paths, etc.)
 */

export const getSafeErrorMessage = (error: unknown): string => {
  // Log full error to console for debugging (server-side/dev only)
  console.error('Error occurred:', error);

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Map common Supabase/PostgreSQL errors to user-friendly messages
    if (message.includes('violates row-level security')) {
      return 'You do not have permission to perform this action.';
    }
    if (message.includes('unique constraint') || message.includes('duplicate key')) {
      return 'This record already exists.';
    }
    if (message.includes('foreign key')) {
      return 'Cannot complete this action as the item is referenced elsewhere.';
    }
    if (message.includes('not found') || message.includes('does not exist')) {
      return 'The requested item was not found.';
    }
    
    // Authentication errors
    if (message.includes('invalid login') || message.includes('invalid credentials')) {
      return 'Invalid email or password.';
    }
    if (message.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (message.includes('user already registered') || message.includes('already exists')) {
      return 'An account with this email already exists.';
    }
    if (message.includes('password') && message.includes('weak')) {
      return 'Password is too weak. Please use a stronger password.';
    }
    if (message.includes('session expired') || message.includes('jwt expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    if (message.includes('not authenticated') || message.includes('unauthorized')) {
      return 'You must be signed in to perform this action.';
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    // Validation errors
    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('required')) {
      return 'Please fill in all required fields.';
    }
  }

  // Default safe message for unknown errors
  return 'An unexpected error occurred. Please try again.';
};
