

function QueryEventTarget(){
    var target = document.createTextNode(null);
    this.addEventListener = target.addEventListener.bind(target);
    this.removeEventListener = target.removeEventListener.bind(target);
    this.dispatchEvent = target.dispatchEvent.bind(target);
}
QueryEventTarget.prototype = EventTarget.prototype;

class Query {

    constructor(path, data, headers, frequency) {
        this.event_target = new QueryEventTarget;
        this.path = path;
        this.data = data;
        this.headers = headers;
        this.events = {};
        this.frequency = frequency;
        this.response = false;
        this.bgpause = true;

        var par = this;
        $(window).blur(function() {
            if(this.frequency && this.bgpause) {
                par.pause();
                console.log('pausing because of blurring');
            }
        });
        $(window).focus(function() {
            if(this.frequency && this.bgpause) {
                par.resume();
            }
        });
    }

    abort() {
        if(this.ajax &&
            this.ajax.readyState > 0 &&
            this.ajax.readyState != 4) {
            this.ajax.abort();
        }
    }

    stop() {
        if(this.ajax) {
            this.ajax.abort();
        }
        clearInterval( this.timer );
        this.frequency = false;
    }

    keepInBackground( val ) {
        this.bgpause = !(val);
    }

    pause() {
        clearInterval( this.timer );
    }

    resume() {
        clearInterval( this.timer );
        var par = this;
        par.fetch();
        if(par.frequency) {
            par.timer = setInterval(function() { par.fetch(); }, par.frequency );
        }
    }

    on(ev, cb) {
        this.events[ev] = cb;
        // this.event_target.addEventListener(ev, cb, false);
    }

    fetch(method, data) {
        var par = this;
        var opts = {};
        if(!method) {
            method = 'GET';
        }
        if(!data) {
            data = par.data;
        }
        if(data instanceof FormData) {
            opts = {
                method: method,
                url: par.path,
                headers: par.headers,
                async: true,
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                xhrFields: {
                    withCredentials: true
                },
            };
        } else {
            opts = {
                method: method,
                url: par.path,
                headers: par.headers,
                async: true,
                data: data,
                cache: false,
                xhrFields: {
                    withCredentials: true
                },
            };
        }
        this.ajax = $.ajax(opts)
            .done(function(res, status, req) {
                var ev = new CustomEvent('done', {
                    detail: {
                        response: res,
                        status: status,
                        req: req
                    },
                    bubbles: false, cancelable: false
                });
                par.last_response = res;
                // par.event_target.dispatchEvent(ev);
                if(par.events['done']) {
                    par.events['done'](ev, res, status, req);
                }
                if(typeof feather !== 'undefined') {
                    feather.replace();
                }
            })
            .fail(function(req, status, error) {
                var ev = new CustomEvent('fail', {
                    detail: {
                        req: req,
                        status: status,
                        error: error
                    },
                    bubbles: false, cancelable: false
                });
                // par.event_target.dispatchEvent(ev);
                if(par.events['fail']) {
                    par.events['fail'](ev, error, status, req);
                }
            })
            .always(function(var1, var2, var3) {
                var mode = (typeof var3 == 'string') ? "fail": "done";
                var detail = {};
                if(mode == "done") {
                        detail.req = var3;
                        detail.status = var2;
                        detail.response = var1;
                } else {
                        detail.req = var1;
                        detail.status = var2;
                        detail.error = var3;
                }
                var ev = new CustomEvent('end', {
                    detail: detail,
                    bubbles: false, cancelable: false
                });
                if(par.events['end']) {
                    par.events['end'](ev, detail);
                }
            });
        return this.ajax;
    }

}



