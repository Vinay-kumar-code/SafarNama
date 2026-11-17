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
            com.safarnama.travel.ui.journeys.TravelerSheet.newInstance(guide.id).show(parentFragmentManager, "traveler")
        }
        binding.rvGuidesSpotlight.adapter = guidesAdapter

        // Setup Destinations Grid
        destAdapter = DestinationGridAdapter(repository.destinations.value) { dest ->
            com.safarnama.travel.ui.journeys.DestinationSheet.newInstance(dest.id).show(parentFragmentManager, "destination")
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
        binding.chipAll.setOnClickListener { binding.etSearch.setText("") }
        binding.chipHimalayas.setOnClickListener { binding.etSearch.setText("Himalaya") }
        binding.chipHeritage.setOnClickListener { binding.etSearch.setText("Heritage") }
        binding.chipMonsoons.setOnClickListener { binding.etSearch.setText("Meghalaya") }
        binding.chipGuides.setOnClickListener {
            binding.rvGuidesSpotlight.requestFocus()
            binding.rvGuidesSpotlight.parent.requestChildFocus(binding.rvGuidesSpotlight, binding.rvGuidesSpotlight)
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
