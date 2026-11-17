package com.safarnama.travel.ui.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.Profile
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentProfileBinding
import com.safarnama.travel.ui.home.ChatDialogFragment
import com.safarnama.travel.ui.home.CommentsBottomSheetDialogFragment
import com.safarnama.travel.ui.home.FeedAdapter
import com.safarnama.travel.ui.home.ThreadBottomSheetDialogFragment
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var userPostsAdapter: FeedAdapter
    private lateinit var mentionsAdapter: FeedAdapter
    private lateinit var savedAdapter: SavedSpotsAdapter

    private var activeTab: Int = TAB_POSTS

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup User Posts Adapter
        val myPosts = repository.posts.value.filter { it.author.id == repository.currentUser.value.id }
        userPostsAdapter = FeedAdapter(
            posts = myPosts,
            onLikeToggle = { repository.toggleLike(it.id) },
            onSaveToggle = { repository.toggleSave(it.id) },
            onOpenComments = { post ->
                CommentsBottomSheetDialogFragment.newInstance(post.id, post.spotName).show(parentFragmentManager, "profile_comments")
            },
            onOpenThread = { post ->
                ThreadBottomSheetDialogFragment.newInstance(post.id).show(parentFragmentManager, "profile_thread")
            }
        )
        binding.rvProfilePosts.adapter = userPostsAdapter

        // Setup Mentions Adapter (Group Travel Trips where current user was mentioned)
        val myMentions = repository.getMentionsForUser(repository.currentUser.value.username)
        mentionsAdapter = FeedAdapter(
            posts = myMentions,
            onLikeToggle = { repository.toggleLike(it.id) },
            onSaveToggle = { repository.toggleSave(it.id) },
            onOpenComments = { post ->
                CommentsBottomSheetDialogFragment.newInstance(post.id, post.spotName).show(parentFragmentManager, "mentions_comments")
            },
            onOpenThread = { post ->
                ThreadBottomSheetDialogFragment.newInstance(post.id).show(parentFragmentManager, "mentions_thread")
            }
        )
        binding.rvProfileMentions.adapter = mentionsAdapter

        // Setup Saved Spots Grid
        val savedList = repository.posts.value.filter { it.isSaved } + repository.reels.value.filter { it.isSaved }
        savedAdapter = SavedSpotsAdapter(savedList)
        binding.rvSavedSpots.adapter = savedAdapter

        // Observe Current User Persona Updates
        viewLifecycleOwner.lifecycleScope.launch {
            repository.currentUser.collectLatest { profile ->
                bindProfile(profile)
                refreshProfileFeeds(profile)
            }
        }

        // Observe Posts Updates
        viewLifecycleOwner.lifecycleScope.launch {
            repository.posts.collectLatest {
                val profile = repository.currentUser.value
                refreshProfileFeeds(profile)
            }
        }

        // Tab Switching: Posts vs Mentions vs Saved
        binding.tabPosts.setOnClickListener { switchTab(TAB_POSTS) }
        binding.tabMentions.setOnClickListener { switchTab(TAB_MENTIONS) }
        binding.tabSaved.setOnClickListener { switchTab(TAB_SAVED) }

        // Settings Button (opens Settings & Following Notifications)
        binding.btnProfileSettings.setOnClickListener {
            val settingsDialog = SettingsDialogFragment.newInstance()
            settingsDialog.show(parentFragmentManager, "settings_dialog")
        }

        // Follow / Unfollow Profile Button
        binding.btnFollowProfile.setOnClickListener {
            val current = repository.currentUser.value
            val isFollowing = repository.toggleFollow(current)
            updateFollowButtonUi(isFollowing)
            val msg = if (isFollowing) "You are now following ${current.fullName} for journey updates" else "Unfollowed ${current.fullName}"
            Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
        }

        // 1-on-1 Direct Message Button
        binding.btnMessageProfile.setOnClickListener {
            val current = repository.currentUser.value
            val chatDialog = ChatDialogFragment.newInstance(current)
            chatDialog.show(parentFragmentManager, "chat_dialog")
        }

        // Switch Persona Mode (Traveler vs Local Guide Demo)
        binding.btnSwitchPersona.setOnClickListener {
            repository.switchUserPersona()
            val currentRole = repository.currentUser.value.activeRole
            val toastMsg = if (currentRole == "local_guide") {
                "Switched to Verified Local Guide Mode (Tenzin Norbu)"
            } else {
                "Switched to Traveler Mode (Aarav Sharma)"
            }
            Toast.makeText(requireContext(), toastMsg, Toast.LENGTH_SHORT).show()
        }
    }

    private fun bindProfile(profile: Profile) {
        binding.tvTopUsername.text = profile.username
        binding.tvProfileFullname.text = profile.fullName
        binding.tvProfileBio.text = profile.bio
        binding.tvProfileHomecity.text = "📍 ${profile.homeCity} • ${profile.languagesSpoken.joinToString(", ")}"

        binding.tvStatTrips.text = "${profile.stats.tripsCompleted}"

        val authoredPosts = repository.posts.value.filter { it.author.id == profile.id }
        binding.tvStatPostsCount.text = "${authoredPosts.size}"

        val savedCount = (repository.posts.value.filter { it.isSaved } + repository.reels.value.filter { it.isSaved }).size
        binding.tvStatSaved.text = "$savedCount"

        if (profile.isVerifiedGuide) {
            val circuits = profile.guideCircuits.joinToString(" • ")
            binding.tvProfileRoleBadge.text = "🛡️ Verified Guide • $circuits"
            binding.btnSwitchPersona.text = "Switch Traveler Mode"
        } else {
            binding.tvProfileRoleBadge.text = "🛂 Indian Explorer • Traveler Trail"
            binding.btnSwitchPersona.text = "Switch Guide Mode"
        }

        binding.ivProfileAvatar.load(profile.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        updateFollowButtonUi(repository.isFollowing(profile.id))
    }

    private fun updateFollowButtonUi(isFollowing: Boolean) {
        val context = requireContext()
        if (isFollowing) {
            binding.btnFollowProfile.text = "Following"
            binding.btnFollowProfile.setBackgroundColor(ContextCompat.getColor(context, R.color.bg_zinc_100))
            binding.btnFollowProfile.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_700))
        } else {
            binding.btnFollowProfile.text = "Follow"
            binding.btnFollowProfile.setBackgroundColor(ContextCompat.getColor(context, R.color.brand_coral))
            binding.btnFollowProfile.setTextColor(ContextCompat.getColor(context, R.color.bg_white))
        }
    }

    private fun refreshProfileFeeds(profile: Profile) {
        val authoredPosts = repository.posts.value.filter { it.author.id == profile.id }
        userPostsAdapter.updatePosts(authoredPosts)
        binding.tvStatPostsCount.text = "${authoredPosts.size}"

        val mentions = repository.getMentionsForUser(profile.username)
        mentionsAdapter.updatePosts(mentions)

        val saved = repository.posts.value.filter { it.isSaved } + repository.reels.value.filter { it.isSaved }
        savedAdapter.updatePosts(saved)
        binding.tvStatSaved.text = "${saved.size}"

        updateTabVisibility(activeTab, authoredPosts.size, mentions.size, saved.size)
    }

    private fun switchTab(tab: Int) {
        activeTab = tab
        val profile = repository.currentUser.value
        val authoredCount = repository.posts.value.count { it.author.id == profile.id }
        val mentionsCount = repository.getMentionsForUser(profile.username).size
        val savedCount = (repository.posts.value.filter { it.isSaved } + repository.reels.value.filter { it.isSaved }).size

        updateTabVisibility(tab, authoredCount, mentionsCount, savedCount)
    }

    private fun updateTabVisibility(tab: Int, authoredCount: Int, mentionsCount: Int, savedCount: Int) {
        val context = requireContext()
        val coral = ContextCompat.getColor(context, R.color.brand_coral)
        val transparent = ContextCompat.getColor(context, android.R.color.transparent)
        val textDark = ContextCompat.getColor(context, R.color.text_zinc_900)
        val textMuted = ContextCompat.getColor(context, R.color.text_zinc_500)

        when (tab) {
            TAB_POSTS -> {
                binding.rvProfilePosts.visibility = if (authoredCount > 0) View.VISIBLE else View.GONE
                binding.rvProfileMentions.visibility = View.GONE
                binding.rvSavedSpots.visibility = View.GONE
                binding.tvProfileEmptyState.visibility = if (authoredCount == 0) View.VISIBLE else View.GONE
                binding.tvProfileEmptyState.text = "No posts or tweets shared yet. Tap + to start your travel journal!"

                binding.indicatorPosts.setBackgroundColor(coral)
                binding.indicatorMentions.setBackgroundColor(transparent)
                binding.indicatorSaved.setBackgroundColor(transparent)
                binding.tvTabPostsLabel.setTextColor(textDark)
                binding.tvTabMentionsLabel.setTextColor(textMuted)
                binding.tvTabSavedLabel.setTextColor(textMuted)
            }
            TAB_MENTIONS -> {
                binding.rvProfilePosts.visibility = View.GONE
                binding.rvProfileMentions.visibility = if (mentionsCount > 0) View.VISIBLE else View.GONE
                binding.rvSavedSpots.visibility = View.GONE
                binding.tvProfileEmptyState.visibility = if (mentionsCount == 0) View.VISIBLE else View.GONE
                binding.tvProfileEmptyState.text = "No group travel mentions yet. When friends travel with you and tag your account, their trips appear here! 👥"

                binding.indicatorPosts.setBackgroundColor(transparent)
                binding.indicatorMentions.setBackgroundColor(coral)
                binding.indicatorSaved.setBackgroundColor(transparent)
                binding.tvTabPostsLabel.setTextColor(textMuted)
                binding.tvTabMentionsLabel.setTextColor(textDark)
                binding.tvTabSavedLabel.setTextColor(textMuted)
            }
            TAB_SAVED -> {
                binding.rvProfilePosts.visibility = View.GONE
                binding.rvProfileMentions.visibility = View.GONE
                binding.rvSavedSpots.visibility = if (savedCount > 0) View.VISIBLE else View.GONE
                binding.tvProfileEmptyState.visibility = if (savedCount == 0) View.VISIBLE else View.GONE
                binding.tvProfileEmptyState.text = "No saved spots yet. Bookmark posts or reels to build your bucket list!"

                binding.indicatorPosts.setBackgroundColor(transparent)
                binding.indicatorMentions.setBackgroundColor(transparent)
                binding.indicatorSaved.setBackgroundColor(coral)
                binding.tvTabPostsLabel.setTextColor(textMuted)
                binding.tvTabMentionsLabel.setTextColor(textMuted)
                binding.tvTabSavedLabel.setTextColor(textDark)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val TAB_POSTS = 0
        private const val TAB_MENTIONS = 1
        private const val TAB_SAVED = 2
    }
}
