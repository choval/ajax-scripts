

class Query {

  constructor(path, data, headers, frequency) {
    this.event_target = new EventTarget;
    this.path = path;
    this.data = data;
    this.headers = headers;
    this.events = {};
    this.frequency = frequency;
    this.response = false;
    this.bgpause = true;

    var par = this;
    if(this.frequency && this.bgpause) {
      $(window).blur(function() {
        par.pause();
      });
      $(window).focus(function() {
        par.resume();
      });
    }
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
    if(!method) {
      method = 'GET';
    }
    if(!data) {
      data = par.data;
    }
    if(data instanceof FormData) {
      var opts = {
        method: method,
        url: par.path,
        headers: par.headers,
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        xhrFields: {
          withCredentials: true
        },
      };
    } else {
      var opts = {
        method: method,
        url: par.path,
        headers: par.headers,
        data: data,
        cache: false,
        xhrFields: {
          withCredentials: true
        },
      };
    }
    $.ajax(opts)
    .done(function(res) {
      var ev = new CustomEvent('done', {
        detail: {
          response: res
        },
        bubbles: false, cancelable: false
      });
      par.last_response = res;
      // par.event_target.dispatchEvent(ev);
      if(par.events['done']) {
        par.events['done'](ev);
      }
      if(typeof feather !== 'undefined') {
        feather.replace();
      }
    })
    .fail(function(e) {
      var ev = new CustomEvent('fail', {
        detail: {
          event: e
        },
        bubbles: false, cancelable: false
      });
      // par.event_target.dispatchEvent(ev);
      if(par.events['fail']) {
        par.events['fail'](ev);
      }
    })
    .always(function(e) {
      var ev = new CustomEvent('end', {
        detail: {
          event: e
        },
        bubbles: false, cancelable: false
      });
      if(par.events['end']) {
        par.events['end'](ev);
      }
    });
  }

}



