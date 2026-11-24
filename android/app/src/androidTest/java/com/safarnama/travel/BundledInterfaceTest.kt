package com.safarnama.travel

import android.webkit.WebView
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class BundledInterfaceTest {
    @Test fun bundledHomeDestinationsAndAndroidBackWork() {
        ActivityScenario.launch(MainActivity::class.java).use { app ->
            waitFor(app, "document.querySelector('main h1')?.textContent.includes('India, through your eyes')")
            evaluate(app, "document.querySelector('.sn-bottom-nav button:nth-child(2)').click()")
            waitFor(app, "document.querySelector('main h1')?.textContent.includes('Find your kind of India')")
            app.onActivity { it.onBackPressedDispatcher.onBackPressed() }
            waitFor(app, "document.querySelector('main h1')?.textContent.includes('India, through your eyes')")
            evaluate(app, "document.querySelector('.sn-bottom-nav button:nth-child(4)').click()")
            waitFor(app, "document.querySelector('main h1')?.textContent.includes('Explore the map')")
            waitFor(app, "!document.querySelector('.sn-bottom-nav')")
            evaluate(app, """
                (() => {
                    const input = document.querySelector('[aria-label="Search the map"]')
                    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Hampi')
                    input.dispatchEvent(new Event('input', { bubbles: true }))
                })()
            """.trimIndent())
            evaluate(app, "document.querySelector('.sn-map-search-form').requestSubmit()")
            waitFor(app, "document.querySelector('main h1')?.textContent === 'Destinations nearby'")
            evaluate(app, "document.querySelector('button[aria-label=\"Show Hampi on map\"]').click()")
            waitFor(app, "document.querySelector('.sn-map-selection h2')?.textContent === 'Hampi'")
            app.onActivity { it.onBackPressedDispatcher.onBackPressed() }
            waitFor(app, "document.querySelector('main h1')?.textContent.includes('India, through your eyes')")
            assertEquals("\"https://appassets.androidplatform.net\"", evaluate(app, "location.origin"))
        }
    }

    private fun waitFor(app: ActivityScenario<MainActivity>, expression: String) {
        repeat(25) {
            if (evaluate(app, expression) == "true") return
            Thread.sleep(200)
        }
        throw AssertionError("Page condition did not become true: $expression")
    }

    private fun evaluate(app: ActivityScenario<MainActivity>, expression: String): String? {
        val completion = CountDownLatch(1)
        var result: String? = null
        app.onActivity {
            val wrapper = it.findViewById<FrameLayout>(android.R.id.content).getChildAt(0) as FrameLayout
            val page = wrapper.getChildAt(0) as WebView
            page.evaluateJavascript(expression) { value ->
                result = value
                completion.countDown()
            }
        }
        check(completion.await(5, TimeUnit.SECONDS)) { "WebView did not respond" }
        return result
    }
}
