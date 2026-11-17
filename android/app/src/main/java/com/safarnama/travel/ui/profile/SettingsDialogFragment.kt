package com.safarnama.travel.ui.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogSettingsBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class SettingsDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogSettingsBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var adapter: FollowedAccountsAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogSettingsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnCloseSettings.setOnClickListener { dismiss() }

        // Setup followed accounts adapter
        adapter = FollowedAccountsAdapter(
            accounts = repository.followedAccounts.value,
            onToggleNotification = { setting ->
                val enabled = repository.toggleNotification(setting.profile.id)
                val statusText = if (enabled) "Notifications turned ON for @${setting.profile.username}" else "Notifications muted for @${setting.profile.username}"
                Toast.makeText(requireContext(), statusText, Toast.LENGTH_SHORT).show()
            },
            onUnfollow = { setting ->
                repository.toggleFollow(setting.profile)
                Toast.makeText(requireContext(), "Unfollowed @${setting.profile.username}", Toast.LENGTH_SHORT).show()
            }
        )
        binding.rvFollowedAccounts.adapter = adapter
        updateEmptyState(repository.followedAccounts.value.size)

        // Observe followed accounts
        viewLifecycleOwner.lifecycleScope.launch {
            repository.followedAccounts.collectLatest { list ->
                adapter.updateAccounts(list)
                updateEmptyState(list.size)
            }
        }

        // Admin Create Destination Button
        binding.btnAdminAddDestination.setOnClickListener {
            val adminDialog = AdminDestinationDialogFragment.newInstance()
            adminDialog.show(parentFragmentManager, "admin_dest_dialog")
        }
    }

    private fun updateEmptyState(count: Int) {
        if (count == 0) {
            binding.tvNoFollowedAccounts.visibility = View.VISIBLE
            binding.rvFollowedAccounts.visibility = View.GONE
        } else {
            binding.tvNoFollowedAccounts.visibility = View.GONE
            binding.rvFollowedAccounts.visibility = View.VISIBLE
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        fun newInstance(): SettingsDialogFragment {
            return SettingsDialogFragment()
        }
    }
}
