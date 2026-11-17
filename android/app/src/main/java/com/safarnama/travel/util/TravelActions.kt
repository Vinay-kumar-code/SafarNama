package com.safarnama.travel.util

import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import androidx.fragment.app.FragmentActivity
import com.safarnama.travel.data.Post
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.ui.journeys.DestinationSheet
import com.safarnama.travel.ui.journeys.TravelerSheet

object TravelActions {
    fun activity(context: Context): FragmentActivity? = when (context) {
        is FragmentActivity -> context
        is ContextWrapper -> activity(context.baseContext)
        else -> null
    }
    fun share(context: Context, post: Post) {
        val text = "${post.spotName}, ${post.state}\n\n${post.caption}\n\nhttps://www.google.com/maps/search/?api=1&query=${post.latitude},${post.longitude}\n\nShared from SafarNama"
        context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, text) }, "Share this journey"))
    }
    fun destination(context: Context, post: Post) {
        val place = TravelRepository.instance.destinations.value.find { it.id == post.destinationId || it.name == post.destinationName } ?: return
        activity(context)?.let { DestinationSheet.newInstance(place.id).show(it.supportFragmentManager, "place_guide") }
    }
    fun traveler(context: Context, post: Post) { activity(context)?.let { TravelerSheet.newInstance(post.author.id).show(it.supportFragmentManager, "traveler_profile") } }
    fun timeLabel(value: String): String = runCatching {
        val minutes = java.time.Duration.between(java.time.Instant.parse(value), java.time.Instant.now()).toMinutes()
        when { minutes < 1 -> "Just now"; minutes < 60 -> "${minutes}m ago"; minutes < 1440 -> "${minutes / 60}h ago"; else -> "${minutes / 1440}d ago" }
    }.getOrDefault(value)
}
