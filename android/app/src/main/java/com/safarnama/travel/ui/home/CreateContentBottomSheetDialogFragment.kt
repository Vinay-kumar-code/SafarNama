package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.core.content.ContextCompat
import coil.load
import coil.transform.CircleCropTransformation
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.safarnama.travel.R
import com.safarnama.travel.data.Post
import com.safarnama.travel.data.PostFormat
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogCreateContentBinding
import java.util.UUID

class CreateContentBottomSheetDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogCreateContentBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private var selectedFormat: PostFormat = PostFormat.TWEET

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogCreateContentBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val currentUser = repository.currentUser.value
        binding.tvCreateUserFullname.text = currentUser.fullName
        binding.tvCreateUserRole.text = if (currentUser.isVerifiedGuide) "Verified Guide Journey" else "Public Traveler Trail"

        binding.ivCreateUserAvatar.load(currentUser.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        // Setup destination picker spinner
        val destinations = repository.destinations.value
        val destNames = listOf("Select Destination (Optional)") + destinations.map { "${it.name} (${it.state})" }
        val spinnerAdapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, destNames)
        binding.spinnerDestinations.adapter = spinnerAdapter

        // Format tabs
        binding.tabTypeTweet.setOnClickListener { selectFormat(PostFormat.TWEET) }
        binding.tabTypePhoto.setOnClickListener { selectFormat(PostFormat.PHOTO_POST) }
        binding.tabTypeReel.setOnClickListener { selectFormat(PostFormat.REEL) }

        // Close
        binding.btnCloseCreate.setOnClickListener { dismiss() }

        // Publish
        binding.btnPublishContent.setOnClickListener {
            publish()
        }
    }

    private fun selectFormat(format: PostFormat) {
        selectedFormat = format
        val context = requireContext()
        val coral = ContextCompat.getColor(context, R.color.brand_coral)
        val textDark = ContextCompat.getColor(context, R.color.text_zinc_700)
        val textWhite = ContextCompat.getColor(context, R.color.bg_white)

        when (format) {
            PostFormat.TWEET -> {
                binding.tabTypeTweet.setBackgroundColor(coral)
                binding.tabTypeTweet.setTextColor(textWhite)
                binding.tabTypePhoto.setBackgroundResource(R.drawable.bg_tag_pill)
                binding.tabTypePhoto.setTextColor(textDark)
                binding.tabTypeReel.setBackgroundResource(R.drawable.bg_tag_pill)
                binding.tabTypeReel.setTextColor(textDark)
                binding.layoutMediaInputs.visibility = View.GONE
                binding.etCreateCaption.hint = "What's happening on your journey? Share live updates, trail conditions, or travel thoughts..."
                binding.btnPublishContent.text = "Publish Tweet / Thread"
            }
            PostFormat.PHOTO_POST -> {
                binding.tabTypeTweet.setBackgroundResource(R.drawable.bg_tag_pill)
                binding.tabTypeTweet.setTextColor(textDark)
                binding.tabTypePhoto.setBackgroundColor(coral)
                binding.tabTypePhoto.setTextColor(textWhite)
                binding.tabTypeReel.setBackgroundResource(R.drawable.bg_tag_pill)
                binding.tabTypeReel.setTextColor(textDark)
                binding.layoutMediaInputs.visibility = View.VISIBLE
                binding.etCreateMediaUrl.hint = "Image URL (e.g. https://images.unsplash.com/...)"
                binding.etCreateCaption.hint = "Write an engaging travel photo caption, tips & highlights..."
                binding.btnPublishContent.text = "Publish Photo Post"
            }
            PostFormat.REEL -> {
                binding.tabTypeTweet.setBackgroundResource(R.drawable.bg_tag_pill)
                binding.tabTypeTweet.setTextColor(textDark)
                binding.tabTypePhoto.setBackgroundResource(R.drawable.bg_tag_pill)
                binding.tabTypePhoto.setTextColor(textDark)
                binding.tabTypeReel.setBackgroundColor(coral)
                binding.tabTypeReel.setTextColor(textWhite)
                binding.layoutMediaInputs.visibility = View.VISIBLE
                binding.etCreateMediaUrl.hint = "Video URL / R2 MP4 URL"
                binding.etCreateCaption.hint = "Describe your vertical reel video, scenery & sound..."
                binding.btnPublishContent.text = "Publish Travel Reel"
            }
            else -> {}
        }
    }

    private fun publish() {
        val caption = binding.etCreateCaption.text.toString().trim()
        if (caption.isEmpty()) {
            Toast.makeText(requireContext(), "Please write a caption or message", Toast.LENGTH_SHORT).show()
            return
        }

        val destIndex = binding.spinnerDestinations.selectedItemPosition
        val destinations = repository.destinations.value
        val attachedDest = if (destIndex > 0 && destIndex - 1 < destinations.size) destinations[destIndex - 1] else null

        // Parse mentions
        val rawMentions = binding.etCreateMentions.text.toString()
        val mentions = rawMentions.split(",", " ")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .map { if (it.startsWith("@")) it else "@$it" }

        when (selectedFormat) {
            PostFormat.TWEET -> {
                repository.addTweet(
                    content = caption,
                    destinationName = attachedDest?.name,
                    destinationId = attachedDest?.id,
                    mentionedUsernames = mentions
                )
                Toast.makeText(requireContext(), "Travel Tweet published to feed! 🚀", Toast.LENGTH_SHORT).show()
            }
            PostFormat.PHOTO_POST -> {
                val spotName = binding.etCreateSpotName.text.toString().trim().ifEmpty { "Scenic Viewpoint" }
                val mediaUrl = binding.etCreateMediaUrl.text.toString().trim().ifEmpty {
                    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900"
                }
                val state = binding.etCreateState.text.toString().trim().ifEmpty { attachedDest?.state ?: "India" }
                val cost = binding.etCreateCost.text.toString().toIntOrNull() ?: 1500

                val newPost = Post(
                    id = "post-${UUID.randomUUID().toString().take(8)}",
                    author = repository.currentUser.value,
                    spotName = spotName,
                    state = state,
                    region = attachedDest?.name ?: spotName,
                    caption = caption,
                    format = PostFormat.PHOTO_POST,
                    carouselImages = listOf(mediaUrl),
                    destinationId = attachedDest?.id,
                    destinationName = attachedDest?.name,
                    mentionedUsernames = mentions,
                    costInInr = cost,
                    createdAt = "Just now"
                )
                repository.addPost(newPost)
                Toast.makeText(requireContext(), "Photo Post published! 📷", Toast.LENGTH_SHORT).show()
            }
            PostFormat.REEL -> {
                val spotName = binding.etCreateSpotName.text.toString().trim().ifEmpty { "Travel Reel" }
                val videoUrl = binding.etCreateMediaUrl.text.toString().trim().ifEmpty {
                    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                }
                repository.addReel(
                    videoUrl = videoUrl,
                    spotName = spotName,
                    caption = caption,
                    destinationName = attachedDest?.name,
                    destinationId = attachedDest?.id,
                    mentionedUsernames = mentions
                )
                Toast.makeText(requireContext(), "Travel Reel uploaded! 🎬", Toast.LENGTH_SHORT).show()
            }
            else -> {}
        }

        dismiss()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        fun newInstance(): CreateContentBottomSheetDialogFragment {
            return CreateContentBottomSheetDialogFragment()
        }
    }
}
