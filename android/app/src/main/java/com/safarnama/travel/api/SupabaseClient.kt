package com.safarnama.travel.api

import android.util.Log
import com.safarnama.travel.data.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit
import com.safarnama.travel.BuildConfig

object SupabaseClient {
    private const val TAG = "SupabaseClient"

    val SUPABASE_URL: String = BuildConfig.SUPABASE_URL
    val SUPABASE_ANON_KEY: String = BuildConfig.SUPABASE_ANON_KEY

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    private fun buildRequest(endpoint: String): Request {
        val url = if (endpoint.startsWith("http")) endpoint else "$SUPABASE_URL/rest/v1/$endpoint"
        return Request.Builder()
            .url(url)
            .addHeader("apikey", SUPABASE_ANON_KEY)
            .addHeader("Authorization", "Bearer $SUPABASE_ANON_KEY")
            .addHeader("Content-Type", "application/json")
            .addHeader("Prefer", "return=representation")
            .build()
    }

    suspend fun getPosts(): List<Post> = withContext(Dispatchers.IO) {
        try {
            val request = buildRequest("posts?select=*&order=created_at.desc")
            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrEmpty()) {
                        val jsonArray = JSONArray(body)
                        val posts = mutableListOf<Post>()
                        for (i in 0 until jsonArray.length()) {
                            val item = jsonArray.getJSONObject(i)
                            posts.add(parsePostJson(item))
                        }
                        if (posts.isNotEmpty()) return@withContext posts
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Supabase getPosts failed or offline, using rich seed posts", e)
        }
        return@withContext SeedData.FEED_POSTS
    }

    suspend fun getDestinations(): List<DestinationHub> = withContext(Dispatchers.IO) {
        try {
            val request = buildRequest("destinations?select=*")
            httpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (!body.isNullOrEmpty()) {
                        val jsonArray = JSONArray(body)
                        val hubs = mutableListOf<DestinationHub>()
                        for (i in 0 until jsonArray.length()) {
                            val item = jsonArray.getJSONObject(i)
                            hubs.add(parseDestinationJson(item))
                        }
                        if (hubs.isNotEmpty()) return@withContext hubs
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Supabase getDestinations failed or offline, using seed hubs", e)
        }
        return@withContext SeedData.DESTINATION_HUBS
    }

    private fun parsePostJson(json: JSONObject): Post {
        val id = json.optString("id", "post-${System.currentTimeMillis()}")
        val spotName = json.optString("spot_name", json.optString("spotName", "Indian Destination"))
        val state = json.optString("state", "India")
        val region = json.optString("region", "")
        val caption = json.optString("caption", "")
        val formatStr = json.optString("format", "carousel_note")
        val format = when (formatStr.lowercase()) {
            "reel" -> PostFormat.REEL
            "quick_tip" -> PostFormat.QUICK_TIP
            else -> PostFormat.CAROUSEL_NOTE
        }
        val videoUrl = json.optString("video_url", json.optString("videoUrl", null))
        val resolvedVideo = if (!videoUrl.isNullOrEmpty()) R2MediaResolver.resolveVideoUrl(videoUrl) else null

        val thumbUrl = json.optString("thumbnail_url", json.optString("thumbnailUrl", null))
        val resolvedThumb = if (!thumbUrl.isNullOrEmpty()) R2MediaResolver.resolveImageUrl(thumbUrl) else null

        val carouselList = mutableListOf<String>()
        val carouselArr = json.optJSONArray("carousel_images") ?: json.optJSONArray("carouselImages")
        if (carouselArr != null) {
            for (j in 0 until carouselArr.length()) {
                val rawImg = carouselArr.getString(j)
                carouselList.add(R2MediaResolver.resolveImageUrl(rawImg))
            }
        }
        if (carouselList.isEmpty() && resolvedThumb != null) {
            carouselList.add(resolvedThumb)
        }

        return Post(
            id = id,
            author = SeedData.GUIDE_TENZIN,
            spotName = spotName,
            state = state,
            region = region,
            caption = caption,
            format = format,
            videoUrl = resolvedVideo,
            thumbnailUrl = resolvedThumb,
            carouselImages = carouselList,
            costInInr = json.optInt("cost_in_inr", json.optInt("costInInr", 1500)),
            bestTimeToVisit = json.optString("best_time_to_visit", "Oct - Mar"),
            safetyTips = json.optString("safety_tips", ""),
            howToReach = json.optString("how_to_reach", ""),
            connectivitySignal = json.optString("connectivity_signal", "4G"),
            latitude = json.optDouble("latitude", 20.5937),
            longitude = json.optDouble("longitude", 78.9629),
            likesCount = json.optInt("likes_count", json.optInt("likesCount", 120)),
            savesCount = json.optInt("saves_count", json.optInt("savesCount", 45)),
            commentsCount = json.optInt("comments_count", json.optInt("commentsCount", 12)),
            isLiked = json.optBoolean("is_liked", false),
            isSaved = json.optBoolean("is_saved", false),
            createdAt = json.optString("created_at", "RECENT")
        )
    }

    private fun parseDestinationJson(json: JSONObject): DestinationHub {
        val id = json.optString("id", "dest-${System.currentTimeMillis()}")
        val slug = json.optString("slug", id)
        val name = json.optString("name", "Destination")
        val state = json.optString("state", "India")
        val region = json.optString("region", "")
        val tagline = json.optString("tagline", "")
        val coverRaw = json.optString("cover_image", json.optString("coverImage", ""))
        val resolvedCover = R2MediaResolver.resolveImageUrl(coverRaw)

        return DestinationHub(
            id = id,
            slug = slug,
            name = name,
            state = state,
            region = region,
            tagline = tagline,
            coverImage = resolvedCover,
            latitude = json.optDouble("latitude", 20.5937),
            longitude = json.optDouble("longitude", 78.9629),
            overview = json.optString("overview", ""),
            bestTimeToVisit = json.optString("best_time_to_visit", "Year-round"),
            dailyBudgetInr = json.optInt("estimated_daily_budget_inr", 2000),
            topSpotsCount = json.optInt("top_spots_count", 10),
            guideCount = json.optInt("guide_count", 5),
            averageRating = json.optDouble("average_rating", 4.8)
        )
    }
}
