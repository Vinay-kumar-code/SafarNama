package com.safarnama.travel.ui.profile

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import com.safarnama.travel.data.PassportStamp
import com.safarnama.travel.databinding.ItemPassportStampBinding

class PassportStampsAdapter(
    private var stamps: List<PassportStamp>
) : RecyclerView.Adapter<PassportStampsAdapter.StampViewHolder>() {

    fun updateStamps(newStamps: List<PassportStamp>) {
        stamps = newStamps
        notifyDataSetChanged()
    }

    inner class StampViewHolder(val binding: ItemPassportStampBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): StampViewHolder {
        val binding = ItemPassportStampBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return StampViewHolder(binding)
    }

    override fun onBindViewHolder(holder: StampViewHolder, position: Int) {
        val stamp = stamps[position]
        holder.binding.tvStampState.text = stamp.state
        holder.binding.tvStampCircuit.text = stamp.circuit
        holder.binding.tvStampDate.text = "STAMPED • ${stamp.visitedDate}"
        holder.binding.tvStampStatus.text = if (stamp.isVerified) "VERIFIED" else "PENDING"

        holder.itemView.setOnClickListener {
            Toast.makeText(
                holder.itemView.context,
                "Digital Passport Stamp: ${stamp.state} (${stamp.circuit})",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    override fun getItemCount(): Int = stamps.size
}
