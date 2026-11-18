package com.safarnama.travel.ui.reels

import android.content.Context
import android.net.Uri
import android.view.GestureDetector
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.Post
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.ItemReelPageBinding
import com.safarnama.travel.util.HeartAnimationUtil
import com.safarnama.travel.util.TravelActions

class ReelVideoAdapter(
    private var reels: List<Post>,
    private val onLikeToggle: (Post) -> Unit,
    private val onSaveToggle: (Post) -> Unit,
    private val onOpenComments: ((Post) -> Unit)? = null
) : RecyclerView.Adapter<ReelVideoAdapter.ReelViewHolder>() {

    private val players = mutableSetOf<ReelViewHolder>()
    private var activePosition = RecyclerView.NO_POSITION

    fun updateReels(newReels: List<Post>) {
        if (reels == newReels) return
        reels = newReels
        notifyDataSetChanged()
    }

    inner class ReelViewHolder(val binding: ItemReelPageBinding) :
        RecyclerView.ViewHolder(binding.root) {
        var player: ExoPlayer? = null
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ReelViewHolder {
        val binding = ItemReelPageBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ReelViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ReelViewHolder, position: Int) {
        val reel = reels[position]
        val context = holder.itemView.context
        val binding = holder.binding
        release(holder)

        // Creator and Spot Info
        binding.tvReelAuthor.text = "@${reel.author.username}"
        binding.ivReelVerified.visibility = if (reel.author.isVerifiedGuide) View.VISIBLE else View.GONE
        binding.tvReelSpot.text = "${reel.spotName}, ${reel.state}"
        binding.tvReelCaption.text = reel.caption

        binding.ivReelAvatar.load(reel.author.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        // Thumbnail Preview
        binding.ivReelThumbnail.visibility = View.GONE
        if (!reel.thumbnailUrl.isNullOrEmpty()) {
            binding.ivReelThumbnail.visibility = View.VISIBLE
            binding.ivReelThumbnail.load(reel.thumbnailUrl) {
                crossfade(true)
            }
        }

        // Setup ExoPlayer for this item
        val videoUrl = reel.videoUrl
        val photoPreview = videoUrl?.startsWith("asset:///") == true
        binding.tvReelAudio.text = if (photoPreview) "Destination photo preview" else "Sound off · tap to unmute"
        val exoPlayer = ExoPlayer.Builder(context).build().apply {
            if (!videoUrl.isNullOrBlank()) setMediaItem(MediaItem.fromUri(Uri.parse(videoUrl)))
            repeatMode = Player.REPEAT_MODE_ONE
            volume = 0f
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_READY) {
                        binding.ivReelThumbnail.visibility = View.GONE
                    }
                }
                override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                    binding.tvReelAudio.text = "Video unavailable · travel story preview"
                }
            })
        }
        holder.player = exoPlayer
        binding.playerView.player = exoPlayer
        players.add(holder)
        if (position == activePosition && !videoUrl.isNullOrBlank()) {
            exoPlayer.prepare()
            exoPlayer.play()
        }
        binding.tvReelAudio.setOnClickListener {
            if (photoPreview) return@setOnClickListener
            exoPlayer.volume = if (exoPlayer.volume == 0f) 1f else 0f
            binding.tvReelAudio.text = if (exoPlayer.volume == 0f) "Sound off · tap to unmute" else "Sound on · tap to mute"
        }

        // Double-tap Heart Gesture on Reel
        val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDoubleTap(e: MotionEvent): Boolean {
                HeartAnimationUtil.animateHeartBurst(binding.ivReelDoubleTapHeart)
                if (!reel.isLiked) {
                    onLikeToggle(reel)
                    updateLikeUi(holder, reel.copy(isLiked = true, likesCount = reel.likesCount + 1))
                }
                return true
            }

            override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
                // Play / pause toggle
                exoPlayer.let {
                    if (it.isPlaying) it.pause() else it.play()
                }
                return true
            }
        })

        binding.playerView.setOnTouchListener { _, event ->
            gestureDetector.onTouchEvent(event)
            true
        }

        // Like / Save / Action bindings
        updateLikeUi(holder, reel)
        binding.btnReelLike.setOnClickListener {
            onLikeToggle(reel)
            val newLiked = !reel.isLiked
            val newCount = if (newLiked) reel.likesCount + 1 else (reel.likesCount - 1).coerceAtLeast(0)
            updateLikeUi(holder, reel.copy(isLiked = newLiked, likesCount = newCount))
        }

        updateSaveUi(holder, reel)
        binding.btnReelSave.setOnClickListener {
            onSaveToggle(reel)
            val newSaved = !reel.isSaved
            updateSaveUi(holder, reel.copy(isSaved = newSaved))
        }

        binding.btnReelComment.setOnClickListener {
            onOpenComments?.invoke(reel)
        }
        binding.btnReelShare.setOnClickListener {
            TravelActions.share(context, reel)
        }

        val repository = TravelRepository.instance
        binding.ivReelAvatar.setOnClickListener { TravelActions.traveler(context, reel) }
        binding.btnReelFollow.visibility = if (reel.author.id == repository.currentUser.value.id) View.GONE else View.VISIBLE
        binding.btnReelFollow.text = if (repository.isFollowing(reel.author.id)) "Following" else "Follow"
        binding.btnReelFollow.setOnClickListener {
            binding.btnReelFollow.text = if (repository.toggleFollow(reel.author)) "Following" else "Follow"
        }
    }

    private fun updateLikeUi(holder: ReelViewHolder, reel: Post) {
        val context = holder.itemView.context
        if (reel.isLiked) {
            holder.binding.btnReelLike.setImageResource(R.drawable.ic_heart_filled)
            holder.binding.btnReelLike.setColorFilter(ContextCompat.getColor(context, R.color.heart_red))
        } else {
            holder.binding.btnReelLike.setImageResource(R.drawable.ic_heart_outline)
            holder.binding.btnReelLike.setColorFilter(ContextCompat.getColor(context, R.color.bg_white))
        }
        holder.binding.tvReelLikes.text = "${reel.likesCount}"
    }

    private fun updateSaveUi(holder: ReelViewHolder, reel: Post) {
        val context = holder.itemView.context
        if (reel.isSaved) {
            holder.binding.btnReelSave.setImageResource(R.drawable.ic_bookmark_filled)
            holder.binding.btnReelSave.setColorFilter(ContextCompat.getColor(context, R.color.bookmark_gold))
        } else {
            holder.binding.btnReelSave.setImageResource(R.drawable.ic_bookmark_outline)
            holder.binding.btnReelSave.setColorFilter(ContextCompat.getColor(context, R.color.bg_white))
        }
    }

    fun playPosition(position: Int) {
        activePosition = position
        players.forEach { holder ->
            val player = holder.player ?: return@forEach
            if (holder.bindingAdapterPosition == position && player.mediaItemCount > 0) {
                if (player.playbackState == Player.STATE_IDLE) player.prepare()
                player.play()
            } else player.pause()
        }
    }

    fun pauseAll() {
        activePosition = RecyclerView.NO_POSITION
        players.forEach { it.player?.pause() }
    }

    fun releaseAll() {
        players.toList().forEach(::release)
    }

    override fun onViewRecycled(holder: ReelViewHolder) { release(holder); super.onViewRecycled(holder) }

    private fun release(holder: ReelViewHolder) {
        players.remove(holder)
        holder.binding.playerView.player = null
        holder.player?.release()
        holder.player = null
    }

    override fun getItemCount(): Int = reels.size
}
