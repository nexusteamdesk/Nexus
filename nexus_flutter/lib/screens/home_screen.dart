import 'dart:async';
import 'package:flutter/material.dart';
import '../models/memory.dart';
import '../services/supabase_service.dart';
import '../services/backend_service.dart';
import '../config/theme.dart';
import '../widgets/memory_card.dart';
import '../widgets/shimmer_loading.dart';
import '../utils/app_logger.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _supabase = SupabaseService();
  final _backend = BackendService();
  
  // Feed State
  List<Memory> _memories = [];
  bool _isLoading = true;

  // Search State
  final _searchController = TextEditingController();
  List<Memory> _searchResults = [];
  bool _isSearching = false;
  bool _isSearchLoading = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadMemories();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    
    // Immediate local search for fast feedback
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() {
        _isSearching = false;
        _searchResults = [];
      });
      return;
    }
    
    // Instant local search
    _performLocalSearch(query);
    
    // Debounced backend search for semantic results (runs in background)
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _performBackendSearch(query);
    });
  }

  /// Fast local search - searches through cached memories instantly
  void _performLocalSearch(String query) {
    final results = _memories.where((memory) {
      final title = memory.metadata?.title?.toLowerCase() ?? '';
      final summary = memory.metadata?.summary?.toLowerCase() ?? '';
      final content = memory.content?.toLowerCase() ?? '';
      final keywords = memory.metadata?.keywords?.join(' ').toLowerCase() ?? '';
      final category = memory.metadata?.category?.toLowerCase() ?? '';
      
      // Check all fields for match
      return title.contains(query) ||
          summary.contains(query) ||
          content.contains(query) ||
          keywords.contains(query) ||
          category.contains(query);
    }).toList();
    
    if (mounted) {
      setState(() {
        _isSearching = true;
        _searchResults = results;
        _isSearchLoading = false; // Local search is instant
      });
    }
  }

  /// Backend semantic search for NLP-powered results
  Future<void> _performBackendSearch(String query) async {
    if (query.isEmpty) return;
    
    try {
      final userId = _supabase.currentUser?.id;
      if (userId == null) return;

      // Backend semantic search (NLP-based)
      final results = await _backend.searchMemories(query, userId);
      
      // Only update if we got results AND user hasn't changed the query
      if (mounted && _searchController.text.trim().toLowerCase() == query) {
        if (results.isNotEmpty) {
          // Merge with local results, prioritizing backend results
          final existingIds = _searchResults.map((m) => m.id).toSet();
          final newResults = results.where((m) => !existingIds.contains(m.id)).toList();
          
          setState(() {
            _searchResults = [...results, ...newResults];
          });
        }
      }
    } catch (e) {
      AppLogger.error('Backend Search Error', name: 'HomeScreen', error: e);
      // Local search results are already shown, so no need to show error
    }
  }

  Future<void> _loadMemories() async {
    setState(() => _isLoading = true);
    try {
      final memories = await _supabase.fetchMemories();
      setState(() {
        _memories = memories;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading memories: $e')),
        );
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _loadMemories();
  }

  Future<void> _toggleFavorite(Memory memory) async {
    try {
      await _supabase.toggleFavorite(
        memory.id,
        memory.metadata?.toJson() ?? {},
      );
      await _loadMemories(); // Reload to get updated data
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _deleteMemory(Memory memory) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Memory'),
        content: const Text('Are you sure you want to delete this memory?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _supabase.deleteMemory(memory.id);
        await _loadMemories();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting memory: $e')),
          );
        }
      }
    }
  }

  Future<void> _editMemory(Memory memory) async {
    final result = await Navigator.pushNamed(
      context, 
      '/add', 
      arguments: memory,
    );
    if (result == true) {
      await _loadMemories();
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine which list to show
    final displayMemories = _isSearching ? _searchResults : _memories;
    final isListLoading = _isSearching ? _isSearchLoading : _isLoading;

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search hints, emotions...',
                  border: InputBorder.none,
                  hintStyle: const TextStyle(color: Colors.white70),
                  suffixIcon: _searchController.text.isNotEmpty 
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                             _searchResults = [];
                             _isSearching = false; // Optional: keep search bar but clear results? User wants "Search Engine", better to keep bar open.
                             // Actually, let's keep it simple.
                          });
                        },
                      )
                    : null,
                ),
                autofocus: true,
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Nexus'),
                  Text(
                    'AI MEMORY BANK',
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: AppTheme.primary,
                          letterSpacing: 1.5,
                        ),
                  ),
                ],
              ),
        actions: [
          IconButton(
            icon: Icon(_isSearching ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _isSearching = false;
                  _searchController.clear();
                  _searchResults = [];
                } else {
                  _isSearching = true;
                }
              });
            },
          ),
          if (!_isSearching)
            IconButton(
              icon: const Icon(Icons.account_circle_outlined),
              onPressed: () {
                 Navigator.pushNamed(context, '/settings');
              },
            ),
        ],
      ),
      body: Column(
        children: [
          // Memory List (Feed or Search Results)
          Expanded(
            child: isListLoading
                ? const MemoryListSkeleton(count: 5)
                : displayMemories.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _isSearching ? Icons.search_off : Icons.lightbulb_outline,
                              size: 64,
                              color: AppTheme.textMuted,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _isSearching 
                                ? 'No results found' 
                                : 'No memories yet',
                              style: Theme.of(context).textTheme.headlineMedium,
                            ),
                            if (!_isSearching) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Tap + to create your first memory',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _handleRefresh,
                        child: ListView.builder(
                          itemCount: displayMemories.length,
                          padding: const EdgeInsets.only(bottom: 80),
                          itemBuilder: (context, index) {
                            final memory = displayMemories[index];
                            return MemoryCard(
                              memory: memory,
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  builder: (context) => _buildDetailModal(memory),
                                );
                              },
                              onFavorite: () => _toggleFavorite(memory),
                              onEdit: () => _editMemory(memory),
                              onDelete: () => _deleteMemory(memory),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.pushNamed(context, '/add');
          if (result == true) {
            await _loadMemories();
          }
        },
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildDetailModal(Memory memory) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.cardBackground,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  memory.metadata?.title ?? 'Memory',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (memory.metadata?.summary != null) ...[
            Text(
              'Summary',
              style: Theme.of(context).textTheme.labelSmall,
            ),
            const SizedBox(height: 8),
            Text(memory.metadata!.summary!),
            const SizedBox(height: 16),
          ],
          Text(
            'Content',
            style: Theme.of(context).textTheme.labelSmall,
          ),
          const SizedBox(height: 8),
          Text(memory.content ?? 'No content'),
          const SizedBox(height: 16),
          if (memory.metadata?.keywords != null &&
              memory.metadata!.keywords!.isNotEmpty) ...[
            Text(
              'Tags',
              style: Theme.of(context).textTheme.labelSmall,
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: memory.metadata!.keywords!
                  .take(8) // Limit to 8 keywords max
                  .map((keyword) => Chip(
                        label: Text(keyword),
                        backgroundColor: AppTheme.cardHighlight,
                      ))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }
}
