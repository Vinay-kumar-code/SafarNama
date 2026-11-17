package com.safarnama.travel

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import androidx.navigation.ui.NavigationUI
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.material.navigation.NavigationBarView
import com.safarnama.travel.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install modern AndroidX SplashScreen
        installSplashScreen()
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        // Pure Instagram-Style Bottom Navigation: EXACTLY 5 icon-only buttons, NO text labels
        binding.bottomNavigation.labelVisibilityMode = NavigationBarView.LABEL_VISIBILITY_UNLABELED
        binding.bottomNavigation.setupWithNavController(navController)

        // Custom Navigation Listener to handle top bar and tab transitions
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            NavigationUI.onNavDestinationSelected(item, navController)
        }

        navController.addOnDestinationChangedListener { _, destination, _ ->
            when (destination.id) {
                R.id.nav_reels, R.id.nav_home -> {
                    // Hide top bar for immersive Instagram Reels experience
                    binding.topBar.visibility = View.GONE
                    binding.headerDivider.visibility = View.GONE
                }
                else -> {
                    // Show clean white top bar for Home, Search, Maps, Profile
                    binding.topBar.visibility = View.VISIBLE
                    binding.headerDivider.visibility = View.VISIBLE
                }
            }
        }

        // Top bar action clicks
        binding.btnTopActivity.setOnClickListener {
            com.safarnama.travel.ui.home.CreateContentBottomSheetDialogFragment.newInstance().show(supportFragmentManager, "create_story")
        }

        binding.btnTopMessages.setOnClickListener {
            com.safarnama.travel.ui.home.DirectMessagesDialogFragment.newInstance().show(supportFragmentManager, "messages")
        }

        binding.headerTitle.setOnClickListener {
            if (navController.currentDestination?.id != R.id.nav_home) {
                navController.navigate(R.id.nav_home)
                binding.bottomNavigation.selectedItemId = R.id.nav_home
            }
        }
    }
}
