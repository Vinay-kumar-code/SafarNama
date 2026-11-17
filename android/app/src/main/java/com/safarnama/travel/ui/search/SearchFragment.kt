package com.safarnama.travel.ui.search

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.safarnama.travel.data.DestinationHub
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentSearchBinding
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class SearchFragment : Fragment() {

    private var _binding: FragmentSearchBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance
    private lateinit var guidesAdapter: GuidesAdapter
    private lateinit var destAdapter: DestinationGridAdapter
    private var allDestinations: List<DestinationHub> = emptyList()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentSearchBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Setup Guides
        guidesAdapter = GuidesAdapter(repository.guides.value) { guide ->
            Toast.makeText(requireContext(), "Opening profile for ${guide.fullName} (${guide.homeCity})", Toast.LENGTH_SHORT).show()
        }
        binding.rvGuidesSpotlight.adapter = guidesAdapter

        // Setup Destinations Grid
        destAdapter = DestinationGridAdapter(repository.destinations.value) { dest ->
            Toast.makeText(requireContext(), "Opening ${dest.name} Hub • ${dest.state}", Toast.LENGTH_SHORT).show()
        }
        binding.rvDestinationsGrid.adapter = destAdapter

        // Flow Collections
        viewLifecycleOwner.lifecycleScope.launch {
            repository.guides.collectLatest { list ->
                guidesAdapter.updateGuides(list)
            }
        }

        viewLifecycleOwner.lifecycleScope.launch {
            repository.destinations.collectLatest { list ->
                allDestinations = list
                filterDestinations(binding.etSearch.text.toString())
            }
        }

        // Search Input Filtering
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val query = s?.toString() ?: ""
                binding.btnClearSearch.visibility = if (query.isNotEmpty()) View.VISIBLE else View.GONE
                filterDestinations(query)
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        binding.btnClearSearch.setOnClickListener {
            binding.etSearch.setText("")
        }

        // Category Filter Chips
        binding.chipAll.setOnClickListener { filterDestinations("") }
        binding.chipHimalayas.setOnClickListener { filterDestinations("Himalaya") }
        binding.chipHeritage.setOnClickListener { filterDestinations("Heritage") }
        binding.chipMonsoons.setOnClickListener { filterDestinations("Meghalaya") }
        binding.chipGuides.setOnClickListener {
            Toast.makeText(requireContext(), "Showing ${repository.guides.value.size} active verified guides", Toast.LENGTH_SHORT).show()
        }
    }

    private fun filterDestinations(query: String) {
        if (query.isBlank()) {
            destAdapter.updateDestinations(allDestinations)
        } else {
            val lower = query.lowercase().trim()
            val filtered = allDestinations.filter {
                it.name.lowercase().contains(lower) ||
                it.state.lowercase().contains(lower) ||
                it.region.lowercase().contains(lower) ||
                it.tagline.lowercase().contains(lower)
            }
            destAdapter.updateDestinations(filtered)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
