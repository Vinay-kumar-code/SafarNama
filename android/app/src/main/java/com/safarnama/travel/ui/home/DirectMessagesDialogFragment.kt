package com.safarnama.travel.ui.home

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.lifecycleScope
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogDirectMessagesBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class DirectMessagesDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogDirectMessagesBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var adapter: ConversationsAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogDirectMessagesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnCloseDms.setOnClickListener { dismiss() }

        val guides = repository.guides.value
        val convItems = guides.map { guide ->
            val msgs = repository.getDirectMessages(guide.id)
            ConversationItem(partner = guide, lastMessage = msgs.lastOrNull())
        }

        adapter = ConversationsAdapter(convItems) { partner ->
            // Open 1-on-1 Chat
            val chatDialog = ChatDialogFragment.newInstance(partner)
            chatDialog.show(parentFragmentManager, "chat_dialog")
        }
        binding.rvConversations.adapter = adapter

        // Observe updates
        viewLifecycleOwner.lifecycleScope.launch {
            repository.directMessages.collectLatest { msgMap ->
                val updatedItems = repository.guides.value.map { guide ->
                    val msgs = msgMap[guide.id] ?: emptyList()
                    ConversationItem(partner = guide, lastMessage = msgs.lastOrNull())
                }
                adapter.updateConversations(updatedItems)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        fun newInstance(): DirectMessagesDialogFragment {
            return DirectMessagesDialogFragment()
        }
    }
}
