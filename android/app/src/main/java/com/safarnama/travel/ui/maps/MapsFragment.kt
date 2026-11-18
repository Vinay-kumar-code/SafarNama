package com.safarnama.travel.ui.maps

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import coil.load
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.Marker
import com.google.android.gms.maps.model.MarkerOptions
import com.safarnama.travel.R
import com.safarnama.travel.data.DestinationHub
import com.safarnama.travel.data.TravelRepository
import com.safarnama.travel.databinding.FragmentMapsBinding
import com.safarnama.travel.ui.journeys.DestinationSheet
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.safarnama.travel.BuildConfig

class MapsFragment : Fragment(), OnMapReadyCallback {

    private var _binding: FragmentMapsBinding? = null
    private val binding get() = _binding!!

    private var googleMap: GoogleMap? = null
    private val markersMap = mutableMapOf<Marker, DestinationHub>()
    private var selectedHub: DestinationHub? = null
    private val repository = TravelRepository.instance
    private val hasMapsKey get() = BuildConfig.GOOGLE_MAPS_KEY.isNotBlank() &&
        !BuildConfig.GOOGLE_MAPS_KEY.contains("placeholder", ignoreCase = true)

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentMapsBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize SupportMapFragment
        if (hasMapsKey) {
            val mapFragment = childFragmentManager.findFragmentById(R.id.map_fragment) as? SupportMapFragment
                ?: SupportMapFragment.newInstance().also {
                    childFragmentManager.beginTransaction().replace(R.id.map_fragment, it).commitNow()
                }
            mapFragment.getMapAsync(this)
        } else {
            binding.mapFragment.visibility = View.GONE
            binding.mapPreviewDescription.visibility = View.VISIBLE
        }
        binding.btnBrowseMapPlaces.setOnClickListener { chooseDestination(repository.destinations.value) }

        // FAB Recenter to India
        binding.fabRecenterIndia.setOnClickListener {
            val indiaCenter = LatLng(22.9734, 78.6569)
            googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(indiaCenter, 4.8f))
            if (googleMap == null) chooseDestination(repository.destinations.value)
        }

        // Explore Hub Button in Bottom Card
        binding.btnExploreHub.setOnClickListener {
            val hub = selectedHub ?: return@setOnClickListener
            DestinationSheet.newInstance(hub.id).show(parentFragmentManager, "map_destination")
        }

        // Filter chips
        binding.chipMapAll.setOnClickListener {
            filterMapMarkers("")
        }
        binding.chipMapPasses.setOnClickListener {
            filterMapMarkers("Pass")
        }
        binding.chipMapHeritage.setOnClickListener {
            filterMapMarkers("Heritage")
        }
        binding.chipMapMonasteries.setOnClickListener {
            filterMapMarkers("Monaster")
        }

        // Show default preview for Spiti
        repository.destinations.value.firstOrNull()?.let(::showDestinationPreview)
    }

    override fun onMapReady(map: GoogleMap) {
        if (_binding == null) return
        googleMap = map

        map.uiSettings.apply {
            isZoomControlsEnabled = false
            isCompassEnabled = true
            isMyLocationButtonEnabled = false
        }

        // Populate Destination Markers
        populateMarkers(repository.destinations.value)

        // Center on India
        val indiaCenter = LatLng(22.9734, 78.6569)
        map.moveCamera(CameraUpdateFactory.newLatLngZoom(indiaCenter, 4.8f))

        map.setOnMarkerClickListener { marker ->
            val hub = markersMap[marker]
            if (hub != null) {
                showDestinationPreview(hub)
                map.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(hub.latitude, hub.longitude), 7.5f))
            }
            true
        }
    }

    private fun populateMarkers(hubs: List<DestinationHub>) {
        googleMap?.clear()
        markersMap.clear()

        hubs.forEach { hub ->
            val position = LatLng(hub.latitude, hub.longitude)
            val marker = googleMap?.addMarker(
                MarkerOptions()
                    .position(position)
                    .title(hub.name)
                    .snippet("${hub.state} • ₹${hub.dailyBudgetInr}/day")
                    .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_ORANGE))
            )
            if (marker != null) {
                markersMap[marker] = hub
            }
        }
    }

    private fun filterMapMarkers(keyword: String) {
            val filtered = repository.destinations.value.filter {
                keyword.isEmpty() ||
                it.tagline.contains(keyword, ignoreCase = true) ||
                it.region.contains(keyword, ignoreCase = true) ||
                it.overview.contains(keyword, ignoreCase = true)
            }
            if (googleMap == null) { chooseDestination(filtered); return }
            populateMarkers(filtered)
            if (filtered.isNotEmpty()) {
                val first = filtered.first()
                googleMap?.animateCamera(
                    CameraUpdateFactory.newLatLngZoom(LatLng(first.latitude, first.longitude), 6.5f)
                )
                showDestinationPreview(first)
            }
    }

    private fun chooseDestination(hubs: List<DestinationHub>) {
        if (hubs.isEmpty()) {
            Toast.makeText(requireContext(), "No matching places", Toast.LENGTH_SHORT).show()
            return
        }
        MaterialAlertDialogBuilder(requireContext()).setTitle("Choose an Indian destination")
            .setItems(hubs.map { "${it.name} · ${it.state}" }.toTypedArray()) { _, index ->
                val hub = hubs[index]
                showDestinationPreview(hub)
                googleMap?.animateCamera(CameraUpdateFactory.newLatLngZoom(LatLng(hub.latitude, hub.longitude), 7.5f))
            }.show()
    }

    private fun showDestinationPreview(hub: DestinationHub) {
        selectedHub = hub
        binding.cardDestinationPreview.visibility = View.VISIBLE
        binding.tvMapPreviewTitle.text = hub.name
        binding.tvMapPreviewState.text = "${hub.state} • ${hub.region}"
        binding.tvMapPreviewBudget.text = "₹${hub.dailyBudgetInr} / day"
        binding.tvMapPreviewPermits.text = "${hub.guideCount} Local Guides"

        binding.ivMapPreviewThumb.load(hub.coverImage) {
            crossfade(true)
            placeholder(R.drawable.bg_card_rounded)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
