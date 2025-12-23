import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'services/supabase_service.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/add_screen.dart';
import 'screens/search_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/favourites_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/memory_provider.dart';

import 'services/sharing_service.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseService().initialize();

  // Initialize Sharing Service
  SharingService().initialize(navigatorKey);
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => MemoryProvider()),
      ],
      child: const NexusApp(),
    ),
  );
}

class NexusApp extends StatelessWidget {
  const NexusApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Nexus',
      theme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      
      // Initial route based on auth state
      home: authProvider.isAuthenticated 
          ? const MainNavigation()
          : const AuthScreen(),
      
      // Named routes
      routes: {
        '/auth': (context) => const AuthScreen(),
        '/home': (context) => const MainNavigation(),
        '/add': (context) => const AddScreen(),
        '/search': (context) => const SearchScreen(),
        '/chat': (context) => const ChatScreen(),
        '/settings': (context) => const SettingsScreen(),
        '/favourites': (context) => const FavouritesScreen(),
      },
    );
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  
  // Screens: Home, Favourites, Chat (locked)
  Widget _getScreen() {
    switch (_currentIndex) {
      case 0:
        return const HomeScreen();
      case 1:
        return const FavouritesScreen();
      case 2:
        // Chat is locked, shouldn't reach here
        return const HomeScreen();
      default:
        return const HomeScreen();
    }
  }

  void _onNavTap(int index) {
    if (index == 2) {
      // Chat is locked - show coming soon message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.lock, color: Colors.white, size: 20),
              SizedBox(width: 12),
              Expanded(
                child: Text('Chat is coming soon! Stay tuned.'),
              ),
            ],
          ),
          backgroundColor: AppTheme.cardHighlight,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
      return; // Don't navigate
    }
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _getScreen(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onNavTap,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: AppTheme.textMuted,
        backgroundColor: AppTheme.cardBackground,
        type: BottomNavigationBarType.fixed,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.bookmark_outline),
            activeIcon: Icon(Icons.bookmark),
            label: 'Saved',
          ),
          BottomNavigationBarItem(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.chat_bubble_outline),
                Positioned(
                  right: -6,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: BoxDecoration(
                      color: AppTheme.cardHighlight,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.lock,
                      size: 10,
                      color: AppTheme.textMuted,
                    ),
                  ),
                ),
              ],
            ),
            label: 'Chat 🔒',
          ),
        ],
      ),
    );
  }
}

