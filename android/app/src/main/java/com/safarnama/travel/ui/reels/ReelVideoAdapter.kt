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
import com.safarnama.travel.databinding.ItemReelPageBinding
import com.safarnama.travel.util.HeartAnimationUtil

class ReelVideoAdapter(
    private var reels: List<Post>,
    private val onLikeToggle: (Post) -> Unit,
    private val onSaveToggle: (Post) -> Unit,
    private val onOpenComments: ((Post) -> Unit)? = null
) : RecyclerView.Adapter<ReelVideoAdapter.ReelViewHolder>() {

    private val playersMap = mutableMapOf<Int, ExoPlayer>()

    fun updateReels(newReels: List<Post>) {
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
        if (!reel.thumbnailUrl.isNullOrEmpty()) {
            binding.ivReelThumbnail.visibility = View.VISIBLE
            binding.ivReelThumbnail.load(reel.thumbnailUrl) {
                crossfade(true)
            }
        }

        // Setup ExoPlayer for this item
        val videoUrl = reel.videoUrl ?: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        val exoPlayer = ExoPlayer.Builder(context).build().apply {
            val mediaItem = MediaItem.fromUri(Uri.parse(videoUrl))
            setMediaItem(mediaItem)
            repeatMode = Player.REPEAT_MODE_ONE
            prepare()
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_READY) {
                        binding.ivReelThumbnail.visibility = View.GONE
                    }
                }
            })
        }
        holder.player = exoPlayer
        binding.playerView.player = exoPlayer
        playersMap[position] = exoPlayer

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
            Toast.makeText(context, "Sharing reel ${reel.spotName}", Toast.LENGTH_SHORT).show()
        }

        binding.btnReelFollow.setOnClickListener {
            if (binding.btnReelFollow.text == "Follow") {
                binding.btnReelFollow.text = "Following"
                binding.btnReelFollow.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_500))
            } else {
                binding.btnReelFollow.text = "Follow"
                binding.btnReelFollow.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_900))
            }
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
        playersMap.forEach { (pos, player) ->
            if (pos == position) {
                player.playWhenReady = true
                player.play()
            } else {
                player.playWhenReady = false
                player.pause()
            }
        }
    }

    fun pauseAll() {
        playersMap.values.forEach {
            it.playWhenReady = false
            it.pause()
        }
    }

    fun releaseAll() {
        playersMap.values.forEach {
            it.release()
        }
        playersMap.clear()
    }

    override fun getItemCount(): Int = reels.size
}
