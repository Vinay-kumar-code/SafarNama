package com.safarnama.travel

import com.safarnama.travel.api.R2MediaResolver
import com.safarnama.travel.data.DestinationHub
import com.safarnama.travel.data.PostFormat
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
        assertTrue("Should contain Spiti Valley post", posts.any { it.spotName.contains("Kibber") || it.spotName.contains("Key") || it.spotName.contains("Kunzum") })
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
        val expectedBase = R2MediaResolver.R2_PUBLIC_BASE_URL.trimEnd('/')
        assertEquals("$expectedBase/videos/spiti_kunzum.mp4", resolved)

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

    @Test
    fun testAddTweetWithDestinationAndMentions() {
        val repo = TravelRepository.instance
        val tweet = repo.addTweet(
            content = "Heading out to Hampi boulders with @karan_banaras!",
            destinationName = "Hampi Deccan Ruins",
            destinationId = "dest-hampi",
            mentionedUsernames = listOf("karan_banaras")
        )
        assertNotNull(tweet.id)
        assertEquals(PostFormat.TWEET, tweet.format)
        assertEquals("Hampi Deccan Ruins", tweet.destinationName)
        assertTrue(tweet.mentionedUsernames.contains("karan_banaras"))

        // Add threaded reply
        val reply = repo.addComment(tweet.id, "Rent a cycle near the river bazaar!", parentCommentId = tweet.id)
        assertNotNull(reply.id)
        assertEquals(tweet.id, reply.parentCommentId)

        val replies = repo.getComments(tweet.id)
        assertTrue(replies.any { it.text.contains("Rent a cycle") })
    }

    @Test
    fun testFollowAndNotificationSettings() {
        val repo = TravelRepository.instance
        val target = SeedData.GUIDE_TENZIN

        // Follow state
        val wasFollowing = repo.isFollowing(target.id)
        val toggled = repo.toggleFollow(target)
        assertEquals(!wasFollowing, toggled)

        // Toggle back to following
        if (!toggled) {
            repo.toggleFollow(target)
        }
        assertTrue(repo.isFollowing(target.id))

        // Notification toggle
        val alertState = repo.toggleNotification(target.id)
        val setting = repo.followedAccounts.value.find { it.profile.id == target.id }
        assertNotNull(setting)
        assertEquals(alertState, setting?.notificationsEnabled)
    }

    @Test
    fun testDirectMessaging() {
        val repo = TravelRepository.instance
        val receiver = SeedData.GUIDE_KARAN.id
        val messageText = "Are boat tours running tomorrow morning?"

        val sent = repo.sendDirectMessage(receiver, messageText)
        assertEquals(messageText, sent.text)
        assertTrue(sent.isFromMe)

        val messages = repo.getDirectMessages(receiver)
        assertTrue(messages.any { it.text == messageText })
    }

    @Test
    fun testAdminAddDestination() {
        val repo = TravelRepository.instance
        val newHub = DestinationHub(
            id = "dest-gokarna",
            slug = "gokarna",
            name = "Gokarna Cliff Beaches",
            state = "Karnataka",
            region = "Arabian Coast",
            tagline = "Om Beach & Arabian Sea Trails",
            coverImage = "https://images.unsplash.com/sample-gokarna.jpg",
            latitude = 14.5479,
            longitude = 74.3188,
            overview = "Temple town blessed with pristine coastal hiking trails between secluded sandy bays.",
            bestTimeToVisit = "Oct to Mar"
        )
        repo.addDestination(newHub)

        val destinations = repo.destinations.value
        assertTrue(destinations.any { it.name.contains("Gokarna") })

        val mappedPosts = repo.getPostsForDestination("Gokarna")
        assertNotNull(mappedPosts)
    }

    @Test
    fun testGroupTravelMentionsSection() {
        val repo = TravelRepository.instance
        // Aarav Sharma is mentioned in seed tweets/posts by Tenzin and Wandaplin
        val mentions = repo.getMentionsForUser("aarav_journeys")
        assertTrue("Mentions should contain group travel tags", mentions.isNotEmpty())
        assertTrue(mentions.all { post ->
            post.mentionedUsernames.any { it.contains("aarav_journeys") }
        })
    }
}
