package com.safarnama.travel

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var filesCallback: ValueCallback<Array<Uri>>? = null
    private var pendingExport: ExportRequest? = null
    private var pendingAuth: JSONObject? = null
    private var webReady = false
    private var backPending = false
    private val authOrigin by lazy {
        runCatching {
            assets.open("web/android-config.json").bufferedReader().use {
                Uri.parse(JSONObject(it.readText()).optString("authOrigin"))
            }
        }.getOrNull()
    }

    private data class ExportRequest(val json: String, val id: String, val reply: JavaScriptReplyProxy)

    private val chooseFiles = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val files = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
            ?.filter { it.scheme == "content" }
            ?.take(7)?.toTypedArray()
        filesCallback?.onReceiveValue(files?.takeIf { it.isNotEmpty() })
        filesCallback = null
    }

    private val saveItinerary = registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        val request = pendingExport ?: return@registerForActivityResult
        pendingExport = null
        if (uri == null) {
            reply(request.reply, request.id, false, "Export canceled")
        } else {
            lifecycleScope.launch {
                val saved = withContext(Dispatchers.IO) {
                    runCatching {
                        requireNotNull(contentResolver.openOutputStream(uri, "wt")).use {
                            it.write(request.json.toByteArray(Charsets.UTF_8))
                        }
                    }.isSuccess
                }
                reply(request.reply, request.id, saved, if (saved) null else "Could not save the itinerary")
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        acceptAuthCallback(intent)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        webView = WebView(this).apply {
            setBackgroundColor(Color.WHITE)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            settings.setSupportMultipleWindows(false)
            settings.mediaPlaybackRequiresUserGesture = false
            settings.setSupportZoom(true)
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            webViewClient = BundledWebClient(applicationContext, ::openExternal)
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams
                ): Boolean {
                    filesCallback?.onReceiveValue(null)
                    filesCallback = callback
                    val types = params.acceptTypes.filter { it.startsWith("image/") || it.startsWith("video/") }
                    val picker = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        type = types.singleOrNull() ?: "*/*"
                        if (types.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, types.toTypedArray())
                        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                    }
                    try {
                        chooseFiles.launch(picker)
                    } catch (_: ActivityNotFoundException) {
                        filesCallback?.onReceiveValue(null)
                        filesCallback = null
                        Toast.makeText(this@MainActivity, "No file picker is available", Toast.LENGTH_SHORT).show()
                    }
                    return true
                }
            }
        }
        registerBridge()
        val container = FrameLayout(this).apply {
            setBackgroundColor(Color.WHITE)
            addView(webView, FrameLayout.LayoutParams(-1, -1))
        }
        setContentView(container)
        ViewCompat.setOnApplyWindowInsetsListener(container) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, keyboard.bottom))
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.requestApplyInsets(container)
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (backPending) return
                if (!isAppOrigin(Uri.parse(webView.url.orEmpty()))) { finish(); return }
                backPending = true
                webView.evaluateJavascript("window.safarnamaBack?.() === true") { consumed ->
                    backPending = false
                    if (consumed != "true" && !isFinishing) {
                        if (webView.canGoBack()) webView.goBack() else finish()
                    }
                }
            }
        })
        webView.loadUrl(APP_HOME)
    }

    private fun registerBridge() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) return
        WebViewCompat.addWebMessageListener(webView, "safarnamaNative", setOf(APP_ORIGIN)) { _, message, origin, mainFrame, proxy ->
            if (!mainFrame || !isAppOrigin(origin)) return@addWebMessageListener
            val data = message.data ?: return@addWebMessageListener
            if (data.length > 512_000) return@addWebMessageListener
            val request = runCatching { JSONObject(data) }.getOrNull() ?: return@addWebMessageListener
            val id = request.optString("id").takeIf { it.length in 1..80 } ?: return@addWebMessageListener
            try {
                when (request.optString("action")) {
                    "ready" -> {
                        webReady = true
                        deliverAuthCallback()
                        reply(proxy, id, true, authRedirect = "${BuildConfig.AUTH_CALLBACK_SCHEME}://auth-callback")
                    }
                    "share" -> {
                        val text = request.optString("text").take(40_000)
                        require(text.isNotBlank()) { "There is nothing to share" }
                        val share = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, request.optString("title").take(200))
                            putExtra(Intent.EXTRA_TEXT, text)
                        }
                        startActivity(Intent.createChooser(share, null))
                        reply(proxy, id, true)
                    }
                    "copy" -> {
                        val text = request.optString("text").take(2048)
                        require(text.isNotBlank()) { "There is nothing to copy" }
                        val clipboard = requireNotNull(getSystemService(ClipboardManager::class.java)) { "Clipboard is unavailable" }
                        clipboard.setPrimaryClip(ClipData.newPlainText("SafarNama link", text))
                        reply(proxy, id, true)
                    }
                    "exportItinerary" -> {
                        require(pendingExport == null) { "An export is already open" }
                        val name = request.optString("filename").takeIf { it.matches(Regex("[a-zA-Z0-9_-]{1,100}\\.json")) }
                            ?: "SafarNama-itinerary.json"
                        pendingExport = ExportRequest(request.getJSONObject("itinerary").toString(2), id, proxy)
                        try {
                            saveItinerary.launch(name)
                        } catch (error: Exception) {
                            pendingExport = null
                            throw error
                        }
                    }
                    "openAuth" -> {
                        val uri = Uri.parse(request.optString("url"))
                        val configured = authOrigin
                        require(configured?.host != null && uri.scheme == "https" && uri.host == configured.host && uri.port == configured.port &&
                            uri.userInfo == null && uri.path == "/auth/v1/authorize") { "This sign-in link is invalid" }
                        startActivity(Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE))
                        reply(proxy, id, true)
                    }
                    else -> reply(proxy, id, false, "Unsupported action")
                }
            } catch (error: Exception) {
                val reason = if (error is IllegalArgumentException) error.message else "This action couldn’t be completed"
                reply(proxy, id, false, reason)
            }
        }
    }

    private fun reply(proxy: JavaScriptReplyProxy, id: String, ok: Boolean, error: String? = null, authRedirect: String? = null) {
        val message = JSONObject().put("id", id).put("ok", ok)
        if (error != null) message.put("error", error)
        if (authRedirect != null) message.put("authRedirect", authRedirect)
        runCatching { proxy.postMessage(message.toString()) }
    }

    private fun openExternal(uri: Uri) {
        if (uri.scheme !in setOf("https", "http", "tel", "mailto", "geo")) return
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE))
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, "No app is available to open this link", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        acceptAuthCallback(intent)
        if (webReady) deliverAuthCallback()
    }

    private fun acceptAuthCallback(intent: Intent) {
        val uri = intent.data ?: return
        if (intent.action != Intent.ACTION_VIEW || uri.scheme != BuildConfig.AUTH_CALLBACK_SCHEME || uri.host != "auth-callback") return
        val code = uri.getQueryParameter("code")?.takeIf { it.length in 1..8192 }
        val error = uri.getQueryParameter("error_description")?.take(240)
            ?: uri.getQueryParameter("error")?.take(240)
        if (code != null || error != null) pendingAuth = JSONObject().put("code", code).put("error", error)
    }

    private fun deliverAuthCallback() {
        val callback = pendingAuth ?: return
        if (!isAppOrigin(Uri.parse(webView.url.orEmpty()))) return
        pendingAuth = null
        webView.evaluateJavascript(
            "window.dispatchEvent(new CustomEvent('safarnama:auth-callback', {detail: JSON.parse(${JSONObject.quote(callback.toString())})}))",
            null
        )
    }

    override fun onPause() {
        webView.onPause()
        if (isAppOrigin(Uri.parse(webView.url.orEmpty()))) {
            webView.evaluateJavascript("window.dispatchEvent(new Event('safarnama:pause'))", null)
        }
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        if (isAppOrigin(Uri.parse(webView.url.orEmpty()))) {
            webView.evaluateJavascript("window.dispatchEvent(new Event('safarnama:resume'))", null)
        }
    }

    override fun onDestroy() {
        filesCallback?.onReceiveValue(null)
        filesCallback = null
        webView.stopLoading()
        (webView.parent as? android.view.ViewGroup)?.removeView(webView)
        webView.destroy()
        super.onDestroy()
    }
}
