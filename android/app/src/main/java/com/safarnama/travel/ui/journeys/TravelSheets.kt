package com.safarnama.travel.ui.journeys

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.core.view.setPadding
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.safarnama.travel.R
import com.safarnama.travel.data.*
import com.safarnama.travel.ui.home.*
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

abstract class TravelSheet : BottomSheetDialogFragment() {
    protected lateinit var column: LinearLayout
    protected val repository = TravelRepository.instance
    protected fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        column = LinearLayout(requireContext()).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20)); setBackgroundColor(Color.WHITE) }
        return ScrollView(requireContext()).apply { isFillViewport = true; addView(column) }
    }
    override fun onStart() { super.onStart(); (dialog as? BottomSheetDialog)?.behavior?.state = BottomSheetBehavior.STATE_EXPANDED }
    protected fun text(value: String, size: Float = 14f, muted: Boolean = false) = TextView(requireContext()).apply {
        text = value; textSize = size; setTextColor(Color.parseColor(if (muted) "#777E70" else "#283025")); setPadding(0, dp(8), 0, dp(8)); column.addView(this)
    }
    protected fun button(label: String, action: () -> Unit) = MaterialButton(requireContext()).apply {
        text = label; isAllCaps = false; cornerRadius = dp(10); minHeight = dp(48)
        setOnClickListener { action() }; column.addView(this, LinearLayout.LayoutParams(-1, -2))
    }
    protected fun image(url: String) = ImageView(requireContext()).apply {
        scaleType = ImageView.ScaleType.CENTER_CROP; contentDescription = "Destination photograph"
        column.addView(this, LinearLayout.LayoutParams(-1, dp(200))); load(url) { placeholder(R.drawable.bg_card_rounded); error(R.drawable.bg_card_rounded) }
    }
    protected fun money(value: Int) = NumberFormat.getCurrencyInstance(Locale("en", "IN")).apply { maximumFractionDigits = 0 }.format(value)
    protected fun directions(lat: Double, lng: Double) {
        runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=$lat,$lng"))) }
            .onFailure { Toast.makeText(context, "No maps app or browser is available", Toast.LENGTH_SHORT).show() }
    }
    protected fun feed(posts: List<Post>): FeedAdapter {
        val adapter = FeedAdapter(posts, { repository.toggleLike(it.id) }, { repository.toggleSave(it.id) },
            { CommentsBottomSheetDialogFragment.newInstance(it.id, it.spotName).show(parentFragmentManager, "place_comments") },
            { ThreadBottomSheetDialogFragment.newInstance(it.id).show(parentFragmentManager, "place_thread") })
        column.addView(RecyclerView(requireContext()).apply { layoutManager = LinearLayoutManager(context); this.adapter = adapter; isNestedScrollingEnabled = false }, LinearLayout.LayoutParams(-1, -2))
        return adapter
    }
}

class DestinationSheet : TravelSheet() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val destination = repository.destinations.value.find { it.id == arguments?.getString("id") }
        if (destination == null) { text("This destination is no longer available"); button("Close") { dismiss() }; return }
        button("Close guide") { dismiss() }
        image(destination.coverImage)
        text("${destination.state} · ${destination.region}", 12f, true)
        text(destination.name, 29f); text(destination.tagline, 15f, true)
        text(destination.overview)
        text("PLAN YOUR VISIT", 12f, true)
        text("Daily budget · about ${money(destination.dailyBudgetInr)}")
        text("When to go · ${destination.bestTimeToVisit}")
        button("Open in Maps") { directions(destination.latitude, destination.longitude) }
        val add = button("Add to my journey") {
            repository.addJourneyStop(JourneyStop(destination.id, destination.name, destination.state, destination.latitude,
                destination.longitude, destination.coverImage, destination.dailyBudgetInr))
        }
        viewLifecycleOwner.lifecycleScope.launch { repository.journey.collect { stops ->
            val added = stops.any { it.id == destination.id }; add.text = if (added) "Added to your journey" else "Add to my journey"; add.isEnabled = !added
        } }
        button("See my journey") { JourneySheet().show(parentFragmentManager, "journey") }
        text("Travel stories", 22f)
        val empty = text("No stories here yet. Create one from Home.", 13f, true)
        val adapter = feed(repository.getPostsForDestination(destination.id))
        viewLifecycleOwner.lifecycleScope.launch { combine(repository.posts, repository.reels) { _, _ -> repository.getPostsForDestination(destination.id) }.collect { posts ->
            empty.visibility = if (posts.isEmpty()) View.VISIBLE else View.GONE; adapter.updatePosts(posts)
        } }
        text("Community preview. Check local conditions and current costs before travelling.", 11f, true)
    }
    companion object { fun newInstance(id: String) = DestinationSheet().apply { arguments = Bundle().apply { putString("id", id) } } }
}

class JourneySheet : TravelSheet() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        viewLifecycleOwner.lifecycleScope.launch { combine(repository.journey, repository.journeyTitle) { stops, title -> stops to title }.collect { (stops, title) -> render(stops, title) } }
    }
    private fun render(stops: List<JourneyStop>, title: String) {
        column.removeAllViews()
        button("Close journey") { dismiss() }
        text("A LITTLE PLANNING. A LOT OF POSSIBILITY.", 11f, true)
        text(title, 27f)
        text("${stops.size} places · ${money(stops.sumOf { it.budgetInr })} estimated place budgets", 13f, true)
        button("Rename journey") {
            val input = EditText(requireContext()).apply { setText(title); maxLines = 2; filters = arrayOf(android.text.InputFilter.LengthFilter(100)) }
            MaterialAlertDialogBuilder(requireContext()).setTitle("Give your journey a name").setView(input)
                .setPositiveButton("Save") { _, _ -> repository.renameJourney(input.text.toString()) }.setNegativeButton("Cancel", null).show()
        }
        if (stops.isEmpty()) text("Your next chapter starts with a place. Open a destination in Explore and tap Add to my journey.", 16f, true)
        stops.sortedBy { it.day }.forEach { stop ->
            text("DAY ${stop.day}", 12f, true); image(stop.imageUrl); text(stop.name, 22f)
            text("${stop.state} · ${money(stop.budgetInr)} estimated", 12f, true)
            if (stop.notes.isNotBlank()) text(stop.notes)
            button("Directions") { directions(stop.latitude, stop.longitude) }
            button("Edit day & notes") { editStop(stop) }
            button("Remove from journey") { repository.removeJourneyStop(stop.id) }
        }
        if (stops.isNotEmpty()) button("Share itinerary") {
            val itinerary = buildString {
                appendLine(title); appendLine("Created with SafarNama")
                stops.sortedBy { it.day }.forEach { appendLine("\nDay ${it.day}: ${it.name}, ${it.state}"); if (it.notes.isNotBlank()) appendLine(it.notes); appendLine("https://www.google.com/maps/search/?api=1&query=${it.latitude},${it.longitude}") }
                appendLine("\nEstimated place budgets: ${money(stops.sumOf { it.budgetInr })}. Transport and stays may be extra.")
            }
            startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply { type = "text/plain"; putExtra(Intent.EXTRA_TEXT, itinerary) }, "Share your journey"))
        }
        text("Saved on this device. Budgets are estimates, not booking prices.", 11f, true)
    }
    private fun editStop(stop: JourneyStop) {
        val form = LinearLayout(requireContext()).apply { orientation = LinearLayout.VERTICAL; setPadding(dp(20)) }
        val day = EditText(requireContext()).apply { hint = "Day (1–99)"; inputType = android.text.InputType.TYPE_CLASS_NUMBER; setText(stop.day.toString()) }
        val notes = EditText(requireContext()).apply { hint = "A little plan for this stop…"; setText(stop.notes); minLines = 3; filters = arrayOf(android.text.InputFilter.LengthFilter(1000)) }
        form.addView(day); form.addView(notes)
        MaterialAlertDialogBuilder(requireContext()).setTitle(stop.name).setView(form).setPositiveButton("Save") { _, _ ->
            repository.updateJourneyStop(stop.id, day.text.toString().toIntOrNull() ?: stop.day, notes.text.toString())
        }.setNegativeButton("Cancel", null).show()
    }
}

class TravelerSheet : TravelSheet() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val profile = (repository.guides.value + repository.allContent().map { it.author }).find { it.id == arguments?.getString("id") }
        if (profile == null) { text("Traveler unavailable"); return }
        button("Close profile") { dismiss() }
        image(profile.avatarUrl); text(profile.fullName, 27f); text("@${profile.username} · ${profile.homeCity}", 12f, true); text(profile.bio)
        if (profile.isVerifiedGuide) text("Local guide · ${profile.languagesSpoken.joinToString()}", 12f, true)
        if (profile.id != repository.currentUser.value.id) {
            lateinit var follow: MaterialButton
            follow = button(if (repository.isFollowing(profile.id)) "Following" else "Follow journey") {
                follow.text = if (repository.toggleFollow(profile)) "Following" else "Follow journey"
            }
            button("Open local chat preview") { ChatDialogFragment.newInstance(profile).show(parentFragmentManager, "traveler_chat") }
        }
        text("Stories from the road", 21f)
        val posts = repository.allContent().filter { it.author.id == profile.id }
        if (posts.isEmpty()) text("The next story is still being written.", 14f, true)
        val adapter = feed(posts)
        viewLifecycleOwner.lifecycleScope.launch { combine(repository.posts, repository.reels) { _, _ -> repository.allContent().filter { it.author.id == profile.id } }.collect { adapter.updatePosts(it) } }
    }
    companion object { fun newInstance(id: String) = TravelerSheet().apply { arguments = Bundle().apply { putString("id", id) } } }
}

class SavedStorySheet : TravelSheet() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val post = repository.allContent().find { it.id == arguments?.getString("id") }
        button("Close story") { dismiss() }
        if (post == null) {
            text("This story is no longer available")
            return
        }
        val adapter = feed(listOf(post))
        if (post.format == PostFormat.REEL) button("Open Reels") {
            (activity as? com.safarnama.travel.MainActivity)?.openReel(post.id)
            dismiss()
        }
        viewLifecycleOwner.lifecycleScope.launch {
            combine(repository.posts, repository.reels) { _, _ -> repository.allContent().filter { it.id == post.id } }
                .collect { adapter.updatePosts(it) }
        }
    }
    companion object {
        fun newInstance(id: String) = SavedStorySheet().apply {
            arguments = Bundle().apply { putString("id", id) }
        }
    }
}
