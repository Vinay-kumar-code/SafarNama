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
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var stampsAdapter: PassportStampsAdapter
    private lateinit var savedAdapter: SavedSpotsAdapter

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

        // Setup Passport Stamps Grid
        stampsAdapter = PassportStampsAdapter(repository.passportStamps.value)
        binding.rvPassportStamps.adapter = stampsAdapter

        // Setup Saved Spots Grid
        val savedList = repository.posts.value.filter { it.isSaved } + repository.reels.value.filter { it.isSaved }
        savedAdapter = SavedSpotsAdapter(savedList)
        binding.rvSavedSpots.adapter = savedAdapter

        // Observe Current User Persona Updates
        viewLifecycleOwner.lifecycleScope.launch {
            repository.currentUser.collectLatest { profile ->
                bindProfile(profile)
            }
        }

        // Observe Saved Spots Updates
        viewLifecycleOwner.lifecycleScope.launch {
            repository.posts.collectLatest { posts ->
                val updatedSaved = posts.filter { it.isSaved } + repository.reels.value.filter { it.isSaved }
                savedAdapter.updatePosts(updatedSaved)
                binding.tvStatSaved.text = "${updatedSaved.size}"
            }
        }

        // Tab Switching (Digital Passport vs Saved Spots)
        binding.tabStamps.setOnClickListener {
            switchTab(showStamps = true)
        }
        binding.tabSaved.setOnClickListener {
            switchTab(showStamps = false)
        }

        // Edit Profile Button
        binding.btnEditProfile.setOnClickListener {
            Toast.makeText(requireContext(), "Opening Travel Passport Profile Editor", Toast.LENGTH_SHORT).show()
        }

        // Switch Persona Mode (Traveler vs Local Guide Demo)
        binding.btnSwitchPersona.setOnClickListener {
            repository.switchUserPersona()
            val currentRole = repository.currentUser.value.activeRole
            val toastMsg = if (currentRole == "local_guide") {
                "Switched to Verified Local Guide Studio Mode (Tenzin Norbu)"
            } else {
                "Switched to Traveler Mode (Aarav Sharma)"
            }
            Toast.makeText(requireContext(), toastMsg, Toast.LENGTH_SHORT).show()
        }
    }

    private fun bindProfile(profile: Profile) {
        binding.tvProfileFullname.text = profile.fullName
        binding.tvProfileBio.text = profile.bio
        binding.tvProfileHomecity.text = "📍 ${profile.homeCity} • ${profile.languagesSpoken.joinToString(", ")}"

        binding.tvStatTrips.text = "${profile.stats.tripsCompleted}"
        binding.tvStatStamps.text = "${profile.passportStampsCount}"
        binding.tvStatCredibility.text = "${profile.credibilityScore}"

        if (profile.isVerifiedGuide) {
            val circuits = profile.guideCircuits.joinToString(" • ")
            binding.tvProfileRoleBadge.text = "🛡️ Verified Guide • $circuits"
            binding.btnSwitchPersona.text = "Switch Traveler Mode"
        } else {
            binding.tvProfileRoleBadge.text = "🛂 Indian Explorer • Traveler Passport"
            binding.btnSwitchPersona.text = "Switch Guide Mode"
        }

        binding.ivProfileAvatar.load(profile.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }
    }

    private fun switchTab(showStamps: Boolean) {
        val context = requireContext()
        if (showStamps) {
            binding.rvPassportStamps.visibility = View.VISIBLE
            binding.rvSavedSpots.visibility = View.GONE
            binding.indicatorStamps.setBackgroundColor(ContextCompat.getColor(context, R.color.brand_coral))
            binding.indicatorSaved.setBackgroundColor(ContextCompat.getColor(context, android.R.color.transparent))
            binding.tvTabStampsLabel.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_900))
            binding.tvTabSavedLabel.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_500))
        } else {
            binding.rvPassportStamps.visibility = View.GONE
            binding.rvSavedSpots.visibility = View.VISIBLE
            binding.indicatorStamps.setBackgroundColor(ContextCompat.getColor(context, android.R.color.transparent))
            binding.indicatorSaved.setBackgroundColor(ContextCompat.getColor(context, R.color.brand_coral))
            binding.tvTabStampsLabel.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_500))
            binding.tvTabSavedLabel.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_900))
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
