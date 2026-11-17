package com.safarnama.travel.ui.home

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.StoryHighlight
import com.safarnama.travel.databinding.ItemStoryCircleBinding

class StoriesAdapter(
    private val stories: List<StoryHighlight>,
    private val onStoryClick: (StoryHighlight) -> Unit
) : RecyclerView.Adapter<StoriesAdapter.StoryViewHolder>() {

    inner class StoryViewHolder(val binding: ItemStoryCircleBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StoryViewHolder {
        val binding = ItemStoryCircleBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return StoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StoryViewHolder, position: Int) {
        val story = stories[position]
        holder.binding.tvStoryTitle.text = story.title
        holder.binding.ivStoryAvatar.load(story.coverUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        holder.itemView.setOnClickListener {
            onStoryClick(story)
        }
    }

    override fun getItemCount(): Int = stories.size
}
