import 'dart:developer' as developer;

/// AppLogger - Simple logging utility
/// Replaces print() statements with proper logging that can be disabled in production
class AppLogger {
  static const String _defaultName = 'NexusApp';
  
  /// Log info level message
  static void info(String message, {String? name}) {
    developer.log(
      message, 
      name: name ?? _defaultName,
      level: 800, // INFO level
    );
  }
  
  /// Log warning level message
  static void warning(String message, {String? name}) {
    developer.log(
      message, 
      name: name ?? _defaultName,
      level: 900, // WARNING level
    );
  }
  
  /// Log error level message
  static void error(String message, {String? name, Object? error, StackTrace? stackTrace}) {
    developer.log(
      message, 
      name: name ?? _defaultName,
      level: 1000, // SEVERE level
      error: error,
      stackTrace: stackTrace,
    );
  }
  
  /// Log debug level message (only in debug mode)
  static void debug(String message, {String? name}) {
    assert(() {
      developer.log(
        message, 
        name: name ?? _defaultName,
        level: 500, // FINE level
      );
      return true;
    }());
  }
}
