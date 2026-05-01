const pairSection = element('pair-section');
const unsupportedSection = element('unsupported-section');
const readySection = element('ready-section');
const resultSection = element('result-section');
const pairingCodeInput = element('pairing-code');
const pairButton = element('pair-button');
const openDashboardButton = element('open-dashboard');
const openOptionsButton = element('open-options');
const saveButton = element('save-button');
const problemTitle = element('problem-title');
const problemUrl = element('problem-url');
const resultStatus = element('result-status');
const resultDetails = element('result-details');
const openResultButton = element('open-result');
const saveAnotherButton = element('save-another');
const disconnectButton = element('disconnect-button');
const sessionLabel = element('session-label');
let sessionPaired = false;
let activePageContext = {
    supported: false,
    url: null,
    title: null,
};
let lastSaveResult = null;
pairButton.addEventListener('click', async () => {
    setButtonLoading(pairButton, true, 'Pairing...');
    try {
        const response = await sendMessage({
            type: 'algomind:pair',
            code: pairingCodeInput.value,
            installationName: 'Chrome Extension',
        });
        if (!response.ok) {
            throw new Error(response.error);
        }
        pairingCodeInput.value = '';
        sessionPaired = true;
        await initialize();
    }
    catch (error) {
        setInlineResult('Pairing failed', error instanceof Error ? error.message : 'Unknown error');
    }
    finally {
        setButtonLoading(pairButton, false, 'Pair extension');
    }
});
saveButton.addEventListener('click', async () => {
    setButtonLoading(saveButton, true, 'Saving...');
    try {
        const response = await sendMessage({
            type: 'algomind:save-problem',
            pageContext: activePageContext,
        });
        if (!response.ok) {
            throw new Error(response.error);
        }
        lastSaveResult = response.result;
        renderResult(response.result);
    }
    catch (error) {
        setInlineResult('Save failed', error instanceof Error ? error.message : 'Unknown error');
    }
    finally {
        setButtonLoading(saveButton, false, 'Save to Algomind');
    }
});
openDashboardButton.addEventListener('click', async () => {
    await sendMessage({
        type: 'algomind:open-path',
        path: '/dashboard/extension',
    });
});
openOptionsButton.addEventListener('click', async () => {
    await chrome.runtime.openOptionsPage();
});
disconnectButton.addEventListener('click', async () => {
    const response = await sendMessage({ type: 'algomind:disconnect' });
    if (!response.ok) {
        setInlineResult('Disconnect failed', response.error || 'Unknown error');
        return;
    }
    sessionPaired = false;
    lastSaveResult = null;
    await initialize();
});
openResultButton.addEventListener('click', async () => {
    if (!lastSaveResult)
        return;
    const path = lastSaveResult.problem_id
        ? `/dashboard/library/problem/${lastSaveResult.problem_id}`
        : '/dashboard/inbox';
    await sendMessage({
        type: 'algomind:open-path',
        path,
    });
});
saveAnotherButton.addEventListener('click', () => {
    lastSaveResult = null;
    render();
});
void initialize();
async function initialize() {
    const session = await sendMessage({
        type: 'algomind:get-session',
    });
    sessionPaired = session.ok && Boolean(session.paired);
    sessionLabel.textContent =
        sessionPaired && session.installation?.name
            ? `Connected as ${session.installation.name}`
            : 'Not paired yet';
    disconnectButton.classList.toggle('hidden', !sessionPaired);
    activePageContext = await getActivePageContext();
    render();
}
async function render() {
    hide(pairSection, unsupportedSection, readySection, resultSection);
    if (lastSaveResult) {
        renderResult(lastSaveResult);
        return;
    }
    if (!sessionPaired) {
        show(pairSection);
        return;
    }
    if (!activePageContext.supported || !activePageContext.url) {
        show(unsupportedSection);
        return;
    }
    problemTitle.textContent = activePageContext.title || 'LeetCode problem';
    problemUrl.textContent = activePageContext.url;
    show(readySection);
}
function renderResult(result) {
    hide(pairSection, unsupportedSection, readySection);
    resultStatus.textContent =
        result.status === 'captured'
            ? 'Saved to your inbox'
            : result.status === 'already_captured'
                ? 'Already in your inbox'
                : 'Already in your library';
    resultDetails.textContent =
        result.status === 'already_imported'
            ? 'Open the existing Algomind entry.'
            : 'Finish the import in Algomind when you are ready.';
    show(resultSection);
}
async function getActivePageContext() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab?.id) {
        return {
            supported: false,
            url: null,
            title: null,
        };
    }
    try {
        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'algomind:get-page-context',
        });
        return (response || {
            supported: false,
            url: tab.url || null,
            title: tab.title || null,
        });
    }
    catch {
        return {
            supported: false,
            url: tab.url || null,
            title: tab.title || null,
        };
    }
}
async function sendMessage(message) {
    return chrome.runtime.sendMessage(message);
}
function setInlineResult(title, details) {
    lastSaveResult = null;
    hide(pairSection, unsupportedSection, readySection);
    resultStatus.textContent = title;
    resultDetails.textContent = details;
    show(resultSection);
}
function setButtonLoading(button, loading, text) {
    button.disabled = loading;
    if (loading) {
        button.dataset.originalText = button.textContent || text;
        button.textContent = text;
        return;
    }
    if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
        delete button.dataset.originalText;
    }
}
function hide(...elements) {
    elements.forEach((target) => target.classList.add('hidden'));
}
function show(target) {
    target.classList.remove('hidden');
}
function element(id) {
    const target = document.getElementById(id);
    if (!target) {
        throw new Error(`Missing element #${id}`);
    }
    return target;
}
export {};
