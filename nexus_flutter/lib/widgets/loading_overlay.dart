import 'package:flutter/material.dart';
import '../config/theme.dart';

/// LoadingOverlay - Consistent loading state widget
/// Use this for full-screen or inline loading states
class LoadingOverlay extends StatelessWidget {
  final String? message;
  final bool isOverlay;
  
  const LoadingOverlay({
    super.key,
    this.message,
    this.isOverlay = false,
  });
  
  @override
  Widget build(BuildContext context) {
    final content = Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(
            color: AppTheme.primary,
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
    
    if (isOverlay) {
      return Container(
        color: Colors.black54,
        child: content,
      );
    }
    
    return content;
  }
  
  /// Show as a modal dialog
  static Future<void> show(BuildContext context, {String? message}) {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => PopScope(
        canPop: false,
        child: Center(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(
                    color: AppTheme.primary,
                  ),
                  if (message != null) ...[
                    const SizedBox(height: 16),
                    Text(message),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  /// Hide the loading dialog
  static void hide(BuildContext context) {
    Navigator.of(context, rootNavigator: true).pop();
  }
}
