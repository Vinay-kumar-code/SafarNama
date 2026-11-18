package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.DialogFragment
import androidx.lifecycle.lifecycleScope
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.Profile
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogChatViewBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class ChatDialogFragment : DialogFragment() {

    private var _binding: DialogChatViewBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var adapter: MessagesAdapter

    private var partnerId: String = ""
    private var partnerName: String = ""
    private var partnerAvatar: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setStyle(STYLE_NORMAL, android.R.style.Theme_Material_Light_NoActionBar_Fullscreen)
        partnerId = arguments?.getString(ARG_PARTNER_ID) ?: ""
        partnerName = arguments?.getString(ARG_PARTNER_NAME) ?: "Traveler"
        partnerAvatar = arguments?.getString(ARG_PARTNER_AVATAR) ?: ""
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogChatViewBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvChatHeaderName.text = "$partnerName · Local preview"
        binding.etChatInput.hint = "Write a message saved on this device"
        binding.ivChatHeaderAvatar.load(partnerAvatar) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        binding.btnBackChat.setOnClickListener {
            dismiss()
        }

        // Messages adapter
        val initialMessages = repository.getDirectMessages(partnerId)
        adapter = MessagesAdapter(initialMessages)
        binding.rvChatMessages.adapter = adapter
        if (initialMessages.isNotEmpty()) {
            binding.rvChatMessages.scrollToPosition(initialMessages.size - 1)
        }

        // Observe direct messages flow
        viewLifecycleOwner.lifecycleScope.launch {
            repository.directMessages.collectLatest { messagesMap ->
                val updated = messagesMap[partnerId] ?: emptyList()
                adapter.updateMessages(updated)
                if (updated.isNotEmpty()) {
                    binding.rvChatMessages.smoothScrollToPosition(updated.size - 1)
                }
            }
        }

        // Send button
        binding.btnSendMessage.setOnClickListener {
            val text = binding.etChatInput.text.toString().trim()
            if (text.isNotEmpty()) {
                repository.sendDirectMessage(partnerId, text)
                binding.etChatInput.text.clear()
            } else {
                Toast.makeText(requireContext(), "Write a message", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_PARTNER_ID = "arg_partner_id"
        private const val ARG_PARTNER_NAME = "arg_partner_name"
        private const val ARG_PARTNER_AVATAR = "arg_partner_avatar"

        fun newInstance(partner: Profile): ChatDialogFragment {
            return ChatDialogFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_PARTNER_ID, partner.id)
                    putString(ARG_PARTNER_NAME, partner.fullName)
                    putString(ARG_PARTNER_AVATAR, partner.avatarUrl)
                }
            }
        }
    }
}
