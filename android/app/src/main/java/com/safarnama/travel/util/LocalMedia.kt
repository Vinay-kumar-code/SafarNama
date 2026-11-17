package com.safarnama.travel.util

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

object LocalMedia {
    suspend fun importFiles(context: Context, uris: List<Uri>, video: Boolean): List<String> = withContext(Dispatchers.IO) {
        require(uris.size <= if (video) 1 else 6) { if (video) "Choose one video" else "Choose up to six photos" }
        val directory = File(context.filesDir, "travel_media").apply { mkdirs() }
        val copied = mutableListOf<File>()
        try {
            uris.map { uri ->
                val mime = context.contentResolver.getType(uri).orEmpty()
                require(mime.startsWith(if (video) "video/" else "image/")) { "Choose the matching media type" }
                val extension = android.webkit.MimeTypeMap.getSingleton().getExtensionFromMimeType(mime) ?: if (video) "mp4" else "jpg"
                val file = File(directory, "${UUID.randomUUID()}.$extension")
                copied.add(file)
                val limit = (if (video) 60L else 8L) * 1024 * 1024
                context.contentResolver.openInputStream(uri).use { input ->
                    requireNotNull(input) { "Cannot open the selected file" }
                    file.outputStream().use { output ->
                        val buffer = ByteArray(8192); var total = 0L
                        while (true) {
                            val count = input.read(buffer)
                            if (count == -1) break
                            total += count
                            require(total <= limit) { if (video) "Videos must be under 60 MB" else "Photos must be under 8 MB each" }
                            output.write(buffer, 0, count)
                        }
                    }
                }
                Uri.fromFile(file).toString()
            }
        } catch (error: Exception) { copied.forEach { it.delete() }; throw error }
    }
}
