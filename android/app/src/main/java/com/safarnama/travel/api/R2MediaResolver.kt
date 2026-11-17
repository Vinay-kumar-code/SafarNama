package com.safarnama.travel.api

import com.safarnama.travel.BuildConfig

object R2MediaResolver {
    val R2_PUBLIC_BASE_URL: String = BuildConfig.R2_PUBLIC_URL

    /**
     * Resolves a media key or URL against the Cloudflare R2 public bucket.
     * If the input is already absolute (http:// or https://), it is returned untouched.
     * If empty, fallback is returned.
     */
    fun resolveR2Url(keyOrUrl: String?, fallbackUrl: String = ""): String {
        if (keyOrUrl.isNullOrBlank()) return fallbackUrl

        if (keyOrUrl.startsWith("http://") || 
            keyOrUrl.startsWith("https://") || 
            keyOrUrl.startsWith("file://") || 
            keyOrUrl.startsWith("content://")) {
            return keyOrUrl
        }

        val cleanKey = keyOrUrl.trimStart('/')
        return "$R2_PUBLIC_BASE_URL/$cleanKey"
    }

    fun resolveAvatarUrl(filename: String?, fallbackUrl: String = ""): String {
        if (filename.isNullOrBlank()) return fallbackUrl
        if (filename.startsWith("http://") || filename.startsWith("https://")) return filename
        val path = if (filename.startsWith("avatars/")) filename else "avatars/$filename"
        return resolveR2Url(path, fallbackUrl)
    }

    fun resolveImageUrl(filename: String?, fallbackUrl: String = ""): String {
        if (filename.isNullOrBlank()) return fallbackUrl
        if (filename.startsWith("http://") || filename.startsWith("https://")) return filename
        val path = if (filename.startsWith("images/")) filename else "images/$filename"
        return resolveR2Url(path, fallbackUrl)
    }

    fun resolveVideoUrl(filename: String?, fallbackUrl: String = ""): String {
        if (filename.isNullOrBlank()) return fallbackUrl
        if (filename.startsWith("http://") || filename.startsWith("https://")) return filename
        val path = if (filename.startsWith("videos/")) filename else "videos/$filename"
        return resolveR2Url(path, fallbackUrl)
    }
}
