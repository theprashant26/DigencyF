/* ============================================================
   Digency – form submissions to Google Sheets
   ------------------------------------------------------------
   STEP 1: Deploy google-apps-script/Code.gs as a Web App
           (Deploy > New deployment > Web app >
            Execute as: Me, Who has access: Anyone)
   STEP 2: Paste the resulting /exec URL below.
   ============================================================ */

var GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwEbJK4YCx9WpIVZjCU_qADsQTs5RxAfa-AAth22SQkWJKjW0ylbb-6qys29UqH7jey/exec';

function isValidEmail(email) {
    var pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(String(email == null ? '' : email).trim());
}

/* Posted as application/x-www-form-urlencoded on purpose: that keeps it a
   "simple" CORS request. Apps Script web apps do not answer preflight
   OPTIONS, so sending JSON with a Content-Type header would fail. */
function sendToSheet(payload) {
    if (!GOOGLE_SHEET_ENDPOINT || GOOGLE_SHEET_ENDPOINT.indexOf('PASTE_YOUR') === 0) {
        return Promise.reject(new Error('Google Sheet endpoint is not configured in js/submit-form.js'));
    }

    var body = new URLSearchParams();
    Object.keys(payload).forEach(function (key) {
        body.append(key, payload[key] == null ? '' : String(payload[key]));
    });
    body.append('pageUrl', window.location.href);

    return fetch(GOOGLE_SHEET_ENDPOINT, { method: 'POST', body: body })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data || data.result !== 'success') {
                throw new Error((data && data.message) || 'Submission rejected');
            }
            return data;
        })
        .catch(function (err) {
            /* Apps Script answers with a 302 to script.googleusercontent.com.
               Some browsers, privacy extensions and corporate proxies stop us
               reading that redirected response even though the POST itself went
               through and the row was written. Retry in no-cors mode: the reply
               is opaque (unreadable), but the request is delivered. */
            if (!(err instanceof TypeError)) throw err;

            console.warn('Readable submit failed, retrying opaque (no-cors):', err);

            var retry = new URLSearchParams(body);
            return fetch(GOOGLE_SHEET_ENDPOINT, {
                method: 'POST',
                mode: 'no-cors',
                body: retry
            }).then(function () {
                return { result: 'success', opaque: true };
            });
        });
}

function flashAlert($el, delay) {
    if (!$el || !$el.length) return;
    $el.removeClass('hidden');
    setTimeout(function () { $el.addClass('hidden'); }, delay || 5000);
}

/* Puts the actual reason in the alert box rather than the generic
   "submission failed", so a failure is diagnosable without the console. */
function showError($alert, message, delay) {
    if (!$alert || !$alert.length) return;
    $alert.find('p').text(message);
    flashAlert($alert, delay);
}

function setFormBusy($form, busy) {
    $form.find('button[type="submit"]')
        .prop('disabled', busy)
        .toggleClass('is-submitting', busy);
}

function isValidPhone(phone) {
    var digits = String(phone == null ? '' : phone).replace(/[^0-9]/g, '');
    return digits.length >= 7 && digits.length <= 15;
}

function initSubmitLead() {
    var $form = $('#leadForm');
    if (!$form.length) return;

    $form.on('submit', function (event) {
        event.preventDefault();

        var $successMessage = $('#lead-success');
        var $errorMessage = $('#lead-error');
        var $name = $('#lead-name');
        var $email = $('#lead-email');
        var $phone = $('#lead-phone');

        $form.find('.error-border').removeClass('error-border');
        $successMessage.addClass('hidden');

        var problem = null;
        var $culprit = null;

        if (!$.trim($name.val())) {
            problem = 'Please enter your name.';
            $culprit = $name;
        } else if (!isValidEmail($email.val())) {
            problem = 'Please enter a valid email address.';
            $culprit = $email;
        } else if (!isValidPhone($phone.val())) {
            problem = 'Please enter a valid phone number.';
            $culprit = $phone;
        }

        if (problem) {
            $culprit.addClass('error-border').trigger('focus');
            showError($errorMessage, problem, 4000);
            return;
        }

        $errorMessage.addClass('hidden');
        setFormBusy($form, true);

        sendToSheet({
            formType: 'lead',
            name: $.trim($name.val()),
            email: $.trim($email.val()),
            phone: $.trim($phone.val()),
            service: $('#lead-service').val(),
            message: $('#lead-message').val()
        })
            .then(function () {
                $form[0].reset();
                flashAlert($successMessage);
            })
            .catch(function (err) {
                console.error('Lead form submission failed:', err);
                showError($errorMessage, 'Could not send: ' + (err && err.message || err));
            })
            .then(function () {
                setFormBusy($form, false);
            });
    });
}
