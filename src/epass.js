
$(function() {


  /**
   *
   * Replace feather icons
   *
   */
  if(typeof feather !== 'undefined') {
    feather.replace();
  }


  /**
   *
   * Tooltips
   *
   */
  $('[data-toggle="tooltip"]').tooltip()







/*
--------------------------------------------------------
AJAX FORM HANDLING
--------------------------------------------------------
*/
$('body').on('submit','form.ajax', function(e) {
  e.preventDefault();
  e.stopPropagation();
  var form = $(e.target);
  var submitButton = form.find('[type="submit"]');
  var orig = submitButton.html();
  var loadingText = submitButton.attr('data-loading-text');
  submitButton.prop('disabled', true).html( loadingText ? loadingText : 'Processing' );
  if(typeof feather !== 'undefined') {
    feather.replace();
  }

  var formData = form.serializeArray();
  var pushData = {};
  for(row of formData) {
    pushData[ row.name ] = row.value;
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

  $.ajax({
      url: url,
      data: pushData,
      method: form.attr('method'),
      dataType: 'json'
    })
    .always(function() {
      setTimeout(function() {
        submitButton.prop('disabled', false).html(orig);
        if(typeof feather !== 'undefined') {
          feather.replace();
        }
      }, 1000);
    })
    .done(function(res) {
      form.trigger('done', res);

      if(res.location) {
        window.location = res.location;
      } 

    })
    .fail(function(res) {
      form.trigger('fail', res);
      var error = res.responseJSON ? res.responseJSON.error : 'An error has ocurred';
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

});




});


