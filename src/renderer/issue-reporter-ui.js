/**
 * Issue Reporter UI - Renderer logic for the issue reporter window
 */

(function () {
    const typeSelect = document.getElementById('issue-type');
    const titleInput = document.getElementById('issue-title');
    const descriptionTextarea = document.getElementById('issue-description');
    const submitButton = document.getElementById('submit-issue');
    const descriptionHint = document.getElementById('description-hint');

    const hints = {
        bug: 'Please describe the bug you encountered.... We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub.',
        feature: 'Please describe the feature you would like.... We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub.'
    };

    /**
     * Validates form and toggles submit button
     */
    function validateForm() {
        const isValid = titleInput.value.trim().length > 0 && descriptionTextarea.value.trim().length > 0;
        submitButton.disabled = !isValid;
    }

    /**
     * Updates the description hint based on issue type
     */
    function updateHint() {
        descriptionHint.textContent = hints[typeSelect.value] || hints.bug;
    }

    typeSelect.addEventListener('change', updateHint);
    titleInput.addEventListener('input', validateForm);
    descriptionTextarea.addEventListener('input', validateForm);

    submitButton.addEventListener('click', async () => {
        const type = typeSelect.value;
        const title = titleInput.value.trim();
        const description = descriptionTextarea.value.trim();

        if (!title || !description) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Opening GitHub...';

        try {
            await window.electronAPI.submitIssue(type, title, description);
        } catch (error) {
            console.error('Error submitting issue:', error);
            submitButton.disabled = false;
            submitButton.textContent = 'Create on GitHub';
        }
    });

    // Focus title input on load
    titleInput.focus();
})();
