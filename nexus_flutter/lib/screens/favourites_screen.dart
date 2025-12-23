import 'dart:async';
import 'package:flutter/material.dart';
import '../models/memory.dart';
import '../services/supabase_service.dart';
import '../config/theme.dart';
import '../widgets/memory_card.dart';
import '../widgets/shimmer_loading.dart';

class FavouritesScreen extends StatefulWidget {
  const FavouritesScreen({super.key});

  @override
  State<FavouritesScreen> createState() => _FavouritesScreenState();
}

class _FavouritesScreenState extends State<FavouritesScreen> {
  final _supabase = SupabaseService();
  
  // State
  List<Memory> _favourites = [];
  bool _isLoading = true;
  
  // Search State
  final _searchController = TextEditingController();
  List<Memory> _searchResults = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _loadFavourites();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim().toLowerCase();
    if (query.isEmpty) {
      setState(() {
        _isSearching = false;
        _searchResults = [];
      });
      return;
    }
    
    // Instant local search through favourites
    final results = _favourites.where((memory) {
      final title = memory.metadata?.title?.toLowerCase() ?? '';
      final summary = memory.metadata?.summary?.toLowerCase() ?? '';
      final content = memory.content?.toLowerCase() ?? '';
      final keywords = memory.metadata?.keywords?.join(' ').toLowerCase() ?? '';
      
      return title.contains(query) ||
          summary.contains(query) ||
          content.contains(query) ||
          keywords.contains(query);
    }).toList();
    
    setState(() {
      _isSearching = true;
      _searchResults = results;
    });
  }

  Future<void> _loadFavourites() async {
    setState(() => _isLoading = true);
    try {
      final allMemories = await _supabase.fetchMemories();
      // Filter only favourites
      final favourites = allMemories.where((m) => 
        m.metadata?.favorite == true
      ).toList();
      
      setState(() {
        _favourites = favourites;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading favourites: $e')),
        );
      }
    }
  }

  Future<void> _toggleFavorite(Memory memory) async {
    try {
      await _supabase.toggleFavorite(
        memory.id,
        memory.metadata?.toJson() ?? {},
      );
      await _loadFavourites();
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
        await _loadFavourites();
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
      await _loadFavourites();
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayMemories = _isSearching ? _searchResults : _favourites;

    return Scaffold(
      appBar: AppBar(
        title: _isSearching
            ? TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Search saved...',
                  border: InputBorder.none,
                  hintStyle: const TextStyle(color: Colors.white70),
                  suffixIcon: _searchController.text.isNotEmpty 
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.white),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                             _searchResults = [];
                             _isSearching = false;
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
                    'SAVED • ${_favourites.length}',
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
        ],
      ),
      body: _isLoading
          ? const MemoryListSkeleton(count: 5)
          : displayMemories.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _isSearching ? Icons.search_off : Icons.bookmark_outline,
                        size: 64,
                        color: AppTheme.textMuted,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _isSearching 
                          ? 'No results found' 
                          : 'No saved items yet',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      if (!_isSearching) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Tap the bookmark icon on any memory\nto save it here',
                          style: Theme.of(context).textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadFavourites,
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
