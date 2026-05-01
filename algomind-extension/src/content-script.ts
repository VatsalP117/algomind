import type { PageContext } from './types'

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message?.type !== 'algomind:get-page-context') {
        return
    }

    sendResponse(getPageContext())
})

function getPageContext(): PageContext {
    const supported = /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+/i.test(
        window.location.href,
    )

    if (!supported) {
        return {
            supported: false,
            url: window.location.href,
            title: null,
        }
    }

    const title =
        document
            .querySelector('meta[property="og:title"]')
            ?.getAttribute('content')
            ?.replace(/\s*-\s*LeetCode$/, '')
            .trim() ||
        document.title.replace(/\s*-\s*LeetCode$/, '').trim()

    return {
        supported: true,
        url: window.location.href,
        title: title || null,
    }
}
