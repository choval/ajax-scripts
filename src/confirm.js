$(document).ready(function() {

	// Confirm
	$('body').on('click','.confirm[data-confirm]',function(e) {
		var dataConf = $(this).attr('data-confirm');
		if( typeof dataConf != "undefined" ) {
			var msg = dataConf.replace(/\\n/g,"\n");
		}
		if(confirm(msg)) {
			return true;
		}
		e.stopImmediatePropagation();
		e.preventDefault();
		return false;
	});

});

