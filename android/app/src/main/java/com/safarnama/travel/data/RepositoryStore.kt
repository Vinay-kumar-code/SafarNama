package com.safarnama.travel.data

import android.content.Context
import com.google.gson.Gson

/** Versioned device-local state. Cloud publication is deliberately a separate operation. */
data class RepositorySnapshot(
    val version: Int = 1,
    val posts: List<Post> = emptyList(),
    val reels: List<Post> = emptyList(),
    val destinations: List<DestinationHub> = emptyList(),
    val followedAccounts: List<FollowedAccountSetting> = emptyList(),
    val comments: Map<String, List<Comment>> = emptyMap(),
    val directMessages: Map<String, List<DirectMessage>> = emptyMap(),
    val currentUser: Profile = SeedData.CURRENT_USER,
    val journey: List<JourneyStop> = emptyList(),
    val journeyTitle: String = "My next Indian adventure"
)

data class JourneyStop(
    val id: String,
    val name: String,
    val state: String,
    val latitude: Double,
    val longitude: Double,
    val imageUrl: String,
    val budgetInr: Int = 0,
    val day: Int = 1,
    val notes: String = ""
)

interface RepositoryStore {
    fun read(): RepositorySnapshot?
    fun write(snapshot: RepositorySnapshot)
}

class PreferencesRepositoryStore(context: Context) : RepositoryStore {
    private val preferences = context.getSharedPreferences("safarnama_local_v1", Context.MODE_PRIVATE)
    private val gson = Gson()
    override fun read(): RepositorySnapshot? = runCatching {
        preferences.getString("snapshot", null)?.let { gson.fromJson(it, RepositorySnapshot::class.java) }
            ?.takeIf { it.version == 1 }
    }.getOrNull()
    override fun write(snapshot: RepositorySnapshot) {
        preferences.edit().putString("snapshot", gson.toJson(snapshot)).apply()
    }
}
