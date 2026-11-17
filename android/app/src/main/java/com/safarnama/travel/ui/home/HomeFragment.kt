package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentHomeBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var feedAdapter: FeedAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup Feed Adapter supporting both Posts (Photos) and Tweets (Threads)
        feedAdapter = FeedAdapter(
            posts = repository.posts.value,
            onLikeToggle = { post ->
                val isLiked = repository.toggleLike(post.id)
                val msg = if (isLiked) "Liked ${post.spotName}" else "Unliked"
                Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            },
            onSaveToggle = { post ->
                val isSaved = repository.toggleSave(post.id)
                val msg = if (isSaved) "Saved to your Travel Passport" else "Removed from saved"
                Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            },
            onOpenComments = { post ->
                val commentsSheet = CommentsBottomSheetDialogFragment.newInstance(post.id, post.spotName)
                commentsSheet.show(parentFragmentManager, "comments_sheet")
            },
            onOpenThread = { post ->
                val threadSheet = ThreadBottomSheetDialogFragment.newInstance(post.id)
                threadSheet.show(parentFragmentManager, "thread_sheet")
            }
        )
        binding.rvFeed.adapter = feedAdapter

        // + Button for creating new Tweet, Post or Reel
        binding.btnCreateContent.setOnClickListener {
            val createSheet = CreateContentBottomSheetDialogFragment.newInstance()
            createSheet.show(parentFragmentManager, "create_content_sheet")
        }

        // Direct Messages (1-on-1 messaging)
        binding.btnDirectMessages.setOnClickListener {
            val dmDialog = DirectMessagesDialogFragment.newInstance()
            dmDialog.show(parentFragmentManager, "dm_dialog")
        }

        // Observe Feed Posts Flow
        viewLifecycleOwner.lifecycleScope.launch {
            repository.posts.collectLatest { updatedList ->
                feedAdapter.updatePosts(updatedList)
            }
        }

        // Trigger background refresh from Supabase REST API
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                binding.homeProgressBar.visibility = View.VISIBLE
                repository.refreshData()
            } finally {
                binding.homeProgressBar.visibility = View.GONE
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
