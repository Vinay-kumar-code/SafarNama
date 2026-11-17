package com.safarnama.travel.data

import com.safarnama.travel.api.SupabaseClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class TravelRepository private constructor() {

    private val _posts = MutableStateFlow<List<Post>>(SeedData.FEED_POSTS)
    val posts: StateFlow<List<Post>> = _posts.asStateFlow()

    private val _reels = MutableStateFlow<List<Post>>(SeedData.REELS_FEED)
    val reels: StateFlow<List<Post>> = _reels.asStateFlow()

    private val _destinations = MutableStateFlow<List<DestinationHub>>(SeedData.DESTINATION_HUBS)
    val destinations: StateFlow<List<DestinationHub>> = _destinations.asStateFlow()

    private val _guides = MutableStateFlow<List<Profile>>(
        listOf(SeedData.GUIDE_TENZIN, SeedData.GUIDE_KARAN, SeedData.GUIDE_WANDAPLIN)
    )
    val guides: StateFlow<List<Profile>> = _guides.asStateFlow()

    private val _currentUser = MutableStateFlow<Profile>(SeedData.CURRENT_USER)
    val currentUser: StateFlow<Profile> = _currentUser.asStateFlow()

    private val _followedAccounts = MutableStateFlow<List<FollowedAccountSetting>>(SeedData.INITIAL_FOLLOWED_ACCOUNTS)
    val followedAccounts: StateFlow<List<FollowedAccountSetting>> = _followedAccounts.asStateFlow()

    private val _comments = MutableStateFlow<Map<String, List<Comment>>>(SeedData.INITIAL_COMMENTS)
    val comments: StateFlow<Map<String, List<Comment>>> = _comments.asStateFlow()

    private val _directMessages = MutableStateFlow<Map<String, List<DirectMessage>>>(SeedData.INITIAL_DIRECT_MESSAGES)
    val directMessages: StateFlow<Map<String, List<DirectMessage>>> = _directMessages.asStateFlow()

    private val _passportStamps = MutableStateFlow<List<PassportStamp>>(SeedData.PASSPORT_STAMPS)
    val passportStamps: StateFlow<List<PassportStamp>> = _passportStamps.asStateFlow()

    suspend fun refreshData() {
        val remotePosts = SupabaseClient.getPosts()
        if (remotePosts.isNotEmpty()) {
            _posts.value = remotePosts
        }
        val remoteDestinations = SupabaseClient.getDestinations()
        if (remoteDestinations.isNotEmpty()) {
            _destinations.value = remoteDestinations
        }
    }

    // --- Content Creation (+ Button) ---
    fun addPost(post: Post) {
        _posts.value = listOf(post) + _posts.value
    }

    fun addTweet(
        content: String,
        destinationName: String? = null,
        destinationId: String? = null,
        mentionedUsernames: List<String> = emptyList()
    ): Post {
        val newTweet = Post(
            id = "tweet-${UUID.randomUUID().toString().take(8)}",
            author = _currentUser.value,
            spotName = destinationName ?: "India Travel Trail",
            state = "India",
            region = destinationName ?: "Traveler Note",
            caption = content,
            format = PostFormat.TWEET,
            destinationId = destinationId,
            destinationName = destinationName,
            mentionedUsernames = mentionedUsernames,
            likesCount = 0,
            savesCount = 0,
            commentsCount = 0,
            threadRepliesCount = 0,
            createdAt = "Just now"
        )
        addPost(newTweet)
        return newTweet
    }

    fun addReel(
        videoUrl: String,
        spotName: String,
        caption: String,
        destinationName: String? = null,
        destinationId: String? = null,
        mentionedUsernames: List<String> = emptyList()
    ): Post {
        val newReel = Post(
            id = "reel-${UUID.randomUUID().toString().take(8)}",
            author = _currentUser.value,
            spotName = spotName,
            state = "India",
            region = destinationName ?: spotName,
            caption = caption,
            format = PostFormat.REEL,
            videoUrl = videoUrl,
            destinationId = destinationId,
            destinationName = destinationName,
            mentionedUsernames = mentionedUsernames,
            likesCount = 0,
            savesCount = 0,
            commentsCount = 0,
            createdAt = "Just now"
        )
        _reels.value = listOf(newReel) + _reels.value
        return newReel
    }

    // --- Destination Management (Admin) ---
    fun addDestination(destination: DestinationHub) {
        _destinations.value = _destinations.value + destination
    }

    // --- Like & Save Toggles ---
    fun toggleLike(postId: String): Boolean {
        var newLikedState = false
        _posts.value = _posts.value.map { post ->
            if (post.id == postId) {
                newLikedState = !post.isLiked
                post.copy(
                    isLiked = newLikedState,
                    likesCount = if (newLikedState) post.likesCount + 1 else (post.likesCount - 1).coerceAtLeast(0)
                )
            } else post
        }

        _reels.value = _reels.value.map { reel ->
            if (reel.id == postId) {
                newLikedState = !reel.isLiked
                reel.copy(
                    isLiked = newLikedState,
                    likesCount = if (newLikedState) reel.likesCount + 1 else (reel.likesCount - 1).coerceAtLeast(0)
                )
            } else reel
        }
        return newLikedState
    }

    fun toggleSave(postId: String): Boolean {
        var newSaveState = false
        _posts.value = _posts.value.map { post ->
            if (post.id == postId) {
                newSaveState = !post.isSaved
                post.copy(
                    isSaved = newSaveState,
                    savesCount = if (newSaveState) post.savesCount + 1 else (post.savesCount - 1).coerceAtLeast(0)
                )
            } else post
        }

        _reels.value = _reels.value.map { reel ->
            if (reel.id == postId) {
                newSaveState = !reel.isSaved
                reel.copy(
                    isSaved = newSaveState,
                    savesCount = if (newSaveState) reel.savesCount + 1 else (reel.savesCount - 1).coerceAtLeast(0)
                )
            } else reel
        }
        return newSaveState
    }

    // --- Following & Notifications ---
    fun toggleFollow(targetProfile: Profile): Boolean {
        val currentList = _followedAccounts.value.toMutableList()
        val existingIndex = currentList.indexOfFirst { it.profile.id == targetProfile.id }
        val isNowFollowing: Boolean

        if (existingIndex >= 0) {
            currentList.removeAt(existingIndex)
            isNowFollowing = false
        } else {
            currentList.add(FollowedAccountSetting(targetProfile.copy(isFollowing = true), notificationsEnabled = true))
            isNowFollowing = true
        }

        _followedAccounts.value = currentList
        return isNowFollowing
    }

    fun isFollowing(userId: String): Boolean {
        return _followedAccounts.value.any { it.profile.id == userId }
    }

    fun toggleNotification(userId: String): Boolean {
        var newState = false
        val updated = _followedAccounts.value.map { setting ->
            if (setting.profile.id == userId) {
                newState = !setting.notificationsEnabled
                setting.copy(notificationsEnabled = newState)
            } else setting
        }
        _followedAccounts.value = updated
        return newState
    }

    // --- Comments & Threads ---
    fun getComments(postId: String): List<Comment> {
        return _comments.value[postId] ?: emptyList()
    }

    fun addComment(postId: String, text: String, parentCommentId: String? = null): Comment {
        val newComment = Comment(
            id = "c-${UUID.randomUUID().toString().take(8)}",
            postId = postId,
            author = _currentUser.value,
            text = text,
            createdAt = "Just now",
            parentCommentId = parentCommentId
        )
        val currentMap = _comments.value.toMutableMap()
        val list = (currentMap[postId] ?: emptyList()) + newComment
        currentMap[postId] = list
        _comments.value = currentMap

        // Update comment counts on post/reel
        _posts.value = _posts.value.map { p ->
            if (p.id == postId) {
                if (parentCommentId != null) {
                    p.copy(commentsCount = p.commentsCount + 1, threadRepliesCount = p.threadRepliesCount + 1)
                } else {
                    p.copy(commentsCount = p.commentsCount + 1)
                }
            } else p
        }

        _reels.value = _reels.value.map { r ->
            if (r.id == postId) {
                r.copy(commentsCount = r.commentsCount + 1)
            } else r
        }

        return newComment
    }

    // --- 1-on-1 Direct Messaging ---
    fun getDirectMessages(partnerId: String): List<DirectMessage> {
        return _directMessages.value[partnerId] ?: emptyList()
    }

    fun sendDirectMessage(receiverId: String, text: String): DirectMessage {
        val newMsg = DirectMessage(
            id = "msg-${UUID.randomUUID().toString().take(8)}",
            senderId = _currentUser.value.id,
            receiverId = receiverId,
            text = text,
            timestamp = "Just now",
            isFromMe = true
        )
        val currentMap = _directMessages.value.toMutableMap()
        val list = (currentMap[receiverId] ?: emptyList()) + newMsg
        currentMap[receiverId] = list
        _directMessages.value = currentMap
        return newMsg
    }

    // --- Mentions & Destinations Queries ---
    fun getMentionsForUser(username: String): List<Post> {
        val cleanName = username.trimStart('@').lowercase()
        val matchedPosts = _posts.value.filter { p ->
            p.mentionedUsernames.any { it.trimStart('@').lowercase() == cleanName }
        }
        val matchedReels = _reels.value.filter { r ->
            r.mentionedUsernames.any { it.trimStart('@').lowercase() == cleanName }
        }
        return matchedPosts + matchedReels
    }

    fun getPostsForDestination(destinationNameOrId: String): List<Post> {
        val query = destinationNameOrId.lowercase()
        return _posts.value.filter {
            (it.destinationName?.lowercase()?.contains(query) == true) ||
            (it.destinationId?.lowercase() == query) ||
            (it.spotName.lowercase().contains(query)) ||
            (it.state.lowercase().contains(query))
        }
    }

    fun switchUserPersona() {
        val current = _currentUser.value
        if (current.id == SeedData.CURRENT_USER.id) {
            _currentUser.value = SeedData.GUIDE_TENZIN
        } else {
            _currentUser.value = SeedData.CURRENT_USER
        }
    }

    companion object {
        val instance by lazy { TravelRepository() }
    }
}
