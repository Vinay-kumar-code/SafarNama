package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.tabs.TabLayout
import com.safarnama.travel.data.PostFormat
import com.safarnama.travel.data.StoryHighlight
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentHomeBinding
import com.safarnama.travel.ui.journeys.DestinationSheet
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
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

        binding.rvDestinationStories.layoutManager = LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false)
        viewLifecycleOwner.lifecycleScope.launch {
            repository.destinations.collectLatest { places ->
                val stories = listOf(StoryHighlight("create", "Your story", repository.currentUser.value.avatarUrl)) +
                    places.map { StoryHighlight(it.id, it.name, it.coverImage) }
                binding.rvDestinationStories.adapter = StoriesAdapter(stories) { story ->
                    if (story.id == "create") binding.btnCreateContent.performClick()
                    else DestinationSheet.newInstance(story.id).show(parentFragmentManager, "destination_story")
                }
            }
        }

        listOf("For you", "Following", "Travel notes").forEach {
            binding.feedFilters.addTab(binding.feedFilters.newTab().setText(it))
        }
        binding.feedFilters.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab) { updateFeed() }
            override fun onTabUnselected(tab: TabLayout.Tab) = Unit
            override fun onTabReselected(tab: TabLayout.Tab) = Unit
        })
        viewLifecycleOwner.lifecycleScope.launch {
            combine(repository.posts, repository.followedAccounts) { _, _ -> Unit }.collectLatest { updateFeed() }
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

    private fun updateFeed() {
        val filter = binding.feedFilters.selectedTabPosition
        val posts = repository.posts.value.filter { post ->
            when (filter) {
                1 -> repository.isFollowing(post.author.id)
                2 -> post.format in setOf(PostFormat.TWEET, PostFormat.QUICK_TIP)
                else -> true
            }
        }
        feedAdapter.updatePosts(posts)
        binding.feedEmpty.visibility = if (posts.isEmpty()) View.VISIBLE else View.GONE
        binding.feedEmpty.text = if (filter == 1) "Open a traveler’s profile and follow their journey to see their stories here." else "Share a travel note to start the conversation."
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
