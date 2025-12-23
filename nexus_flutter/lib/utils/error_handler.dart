/// Error Handler - User-friendly error messages
/// Converts technical errors to user-readable messages
class ErrorHandler {
  /// Convert any error to user-friendly message
  static String getUserMessage(dynamic error) {
    final message = error.toString().toLowerCase();
    
    // Network errors
    if (message.contains('socketexception') || 
        message.contains('handshakeexception') ||
        message.contains('connection refused')) {
      return 'No internet connection. Please check your network.';
    }
    
    if (message.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    // Auth errors
    if (message.contains('invalid login credentials') ||
        message.contains('invalid_credentials')) {
      return 'Incorrect email or password.';
    }
    
    if (message.contains('email not confirmed')) {
      return 'Please verify your email before signing in.';
    }
    
    if (message.contains('user already registered') ||
        message.contains('email already in use')) {
      return 'This email is already registered. Try signing in.';
    }
    
    if (message.contains('weak password') ||
        message.contains('password')) {
      return 'Password must be at least 6 characters.';
    }
    
    if (message.contains('invalid email')) {
      return 'Please enter a valid email address.';
    }
    
    if (message.contains('jwt') || message.contains('token')) {
      return 'Session expired. Please sign in again.';
    }
    
    // Rate limiting
    if (message.contains('429') || message.contains('rate limit')) {
      return 'Too many requests. Please wait a moment.';
    }
    
    // Server errors
    if (message.contains('500') || message.contains('internal server')) {
      return 'Server error. Please try again later.';
    }
    
    if (message.contains('503') || message.contains('service unavailable')) {
      return 'Service temporarily unavailable.';
    }
    
    // Database errors
    if (message.contains('row level security') || 
        message.contains('rls') ||
        message.contains('permission denied')) {
      return 'You don\'t have permission for this action.';
    }
    
    // Default
    return 'Something went wrong. Please try again.';
  }
  
  /// Check if error is a network issue
  static bool isNetworkError(dynamic error) {
    final message = error.toString().toLowerCase();
    return message.contains('socketexception') || 
           message.contains('handshakeexception') ||
           message.contains('connection refused') ||
           message.contains('timeout');
  }
  
  /// Check if error requires re-authentication
  static bool requiresReauth(dynamic error) {
    final message = error.toString().toLowerCase();
    return message.contains('jwt') || 
           message.contains('token') ||
           message.contains('session expired') ||
           message.contains('not authenticated');
  }
}
