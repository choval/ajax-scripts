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
            var prev_query = table.data('query');
            if(prev_query) {
                prev_query.abort();
            }

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
            table.data('query', q);

            if( table.data('template') ) {
                var template = table.data('template');
            } else {
                var template = table.find('template').html();
                table.data('template', template);
            }

            if(template) {
                var template_fields = template.match(/\[\[(.+?)\]\]/g);
                if(!template_fields) {
                    template_fields = [];
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
                        var tmp2 = $.templates(tmp);
                        var tmpout = tmp2.render(row);
                        tbody.append( tmpout );
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

                // Paging
                var paging_template = table.data('paging-template');
                if (!paging_template) {
                    paging_template = table.find('tfoot.paging template').html();
                }
                if (paging_template) {
                    if (!table.data('paging-template')) {
                        table.data('paging-template', paging_template);
                    }
                    var $paging = $.templates(paging_template);
                    var max_page = Math.ceil( response._total / response._limit );
                    var page = response._page;
                    var data = {
                        pages: [],
                        page: response._page,
                        max: max_page,
                    };
                    var mid = (page < 6) ? 0 : Math.round(page / 2);
                    for (var i=1; i<=10; i++) {
                        var p = {
                            page: i+mid,
                            active: false,
                        };
                        if (p.page > max_page) {
                            continue;
                        }
                        if (p.page == page) {
                            p.active = true;
                        }
                        data.pages.push(p);
                    }
                    var paging = $paging.render(data);
                    table.find('tfoot.paging').empty().append(paging);
                }

                table.trigger('table_loaded', response);
            });

            // Fail
            q.on('fail', function(e) {
                loading.hide();
                empty.hide();
                var msg = false;
                if (e.detail.error) {
                    msg = e.detail.error;
                }

                var response = e.detail.req.responseJSON || e.detail.req.responseText;
                if (typeof response.error.message != 'undefined') {
                    msg = response.error.message;
                }

                if (error.find('p').length) {
                    error.find('p').empty().append(msg);
                }
                error.show();
                table.find('[data-ajax-show]').each(function(e, obj) {
                    var $obj = $(obj);
                    $obj.html('-');
                });

                table.trigger('table_failed', response, e.detail.req.status);
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

        var id = $obj.attr('id');
        
        $obj.find('.next-page').off('click');
        $obj.find('.prev-page').off('click');
        $obj.find('.jump-page').off('click');
        $obj.find('.filter').off('keyup change');
        $obj.find('.sort').off('keyup change');
        $obj.find('.match').off('keyup change');
        if(id) {
            $('.match[data-target="#'+id+'"]').off('keyup change');
        }

        $obj.find('.jump-page').on('click', function() {
            var $table = $obj;
            var page = $(this).attr('data-page');
            if (!page) {
                page = $(this).text().trim();
            }
            $table.attr('data-page', page);
            $table.ajaxTable();
        });

        $obj.find('.next-page').on('click', function() {
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

        $obj.find('.prev-page').on('click', function() {
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
        var lastFilter = false;
        $obj.find('.filter').on('keyup change', function(e) {
            var filter = [];
            $obj.find('.filter').each(function(e, obj) {
                var val = $(obj).val().trim();
                filter.push(val);
            });
            filter = JSON.stringify(filter);
            if(lastFilter == filter) {
                return;
            }
            lastFilter = filter;
            clearTimeout($obj.data('keytimer'));
            if(e.keyCode == 13) {
                $obj.ajaxTable();
            } else {
                $obj.data('keytimer', setTimeout(function() {
                    $obj.ajaxTable();
                }, filter_timeout) );
            }
        });
        var lastMatch = false;
        $obj.find('.match').on('keyup change', function(e) {
            var filter = [];
            $obj.find('.match').each(function(e, obj) {
                var val = $(obj).val().trim();
                filter.push(val);
            });
            filter = JSON.stringify(filter);
            if(lastMatch == filter) {
                return;
            }
            lastMatch = filter;
            clearTimeout($obj.data('keytimer'));
            if(e.keyCode == 13) {
                $obj.ajaxTable();
            } else {
                $obj.data('keytimer', setTimeout(function() {
                    $obj.ajaxTable();
                }, filter_timeout) );
            }
        });
        if(id) {
            $('.match[data-target="#'+id+'"]').on('keyup change', function(e) {
                var filter = [];
                $('.match[data-target="#'+id+'"]').each(function(e, obj) {
                    var val = $(obj).val().trim();
                    filter.push(val);
                });
                filter = JSON.stringify(filter);
                if(lastMatch == filter) {
                    return;
                }
                lastMatch = filter;
                clearTimeout($obj.data('keytimer'));
                if(e.keyCode == 13) {
                    $obj.ajaxTable();
                } else {
                    $obj.data('keytimer', setTimeout(function() {
                        $obj.ajaxTable();
                    }, filter_timeout) );
                }
            });
        }

    });

});


