package com.safarnama.travel.ui.home

import android.view.GestureDetector
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import androidx.viewpager2.widget.ViewPager2
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.Post
import com.safarnama.travel.databinding.ItemFeedPostBinding
import com.safarnama.travel.util.HeartAnimationUtil

class FeedAdapter(
    private var posts: List<Post>,
    private val onLikeToggle: (Post) -> Unit,
    private val onSaveToggle: (Post) -> Unit
) : RecyclerView.Adapter<FeedAdapter.FeedViewHolder>() {

    fun updatePosts(newPosts: List<Post>) {
        posts = newPosts
        notifyDataSetChanged()
    }

    inner class FeedViewHolder(val binding: ItemFeedPostBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FeedViewHolder {
        val binding = ItemFeedPostBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return FeedViewHolder(binding)
    }

    override fun onBindViewHolder(holder: FeedViewHolder, position: Int) {
        val post = posts[position]
        val context = holder.itemView.context
        val binding = holder.binding

        // Author & Location
        binding.tvAuthorUsername.text = post.author.username
        binding.ivVerifiedGuide.visibility = if (post.author.isVerifiedGuide) View.VISIBLE else View.GONE
        binding.tvPostLocation.text = "${post.spotName}, ${post.state}"
        binding.ivAuthorAvatar.load(post.author.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        // Carousel Images
        val imageList = if (post.carouselImages.isNotEmpty()) {
            post.carouselImages
        } else if (!post.thumbnailUrl.isNullOrEmpty()) {
            listOf(post.thumbnailUrl)
        } else {
            listOf("https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800")
        }

        val carouselAdapter = CarouselImageAdapter(imageList)
        binding.viewpagerCarousel.adapter = carouselAdapter

        // Slide Counter Pill (e.g. "1/3")
        if (imageList.size > 1) {
            binding.tvSlideCounter.visibility = View.VISIBLE
            binding.tvSlideCounter.text = "1/${imageList.size}"
            binding.viewpagerCarousel.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
                override fun onPageSelected(pagePos: Int) {
                    binding.tvSlideCounter.text = "${pagePos + 1}/${imageList.size}"
                }
            })
        } else {
            binding.tvSlideCounter.visibility = View.GONE
        }

        // Double Tap Heart Gesture on Media Container
        val gestureDetector = GestureDetector(context, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDoubleTap(e: MotionEvent): Boolean {
                HeartAnimationUtil.animateHeartBurst(binding.ivDoubleTapHeart)
                if (!post.isLiked) {
                    onLikeToggle(post)
                }
                return true
            }

            override fun onSingleTapConfirmed(e: MotionEvent): Boolean {
                return true
            }
        })

        binding.mediaContainer.setOnTouchListener { _, event ->
            gestureDetector.onTouchEvent(event)
            true
        }

        // Like Button & State
        updateLikeView(holder, post)
        binding.btnLike.setOnClickListener {
            onLikeToggle(post)
        }

        // Save Button & State
        updateSaveView(holder, post)
        binding.btnSave.setOnClickListener {
            onSaveToggle(post)
        }

        // Comments & Share
        binding.btnComment.setOnClickListener {
            Toast.makeText(context, "Opening comments for ${post.spotName}", Toast.LENGTH_SHORT).show()
        }
        binding.btnShare.setOnClickListener {
            Toast.makeText(context, "Sharing link to ${post.spotName}", Toast.LENGTH_SHORT).show()
        }
        binding.tvOptionsMenu.setOnClickListener {
            Toast.makeText(context, "Options: Save Spot, Copy Link, Report", Toast.LENGTH_SHORT).show()
        }

        // Travel Chips
        binding.chipCost.text = "₹${post.costInInr} / day"
        binding.chipSeason.text = post.bestTimeToVisit
        binding.chipSignal.text = post.connectivitySignal

        // Caption & Micro-Blog
        binding.tvCaption.text = post.caption
        binding.tvCommentsSummary.text = "View all ${post.commentsCount} comments"
        binding.tvTimestamp.text = post.createdAt
    }

    private fun updateLikeView(holder: FeedViewHolder, post: Post) {
        val context = holder.itemView.context
        if (post.isLiked) {
            holder.binding.btnLike.setImageResource(R.drawable.ic_heart_filled)
            holder.binding.btnLike.setColorFilter(ContextCompat.getColor(context, R.color.heart_red))
        } else {
            holder.binding.btnLike.setImageResource(R.drawable.ic_heart_outline)
            holder.binding.btnLike.setColorFilter(ContextCompat.getColor(context, R.color.text_zinc_900))
        }
        holder.binding.tvLikesCount.text = "${post.likesCount} likes"
    }

    private fun updateSaveView(holder: FeedViewHolder, post: Post) {
        val context = holder.itemView.context
        if (post.isSaved) {
            holder.binding.btnSave.setImageResource(R.drawable.ic_bookmark_filled)
            holder.binding.btnSave.setColorFilter(ContextCompat.getColor(context, R.color.bookmark_gold))
        } else {
            holder.binding.btnSave.setImageResource(R.drawable.ic_bookmark_outline)
            holder.binding.btnSave.setColorFilter(ContextCompat.getColor(context, R.color.text_zinc_900))
        }
    }

    override fun getItemCount(): Int = posts.size
}
