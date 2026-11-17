package com.safarnama.travel.ui.profile

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.safarnama.travel.data.DestinationHub
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.DialogAdminDestinationBinding
import java.util.UUID

class AdminDestinationDialogFragment : BottomSheetDialogFragment() {

    private var _binding: DialogAdminDestinationBinding? = null
    private val binding get() = _binding!!

    private val repository = TravelRepository.instance

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = DialogAdminDestinationBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.btnCloseAdminDest.setOnClickListener { dismiss() }

        binding.btnSaveDestination.setOnClickListener {
            val name = binding.etAdminDestName.text.toString().trim()
            val state = binding.etAdminDestState.text.toString().trim()
            val region = binding.etAdminDestRegion.text.toString().trim().ifEmpty { state }
            val tagline = binding.etAdminDestTagline.text.toString().trim().ifEmpty { "Explore $name with verified local guides" }
            val image = binding.etAdminDestImage.text.toString().trim().ifEmpty {
                "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800"
            }
            val overview = binding.etAdminDestOverview.text.toString().trim().ifEmpty {
                "Historic cultural destination featuring scenic viewpoints, ancient temples, and local trekking trails."
            }
            val lat = binding.etAdminDestLat.text.toString().toDoubleOrNull() ?: 15.3350
            val lng = binding.etAdminDestLng.text.toString().toDoubleOrNull() ?: 76.4600

            if (name.isEmpty() || state.isEmpty()) {
                Toast.makeText(requireContext(), "Please provide at least Name and State", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            val slug = name.lowercase().replace(" ", "-").replace("&", "and")
            val newHub = DestinationHub(
                id = "dest-${UUID.randomUUID().toString().take(8)}",
                slug = slug,
                name = name,
                state = state,
                region = region,
                tagline = tagline,
                coverImage = image,
                galleryImages = listOf(image),
                latitude = lat,
                longitude = lng,
                overview = overview,
                bestTimeToVisit = "Year-round",
                dailyBudgetInr = 2000,
                topSpotsCount = 8,
                guideCount = 4,
                averageRating = 4.8
            )

            repository.addDestination(newHub)
            Toast.makeText(requireContext(), "Destination '$name' created and added to Maps & Search! 🗺️", Toast.LENGTH_LONG).show()
            dismiss()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        fun newInstance(): AdminDestinationDialogFragment {
            return AdminDestinationDialogFragment()
        }
    }
}
