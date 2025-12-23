import 'package:flutter/material.dart';
import '../config/theme.dart';

/// ShimmerLoading - Animated loading placeholder
/// Creates a shimmer effect for skeleton loading states
class ShimmerLoading extends StatefulWidget {
  final double width;
  final double height;
  final double borderRadius;
  
  const ShimmerLoading({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = 8,
  });
  
  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
    
    _animation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(_animation.value - 1, 0),
              end: Alignment(_animation.value + 1, 0),
              colors: const [
                AppTheme.cardBackground,
                AppTheme.cardHighlight,
                AppTheme.cardBackground,
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Memory card skeleton loading placeholder
class MemoryCardSkeleton extends StatelessWidget {
  const MemoryCardSkeleton({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title skeleton
            Row(
              children: [
                const ShimmerLoading(width: 24, height: 24, borderRadius: 12),
                const SizedBox(width: 12),
                Expanded(
                  child: ShimmerLoading(height: 20, borderRadius: 4),
                ),
                const SizedBox(width: 40),
              ],
            ),
            const SizedBox(height: 12),
            
            // Summary skeleton - 2 lines
            const ShimmerLoading(height: 14, borderRadius: 4),
            const SizedBox(height: 8),
            const ShimmerLoading(width: 200, height: 14, borderRadius: 4),
            
            const SizedBox(height: 16),
            
            // Tags skeleton
            Row(
              children: [
                ShimmerLoading(width: 60, height: 24, borderRadius: 12),
                const SizedBox(width: 8),
                ShimmerLoading(width: 80, height: 24, borderRadius: 12),
                const SizedBox(width: 8),
                ShimmerLoading(width: 50, height: 24, borderRadius: 12),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Actions skeleton
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                ShimmerLoading(width: 80, height: 12, borderRadius: 4),
                Row(
                  children: [
                    ShimmerLoading(width: 40, height: 28, borderRadius: 4),
                    const SizedBox(width: 8),
                    ShimmerLoading(width: 50, height: 28, borderRadius: 4),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// List of skeleton memory cards for loading state
class MemoryListSkeleton extends StatelessWidget {
  final int count;
  
  const MemoryListSkeleton({super.key, this.count = 5});
  
  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: count,
      itemBuilder: (context, index) => const MemoryCardSkeleton(),
    );
  }
}
