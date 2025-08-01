import Swal from "sweetalert2";
import { serializeFormData } from "../helpers/form_submit";

export default function CitadelForm(el) {
    $(el).on('submit', function (e) {
        e.preventDefault();
    })

    $(el).on("CForm:submit", function (e) {
        const $el = e.target
    })
}

export function CitadelFormWatchEvent() {
    window.addEventListener(
        'CForm:submit',
        async (e) => {
            const form_target = e.detail.form_name;
            const srcElement = e.detail.srcElement; // The Button
            const $form = $(`form#${form_target}.citadel-form`)
            const data = {
                ...serializeFormData($form.serializeArray()),
                raw: window.main_form_data
            }

            let url = e.detail.url
            let icon = srcElement.find('i[class^=ft-]')
            const iconClass = 'ft-loader ' + icon.attr('class')

            // icon.insertAfter('i')
            Pace.track(function () {
                icon.toggleClass(iconClass)
                srcElement.prop('disabled', true);
                srcElement.toggleClass('unclickable');
                $('body .main-content').toggleClass('unclickable');
                $form.toggleClass("citadel-onsubmit")
                $form.find('input, button[type="submit"]').prop('disabled', true);
                formSubmit({ url, method: "POST", data })
                    .catch(e => {
                        console.log(e)
                    })
                    .finally(r => {
                        $form.find('input, button[type="submit"]').prop('disabled', false);
                        $form.toggleClass("citadel-onsubmit")
                        srcElement.prop('disabled', false);
                        srcElement.toggleClass('unclickable');
                        icon.toggleClass(iconClass)
                        $('body .main-content').toggleClass('unclickable');
                    })
            })
        })
}

const response = {
    validation(json) {
        Swal.fire({
            title: "Validation Error",
            html: json.message,
            icon: "error",
            confirmButtonText: "Close"
        })
        Object.keys(json.errors).forEach(key => {
            json.errors[key].forEach(m => {
                toastr.error(m)
                $(`#${key}_error`).html(m)
            });
        })
    },
    bad_request(json) {
        if (json.citadel) {
            this.init_citadel_object(json.citadel);
        }
    },
    success(json) {
        if (json.citadel) {
            this.init_citadel_object(json.citadel);
        }
        if (json.swal) {
            Swal.fire({ ...json.swal, icon: "success" })
                .then(x => {
                    window.location.href = json.swal.redirectUrl
                })
        }
    },
    handle_swal(config) {
        Swal.fire(config)
    },
    init_citadel_object(citadel_response) {
        if (citadel_response.sweet_alert) {
            const sw = citadel_response.sweet_alert
            console.log(sw.config)
            Swal.fire(sw.config)
                .then(r => {
                    console.log(r)
                    this.handle_after_confirm(sw)
                })
                .catch(error => {
                    console.log(error)
                })
        }
    },
    handle_after_confirm({ after_confirm, after_confirm_args,redirectUrl }) {
        if(redirectUrl){
            window.location.href = redirectUrl
        }
        if (after_confirm == "none") return
        if (after_confirm == "reload") {
            window.location.reload()
        }
        
        
    }
}

function ajaxResponseHandler({ responseJSON: json, status, statusText }) {
    if (status == 422) {
        return response.validation(json);
    }

    if (status == 400) {
        return response.bad_request(json);
    }

    if (status == 200) {
        return response.success(json);
    }
    Swal.fire({
        title: statusText,
        html: JSON.stringify(json)
    });
    return
}


async function formSubmit({
    url,
    method,
    data
}) {
    let headers = {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr(
            'content'),
        'Content-Type': "application/json",
        'x-request-via': "citadel-form-wrapped"
    }

    return await $.ajax({
        url: url,
        headers: headers,
        type: method ?? "POST",
        data: JSON.stringify(data),
        success: function (data, textStatus, res) {
            ajaxResponseHandler(res)
        },
        error: function (res) {
            ajaxResponseHandler(res)
        }
    })

}
