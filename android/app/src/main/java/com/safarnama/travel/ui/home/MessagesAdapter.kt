package com.safarnama.travel.ui.home

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.safarnama.travel.data.DirectMessage
import com.safarnama.travel.databinding.ItemMessageBubbleBinding

class MessagesAdapter(
    private var messages: List<DirectMessage>
) : RecyclerView.Adapter<MessagesAdapter.MessageViewHolder>() {

    fun updateMessages(newMessages: List<DirectMessage>) {
        messages = newMessages
        notifyDataSetChanged()
    }

    inner class MessageViewHolder(val binding: ItemMessageBubbleBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val binding = ItemMessageBubbleBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return MessageViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        val msg = messages[position]
        if (msg.isFromMe) {
            holder.binding.layoutSentMessage.visibility = View.VISIBLE
            holder.binding.layoutReceivedMessage.visibility = View.GONE
            holder.binding.tvSentText.text = msg.text
            holder.binding.tvSentTime.text = msg.timestamp
        } else {
            holder.binding.layoutSentMessage.visibility = View.GONE
            holder.binding.layoutReceivedMessage.visibility = View.VISIBLE
            holder.binding.tvReceivedText.text = msg.text
            holder.binding.tvReceivedTime.text = msg.timestamp
        }
    }

    override fun getItemCount(): Int = messages.size
}
