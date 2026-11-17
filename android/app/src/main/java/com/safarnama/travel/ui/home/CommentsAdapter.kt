package com.safarnama.travel.ui.home

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.Comment
import com.safarnama.travel.databinding.ItemCommentBinding

class CommentsAdapter(
    private var comments: List<Comment>,
    private val onLikeComment: ((Comment) -> Unit)? = null
) : RecyclerView.Adapter<CommentsAdapter.CommentViewHolder>() {

    fun updateComments(newComments: List<Comment>) {
        comments = newComments
        notifyDataSetChanged()
    }

    inner class CommentViewHolder(val binding: ItemCommentBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CommentViewHolder {
        val binding = ItemCommentBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return CommentViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CommentViewHolder, position: Int) {
        val comment = comments[position]
        holder.binding.tvCommentUsername.text = comment.author.username
        holder.binding.tvCommentText.text = comment.text
        holder.binding.tvCommentTime.text = comment.createdAt

        holder.binding.ivCommentAvatar.load(comment.author.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        holder.binding.btnCommentLike.setOnClickListener {
            onLikeComment?.invoke(comment)
        }
    }

    override fun getItemCount(): Int = comments.size
}
