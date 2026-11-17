package com.safarnama.travel.ui.profile

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import coil.load
import coil.transform.CircleCropTransformation
import com.safarnama.travel.R
import com.safarnama.travel.data.FollowedAccountSetting
import com.safarnama.travel.databinding.ItemFollowedAccountBinding

class FollowedAccountsAdapter(
    private var accounts: List<FollowedAccountSetting>,
    private val onToggleNotification: (FollowedAccountSetting) -> Unit,
    private val onUnfollow: (FollowedAccountSetting) -> Unit
) : RecyclerView.Adapter<FollowedAccountsAdapter.AccountViewHolder>() {

    fun updateAccounts(newAccounts: List<FollowedAccountSetting>) {
        accounts = newAccounts
        notifyDataSetChanged()
    }

    inner class AccountViewHolder(val binding: ItemFollowedAccountBinding) :
        RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AccountViewHolder {
        val binding = ItemFollowedAccountBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return AccountViewHolder(binding)
    }

    override fun onBindViewHolder(holder: AccountViewHolder, position: Int) {
        val item = accounts[position]
        val context = holder.itemView.context
        val profile = item.profile

        holder.binding.tvFollowingFullname.text = profile.fullName
        holder.binding.tvFollowingUsername.text = "@${profile.username}"
        holder.binding.ivFollowingVerified.visibility = if (profile.isVerifiedGuide) View.VISIBLE else View.GONE

        holder.binding.ivFollowingAvatar.load(profile.avatarUrl) {
            crossfade(true)
            transformations(CircleCropTransformation())
            placeholder(R.drawable.ic_profile)
        }

        // Notification Alert state
        updateNotificationUi(holder, item)

        holder.binding.btnToggleNotification.setOnClickListener {
            onToggleNotification(item)
        }

        holder.binding.btnUnfollow.setOnClickListener {
            onUnfollow(item)
        }
    }

    private fun updateNotificationUi(holder: AccountViewHolder, item: FollowedAccountSetting) {
        val context = holder.itemView.context
        if (item.notificationsEnabled) {
            holder.binding.ivBellIcon.setImageResource(R.drawable.ic_bell_filled)
            holder.binding.ivBellIcon.setColorFilter(ContextCompat.getColor(context, R.color.brand_coral))
            holder.binding.tvNotificationStatus.text = "Alerts On"
            holder.binding.tvNotificationStatus.setTextColor(ContextCompat.getColor(context, R.color.brand_coral))
        } else {
            holder.binding.ivBellIcon.setImageResource(R.drawable.ic_bell_outline)
            holder.binding.ivBellIcon.setColorFilter(ContextCompat.getColor(context, R.color.text_zinc_400))
            holder.binding.tvNotificationStatus.text = "Muted"
            holder.binding.tvNotificationStatus.setTextColor(ContextCompat.getColor(context, R.color.text_zinc_500))
        }
    }

    override fun getItemCount(): Int = accounts.size
}
