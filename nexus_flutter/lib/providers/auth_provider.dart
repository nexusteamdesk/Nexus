import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/supabase_service.dart';
import '../utils/error_handler.dart';

/// AuthProvider - Manages authentication state using ChangeNotifier
/// Includes token refresh and user-friendly error handling
class AuthProvider extends ChangeNotifier {
  final SupabaseService _supabaseService = SupabaseService();
  StreamSubscription<AuthState>? _authSubscription;
  
  bool _isLoading = false;
  String? _error;
  bool _initialized = false;
  
  AuthProvider() {
    _initAuthListener();
  }
  
  /// Initialize auth state listener for token refresh
  void _initAuthListener() {
    _authSubscription = _supabaseService.authStateChanges.listen((authState) {
      final event = authState.event;
      
      switch (event) {
        case AuthChangeEvent.signedIn:
          developer.log('User signed in', name: 'AuthProvider');
          notifyListeners();
          break;
        case AuthChangeEvent.signedOut:
          developer.log('User signed out', name: 'AuthProvider');
          notifyListeners();
          break;
        case AuthChangeEvent.tokenRefreshed:
          developer.log('Token refreshed automatically', name: 'AuthProvider');
          break;
        case AuthChangeEvent.userUpdated:
          developer.log('User updated', name: 'AuthProvider');
          notifyListeners();
          break;
        default:
          break;
      }
      
      _initialized = true;
    });
  }
  
  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }
  
  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  User? get currentUser => _supabaseService.currentUser;
  bool get isAuthenticated => _supabaseService.isAuthenticated;
  String? get userEmail => currentUser?.email;
  String? get userId => currentUser?.id;
  String? get accessToken => _supabaseService.accessToken;
  bool get isInitialized => _initialized;
  
  /// Listen to auth state changes from Supabase
  Stream<AuthState> get authStateChanges => _supabaseService.authStateChanges;
  
  /// Manually refresh the session token
  Future<bool> refreshSession() async {
    try {
      final session = await _supabaseService.client.auth.refreshSession();
      if (session.session != null) {
        developer.log('Session refreshed manually', name: 'AuthProvider');
        return true;
      }
      return false;
    } catch (e) {
      developer.log('Failed to refresh session: $e', name: 'AuthProvider');
      return false;
    }
  }
  
  /// Sign in with email and password
  Future<bool> signIn(String email, String password) async {
    _setLoading(true);
    _clearError();
    
    try {
      await _supabaseService.signIn(email, password);
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(ErrorHandler.getUserMessage(e));
      _setLoading(false);
      developer.log('Sign in error: $e', name: 'AuthProvider');
      return false;
    }
  }
  
  /// Sign up with email and password
  Future<bool> signUp(String email, String password) async {
    _setLoading(true);
    _clearError();
    
    try {
      await _supabaseService.signUp(email, password);
      _setLoading(false);
      return true;
    } catch (e) {
      _setError(ErrorHandler.getUserMessage(e));
      _setLoading(false);
      developer.log('Sign up error: $e', name: 'AuthProvider');
      return false;
    }
  }
  
  /// Sign out the current user
  Future<void> signOut() async {
    _setLoading(true);
    try {
      await _supabaseService.signOut();
    } catch (e) {
      developer.log('Sign out error: $e', name: 'AuthProvider');
    } finally {
      _setLoading(false);
    }
  }
  
  /// Clear any displayed error
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  // Private helpers
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
  
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }
  
  void _clearError() {
    _error = null;
  }
}

