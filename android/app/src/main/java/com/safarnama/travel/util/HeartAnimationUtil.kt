package com.safarnama.travel.util

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.view.View
import android.view.animation.AccelerateInterpolator
import android.view.animation.OvershootInterpolator

object HeartAnimationUtil {

    fun animateHeartBurst(heartView: View, onAnimationEnd: (() -> Unit)? = null) {
        heartView.visibility = View.VISIBLE
        heartView.alpha = 0f
        heartView.scaleX = 0.2f
        heartView.scaleY = 0.2f

        // Pop in with overshoot
        val scaleXIn = ObjectAnimator.ofFloat(heartView, View.SCALE_X, 0.2f, 1.25f)
        val scaleYIn = ObjectAnimator.ofFloat(heartView, View.SCALE_Y, 0.2f, 1.25f)
        val alphaIn = ObjectAnimator.ofFloat(heartView, View.ALPHA, 0f, 1f)

        val popIn = AnimatorSet().apply {
            playTogether(scaleXIn, scaleYIn, alphaIn)
            duration = 300
            interpolator = OvershootInterpolator(3.0f)
        }

        // Float up and fade out
        val scaleXOut = ObjectAnimator.ofFloat(heartView, View.SCALE_X, 1.25f, 1.0f)
        val scaleYOut = ObjectAnimator.ofFloat(heartView, View.SCALE_Y, 1.25f, 1.0f)
        val alphaOut = ObjectAnimator.ofFloat(heartView, View.ALPHA, 1f, 0f)

        val fadeOut = AnimatorSet().apply {
            playTogether(scaleXOut, scaleYOut, alphaOut)
            duration = 350
            startDelay = 200
            interpolator = AccelerateInterpolator()
        }

        AnimatorSet().apply {
            playSequentially(popIn, fadeOut)
            addListener(object : AnimatorListenerAdapter() {
                override fun onAnimationEnd(animation: Animator) {
                    heartView.visibility = View.INVISIBLE
                    heartView.alpha = 0f
                    onAnimationEnd?.invoke()
                }
            })
            start()
        }
    }
}
