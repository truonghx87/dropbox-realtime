(function(){
	 var socket = io.connect('/');

	 
	 /**
	 * for debug
	 */
	/* socket.on('test', function(data) {
	 	console.log(data);
	 });
	 socket.on('webhook_post', function(req) {
	 	console.log(req);
	 });

	 socket.on('delta', function (data){
	 	console.log(data);
	 });*/
    socket.on('mail', function(data) {
        console.log(data);
     });
    var Insta = Insta || {};

    Insta.App = {

        init: function() {
            this.mostRecent();
            this.getData();

            this.attachImgClicked();
        },
        attachImgClicked: function() {
            var self = this,
            context = {};

            $(imgContent).on('click', 'img', function(e){

                e.preventDefault();

                context.url = $(this).attr("src");

                new Dialog(context, socket);
                
            })
        },

        mostRecent: function() {
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
        },

        getData: function() {
            var self = this;
            socket.on('show', function(data){
                self.renderTemplate(data);
            });
        },

        renderTemplate: function(data) {
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
    }

    Insta.App.init();
    
	 
})(this)