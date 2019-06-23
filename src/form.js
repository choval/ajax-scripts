
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
  var submitButton = form.find('[type="submit"]');
  var orig = submitButton.html();
  var loadingText = submitButton.attr('data-loading-text');
  submitButton.prop('disabled', true).html( loadingText ? loadingText : 'Processing' );
  if(typeof feather !== 'undefined') {
    feather.replace();
  }

  // Form keys
  var formData = form.serializeArray();
  var pushData = new FormData;
  formData.forEach(function(row) {
    pushData.append( row.name, row.value );
    // pushData[ row.name ] = row.value;
  });
  // Form files
  var file_inputs = form.find('input[type="file"][name]');
  file_inputs.forEach(function(pos, file_input) {
    var name = $(file_input).attr('name');
    pushData.append( name, file_input.files[0] );
  });

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
  q.on('fail', function(e) {
    form.trigger('fail', e);
    var res = e.detail.event;
    var error = res.responseJSON ? res.responseJSON.error : 'An error has ocurred';
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
      submitButton.prop('disabled', false).html(orig);
      if(typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 1000);
  });

  q.fetch( form.attr('method') );


});





});


