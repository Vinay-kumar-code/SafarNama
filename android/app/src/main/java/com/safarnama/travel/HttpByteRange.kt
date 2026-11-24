package com.safarnama.travel

internal data class HttpByteRange(val start: Long, val end: Long) {
    val length get() = end - start + 1

    companion object {
        private val pattern = Regex("bytes=([0-9]*)-([0-9]*)")

        fun parse(header: String, size: Long): HttpByteRange? {
            if (size <= 0) return null
            val match = pattern.matchEntire(header.trim()) ?: return null
            val (start, end) = match.destructured
            if (start.isEmpty()) {
                val suffix = end.toLongOrNull()?.takeIf { it > 0 } ?: return null
                return HttpByteRange(size - minOf(size, suffix), size - 1)
            }
            val first = start.toLongOrNull()?.takeIf { it < size } ?: return null
            val last = if (end.isEmpty()) size - 1 else end.toLongOrNull() ?: return null
            if (last < first) return null
            return HttpByteRange(first, minOf(last, size - 1))
        }
    }
}
