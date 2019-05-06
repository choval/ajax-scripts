
'use strict';

$(function() {

  // AjaxTable
  $.fn.extend({
    ajaxTable: function() {
      if( !$(this).length ) {
        return;
      }
      var table = $(this);
      clearTimeout( table.data('timer') );
      var source = table.attr('data-source');
      if(!source) {
        return;
      }
      var page = table.attr('data-page');
      if(!page) {
        page = 1;
      }
      var limit = table.attr('data-limit');
      if(!limit) {
        limit = 30;
      }
      var source_key = table.attr('data-source-key');
      if(!source_key) {
        source_key = '_rows';
      }

      var table_id = table.attr('id');
      var match = '';
      if(table_id) {
        var match_field = $('[name="match"][data-target="#'+table_id+'"]');
        if(match_field.length) {
          match = match_field.val();
          match_field.off('keyup');
          match_field.on('keyup', function(e) {
            table.ajaxTable();
          });
        }
      }

      var request = {};
      // TODO: Filter
      request._page = page;
      request._limit = limit;
      request._filter = {};
      request._match = match;
      var q = new Query( source, request );

      if( table.data('template') ) {
        var template = table.data('template');
      } else {
        var template = table.find('template').html();
        table.data('template', template);
      }

      var template_fields = template.match(/\[\[(.+)\]\]/g);
      if(!template_fields) {
        template_fields = [];
        // return;
      }

      var fields = [];
      var loading = table.find('.loading');
      var empty = table.find('.empty');
      var error = table.find('.error');

      for(var field of template_fields) {
        fields.push({
          value: field.replace('[[','').replace(']]',''),
          tag: field
        });
      }
      var tbody = table.find('tbody').last();

      empty.hide();
      loading.show();
      tbody.empty();

      // Done
      q.on('done', function(e) {
        loading.hide();
        var response = e.detail.response;
        table.data('response', response);
        if( response[source_key].length ) {
          for(var row of response[source_key]) {
            var tmp = template;
            for(var field of fields) {
              tmp = tmp.replace( field.tag, eval( field.value ) );
            }
            tbody.append( tmp );
          }
        } else {
          empty.show();
        }
        table.find('[data-ajax-html]').each(function(e, obj) {
          var $obj = $(obj);
          var code = $obj.attr('data-ajax-html').replace('[[','').replace(']]', '');
          $obj.html( eval( code ) );
        });
        table.trigger('table_loaded', response);
      });

      // Fail
      q.on('fail', function(e) {
        loading.hide();
        empty.hide();
        if(error) {
          error.show();
        }
        table.find('[data-ajax-show]').each(function(e, obj) {
          var $obj = $(obj);
          $obj.html('-');
        });
      });

      // Run
      table.data('timer', setTimeout(function() {
        q.fetch('POST');
      }, 200));

      return q;
    }
  });

});


$(function() {

  // Bind to talbe.ajax
  $('table.ajax[data-source]').ajaxTable();

  $('table.ajax[data-source] .next-page').on('click', function(e) {
    var $table = $(this).closest('.ajax');
    var page = $table.attr('data-page');
    if(!page) {
      page = 1;
    }
    var response = $table.data('response');
    var max_pages = Math.ceil( response._total / response._limit );
    if(response._page < max_pages) {
      page++;
      $table.attr('data-page', page);
      $table.ajaxTable();
    }
  });
  $('table.ajax[data-source] .prev-page').on('click', function(e) {
    var $table = $(this).closest('.ajax');
    var page = $table.attr('data-page');
    if(!page) {
      page = 1;
    }
    page--;
    if(page > 0) {
      $table.attr('data-page', page);
      $table.ajaxTable();
    }
  });

});


