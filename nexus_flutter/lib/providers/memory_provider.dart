import 'dart:async';
import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';
import '../models/memory.dart';
import '../services/supabase_service.dart';
import '../services/backend_service.dart';

/// MemoryProvider - Manages memory state using ChangeNotifier
/// Provides reactive state for the home screen and search functionality
class MemoryProvider extends ChangeNotifier {
  final SupabaseService _supabaseService = SupabaseService();
  final BackendService _backendService = BackendService();
  
  // State
  List<Memory> _memories = [];
  List<Memory> _searchResults = [];
  bool _isLoading = false;
  bool _isSearchLoading = false;
  bool _isSearching = false;
  String? _selectedTag;
  String? _error;
  Timer? _debounce;
  
  // Getters
  List<Memory> get memories => _memories;
  List<Memory> get searchResults => _searchResults;
  bool get isLoading => _isLoading;
  bool get isSearchLoading => _isSearchLoading;
  bool get isSearching => _isSearching;
  String? get selectedTag => _selectedTag;
  String? get error => _error;
  
  /// Get filtered memories based on selected tag
  List<Memory> get filteredMemories {
    if (_selectedTag == null) return _memories;
    return _memories.where((m) {
      final keywords = m.metadata?.keywords ?? [];
      return keywords.contains(_selectedTag);
    }).toList();
  }
  
  /// Get all unique tags from memories
  Set<String> get allTags {
    final tags = <String>{};
    for (final memory in _memories) {
      if (memory.metadata?.keywords != null) {
        tags.addAll(memory.metadata!.keywords!);
      }
    }
    return tags;
  }
  
  /// Get the list to display (search results or filtered memories)
  List<Memory> get displayMemories => _isSearching ? _searchResults : filteredMemories;
  
  /// Get current loading state for display
  bool get displayLoading => _isSearching ? _isSearchLoading : _isLoading;
  
  /// Load all memories from Supabase
  Future<void> loadMemories() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _memories = await _supabaseService.fetchMemories();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      developer.log('Load memories error: $e', name: 'MemoryProvider');
      notifyListeners();
    }
  }
  
  /// Set the selected tag filter
  void setSelectedTag(String? tag) {
    _selectedTag = tag;
    notifyListeners();
  }
  
  /// Start or stop search mode
  void setSearching(bool value) {
    _isSearching = value;
    if (!value) {
      _searchResults = [];
    }
    notifyListeners();
  }
  
  /// Perform search with debounce
  void onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      _performSearch(query);
    });
  }
  
  /// Execute the search query
  Future<void> _performSearch(String query) async {
    if (query.trim().isEmpty) {
      _isSearching = false;
      _searchResults = [];
      notifyListeners();
      return;
    }
    
    _isSearching = true;
    _isSearchLoading = true;
    notifyListeners();
    
    try {
      final userId = _supabaseService.currentUser?.id;
      if (userId == null) return;
      
      _searchResults = await _backendService.searchMemories(query, userId);
      _isSearchLoading = false;
      notifyListeners();
    } catch (e) {
      developer.log('Search error: $e', name: 'MemoryProvider');
      _isSearchLoading = false;
      _searchResults = [];
      notifyListeners();
    }
  }
  
  /// Clear search and return to normal feed
  void clearSearch() {
    _debounce?.cancel();
    _isSearching = false;
    _searchResults = [];
    notifyListeners();
  }
  
  /// Toggle favorite status for a memory
  Future<void> toggleFavorite(Memory memory) async {
    try {
      await _supabaseService.toggleFavorite(
        memory.id,
        memory.metadata?.toJson() ?? {},
      );
      await loadMemories(); // Reload to get updated data
    } catch (e) {
      _error = e.toString();
      developer.log('Toggle favorite error: $e', name: 'MemoryProvider');
      notifyListeners();
    }
  }
  
  /// Delete a memory
  Future<bool> deleteMemory(String id) async {
    try {
      await _supabaseService.deleteMemory(id);
      await loadMemories();
      return true;
    } catch (e) {
      _error = e.toString();
      developer.log('Delete memory error: $e', name: 'MemoryProvider');
      notifyListeners();
      return false;
    }
  }
  
  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}
