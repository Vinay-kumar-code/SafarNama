package com.safarnama.travel.data

import com.safarnama.travel.api.SupabaseClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID

class TravelRepository internal constructor() {
    private var store: RepositoryStore? = null
    private val _journey = MutableStateFlow<List<JourneyStop>>(emptyList())
    val journey: StateFlow<List<JourneyStop>> = _journey.asStateFlow()
    private val _journeyTitle = MutableStateFlow("My next Indian adventure")
    val journeyTitle: StateFlow<String> = _journeyTitle.asStateFlow()

    fun attachStore(newStore: RepositoryStore) {
        store = newStore
        val snapshot = newStore.read() ?: return
        runCatching {
            _posts.value = snapshot.posts
            _reels.value = snapshot.reels
            _destinations.value = snapshot.destinations
            _followedAccounts.value = snapshot.followedAccounts
            _comments.value = snapshot.comments
            _directMessages.value = snapshot.directMessages
            _currentUser.value = snapshot.currentUser
            _journey.value = snapshot.journey
            _journeyTitle.value = snapshot.journeyTitle
        }
    }

    private fun persist() {
        store?.write(RepositorySnapshot(posts = _posts.value, reels = _reels.value,
            destinations = _destinations.value, followedAccounts = _followedAccounts.value,
            comments = _comments.value, directMessages = _directMessages.value,
            currentUser = _currentUser.value, journey = _journey.value, journeyTitle = _journeyTitle.value))
    }

    fun allContent(): List<Post> = (_posts.value + _reels.value).distinctBy { it.id }

    fun addJourneyStop(stop: JourneyStop) {
        if (_journey.value.any { it.id == stop.id }) return
        _journey.value = _journey.value + stop.copy(day = (_journey.value.size / 2) + 1)
        persist()
    }

    fun updateJourneyStop(id: String, day: Int, notes: String) {
        _journey.value = _journey.value.map { if (it.id == id) it.copy(day = day.coerceIn(1, 99), notes = notes.take(1000)) else it }
        persist()
    }

    fun removeJourneyStop(id: String) { _journey.value = _journey.value.filterNot { it.id == id }; persist() }
    fun renameJourney(title: String) { if (title.isNotBlank()) { _journeyTitle.value = title.trim().take(100); persist() } }
    fun updateProfile(name: String, bio: String, city: String) {
        if (name.isBlank()) return
        val profile = _currentUser.value.copy(fullName = name.trim().take(80), bio = bio.trim().take(300), homeCity = city.trim().take(100))
        _currentUser.value = profile
        _posts.value = _posts.value.map { if (it.author.id == profile.id) it.copy(author = profile) else it }
        _reels.value = _reels.value.map { if (it.author.id == profile.id) it.copy(author = profile) else it }
        persist()
    }

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
            val existing = allContent().associateBy { it.id }
            val merged = remotePosts.map { remote -> existing[remote.id]?.let {
                remote.copy(isLiked = it.isLiked, isSaved = it.isSaved, likesCount = it.likesCount,
                    savesCount = it.savesCount, commentsCount = it.commentsCount)
            } ?: remote }
            _posts.value = (_posts.value.filter { local -> remotePosts.none { it.id == local.id } } + merged).distinctBy { it.id }
            _reels.value = (_posts.value.filter { it.format == PostFormat.REEL } + _reels.value).distinctBy { it.id }
        }
        val remoteDestinations = SupabaseClient.getDestinations()
        if (remoteDestinations.isNotEmpty()) {
            _destinations.value = (_destinations.value.filter { local -> remoteDestinations.none { it.id == local.id } } + remoteDestinations)
        }
        persist()
    }

    // --- Content Creation (+ Button) ---
    fun addPost(post: Post) {
        require(post.caption.isNotBlank()) { "Write a story before sharing" }
        _posts.value = listOf(post) + _posts.value.filterNot { it.id == post.id }
        if (post.format == PostFormat.REEL) _reels.value = listOf(post) + _reels.value.filterNot { it.id == post.id }
        persist()
    }

    fun addTweet(
        content: String,
        destinationName: String? = null,
        destinationId: String? = null,
        mentionedUsernames: List<String> = emptyList()
    ): Post {
        require(content.isNotBlank() && content.length <= 500) { "Travel notes need 1–500 characters" }
        val destination = _destinations.value.find { it.id == destinationId }
        val newTweet = Post(
            id = "tweet-${UUID.randomUUID().toString().take(8)}",
            author = _currentUser.value,
            spotName = destinationName ?: "India Travel Trail",
            state = destination?.state ?: "India",
            latitude = destination?.latitude ?: 20.5937,
            longitude = destination?.longitude ?: 78.9629,
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
        require(videoUrl.isNotBlank()) { "Choose a video" }
        val destination = _destinations.value.find { it.id == destinationId }
        val newReel = Post(
            id = "reel-${UUID.randomUUID().toString().take(8)}",
            author = _currentUser.value,
            spotName = spotName,
            state = destination?.state ?: "India",
            latitude = destination?.latitude ?: 20.5937,
            longitude = destination?.longitude ?: 78.9629,
            thumbnailUrl = destination?.coverImage,
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
        addPost(newReel)
        return newReel
    }

    // --- Destination Management (Admin) ---
    fun addDestination(destination: DestinationHub) {
        _destinations.value = _destinations.value.filterNot { it.id == destination.id } + destination
        persist()
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
        persist()
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
        persist()
        return newSaveState
    }

    // --- Following & Notifications ---
    fun toggleFollow(targetProfile: Profile): Boolean {
        if (targetProfile.id == _currentUser.value.id) return false
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
        persist()
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
        persist()
        return newState
    }

    // --- Comments & Threads ---
    fun getComments(postId: String): List<Comment> {
        return _comments.value[postId] ?: emptyList()
    }

    fun addComment(postId: String, text: String, parentCommentId: String? = null): Comment {
        require(text.isNotBlank() && text.length <= 1000) { "Comments need 1–1000 characters" }
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

        persist()
        return newComment
    }

    // --- 1-on-1 Direct Messaging ---
    fun getDirectMessages(partnerId: String): List<DirectMessage> {
        return _directMessages.value[partnerId] ?: emptyList()
    }

    fun sendDirectMessage(receiverId: String, text: String): DirectMessage {
        require(text.isNotBlank() && text.length <= 2000) { "Messages need 1–2000 characters" }
        require(receiverId != _currentUser.value.id) { "Choose another traveler" }
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
        persist()
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
        return (matchedPosts + matchedReels).distinctBy { it.id }
    }

    fun getPostsForDestination(destinationNameOrId: String): List<Post> {
        val query = destinationNameOrId.lowercase()
        return allContent().filter {
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
        persist()
    }

    companion object {
        val instance by lazy { TravelRepository() }
    }
}
