package com.safarnama.travel.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.Profile
import com.safarnama.travel.databinding.ItemGuideCardBinding

class GuidesAdapter(
    private var guides: List<Profile>,
    private val onGuideClick: (Profile) -> Unit
) : RecyclerView.Adapter<GuidesAdapter.GuideViewHolder>() {

    fun updateGuides(newGuides: List<Profile>) {
        guides = newGuides
        notifyDataSetChanged()
    }

    inner class GuideViewHolder(val binding: ItemGuideCardBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GuideViewHolder {
        val binding = ItemGuideCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return GuideViewHolder(binding)
    }

    override fun onBindViewHolder(holder: GuideViewHolder, position: Int) {
        val guide = guides[position]
        holder.binding.tvGuideName.text = guide.fullName
        holder.binding.tvGuideLocation.text = guide.homeCity
        holder.binding.tvGuideCredibility.text = "★ ${guide.credibilityScore} pts"

        holder.binding.ivGuideAvatar.load(guide.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        holder.itemView.setOnClickListener {
            onGuideClick(guide)
        }
    }

    override fun getItemCount(): Int = guides.size
}
