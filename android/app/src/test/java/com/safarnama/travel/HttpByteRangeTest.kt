package com.safarnama.travel

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class HttpByteRangeTest {
    @Test fun parsesClosedAndOpenEndedRanges() {
        assertEquals(HttpByteRange(0, 1), HttpByteRange.parse("bytes=0-1", 100))
        assertEquals(HttpByteRange(20, 99), HttpByteRange.parse("bytes=20-", 100))
        assertEquals(HttpByteRange(80, 99), HttpByteRange.parse("bytes=80-200", 100))
    }

    @Test fun handlesSuffixRanges() {
        assertEquals(HttpByteRange(90, 99), HttpByteRange.parse("bytes=-10", 100))
        assertEquals(HttpByteRange(0, 99), HttpByteRange.parse("bytes=-200", 100))
    }

    @Test fun rejectsMalformedAndUnsatisfiableRanges() {
        assertNull(HttpByteRange.parse("bytes=100-", 100))
        assertNull(HttpByteRange.parse("bytes=2-1", 100))
        assertNull(HttpByteRange.parse("bytes=0-1,4-5", 100))
        assertNull(HttpByteRange.parse("bytes=-0", 100))
        assertNull(HttpByteRange.parse("bytes=0-", 0))
    }
}
