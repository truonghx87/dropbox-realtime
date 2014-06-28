(function(){
	 var socket = io.connect('/');

	 socket.on('show', function(data){
	 	renderTemplate(data);
	 });
	 /**
	 * for debug
	 */
	 socket.on('test', function(data) {
	 	console.log(data)
	 };
	 socket.on('firstShow', function(data){
	 	var clean = $('#imgContent').find('a').remove();
            var
                query = data,
                source = $('#firstShow-tpl').html(),
                compiledTemplate = Handlebars.compile(source),
                result = compiledTemplate(query),
                imgWrap = $('#imgContent');
               // console.log(query);

            imgWrap.html(result);
	 });
	  function renderTemplate(data) {
            var lastAnimate, lastSrc, nextSrc, last,
                current = data.url,
                w = $(document).width();

                var
                    query = data,
                    source = $('#mostRecent-tpl').html(),
                    compiledTemplate = Handlebars.compile(source),
                    result = compiledTemplate(query),
                    imgWrap = $('#imgContent');

                imgWrap.prepend(result);

                noofphoto = $('#imgContent a').size();
                //console.log(noofphoto);

                last = $('#imgContent a:first-child');
                lastSrc = $('#imgContent a:first-child').find('img').attr('src');
                nextSrc = $('#imgContent a:nth-child(2)').find('img').attr('src');

                if( lastSrc === nextSrc ) {
                    last.remove();
                }

                last = $('#imgContent').find(':first-child').removeClass('Hvh');

                if( w >= 900 ) {
                    lastAnimate = $('#imgContent').find(':nth-child(2)').addClass('animated rotateInDownLeft'); /*change here for animation*/
                }
            }
})(this)