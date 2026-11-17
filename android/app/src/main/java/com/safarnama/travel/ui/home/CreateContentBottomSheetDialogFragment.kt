package com.safarnama.travel.ui.home

import android.content.Context
import android.os.Bundle
import android.text.InputFilter
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.widget.doAfterTextChanged
import androidx.lifecycle.lifecycleScope
import coil.load
import coil.transform.CircleCropTransformation
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.bottomsheet.BottomSheetBehavior
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.safarnama.travel.R
import com.safarnama.travel.data.Post
import com.safarnama.travel.data.PostFormat
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogCreateContentBinding
import com.safarnama.travel.util.LocalMedia
import kotlinx.coroutines.launch
import java.util.UUID

class CreateContentBottomSheetDialogFragment : BottomSheetDialogFragment() {
    private var _binding: DialogCreateContentBinding? = null
    private val binding get() = _binding!!
    private val repository = TravelRepository.instance
    private var selectedFormat = PostFormat.TWEET
    private var media = emptyList<String>()
    private var busy = false
    private var published = false
    private val preferences by lazy { requireContext().getSharedPreferences("creator_draft_${repository.currentUser.value.id}", Context.MODE_PRIVATE) }
    private val picker = registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        if (uris.isEmpty()) return@registerForActivityResult
        val context = context?.applicationContext ?: return@registerForActivityResult
        viewLifecycleOwner.lifecycleScope.launch {
            busy = true; setBusy(true)
            try {
                media = LocalMedia.importFiles(context, uris, selectedFormat == PostFormat.REEL)
                binding.tvSelectedMedia.text = "${media.size} ${if (selectedFormat == PostFormat.REEL) "video" else "photo(s)"} ready"
                binding.ivMediaPreview.visibility = View.VISIBLE
                binding.ivMediaPreview.load(if (selectedFormat == PostFormat.REEL) R.drawable.ic_reels else media.first())
                saveDraft()
            } catch (error: Exception) {
                Toast.makeText(context, error.message ?: "Could not import media", Toast.LENGTH_LONG).show()
            } finally { busy = false; if (_binding != null) setBusy(false) }
        }
    }
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = DialogCreateContentBinding.inflate(inflater, container, false)
        return binding.root
    }
    override fun onStart() {
        super.onStart()
        (dialog as? BottomSheetDialog)?.behavior?.state = BottomSheetBehavior.STATE_EXPANDED
    }
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        val user = repository.currentUser.value
        binding.tvCreateUserFullname.text = user.fullName
        binding.tvCreateUserRole.text = "Your travel journal · saved on this device"
        binding.ivCreateUserAvatar.load(user.avatarUrl) { transformations(CircleCropTransformation()); placeholder(R.drawable.ic_profile) }
        val destinations = repository.destinations.value
        binding.spinnerDestinations.adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item,
            listOf("Choose a destination") + destinations.map { "${it.name} (${it.state})" })
        selectedFormat = runCatching { PostFormat.valueOf(preferences.getString("format", "TWEET")!!) }.getOrDefault(PostFormat.TWEET)
        binding.etCreateCaption.setText(preferences.getString("caption", ""))
        binding.etCreateSpotName.setText(preferences.getString("spot", ""))
        binding.etCreateState.setText(preferences.getString("state", ""))
        binding.etCreateCost.setText(preferences.getString("budget", ""))
        binding.etCreateMentions.setText(preferences.getString("mentions", ""))
        binding.etCreateMediaUrl.setText(preferences.getString("url", ""))
        binding.spinnerDestinations.setSelection((destinations.indexOfFirst { it.id == preferences.getString("destination", "") } + 1).coerceAtLeast(0))
        media = preferences.getString("media", "").orEmpty().split('\n').filter { it.isNotBlank() }
        if (media.isNotEmpty()) binding.tvSelectedMedia.text = "${media.size} selected file(s) restored"
        listOf(binding.etCreateCaption, binding.etCreateSpotName, binding.etCreateState, binding.etCreateCost,
            binding.etCreateMentions, binding.etCreateMediaUrl).forEach { it.doAfterTextChanged { saveDraft() } }
        binding.tabTypeTweet.setOnClickListener { changeFormat(PostFormat.TWEET) }
        binding.tabTypePhoto.setOnClickListener { changeFormat(PostFormat.PHOTO_POST) }
        binding.tabTypeReel.setOnClickListener { changeFormat(PostFormat.REEL) }
        binding.btnPickMedia.setOnClickListener { picker.launch(arrayOf(if (selectedFormat == PostFormat.REEL) "video/*" else "image/*")) }
        binding.btnCloseCreate.setOnClickListener { if (!busy) dismiss() }
        binding.btnPublishContent.setOnClickListener { publish() }
        renderFormat()
    }
    private fun changeFormat(format: PostFormat) {
        if (busy) return
        selectedFormat = format; media = emptyList()
        binding.ivMediaPreview.visibility = View.GONE
        binding.tvSelectedMedia.text = "No media selected"
        renderFormat(); saveDraft()
    }
    private fun renderFormat() {
        val coral = ContextCompat.getColor(requireContext(), R.color.brand_coral)
        listOf(binding.tabTypeTweet to PostFormat.TWEET, binding.tabTypePhoto to PostFormat.PHOTO_POST, binding.tabTypeReel to PostFormat.REEL).forEach { (tab, format) ->
            tab.setBackgroundResource(R.drawable.bg_tag_pill)
            tab.setTextColor(if (format == selectedFormat) coral else ContextCompat.getColor(requireContext(), R.color.text_zinc_500))
            tab.isSelected = format == selectedFormat
        }
        binding.etCreateCaption.filters = arrayOf(InputFilter.LengthFilter(if (selectedFormat == PostFormat.TWEET) 500 else 2200))
        binding.etCreateCaption.hint = "A small discovery, a beautiful moment, a useful tip…"
        binding.layoutMediaInputs.visibility = if (selectedFormat == PostFormat.TWEET) View.GONE else View.VISIBLE
        binding.btnPickMedia.text = if (selectedFormat == PostFormat.REEL) "Choose a video · up to 60 MB" else "Choose photos · up to 6"
        binding.etCreateMediaUrl.hint = if (selectedFormat == PostFormat.REEL) "Or paste a public HTTPS video URL" else "Or paste a public HTTPS photo URL"
        binding.btnPublishContent.text = "Share to my journal"
    }
    private fun setBusy(value: Boolean) {
        binding.btnPublishContent.isEnabled = !value; binding.btnPickMedia.isEnabled = !value
        binding.btnPublishContent.text = if (value) "Preparing your story…" else "Share to my journal"
        isCancelable = !value
    }
    private fun saveDraft() {
        if (_binding == null || published) return
        val destination = repository.destinations.value.getOrNull(binding.spinnerDestinations.selectedItemPosition - 1)
        preferences.edit().putString("format", selectedFormat.name).putString("caption", binding.etCreateCaption.text.toString())
            .putString("spot", binding.etCreateSpotName.text.toString()).putString("state", binding.etCreateState.text.toString())
            .putString("budget", binding.etCreateCost.text.toString()).putString("mentions", binding.etCreateMentions.text.toString())
            .putString("url", binding.etCreateMediaUrl.text.toString()).putString("destination", destination?.id)
            .putString("media", media.joinToString("\n")).apply()
    }
    private fun publish() {
        if (busy) return
        val caption = binding.etCreateCaption.text.toString().trim()
        if (caption.isBlank()) { binding.etCreateCaption.error = "Tell us about the moment"; return }
        val destination = repository.destinations.value.getOrNull(binding.spinnerDestinations.selectedItemPosition - 1)
        if (destination == null) { Toast.makeText(requireContext(), "Choose a destination", Toast.LENGTH_SHORT).show(); return }
        val mentions = binding.etCreateMentions.text.toString().split(",", " ").map { it.trim().trimStart('@') }.filter { it.isNotBlank() }.distinct().map { "@$it" }
        val url = binding.etCreateMediaUrl.text.toString().trim()
        val attachments = media.ifEmpty { if (url.isNotBlank()) listOf(url) else emptyList() }
        if (selectedFormat != PostFormat.TWEET && attachments.isEmpty()) { Toast.makeText(requireContext(), "Choose your own photo or video first", Toast.LENGTH_LONG).show(); return }
        if (media.isEmpty() && url.isNotEmpty() && (!url.startsWith("https://") || android.net.Uri.parse(url).host.isNullOrBlank())) { binding.etCreateMediaUrl.error = "Use a valid HTTPS media URL"; return }
        val budgetText = binding.etCreateCost.text.toString()
        val budget = budgetText.toIntOrNull() ?: 0
        if (budgetText.isNotEmpty() && (budgetText.toIntOrNull() == null || budget !in 0..1000000)) { binding.etCreateCost.error = "Enter a budget from 0 to 10,00,000"; return }
        val post = Post(id = "local-${UUID.randomUUID()}", author = repository.currentUser.value,
            spotName = binding.etCreateSpotName.text.toString().trim().ifEmpty { destination.name }, state = destination.state,
            region = destination.region, caption = caption, format = selectedFormat, destinationId = destination.id,
            destinationName = destination.name, mentionedUsernames = mentions, costInInr = budget,
            latitude = destination.latitude, longitude = destination.longitude,
            videoUrl = if (selectedFormat == PostFormat.REEL) attachments.first() else null,
            thumbnailUrl = if (selectedFormat == PostFormat.REEL) destination.coverImage else attachments.firstOrNull(),
            carouselImages = if (selectedFormat == PostFormat.PHOTO_POST) attachments else emptyList(),
            bestTimeToVisit = destination.bestTimeToVisit, createdAt = java.time.Instant.now().toString())
        repository.addPost(post)
        published = true; preferences.edit().clear().apply()
        Toast.makeText(requireContext(), "Story saved to your feed and journal on this device", Toast.LENGTH_LONG).show()
        dismiss()
    }
    override fun onDestroyView() { saveDraft(); _binding = null; super.onDestroyView() }
    companion object { fun newInstance() = CreateContentBottomSheetDialogFragment() }
}
