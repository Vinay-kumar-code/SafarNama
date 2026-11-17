package com.safarnama.travel.data

data class ProfileStats(
    val tripsCompleted: Int = 0,
    val spotsSaved: Int = 0,
    val contributions: Int = 0,
    val guideToursLed: Int = 0
)

data class Profile(
    val id: String,
    val username: String,
    val fullName: String,
    val avatarUrl: String,
    val bio: String,
    val activeRole: String = "traveler", // traveler, local_guide, admin
    val homeCity: String = "India",
    val isVerifiedGuide: Boolean = false,
    val guideCircuits: List<String> = emptyList(),
    val credibilityScore: Int = 100, // Kept for model compatibility
    val passportStampsCount: Int = 0, // Kept for model compatibility
    val languagesSpoken: List<String> = listOf("Hindi", "English"),
    val stats: ProfileStats = ProfileStats(),
    val isFollowing: Boolean = false
)

enum class PostFormat {
    PHOTO_POST,
    TWEET,
    REEL,
    CAROUSEL_NOTE,
    QUICK_TIP
}

data class Post(
    val id: String,
    val author: Profile,
    val spotName: String,
    val state: String,
    val region: String,
    val caption: String,
    val format: PostFormat = PostFormat.PHOTO_POST,
    val videoUrl: String? = null,
    val thumbnailUrl: String? = null,
    val carouselImages: List<String> = emptyList(),
    val destinationId: String? = null,
    val destinationName: String? = null,
    val mentionedUsernames: List<String> = emptyList(),
    val costInInr: Int = 0,
    val bestTimeToVisit: String = "Year-round",
    val safetyTips: String = "",
    val howToReach: String = "",
    val connectivitySignal: String = "4G Available",
    val latitude: Double = 20.5937,
    val longitude: Double = 78.9629,
    var likesCount: Int = 0,
    var savesCount: Int = 0,
    var commentsCount: Int = 0,
    var threadRepliesCount: Int = 0,
    var isLiked: Boolean = false,
    var isSaved: Boolean = false,
    val createdAt: String = "Just now"
)

data class Comment(
    val id: String,
    val postId: String,
    val author: Profile,
    val text: String,
    val createdAt: String = "Just now",
    val parentCommentId: String? = null,
    val likesCount: Int = 0
)

data class DirectMessage(
    val id: String,
    val senderId: String,
    val receiverId: String,
    val text: String,
    val timestamp: String = "Just now",
    val isFromMe: Boolean = false
)

data class FollowedAccountSetting(
    val profile: Profile,
    var notificationsEnabled: Boolean = true
)

data class DestinationHub(
    val id: String,
    val slug: String,
    val name: String,
    val state: String,
    val region: String,
    val tagline: String,
    val coverImage: String,
    val galleryImages: List<String> = emptyList(),
    val latitude: Double,
    val longitude: Double,
    val overview: String,
    val bestTimeToVisit: String,
    val dailyBudgetInr: Int = 2000,
    val topSpotsCount: Int = 10,
    val guideCount: Int = 5,
    val averageRating: Double = 4.8
)

data class PassportStamp(
    val id: String,
    val state: String,
    val circuit: String,
    val visitedDate: String,
    val isVerified: Boolean = true,
    val stampIcon: String = "🏛️"
)

data class StoryHighlight(
    val id: String,
    val title: String,
    val coverUrl: String,
    val isVerified: Boolean = false
)
