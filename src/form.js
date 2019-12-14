
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

    if(formError) {
        clearTimeout( formError.data('timer') );
        if(formError.hasClass('form-error-slide')) {
            formError.slideUp();
        } else {
            formError.hide();
        }
    }

    var q = new Query(url, pushData);
    q.on('fail', function(ev, statusMessage) {
        var res = ev.detail.req;
        var error = res.responseText;
        if (typeof res.responseJSON != 'undefined') {
            form.trigger('fail', res.responseJSON, res.statusText);
            error = ( res.responseJSON.error != 'undefined' ) ? res.responseJSON.error : 'An error has ocurred';
        } else {
            form.trigger('fail', res.responseText, res.statusText);
        }
        if(typeof error == 'object') {
            error = error.message;    
        }
        var formError = form.find('.form-error');
        if(formError) {
            clearTimeout( formError.data('timer') );
            if(formError.hasClass('form-error-slide')) {
                formError.html( error ).slideDown();
            } else {
                formError.html( error ).show();
            }
            formError.data('timer', setTimeout(function() {
                if(formError.hasClass('form-error-slide')) {
                    formError.slideUp();
                } else {
                    formError.hide();
                }
            },5000));
        }
    });
    q.on('done', function(e) {
        res = e.detail.response;
        form.trigger('done', res);
        if(res.location) {
            window.location = res.location;
        } 
    });
    q.on('end', function() { 
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
        }, 1000);
    });

    q.fetch( method );


});





});


