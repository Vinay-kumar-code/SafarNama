package com.safarnama.travel.ui.home

import com.safarnama.travel.util.TravelActions
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
import com.safarnama.travel.data.PostFormat
import com.safarnama.travel.databinding.ItemFeedPostBinding
import com.safarnama.travel.databinding.ItemFeedTweetBinding
import com.safarnama.travel.util.HeartAnimationUtil

class FeedAdapter(
    private var posts: List<Post>,
    private val onLikeToggle: (Post) -> Unit,
    private val onSaveToggle: (Post) -> Unit,
    private val onOpenComments: ((Post) -> Unit)? = null,
    private val onOpenThread: ((Post) -> Unit)? = null
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    fun updatePosts(newPosts: List<Post>) {
        posts = newPosts
        notifyDataSetChanged()
    }

    override fun getItemViewType(position: Int): Int {
        val post = posts[position]
        return if (post.format == PostFormat.TWEET || post.format == PostFormat.QUICK_TIP) {
            VIEW_TYPE_TWEET
        } else {
            VIEW_TYPE_POST
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_TYPE_TWEET) {
            val binding = ItemFeedTweetBinding.inflate(inflater, parent, false)
            TweetViewHolder(binding)
        } else {
            val binding = ItemFeedPostBinding.inflate(inflater, parent, false)
            PostViewHolder(binding)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val post = posts[position]
        if (holder is TweetViewHolder) {
            bindTweet(holder, post)
        } else if (holder is PostViewHolder) {
            bindPost(holder, post)
        }
    }

    // --- Tweet Binding ---
    private fun bindTweet(holder: TweetViewHolder, post: Post) {
        val binding = holder.binding
        val context = holder.itemView.context

        binding.tvTweetFullname.text = post.author.fullName
        binding.tvTweetUsername.text = "@${post.author.username}"
        binding.tvTweetTimestamp.text = TravelActions.timeLabel(post.createdAt)
        binding.tvTweetContent.text = post.caption
        binding.ivTweetVerified.visibility = if (post.author.isVerifiedGuide) View.VISIBLE else View.GONE

        binding.ivTweetAvatar.load(post.author.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        binding.ivTweetAvatar.setOnClickListener { TravelActions.traveler(context, post) }
        binding.layoutTweetDestination.setOnClickListener { TravelActions.destination(context, post) }

        // Attached Destination Tag
        if (!post.destinationName.isNullOrBlank()) {
            binding.layoutTweetDestination.visibility = View.VISIBLE
            binding.tvTweetDestinationTag.text = post.destinationName
        } else {
            binding.layoutTweetDestination.visibility = View.GONE
        }

        // Group Travel Mentions
        if (post.mentionedUsernames.isNotEmpty()) {
            binding.layoutTweetMentions.visibility = View.VISIBLE
            binding.tvTweetMentions.text = "With: " + post.mentionedUsernames.joinToString(", ")
        } else {
            binding.layoutTweetMentions.visibility = View.GONE
        }

        // Like Button & State
        updateTweetLikeUi(holder, post)
        binding.btnTweetLike.setOnClickListener {
            onLikeToggle(post)
        }

        // Save Button & State
        updateTweetSaveUi(holder, post)
        binding.btnTweetSave.setOnClickListener {
            onSaveToggle(post)
        }

        // Thread / Reply Button (Opens Threaded Discussion Sheet)
        val repliesText = if (post.threadRepliesCount > 0) "${post.threadRepliesCount} Replies" else "Reply"
        binding.tvTweetRepliesCount.text = repliesText
        binding.btnTweetThread.setOnClickListener {
            onOpenThread?.invoke(post)
        }

        binding.btnTweetShare.setOnClickListener {
            TravelActions.share(context, post)
        }
    }

    private fun updateTweetLikeUi(holder: TweetViewHolder, post: Post) {
        val context = holder.itemView.context
        if (post.isLiked) {
            holder.binding.ivTweetLike.setImageResource(R.drawable.ic_heart_filled)
            holder.binding.ivTweetLike.setColorFilter(ContextCompat.getColor(context, R.color.heart_red))
        } else {
            holder.binding.ivTweetLike.setImageResource(R.drawable.ic_heart_outline)
            holder.binding.ivTweetLike.setColorFilter(ContextCompat.getColor(context, R.color.text_zinc_900))
        }
        holder.binding.tvTweetLikesCount.text = "${post.likesCount}"
    }

    private fun updateTweetSaveUi(holder: TweetViewHolder, post: Post) {
        val context = holder.itemView.context
        if (post.isSaved) {
            holder.binding.btnTweetSave.setImageResource(R.drawable.ic_bookmark_filled)
            holder.binding.btnTweetSave.setColorFilter(ContextCompat.getColor(context, R.color.bookmark_gold))
        } else {
            holder.binding.btnTweetSave.setImageResource(R.drawable.ic_bookmark_outline)
            holder.binding.btnTweetSave.setColorFilter(ContextCompat.getColor(context, R.color.text_zinc_900))
        }
    }

    // --- Photo Post Binding ---
    private fun bindPost(holder: PostViewHolder, post: Post) {
        val binding = holder.binding
        val context = holder.itemView.context

        // Author & Location
        binding.tvAuthorUsername.text = post.author.username
        binding.ivVerifiedGuide.visibility = if (post.author.isVerifiedGuide) View.VISIBLE else View.GONE
        binding.tvPostLocation.text = "${post.spotName}, ${post.state}"
        binding.ivAuthorAvatar.load(post.author.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        binding.ivAuthorAvatar.setOnClickListener { TravelActions.traveler(context, post) }
        binding.tvPostLocation.setOnClickListener { TravelActions.destination(context, post) }
        binding.layoutPostDestination.setOnClickListener { TravelActions.destination(context, post) }

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

        holder.pageCallback?.let { binding.viewpagerCarousel.unregisterOnPageChangeCallback(it) }
        holder.pageCallback = null
        binding.viewpagerCarousel.setCurrentItem(0, false)
        // Slide Counter Pill
        if (imageList.size > 1) {
            binding.tvSlideCounter.visibility = View.VISIBLE
            binding.tvSlideCounter.text = "1/${imageList.size}"
            val pageCallback = object : ViewPager2.OnPageChangeCallback() {
                override fun onPageSelected(pagePos: Int) {
                    binding.tvSlideCounter.text = "${pagePos + 1}/${imageList.size}"
                }
            }
            holder.pageCallback = pageCallback
            binding.viewpagerCarousel.registerOnPageChangeCallback(pageCallback)
        } else {
            binding.tvSlideCounter.visibility = View.GONE
        }

        // Double Tap Heart Gesture
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

        // Comments BottomSheet Click
        binding.btnComment.setOnClickListener {
            onOpenComments?.invoke(post)
        }
        binding.tvCommentsSummary.setOnClickListener {
            onOpenComments?.invoke(post)
        }

        binding.btnShare.setOnClickListener {
            TravelActions.share(context, post)
        }
        binding.tvOptionsMenu.setOnClickListener {
            com.google.android.material.dialog.MaterialAlertDialogBuilder(context).setTitle(post.spotName)
                .setItems(arrayOf("Add to my journey", "View traveler", "Share story")) { _, item ->
                    when (item) {
                        0 -> {
                            com.safarnama.travel.data.TravelRepository.instance.addJourneyStop(com.safarnama.travel.data.JourneyStop(
                                post.id, post.spotName, post.state, post.latitude, post.longitude,
                                post.thumbnailUrl ?: post.carouselImages.firstOrNull().orEmpty(), post.costInInr))
                            Toast.makeText(context, "Added to your journey", Toast.LENGTH_SHORT).show()
                        }
                        1 -> TravelActions.traveler(context, post)
                        2 -> TravelActions.share(context, post)
                    }
                }.show()
        }

        // Travel Chips
        binding.chipCost.text = "₹${post.costInInr} / day"
        binding.chipSeason.text = post.bestTimeToVisit
        binding.chipSignal.text = post.connectivitySignal

        // Destination Tag & Mentions
        if (!post.destinationName.isNullOrBlank()) {
            binding.layoutPostDestination.visibility = View.VISIBLE
            binding.tvPostDestinationTag.text = post.destinationName
        } else {
            binding.layoutPostDestination.visibility = View.GONE
        }

        if (post.mentionedUsernames.isNotEmpty()) {
            binding.tvPostMentions.visibility = View.VISIBLE
            binding.tvPostMentions.text = "👥 With: " + post.mentionedUsernames.joinToString(", ")
        } else {
            binding.tvPostMentions.visibility = View.GONE
        }

        // Caption & Micro-Blog
        binding.tvCaption.text = post.caption
        binding.tvCommentsSummary.text = "View all ${post.commentsCount} comments"
        binding.tvTimestamp.text = TravelActions.timeLabel(post.createdAt)
    }

    private fun updateLikeView(holder: PostViewHolder, post: Post) {
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

    private fun updateSaveView(holder: PostViewHolder, post: Post) {
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

    inner class PostViewHolder(val binding: ItemFeedPostBinding) :
        RecyclerView.ViewHolder(binding.root)

    inner class TweetViewHolder(val binding: ItemFeedTweetBinding) :
        RecyclerView.ViewHolder(binding.root)

    companion object {
        const val VIEW_TYPE_POST = 1
        const val VIEW_TYPE_TWEET = 2
    }
}
