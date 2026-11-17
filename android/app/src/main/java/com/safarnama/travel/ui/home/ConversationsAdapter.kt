package com.safarnama.travel.ui.home

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.DirectMessage
import com.safarnama.travel.data.Profile
import com.safarnama.travel.databinding.ItemConversationBinding

data class ConversationItem(
    val partner: Profile,
    val lastMessage: DirectMessage?
)

class ConversationsAdapter(
    private var conversations: List<ConversationItem>,
    private val onConversationClick: (Profile) -> Unit
) : RecyclerView.Adapter<ConversationsAdapter.ConversationViewHolder>() {

    fun updateConversations(newList: List<ConversationItem>) {
        conversations = newList
        notifyDataSetChanged()
    }

    inner class ConversationViewHolder(val binding: ItemConversationBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ConversationViewHolder {
        val binding = ItemConversationBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ConversationViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ConversationViewHolder, position: Int) {
        val item = conversations[position]
        holder.binding.tvChatPartnerName.text = item.partner.fullName
        holder.binding.tvChatLastMessage.text = item.lastMessage?.text ?: "Start a travel chat..."
        holder.binding.tvChatTimestamp.text = item.lastMessage?.timestamp ?: ""

        holder.binding.ivChatPartnerAvatar.load(item.partner.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        holder.itemView.setOnClickListener {
            onConversationClick(item.partner)
        }
    }

    override fun getItemCount(): Int = conversations.size
}
