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
    val credibilityScore: Int = 100,
    val passportStampsCount: Int = 0,
    val languagesSpoken: List<String> = listOf("Hindi", "English"),
    val stats: ProfileStats = ProfileStats()
)

enum class PostFormat {
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
    val format: PostFormat = PostFormat.CAROUSEL_NOTE,
    val videoUrl: String? = null,
    val thumbnailUrl: String? = null,
    val carouselImages: List<String> = emptyList(),
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
    var isLiked: Boolean = false,
    var isSaved: Boolean = false,
    val createdAt: String = "Just now"
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
