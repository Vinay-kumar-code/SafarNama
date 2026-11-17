package com.safarnama.travel.ui.search

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.safarnama.travel.R
import com.safarnama.travel.data.DestinationHub
import com.safarnama.travel.databinding.ItemDestinationGridBinding

class DestinationGridAdapter(
    private var destinations: List<DestinationHub>,
    private val onDestinationClick: (DestinationHub) -> Unit
) : RecyclerView.Adapter<DestinationGridAdapter.DestinationViewHolder>() {

    fun updateDestinations(newDestinations: List<DestinationHub>) {
        destinations = newDestinations
        notifyDataSetChanged()
    }

    inner class DestinationViewHolder(val binding: ItemDestinationGridBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DestinationViewHolder {
        val binding = ItemDestinationGridBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return DestinationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DestinationViewHolder, position: Int) {
        val dest = destinations[position]
        holder.binding.tvDestName.text = dest.name
        holder.binding.tvDestTagline.text = dest.tagline
        holder.binding.tvDestRegion.text = dest.state
        holder.binding.tvDestRating.text = "★ ${dest.averageRating}"
        holder.binding.tvDestGuidesCount.text = "• ${dest.guideCount} Guides"

        holder.binding.ivDestCover.load(dest.coverImage) {
            crossfade(true)
            placeholder(R.drawable.bg_card_rounded)
            error(R.drawable.bg_card_rounded)
        }

        holder.itemView.setOnClickListener {
            onDestinationClick(dest)
        }
    }

    override fun getItemCount(): Int = destinations.size
}
