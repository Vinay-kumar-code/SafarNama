package com.safarnama.travel.ui.reels

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.viewpager2.widget.ViewPager2
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentReelsBinding
import com.safarnama.travel.ui.home.CommentsBottomSheetDialogFragment
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class ReelsFragment : Fragment() {

    private var _binding: FragmentReelsBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var reelsAdapter: ReelVideoAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReelsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        reelsAdapter = ReelVideoAdapter(
            reels = repository.reels.value,
            onLikeToggle = { reel ->
                val isLiked = repository.toggleLike(reel.id)
                val msg = if (isLiked) "Liked ${reel.spotName}" else "Unliked"
                Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            },
            onSaveToggle = { reel ->
                val isSaved = repository.toggleSave(reel.id)
                val msg = if (isSaved) "Saved to your Passport" else "Removed from saved"
                Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
            },
            onOpenComments = { reel ->
                val commentsSheet = CommentsBottomSheetDialogFragment.newInstance(reel.id, reel.spotName)
                commentsSheet.show(parentFragmentManager, "reel_comments_sheet")
            }
        )

        binding.viewpagerReels.apply {
            orientation = ViewPager2.ORIENTATION_VERTICAL
            adapter = reelsAdapter
            registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
                override fun onPageSelected(position: Int) {
                    reelsAdapter.playPosition(position)
                }
            })
        }

        // Play initial reel after layout
        val targetPost = arguments?.getString("post_id")
        binding.viewpagerReels.post {
            val pager = _binding?.viewpagerReels ?: return@post
            val position = repository.reels.value.indexOfFirst { it.id == targetPost }.coerceAtLeast(0)
            pager.setCurrentItem(position, false)
            reelsAdapter.playPosition(position)
        }

        viewLifecycleOwner.lifecycleScope.launch {
            repository.reels.collectLatest { list ->
                reelsAdapter.updateReels(list)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null && ::reelsAdapter.isInitialized) {
            reelsAdapter.playPosition(binding.viewpagerReels.currentItem)
        }
    }

    override fun onPause() {
        super.onPause()
        if (::reelsAdapter.isInitialized) {
            reelsAdapter.pauseAll()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (::reelsAdapter.isInitialized) {
            reelsAdapter.releaseAll()
        }
        _binding = null
    }
}
