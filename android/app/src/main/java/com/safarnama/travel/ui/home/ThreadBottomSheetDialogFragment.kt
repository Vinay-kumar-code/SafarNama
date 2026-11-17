package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import coil.load
import coil.transform.CircleCropTransformation
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.safarnama.travel.R
import com.safarnama.travel.data.Post
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogThreadSheetBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class ThreadBottomSheetDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogThreadSheetBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var adapter: CommentsAdapter

    private var postId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        postId = arguments?.getString(ARG_POST_ID) ?: ""
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogThreadSheetBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val parentPost = repository.posts.value.find { it.id == postId } ?: return

        // Bind Parent Tweet
        binding.tvThreadParentFullname.text = parentPost.author.fullName
        binding.tvThreadParentUsername.text = "@${parentPost.author.username}"
        binding.tvThreadParentTime.text = parentPost.createdAt
        binding.tvThreadParentContent.text = parentPost.caption

        if (!parentPost.destinationName.isNullOrBlank()) {
            binding.tvThreadParentDestTag.visibility = View.VISIBLE
            binding.tvThreadParentDestTag.text = "📍 ${parentPost.destinationName}"
        } else {
            binding.tvThreadParentDestTag.visibility = View.GONE
        }

        binding.ivThreadParentAvatar.load(parentPost.author.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        // Current user avatar for reply input
        val currentUser = repository.currentUser.value
        binding.ivThreadReplyUserAvatar.load(currentUser.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }
        binding.etThreadReplyInput.hint = "Reply to @${parentPost.author.username}..."

        // Setup replies adapter
        val initialReplies = repository.getComments(postId)
        adapter = CommentsAdapter(initialReplies)
        binding.rvThreadReplies.adapter = adapter
        updateEmptyState(initialReplies.size)

        // Observe replies
        viewLifecycleOwner.lifecycleScope.launch {
            repository.comments.collectLatest { commentsMap ->
                val updated = commentsMap[postId] ?: emptyList()
                adapter.updateComments(updated)
                updateEmptyState(updated.size)
            }
        }

        // Close button
        binding.btnCloseThread.setOnClickListener {
            dismiss()
        }

        // Reply submission
        binding.btnSubmitThreadReply.setOnClickListener {
            val replyText = binding.etThreadReplyInput.text.toString().trim()
            if (replyText.isNotEmpty()) {
                repository.addComment(postId, replyText, parentCommentId = parentPost.id)
                binding.etThreadReplyInput.text.clear()
            } else {
                Toast.makeText(requireContext(), "Write a reply to join the thread", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateEmptyState(count: Int) {
        if (count == 0) {
            binding.tvNoThreadReplies.visibility = View.VISIBLE
            binding.rvThreadReplies.visibility = View.GONE
        } else {
            binding.tvNoThreadReplies.visibility = View.GONE
            binding.rvThreadReplies.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_POST_ID = "arg_post_id"

        fun newInstance(postId: String): ThreadBottomSheetDialogFragment {
            return ThreadBottomSheetDialogFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_POST_ID, postId)
                }
            }
        }
    }
}
