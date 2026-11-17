package com.safarnama.travel

import com.safarnama.travel.api.R2MediaResolver
import com.safarnama.travel.data.SeedData
import com.safarnama.travel.data.TravelRepository
import org.junit.Assert.*
import org.junit.Test

class TravelRepositoryTest {

    @Test
    fun testSeedPostsLoaded() {
        val repo = TravelRepository.instance
        val posts = repo.posts.value
        assertTrue("Seed posts should not be empty", posts.isNotEmpty())
        assertTrue("Should contain Spiti Valley post", posts.any { it.spotName.contains("Kibber") || it.spotName.contains("Key") })
    }

    @Test
    fun testToggleLike() {
        val repo = TravelRepository.instance
        val post = repo.posts.value.first()
        val originalLiked = post.isLiked
        val originalCount = post.likesCount

        val newLiked = repo.toggleLike(post.id)
        assertEquals(!originalLiked, newLiked)

        val updatedPost = repo.posts.value.first { it.id == post.id }
        if (newLiked) {
            assertEquals(originalCount + 1, updatedPost.likesCount)
        } else {
            assertEquals((originalCount - 1).coerceAtLeast(0), updatedPost.likesCount)
        }
    }

    @Test
    fun testToggleSave() {
        val repo = TravelRepository.instance
        val post = repo.posts.value.first()
        val originalSaved = post.isSaved

        val newSaved = repo.toggleSave(post.id)
        assertEquals(!originalSaved, newSaved)

        val updatedPost = repo.posts.value.first { it.id == post.id }
        assertEquals(newSaved, updatedPost.isSaved)
    }

    @Test
    fun testR2MediaResolver() {
        val relativeKey = "videos/spiti_kunzum.mp4"
        val resolved = R2MediaResolver.resolveVideoUrl(relativeKey)
        assertEquals("https://media.safarnama.travel/videos/spiti_kunzum.mp4", resolved)

        val alreadyAbsolute = "https://images.unsplash.com/sample.jpg"
        val resolvedAbsolute = R2MediaResolver.resolveImageUrl(alreadyAbsolute)
        assertEquals(alreadyAbsolute, resolvedAbsolute)
    }

    @Test
    fun testDestinationHubsLoaded() {
        val hubs = SeedData.DESTINATION_HUBS
        assertTrue("Should have 8 Indian destination hubs", hubs.size >= 8)
        assertTrue("Should include Spiti Valley", hubs.any { it.name.contains("Spiti") })
        assertTrue("Should include Varanasi", hubs.any { it.name.contains("Varanasi") })
        assertTrue("Should include Meghalaya", hubs.any { it.name.contains("Cherrapunji") })
    }
}
