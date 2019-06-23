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
      table.find('.current-page').html( page );

      var limit = table.attr('data-limit');
      if(!limit) {
        limit = 30;
      }
      var source_key = table.attr('data-source-key');
      if(!source_key) {
        source_key = 'rows';
      }

      var id = table.attr('id');

      var match = '';
      var match_field = table.find('.match');
      if(!match_field.length && id) {
        match_field = $('.match[data-target="#'+id+'"]');
      }
      if(match_field.length) {
        match = match_field.val();
      }

      var sort = {};
      table.find('.sort[name]').each(function(e, obj) {
        var $obj = $(obj);
        var name = $obj.attr("name");
        var way = $obj.attr('data-sort');
        if(!way) {
          way = 1;
        } else {
          way = parseInt(way);
        }
        sort[name] = way;
      });

      var filter = {};
      table.find('.filter[name]').each(function(e, obj) {
        var $obj = $(obj);
        var name = $obj.attr("name");
        var val = $obj.val();
        if(val) {
          val = val.trim();
        }
        var type = obj.tagName;
        var like = $obj.hasClass('filter-like');
        var contains = $obj.hasClass('doxa-filter-contains');
        var subtype = $obj.attr('type');
        if(subtype) {
          subtype = subtype.toUpperCase();
        }
        if(val && val.length) {
          if(name.substr(-2) == "[]") {
            name = name.substr(0,name.length-2);
            if(typeof filter[name] == "undefined") {
              filter[name] = [];
            }
            if(type == 'SELECT' || !like ) {
              filter[name].push(val);
            } else if(type == 'INPUT' && ( subtype == 'CHECKBOX' || subtype == 'RADIO' ) ) {
              if($obj.is(':checked')) {
                filter[name].push(val);
              }
            } else if(contains) {
              filter[name].push({'LIKE': '%'+val+'%'});
            } else {
              filter[name].push({'LIKE': val});
            }
          } else {
            if(type == 'SELECT' || !like ) {
              filter[name] = val;
            } else if(type == 'INPUT' && ( subtype == 'CHECKBOX' || subtype == 'RADIO' ) ) {
              if($obj.is(':checked')) {
                filter[name] = val;
              }
            } else if(contains) {
              filter[name] = {'LIKE': '%'+val+'%'};
            } else {
              filter[name] = {'LIKE': val};
            }
          }
        }
      });

      var request = {};
      request.page = page;
      request.limit = limit;
      request.filter = filter;
      request.match = match;
      request.sort = sort;
      var q = new Query( source, request );

      if( table.data('template') ) {
        var template = table.data('template');
      } else {
        var template = table.find('template').html();
        table.data('template', template);
      }

      if(template) {
        var template_fields = template.match(/\[\[(.+)\]\]/g);
        if(!template_fields) {
          template_fields = [];
          /**
           * [2019-06-22] Osvaldo:
           * TODO: If there is no template, finish
           */
        }
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
      var tbody = table.find('tbody.content, div.content');
      if(!tbody.length) {
        tbody = table.find('tbody').last();
      }

      empty.hide();
      error.hide();
      loading.show();
      tbody.empty();

      // Done
      q.on('done', function(e) {
        loading.hide();
        var response = e.detail.response;
        table.data('response', response);
        var source_keys = source_key.split('.');
        var data = response;
        while(source_keys.length) {
          var k = source_keys.shift();
          if(typeof data[k] == 'undefined') {
            break;
          }
          data = data[k];
        }
        if(data.length) {
          for(var row of data) {
            var tmp = template;
            for(var field of fields) {
              tmp = tmp.replace( field.tag, eval( field.value ) );
            }
            tbody.append( tmp );
          }
        } else {
          empty.show();
        }
        error.hide();
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
        error.show();
        table.find('[data-ajax-show]').each(function(e, obj) {
          var $obj = $(obj);
          $obj.html('-');
        });
      });

      // Run
      table.data('timer', setTimeout(function() {
        q.fetch('GET');
      }, 200));

      return q;
    }
  });

});


$(function() {

  // Bind to table.ajax

  $('table.ajax[data-source],div.ajax[data-source]').each(function(e,obj) {
    var $obj = $(obj);
    $obj.ajaxTable();
    
    $obj.find('.next-page').off('click');
    $obj.find('.prev-page').off('click');
    $obj.find('.filter').off('keyup change');

    $obj.find('.next-page').on('click', function(e) {
      var $table = $obj;
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

    $obj.find('.prev-page').on('click', function(e) {
      var $table = $obj;
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

    var filter_timeout = $obj.attr('data-filter-timeout');
    if(!filter_timeout) {
      filter_timeout = 300;
    }
    $obj.find('.filter').on('keyup change', function(e) {
      clearTimeout($obj.data('keytimer'));
      $obj.data('keytimer', setTimeout(function() {
        obj.ajaxTable();
      }, filter_timeout) );
    });

  });

});


