package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.safarnama.travel.data.SeedData
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentHomeBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class HomeFragment : Fragment() {

    private var _binding: FragmentHomeBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var feedAdapter: FeedAdapter
    private lateinit var storiesAdapter: StoriesAdapter

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

        // Setup Stories Carousel
        storiesAdapter = StoriesAdapter(SeedData.STORY_HIGHLIGHTS) { story ->
            Toast.makeText(requireContext(), "Viewing highlight: ${story.title}", Toast.LENGTH_SHORT).show()
        }
        binding.rvStories.adapter = storiesAdapter

        // Setup Feed Adapter
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
            }
        )
        binding.rvFeed.adapter = feedAdapter

        // Observe Flow Updates
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
