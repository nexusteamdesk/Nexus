class Memory {
  final String id;
  final String userId;
  final String? content;
  final DateTime createdAt;
  final MemoryMetadata? metadata;
 
  Memory({
    required this.id,
    required this.userId,
    this.content,
    required this.createdAt,
    this.metadata,
  });

  factory Memory.fromJson(Map<String, dynamic> json) {
    final metadata = json['metadata'] != null
        ? MemoryMetadata.fromJson(json['metadata'])
        : null;

    // In retain_auth_memory, content might be in metadata fields or missing
    final String? content = json['content'] ?? metadata?.summary ?? metadata?.title;

    return Memory(
      id: json['id'].toString(),
      userId: json['user_id'] ?? '',
      content: content,
      createdAt: DateTime.parse(json['created_at']),
      metadata: metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'content': content,
      'created_at': createdAt.toIso8601String(),
      'metadata': metadata?.toJson(),
    };
  }
}

class MemoryMetadata {
  final String? title;
  final String? summary;
  final List<String>? keywords;
  final bool? favorite;
  final String? category;
  final String? url;
  final String? sourceUrl;  // URL from extension/mobile share
  final String? link;       // Alternative URL field
  final String? originalUrl; // Another alternative

  MemoryMetadata({
    this.title,
    this.summary,
    this.keywords,
    this.favorite,
    this.category,
    this.url,
    this.sourceUrl,
    this.link,
    this.originalUrl,
  });

  /// Get the best available URL from any of the URL fields
  String? get bestUrl => url ?? sourceUrl ?? link ?? originalUrl;

  factory MemoryMetadata.fromJson(Map<String, dynamic> json) {
    return MemoryMetadata(
      title: json['title'],
      summary: json['summary'],
      keywords: json['keywords'] != null
          ? List<String>.from(json['keywords'])
          : null,
      favorite: json['favorite'],
      category: json['category'],
      url: json['url'],
      sourceUrl: json['source_url'] ?? json['sourceUrl'],
      link: json['link'],
      originalUrl: json['original_url'] ?? json['originalUrl'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'summary': summary,
      'keywords': keywords,
      'favorite': favorite,
      'category': category,
      'url': url,
      'source_url': sourceUrl,
      'link': link,
      'original_url': originalUrl,
    };
  }
}
