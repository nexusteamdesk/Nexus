import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/memory.dart';
import '../config/theme.dart';
import '../utils/app_logger.dart';

class MemoryCard extends StatelessWidget {
  final Memory memory;
  final VoidCallback onTap;
  final VoidCallback onFavorite;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const MemoryCard({
    super.key,
    required this.memory,
    required this.onTap,
    required this.onFavorite,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final metadata = memory.metadata;
    final isFavorite = metadata?.favorite ?? false;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.cardHighlight.withOpacity(0.3),
            AppTheme.cardBackground.withOpacity(0.8),
          ],
        ),
        border: Border.all(
          color: isFavorite 
              ? AppTheme.primary.withOpacity(0.5) 
              : AppTheme.cardHighlight.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title and Favorite
                    Row(
                      children: [
                        if (isFavorite)
                          const Icon(
                            Icons.bookmark,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                        if (isFavorite) const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            metadata?.title ?? 'Untitled',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontSize: 18,
                                ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            isFavorite ? Icons.bookmark : Icons.bookmark_outline,
                            color: isFavorite ? AppTheme.primary : AppTheme.textMuted,
                          ),
                          onPressed: onFavorite,
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                    
                    // Summary
                    if (metadata?.summary != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        metadata!.summary!,
                        style: Theme.of(context).textTheme.bodyMedium,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    
                    // Keywords
                    if (metadata?.keywords != null && metadata!.keywords!.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: metadata.keywords!.take(3).map((keyword) {
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.cardHighlight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              keyword,
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                    color: AppTheme.primary,
                                  ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                    
                    // Actions
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatDate(memory.createdAt),
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                        Row(
                          children: [
                            // Link button - positioned before View for visibility
                            if (_extractUrl(memory) != null)
                              TextButton.icon(
                                icon: const Icon(Icons.link, size: 18),
                                label: const Text('Link'),
                                style: TextButton.styleFrom(
                                  foregroundColor: AppTheme.primary,
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                ),
                                onPressed: () => _launchUrl(context, _extractUrl(memory)!),
                              ),
                            TextButton(
                              onPressed: onTap,
                              child: const Text('View'),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined),
                              onPressed: onEdit,
                              color: AppTheme.textMuted,
                              iconSize: 20,
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: onDelete,
                              color: AppTheme.textMuted,
                              iconSize: 20,
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  String? _extractUrl(Memory memory) {
    // 1. Check metadata URL fields (using bestUrl getter)
    final metadataUrl = memory.metadata?.bestUrl;
    if (metadataUrl != null && metadataUrl.isNotEmpty) {
      return metadataUrl;
    }

    // 2. Check for URL in content
    if (memory.content != null && memory.content!.isNotEmpty) {
       final urlRegExp = RegExp(r'(https?:\/\/[^\s]+)');
       final match = urlRegExp.firstMatch(memory.content!);
       if (match != null) return match.group(0);
    }

    final metadata = memory.metadata;
    if (metadata == null) return null;
    
    // 3. Check summary for embedded URLs
    if (metadata.summary != null && metadata.summary!.isNotEmpty) {
       final urlRegExp = RegExp(r'(https?:\/\/[^\s]+)');
       final match = urlRegExp.firstMatch(metadata.summary!);
       if (match != null) return match.group(0);
    }

    // 4. Check title for embedded URLs
    if (metadata.title != null && metadata.title!.isNotEmpty) {
       final urlRegExp = RegExp(r'(https?:\/\/[^\s]+)');
       final match = urlRegExp.firstMatch(metadata.title!);
       if (match != null) return match.group(0);
    }
    
    return null;
  }

  Future<void> _launchUrl(BuildContext context, String urlString) async {
    try {
      final uri = Uri.parse(urlString);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open link')),
          );
        }
      }
    } catch (e) {
      AppLogger.error('Launch Error', name: 'MemoryCard', error: e);
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
