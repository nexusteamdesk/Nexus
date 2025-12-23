import 'package:flutter/material.dart';
import '../config/theme.dart';

/// EmptyState - Reusable empty state widget
/// Use for screens with no data, search with no results, etc.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;
  
  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });
  
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: AppTheme.textMuted,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 8),
              Text(
                subtitle!,
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 24),
              action!,
            ],
          ],
        ),
      ),
    );
  }
  
  /// Factory for "no memories" state
  factory EmptyState.noMemories({VoidCallback? onAdd}) {
    return EmptyState(
      icon: Icons.lightbulb_outline,
      title: 'No memories yet',
      subtitle: 'Tap + to create your first memory',
      action: onAdd != null
          ? ElevatedButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Add Memory'),
            )
          : null,
    );
  }
  
  /// Factory for "no search results" state
  factory EmptyState.noResults({String? query}) {
    return EmptyState(
      icon: Icons.search_off,
      title: 'No results found',
      subtitle: query != null ? 'Try a different search for "$query"' : null,
    );
  }
}
