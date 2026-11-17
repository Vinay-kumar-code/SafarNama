package com.safarnama.travel.ui.home

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import com.safarnama.travel.R
import com.safarnama.travel.databinding.ItemCarouselImageBinding

class CarouselImageAdapter(
    private val images: List<String>
) : RecyclerView.Adapter<CarouselImageAdapter.CarouselViewHolder>() {

    inner class CarouselViewHolder(val binding: ItemCarouselImageBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CarouselViewHolder {
        val binding = ItemCarouselImageBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return CarouselViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CarouselViewHolder, position: Int) {
        val imageUrl = images[position]
        holder.binding.ivCarouselImage.load(imageUrl) {
            crossfade(true)
            placeholder(R.drawable.bg_card_rounded)
            error(R.drawable.bg_card_rounded)
        }
    }

    override fun getItemCount(): Int = images.size
}
