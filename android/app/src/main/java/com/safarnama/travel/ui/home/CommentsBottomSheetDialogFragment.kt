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
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogCommentsSheetBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class CommentsBottomSheetDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogCommentsSheetBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var adapter: CommentsAdapter

    private var postId: String = ""
    private var postTitle: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        postId = arguments?.getString(ARG_POST_ID) ?: ""
        postTitle = arguments?.getString(ARG_POST_TITLE) ?: "Comments"
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogCommentsSheetBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvCommentsTitle.text = if (postTitle.isNotBlank()) "Comments • $postTitle" else "Comments"

        // Current user avatar in input
        val currentUser = repository.currentUser.value
        binding.ivCurrentUserAvatar.load(currentUser.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        // Setup comments adapter
        val initialComments = repository.getComments(postId)
        adapter = CommentsAdapter(initialComments)
        binding.rvCommentsList.adapter = adapter
        updateEmptyState(initialComments.size)

        // Observe comments flow
        viewLifecycleOwner.lifecycleScope.launch {
            repository.comments.collectLatest { commentsMap ->
                val updated = commentsMap[postId] ?: emptyList()
                adapter.updateComments(updated)
                updateEmptyState(updated.size)
            }
        }

        // Close button
        binding.btnCloseComments.setOnClickListener {
            dismiss()
        }

        // Post comment button
        binding.btnSubmitComment.setOnClickListener {
            val text = binding.etCommentInput.text.toString().trim()
            if (text.isNotEmpty()) {
                repository.addComment(postId, text)
                binding.etCommentInput.text.clear()
                binding.rvCommentsList.smoothScrollToPosition(adapter.itemCount)
            } else {
                Toast.makeText(requireContext(), "Please write a comment", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateEmptyState(count: Int) {
        if (count == 0) {
            binding.tvNoComments.visibility = View.VISIBLE
            binding.rvCommentsList.visibility = View.GONE
        } else {
            binding.tvNoComments.visibility = View.GONE
            binding.rvCommentsList.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_POST_ID = "arg_post_id"
        private const val ARG_POST_TITLE = "arg_post_title"

        fun newInstance(postId: String, postTitle: String): CommentsBottomSheetDialogFragment {
            return CommentsBottomSheetDialogFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_POST_ID, postId)
                    putString(ARG_POST_TITLE, postTitle)
                }
            }
        }
    }
}
