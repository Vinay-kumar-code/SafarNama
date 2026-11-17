package com.safarnama.travel.data

import com.safarnama.travel.api.SupabaseClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

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
