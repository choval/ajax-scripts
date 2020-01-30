
$(function() {




/*
--------------------------------------------------------
AJAX FORM HANDLING
--------------------------------------------------------
*/
$('body').on('submit','form.ajax', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var form = $(e.target);
    var submitButtons = form.find('[type="submit"]');
    submitButtons.each(function(i, btn) {
        var obj = $(btn);
        obj.data('original_content', obj.html() );
        obj.prop('disabled', true);
        var loadingText = obj.attr('data-loading-text');
        if (loadingText) {
            obj.html( loadingText );
        }
    });
    if(typeof feather !== 'undefined') {
        feather.replace();
    }

    // Form keys
    var formData = form.serializeArray();
    var method = form.attr('method');
    var formMessageTimeout = form.attr('data-message-timeout') ? form.attr('data-message-timeout') : 2000;
    if(method == 'GET') {
        var pushData = formData;
    } else {
        var pushData = new FormData;
        formData.forEach(function(row) {
            pushData.append( row.name, row.value );
            // pushData[ row.name ] = row.value;
        });
        // Form files
        var file_inputs = form.find('input[type="file"][name]');
        file_inputs.each(function(pos, file_input) {
            var name = $(file_input).attr('name');
            pushData.append( name, file_input.files[0] );
        });
    }

    var url = form.attr('action') ? form.attr('action') : window.location.href;
    var formError = form.find('.form-error');
    var formLoading = form.find('.form-loading');

    if (formError) {
        clearTimeout( formError.data('timer') );
        if(formError.hasClass('form-error-slide')) {
            formError.slideUp();
        } else {
            formError.hide();
        }
    }
    if (formLoading) {
        formLoading.show();
    }

    var q = new Query(url, pushData);
    q.on('fail', function(ev, statusMessage) {
        var res = ev.detail.req;
        var isJson = (typeof res.responseJSON != 'undefined') ? true : false;
        // Trigger
        if (isJson) {
            form.trigger('fail', res.responseJSON, res.statusText);
        } else {
            form.trigger('fail', res.responseText, res.statusText);
        }
        // Handles new CSRF
        if (isJson && typeof res.responseJSON.csrf == 'string') {
            form.find('[name="csrf"]').val(res.responseJSON.csrf);
        }
        // Show the error
        var error = res.statusText;
        if (isJson) {
            if (typeof res.responseJSON.error == 'string') {
                error = res.responseJSON.error;
            } else if (typeof res.responseJSON.error == 'object' && typeof res.responseJSON.error.message == 'string') {
                error = res.responseJSON.error.message;
            } else if (typeof res.responseJSON.error_message == 'string') {
                error = res.responseJSON.error_message;
            }
        } else {
            if (typeof res.responseText == 'string') {
                error = res.responseText;
            }
        }
        var formError = form.find('.form-error');
        if(formError) {
            clearTimeout( formError.data('timer') );
            if(formError.hasClass('form-slide')) {
                formError.html( error ).slideDown();
            } else {
                formError.html( error ).show();
            }
            formError.data('timer', setTimeout(function() {
                if(formError.hasClass('form-slide')) {
                    formError.slideUp();
                } else {
                    formError.hide();
                }
            },formMessageTimeout));
        } else {
            alert(error);
        }
    });
    q.on('done', function(e) {
        res = e.detail.response;
        form.trigger('done', res);
        var isJson = (typeof res.responseJSON != 'undefined') ? true : false;
        // Handles new CSRF
        if (isJson && typeof res.responseJSON.csrf == 'string') {
            form.find('[name="csrf"]').val(res.responseJSON.csrf);
        }

        var formSuccess = form.find('.form-success');
        if(formSuccess) {
            clearTimeout( formSuccess.data('timer') );
            if(formSuccess.hasClass('form-slide')) {
                formSuccess.slideDown();
            } else {
                formSuccess.show();
            }
            formSuccess.data('timer', setTimeout(function() {
                if(formSuccess.hasClass('form-slide')) {
                    formSuccess.slideUp();
                } else {
                    formSuccess.hide();
                }
                // Handles redirect
                if(res.location) {
                    window.location = res.location;
                } 
            },formMessageTimeout));
        } else {
            // Handles redirect
            if(res.location) {
                window.location = res.location;
            } 
        }
    });
    q.on('end', function() { 
        if (formLoading) {
            formLoading.hide();
        }
        form.trigger('end');
        setTimeout(function() {
            submitButtons.each(function(i, btn) {
                var obj = $(btn);
                obj.prop('disabled', false);
                var orig = obj.data('original_content');
                obj.html( orig );
                obj.data('original_content', false);
            });
            if(typeof feather !== 'undefined') {
                feather.replace();
            }
        }, formMessageTimeout);
    });

    q.fetch( method );


});





});


