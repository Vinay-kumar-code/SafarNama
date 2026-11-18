package com.safarnama.travel.ui.profile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.safarnama.travel.R
import com.safarnama.travel.data.Post
import com.safarnama.travel.data.PostFormat
import com.safarnama.travel.databinding.ItemSavedSpotBinding
import com.safarnama.travel.ui.journeys.SavedStorySheet
import com.safarnama.travel.util.TravelActions

class SavedSpotsAdapter(
    private var savedPosts: List<Post>
) : RecyclerView.Adapter<SavedSpotsAdapter.SavedSpotViewHolder>() {

    fun updatePosts(newPosts: List<Post>) {
        savedPosts = newPosts
        notifyDataSetChanged()
    }

    inner class SavedSpotViewHolder(val binding: ItemSavedSpotBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SavedSpotViewHolder {
        val binding = ItemSavedSpotBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return SavedSpotViewHolder(binding)
    }

    override fun onBindViewHolder(holder: SavedSpotViewHolder, position: Int) {
        val post = savedPosts[position]
        val photoUrl = post.carouselImages.firstOrNull() ?: post.thumbnailUrl ?: ""

        holder.binding.ivSavedPhoto.load(photoUrl) {
            crossfade(true)
            placeholder(R.drawable.bg_card_rounded)
            error(R.drawable.ic_bookmark_outline)
        }
        holder.itemView.contentDescription = post.spotName

        holder.binding.ivSavedFormatIcon.visibility =
            if (post.format == PostFormat.REEL) View.VISIBLE else View.GONE

        holder.itemView.setOnClickListener {
            TravelActions.activity(holder.itemView.context)?.let { activity ->
                SavedStorySheet.newInstance(post.id).show(activity.supportFragmentManager, "saved_story")
            }
        }
    }

    override fun getItemCount(): Int = savedPosts.size
}
