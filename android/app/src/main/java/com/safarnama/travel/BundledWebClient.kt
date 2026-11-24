package com.safarnama.travel

import android.content.Context
import android.net.Uri
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.io.ByteArrayInputStream
import java.io.FilterInputStream
import java.io.InputStream

internal const val APP_HOST = "appassets.androidplatform.net"
internal const val APP_ORIGIN = "https://$APP_HOST"
internal const val APP_HOME = "$APP_ORIGIN/index.html"

internal fun isAppOrigin(uri: Uri): Boolean =
    uri.scheme == "https" && uri.host == APP_HOST && uri.userInfo == null &&
        (uri.port == -1 || uri.port == 443)

internal class BundledWebClient(
    context: Context,
    private val openExternal: (Uri) -> Unit
) : WebViewClientCompat() {
    private val assets = context.assets
    private val packagedAssets = WebViewAssetLoader.AssetsPathHandler(context)
    private val assetLoader = WebViewAssetLoader.Builder()
        .addPathHandler("/") { path ->
            if (path.isEmpty() || path.split('/').any { it == "." || it == ".." || '\\' in it }) {
                null
            } else {
                packagedAssets.handle("web/$path")
            }
        }.build()

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        if (!request.isForMainFrame) return !request.url.scheme.equals("https", ignoreCase = true)
        if (isAppOrigin(request.url)) return false
        openExternal(request.url)
        return true
    }

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        if (!isAppOrigin(request.url)) return null
        val videoPath = request.url.path?.takeIf { it.matches(Regex("/media/[a-z-]+-preview\\.mp4")) }
        if (videoPath != null) return openVideo(
            "web$videoPath",
            request.requestHeaders.entries.firstOrNull { it.key.equals("Range", ignoreCase = true) }?.value,
            request.method == "HEAD"
        )
        return assetLoader.shouldInterceptRequest(request.url) ?: emptyResponse(404, "Not Found")
    }

    private fun openVideo(assetPath: String, rangeHeader: String?, head: Boolean): WebResourceResponse {
        val descriptor = runCatching { assets.openFd(assetPath) }.getOrNull()
            ?: return emptyResponse(404, "Not Found")
        val length = descriptor.length
        val range = rangeHeader?.let { HttpByteRange.parse(it, length) }
        if (rangeHeader != null && range == null) {
            descriptor.close()
            return emptyResponse(416, "Range Not Satisfiable", mapOf("Content-Range" to "bytes */$length"))
        }
        val headers = mutableMapOf(
            "Accept-Ranges" to "bytes",
            "Content-Length" to (range?.length ?: length).toString()
        )
        range?.let { headers["Content-Range"] = "bytes ${it.start}-${it.end}/$length" }
        val stream = if (head) {
            descriptor.close()
            ByteArrayInputStream(byteArrayOf())
        } else {
            try {
                val input = descriptor.createInputStream()
                var remaining = range?.start ?: 0
                while (remaining > 0) {
                    val skipped = input.skip(remaining)
                    if (skipped <= 0) throw java.io.EOFException()
                    remaining -= skipped
                }
                BoundedStream(input, range?.length ?: length)
            } catch (_: Exception) {
                descriptor.close()
                return emptyResponse(500, "Unable to Read Video")
            }
        }
        return WebResourceResponse("video/mp4", null, if (range == null) 200 else 206,
            if (range == null) "OK" else "Partial Content", headers, stream)
    }

    private fun emptyResponse(status: Int, reason: String, headers: Map<String, String> = emptyMap()) =
        WebResourceResponse("text/plain", "UTF-8", status, reason, headers, ByteArrayInputStream(byteArrayOf()))
}

private class BoundedStream(input: InputStream, private var remaining: Long) : FilterInputStream(input) {
    override fun read(): Int {
        if (remaining == 0L) return -1
        return super.read().also { if (it >= 0) remaining-- }
    }

    override fun read(buffer: ByteArray, offset: Int, count: Int): Int {
        if (count == 0) return 0
        if (remaining == 0L) return -1
        return super.read(buffer, offset, minOf(remaining, count.toLong()).toInt())
            .also { if (it > 0) remaining -= it }
    }

    override fun skip(count: Long): Long =
        super.skip(count.coerceIn(0, remaining)).also { remaining -= it }

    override fun available(): Int = minOf(super.available().toLong(), remaining).toInt()
}
